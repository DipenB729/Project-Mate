# Project-Mate recommendation implementation and verification

Implemented on `sup` from baseline `79ce7e0`. This extends the existing application with deterministic, explainable recommendations. Scores describe content relevance, not AI predictions or likelihood of project success. No external AI APIs, score persistence, or caching are used.

## Repository integration map

| Input or concern | Actual source and decision |
| --- | --- |
| Backend | `backend/server.js`, Express routers under `backend/routes`; uses `mssql`, not an ORM |
| Frontend | `frontend/src/App.jsx`, React Router; existing student/admin components retained |
| Identity | Existing login JWT contains numeric `id` and `role`; new middleware verifies HS256 and expiry |
| Active student | `Users` joined to `SystemRoles`; `IsActive = 1`, `IsDeleted = 0`, `RoleName = 'Student'` |
| Student skills | `UserSkills(UserId, SkillId)` joined to `Skills(SkillId, SkillName)` |
| Project text/status | `Projects.Title`, `Description`, `IsApproved`, `Status`, `LeaderId`, `CreatedAt` |
| Requirements | Distinct skill names across existing `ProjectRoles.RequiredSkillId`; no duplicate project-skill table |
| Available roles | `ProjectRoles.RoleName` where `IsFilled = 0` |
| Student interests/about/role | New nullable `Users.InterestsText`, `AboutText`, `PreferredRole` |
| Prior activity | `Interests.ApplicantId/ProjectId` and `TeamMembers.UserId/ProjectId` |
| Project/application UI | Existing `BrowseProjects.jsx` modal and `/api/interests/apply` handler reused via query-string deep link |
| Profile UI | Existing `StudentProfile.jsx` skill selection preserved; `RecommendationPreferences.jsx` added |
| Schema management | No original schema/migration tooling exists; a manually applied, repeatable SQL Server script is provided |

The pre-existing `Interests` table represents applications, not academic interests. It is not reused for profile text. Each project role currently references one skill; multiple roles provide multiple project requirements. Skill coverage uses all role requirements, including filled roles; preferred-role matching uses only unfilled roles. This distinction is intentional: skill relevance covers the whole project while role match describes an available opportunity.

## Database change and rollout

Run `backend/migrations/001_recommendation_profile.sql` against the existing database in SSMS before deploying the new API. Confirm `dbo.Users` is the application's existing user table and the three proposed names do not already represent unrelated fields.

| Column on dbo.Users | Type | Existing rows |
| --- | --- | --- |
| InterestsText | NVARCHAR(2000) NULL | NULL until edited |
| AboutText | NVARCHAR(2000) NULL | NULL until edited |
| PreferredRole | NVARCHAR(150) NULL | NULL until edited |

The script uses a transaction, XACT_ABORT, and column-existence checks. It does not delete, rename or backfill any original data. Existing entity relationships stay unchanged: Users → UserSkills → Skills and Projects → ProjectRoles → Skills. No recommendation-score table is added.

For application rollback, revert the feature code and leave the nullable columns in place to preserve preferences. The migration has not been executed here because SQL Server is unavailable. Run it twice on a test copy to verify idempotence and verify original profile/project flows before deploying.

No speculative indexes were added without the database schema or execution plans. The candidate query uses equality lookups on UserSkills.UserId, ProjectRoles.ProjectId, TeamMembers(UserId, ProjectId), and Interests(ApplicantId, ProjectId). Inspect existing indexes and actual plans before adding overlapping indexes.

## Algorithm

`Final = 0.60 × Skill + 0.20 × Text + 0.20 × Role`

Internal components and final scores remain in [0, 1]. The UI percentage is rounded to one decimal place. A zero component retains its weight; weights are never redistributed.

- Skills: trim, collapse whitespace, lowercase for comparison; deduplicate requirements and student skills. Preserve project skill display names in explanations. Skill = matched unique project requirements / all unique project requirements. No requirements gives 0, not 1.
- Role: trim, collapse whitespace, lowercase. Exact preferred-role match against at least one available role gives 1; missing/nonmatching roles give 0. No fuzzy synonyms are assumed.
- Text: combine only academic interests and about text for the student; combine title and description for each project. Names, email, address, messages, IDs and other metadata are excluded.
- Tokenization: lowercase Unicode letters/numbers, punctuation treated as separators, whitespace normalized. No stop-word removal, stemming or lemmatization. For example `React.js` becomes text tokens `react`, `js`, while skill matching still compares the whole skill name.
- Corpus: one student document plus **all eligible candidate project documents**, before selecting Top 10. Sparse vectors share the same vocabulary and IDF values.
- TF = term occurrences / document token count. IDF = `ln((1 + corpus document count) / (1 + document frequency)) + 1`.
- Text = cosine similarity of TF-IDF vectors. Empty/zero vectors give 0; defensive clamping prevents non-finite or out-of-range results.

