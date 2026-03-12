# Agent Fluency Score — Auth Benchmark

**Protocol Version:** 0.1
**Agent:** claude-code
**Date:** 2026-03-11

---

## Auth0

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-11T04:08:41.448Z
**Completed:** 2026-03-11T04:28:00.993Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome |
|---|------|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ❌ | 1 | 0 | none | working |
| 2 | Core Feature | ✅ | 0 | 0 | none | working |
| 3 | Integration | ✅ | 0 | 0 | none | working |
| 4 | Production | ✅ | 0 | 0 | none | working |
| 5 | Advanced | ❌ | 2 | 0 | none | working |

**Pass Rate:** 5/5 · **First-Attempt:** 3/5 · **Avg Cycles:** 0.6 · **Hallucinations:** 0 · **Band: Functional**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 62 | $1.80 | 950 | 19,949 | 85,827 | 1,315,832 | 0 | 0 | 6m 42s | 7m 27s |
| 2 | Core Feature | 1 | $0.30 | 3 | 171 | 46,578 | 8,925 | 0 | 0 | 7s | 8s |
| 3 | Integration | 1 | $0.30 | 3 | 196 | 46,802 | 8,925 | 0 | 0 | 6s | 7s |
| 4 | Production | 1 | $0.30 | 3 | 227 | 47,041 | 8,925 | 0 | 0 | 8s | 9s |
| 5 | Advanced | 47 | $3.20 | 47 | 15,452 | 225,654 | 2,796,916 | 0 | 0 | 5m 5s | 5m 40s |

**Totals:** 112 turns · $5.90 · 1,006 input · 35,995 output · 451,902 cache create · 4,139,523 cache read · 0 searches · 0 fetches · 12m 8s API · 13m 31s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | 3 | 9 | 254 | 32 | @auth0/nextjs-auth0 |
| 2 | Core Feature | 0 | 0 | 0 | 0 | — |
| 3 | Integration | 0 | 0 | 0 | 0 | — |
| 4 | Production | 0 | 0 | 0 | 0 | — |
| 5 | Advanced | 1 | 8 | 160 | 27 | — |

**Totals:** 4 created · 17 modified · +414/-59 lines · Packages: @auth0/nextjs-auth0

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 5 | 5 | 0 | 0 |
| 2 | Core Feature | 6 | 6 | 0 | 0 |
| 3 | Integration | 10 | 10 | 0 | 0 |
| 4 | Production | 12 | 12 | 0 | 0 |
| 5 | Advanced | 13 | 13 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $1.18 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 321
- **Lines added in corrected tasks:** 414
- **No-changes tasks:** 3

---

## Clerk

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-11T03:56:49.402Z
**Completed:** 2026-03-11T04:08:22.579Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome |
|---|------|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ✅ | 0 | 0 | none | working |
| 2 | Core Feature | ✅ | 0 | 0 | none | working |
| 3 | Integration | ✅ | 0 | 0 | none | working |
| 4 | Production | ✅ | 0 | 0 | none | working |
| 5 | Advanced | ✅ | 0 | 0 | none | working |

**Pass Rate:** 5/5 · **First-Attempt:** 5/5 · **Avg Cycles:** 0 · **Hallucinations:** 0 · **Band: Fluent**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 47 | $1.16 | 107 | 11,468 | 30,234 | 1,165,367 | 0 | 0 | 4m 27s | 4m 53s |
| 2 | Core Feature | 1 | $0.22 | 3 | 1,103 | 30,306 | 8,925 | 0 | 0 | 26s | 28s |
| 3 | Integration | 1 | $0.21 | 3 | 204 | 31,453 | 8,925 | 0 | 0 | 9s | 10s |
| 4 | Production | 2 | $0.24 | 4 | 302 | 32,736 | 49,549 | 0 | 0 | 13s | 14s |
| 5 | Advanced | 24 | $1.11 | 26 | 7,603 | 46,197 | 1,162,586 | 0 | 0 | 2m 48s | 3m |

