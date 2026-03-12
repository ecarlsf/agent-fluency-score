import inquirer from "inquirer";
import chalk from "chalk";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync } from "fs";
import path from "path";
import { BenchmarkRun, TaskResult, CategoryDefinition } from "./types.js";
import { generateScorecard, calculateSummary } from "./scorecard.js";

const CYCLE_CAP = 10;

export async function setup(
  category: CategoryDefinition,
  tool: string,
  runsDir: string,
  starterDir: string
) {
  const toolDir = path.join(runsDir, category.name, tool);

  if (!existsSync(starterDir)) {
    console.log(chalk.red(`\n  Starter app not found at ${starterDir}`));
    console.log(chalk.dim(`  Build it first, then run setup again.\n`));
    process.exit(1);
  }

  if (existsSync(toolDir) && existsSync(path.join(toolDir, "package.json"))) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `${toolDir} already has files. Overwrite with fresh starter app?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.dim("  Setup cancelled.\n"));
      return;
    }
  }

  console.log(chalk.dim(`\n  Copying starter app to ${toolDir}...`));

  // Ensure directory exists
  mkdirSync(toolDir, { recursive: true });

  // Copy starter app (excluding .git, node_modules, .next, .env)
  const items = execSync(`ls -A ${starterDir}`, { encoding: "utf-8" })
    .split("\n")
    .filter((f) => f && f !== ".git" && f !== "node_modules" && f !== ".next" && f !== ".env");

  for (const item of items) {
    const src = path.join(starterDir, item);
    const dest = path.join(toolDir, item);
    cpSync(src, dest, { recursive: true, force: true });
  }

  // Initialize git if not already
  if (!existsSync(path.join(toolDir, ".git"))) {
    execSync("git init", { cwd: toolDir, stdio: "pipe" });
    execSync("git add -A", { cwd: toolDir, stdio: "pipe" });
    execSync('git commit -m "baseline — pre-benchmark"', {
      cwd: toolDir,
      stdio: "pipe",
    });
  }

  console.log(chalk.green(`  ✓ Setup complete for ${tool}`));
  console.log(chalk.dim(`    Directory: ${toolDir}`));
  console.log(chalk.dim(`    Next: cd ${toolDir} && npm install`));
  console.log(
    chalk.dim(`    Then: create .env with your ${tool} API keys\n`)
  );
}

export async function run(
  category: CategoryDefinition,
  tool: string,
  runsDir: string
) {
  const toolDir = path.join(runsDir, category.name, tool);
  const logFile = path.join(toolDir, "benchmark-log.json");

  // Verify setup
  if (!existsSync(path.join(toolDir, "package.json"))) {
    console.log(
      chalk.red(`\n  No project found at ${toolDir}. Run setup first.\n`)
    );
    process.exit(1);
  }

  // Check for .env
  if (!existsSync(path.join(toolDir, ".env"))) {
    console.log(chalk.yellow(`\n  ⚠ No .env file found in ${toolDir}`));
    const { proceed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceed",
        message: "Continue without .env? (You may need API keys)",
        default: false,
      },
    ]);
    if (!proceed) return;
  }

  // Display header
  const toolDisplay = tool.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  console.log("");
  console.log(chalk.bold.white("  ╔══════════════════════════════════════════════╗"));
  console.log(chalk.bold.white(`  ║   Agent Fluency Score — Benchmark Runner     ║`));
  console.log(chalk.bold.white("  ╚══════════════════════════════════════════════╝"));
  console.log("");
  console.log(chalk.dim(`  Category:  ${category.name}`));
  console.log(chalk.dim(`  Tool:      ${toolDisplay}`));
  console.log(chalk.dim(`  Tasks:     ${category.tasks.length}`));
  console.log(chalk.dim(`  Cycle cap: ${CYCLE_CAP}`));
  console.log(chalk.dim(`  Directory: ${toolDir}`));
  console.log("");

  // Get run metadata
  const { agentVersion, testMode } = await inquirer.prompt([
    {
      type: "input",
      name: "agentVersion",
      message: "Claude Code version (or 'latest'):",
      default: "latest",
    },
    {
      type: "list",
      name: "testMode",
      message: "Test mode:",
      choices: ["integration", "cold-start"],
      default: "integration",
    },
  ]);

  // Get starter project commit
  let starterCommit = "unknown";
  try {
    starterCommit = execSync("git rev-parse --short HEAD", {
      cwd: toolDir,
      encoding: "utf-8",
    }).trim();
  } catch {}

  const benchmarkRun: BenchmarkRun = {
    tool,
    category: category.name,
    agent: "claude-code",
    agentVersion,
    protocolVersion: "0.1",
    testMode: testMode as "cold-start" | "integration",
    startedAt: new Date().toISOString(),
    starterProjectCommit: starterCommit,
    results: [],
  };

  console.log(chalk.yellow("\n  ═══ Pre-Run Checklist ═══\n"));

  const checklist = await inquirer.prompt([
    {
      type: "confirm",
      name: "appRunning",
      message: "Starter app runs without errors?",
    },
    {
      type: "confirm",
      name: "freshSession",
      message: "Fresh Claude Code session open (no prior context)?",
    },
    {
      type: "confirm",
      name: "recording",
      message: "Screen recording or transcript logging enabled?",
    },
  ]);

  if (!checklist.appRunning || !checklist.freshSession) {
    console.log(
      chalk.red("\n  Fix the checklist items above before running.\n")
    );
    return;
  }

  // Run each task
  for (const task of category.tasks) {
    const taskPrompt = task.prompt.replace("{{tool}}", toolDisplay);

    console.log(chalk.yellow(`\n  ═══ Task ${task.id} of ${category.tasks.length}: ${task.tier} ═══\n`));
    console.log(chalk.dim(`  ${task.description}\n`));
    console.log(chalk.white("  ┌─────────────────────────────────────────────┐"));
    console.log(chalk.white("  │ COPY THIS PROMPT INTO CLAUDE CODE:          │"));
    console.log(chalk.white("  └─────────────────────────────────────────────┘"));
    console.log(chalk.cyan(`\n  ${taskPrompt}\n`));

    await inquirer.prompt([
      {
        type: "input",
        name: "ready",
        message: chalk.dim("Press ENTER when you've completed this task in Claude Code..."),
      },
    ]);

    // Record results
    console.log(chalk.dim("\n  Recording results...\n"));

    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "firstAttempt",
        message: "Did it work on first attempt (no corrections needed)?",
      },
      {
        type: "number",
        name: "cycles",
        message: "How many correction cycles? (0 if first attempt worked)",
        default: 0,
        when: (a: { firstAttempt: boolean }) => !a.firstAttempt,
        validate: (v: number) =>
          v >= 0 && v <= CYCLE_CAP
            ? true
            : `Enter 0-${CYCLE_CAP} (${CYCLE_CAP} = hit cap, mark as failed)`,
      },
      {
        type: "number",
        name: "hallucinations",
        message: "How many hallucinations (fake APIs, non-existent methods)?",
        default: 0,
      },
      {
        type: "input",
        name: "hallucinationNotes",
        message: "Describe hallucinations (or press ENTER to skip):",
        when: (a: { hallucinations: number }) => a.hallucinations > 0,
        default: "",
      },
      {
        type: "list",
        name: "docDependency",
        message: "Could the agent have succeeded without documentation?",
        choices: [
          { name: "None — agent knew what to do", value: "none" },
          { name: "Likely — agent seemed to guess at parts", value: "likely" },
          {
            name: "Certain — would have needed docs to succeed",
            value: "certain",
          },
        ],
      },
      {
        type: "list",
        name: "outcome",
        message: "Final outcome:",
        choices: [
          { name: "Working — fully functional", value: "working" },
          { name: "Partial — core works but has bugs", value: "partial" },
          { name: "Failed — broken or hit cycle cap", value: "failed" },
        ],
      },
      {
        type: "input",
        name: "notes",
        message: "Any notes or observations? (press ENTER to skip):",
        default: "",
      },
    ]);

    const a = answers as Record<string, any>;
    const cycles = a.firstAttempt ? 0 : a.cycles ?? 0;

    const result: TaskResult = {
      taskId: task.id,
      tier: task.tier,
      prompt: taskPrompt,
      firstAttemptSuccess: a.firstAttempt,
      correctionCycles: cycles,
      hallucinationCount: a.hallucinations ?? 0,
      hallucinationNotes: a.hallucinationNotes ?? "",
      documentationDependency: a.docDependency,
      outcome: a.outcome,
      notes: a.notes ?? "",
      timestamp: new Date().toISOString(),
    };

    benchmarkRun.results.push(result);

    // Git commit
    try {
      execSync("git add -A", { cwd: toolDir, stdio: "pipe" });

      const commitMsg = `benchmark: task ${task.id} (${task.tier}) — ${a.outcome}`;
      execSync(`git commit -m "${commitMsg}" --allow-empty`, {
        cwd: toolDir,
        stdio: "pipe",
      });

      console.log(chalk.green(`\n  ✓ Git commit: ${commitMsg}`));
    } catch {
      console.log(chalk.dim("  (no git changes to commit)"));
    }

    // Show running tally
    const working = benchmarkRun.results.filter(
      (r) => r.outcome === "working"
    ).length;
    const total = benchmarkRun.results.length;
    console.log(
      chalk.dim(
        `\n  Running score: ${working}/${total} tasks working`
      )
    );

    // Ask if continuing
    if (task.id < category.tasks.length) {
      const { cont } = await inquirer.prompt([
        {
          type: "confirm",
          name: "cont",
          message: "Continue to next task?",
          default: true,
        },
      ]);
      if (!cont) {
        console.log(chalk.dim("  Stopping early. Results saved.\n"));
        break;
      }
    }
  }

  // Finalize
  benchmarkRun.completedAt = new Date().toISOString();

  // Save raw log
  writeFileSync(logFile, JSON.stringify(benchmarkRun, null, 2));
  console.log(chalk.green(`\n  ✓ Results saved to ${logFile}`));

  // Generate and display summary
  const summary = calculateSummary(benchmarkRun);

  console.log(chalk.yellow("\n  ═══ Summary ═══\n"));
  console.log(chalk.white(`  Tool:              ${toolDisplay}`));
  console.log(chalk.white(`  Pass Rate:         ${summary.passRate}`));
  console.log(chalk.white(`  First-Attempt:     ${summary.firstAttemptRate}`));
  console.log(chalk.white(`  Avg Cycles:        ${summary.avgCorrectionCycles.toFixed(1)}`));
  console.log(chalk.white(`  Hallucinations:    ${summary.totalHallucinations === null ? "N/A (automated mode)" : summary.totalHallucinations}`));

  const bandColor =
    summary.overallBand === "Fluent"
      ? chalk.green
      : summary.overallBand === "Functional"
        ? chalk.yellow
        : summary.overallBand === "Friction"
          ? chalk.hex("#FFA500")
          : chalk.red;

  console.log(bandColor(`  Overall Band:      ${summary.overallBand}`));
  console.log("");
}

export async function scorecard(category: string, runsDir: string) {
  const categoryDir = path.join(runsDir, category);

  if (!existsSync(categoryDir)) {
    console.log(chalk.red(`\n  No runs found for category: ${category}\n`));
    process.exit(1);
  }

  // Find all benchmark runs (multi-run aware)
  const { loadAllRuns } = await import("./scorecard.js");
  const allRunsMap = loadAllRuns(categoryDir);

  if (allRunsMap.size === 0) {
    console.log(
      chalk.yellow(
        `\n  No completed benchmark runs found in ${categoryDir}\n`
      )
    );
    return;
  }

  const markdown = generateScorecard(category, allRunsMap);
  const outputPath = path.join(categoryDir, "SCORECARD.md");
  writeFileSync(outputPath, markdown);

  console.log(chalk.green(`\n  ✓ Scorecard generated: ${outputPath}\n`));
  console.log(chalk.dim(markdown));
}
