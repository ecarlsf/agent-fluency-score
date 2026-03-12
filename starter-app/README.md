# Auth Benchmark Starter App

Baseline Next.js application used for the **auth** benchmark category. Each auth tool benchmark starts from a clean copy of this app.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL via Prisma
- **UI:** Tailwind CSS + shadcn/ui

## Routes

| Route | Description |
|-------|-------------|
| `/` | Public landing page |
| `/dashboard` | Lists posts (unprotected) |
| `/settings` | User preferences (unprotected) |

## Data Model

Defined in `prisma/schema.prisma`:

- **User** — id, name, email
- **Post** — id, title, content, published, authorId

Seed data is loaded via `prisma/seed.js`.

## Setup

```bash
npm install
cp .env.example .env   # Set DATABASE_URL
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## How It's Used

The benchmark CLI copies this directory into `runs/auth/<tool>/`, initializes git, and then asks the agent to integrate an auth tool into this existing codebase. The agent must add authentication without breaking the existing routes and functionality.
