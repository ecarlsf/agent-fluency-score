# Agent Fluency Score

Measuring how well frameworks, libraries, and tools work with AI coding agents.

Not "how good is the agent" — but "how agent-friendly is the tool."

## Structure

```
agent-fluency-score/
├── BENCHMARK_PROTOCOL.md   ← Test methodology and rules
├── README.md               ← You are here
├── starter-app/            ← Baseline Next.js app (frozen before each run)
└── runs/
    └── auth/
        ├── SCORECARD.md    ← Results template
        ├── clerk/          ← Copy of starter-app for Clerk benchmark
        └── propel-auth/    ← Copy of starter-app for Propel Auth benchmark
```

## How It Works

1. Build the starter app in `starter-app/`
2. Copy it into each tool's run directory
3. Open a fresh Claude Code session per tool
4. Follow the protocol: single natural prompt → error forwarding only → 10-cycle cap
5. Record results in the scorecard

## Current Status

- [x] Protocol designed (v0.1)
- [x] Directory structure created
- [ ] Starter app built
- [ ] Auth benchmark: Clerk
- [ ] Auth benchmark: Propel Auth
- [ ] Results published
