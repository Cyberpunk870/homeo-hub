# Deployment Guide

## Recommended Setup

This repo is already configured best for a Node host such as Railway.

- App runtime: Astro standalone Node server
- Database: PostgreSQL
- Custom domain: connect through the hosting provider after first deploy

## Required Environment Variables

Set these in your hosting provider:

```bash
PUBLIC_DATA_BACKEND=postgres
DATABASE_URL=postgresql://...
DOCTOR_EMAIL=doctor@example.com
DOCTOR_PASSWORD=change-this-password
DOCTOR_NAME=Dr. Upadhyaya
SESSION_SECRET=replace-with-a-long-random-secret
PUBLIC_APP_NAME=Homeo Hub
```

Notes:

- `PUBLIC_DATA_BACKEND` should be `postgres` for client-facing hosting.
- `SESSION_SECRET` should be a long random value.
- `DOCTOR_PASSWORD` should be changed before sharing with the client.

## Railway Deployment

1. Push this repo to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Add a PostgreSQL service in the same Railway project.
4. In the app service, set the environment variables listed above.
5. Set `DATABASE_URL` to the PostgreSQL connection string from Railway.
6. Deploy.

The repo already contains:

- `railway.json`
- `nixpacks.toml`
- health check route at `/api/health`

Railway should automatically use:

- build command: `npm run build`
- start command: `npm run start`

## Custom Domain

After the app is deployed and working on the Railway-generated URL:

1. Buy the domain from any registrar.
2. Open the app service in Railway.
3. Go to the domain/custom domain section.
4. Add your domain, for example `app.yourdomain.com`.
5. Railway will show the DNS record you need to create.
6. Add that DNS record at your domain registrar.
7. Wait for DNS propagation.
8. Re-test login, inventory, reports, and backup/export on the live domain.

If you want the root domain instead of a subdomain, Railway may ask for additional DNS records depending on the registrar.

## Pre-Launch Checklist

- `npm run build`
- `npm run test:run`
- `npm run check`
- Verify `/api/health` returns `ok: true`
- Confirm PostgreSQL tables initialize correctly
- Confirm doctor login works
- Confirm backup export/import works
- Confirm HTTPS is active on the final domain

## What To Share With The Client

Once deployed, share:

- the live app URL
- doctor login email
- temporary password
- basic usage notes

Do not share:

- `DATABASE_URL`
- `SESSION_SECRET`
- Railway project access unless intended

## Fallback Hosting

If you do not want Railway, any Node host that supports:

- Node 20
- environment variables
- PostgreSQL access
- persistent public HTTPS URL

will work with the same build/start flow.
