import { execFileSync, execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { Task, TaskResult, BenchmarkRun, AgentMetrics, CycleDetail, DiffStats, TestRunResults, TestDetail } from "./types.js";
import { aggregateMetrics, aggregateDiffStats, tierNumber } from "./types.js";
import categories from "./tasks/index.js";
import { calculateSummary, generateScorecard, loadAllRuns } from "./scorecard.js";

const CYCLE_CAP = 10;
const AGENT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const BUILD_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const TEST_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const ERROR_BUDGET = 3000; // total chars budget for truncated error output (weighted toward head)
const BENCHMARK_PORT = parseInt(process.env.BENCHMARK_PORT || "3000", 10);
const PGUSER = process.env.PGUSER || "postgres";

// ---------------------------------------------------------------------------
// Debug logger — writes verbose output to benchmark-debug.log in the toolDir
// ---------------------------------------------------------------------------

let debugLogPath: string | null = null;

function initDebugLog(toolDir: string): void {
  debugLogPath = path.join(toolDir, "benchmark-debug.log");
  fs.writeFileSync(debugLogPath, `=== Benchmark debug log — ${new Date().toISOString()} ===\n\n`);
}

function debugLog(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  if (debugLogPath) {
    fs.appendFileSync(debugLogPath, line);
  }
  // Also print to console in dim for visibility
  console.log(chalk.dim(`  [debug] ${message}`));
}

// ---------------------------------------------------------------------------
// Cycle-level detail log — written to benchmark-cycles.json alongside the run
// ---------------------------------------------------------------------------

let cycleDetails: CycleDetail[] = [];
let cycleLogPath: string | null = null;

function initCycleLog(toolDir: string): void {
  cycleLogPath = path.join(toolDir, "benchmark-cycles.json");
  cycleDetails = [];
}

function saveCycleLog(): void {
  if (cycleLogPath) {
    fs.writeFileSync(cycleLogPath, JSON.stringify(cycleDetails, null, 2));
  }
}

// ---------------------------------------------------------------------------
// Command execution — uses execFileSync (no shell) to avoid argument mangling
// ---------------------------------------------------------------------------

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
}

function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; timeout?: number; env?: Record<string, string> }
): CommandResult {
  const start = Date.now();
  try {
    const stdout = execFileSync(command, args, {
      cwd: options.cwd,
      timeout: options.timeout,
      encoding: "utf-8",
      env: (() => {
        const env = { ...process.env, ...options.env };
        // Allow spawning Claude CLI from within a Claude session
        delete env.CLAUDECODE;
        return env;
      })(),
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr: "", exitCode: 0, durationMs: Date.now() - start, timedOut: false };
  } catch (err: any) {
    const timedOut = err.killed === true;
    return {
      stdout: err.stdout?.toString() || "",
      stderr: err.stderr?.toString() || err.message || "",
      exitCode: err.status ?? 1,
      durationMs: Date.now() - start,
      timedOut,
    };
  }
}

// ---------------------------------------------------------------------------
// Agent invocation
// ---------------------------------------------------------------------------

interface AgentResult {
  output: string;
  rawStdout: string;
  sessionId: string | null;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
}

function invokeAgent(
  prompt: string,
  sessionId: string | null,
  cwd: string
): AgentResult {
  const args: string[] = [];

  // Only resume if we have a real session ID (non-empty string)
  if (sessionId && sessionId.length > 0) {
    args.push("--resume", sessionId, "-p", prompt);
  } else {
    args.push("-p", prompt);
  }
  args.push("--output-format", "json", "--dangerously-skip-permissions");

  debugLog(`Invoking: claude ${args.map((a) => a.includes(" ") ? `"${a}"` : a).join(" ")}`);
  debugLog(`  cwd: ${cwd}`);

  const result = runCommand("claude", args, { cwd, timeout: AGENT_TIMEOUT });

  if (result.timedOut) {
    debugLog(`  Agent timed out after ${result.durationMs}ms — process was killed`);
    console.log(chalk.red(`  WARNING: Agent timed out after ${result.durationMs}ms — process was killed`));
  }
  debugLog(`  exit code: ${result.exitCode}`);
  debugLog(`  duration: ${result.durationMs}ms`);
  debugLog(`  stdout length: ${result.stdout.length} chars`);
  debugLog(`  stderr length: ${result.stderr.length} chars`);

  if (result.stdout.length > 0) {
    debugLog(`  stdout (first 500): ${result.stdout.slice(0, 500)}`);
  }
  if (result.stderr.length > 0) {
    debugLog(`  stderr (first 500): ${result.stderr.slice(0, 500)}`);
  }

  // Parse session ID from JSON output
  let parsedSessionId: string | null = null;
  try {
    const jsonOutput = JSON.parse(result.stdout);
    if (jsonOutput.session_id) {
      parsedSessionId = jsonOutput.session_id;
      debugLog(`  session_id (from JSON): ${parsedSessionId}`);
    } else {
      debugLog(`  WARNING: JSON parsed but no session_id field found. Keys: ${Object.keys(jsonOutput).join(", ")}`);
    }
  } catch {
    // stdout wasn't valid JSON — try regex fallback
    const combined = result.stdout + result.stderr;
    const sessionMatch = combined.match(/"session_id"\s*:\s*"([^"]+)"/);
    if (sessionMatch) {
      parsedSessionId = sessionMatch[1];
      debugLog(`  session_id (from regex): ${parsedSessionId}`);
    } else {
      debugLog(`  WARNING: Could not parse session_id from output`);
      debugLog(`  Full stdout: ${result.stdout.slice(0, 2000)}`);
      debugLog(`  Full stderr: ${result.stderr.slice(0, 2000)}`);
    }
  }

  // Warn loudly if invocation finished suspiciously fast
  if (result.durationMs < 5000 && result.exitCode !== 0) {
    debugLog(`  WARNING: Agent exited in ${result.durationMs}ms with code ${result.exitCode} — likely a CLI error, not a real run`);
    console.log(chalk.red(`  WARNING: claude exited in ${result.durationMs}ms (exit ${result.exitCode}) — check debug log`));
  }

  return {
    output: result.stdout + result.stderr,
    rawStdout: result.stdout,
    sessionId: parsedSessionId,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    timedOut: result.timedOut,
  };
}

