# Kalo Farm System

A custom farm management system for Kalo Farm PLC (Holeta, Oromia, Ethiopia),
built to replace Farmbrite with a system Kalo Farms owns outright.

Covers: Dashboard, Livestock (Animals, Livestock Groups, Grazing), Plantings,
Resources (Equipment, Warehouses, Inventory + feed Recipes), Accounting
(Categories, Transactions, P&L, Cash Flow, Balance Sheet, Budgeting), Market
(Products, Orders), Contacts, Climate, and Reports.

Not included (by request): Tasks/Schedule, Farm Map.

## Stack

- Next.js 16 (App Router, Server Actions)
- PostgreSQL via Drizzle ORM (no native binaries — plain `pg` driver)
- Cookie-based session auth (bcrypt + signed JWT), no third-party auth service
- Recharts for charts
- Deployed on Railway

## Local development

1. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (a local or
   remote Postgres instance) and `SESSION_SECRET`.
2. Install dependencies: `npm install`
3. Create the database schema: `npm run db:migrate` (or `npm run db:push` for
   a quick dev sync without migration files)
4. Seed starting data (farm settings, users, accounting categories, inventory
   items and livestock records mirroring Kalo Farms' real Farmbrite account):
   `npm run db:seed`
5. Run the dev server: `npm run dev`
6. Sign in with one of the seeded users (see `scripts/seed.ts` for emails —
   temporary password is `ChangeMe123!` for all of them; change these
   immediately after first login, ideally by rotating them in the database
   directly since there is no self-service "change password" screen yet).

## Database

Schema lives in `src/db/schema/*.ts` (one file per module). After changing a
schema file, run `npm run db:generate` to create a new SQL migration in
`drizzle/`, then `npm run db:migrate` to apply it.

## Deployment (Railway)

A Railway project named "Kalo Farm System" already exists with:

- A `Postgres` service (postgres:16-alpine, persistent volume attached)
- A `web` service, pre-configured with `DATABASE_URL`, `SESSION_SECRET`,
  `NODE_ENV=production`, a start command (`npm run start -- -p ${PORT:-3000}`)
  and a pre-deploy command (`npm run db:migrate`) — but with **no source
  attached yet**, because deploying from here requires either a GitHub repo
  connected to Railway, or a Docker image pushed to a registry. Push this
  code to a GitHub repository, then connect that repo to the `web` service
  in the Railway dashboard (or ask Claude to do it via the Railway MCP tools
  once the repo exists).
- A reserved domain: `web-production-f47a4.up.railway.app` (will resolve
  once the service has a real deployment).

Run `npm run db:seed` once against the production database after the first
successful deploy (e.g. via `railway run npm run db:seed` from the Railway
CLI, or temporarily from this environment) to load starting data.

## Notes on the accounting & balance sheet modules

This is cash-basis, single-entry farm bookkeeping (matching how Farmbrite's
accounting module works for a farm like this), not full double-entry
accounting. The Balance Sheet page derives Assets from cumulative cash
position + inventory value + equipment purchase price, and Liabilities from
transactions tagged to categories whose name contains "loan", "payable" or
"borrow" — a reasonable approximation, not a substitute for a real
accountant's books.
