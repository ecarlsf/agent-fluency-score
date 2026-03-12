# ORM Benchmark Starter App

Baseline Next.js application used for the **ORM** benchmark category. Each ORM tool benchmark starts from a clean copy of this app.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (connection via `DATABASE_URL` in `.env`)
- **UI:** Tailwind CSS + shadcn/ui
- **Data layer:** Mock data in `src/lib/mock-data.ts` (no ORM installed)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Organization stats overview |
| `/projects` | Project list |
| `/projects/[id]` | Project detail with task list |

## API Routes

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard` | Dashboard stats |
| `GET /api/projects` | List projects |
| `GET /api/projects/[id]/tasks` | List tasks for a project |

## Data Model

Defined in `src/lib/mock-data.ts`:

- **Organization** — id, name, slug
- **User** — id, name, email, role, organizationId
- **Project** — id, name, description, organizationId
- **Task** — id, title, description, status, priority, projectId, assigneeId

## Setup

```bash
npm install
cp .env.example .env   # Set DATABASE_URL
npm run dev
```

## How It's Used

The benchmark CLI copies this directory into `runs/orm/<tool>/`, initializes git, and asks the agent to replace the mock data layer with a real ORM. The agent must install the ORM, define schemas matching the existing data model, and wire up all pages and API routes to use the database.
