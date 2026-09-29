# Workflow fixes and deployment

## Changes

Legacy private APIs now verify JWT signatures and look up the active user and current role in SQL Server. Route identity checks prevent reading or updating another account, admin routes require the database Admin role, and multipart profile updates enforce the authenticated identity. Frontend requests send the session token through a shared client. REACT_APP_API_URL configures the API origin.

Application creation validates the project/role relationship, approval, open status, membership and duplicate applications within a serializable transaction. Responses load applicant/project/role values from SQL, enforce project leadership and Pending state, prevent duplicate membership, fill the role and create notifications/connections in one transaction. Failure rolls back. SQL interpolation of applicantId is removed.

Connection responses only update pending requests belonging to the current receiver. Direct connection is limited to applicants for a project led by the current user. Notifications are scoped to their recipient. Message counts are implemented and navbar badge requests fail independently.

Project reapproval sets Status to Open. The admin dashboard reads real counts. List reads reject HTTP errors and malformed data. Browse, Create and My Projects display load failures without crashing. CI runs tests and a production build.

## Database setup

An existing ProjectMate schema is required. The repository still lacks an authoritative initial schema; do not use the profile migration to create a new database. Export the existing database schema if a clean installation is needed.

1. Copy backend/.env.example to backend/.env and supply the real database connection and JWT secret. Keep these values private. DB_SERVER must be resolvable from the machine running the backend. For a local development SQL instance using a self-signed certificate, explicitly set DB_ENCRYPT=false and DB_TRUST_SERVER_CERTIFICATE=true if required.
2. From the repository root run `npm run migrate --prefix backend`.
3. The runner applies the repeatable SQL migration and verifies all three Users profile columns. A connection failure exits nonzero without reporting success.
4. Build the frontend with REACT_APP_API_URL set to the deployed backend /api URL, then restart the backend.

Previously tracked backend/.env is removed from Git and ignored. Existing credentials remain in Git history: rotate the database password and JWT secret through the actual database/deployment administration. This change cannot rotate credentials on an inaccessible server.

## Verification and remaining limitation

24 backend tests and 12 frontend tests pass locally. Regression coverage includes unauthorized requests, current database roles, private identities, message counts, project reapproval, application ownership, stored IDs, repeated acceptance, rollback, connection ownership and the three HTTP-500 screen failures. Database behavior is simulated in API tests; these are not live SQL integration tests.

Migration attempt on 2026-09-29 failed with EAI_AGAIN resolving configured DESKTOP-PH3ATFE:1433. No database changes were made. Apply the migration on a machine that can reach that SQL Server, then verify registration/login, profile and skills, project creation/approval/reapproval, concurrent applications and acceptance, notifications, connections, messaging, uploads and recommendations against the real database. Full live verification remains pending.
