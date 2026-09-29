# Project-Mate

React frontend, Express backend, and an existing Microsoft SQL Server `ProjectMate` database.

## Recommendation feature setup

1. Use Node.js 24 (the version used for verification) and npm.
2. Restore/configure your existing ProjectMate database. The repository does not contain the original schema or database backup.
3. Run `backend/migrations/001_recommendation_profile.sql` against that database in SSMS before using recommendations. It adds three nullable profile fields and preserves existing data.
4. Configure the existing `backend/config/db.js` connection and `JWT_SECRET` in your backend environment. Use a new, private secret; do not publish credentials.
5. Start the backend:
   ```sh
   cd backend
   npm ci
   npm start
   ```
6. Start the frontend in another terminal:
   ```sh
   cd frontend
   npm ci
   npm start
   ```
7. Log in as a Student. Save skills and recommendation preferences on **Technical Profile**, then open **Recommended** in the navigation.

The new recommendation API client accepts `REACT_APP_API_URL` (default `http://localhost:5000/api`). Legacy API calls still use localhost; this is not a complete deployment configuration change.

## Verification

```sh
npm test --prefix backend
npm run benchmark --prefix backend
CI=true npm test --prefix frontend -- --watchAll=false --runInBand
npm run build --prefix frontend
```

See [recommendation implementation and verification](docs/recommendations.md) for the exact algorithm, endpoints, candidate policy, database changes, test evidence, and remaining checks.
