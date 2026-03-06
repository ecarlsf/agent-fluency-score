#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { getCategory, listCategories } from "./tasks/index.js";
import { setup, run, scorecard } from "./runner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "../..");

const program = new Command();

program
  .name("afs")
  .description("Agent Fluency Score — benchmark tool compatibility with AI coding agents")
  .version("0.1.0");

program
  .command("setup")
  .description("Prepare a tool directory for benchmarking")
  .requiredOption("-c, --category <name>", "benchmark category (e.g., auth)")
  .requiredOption("-t, --tool <name>", "tool to benchmark (e.g., clerk)")
  .option("--root <path>", "project root directory", defaultRoot)
  .action(async (opts) => {
    const category = getCategory(opts.category);
    if (!category) {
      console.log(chalk.red(`\n  Unknown category: ${opts.category}`));
      console.log(chalk.dim(`  Available: ${listCategories().join(", ")}\n`));
      process.exit(1);
    }

    if (!category.tools.includes(opts.tool)) {
      console.log(chalk.red(`\n  Unknown tool: ${opts.tool}`));
      console.log(chalk.dim(`  Available for ${opts.category}: ${category.tools.join(", ")}\n`));
      process.exit(1);
    }

    const runsDir = path.join(opts.root, "runs");
    const starterDir = path.join(opts.root, "starter-app");

    await setup(category, opts.tool, runsDir, starterDir);
  });

program
  .command("run")
  .description("Run a benchmark interactively")
  .requiredOption("-c, --category <name>", "benchmark category (e.g., auth)")
  .requiredOption("-t, --tool <name>", "tool to benchmark (e.g., clerk)")
  .option("--root <path>", "project root directory", defaultRoot)
  .action(async (opts) => {
    const category = getCategory(opts.category);
    if (!category) {
      console.log(chalk.red(`\n  Unknown category: ${opts.category}`));
      console.log(chalk.dim(`  Available: ${listCategories().join(", ")}\n`));
      process.exit(1);
    }

    if (!category.tools.includes(opts.tool)) {
      console.log(chalk.red(`\n  Unknown tool: ${opts.tool}`));
      console.log(chalk.dim(`  Available for ${opts.category}: ${category.tools.join(", ")}\n`));
      process.exit(1);
    }

    const runsDir = path.join(opts.root, "runs");

    await run(category, opts.tool, runsDir);
  });

program
  .command("scorecard")
  .description("Generate comparison scorecard from completed runs")
  .requiredOption("-c, --category <name>", "benchmark category (e.g., auth)")
  .option("--root <path>", "project root directory", defaultRoot)
  .action(async (opts) => {
    const category = getCategory(opts.category);
    if (!category) {
      console.log(chalk.red(`\n  Unknown category: ${opts.category}`));
      console.log(chalk.dim(`  Available: ${listCategories().join(", ")}\n`));
      process.exit(1);
    }

    const runsDir = path.join(opts.root, "runs");
    await scorecard(opts.category, runsDir);
  });

program
  .command("auto-run")
  .description("Run a fully automated benchmark (no human intervention)")
  .requiredOption("-c, --category <name>", "benchmark category (e.g., auth)")
  .requiredOption("-t, --tool <name>", "tool to benchmark (e.g., clerk)")
  .option("--root <path>", "project root directory", defaultRoot)
  .option("--force", "replace existing tool directory (preserves .env)", false)
  .option("--agent-version <version>", "agent version to record", "latest")
  .action(async (opts) => {
    const { autoRun } = await import("./orchestrator.js");
    await autoRun({
      category: opts.category,
      tool: opts.tool,
      root: opts.root,
      force: opts.force,
      agentVersion: opts.agentVersion,
    });
  });

program
  .command("backfill")
  .description("Backfill metrics from existing cycle logs into benchmark data and scorecard")
  .requiredOption("-c, --category <name>", "benchmark category (e.g., auth)")
  .option("--root <path>", "project root directory", defaultRoot)
  .action(async (opts) => {
    const { backfillMetrics } = await import("./orchestrator.js");
    await backfillMetrics({
      category: opts.category,
      root: opts.root,
    });
  });

program
  .command("list")
  .description("List available categories and tools")
  .action(() => {
    console.log(chalk.bold("\n  Available benchmarks:\n"));
    for (const name of listCategories()) {
      const cat = getCategory(name)!;
      console.log(chalk.white(`  ${name}`));
      console.log(chalk.dim(`    Tools: ${cat.tools.join(", ")}`));
      console.log(chalk.dim(`    Tasks: ${cat.tasks.length}\n`));
    }
  });

program.parse();