**Totals:** 75 turns · $2.94 · 143 input · 20,680 output · 170,926 cache create · 2,395,352 cache read · 0 searches · 0 fetches · 8m 4s API · 8m 44s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | 5 | 8 | 315 | 34 | @clerk/nextjs |
| 2 | Core Feature | 0 | 0 | 0 | 0 | — |
| 3 | Integration | 0 | 0 | 0 | 0 | — |
| 4 | Production | 0 | 0 | 0 | 0 | — |
| 5 | Advanced | 1 | 6 | 144 | 20 | — |

**Totals:** 6 created · 14 modified · +459/-54 lines · Packages: @clerk/nextjs

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 5 | 5 | 0 | 0 |
| 2 | Core Feature | 6 | 6 | 0 | 0 |
| 3 | Integration | 10 | 10 | 0 | 0 |
| 4 | Production | 12 | 12 | 0 | 0 |
| 5 | Advanced | 13 | 13 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $0.59 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 276
- **No-changes tasks:** 3

---

## Nextauth

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-10T01:38:29.587Z
**Completed:** 2026-03-10T01:56:30.092Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome |
|---|------|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ❌ | 3 | 0 | none | working |
| 2 | Core Feature | ✅ | 0 | 0 | none | working |
| 3 | Integration | ✅ | 0 | 0 | none | working |
| 4 | Production | ✅ | 0 | 0 | none | working |
| 5 | Advanced | ❌ | 1 | 0 | none | working |

**Pass Rate:** 5/5 · **First-Attempt:** 3/5 · **Avg Cycles:** 0.8 · **Hallucinations:** 0 · **Band: Functional**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 75 | $2.39 | 4,494 | 19,465 | 151,687 | 1,861,197 | 0 | 0 | 5m 44s | 6m 35s |
| 2 | Core Feature | 20 | $1.05 | 21 | 4,990 | 58,309 | 1,128,927 | 0 | 0 | 1m 45s | 2m 3s |
| 3 | Integration | 2 | $0.42 | 4 | 182 | 59,889 | 77,597 | 0 | 0 | 8s | 11s |
| 4 | Production | 2 | $0.43 | 4 | 246 | 60,787 | 77,891 | 0 | 0 | 11s | 13s |
| 5 | Advanced | 42 | $2.75 | 43 | 10,485 | 159,435 | 2,980,877 | 0 | 0 | 3m 37s | 4m 17s |

**Totals:** 141 turns · $7.03 · 4,566 input · 35,368 output · 490,107 cache create · 6,126,489 cache read · 0 searches · 0 fetches · 11m 24s API · 13m 19s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | 12 | 9 | 782 | 28 | bcryptjs, next-auth, @types/bcryptjs |
| 2 | Core Feature | 1 | 5 | 71 | 3 | — |
| 3 | Integration | 0 | 0 | 0 | 0 | — |
| 4 | Production | 0 | 0 | 0 | 0 | — |
| 5 | Advanced | 1 | 10 | 160 | 23 | — |

**Totals:** 14 created · 24 modified · +1013/-54 lines · Packages: @types/bcryptjs, bcryptjs, next-auth

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 5 | 5 | 0 | 0 |
| 2 | Core Feature | 6 | 6 | 0 | 0 |
| 3 | Integration | 10 | 10 | 0 | 0 |
| 4 | Production | 12 | 12 | 0 | 0 |
| 5 | Advanced | 13 | 13 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $1.41 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 251
- **Lines added in corrected tasks:** 942
- **No-changes tasks:** 2

---

## Propel Auth

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-11T04:28:20.341Z
**Completed:** 2026-03-11T04:54:13.913Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome |
|---|------|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ✅ | 0 | 0 | none | working |
| 2 | Core Feature | ❌ | 2 | 0 | none | working |
| 3 | Integration | ✅ | 0 | 0 | none | working |
| 4 | Production | ✅ | 0 | 0 | none | working |
| 5 | Advanced | ❌ | 1 | 0 | none | working |