Candidate rules run before TF-IDF: approved, status exactly `Open`, at least one unfilled role, not owned by the student, not already joined, and no prior application by this student to this project. All prior application statuses exclude the project, matching Browse Projects' project-level “Interest Sent” behavior. This does not introduce new application statuses or change application policy elsewhere.

Ranking: final score descending, creation timestamp descending, numeric project ID ascending. Deduplicate by project ID; return at most 10. Partially completed profiles still receive scored matches plus missing-field guidance. Completely empty profiles receive an empty list and guidance. Zero-scoring eligible projects may appear if fewer relevant projects are available.

## API

All three endpoints require `Authorization: Bearer <existing login token>`. IDs come from the verified token, never the query string/body. Database account checks also reject suspended/deleted/non-student accounts. Existing auth/login strategy is unchanged.

| Method and path | Behavior |
| --- | --- |
| GET /api/recommendations | Top 10, component scores, matched/missing skills, role match, profile completeness |
| GET /api/recommendations/profile | Only the current student's recommendation preferences and skill names |
| PUT /api/recommendations/profile | Save `interestsText`, `aboutText`, `preferredRole`; all three string fields required; empty strings clear values |

Example response shape:

```json
{
  "recommendations": [{
    "projectId": 14,
    "projectName": "Web management",
    "description": "web-based management application",
    "finalScore": 0.6308786369,
    "matchPercentage": 63.1,
    "skillScore": 0.6666666667,
    "textScore": 0.1543931845,
    "roleScore": 1,
    "scores": { "skill": 0.6666666667, "text": 0.1543931845, "role": 1 },
    "matchedSkills": ["React.js", "Node.js"],
    "missingSkills": ["SQL Server"],
    "roleMatched": true,
    "matchedRole": "Frontend Developer",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }],
  "profileStatus": { "missingFields": [], "incomplete": false, "insufficient": false }
}
```

Responses: 401 missing/invalid/expired JWT, 403 not an active student, 400 invalid preference values, 503 unavailable database/configuration. Operational errors return a generic message rather than connection details. A query such as `?userId=999` never changes the authenticated identity.

One SQL batch loads the profile and skills; another loads eligible projects and all their role/skill relationships. Grouping uses a Map, avoiding N+1 queries and per-project database round trips. SQL inputs are parameterized. Scores are computed on every request, so preference, skills, application, project, and role changes take effect on the next request.

## UI and existing flow

`/recommended-projects` uses the existing Student route guard and navbar. Cards show up to 10 results, descriptions, percentages, matched/missing skills, role availability and expandable component breakdowns. Loading, retryable error, empty-candidate and incomplete-profile states are present. Responsive CSS uses wrapping controls and an adaptive grid.

“View project and apply” opens `/browse-projects?projectId=...`, which loads the existing detail modal. Applications still go through the original handler and endpoint. Technical Profile keeps its existing skill-save action; the preferences form has a separate save button and never overwrites fields after a failed initial load.

No recommendation math runs in React. The new API client sends the stored JWT. Legacy API clients and authorization gaps were not rewritten as part of this feature.

## Verification and reproducible fixture

Student A: React.js, Node.js, Python; interests `web development frontend database applications`; preferred role `Frontend Developer`. All fixture projects are eligible with another leader and the same creation date.

| Project | Title; description | Required skills | Available role | Skill | Text | Role | Final | UI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | Web management; web-based management application | React.js, Node.js, SQL Server | Frontend Developer | 2/3 | 0.1543931845 | 1 | 0.6308786369 | 63.1% |
| B | Biology; genetics | R | Researcher | 0 | 0 | 0 | 0 | 0% |
| C | Web database; web development | Python, SQL Server | Analyst | 1/2 | 0.6354919592 | 0 | 0.4270983918 | 42.7% |

Hand calculation: A = `.6 × (2/3) + .2 × .1543931845 + .2 × 1 = .6308786369`. C = `.6 × .5 + .2 × .6354919592 = .4270983918`. Order is A, C, B. Text values depend on this shared corpus; adding eligible projects can change IDF and scores.

Validation performed with Node 24.19.0:

- **16 backend tests pass**: pure scoring edge cases, shared-corpus hand calculation, candidate policy, ties/Top 10, profile updates; real Express HTTP/JWT tests with an injected repository; batch SQL mapping and parameter binding with a simulated SQL client.
- **9 frontend tests pass** across three suites: login/route regression, JWT API client, loading/error/empty/incomplete/Top 10 states, preference saving, and recommendation → existing detail modal → existing interest endpoint.
- **Production build passes** with the same three pre-existing lint warnings: ManageProjects hook dependency, unused Navbar initials, unused BrowseProjects isOwnProject.
- The stale default “Learn React” test was replaced with actual login/route tests. CRA Jest 27 module mappings for Router 7 and Axios plus TextEncoder/TextDecoder setup allow the installed dependencies to run under tests.
- No standalone lint/typecheck commands exist. The build performs ESLint checks. No original backend test suite existed.

The API tests use real HTTP and signed test JWTs, but database responses are controlled fixtures. SQL syntax, actual SQL schema compatibility, database timing, live multi-user workflows and a full browser-driven end-to-end run remain unverified. These are not represented as passing tests.

### Performance evidence

`npm run benchmark --prefix backend`, ten measured runs after warm-up, synthetic academic projects with approximately 100-word descriptions:

| Eligible candidates | Median scoring time | Maximum scoring time |
| --- | --- | --- |
| 100 | 3.72 ms | 6.04 ms |
| 1,000 | 35.65 ms | 49.21 ms |
| 5,000 | 142.83 ms | 242.01 ms |

These measure **in-memory scoring only**, not request latency, SQL or network time. No caching is justified by this measurement. Large corpora consume memory and CPU; benchmark the complete request against the deployed database before claiming production latency.

## Phase completion ledger

| Phase | Deliverable | Verification / limit |
| --- | --- | --- |
| 0 | Actual repository integration map above | No original schema or auth middleware existed |
| 1 | Nullable profile migration and profile read/save | Validation and parameterized mapping tested; migration execution pending SQL Server |
| 2 | Pure skill and role scoring | Full/partial/empty/duplicate/normalization tests pass |
| 3 | Shared-corpus TF-IDF and cosine | Manual IDF/cosine and empty-text tests pass |
| 4 | Weighted ranking and candidate rules | A/B/C fixture, ties, deduplication and Top 10 pass |
| 5 | Authenticated API | Real HTTP tests pass with controlled repository |
| 6 | React cards, preferences, existing flow deep link | Component and application-flow tests pass; build passes |
| 7 | Automated verification and this document | Live database/browser end-to-end acceptance remains pending |
| 8 | Batching, benchmark, API/schema documentation | Scoring measured; SQL plans/full request timing unavailable |

## Files changed

New backend files: `middleware/recommendationAuth.js`, `migrations/001_recommendation_profile.sql`, `routes/recommendations.js`, `services/recommendationRepository.js`, `services/recommendationScoring.js`, `tests/recommendationScoring.test.js`, `tests/recommendationsApi.test.js`, `tests/recommendationRepository.test.js`, `tests/recommendation.benchmark.js`.

Updated backend files: `server.js` registers the new router; `package.json` adds start/test/benchmark scripts.

New frontend files: `src/api/recommendations.js`, `src/api/recommendations.test.js`, `src/components/Student/RecommendedProjects.jsx`, `RecommendationPreferences.jsx`, `RecommendedProjects.test.jsx`, and `src/styles/Recommendations.css`.

Updated frontend files: `src/App.jsx`, `src/components/Navbar.jsx`, `src/components/Student/StudentProfile.jsx`, `src/components/Student/BrowseProjects.jsx`, `src/App.test.js`, `src/setupTests.js`, `package.json`.

Documentation: root `README.md` and this file. No dependency upgrades or generated build files are committed.

## Remaining risks and next live checks

The original repository hardcodes SQL credentials, tracks `.env` and backend `node_modules`, lacks original schema/setup scripts, and has unprotected legacy user/admin/application APIs. Those original routes still need their own authorization and ownership work before production exposure. This feature secures its own endpoints; it does not claim to secure the whole application.

Once a test database is available: apply/reapply the migration, log in with two students and an admin, save skills/preferences, verify scores, apply via a recommendation, verify exclusion on refresh, accept an application, fill a role, suspend a student, and confirm recommendations update and suspended access is rejected. Check mobile/desktop layouts in a browser. Record actual SQL plans and complete request latency. Existing application/connection transaction and concurrency risks remain outside this recommendation change.
