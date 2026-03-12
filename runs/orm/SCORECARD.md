# Agent Fluency Score — Orm Benchmark

**Protocol Version:** 0.1
**Agent:** claude-code
**Date:** 2026-03-11

---

## Drizzle

### Aggregate Results (3 runs)

| Metric | Run 1 | Run 2 | Run 3 | Mean | Median | Range |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Pass Rate | 5/5 | 5/5 | 5/5 | 5.0/5 | 5/5 | 5–5 |
| First-Attempt | 4/5 | 4/5 | 4/5 | 4.0/5 | 4/5 | 4–4 |
| Avg Cycles | 0.20 | 0.20 | 0.20 | 0.20 | 0.20 | 0.20–0.20 |
| Cost | $8.61 | $8.49 | $7.57 | $8.22 | $8.49 | $7.57–$8.61 |
| Wall Time (min) | 17.7 | 16.0 | 14.5 | 16.0 | 16.0 | 14.5–17.7 |
| Band | Fluent | Fluent | Fluent | — | — | — |

### Latest Run (Run 3)

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-11T05:27:58.424Z
**Completed:** 2026-03-11T05:43:55.443Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome | SOLO |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ✅ | 0 | 0 | none | working | 4 — Extended Abstract |
| 2 | Core CRUD | ✅ | 0 | 0 | none | working | 3 — Relational |
| 3 | Complex Queries | ❌ | 1 | 0 | none | working | 2 — Multistructural |
| 4 | Transactions | ✅ | 0 | 0 | none | working | 3 — Relational |
| 5 | Advanced Patterns | ✅ | 0 | 0 | none | working | 3 — Relational |

**Pass Rate:** 5/5 · **First-Attempt:** 4/5 · **Avg Cycles:** 0.2 · **Hallucinations:** 0 · **Band: Fluent** · **Skill Profile: Reproductive**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 61 | $1.54 | 36 | 20,322 | 46,026 | 1,232,244 | 0 | 0 | 5m 31s | 5m 53s |
| 2 | Core CRUD | 10 | $0.43 | 5 | 1,267 | 53,988 | 126,401 | 0 | 0 | 25s | 34s |
| 3 | Complex Queries | 24 | $1.94 | 26 | 11,389 | 143,631 | 1,515,631 | 0 | 0 | 3m 24s | 3m 45s |
| 4 | Transactions | 21 | $1.50 | 20 | 5,027 | 90,232 | 1,612,540 | 0 | 0 | 1m 36s | 1m 47s |
| 5 | Advanced Patterns | 30 | $2.16 | 26 | 8,585 | 107,895 | 2,549,631 | 0 | 0 | 2m 17s | 2m 29s |

**Totals:** 146 turns · $7.57 · 113 input · 46,590 output · 441,772 cache create · 7,036,447 cache read · 0 searches · 0 fetches · 13m 13s API · 14m 28s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | — | — | — | — | — |
| 2 | Core CRUD | 9 | 12 | 1571 | 38 | — |
| 3 | Complex Queries | 14 | 25 | 301 | 80 | — |
| 4 | Transactions | 9 | 32 | 725 | 58 | — |
| 5 | Advanced Patterns | 15 | 46 | 2318 | 87 | — |

**Totals:** 47 created · 115 modified · +4915/-263 lines

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 10 | 10 | 0 | 0 |
| 2 | Core CRUD | 16 | 16 | 0 | 0 |
| 3 | Complex Queries | 22 | 22 | 0 | 0 |
| 4 | Transactions | 25 | 25 | 0 | 0 |
| 5 | Advanced Patterns | 30 | 30 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $1.51 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 319
- **Lines added in corrected tasks:** 301
- **Metacognitive efficiency:** 0.900 *(tier-weighted, 0-1)*
- **Self-regulation index:** 0.950 *(planning + monitoring + control + reflection, 0-1)*
- **Avg SOLO quality:** 3.0 / 4.0

### Cognitive Profile

#### Information-Gathering

| Metric | Value |
|---|---|
| Web Searches | 0 |
| Web Fetches | 0 |
| Doc Dependency | none |
| Cache Read Tokens | 7,036,447 |

#### Building Understanding

| Metric | Value |
|---|---|
| Input Tokens | 113 |
| Cache Creation Tokens | 441,772 |

#### Productive Thinking

| Metric | Value |
|---|---|
| Lines Added | 4,915 |
| Lines Removed | 263 |
| Files Created | 47 |
| Files Modified | 115 |
| Packages Added | 0 |
| Output Tokens | 46,590 |

