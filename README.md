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
# Copy connection strings from Supabase → Project Settings → Database → Connect
# Special characters in the password must be URL-encoded (@ → %40, # → %23, etc.)

# Transaction pooler (Prisma queries at runtime)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct or session pooler (Prisma db push / migrations)
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Prisma CLI reads `.env.local` via `dotenv-cli` in `pnpm db:*` scripts. Next.js also loads `.env.local` automatically.

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

Open [http://localhost:3000](http://localhost:3000)

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
