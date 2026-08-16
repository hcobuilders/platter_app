# Platter — Step 3 prototype

Next.js 16 (App Router) + Prisma 7 against Postgres. Live at [platter.studio](https://platter.studio), deployed on Railway.

See `../platter_app/docs/DECISION_LOG.md` (session S16/S17) for the full build history and `../platter_app/docs/STEP1_PLAN.md` for the data model this schema implements.

## Local development

You need a local Postgres instance:

```bash
# Point at your local Postgres
cp .env.example .env   # edit DATABASE_URL

npm install
npm run db:migrate      # applies prisma/migrations/
npm run db:seed         # seeds West Henry Logistics (26-085)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | `prisma generate && next build` |
| `npm run db:migrate` | `prisma migrate dev` — creates/applies migrations locally |
| `npm run db:deploy` | `prisma migrate deploy` — applies existing migrations, no diffing (what Railway's `release` script runs) |
| `npm run db:seed` | Seeds the West Henry Logistics example project. **Not idempotent** for transactional rows (subs, bids, budget lines, lifecycle scenarios use plain `.create()`) — don't run twice against the same database. |
| `npm run db:studio` | Prisma Studio, a GUI for browsing the database |

## Deployment (Railway)

Two services in the `Platter` Railway project: `Postgres` (managed template) and `app` (this repo, `rootDirectory=/app`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`). The `app` service's `preDeployCommand` runs `npm run release` (currently `prisma migrate deploy`) before every deploy — pushing to `claude/project-setup-model-selection-ecsxrt` auto-deploys.

**Note:** Railway's `preDeployCommand` is not shell-interpreted — a bare `"a && b"` string (even wrapped in `sh -c`) silently runs only the first command. Route anything multi-step through an `npm run` script instead, since `npm run` always executes through a real shell regardless of how the caller invokes it.

## What's real vs. stubbed

- **Real, verified against Postgres:** dashboard, project overview, scope worksheet, Bid Tab (including gap/plug and sub-added disposition), Budget (including revisions), ITB invite flow, Planroom (magic-link, real quote submission), Settings CRUD for Flags/Trades/Tags.
- **Stubbed, by owner decision:** AI document parsing (would need an LLM API key), email sending (would need Microsoft Graph/Azure AD credentials).
- **Not built:** Package templates, Appearance/Profile/Connected-accounts settings, any auth gate on the internal side (matches D-09 — 3 users, no RBAC — but means no login exists yet).