function truncateError(error: string): string {
  if (error.length <= ERROR_BUDGET) return error;
  // Weight toward head (2/3) since root-cause errors are usually at the top
  const headSize = Math.floor(ERROR_BUDGET * 2 / 3);
  const tailSize = ERROR_BUDGET - headSize;
  return error.slice(0, headSize) + "\n\n... [truncated " + (error.length - ERROR_BUDGET) + " chars] ...\n\n" + error.slice(-tailSize);
}

function head(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "...";
}

function parseAgentMetrics(stdout: string, wallTimeMs: number): AgentMetrics | null {
  try {
    const json = JSON.parse(stdout);
    return {
      durationMs: wallTimeMs,
      apiTimeMs: json.duration_api_ms ?? 0,
      turns: json.num_turns ?? 0,
      costUsd: json.total_cost_usd ?? 0,
      inputTokens: json.usage?.input_tokens ?? 0,
      outputTokens: json.usage?.output_tokens ?? 0,
      cacheCreationTokens: json.usage?.cache_creation_input_tokens ?? 0,
      cacheReadTokens: json.usage?.cache_read_input_tokens ?? 0,
      webSearches: json.usage?.server_tool_use?.web_search_requests ?? 0,
      webFetches: json.usage?.server_tool_use?.web_fetch_requests ?? 0,
    };
  } catch {
    return null;
  }
}

function parseExpandedAgentFields(rawStdout: string): {
  stopReason: string | null;
  agentSubtype: string | null;
  agentResultText: string | null;
} {
  try {
    const json = JSON.parse(rawStdout);
    const stopReason = json.stop_reason ?? null;
    const agentSubtype = json.subtype ?? null;
    let agentResultText: string | null = null;
    if (typeof json.result === "string") {
      agentResultText = json.result.length > 5000 ? json.result.slice(0, 5000) : json.result;
    }
    return { stopReason, agentSubtype, agentResultText };
  } catch {
    return { stopReason: null, agentSubtype: null, agentResultText: null };
  }
}

function captureGitDiffStats(toolDir: string): DiffStats | null {
  try {
    // Check we have at least 2 commits
    const logResult = runCommand("git", ["rev-list", "--count", "HEAD"], { cwd: toolDir, timeout: 5000 });
    if (logResult.exitCode !== 0 || parseInt(logResult.stdout.trim(), 10) < 2) return null;

    const numstat = runCommand("git", ["diff", "--numstat", "HEAD~1", "HEAD"], { cwd: toolDir, timeout: 5000 });
    const addedFiles = runCommand("git", ["diff", "--diff-filter=A", "--name-only", "HEAD~1", "HEAD"], { cwd: toolDir, timeout: 5000 });
    const modifiedFiles = runCommand("git", ["diff", "--diff-filter=M", "--name-only", "HEAD~1", "HEAD"], { cwd: toolDir, timeout: 5000 });
    const deletedFiles = runCommand("git", ["diff", "--diff-filter=D", "--name-only", "HEAD~1", "HEAD"], { cwd: toolDir, timeout: 5000 });
    const pkgDiff = runCommand("git", ["diff", "HEAD~1", "HEAD", "--", "package.json"], { cwd: toolDir, timeout: 5000 });

    const filterBenchmark = (lines: string[]) => lines.filter(l => !l.startsWith("benchmark-"));

    let linesAdded = 0;
    let linesRemoved = 0;
    for (const line of numstat.stdout.trim().split("\n")) {
      if (!line) continue;
      const [added, removed, file] = line.split("\t");
      if (file && file.startsWith("benchmark-")) continue;
      if (added !== "-") linesAdded += parseInt(added, 10) || 0;
      if (removed !== "-") linesRemoved += parseInt(removed, 10) || 0;
    }

    const filesCreated = filterBenchmark(addedFiles.stdout.trim().split("\n").filter(Boolean)).length;
    const filesModified = filterBenchmark(modifiedFiles.stdout.trim().split("\n").filter(Boolean)).length;
    const filesDeleted = filterBenchmark(deletedFiles.stdout.trim().split("\n").filter(Boolean)).length;

    // Parse package.json diff for added/removed dependencies
    const packagesAdded: string[] = [];
    const packagesRemoved: string[] = [];
    if (pkgDiff.stdout) {
      for (const line of pkgDiff.stdout.split("\n")) {
        const depMatch = line.match(/^[+-]\s+"([^"]+)":\s+"[^"]+"/);
        if (!depMatch) continue;
        const pkg = depMatch[1];
        if (["name", "version", "private", "scripts", "description"].includes(pkg)) continue;
        if (line.startsWith("+")) packagesAdded.push(pkg);
        else if (line.startsWith("-")) packagesRemoved.push(pkg);
      }
    }

    return { filesCreated, filesModified, filesDeleted, linesAdded, linesRemoved, packagesAdded, packagesRemoved };
  } catch {
    return null;
  }
}

