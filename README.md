# Agent Fluency Score

Not "how good is the agent" — **how agent-friendly is the tool.**

When a coding agent integrates a library, some tools work on the first try. Others burn through correction cycles, racking up cost and time. This benchmark measures that friction across 8 tools in two categories — authentication and ORMs — using zero-coaching prompts, automated E2E verification, and multiple independent runs.

## Results

| Tool | Category | Runs | First-Attempt Rate | Avg Cycles | Avg Cost | Avg Time | Band |
|------|----------|:----:|:------------------:|:----------:|:--------:|:--------:|:----:|
| Clerk | Auth | 3 | 80% (4.0/5) | 0.60 | $4.51 | 11m | **Fluent** |
| Auth0 | Auth | 3 | 67% (3.3/5) | 0.47 | $6.84 | 16m | Functional |
| NextAuth | Auth | 1 | 60% (3.0/5) | 0.80 | $7.03 | 13m | Functional |
| PropelAuth | Auth | 3 | 47% (2.3/5) | 0.80 | $10.96 | 21m | Friction |
| Drizzle | ORM | 3 | 80% (4.0/5) | 0.20 | $8.22 | 16m | **Fluent** |
| Kysely | ORM | 3 | 67% (3.3/5) | 0.27 | $7.74 | 16m | Functional |
| Prisma | ORM | 3 | 67% (3.3/5) | 0.33 | $7.33 | 15m | Functional |
| TypeORM | ORM | 2 | 50% (2.5/5) | 0.50 | $14.91 | 33m | Friction |

**Bands:** Fluent = 80%+ first-attempt, 0–1 avg cycles · Functional = 50%+, 1–3 cycles · Friction = <50%, 3–7 cycles

**Agent under test:** Claude Code (Claude Opus 4.6, high effort)

**Key finding:** The best and worst tools in each category differ by 2–3x in cost and time. Clerk and Drizzle completed most tasks on the first attempt. PropelAuth and TypeORM required more correction cycles and cost significantly more to reach the same outcomes.

Full per-tool breakdowns with efficiency metrics, code changes, and cognitive profiles: [Auth Scorecard](runs/auth/SCORECARD.md) · [ORM Scorecard](runs/orm/SCORECARD.md) · [Aggregate Data](runs/AGGREGATE.md)

## What This Measures

Traditional benchmarks test the agent. This tests the **tool** — the framework, library, or SDK the agent is asked to integrate.

The score answers one question: **If I pick this tool, how much friction should I expect when working with a coding agent?**

A tool scores well when:
- The agent's training data includes accurate, up-to-date usage patterns
- Error messages are clear enough for the agent to self-correct
- The API surface is consistent and predictable
- Configuration is conventional, not bespoke

A tool scores poorly when:
- The agent hallucinates APIs that don't exist (or existed in older versions)
- Error messages are opaque, sending the agent in circles
- Setup requires provider-specific steps the agent can't infer

## Methodology

Each tool is tested through 5 tasks of escalating complexity (Basic Setup → Core Feature → Integration → Production → Advanced) using this protocol:

1. **Zero-coaching prompts** — Natural-language instructions with no hints, no docs, no guidance. "Add email/password authentication using Clerk to this Next.js app."
2. **Automated E2E verification** — Playwright tests determine pass/fail, not human judgment.
3. **Error-forwarding only** — When a task fails, the exact error is forwarded back. No interpretation, no strategy, no hints.
4. **10-cycle cap** — If it's not working after 10 correction cycles, the task is marked Failed.
5. **Multiple independent runs** — Each tool is tested 2–3 times to measure variance.
6. **Integration mode** — The agent adds the tool to a pre-built Next.js app with existing routes, database, and UI — simulating real-world usage.

The full protocol, including scoring criteria and outcome band definitions, is in [BENCHMARK_PROTOCOL.md](BENCHMARK_PROTOCOL.md).

## Repository Structure

```
agent-fluency-score/
├── BENCHMARK_PROTOCOL.md       ← Full test methodology
├── README.md                   ← You are here
├── cli/                        ← Benchmark runner CLI
│   ├── src/
│   │   ├── index.ts            ← Entry point (setup, run, auto-run, scorecard)
│   │   ├── runner.ts           ← Interactive benchmark runner
│   │   ├── orchestrator.ts     ← Automated benchmark runner
│   │   ├── scorecard.ts        ← Scorecard generation
│   │   ├── types.ts            ← Type definitions
│   │   └── tasks/              ← Task definitions (auth.ts, orm.ts)
│   └── tests/                  ← Playwright E2E verification tests
│       ├── auth/               ← Auth tier 1–5 specs
│       ├── orm/                ← ORM tier 1–5 specs
│       └── helpers/            ← Per-tool auth flow helpers
├── starter-app/                ← Auth benchmark baseline (Next.js + Prisma)
├── orm-starter-app/            ← ORM benchmark baseline (Next.js + mock data)
└── runs/                       ← Benchmark results (the deliverable)
    ├── AGGREGATE.md            ← Cross-tool comparison data
    ├── auth/
    │   ├── SCORECARD.md        ← Auth results with efficiency metrics
    │   ├── auth0/              ← 3 runs (full source + benchmark logs)
    │   ├── clerk/              ← 3 runs
    │   ├── nextauth/           ← 1 run
    │   └── propel-auth/        ← 3 runs
    └── orm/
        ├── SCORECARD.md        ← ORM results with efficiency metrics
        ├── drizzle/            ← 3 runs
        ├── kysely/             ← 3 runs
        ├── prisma/             ← 3 runs
        └── typeorm/            ← 2 runs
```

Each `runs/<category>/<tool>/` directory contains the **full source code** the agent produced plus machine-readable benchmark logs. This makes every result independently verifiable — you can inspect the generated code yourself.

## Reproduce It

### Prerequisites

- Node.js 22+
- PostgreSQL running locally
- Playwright browsers: `cd cli && npx playwright install chromium`
- Provider API keys (Clerk, Auth0, etc.) in test/development mode
- A coding agent CLI installed and authenticated

### Run a benchmark

```bash
cd cli
npm install

# List available benchmarks
npx tsx src/index.ts list

# Automated run (zero human intervention)
npx tsx src/index.ts auto-run -c auth -t clerk --force

# Or run interactively
npx tsx src/index.ts run -c auth -t clerk

# Generate scorecard
npx tsx src/index.ts scorecard -c auth
```

The `auto-run` command handles everything: copies the starter app, sends task prompts to the agent, runs build checks, executes Playwright E2E tests, handles error correction loops, and generates the scorecard.

## Limitations

- **Single agent tested:** Claude Code (Claude Opus 4.6, high effort). Future iterations may add Cursor, Codex, and others.
- **Single framework:** Next.js 14 App Router. Results may differ for other frameworks.
- **Integration mode only:** Cold-start testing (blank project) is defined in the protocol but not yet implemented.
- **Sample sizes of 1–3 runs per tool.** Enough to show patterns and variance, but not statistically rigorous. All individual run data is included for transparency.
- **"Does it work" only.** No assessment of code quality, performance, or security beyond passing the E2E tests.

## License

MIT