#### Strategic & Reflective Thinking

| Metric | Value |
|---|---|
| Correction Cycles | 1 |
| First-Attempt Rate | 4/5 |
| Hallucinations | 0 |
| Regressions | 0 |

---

## Kysely

### Aggregate Results (3 runs)

| Metric | Run 1 | Run 2 | Run 3 | Mean | Median | Range |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Pass Rate | 5/5 | 4/5 | 5/5 | 4.7/5 | 5/5 | 4–5 |
| First-Attempt | 4/5 | 3/5 | 3/5 | 3.3/5 | 3/5 | 3–4 |
| Avg Cycles | 0.20 | 0.20 | 0.40 | 0.27 | 0.20 | 0.20–0.40 |
| Cost | $6.86 | $5.04 | $11.32 | $7.74 | $6.86 | $5.04–$11.32 |
| Wall Time (min) | 15.1 | 11.7 | 19.8 | 15.6 | 15.1 | 11.7–19.8 |
| Band | Fluent | Functional | Functional | — | — | — |

### Latest Run (Run 3)

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-11T05:44:13.224Z
**Completed:** 2026-03-11T06:05:44.987Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome | SOLO |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ✅ | 0 | 0 | none | working | 4 — Extended Abstract |
| 2 | Core CRUD | ✅ | 0 | 0 | none | working | 3 — Relational |
| 3 | Complex Queries | ❌ | 1 | 0 | none | working | 2 — Multistructural |
| 4 | Transactions | ❌ | 1 | 0 | none | working | 2 — Multistructural |
| 5 | Advanced Patterns | ✅ | 0 | 0 | none | working | 3 — Relational |

**Pass Rate:** 5/5 · **First-Attempt:** 3/5 · **Avg Cycles:** 0.4 · **Hallucinations:** 0 · **Band: Functional** · **Skill Profile: Reproductive**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 61 | $1.92 | 47 | 20,797 | 53,349 | 1,919,651 | 0 | 0 | 6m 4s | 6m 36s |
| 2 | Core CRUD | 8 | $0.47 | 5 | 1,094 | 59,177 | 138,263 | 0 | 0 | 22s | 31s |
| 3 | Complex Queries | 23 | $2.36 | 24 | 20,765 | 173,403 | 1,523,760 | 0 | 0 | 5m 54s | 6m 13s |
| 4 | Transactions | 25 | $2.82 | 27 | 5,601 | 230,234 | 2,473,245 | 0 | 0 | 2m 6s | 2m 27s |
| 5 | Advanced Patterns | 41 | $3.76 | 38 | 11,778 | 150,526 | 5,050,643 | 0 | 0 | 3m 44s | 4m 2s |

**Totals:** 158 turns · $11.32 · 141 input · 60,035 output · 666,689 cache create · 11,105,562 cache read · 0 searches · 0 fetches · 18m 10s API · 19m 50s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | — | — | — | — | — |
| 2 | Core CRUD | 8 | 9 | 1364 | 41 | — |
| 3 | Complex Queries | 8 | 33 | 315 | 84 | — |
| 4 | Transactions | 8 | 40 | 644 | 63 | — |
| 5 | Advanced Patterns | 14 | 55 | 2145 | 166 | — |

**Totals:** 38 created · 137 modified · +4468/-354 lines

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 10 | 10 | 0 | 0 |
| 2 | Core CRUD | 16 | 16 | 0 | 0 |
| 3 | Complex Queries | 22 | 22 | 0 | 0 |
| 4 | Transactions | 25 | 25 | 0 | 0 |
| 5 | Advanced Patterns | 30 | 30 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $2.26 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 380
- **Lines added in corrected tasks:** 959
- **Metacognitive efficiency:** 0.767 *(tier-weighted, 0-1)*
- **Self-regulation index:** 0.900 *(planning + monitoring + control + reflection, 0-1)*
- **Avg SOLO quality:** 2.8 / 4.0

### Cognitive Profile

#### Information-Gathering

| Metric | Value |
|---|---|
| Web Searches | 0 |
| Web Fetches | 0 |
| Doc Dependency | none |
| Cache Read Tokens | 11,105,562 |

#### Building Understanding

| Metric | Value |
|---|---|
| Input Tokens | 141 |
| Cache Creation Tokens | 666,689 |

#### Productive Thinking

