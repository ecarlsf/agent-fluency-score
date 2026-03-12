# Agent Fluency Score — Benchmark Protocol v0.1

## Purpose

Measure how well a given framework, library, or tool works with an AI coding agent — not by testing the agent's general capability, but by measuring the friction a specific tool introduces into the agent's workflow.

The score answers one question for developers: **If I pick this tool, how much pain should I expect when working with a coding agent?**

---

## Agent Under Test

**Claude Code** (Claude Opus 4.6, high effort) — the agent used for all benchmark runs in this release.

Future iterations may expand to other agents (Cursor, Codex, etc.). Each agent gets its own score column — scores are agent-specific, not agent-agnostic.

---

## Test Environment

### Two Test Modes

Each tool is tested in both modes. Scores are reported separately.

**Cold Start** — Blank project. The agent starts from `npx create-next-app@latest` (or language-equivalent scaffold) and must install, configure, and implement the tool from nothing.

- Tests: baseline agent knowledge of the tool
- Measures: can the agent get this working without any existing context?

**Integration** — Standardized starter project. A pre-built application with routing, basic UI, a connected database, and existing business logic. The agent must add the tool to this existing codebase.

- Tests: real-world usage pattern (most developers are adding tools to existing projects)
- Measures: can the agent integrate this without breaking what's already there?

### Starter Project Spec (Integration Mode)

The same starter project is used across all categories within a given language/framework combination. For the initial proof of concept:

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL via Prisma
- **UI:** Tailwind + shadcn/ui
- **Existing features:** 3-4 routes, a basic data model (e.g., users, posts), CRUD operations
- **State:** Clean git history, no linting errors, all existing features working

The starter project is version-controlled and frozen at the start of each benchmark round.

---

## Prompting Rules

### The Zero-Coaching Principle

The benchmark measures tool compatibility, not prompt engineering skill. Prompts must be natural, uncoached, and contain no hints about implementation.

### Initial Prompt

A single natural-language instruction. The kind of thing a developer would actually type.

**Allowed:**
- "Add authentication using Clerk with email/password and Google OAuth"
- "Set up Stripe payments with a checkout flow and webhook handler"
- "Add Algolia search to the posts model"

**Not allowed:**
- Pasting documentation
- Specifying which API methods to use
- Suggesting architecture or file structure
- Providing code snippets or examples
- Mentioning known gotchas or workarounds

### After the Initial Prompt

**Error forwarding only.** If the agent's output doesn't work:

1. Run the code
2. Copy the exact error message or describe the observable failure (e.g., "the login page renders but clicking Sign In does nothing")
3. Paste it back to the agent with no interpretation, no strategy, no hints

**Allowed follow-ups:**
- "I'm getting this error: [exact error]"
- "The page loads but the button doesn't respond"
- "Build fails with: [exact terminal output]"

**Not allowed follow-ups:**
- "I think the issue might be with the middleware configuration"
- "Try using the v2 API instead"
- "Check the Clerk docs for the correct import path"

### Cycle Cap

**Maximum 10 correction cycles.** If the tool is not working after 10 back-and-forth error-forwarding loops, the task is marked as **Failed**.

A correction cycle = one error forwarded + one agent response. The initial prompt does not count as a cycle.

---

## Task Design

### Principles

- Tasks represent **day-one usage** — what a developer actually reaches for the tool to do
- Tasks are scoped to the tool's **core value proposition**, not edge cases
- Each tool is tested on **3-5 tasks** of escalating complexity
- Tasks are **identical across competing tools** in the same category

### Task Complexity Tiers

**Tier 1 — Basic Setup**
The minimum viable integration. Install, configure, and get the simplest use case working.
Example (Auth): Email/password sign-up and login.

**Tier 2 — Core Feature**
The primary reason you chose this tool. Standard functionality beyond just setup.
Example (Auth): Add Google OAuth as a sign-in option.

**Tier 3 — Integration**
Connecting the tool to the rest of your application. Where things typically get real.
Example (Auth): Protect routes with middleware + display user info in the UI.

**Tier 4 — Production Readiness**
The things you need before shipping. Error handling, edge cases, configuration.
Example (Auth): Handle session expiry, implement sign-out, add role-based access.

**Tier 5 — Advanced (optional)**
Power-user features. Not every tool will be tested at this tier.
Example (Auth): Multi-tenant org support, custom claim handling.

---

## Scorecard

### Per-Task Metrics

For each task, record:

| Metric | What to Record | Notes |
|---|---|---|
| **First-Attempt Success** | Yes / No | Did the code work without any corrections? |
| **Correction Cycles** | 0–10, or Failed | Number of error-forwarding loops before success |
| **Hallucinations** | Count + description | Agent used methods, APIs, or patterns that don't exist |
| **Documentation Dependency** | None / Likely / Certain | Could the agent have succeeded without docs? (inferred from behavior) |
| **Final Outcome** | Working / Partial / Failed | Working = fully functional. Partial = core feature works but with bugs. Failed = hit cycle cap or fundamentally broken. |

### Per-Tool Summary

Roll up across all tasks for a given tool:

| Metric | Calculation |
|---|---|
| **Pass Rate** | Tasks with Working outcome / Total tasks |
| **First-Attempt Rate** | Tasks with first-attempt success / Total tasks |
| **Avg Correction Cycles** | Mean cycles across tasks (Failed = 10) |
| **Hallucination Frequency** | Total hallucinations across all tasks |
| **Overall Outcome** | Qualitative: Fluent / Functional / Friction / Failure |