**Pass Rate:** 5/5 · **First-Attempt:** 3/5 · **Avg Cycles:** 0.6 · **Hallucinations:** 0 · **Band: Functional**

### Efficiency Metrics

| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 60 | $1.55 | 120 | 13,666 | 38,937 | 1,721,545 | 0 | 0 | 4m 46s | 5m 11s |
| 2 | Core Feature | 4 | $0.93 | 8 | 949 | 127,851 | 210,619 | 0 | 0 | 26s | 37s |
| 3 | Integration | 12 | $1.20 | 14 | 2,519 | 92,991 | 1,101,560 | 0 | 0 | 55s | 1m 5s |
| 4 | Production | 5 | $0.84 | 7 | 1,269 | 95,748 | 421,458 | 0 | 0 | 28s | 37s |
| 5 | Advanced | 36 | $3.39 | 35 | 10,007 | 229,174 | 3,409,974 | 0 | 0 | 3m 12s | 3m 34s |

**Totals:** 117 turns · $7.90 · 184 input · 28,410 output · 584,701 cache create · 6,865,156 cache read · 0 searches · 0 fetches · 9m 46s API · 11m 4s wall

### Code Changes

| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |
|---|------|:---:|:---:|:---:|:---:|---|
| 1 | Basic Setup | 5 | 9 | 162 | 37 | @propelauth/nextjs |
| 2 | Core Feature | 2 | 0 | 228 | 0 | — |
| 3 | Integration | 0 | 2 | 29 | 4 | — |
| 4 | Production | 0 | 1 | 25 | 0 | — |
| 5 | Advanced | 1 | 7 | 129 | 12 | — |

**Totals:** 8 created · 19 modified · +573/-53 lines · Packages: @propelauth/nextjs

### Test Results

| # | Tier | Total | Passed | Failed | Regressions |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 5 | 5 | 0 | 0 |
| 2 | Core Feature | 6 | 6 | 0 | 0 |
| 3 | Integration | 10 | 10 | 0 | 0 |
| 4 | Production | 12 | 12 | 0 | 0 |
| 5 | Advanced | 13 | 13 | 0 | 0 |

### Derived Metrics

- **Total cost / success:** $1.58 *(total spend ÷ working tasks)*
- **Output tokens / turn:** 243
- **Lines added in corrected tasks:** 357

---

## Head-to-Head Comparison

| Metric | Auth0 | Clerk | Nextauth | Propel Auth |
|---|:---:|:---:|:---:|:---:|
| Pass Rate | 5/5 | 5/5 | 5/5 | 5/5 |
| First-Attempt Rate | 3/5 | 5/5 | 3/5 | 3/5 |
| Avg Cycles | 0.6 | 0 | 0.8 | 0.6 |
| Hallucinations | 0 | 0 | 0 | 0 |
| **Overall Band** | **Functional** | **Fluent** | **Functional** | **Functional** |
| Total Cost | $5.90 | $2.94 | $7.03 | $7.90 |
| Total Turns | 112 | 75 | 141 | 117 |
| Wall Time | 13m 31s | 8m 44s | 13m 19s | 11m 4s |
| Input Tokens | 1,006 | 143 | 4,566 | 184 |
| Output Tokens | 35,995 | 20,680 | 35,368 | 28,410 |
| Cache Create Tokens | 451,902 | 170,926 | 490,107 | 584,701 |
| Cache Read Tokens | 4,139,523 | 2,395,352 | 6,126,489 | 6,865,156 |
| API Time | 12m 8s | 8m 4s | 11m 24s | 9m 46s |
| Total Cost / Success | $1.18 | $0.59 | $1.41 | $1.58 |
| Lines Added | 414 | 459 | 1,013 | 573 |
| Packages Added | 1 | 1 | 3 | 1 |
| Correction Cycles | 3 | 0 | 4 | 3 |
| Regressions | 0 | 0 | 0 | 0 |
