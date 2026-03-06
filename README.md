# Agent Fluency Score

Measuring how well frameworks, libraries, and tools work with AI coding agents.

Not "how good is the agent" — but "how agent-friendly is the tool."

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

## Setup

```bash
cd cli
npm install
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

### Run a benchmark

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
- `--force` — Replace existing tool directory (preserves `.env`)
- `--agent-version <version>` — Agent version to record in results (default: `latest`)

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

1. Configure prerequisites (see below)
2. Run `auto-run` — the system handles everything:
   - Copies starter app and initializes git
   - Sends task prompts to the agent via `claude -p`
   - Runs `npm run build` to verify compilation
   - Runs Playwright E2E tests to verify functionality
   - On failure: forwards errors to the agent (up to 10 correction cycles)
   - Commits results after each task
   - Generates final scorecard

### Prerequisites for automated mode

- **Auth provider** configured in test/development mode (no email verification required)
- **API keys** in `runs/<category>/<tool>/.env` (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- **PostgreSQL** running and accessible (connection string in `.env`)
- **Claude Code CLI** installed and authenticated
- **Playwright browsers** installed: `cd cli && npx playwright install chromium`

## Current Status

- [x] Protocol designed (v0.1)
- [x] Directory structure created
- [x] CLI built (interactive + automated modes)
- [x] Starter app built
- [x] Playwright E2E verification tests
- [ ] Auth benchmark: Clerk
- [ ] Auth benchmark: Propel Auth
- [ ] Results published