### Outcome Bands

| Band | Meaning | Rough Criteria |
|---|---|---|
| **Fluent** | Agent works with this tool naturally | 80%+ first-attempt rate, 0-1 avg cycles |
| **Functional** | Works with minor friction | 50%+ first-attempt rate, 1-3 avg cycles |
| **Friction** | Expect significant steering | <50% first-attempt, 3-7 avg cycles |
| **Failure** | Agent cannot reliably use this tool | Multiple failed tasks, 7+ avg cycles |

---

## Environmental Requirements

Benchmark measurements (wall time, cost, correction cycles) are only meaningful when the test environment is controlled. Violating these requirements produces data that cannot be compared across runs.

### No Concurrent Claude Code Sessions

When multiple Claude Code sessions share the same API account (e.g., Claude Max), API requests are queued behind each other. This causes:

- **Inflated wall time**: A task that completes in 7 minutes solo may take 10+ minutes with contention, hitting the timeout cap.
- **False timeouts**: Timed-out tasks are recorded as "failed" with $0 cost and 0 tokens — even though the agent was doing real work. The JSON output (containing the session ID) is never written.
- **Lost session continuity**: When a task times out, subsequent tasks start fresh sessions instead of resuming, burning extra tokens on context rebuilding.
- **Cost measurement corruption**: Partial runs that are killed before returning JSON output show $0 cost, skewing per-task and per-tool cost comparisons.

The `auto-run` command performs a best-effort check for other `claude` processes before starting and prints a warning if any are detected. This is not bulletproof — close all other sessions manually before running.

### Port Availability

The benchmark starts a Next.js dev server on port 3000 (configurable via `BENCHMARK_PORT` env var) during Playwright E2E verification. If another process is using this port, tests will fail with misleading errors.

Verify the port is free before running: `lsof -i :3000`

### Database Isolation

Each tool gets its own PostgreSQL database (e.g., `afs_auth_clerk`). The `auto-run` command drops and recreates this database at the start of each run to ensure a clean state. The PostgreSQL user defaults to `postgres` and can be overridden with the `PGUSER` env var.

## Running a Benchmark

### Pre-Run Checklist

- [ ] **No other Claude Code sessions are active** (API contention corrupts measurements)
- [ ] **Port 3000** (or `BENCHMARK_PORT`) is free
- [ ] Starter project is in clean state (Integration mode) or blank scaffold created (Cold Start mode)
- [ ] Git initialized with clean commit
- [ ] All tasks for this category written and reviewed
- [ ] The agent is on its latest version
- [ ] New agent session (no prior context from other work)
- [ ] Screen recording or full transcript logging enabled

### During the Run

- Start a fresh agent session for each tool (not each task — tasks within a tool are sequential to simulate real workflow)
- Execute tasks in order (Tier 1 → Tier 2 → etc.)
- After each task, verify the output by actually running the code
- Record all metrics in real time
- Save the complete agent transcript
- Git commit after each task (success or failure) for later analysis

### Post-Run

- [ ] Fill in scorecard for each task
- [ ] Calculate per-tool summary metrics
- [ ] Assign outcome band
- [ ] Archive transcript and git history
- [ ] Note any qualitative observations (e.g., "agent was confident but wrong about the v3 API" or "error messages from the framework were unhelpful")

---

## Categories and Tasks

### Auth Category

**Tools tested:** Clerk, Auth0, NextAuth, PropelAuth

**Starter project:** Next.js 14 App Router with PostgreSQL + Prisma (User/Post models), Tailwind + shadcn/ui, routes at `/`, `/dashboard`, `/settings`.

| # | Tier | Task Prompt |
|---|---|---|
| 1 | Basic Setup | "Add email/password authentication using [Tool] to this Next.js app" |
| 2 | Core Feature | "Add Google OAuth as a sign-in option alongside email/password" |
| 3 | Integration | "Protect the /dashboard and /settings routes so only authenticated users can access them. Redirect unauthenticated users to the sign-in page." |
| 4 | Production | "Add a sign-out button to the header that works across all pages. Handle session expiry gracefully." |
| 5 | Advanced | "Add organization support so users can belong to a team and only see data for their organization." |

### ORM Category

**Tools tested:** Prisma, Drizzle, Kysely, TypeORM

**Starter project:** Next.js 14 App Router with mock data layer (Organization/User/Project/Task models), Tailwind + shadcn/ui, routes at `/`, `/dashboard`, `/projects`, `/projects/[id]`, plus JSON API routes.

| # | Tier | Task Prompt |
|---|---|---|
| 1 | Basic Setup | Install the ORM, configure database connection, define schemas for existing data types, replace mock data with real queries |
| 2 | Core CRUD | Make create-task form functional, wire dashboard stats to database, update API routes |
| 3 | Complex Queries | Add filtering by status/assignee, pagination, and corresponding API query parameters |
| 4 | Transactions | Add cross-project task moves with transactional integrity |
| 5 | Advanced Patterns | Add soft-delete with archive/restore functionality |

---

## What This Protocol Does NOT Measure

- Agent general intelligence or reasoning ability
- Quality of generated code beyond "does it work"
- Performance of the implemented feature
- Security of the implementation

Cost, token usage, and wall time are measured but serve as efficiency context, not primary scoring criteria.

---

## Versioning

This protocol will evolve. Each benchmark run should record:

- Protocol version (currently v0.1)
- Agent and model version
- Date of run
- Starter project commit hash
- Any deviations from protocol (and why)