| Metric | Value |
|---|---|
| Lines Added | 4,468 |
| Lines Removed | 354 |
| Files Created | 38 |
| Files Modified | 137 |
| Packages Added | 0 |
| Output Tokens | 60,035 |

#### Strategic & Reflective Thinking

| Metric | Value |
|---|---|
| Correction Cycles | 2 |
| First-Attempt Rate | 3/5 |
| Hallucinations | 0 |
| Regressions | 0 |

---

## Prisma

### Aggregate Results (3 runs)

| Metric | Run 1 | Run 2 | Run 3 | Mean | Median | Range |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Pass Rate | 5/5 | 5/5 | 4/5 | 4.7/5 | 5/5 | 4–5 |
| First-Attempt | 4/5 | 4/5 | 2/5 | 3.3/5 | 4/5 | 2–4 |
| Avg Cycles | 0.20 | 0.20 | 0.60 | 0.33 | 0.20 | 0.20–0.60 |
| Cost | $7.32 | $8.25 | $6.40 | $7.33 | $7.32 | $6.40–$8.25 |
| Wall Time (min) | 15.6 | 17.4 | 11.9 | 14.9 | 15.6 | 11.9–17.4 |
| Band | Fluent | Fluent | Friction | — | — | — |

### Latest Run (Run 3)

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-11T04:54:32.954Z
**Completed:** 2026-03-11T05:27:43.213Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome | SOLO |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ❌ | 0 | 0 | none | failed | 1 — Unistructural |
| 2 | Core CRUD | ❌ | 2 | 0 | none | working | 2 — Multistructural |
| 3 | Complex Queries | ✅ | 0 | 0 | none | working | 4 — Extended Abstract |
| 4 | Transactions | ❌ | 1 | 0 | none | working | 2 — Multistructural |
| 5 | Advanced Patterns | ✅ | 0 | 0 | none | working | 3 — Relational |

**Pass Rate:** 4/5 · **First-Attempt:** 2/5 · **Avg Cycles:** 0.6 · **Hallucinations:** 0 · **Band: Friction** · **Skill Profile: Mixed**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 0 | $0.00 | 0 | 0 | 0 | 0 | 0 | 0 | 0s | 0s |
| 2 | Core CRUD | 40 | $1.86 | 24 | 17,282 | 37,072 | 697,370 | 0 | 0 | 4m 49s | 5m 22s |
| 3 | Complex Queries | 6 | $0.62 | 7 | 3,528 | 62,715 | 282,142 | 0 | 0 | 50s | 1m |
| 4 | Transactions | 7 | $2.01 | 11 | 1,763 | 73,914 | 483,310 | 0 | 0 | 2m 31s | 2m 53s |
| 5 | Advanced Patterns | 32 | $1.92 | 28 | 7,115 | 92,311 | 2,323,833 | 0 | 0 | 2m 27s | 2m 39s |

**Totals:** 85 turns · $6.40 · 70 input · 29,688 output · 266,012 cache create · 3,786,655 cache read · 0 searches · 0 fetches · 10m 37s API · 11m 53s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | 7 | 2 | 1745 | 22 | seed, @prisma/adapter-pg, @prisma/client, pg, prisma, dotenv, tsx |
| 2 | Core CRUD | 90 | 10 | 12701 | 110 | — |
| 3 | Complex Queries | 4 | 22 | 194 | 52 | — |
| 4 | Transactions | 14 | 25 | 725 | 49 | — |
| 5 | Advanced Patterns | 17 | 51 | 2328 | 90 | — |

**Totals:** 132 created · 110 modified · +17693/-323 lines · Packages: @prisma/adapter-pg, @prisma/client, dotenv, pg, prisma, seed, tsx

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | — | — | — | — |
| 2 | Core CRUD | 16 | 16 | 0 | 0 |
| 3 | Complex Queries | 22 | 22 | 0 | 0 |
| 4 | Transactions | 25 | 25 | 0 | 0 |
| 5 | Advanced Patterns | 30 | 30 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $1.60 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 349
- **Lines added in corrected tasks:** 13,426
- **Metacognitive efficiency:** 0.778 *(tier-weighted, 0-1)*
- **Self-regulation index:** 0.850 *(planning + monitoring + control + reflection, 0-1)*
- **Avg SOLO quality:** 2.4 / 4.0

### Cognitive Profile

#### Information-Gathering

| Metric | Value |
|---|---|
| Web Searches | 0 |
| Web Fetches | 0 |
| Doc Dependency | none |
| Cache Read Tokens | 3,786,655 |

