# Berun — Running log & training plan

Personal running training app with science-based plan generation, manual logging, and progress tracking.

## Stack

- Next.js 16 (App Router)
- Auth.js v5 + Google
- Prisma 6 + Supabase Postgres
- shadcn-style UI + Tailwind CSS v4
- TanStack Query / Form + Zod
- NiceModal
- next-intl (TH/EN)

## Setup

1. Copy `.env.example` to `.env.local` and fill values:

```bash
DATABASE_URL=postgresql://...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Install & generate:

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
```

3. Run dev server:

```bash
pnpm dev
```

Open [http://localhost:3000/th](http://localhost:3000/th)

## Scripts

- `pnpm dev` — development
- `pnpm build` — production build
- `pnpm test` — PlanEngine unit tests
- `pnpm db:seed` — seed 12-week demo data (via Prisma Client only)

## Architecture

- **PlanEngine** (`src/lib/engine/plan-engine.ts`) — pure functions for progression, pain gate, detraining, EWMA ACWR
- **Server actions** (`src/lib/actions/training.ts`) — CRUD with userId scoping
- **14 tables** — uuid v7 PKs, see `prisma/schema.prisma`

## Notes

- ACWR is advisory only (not auto-cut)
- Primary load unit: minutes + sRPE
- Mobile-first UI with 4 tabs + FAB log button