function parsePlaywrightResults(testsDir: string, currentTier: number): TestRunResults | null {
  const resultsFile = path.join(testsDir, "test-results.json");
  if (!fs.existsSync(resultsFile)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
    const testDetails: TestDetail[] = [];

    function walkSuites(suites: any[], parentSuiteName: string): void {
      for (const suite of suites) {
        const suiteName = suite.title || parentSuiteName;
        if (suite.specs) {
          for (const spec of suite.specs) {
            const file: string = spec.file || suite.file || "";
            const tierMatch = file.match(/tier(\d+)/);
            const tier = tierMatch ? parseInt(tierMatch[1], 10) : 0;

            for (const test of spec.tests || []) {
              for (const result of test.results || []) {
                let status: TestDetail["status"] = "failed";
                if (result.status === "passed" || result.status === "expected") status = "passed";
                else if (result.status === "timedOut") status = "timedOut";
                else if (result.status === "skipped") status = "skipped";

                testDetails.push({
                  name: spec.title || "",
                  suiteName,
                  file,
                  tier,
                  status,
                  durationMs: result.duration || 0,
                });
              }
            }
          }
        }
        if (suite.suites) {
          walkSuites(suite.suites, suiteName);
        }
      }
    }

    if (raw.suites) {
      walkSuites(raw.suites, "");
    }

    const passed = testDetails.filter(t => t.status === "passed").length;
    const failed = testDetails.filter(t => t.status === "failed" || t.status === "timedOut").length;
    const skipped = testDetails.filter(t => t.status === "skipped").length;
    const totalDuration = testDetails.reduce((s, t) => s + t.durationMs, 0);

    const regressions = testDetails.filter(
      t => t.tier > 0 && t.tier < currentTier && (t.status === "failed" || t.status === "timedOut")
    );

    return {
      testsTotal: testDetails.length,
      testsPassed: passed,
      testsFailed: failed,
      testsSkipped: skipped,
      testDurationMs: totalDuration,
      testResults: testDetails,
      regressions,
    };
  } catch {
    return null;
  }
}

function buildTestGlobs(upToTier: number): string[] {
  const globs: string[] = [];
  for (let t = 1; t <= upToTier; t++) {
    globs.push(`tier${t}-`);
  }
  return globs;
}

// ---------------------------------------------------------------------------
// Core: executeTask
// ---------------------------------------------------------------------------

interface ExecuteTaskOptions {
  task: Task;
  toolDir: string;
  toolName: string;
  toolDisplayName: string;
  tier: number;
  isFirstTask: boolean;
  sessionId: string | null;
  testsDir: string;
  category: string;
}

interface ExecuteTaskResult {
  taskResult: TaskResult;
  sessionId: string | null;
}