#### Building Understanding

| Metric | Value |
|---|---|
| Input Tokens | 70 |
| Cache Creation Tokens | 266,012 |

#### Productive Thinking

| Metric | Value |
|---|---|
| Lines Added | 17,693 |
| Lines Removed | 323 |
| Files Created | 132 |
| Files Modified | 110 |
| Packages Added | 7 |
| Output Tokens | 29,688 |

#### Strategic & Reflective Thinking

| Metric | Value |
|---|---|
| Correction Cycles | 3 |
| First-Attempt Rate | 2/5 |
| Hallucinations | 0 |
| Regressions | 0 |

### Notes

- **Task 1 (Basic Setup):** Agent failed on cycle 0 and no session ID was established. Cannot resume.

Output:
spawnSync claude ETIMEDOUT

--- Error history ---
Cycle 0: Agent exited with code 143 in 600207ms

---

## Typeorm

### Aggregate Results (2 runs)

| Metric | Run 1 | Run 3 | Mean | Median | Range |
|--------|:---:|:---:|:---:|:---:|:---:|
| Pass Rate | 5/5 | 5/5 | 5.0/5 | 5/5 | 5–5 |
| First-Attempt | 3/5 | 2/5 | 2.5/5 | 2.5/5 | 2–3 |
| Avg Cycles | 0.40 | 0.60 | 0.50 | 0.50 | 0.40–0.60 |
| Cost | $13.79 | $16.03 | $14.91 | $14.91 | $13.79–$16.03 |
| Wall Time (min) | 34.6 | 31.5 | 33.1 | 33.1 | 31.5–34.6 |
| Band | Functional | Friction | — | — | — |

### Latest Run (Run 3)

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-11T06:06:01.881Z
**Completed:** 2026-03-11T06:39:35.059Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome | SOLO |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ❌ | 1 | 0 | none | working | 2 — Multistructural |
| 2 | Core CRUD | ✅ | 0 | 0 | none | working | 3 — Relational |
| 3 | Complex Queries | ❌ | 1 | 0 | none | working | 2 — Multistructural |
| 4 | Transactions | ❌ | 1 | 0 | none | working | 2 — Multistructural |
| 5 | Advanced Patterns | ✅ | 0 | 0 | none | working | 3 — Relational |

**Pass Rate:** 5/5 · **First-Attempt:** 2/5 · **Avg Cycles:** 0.6 · **Hallucinations:** 0 · **Band: Friction** · **Skill Profile: Mixed**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 109 | $3.83 | 68 | 41,794 | 157,974 | 3,387,392 | 0 | 0 | 12m 3s | 12m 51s |
| 2 | Core CRUD | 1 | $2.52 | 3 | 45 | 2,259 | 122,453 | 0 | 0 | 5m 53s | 6m 44s |
| 3 | Complex Queries | 11 | $2.99 | 14 | 7,049 | 105,632 | 1,093,502 | 0 | 0 | 4m 15s | 4m 41s |
| 4 | Transactions | 32 | $3.52 | 32 | 7,848 | 258,635 | 3,409,494 | 0 | 0 | 3m 12s | 3m 37s |
| 5 | Advanced Patterns | 34 | $3.18 | 30 | 8,190 | 148,630 | 4,093,925 | 0 | 0 | 3m 28s | 3m 40s |

**Totals:** 187 turns · $16.03 · 147 input · 64,926 output · 673,130 cache create · 12,106,766 cache read · 0 searches · 0 fetches · 28m 50s API · 31m 33s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | — | — | — | — | — |
| 2 | Core CRUD | 10 | 25 | 1492 | 39 | — |
| 3 | Complex Queries | 15 | 26 | 278 | 77 | — |
| 4 | Transactions | 13 | 30 | 679 | 53 | — |
| 5 | Advanced Patterns | 16 | 51 | 2168 | 80 | — |

**Totals:** 54 created · 132 modified · +4617/-249 lines

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 10 | 10 | 0 | 0 |
| 2 | Core CRUD | 16 | 16 | 0 | 0 |
| 3 | Complex Queries | 22 | 22 | 0 | 0 |
| 4 | Transactions | 25 | 25 | 0 | 0 |
| 5 | Advanced Patterns | 30 | 30 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $3.21 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 347
- **Lines added in corrected tasks:** 957
- **Metacognitive efficiency:** 0.733 *(tier-weighted, 0-1)*
- **Self-regulation index:** 0.850 *(planning + monitoring + control + reflection, 0-1)*
- **Avg SOLO quality:** 2.4 / 4.0

