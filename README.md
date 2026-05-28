# Homeo Hub

Hosted clinic operations software for a homeopathy practice with two clinics: Delhi and Noida. The app covers inventory, stock movements, alerts, patients, prescriptions, reports, doctor-only authentication, and JSON backup/restore.

For production deployment and custom domain setup, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Product status

- Shared PostgreSQL backend for hosted use
- Doctor-only session authentication
- Clinic-aware patient, prescription, stock, alert, and reporting flows
- Backup export and restore from the reports screen
- Production Node build via Astro standalone server

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

## Required environment variables

```bash
PUBLIC_DATA_BACKEND=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/homeo_hub
DOCTOR_EMAIL=doctor@example.com
DOCTOR_PASSWORD=change-this-password
DOCTOR_NAME=Dr. Upadhyaya
SESSION_SECRET=replace-with-a-long-random-secret
PUBLIC_APP_NAME=Homeo Hub
```

`PUBLIC_DATA_BACKEND=local` is still available for quick demo mode, but hosted deployment should use `postgres`.

## Scripts

- `npm run dev` starts the development server
- `npm run check` runs Astro type checks
- `npm run test:run` runs the Vitest suite
- `npm run build` creates the production bundle
- `npm run start` runs the built Node server from `dist/`

## Hosting flow

1. Provision PostgreSQL
2. Set the environment variables above
3. Build the app:
   ```bash
   npm run build
   ```
4. Start the server:
   ```bash
   npm run start
   ```

The database schema is created automatically on first boot and seeded with starter clinic data if the tables are empty.

For Railway, the repo includes `railway.json`, `nixpacks.toml`, and a health endpoint at `/api/health`.

## Backups

- Export: `GET /api/data/export`
- Import: `POST /api/data/import`
- Both routes require a valid doctor session
- The same actions are available from the reports screen when running in Postgres mode

## Verification

Run these before production release:

- `npm run check`
- `npm run test:run`
- `npm run build`
