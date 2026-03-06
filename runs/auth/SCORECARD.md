# Agent Fluency Score — Auth Benchmark

**Protocol Version:** 0.1
**Agent:** claude-code
**Date:** 2026-03-06

---

## Clerk

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-05T00:08:38.802Z
**Completed:** 2026-03-05T00:24:01.883Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome |
|---|------|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ❌ | 1 | 0 | none | working |
| 2 | Core Feature | ✅ | 0 | 0 | none | working |
| 3 | Integration | ✅ | 0 | 0 | none | working |
| 4 | Production | ✅ | 0 | 0 | none | working |
| 5 | Advanced | ✅ | 0 | 0 | none | working |

**Pass Rate:** 5/5 · **First-Attempt:** 4/5 · **Avg Cycles:** 0.2 · **Hallucinations:** 0 · **Band: Fluent**

### Efficiency Metrics

| # | Tier | Turns | Cost | Output Tokens | Wall Time |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 48 | $1.93 | 2,909 | 6m 48s |
| 2 | Core Feature | 16 | $0.00 | 0 | 1m 46s |
| 3 | Integration | 2 | $0.32 | 207 | 11s |
| 4 | Production | 2 | $0.33 | 0 | 14s |
| 5 | Advanced | 34 | $0.00 | 0 | 3m 22s |

**Totals:** 102 turns · $2.58 · 3,116 output tokens · 12m 22s wall time

---

## Propel Auth

**Test Mode:** integration
**Agent Version:** latest
**Started:** 2026-03-05T21:17:20.025Z
**Completed:** 2026-03-05T21:40:07.226Z

| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome |
|---|------|:---:|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | ✅ | 0 | 0 | none | working |
| 2 | Core Feature | ❌ | 1 | 0 | none | working |
| 3 | Integration | ✅ | 0 | 0 | none | working |
| 4 | Production | ✅ | 0 | 0 | none | working |
| 5 | Advanced | ❌ | 1 | 0 | none | working |

**Pass Rate:** 5/5 · **First-Attempt:** 3/5 · **Avg Cycles:** 0.4 · **Hallucinations:** 0 · **Band: Functional**

### Efficiency Metrics

| # | Tier | Turns | Cost | Output Tokens | Wall Time |
|---|------|:---:|:---:|:---:|:---:|
| 1 | Basic Setup | 57 | $0.00 | 0 | 4m 40s |
| 2 | Core Feature | 54 | $0.30 | 0 | 7m |
| 3 | Integration | 6 | $0.87 | 675 | 23s |
| 4 | Production | 5 | $0.78 | 0 | 17s |
| 5 | Advanced | 48 | $1.46 | 2,889 | 5m 31s |

**Totals:** 170 turns · $3.41 · 3,564 output tokens · 17m 51s wall time

---

## Head-to-Head Comparison

| Metric | Clerk | Propel Auth |
|---|:---:|:---:|
| Pass Rate | 5/5 | 5/5 |
| First-Attempt Rate | 4/5 | 3/5 |
| Avg Cycles | 0.2 | 0.4 |
| Hallucinations | 0 | 0 |
| **Overall Band** | **Fluent** | **Functional** |
| Total Cost | $2.58 | $3.41 |
| Total Turns | 102 | 170 |
| Wall Time | 12m 22s | 17m 51s |
| Output Tokens | 3,116 | 3,564 |