### Cognitive Profile

#### Information-Gathering

| Metric | Value |
|---|---|
| Web Searches | 0 |
| Web Fetches | 0 |
| Doc Dependency | none |
| Cache Read Tokens | 12,106,766 |

#### Building Understanding

| Metric | Value |
|---|---|
| Input Tokens | 147 |
| Cache Creation Tokens | 673,130 |

#### Productive Thinking

| Metric | Value |
|---|---|
| Lines Added | 4,617 |
| Lines Removed | 249 |
| Files Created | 54 |
| Files Modified | 132 |
| Packages Added | 0 |
| Output Tokens | 64,926 |

#### Strategic & Reflective Thinking

| Metric | Value |
|---|---|
| Correction Cycles | 3 |
| First-Attempt Rate | 2/5 |
| Hallucinations | 0 |
| Regressions | 0 |

---

## Head-to-Head Comparison

| Metric | Drizzle | Kysely | Prisma | Typeorm |
|---|:---:|:---:|:---:|:---:|
| Pass Rate | 5/5 | 5/5 | 4/5 | 5/5 |
| First-Attempt Rate | 4/5 | 3/5 | 2/5 | 2/5 |
| Avg Cycles | 0.2 | 0.4 | 0.6 | 0.6 |
| Hallucinations | 0 | 0 | 0 | 0 |
| **Overall Band** | **Fluent** | **Functional** | **Friction** | **Friction** |
| Total Cost | $7.57 | $11.32 | $6.40 | $16.03 |
| Total Turns | 146 | 158 | 85 | 187 |
| Wall Time | 14m 28s | 19m 50s | 11m 53s | 31m 33s |
| Input Tokens | 113 | 141 | 70 | 147 |
| Output Tokens | 46,590 | 60,035 | 29,688 | 64,926 |
| Cache Create Tokens | 441,772 | 666,689 | 266,012 | 673,130 |
| Cache Read Tokens | 7,036,447 | 11,105,562 | 3,786,655 | 12,106,766 |
| Web Searches | 0 | 0 | 0 | 0 |
| Web Fetches | 0 | 0 | 0 | 0 |
| API Time | 13m 13s | 18m 10s | 10m 37s | 28m 50s |
| Total Cost / Success | $1.51 | $2.26 | $1.60 | $3.21 |
| Lines Added | 4,915 | 4,468 | 17,693 | 4,617 |
| Packages Added | — | — | 7 | — |
| Regressions | 0 | 0 | 0 | 0 |
| **Cognitive Metrics** | | | | |
| Metacognitive Efficiency | 0.900 | 0.767 | 0.778 | 0.733 |
| Self-Regulation Index | 0.950 | 0.900 | 0.850 | 0.850 |
| Avg SOLO Quality | 3.0 | 2.8 | 2.4 | 2.4 |
| Skill Profile | Reproductive | Reproductive | Mixed | Mixed |
| **Information-Gathering** | | | | |
| Web Searches | 0 | 0 | 0 | 0 |
| Web Fetches | 0 | 0 | 0 | 0 |
| Doc Dependency | none | none | none | none |
| **Productive Thinking** | | | | |
| Lines Added | 4,915 | 4,468 | 17,693 | 4,617 |
| Output Tokens | 46,590 | 60,035 | 29,688 | 64,926 |
| **Strategic & Reflective** | | | | |
| Correction Cycles | 1 | 2 | 3 | 3 |
| Hallucinations | 0 | 0 | 0 | 0 |

## Head-to-Head Comparison (Aggregate Means)

| Metric | Drizzle (N=3) | Kysely (N=3) | Prisma (N=3) | Typeorm (N=2) |
|---|:---:|:---:|:---:|:---:|
| Mean Pass Rate | 5.0/5 | 4.7/5 | 4.7/5 | 5.0/5 |
| Mean First-Attempt | 4.0/5 | 3.3/5 | 3.3/5 | 2.5/5 |
| Mean Avg Cycles | 0.20 | 0.27 | 0.33 | 0.50 |
| Mean Cost | $8.22 | $7.74 | $7.33 | $14.91 |
| Mean Wall Time (min) | 16.0 | 15.6 | 14.9 | 33.1 |
| Cost Range | $7.57–$8.61 | $5.04–$11.32 | $6.40–$8.25 | $13.79–$16.03 |

