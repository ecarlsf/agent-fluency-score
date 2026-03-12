# Agent Fluency Score

Measuring how well frameworks, libraries, and tools work with AI coding agents.

Not "how good is the agent" — but "how agent-friendly is the tool."

## Prerequisites

- **Node.js** v18+ (with npm)
- **PostgreSQL** running locally (default user: `postgres`, override with `PGUSER` env var)
- **Claude Code CLI** installed and authenticated (`claude --version` should work)
- **Playwright browsers**: installed via `npx playwright install chromium` inside `cli/`

## Quick Start

```bash
# 1. Clone and install CLI dependencies
git clone <repo-url> && cd agent-fluency-score
cd cli
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Create databases for each tool you plan to benchmark
createdb -U postgres afs_auth_clerk
createdb -U postgres afs_auth_propel_auth

# 4. Configure environment for each tool
#    Copy the example and fill in your provider's API keys:
cp ../starter-app/.env.example ../runs/auth/clerk/.env
#    Edit the .env with your Clerk keys, database URL, etc.
#    See "Auth Provider Configuration" below.

# 5. Close all other Claude Code sessions (important for reliable results!)

# 6. Run an automated benchmark
npx tsx src/index.ts auto-run -c auth -t clerk --force
```

## Structure

```
agent-fluency-score/
├── BENCHMARK_PROTOCOL.md   ← Test methodology and rules
├── README.md               ← You are here
├── cli/                    ← Benchmark runner CLI
│   ├── src/
│   │   ├── index.ts        ← Entry point (setup, run, auto-run, scorecard, list)
│   │   ├── runner.ts       ← Interactive benchmark runner
│   │   ├── orchestrator.ts ← Automated benchmark runner (agent driver + orchestrator)
│   │   ├── scorecard.ts    ← Scorecard generation
│   │   ├── types.ts        ← Type definitions
│   │   └── tasks/          ← Task definitions per category
│   │       ├── index.ts
│   │       └── auth.ts
│   ├── tests/              ← Playwright E2E verification tests
│   │   ├── playwright.config.ts
│   │   ├── helpers/        ← Auth flow helpers (per-tool selectors)
│   │   └── auth/           ← Tier 1-5 test specs
│   ├── package.json
│   └── tsconfig.json
├── starter-app/            ← Baseline Next.js app (frozen before each run)
└── runs/
    └── auth/
        ├── clerk/          ← Benchmark run for Clerk
        └── propel-auth/    ← Benchmark run for Propel Auth
```

## Usage

### List available benchmarks

```bash
npx tsx src/index.ts list
```

### Set up a tool for benchmarking

Copies the starter app into the tool's run directory and initializes git.

```bash
npx tsx src/index.ts setup -c auth -t clerk
```

### Run a benchmark interactively

Walks you through each task interactively — displays prompts, records metrics, auto-commits.

```bash
npx tsx src/index.ts run -c auth -t clerk
```

### Generate scorecard

Creates a comparison scorecard from all completed runs in a category.

```bash
npx tsx src/index.ts scorecard -c auth
```

### Run automated benchmark (zero human intervention)

Drives the agent programmatically, verifies results with Playwright E2E tests, handles error correction loops, and produces a scorecard automatically.

```bash
npx tsx src/index.ts auto-run -c auth -t clerk --force
```

Options:
- `--force` — Replace existing tool directory (preserves `.env` and archived run logs)
- `--agent-version <version>` — Agent version to record in results (default: `latest`)

### Backfill metrics from existing cycle logs

```bash
npx tsx src/index.ts backfill -c auth
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PGUSER` | `postgres` | PostgreSQL user for database create/drop operations |
| `BENCHMARK_PORT` | `3000` | Port for the Next.js dev server during tests |

## Auth Provider Configuration

Each auth provider requires specific API keys in the tool's `.env` file (`runs/auth/<tool>/.env`). The `.env` file is not tracked in git — create it from the starter app example:

```bash
cp starter-app/.env.example runs/auth/<tool>/.env
```

Then add your provider-specific keys. Refer to each provider's documentation for how to obtain test/development API keys:

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — [Clerk docs](https://clerk.com/docs)
- **Propel Auth**: `NEXT_PUBLIC_PROPELAUTH_AUTH_URL`, `PROPELAUTH_API_KEY`, `PROPELAUTH_VERIFIER_KEY` — [PropelAuth docs](https://docs.propelauth.com)
- **Auth0**: `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` — [Auth0 docs](https://auth0.com/docs)
- **Supabase Auth**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — [Supabase docs](https://supabase.com/docs)

All providers should be configured in test/development mode with no email verification required.

## How It Works

### Interactive mode

1. Build the starter app in `starter-app/`
2. Run `setup` for each tool you want to benchmark
3. Open a **fresh Claude Code session** per tool
4. Run the benchmark CLI — it gives you the exact prompt to paste
5. Follow the protocol: paste prompt → error forwarding only → 10-cycle cap
6. Record results when prompted — the CLI handles git commits and logging
7. After both runs, generate the scorecard

### Automated mode

1. Configure prerequisites (see above)
2. **Close all other Claude Code sessions** — concurrent sessions cause API contention that corrupts measurements
3. Ensure port 3000 (or `BENCHMARK_PORT`) is free
4. Run `auto-run` — the system handles everything:
   - Copies starter app and initializes git
   - Resets the tool-specific database
   - Sends task prompts to the agent via `claude -p`
   - Runs `npm run build` to verify compilation
   - Runs Playwright E2E tests to verify functionality
   - On failure: forwards errors to the agent (up to 10 correction cycles)
   - Commits results after each task
   - Generates final scorecard

## Current Status

- [x] Protocol designed (v0.1)
- [x] Directory structure created
- [x] CLI built (interactive + automated modes)
- [x] Starter app built
- [x] Playwright E2E verification tests
- [ ] Auth benchmark: Clerk
- [ ] Auth benchmark: Propel Auth
- [ ] Results published