export function executeTask(options: ExecuteTaskOptions): ExecuteTaskResult {
  const { task, toolDir, toolName, toolDisplayName, tier, isFirstTask, testsDir } = options;
  let { sessionId } = options;

  // Replace {{tool}} placeholder with actual tool display name
  const resolvedPrompt = task.prompt.replace(/\{\{tool\}\}/g, toolDisplayName);

  console.log(
    chalk.blue(`\n${"=".repeat(60)}\nTask ${task.id}: ${task.tier} — ${task.description}\n${"=".repeat(60)}`)
  );
  debugLog(`Starting task ${task.id} (${task.tier})`);
  debugLog(`Resolved prompt: ${resolvedPrompt}`);
  debugLog(`Session ID from previous task: ${sessionId ?? "(none)"}`);

  let correctionCycles = 0;
  let outcome: "working" | "partial" | "failed" = "failed";
  let firstAttemptSuccess = false;
  let notes = "";
  const errorHistory: string[] = [];

  for (let cycle = 0; cycle <= CYCLE_CAP; cycle++) {
    let prompt: string;

    if (cycle === 0) {
      prompt = resolvedPrompt;
      console.log(chalk.cyan(`  Cycle ${cycle}: Sending initial prompt to agent...`));
    } else {
      // Error correction — notes holds the error message from previous iteration
      prompt = notes;
      console.log(chalk.yellow(`  Cycle ${cycle}: Sending error feedback to agent...`));
    }

    debugLog(`--- Task ${task.id}, Cycle ${cycle} ---`);

    // Build the cycle detail record
    const cycleDetail: CycleDetail = {
      taskId: task.id,
      cycle,
      promptSent: head(prompt, 500),
      agentExitCode: -1,
      agentSessionId: null,
      agentStdoutHead: "",
      agentStderrHead: "",
      agentDurationMs: 0,
      buildExitCode: null,
      buildError: null,
      testExitCode: null,
      testError: null,
      agentTimedOut: false,
      result: "agent_failed",
      metrics: null,
    };

    // 1. Invoke agent
    // On the very first invocation of the run, don't resume (no session yet).
    // On subsequent tasks/cycles, resume if we have a valid session ID.
    const useSessionId = (cycle === 0 && isFirstTask) ? null : sessionId;

    if (cycle === 0 && !isFirstTask && !sessionId) {
      debugLog(`Starting fresh session (no session ID from previous task — likely timed out). File changes from the previous task are preserved on disk.`);
      console.log(chalk.yellow(`  Starting fresh session (no session ID from previous task)`));
    }

    const agentResult = invokeAgent(prompt, useSessionId, toolDir);

    cycleDetail.agentExitCode = agentResult.exitCode;
    cycleDetail.agentSessionId = agentResult.sessionId;
    cycleDetail.agentStdoutHead = head(agentResult.output, 1000);
    cycleDetail.agentDurationMs = agentResult.durationMs;
    cycleDetail.agentTimedOut = agentResult.timedOut;
    cycleDetail.metrics = parseAgentMetrics(agentResult.rawStdout, agentResult.durationMs);

    const expandedFields = parseExpandedAgentFields(agentResult.rawStdout);
    cycleDetail.stopReason = expandedFields.stopReason;
    cycleDetail.agentSubtype = expandedFields.agentSubtype;
    cycleDetail.agentResultText = expandedFields.agentResultText;

    // Update session ID only if we got a valid one
    if (agentResult.sessionId) {
      sessionId = agentResult.sessionId;
    } else if (!sessionId) {
      debugLog(`WARNING: No session ID available after agent invocation`);
      console.log(chalk.red(`  WARNING: No session ID — agent may have failed to start`));
    }

    // If agent errored and this is the last cycle, bail
    if (agentResult.exitCode !== 0) {
      const errMsg = agentResult.timedOut
        ? `Agent timed out after ${agentResult.durationMs}ms — process was killed`
        : `Agent exited with code ${agentResult.exitCode} in ${agentResult.durationMs}ms`;
      debugLog(errMsg);
      errorHistory.push(`Cycle ${cycle}: ${errMsg}`);

      if (cycle === CYCLE_CAP) {
        outcome = "failed";
        notes = `Agent invocation failed after ${CYCLE_CAP} cycles. Last error:\n${truncateError(agentResult.output)}`;
        cycleDetail.result = "agent_failed";
        cycleDetails.push(cycleDetail);
        saveCycleLog();
        break;
      }

      // If the agent timed out with no session, bail early with a clear message
      if (agentResult.timedOut && !sessionId) {
        outcome = "failed";
        notes = `Task timed out and no session could be established. File changes from the agent are preserved on disk.`;
        cycleDetail.result = "agent_failed";
        cycleDetails.push(cycleDetail);
        saveCycleLog();
        console.log(chalk.red(`  Task timed out and no session could be established`));
        break;
      }

      // If the agent errored but we have no session, continuing will just fail again
      if (!sessionId) {
        outcome = "failed";
        notes = `Agent failed on cycle ${cycle} and no session ID was established. Cannot resume.\n\nOutput:\n${truncateError(agentResult.output)}`;
        cycleDetail.result = "agent_failed";
        cycleDetails.push(cycleDetail);
        saveCycleLog();
        console.log(chalk.red(`  Agent failed with no session ID — cannot continue this task`));
        break;
      }

      // Agent errored but we have a session — feed the error back
      notes = `The agent command failed with exit code ${agentResult.exitCode}:\n\n${truncateError(agentResult.output)}`;
      correctionCycles = cycle + 1;
      cycleDetail.result = "agent_failed";
      cycleDetails.push(cycleDetail);
      saveCycleLog();
      continue;
    }

    // 2. Build check
    console.log(chalk.gray("  Running build check..."));
    debugLog("Running build check: npm run build");
    const buildResult = runCommand("npm", ["run", "build"], {
      cwd: toolDir,
      timeout: BUILD_TIMEOUT,
    });
    debugLog(`  Build exit code: ${buildResult.exitCode}, duration: ${buildResult.durationMs}ms`);

    if (buildResult.exitCode !== 0) {
      const rawBuildError = buildResult.stderr || buildResult.stdout;
      const buildError = truncateError(rawBuildError);
      debugLog(`  Build failed. Error (tail):\n${buildError}`);

      cycleDetail.buildExitCode = buildResult.exitCode;
      cycleDetail.buildError = head(rawBuildError, 2000);
      cycleDetail.result = "build_failed";
      cycleDetails.push(cycleDetail);
      saveCycleLog();

      notes = `The build failed with the following errors:\n\n${buildError}`;
      errorHistory.push(`Cycle ${cycle}: Build failed`);
      correctionCycles = cycle + 1;

      if (cycle === CYCLE_CAP) {
        outcome = "failed";
        console.log(chalk.red(`  Build failed on final cycle`));
        break;
      }
      console.log(chalk.yellow(`  Build failed, will send error to agent`));
      continue;
    }

    cycleDetail.buildExitCode = 0;
    console.log(chalk.green("  Build passed"));

    // 3. Playwright tests (cumulative: tiers 1..current)
    console.log(chalk.gray(`  Running Playwright tests (tiers 1-${tier})...`));
    const testGlobs = buildTestGlobs(tier);
    debugLog(`Running tests: npx playwright test ${testGlobs.join(" ")}`);
    const testResult = runCommand(
      "npx",
      ["playwright", "test", ...testGlobs, "--config", path.join(testsDir, "playwright.config.ts")],
      {
        cwd: testsDir,
        timeout: TEST_TIMEOUT,
        env: {
          APP_DIR: toolDir,
          TOOL_NAME: toolName,
          BASE_URL: `http://localhost:${BENCHMARK_PORT}`,
          CATEGORY: options.category || "auth",
        },
      }
    );
    debugLog(`  Test exit code: ${testResult.exitCode}, duration: ${testResult.durationMs}ms`);

    // Capture Playwright JSON results regardless of pass/fail
    cycleDetail.testRunResults = parsePlaywrightResults(testsDir, tier);

    if (testResult.exitCode !== 0) {
      const rawTestError = testResult.stdout + "\n" + testResult.stderr;
      const testError = truncateError(rawTestError);
      debugLog(`  Tests failed. Error (tail):\n${testError}`);

      cycleDetail.testExitCode = testResult.exitCode;
      cycleDetail.testError = head(rawTestError, 2000);
      cycleDetail.result = "tests_failed";
      cycleDetails.push(cycleDetail);
      saveCycleLog();

      notes = `The automated verification tests failed:\n\n${testError}`;
      errorHistory.push(`Cycle ${cycle}: Tests failed`);
      correctionCycles = cycle + 1;

      if (cycle === CYCLE_CAP) {
        // Check if some tests passed (partial)
        const passedMatch = testError.match(/(\d+) passed/);
        const failedMatch = testError.match(/(\d+) failed/);
        if (passedMatch && failedMatch) {
          outcome = "partial";
        } else {
          outcome = "failed";
        }
        console.log(chalk.red(`  Tests failed on final cycle — ${outcome}`));
        break;
      }
      console.log(chalk.yellow(`  Tests failed, will send error to agent`));
      continue;
    }

    cycleDetail.testExitCode = 0;
    cycleDetail.result = "passed";
    cycleDetails.push(cycleDetail);
    saveCycleLog();

    // 4. All passed!
    console.log(chalk.green(`  All tests passed!`));
    firstAttemptSuccess = cycle === 0;
    correctionCycles = cycle;
    outcome = "working";
    notes = "";
    break;
  }

  // Build a summary notes string that includes error history for debugging
  const finalNotes = outcome === "working"
    ? ""
    : `${notes}\n\n--- Error history ---\n${errorHistory.join("\n")}`;

  const taskMetrics = aggregateMetrics(
    cycleDetails.filter(c => c.taskId === task.id).map(c => c.metrics)
  );

  // Extract expanded fields from the final cycle
  const taskCycles = cycleDetails.filter(c => c.taskId === task.id);
  const finalCycle = taskCycles[taskCycles.length - 1];
  const lastTestCycle = [...taskCycles].reverse().find(c => c.testRunResults);

  const taskResult: TaskResult = {
    taskId: task.id,
    tier: task.tier,
    prompt: resolvedPrompt,
    firstAttemptSuccess,
    correctionCycles,
    hallucinationCount: null, // not measurable in automated mode
    hallucinationNotes: "",
    documentationDependency: null, // not measurable in automated mode
    outcome,
    notes: finalNotes.trim(),
    timestamp: new Date().toISOString(),
    metrics: taskMetrics,
    stopReason: finalCycle?.stopReason ?? null,
    agentSubtype: finalCycle?.agentSubtype ?? null,
    agentResultText: finalCycle?.agentResultText ?? null,
    finalTestRunResults: lastTestCycle?.testRunResults ?? undefined,
  };

  console.log(
    chalk.bold(
      `  Result: ${outcome === "working" ? chalk.green(outcome) : outcome === "partial" ? chalk.yellow(outcome) : chalk.red(outcome)} | ` +
        `First attempt: ${firstAttemptSuccess ? "yes" : "no"} | Cycles: ${correctionCycles}`
    )
  );
  debugLog(`Task ${task.id} complete: ${outcome}, cycles: ${correctionCycles}`);

  return { taskResult, sessionId };
}

// ---------------------------------------------------------------------------
// Orchestrator: autoRun
// ---------------------------------------------------------------------------

interface AutoRunOptions {
  category: string;
  tool: string;
  root?: string;
  force?: boolean;
  agentVersion?: string;
}

function checkSessionIsolation(): void {
  try {
    // Look for other claude processes (excluding our own process tree)
    const result = execSync("pgrep -x claude 2>/dev/null || true", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    const pids = result.split("\n").filter(Boolean);
    // pgrep -x matches exact process name; warn if any claude processes exist beyond our own
    if (pids.length > 1) {
      console.log(chalk.yellow.bold(
        "\n╔══════════════════════════════════════════════════════════════╗\n" +
        "║  WARNING: Other Claude Code sessions may be active.        ║\n" +
        "║                                                            ║\n" +
        "║  Concurrent sessions sharing the same API account cause    ║\n" +
        "║  contention that inflates wall time, triggers timeouts,    ║\n" +
        "║  and corrupts cost measurements.                           ║\n" +
        "║                                                            ║\n" +
        "║  For reliable benchmark results, close all other Claude    ║\n" +
        "║  Code sessions before running.                             ║\n" +
        "╚══════════════════════════════════════════════════════════════╝\n"
      ));
    }
  } catch {
    // pgrep not available or failed — not critical
  }
}

export async function autoRun(options: AutoRunOptions): Promise<void> {
  const { category, tool, force = false, agentVersion = "latest" } = options;
  const root = options.root || process.cwd();

  // Pre-run: check for concurrent sessions
  checkSessionIsolation();

  // Validate category and tool
  const categoryDef = categories[category];
  if (!categoryDef) {
    console.error(chalk.red(`Unknown category: ${category}`));
    console.error(`Available: ${Object.keys(categories).join(", ")}`);
    process.exit(1);
  }
  if (!categoryDef.tools.includes(tool)) {
    console.error(chalk.red(`Unknown tool: ${tool}`));
    console.error(`Available for ${category}: ${categoryDef.tools.join(", ")}`);
    process.exit(1);
  }

  const toolDir = path.resolve(root, "runs", category, tool);
  const starterDir = path.resolve(root, categoryDef.starterAppPath || "starter-app");
  const testsDir = path.resolve(root, "cli", "tests");
  const tasks = categoryDef.tasks;

  // Human-readable display name for the tool (e.g., "clerk" → "Clerk")
  const toolDisplayName = tool.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  console.log(chalk.bold(`\nAutomated Benchmark Run`));
  console.log(chalk.gray(`Category: ${category} | Tool: ${toolDisplayName} | Tasks: ${tasks.length}`));
  console.log(chalk.gray(`Tool dir: ${toolDir}`));
  console.log(chalk.gray(`Tests dir: ${testsDir}\n`));

  // 1. Setup — non-interactive
  await setupToolDir(starterDir, toolDir, force, tool, category);

  // Reset the database to ensure a clean starting state (drop + recreate)
  const envPath = path.join(toolDir, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const dbName = extractDbName(envContent);
    if (dbName) {
      console.log(chalk.blue(`Resetting database: ${dbName}...`));
      runCommand("dropdb", ["--if-exists", "-U", PGUSER, dbName], { timeout: 10000 });
      const createResult = runCommand("createdb", ["-U", PGUSER, dbName], { timeout: 10000 });
      if (createResult.exitCode !== 0) {
        console.error(chalk.red(`Failed to create database ${dbName}: ${createResult.stderr}`));
        process.exit(1);
      }
      console.log(chalk.green(`Database ${dbName} reset`));
    }
  }

  // Initialize debug + cycle logs
  initDebugLog(toolDir);
  initCycleLog(toolDir);
  debugLog(`Auto-run started: category=${category}, tool=${tool}, tasks=${tasks.length}`);
  debugLog(`Tool dir: ${toolDir}`);
  debugLog(`Tests dir: ${testsDir}`);

  // Verify claude CLI is available
  try {
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDECODE;
    const claudeVersion = execFileSync("claude", ["--version"], {
      encoding: "utf-8",
      timeout: 10000,
      env: cleanEnv,
    }).trim();
    debugLog(`Claude CLI version: ${claudeVersion}`);
    console.log(chalk.gray(`Claude CLI: ${claudeVersion}`));
  } catch (err: any) {
    console.error(chalk.red(`Cannot find 'claude' CLI on PATH. Is it installed?`));
    debugLog(`Claude CLI check failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Install dependencies
  console.log(chalk.blue("Installing dependencies..."));
  const installResult = runCommand("npm", ["install"], { cwd: toolDir, timeout: BUILD_TIMEOUT });
  if (installResult.exitCode !== 0) {
    console.error(chalk.red("npm install failed:"));
    console.error(installResult.stderr);
    debugLog(`npm install failed: ${installResult.stderr}`);
    process.exit(1);
  }
  console.log(chalk.green("Dependencies installed\n"));

  // 3. Run tasks sequentially
  const benchmarkRun: BenchmarkRun = {
    tool,
    category,
    agent: "claude-code",
    agentVersion,
    protocolVersion: "0.1",
    testMode: "integration" as const,
    startedAt: new Date().toISOString(),
    completedAt: "",
    results: [],
  };

  let sessionId: string | null = null;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const tier = tierNumber(task.tier);

    const result = executeTask({
      task,
      toolDir,
      toolName: tool,
      toolDisplayName,
      tier,
      isFirstTask: i === 0,
      sessionId,
      testsDir,
      category,
    });

    sessionId = result.sessionId;
    benchmarkRun.results.push(result.taskResult);

    // Git commit
    let committed = false;
    try {
      execSync("git add -A", { cwd: toolDir, stdio: "pipe" });
      execSync(
        `git commit -m "benchmark: task ${task.id} (${task.tier}) — ${result.taskResult.outcome}" --allow-empty`,
        { cwd: toolDir, stdio: "pipe" }
      );
      committed = true;
      console.log(chalk.gray(`  Committed: task ${task.id} (${task.tier}) — ${result.taskResult.outcome}`));
    } catch {
      console.log(chalk.gray(`  No changes to commit for task ${task.id}`));
    }

    // Capture git diff stats after commit
    if (committed) {
      const diffStats = captureGitDiffStats(toolDir);
      if (diffStats) {
        result.taskResult.diffStats = diffStats;
        result.taskResult.noChangesNeeded =
          diffStats.filesCreated === 0 && diffStats.filesModified === 0 && diffStats.filesDeleted === 0;
        debugLog(`  DiffStats: +${diffStats.linesAdded}/-${diffStats.linesRemoved}, ${diffStats.filesCreated} created, ${diffStats.packagesAdded.length} pkgs added`);
      }
    }

    // Save intermediate log (crash recovery)
    benchmarkRun.completedAt = new Date().toISOString();
    const logPath = path.join(toolDir, "benchmark-log.json");
    fs.writeFileSync(logPath, JSON.stringify(benchmarkRun, null, 2));
    console.log(chalk.gray(`  Saved intermediate log to ${logPath}`));

    // Running tally
    const summary = calculateSummary(benchmarkRun);
    console.log(
      chalk.gray(
        `  Running: ${benchmarkRun.results.length}/${tasks.length} tasks | ` +
          `Pass: ${summary.passRate} | ` +
          `First-attempt: ${summary.firstAttemptRate} | ` +
          `Band: ${summary.overallBand}`
      )
    );
  }

  // 4. Finalize
  benchmarkRun.metrics = aggregateMetrics(benchmarkRun.results.map(r => r.metrics));
  benchmarkRun.completedAt = new Date().toISOString();

  // Auto-archive: determine run number and write both benchmark-log.json and archived copy
  const existingRunNums = fs.readdirSync(toolDir)
    .filter(f => /^benchmark-log-run\d+\.json$/.test(f))
    .map(f => parseInt(f.match(/run(\d+)/)?.[1] ?? "0", 10));
  const nextRunNum = existingRunNums.length > 0 ? Math.max(...existingRunNums) + 1 : 1;
  benchmarkRun.runNumber = nextRunNum;

  const logPath = path.join(toolDir, "benchmark-log.json");
  fs.writeFileSync(logPath, JSON.stringify(benchmarkRun, null, 2));

  const archivePath = path.join(toolDir, `benchmark-log-run${nextRunNum}.json`);
  fs.copyFileSync(logPath, archivePath);
  console.log(chalk.green(`Archived as benchmark-log-run${nextRunNum}.json`));

  const summary = calculateSummary(benchmarkRun);

  console.log(chalk.bold(`\n${"=".repeat(60)}`));
  console.log(chalk.bold("Benchmark Complete"));
  console.log(chalk.bold(`${"=".repeat(60)}\n`));
  console.log(`  Pass rate:         ${summary.passRate}`);
  console.log(`  First-attempt rate: ${summary.firstAttemptRate}`);
  console.log(`  Avg cycles:        ${summary.avgCorrectionCycles.toFixed(1)}`);
  console.log(`  Hallucinations:    ${summary.totalHallucinations === null ? "N/A (automated mode)" : summary.totalHallucinations}`);
  console.log(`  Overall band:      ${chalk.bold(summary.overallBand)}\n`);

  debugLog(`Run complete. Pass: ${summary.passRate}, Band: ${summary.overallBand}`);
  debugLog(`Debug log: ${debugLogPath}`);
  debugLog(`Cycle log: ${cycleLogPath}`);

  // Generate scorecard — collect all runs (multi-run aware)
  const scorecardDir = path.resolve(root, "runs", category);
  const allRunsMap = loadAllRuns(scorecardDir);
  // Ensure current run is included in its tool's run list
  const toolRuns = allRunsMap.get(tool) ?? [];
  const existingIdx = toolRuns.findIndex(r => r.runNumber === benchmarkRun.runNumber);
  if (existingIdx >= 0) toolRuns[existingIdx] = benchmarkRun;
  else toolRuns.push(benchmarkRun);
  allRunsMap.set(tool, toolRuns);
  const scorecardContent = generateScorecard(category, allRunsMap);
  const scorecardPath = path.join(scorecardDir, "SCORECARD.md");
  fs.writeFileSync(scorecardPath, scorecardContent);
  console.log(chalk.green(`Scorecard written to ${scorecardPath}`));
  console.log(chalk.gray(`Debug log: ${debugLogPath}`));
  console.log(chalk.gray(`Cycle log: ${cycleLogPath}`));

  if (category === "auth") {
    console.log(chalk.yellow(
      "\nNote: Test accounts created in the auth provider dashboard should be " +
      "cleaned up manually between benchmark rounds for a pristine test environment."
    ));
  }
}

// ---------------------------------------------------------------------------
// Backfill: extract metrics from existing cycle logs
// ---------------------------------------------------------------------------

function extractMetricFromHead(stdout: string, wallTimeMs: number): AgentMetrics | null {
  // The agentStdoutHead is a truncated JSON string — extract fields via regex
  const num = (pattern: RegExp): number => {
    const m = stdout.match(pattern);
    return m ? Number(m[1]) : 0;
  };

  const durationApi = num(/"duration_api_ms"\s*:\s*(\d+)/);
  const turns = num(/"num_turns"\s*:\s*(\d+)/);
  const cost = num(/"total_cost_usd"\s*:\s*([\d.]+(?:e[+-]?\d+)?)/);
  const inputTokens = num(/"input_tokens"\s*:\s*(\d+)/);
  const outputTokens = num(/"output_tokens"\s*:\s*(\d+)/);
  const cacheCreation = num(/"cache_creation_input_tokens"\s*:\s*(\d+)/);
  const cacheRead = num(/"cache_read_input_tokens"\s*:\s*(\d+)/);
  const webSearches = num(/"web_search_requests"\s*:\s*(\d+)/);
  const webFetches = num(/"web_fetch_requests"\s*:\s*(\d+)/);

  // If we couldn't find any meaningful data, return null
  if (turns === 0 && cost === 0 && outputTokens === 0) return null;

  return {
    durationMs: wallTimeMs,
    apiTimeMs: durationApi,
    turns,
    costUsd: cost,
    inputTokens,
    outputTokens,
    cacheCreationTokens: cacheCreation,
    cacheReadTokens: cacheRead,
    webSearches,
    webFetches,
  };
}

export async function backfillMetrics(options: { category: string; root?: string }): Promise<void> {
  const root = options.root || process.cwd();
  const categoryDir = path.resolve(root, "runs", options.category);

  if (!fs.existsSync(categoryDir)) {
    console.error(chalk.red(`Category directory not found: ${categoryDir}`));
    process.exit(1);
  }

  const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
  const toolDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (toolDirs.length === 0) {
    console.error(chalk.red(`No tool directories found in ${categoryDir}`));
    process.exit(1);
  }

  const allRuns: BenchmarkRun[] = [];

  for (const tool of toolDirs) {
    const toolDir = path.join(categoryDir, tool);
    const cyclePath = path.join(toolDir, "benchmark-cycles.json");
    const logPath = path.join(toolDir, "benchmark-log.json");

    if (!fs.existsSync(cyclePath) || !fs.existsSync(logPath)) {
      console.log(chalk.yellow(`Skipping ${tool} — missing cycle or log data`));
      continue;
    }

    console.log(chalk.blue(`\nBackfilling metrics for ${tool}...`));

    const cycles: CycleDetail[] = JSON.parse(fs.readFileSync(cyclePath, "utf-8"));
    const run: BenchmarkRun = JSON.parse(fs.readFileSync(logPath, "utf-8"));

    // Extract metrics from each cycle's truncated stdout
    for (const cycle of cycles) {
      if (!cycle.metrics) {
        cycle.metrics = extractMetricFromHead(cycle.agentStdoutHead, cycle.agentDurationMs);
        if (cycle.metrics) {
          console.log(chalk.gray(`  Task ${cycle.taskId} cycle ${cycle.cycle}: ${cycle.metrics.turns} turns, $${cycle.metrics.costUsd.toFixed(2)}, ${cycle.metrics.outputTokens} output tokens`));
        } else {
          console.log(chalk.yellow(`  Task ${cycle.taskId} cycle ${cycle.cycle}: could not extract metrics`));
        }
      }
    }

    // Aggregate into task results
    for (const result of run.results) {
      const taskCycles = cycles.filter(c => c.taskId === result.taskId);
      result.metrics = aggregateMetrics(taskCycles.map(c => c.metrics));
    }

    // Aggregate into run
    run.metrics = aggregateMetrics(run.results.map(r => r.metrics));

    // Write updated files
    fs.writeFileSync(cyclePath, JSON.stringify(cycles, null, 2));
    fs.writeFileSync(logPath, JSON.stringify(run, null, 2));

    console.log(chalk.green(`  Updated ${cyclePath}`));
    console.log(chalk.green(`  Updated ${logPath}`));

    const m = run.metrics!;
    console.log(chalk.bold(`  Totals: ${m.turns} turns · $${m.costUsd.toFixed(2)} · ${m.outputTokens} output tokens · ${Math.round(m.durationMs / 1000)}s wall time`));

    allRuns.push(run);
  }

  // Regenerate scorecard (multi-run aware)
  if (allRuns.length > 0) {
    const { generateScorecard: genSc, loadAllRuns: loadRuns } = await import("./scorecard.js");
    const allRunsMap = loadRuns(categoryDir);
    const scorecardContent = genSc(options.category, allRunsMap);
    const scorecardPath = path.join(categoryDir, "SCORECARD.md");
    fs.writeFileSync(scorecardPath, scorecardContent);
    console.log(chalk.green(`\nScorecard written to ${scorecardPath}`));
  }
}

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

async function setupToolDir(
  starterDir: string,
  toolDir: string,
  force: boolean,
  toolName?: string,
  category?: string
): Promise<void> {
  if (fs.existsSync(toolDir)) {
    if (!force) {
      console.error(
        chalk.red(
          `Tool directory already exists: ${toolDir}\nUse --force to replace it (preserves .env)`
        )
      );
      process.exit(1);
    }

    // Preserve .env if it exists
    let envContent: string | null = null;
    const envPath = path.join(toolDir, ".env");
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
      console.log(chalk.gray("Preserved .env file"));
    }

    // Preserve archived benchmark logs (benchmark-log-run*.json)
    const archivedLogs: { name: string; content: string }[] = [];
    for (const f of fs.readdirSync(toolDir)) {
      if (/^benchmark-log-run\d+\.json$/.test(f)) {
        archivedLogs.push({
          name: f,
          content: fs.readFileSync(path.join(toolDir, f), "utf-8"),
        });
      }
    }
    if (archivedLogs.length > 0) {
      console.log(chalk.gray(`Preserved ${archivedLogs.length} archived benchmark log(s)`));
    }

    // Remove existing dir
    fs.rmSync(toolDir, { recursive: true, force: true });
    fs.mkdirSync(toolDir, { recursive: true });

    // Restore .env
    if (envContent) {
      fs.writeFileSync(envPath, envContent);
    }

    // Restore archived benchmark logs
    for (const log of archivedLogs) {
      fs.writeFileSync(path.join(toolDir, log.name), log.content);
    }
  } else {
    fs.mkdirSync(toolDir, { recursive: true });
  }

  // Copy starter app
  console.log(chalk.blue("Copying starter app..."));
  copyDirSync(starterDir, toolDir, [".git", "node_modules", ".next", ".env"]);

  // Init git
  execSync("git init", { cwd: toolDir, stdio: "pipe" });
  execSync("git add -A", { cwd: toolDir, stdio: "pipe" });
  execSync('git commit -m "baseline: starter app"', {
    cwd: toolDir,
    stdio: "pipe",
  });

  // Copy .env from starter if no .env exists yet (fresh setup)
  const envSrc = path.join(starterDir, ".env");
  const envDest = path.join(toolDir, ".env");
  if (!fs.existsSync(envDest) && fs.existsSync(envSrc)) {
    let envContent = fs.readFileSync(envSrc, "utf-8");
    // Replace database name with tool-specific name to avoid migration collisions
    if (toolName) {
      const oldDbName = extractDbName(envContent);
      const newDbName = `afs_${category ?? "default"}_${toolName.replace(/-/g, "_")}`;
      if (oldDbName) {
        envContent = envContent.replace(oldDbName, newDbName);
      }
      fs.writeFileSync(envDest, envContent);
      console.log(chalk.gray(`Copied .env with database: ${newDbName}`));
    } else {
      fs.writeFileSync(envDest, envContent);
      console.log(chalk.gray("Copied .env"));
    }
  }

  console.log(chalk.green("Setup complete — starter app copied and git initialized"));
}

function extractDbName(envContent: string): string | null {
  const match = envContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?\s*$/m);
  if (!match) return null;
  try {
    const url = new URL(match[1]);
    // pathname is "/dbname" — strip leading slash
    return url.pathname.replace(/^\//, "");
  } catch {
    // Fallback: extract last path segment before any query params
    const pathMatch = match[1].match(/\/([^/?]+?)(?:\?.*)?$/);
    return pathMatch?.[1] ?? null;
  }
}

function copyDirSync(src: string, dest: string, exclude: string[]): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
