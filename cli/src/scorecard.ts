import * as fs from "fs";
import * as path from "path";
import {
  BenchmarkRun, BenchmarkSummary, TaskResult,
  AgentMetrics, aggregateMetrics, aggregateDiffStats,
  SoloLevel, SOLO_LABELS, SkillType, CognitiveProfile, tierNumber,
} from "./types.js";

const CYCLE_CAP = 10;

// ---------------------------------------------------------------------------
// Multi-run loading & aggregation
// ---------------------------------------------------------------------------

export function loadAllRuns(categoryDir: string): Map<string, BenchmarkRun[]> {
  const result = new Map<string, BenchmarkRun[]>();
  if (!fs.existsSync(categoryDir)) return result;

  for (const entry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const toolDir = path.join(categoryDir, entry.name);
    const runs: BenchmarkRun[] = [];

    // Collect archived runs
    for (const f of fs.readdirSync(toolDir)) {
      if (/^benchmark-log-run\d+\.json$/.test(f)) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(toolDir, f), "utf-8")) as BenchmarkRun;
          // Infer runNumber from filename if not present
          if (data.runNumber === undefined) {
            data.runNumber = parseInt(f.match(/run(\d+)/)?.[1] ?? "0", 10);
          }
          runs.push(data);
        } catch { /* skip malformed */ }
      }
    }

    // Fallback: if no archived runs, use benchmark-log.json as single run
    if (runs.length === 0) {
      const logPath = path.join(toolDir, "benchmark-log.json");
      if (fs.existsSync(logPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(logPath, "utf-8")) as BenchmarkRun;
          if (data.runNumber === undefined) data.runNumber = 1;
          runs.push(data);
        } catch { /* skip */ }
      }
    }

    // Sort by runNumber
    runs.sort((a, b) => (a.runNumber ?? 0) - (b.runNumber ?? 0));
    if (runs.length > 0) result.set(entry.name, runs);
  }
  return result;
}

export function countCompletedRuns(toolDir: string): number {
  if (!fs.existsSync(toolDir)) return 0;
  let count = 0;
  for (const f of fs.readdirSync(toolDir)) {
    if (/^benchmark-log-run\d+\.json$/.test(f)) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(toolDir, f), "utf-8"));
        if (data.completedAt) count++;
      } catch { /* skip malformed */ }
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Aggregate statistics
// ---------------------------------------------------------------------------

function statMean(vals: number[]): number {
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function statMedian(vals: number[]): number {
  if (vals.length === 0) return 0;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function statRange(vals: number[]): [number, number] {
  if (vals.length === 0) return [0, 0];
  return [Math.min(...vals), Math.max(...vals)];
}

export interface AggregateMetricStats {
  values: number[];
  mean: number;
  median: number;
  range: [number, number];
}

export interface RunAggregate {
  runCount: number;
  passRate: AggregateMetricStats;
  firstAttemptRate: AggregateMetricStats;
  avgCycles: AggregateMetricStats;
  costUsd: AggregateMetricStats;
  wallTimeMin: AggregateMetricStats;
  bands: string[];
}

function buildStats(values: number[]): AggregateMetricStats {
  return { values, mean: statMean(values), median: statMedian(values), range: statRange(values) };
}

export function computeAggregate(runs: BenchmarkRun[]): RunAggregate {
  const passRates: number[] = [];
  const firstAttemptRates: number[] = [];
  const avgCycles: number[] = [];
  const costs: number[] = [];
  const wallTimes: number[] = [];
  const bands: string[] = [];

  for (const run of runs) {
    const total = run.results.length;
    if (total === 0) continue;
    const working = run.results.filter(r => r.outcome === "working").length;
    const firstAttempt = run.results.filter(r => r.firstAttemptSuccess).length;
    const cycles = run.results.reduce((sum, r) => sum + r.correctionCycles, 0) / total;

    passRates.push(working);
    firstAttemptRates.push(firstAttempt);
    avgCycles.push(cycles);
    if (run.metrics?.costUsd !== undefined) costs.push(run.metrics.costUsd);
    if (run.metrics?.durationMs !== undefined) wallTimes.push(run.metrics.durationMs / 60000);

    const summary = calculateSummary(run);
    bands.push(summary.overallBand);
  }

  return {
    runCount: runs.length,
    passRate: buildStats(passRates),
    firstAttemptRate: buildStats(firstAttemptRates),
    avgCycles: buildStats(avgCycles),
    costUsd: buildStats(costs),
    wallTimeMin: buildStats(wallTimes),
    bands,
  };
}

export function computeSoloLevel(result: TaskResult): SoloLevel {
  if (result.outcome === "failed" && result.correctionCycles >= CYCLE_CAP) return 0;
  if (result.outcome === "partial") return 1;
  if (result.outcome === "failed") return 1;
  // outcome === "working" from here
  if (result.correctionCycles >= 3) return 1;
  const hasRegressions = (result.finalTestRunResults?.regressions.length ?? 0) > 0;
  if (result.correctionCycles >= 1 || (result.firstAttemptSuccess && hasRegressions)) return 2;
  // firstAttemptSuccess, no regressions
  if (result.firstAttemptSuccess && !hasRegressions && (result.diffStats?.linesAdded ?? 0) > 500) return 3;
  return 4;
}

export function calculateSummary(run: BenchmarkRun): BenchmarkSummary {
  const results = run.results;
  const total = results.length;

  if (total === 0) {
    return {
      tool: run.tool,
      passRate: "0/0",
      firstAttemptRate: "0/0",
      avgCorrectionCycles: 0,
      totalHallucinations: 0,
      overallBand: "Failure",
    };
  }

  const working = results.filter((r) => r.outcome === "working").length;
  const firstAttempt = results.filter((r) => r.firstAttemptSuccess).length;
  const totalCycles = results.reduce((sum, r) => sum + r.correctionCycles, 0);
  const avgCycles = totalCycles / total;
  const measuredHallucinations = results.filter(r => r.hallucinationCount !== null);
  const totalHallucinations: number | null = measuredHallucinations.length > 0
    ? measuredHallucinations.reduce((sum, r) => sum + (r.hallucinationCount ?? 0), 0)
    : null;

  const firstAttemptPct = firstAttempt / total;

  let band: BenchmarkSummary["overallBand"];
  if (firstAttemptPct >= 0.8 && avgCycles <= 1) {
    band = "Fluent";
  } else if (firstAttemptPct >= 0.5 && avgCycles <= 3) {
    band = "Functional";
  } else if (avgCycles < 7) {
    band = "Friction";
  } else {
    band = "Failure";
  }

  const metrics = aggregateMetrics(results.map(r => r.metrics));

  // Derived metrics
  const totalDiffStats = aggregateDiffStats(results.map(r => r.diffStats));

  const costPerSuccessfulTask = working > 0 && metrics.costUsd > 0
    ? metrics.costUsd / working : undefined;

  const outputTokensPerTurn = metrics.turns > 0
    ? Math.round(metrics.outputTokens / metrics.turns) : undefined;

  const correctionLinesAdded = results
    .filter(r => r.correctionCycles > 0 && r.diffStats)
    .reduce((sum, r) => sum + (r.diffStats?.linesAdded ?? 0), 0);

  const noChangesCount = results.filter(r => r.noChangesNeeded).length;

  const totalRegressions = results.reduce(
    (sum, r) => sum + (r.finalTestRunResults?.regressions.length ?? 0), 0
  );

  // --- Thinking-framework-derived metrics ---

  // Metacognitive Efficiency (Pintrich/Marzano): tier-weighted first-attempt efficiency
  let metacogWeightedSum = 0;
  let metacogWeightSum = 0;
  for (const r of results) {
    const w = tierNumber(r.tier);
    metacogWeightedSum += w * (1 / (1 + r.correctionCycles));
    metacogWeightSum += w;
  }
  const metacognitiveEfficiency = metacogWeightSum > 0
    ? Math.round((metacogWeightedSum / metacogWeightSum) * 1000) / 1000
    : undefined;

  // Self-Regulation Index (Pintrich's 4 phases)
  const planningQuality = firstAttempt / total;
  const monitoringQuality = totalHallucinations !== null
    ? 1 - Math.min(totalHallucinations / total, 1)
    : 1;
  const tasksNeedingCorrection = results.filter(r => r.correctionCycles > 0).length;
  const tasksFixedQuickly = results.filter(r => r.correctionCycles > 0 && r.correctionCycles <= 2 && r.outcome === "working").length;
  const controlQuality = tasksNeedingCorrection > 0
    ? tasksFixedQuickly / tasksNeedingCorrection
    : 1;
  const reflectionQuality = 1 - Math.min(totalRegressions / total, 1);
  const selfRegulationIndex = Math.round(
    ((planningQuality + monitoringQuality + controlQuality + reflectionQuality) / 4) * 1000
  ) / 1000;

  // SOLO Quality (Biggs & Collis)
  const soloLevels = results.map(computeSoloLevel);
  const avgSoloLevel = Math.round((soloLevels.reduce((s: number, l) => s + l, 0 as number) / total) * 10) / 10;

  // Skill Type (Romiszowski)
  const skillType: SkillType = firstAttemptPct >= 0.6
    ? "Reproductive"
    : firstAttemptPct < 0.4
      ? "Productive"
      : "Mixed";

  // Cognitive Profile (integrated model)
  const cognitiveProfile: CognitiveProfile = {
    informationGathering: {
      webSearches: metrics.webSearches,
      webFetches: metrics.webFetches,
      docDependency: results.some(r => r.documentationDependency === null)
        ? "N/A (automated mode)"
        : results.filter(r => r.documentationDependency !== "none").length > 0
          ? `${results.filter(r => r.documentationDependency !== "none").length}/${total} tasks`
          : "none",
      cacheReadTokens: metrics.cacheReadTokens,
    },
    buildingUnderstanding: {
      inputTokens: metrics.inputTokens,
      cacheCreationTokens: metrics.cacheCreationTokens,
    },
    productiveThinking: {
      linesAdded: totalDiffStats.linesAdded,
      linesRemoved: totalDiffStats.linesRemoved,
      filesCreated: totalDiffStats.filesCreated,
      filesModified: totalDiffStats.filesModified,
      packagesAdded: totalDiffStats.packagesAdded.length,
      outputTokens: metrics.outputTokens,
    },
    strategicReflective: {
      correctionCycles: totalCycles,
      firstAttemptRate: `${firstAttempt}/${total}`,
      hallucinations: totalHallucinations ?? 0,
      regressions: totalRegressions,
    },
  };

  return {
    tool: run.tool,
    passRate: `${working}/${total}`,
    firstAttemptRate: `${firstAttempt}/${total}`,
    avgCorrectionCycles: Math.round(avgCycles * 10) / 10,
    totalHallucinations,
    overallBand: band,
    metrics,
    totalDiffStats,
    costPerSuccessfulTask,
    outputTokensPerTurn,
    correctionLinesAdded,
    noChangesCount,
    totalRegressions,
    metacognitiveEfficiency,
    selfRegulationIndex,
    avgSoloLevel,
    skillType,
    cognitiveProfile,
  };
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtNum(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export function generateScorecard(
  category: string,
  allRuns: Map<string, BenchmarkRun[]>
): string {
  const categoryDisplay = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Use the latest run per tool for detailed display
  const latestRuns: BenchmarkRun[] = [];
  for (const [, toolRuns] of allRuns) {
    if (toolRuns.length > 0) latestRuns.push(toolRuns[toolRuns.length - 1]);
  }
  const summaries = latestRuns.map(calculateSummary);

  let md = `# Agent Fluency Score — ${categoryDisplay} Benchmark\n\n`;
  md += `**Protocol Version:** ${latestRuns[0]?.protocolVersion ?? "0.1"}\n`;
  md += `**Agent:** ${latestRuns[0]?.agent ?? "Claude Code"}\n`;
  md += `**Date:** ${new Date().toISOString().split("T")[0]}\n\n`;
  md += `---\n\n`;

  // Per-tool details
  for (const run of latestRuns) {
    const toolRuns = allRuns.get(run.tool) ?? [run];
    const toolDisplay = run.tool.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const summary = summaries.find((s) => s.tool === run.tool)!;

    md += `## ${toolDisplay}\n\n`;

    // Multi-run aggregate summary (if more than 1 run)
    if (toolRuns.length > 1) {
      const agg = computeAggregate(toolRuns);
      const totalTasks = run.results.length;
      md += `### Aggregate Results (${agg.runCount} runs)\n\n`;
      md += `| Metric |`;
      for (const tr of toolRuns) md += ` Run ${tr.runNumber ?? "?"} |`;
      md += ` Mean | Median | Range |\n`;
      md += `|--------|`;
      for (const _ of toolRuns) md += `:---:|`;
      md += `:---:|:---:|:---:|\n`;

      // Pass Rate
      md += `| Pass Rate |`;
      for (let i = 0; i < toolRuns.length; i++) md += ` ${agg.passRate.values[i] ?? "—"}/${totalTasks} |`;
      md += ` ${fmtNum(agg.passRate.mean, 1)}/${totalTasks} | ${agg.passRate.median}/${totalTasks} | ${agg.passRate.range[0]}–${agg.passRate.range[1]} |\n`;

      // First-Attempt
      md += `| First-Attempt |`;
      for (let i = 0; i < toolRuns.length; i++) md += ` ${agg.firstAttemptRate.values[i] ?? "—"}/${totalTasks} |`;
      md += ` ${fmtNum(agg.firstAttemptRate.mean, 1)}/${totalTasks} | ${agg.firstAttemptRate.median}/${totalTasks} | ${agg.firstAttemptRate.range[0]}–${agg.firstAttemptRate.range[1]} |\n`;

      // Avg Cycles
      md += `| Avg Cycles |`;
      for (let i = 0; i < toolRuns.length; i++) md += ` ${fmtNum(agg.avgCycles.values[i] ?? 0)} |`;
      md += ` ${fmtNum(agg.avgCycles.mean)} | ${fmtNum(agg.avgCycles.median)} | ${fmtNum(agg.avgCycles.range[0])}–${fmtNum(agg.avgCycles.range[1])} |\n`;

      // Cost
      md += `| Cost |`;
      for (let i = 0; i < toolRuns.length; i++) md += ` $${fmtNum(agg.costUsd.values[i] ?? 0)} |`;
      md += ` $${fmtNum(agg.costUsd.mean)} | $${fmtNum(agg.costUsd.median)} | $${fmtNum(agg.costUsd.range[0])}–$${fmtNum(agg.costUsd.range[1])} |\n`;

      // Wall Time
      md += `| Wall Time (min) |`;
      for (let i = 0; i < toolRuns.length; i++) md += ` ${fmtNum(agg.wallTimeMin.values[i] ?? 0, 1)} |`;
      md += ` ${fmtNum(agg.wallTimeMin.mean, 1)} | ${fmtNum(agg.wallTimeMin.median, 1)} | ${fmtNum(agg.wallTimeMin.range[0], 1)}–${fmtNum(agg.wallTimeMin.range[1], 1)} |\n`;

      // Band
      md += `| Band |`;
      for (const b of agg.bands) md += ` ${b} |`;
      md += ` — | — | — |\n`;

      md += `\n`;
    }

    md += `### Latest Run${run.runNumber ? ` (Run ${run.runNumber})` : ""}\n\n`;
    md += `**Test Mode:** ${run.testMode}\n`;
    md += `**Agent Version:** ${run.agentVersion}\n`;
    md += `**Started:** ${run.startedAt}\n`;
    if (run.completedAt) md += `**Completed:** ${run.completedAt}\n`;
    md += `\n`;

    // Task table
    md += `| # | Tier | First Attempt | Cycles | Outcome | SOLO |\n`;
    md += `|---|------|:---:|:---:|:---:|:---:|\n`;

    for (const result of run.results) {
      const solo = computeSoloLevel(result);
      md += `| ${result.taskId} `;
      md += `| ${result.tier} `;
      md += `| ${result.firstAttemptSuccess ? "✅" : "❌"} `;
      md += `| ${result.correctionCycles} `;
      md += `| ${result.outcome} `;
      md += `| ${solo} — ${SOLO_LABELS[solo]} |\n`;
    }

    md += `\n`;

    // Summary
    md += `**Pass Rate:** ${summary.passRate} · `;
    md += `**First-Attempt:** ${summary.firstAttemptRate} · `;
    md += `**Avg Cycles:** ${summary.avgCorrectionCycles} · `;
    md += `**Band: ${summary.overallBand}**`;
    if (summary.skillType) md += ` · **Skill Profile: ${summary.skillType}**`;
    md += `\n\n`;

    // Efficiency metrics table
    const hasMetrics = run.results.some(r => r.metrics && r.metrics.costUsd > 0);
    if (hasMetrics) {
      md += `### Efficiency Metrics\n\n`;
      md += `| # | Tier | Turns | Cost | Input Tokens | Output Tokens | Cache Create | Cache Read | Web Search | Web Fetch | API Time | Wall Time |\n`;
      md += `|---|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

      for (const result of run.results) {
        const m = result.metrics;
        if (m) {
          md += `| ${result.taskId} `;
          md += `| ${result.tier} `;
          md += `| ${m.turns} `;
          md += `| ${formatCost(m.costUsd)} `;
          md += `| ${formatNumber(m.inputTokens)} `;
          md += `| ${formatNumber(m.outputTokens)} `;
          md += `| ${formatNumber(m.cacheCreationTokens)} `;
          md += `| ${formatNumber(m.cacheReadTokens)} `;
          md += `| ${m.webSearches} `;
          md += `| ${m.webFetches} `;
          md += `| ${formatDuration(m.apiTimeMs)} `;
          md += `| ${formatDuration(m.durationMs)} |\n`;
        }
      }

      if (summary.metrics) {
        const sm = summary.metrics;
        md += `\n**Totals:** ${sm.turns} turns · ${formatCost(sm.costUsd)} · ${formatNumber(sm.inputTokens)} input · ${formatNumber(sm.outputTokens)} output · ${formatNumber(sm.cacheCreationTokens)} cache create · ${formatNumber(sm.cacheReadTokens)} cache read · ${sm.webSearches} searches · ${sm.webFetches} fetches · ${formatDuration(sm.apiTimeMs)} API · ${formatDuration(sm.durationMs)} wall\n`;
      }
      md += `\n`;
    }

    // Code Changes table
    const hasDiffStats = run.results.some(r => r.diffStats);
    if (hasDiffStats) {
      md += `### Code Changes\n\n`;
      md += `| # | Tier | Created | Modified | +Lines | -Lines | Packages Added |\n`;
      md += `|---|------|:---:|:---:|:---:|:---:|---|\n`;

      for (const result of run.results) {
        const d = result.diffStats;
        if (d) {
          md += `| ${result.taskId} `;
          md += `| ${result.tier} `;
          md += `| ${d.filesCreated} `;
          md += `| ${d.filesModified} `;
          md += `| ${d.linesAdded} `;
          md += `| ${d.linesRemoved} `;
          md += `| ${d.packagesAdded.length > 0 ? d.packagesAdded.join(", ") : "—"} |\n`;
        } else {
          md += `| ${result.taskId} | ${result.tier} | — | — | — | — | — |\n`;
        }
      }

      if (summary.totalDiffStats) {
        const td = summary.totalDiffStats;
        md += `\n**Totals:** ${td.filesCreated} created · ${td.filesModified} modified · +${td.linesAdded}/-${td.linesRemoved} lines`;
        if (td.packagesAdded.length > 0) {
          md += ` · Packages: ${td.packagesAdded.join(", ")}`;
        }
        md += `\n`;
      }
      md += `\n`;
    }

    // Test Results table
    const hasTestResults = run.results.some(r => r.finalTestRunResults);
    if (hasTestResults) {
      md += `### Test Results\n\n`;
      md += `| # | Tier | Total | Passed | Failed | Regressions |\n`;
      md += `|---|------|:---:|:---:|:---:|:---:|\n`;

      for (const result of run.results) {
        const tr = result.finalTestRunResults;
        if (tr) {
          md += `| ${result.taskId} `;
          md += `| ${result.tier} `;
          md += `| ${tr.testsTotal} `;
          md += `| ${tr.testsPassed} `;
          md += `| ${tr.testsFailed} `;
          md += `| ${tr.regressions.length} |\n`;
        } else {
          md += `| ${result.taskId} | ${result.tier} | — | — | — | — |\n`;
        }
      }
      md += `\n`;
    }

    // Derived Metrics
    if (summary.costPerSuccessfulTask !== undefined || summary.outputTokensPerTurn !== undefined) {
      md += `### Derived Metrics\n\n`;
      if (summary.costPerSuccessfulTask !== undefined)
        md += `- **Total cost / success:** ${formatCost(summary.costPerSuccessfulTask)} *(total spend ÷ working tasks)*\n`;
      if (summary.outputTokensPerTurn !== undefined)
        md += `- **Output tokens / turn:** ${formatNumber(summary.outputTokensPerTurn)}\n`;
      if (summary.correctionLinesAdded !== undefined && summary.correctionLinesAdded > 0)
        md += `- **Lines added in corrected tasks:** ${formatNumber(summary.correctionLinesAdded)}\n`;
      if (summary.noChangesCount !== undefined && summary.noChangesCount > 0)
        md += `- **No-changes tasks:** ${summary.noChangesCount}\n`;
      if (summary.totalRegressions !== undefined && summary.totalRegressions > 0)
        md += `- **Total regressions:** ${summary.totalRegressions}\n`;
      if (summary.metacognitiveEfficiency !== undefined)
        md += `- **Metacognitive efficiency:** ${summary.metacognitiveEfficiency.toFixed(3)} *(tier-weighted, 0-1)*\n`;
      if (summary.selfRegulationIndex !== undefined)
        md += `- **Self-regulation index:** ${summary.selfRegulationIndex.toFixed(3)} *(planning + monitoring + control + reflection, 0-1)*\n`;
      if (summary.avgSoloLevel !== undefined)
        md += `- **Avg SOLO quality:** ${summary.avgSoloLevel.toFixed(1)} / 4.0\n`;
      md += `\n`;
    }

    // Cognitive Profile
    if (summary.cognitiveProfile) {
      const cp = summary.cognitiveProfile;
      md += `### Cognitive Profile\n\n`;

      md += `#### Information-Gathering\n\n`;
      md += `| Metric | Value |\n|---|---|\n`;
      md += `| Web Searches | ${cp.informationGathering.webSearches} |\n`;
      md += `| Web Fetches | ${cp.informationGathering.webFetches} |\n`;
      md += `| Doc Dependency | ${cp.informationGathering.docDependency} |\n`;
      md += `| Cache Read Tokens | ${formatNumber(cp.informationGathering.cacheReadTokens)} |\n`;
      md += `\n`;

      md += `#### Building Understanding\n\n`;
      md += `| Metric | Value |\n|---|---|\n`;
      md += `| Input Tokens | ${formatNumber(cp.buildingUnderstanding.inputTokens)} |\n`;
      md += `| Cache Creation Tokens | ${formatNumber(cp.buildingUnderstanding.cacheCreationTokens)} |\n`;
      md += `\n`;

      md += `#### Productive Thinking\n\n`;
      md += `| Metric | Value |\n|---|---|\n`;
      md += `| Lines Added | ${formatNumber(cp.productiveThinking.linesAdded)} |\n`;
      md += `| Lines Removed | ${formatNumber(cp.productiveThinking.linesRemoved)} |\n`;
      md += `| Files Created | ${cp.productiveThinking.filesCreated} |\n`;
      md += `| Files Modified | ${cp.productiveThinking.filesModified} |\n`;
      md += `| Packages Added | ${cp.productiveThinking.packagesAdded} |\n`;
      md += `| Output Tokens | ${formatNumber(cp.productiveThinking.outputTokens)} |\n`;
      md += `\n`;

      md += `#### Strategic & Reflective Thinking\n\n`;
      md += `| Metric | Value |\n|---|---|\n`;
      md += `| Correction Cycles | ${cp.strategicReflective.correctionCycles} |\n`;
      md += `| First-Attempt Rate | ${cp.strategicReflective.firstAttemptRate} |\n`;
      md += `| Hallucinations | ${summary.totalHallucinations === null ? "N/A (automated mode)" : summary.totalHallucinations} |\n`;
      md += `| Regressions | ${cp.strategicReflective.regressions} |\n`;
      md += `\n`;
    }

    // Notes
    const taskNotes = run.results.filter((r) => r.notes);
    if (taskNotes.length > 0) {
      md += `### Notes\n\n`;
      for (const r of taskNotes) {
        md += `- **Task ${r.taskId} (${r.tier}):** ${r.notes}\n`;
      }
      md += `\n`;
    }

    const hallucinationNotes = run.results.filter((r) => r.hallucinationNotes);
    if (hallucinationNotes.length > 0) {
      md += `### Hallucinations Observed\n\n`;
      for (const r of hallucinationNotes) {
        md += `- **Task ${r.taskId}:** ${r.hallucinationNotes}\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  // Head-to-head comparison
  if (summaries.length > 1) {
    md += `## Head-to-Head Comparison\n\n`;
    md += `| Metric |`;
    for (const s of summaries) {
      const name = s.tool.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      md += ` ${name} |`;
    }
    md += `\n`;
    md += `|---|`;
    for (const _ of summaries) md += `:---:|`;
    md += `\n`;

    md += `| Pass Rate |`;
    for (const s of summaries) md += ` ${s.passRate} |`;
    md += `\n`;

    md += `| First-Attempt Rate |`;
    for (const s of summaries) md += ` ${s.firstAttemptRate} |`;
    md += `\n`;

    md += `| Avg Cycles |`;
    for (const s of summaries) md += ` ${s.avgCorrectionCycles} |`;
    md += `\n`;

    md += `| **Overall Band** |`;
    for (const s of summaries) md += ` **${s.overallBand}** |`;
    md += `\n`;

    const anyMetrics = summaries.some(s => s.metrics && s.metrics.costUsd > 0);
    if (anyMetrics) {
      md += `| Total Cost |`;
      for (const s of summaries) md += ` ${s.metrics ? formatCost(s.metrics.costUsd) : "—"} |`;
      md += `\n`;

      md += `| Total Turns |`;
      for (const s of summaries) md += ` ${s.metrics ? s.metrics.turns : "—"} |`;
      md += `\n`;

      md += `| Wall Time |`;
      for (const s of summaries) md += ` ${s.metrics ? formatDuration(s.metrics.durationMs) : "—"} |`;
      md += `\n`;

      md += `| Input Tokens |`;
      for (const s of summaries) md += ` ${s.metrics ? formatNumber(s.metrics.inputTokens) : "—"} |`;
      md += `\n`;

      md += `| Output Tokens |`;
      for (const s of summaries) md += ` ${s.metrics ? formatNumber(s.metrics.outputTokens) : "—"} |`;
      md += `\n`;

      md += `| Cache Create Tokens |`;
      for (const s of summaries) md += ` ${s.metrics ? formatNumber(s.metrics.cacheCreationTokens) : "—"} |`;
      md += `\n`;

      md += `| Cache Read Tokens |`;
      for (const s of summaries) md += ` ${s.metrics ? formatNumber(s.metrics.cacheReadTokens) : "—"} |`;
      md += `\n`;

      md += `| Web Searches |`;
      for (const s of summaries) md += ` ${s.metrics ? s.metrics.webSearches : "—"} |`;
      md += `\n`;

      md += `| Web Fetches |`;
      for (const s of summaries) md += ` ${s.metrics ? s.metrics.webFetches : "—"} |`;
      md += `\n`;

      md += `| API Time |`;
      for (const s of summaries) md += ` ${s.metrics ? formatDuration(s.metrics.apiTimeMs) : "—"} |`;
      md += `\n`;

      md += `| Total Cost / Success |`;
      for (const s of summaries) md += ` ${s.costPerSuccessfulTask !== undefined ? formatCost(s.costPerSuccessfulTask) : "—"} |`;
      md += `\n`;
    }

    const anyDiffStats = summaries.some(s => s.totalDiffStats);
    if (anyDiffStats) {
      md += `| Lines Added |`;
      for (const s of summaries) md += ` ${s.totalDiffStats ? formatNumber(s.totalDiffStats.linesAdded) : "—"} |`;
      md += `\n`;

      md += `| Packages Added |`;
      for (const s of summaries) md += ` ${s.totalDiffStats && s.totalDiffStats.packagesAdded.length > 0 ? s.totalDiffStats.packagesAdded.length : "—"} |`;
      md += `\n`;

      md += `| Regressions |`;
      for (const s of summaries) md += ` ${s.totalRegressions ?? "—"} |`;
      md += `\n`;
    }

    // Thinking-framework metrics
    const anyThinking = summaries.some(s => s.metacognitiveEfficiency !== undefined);
    if (anyThinking) {
      md += `| **Cognitive Metrics** |`;
      for (const _ of summaries) md += ` |`;
      md += `\n`;

      md += `| Metacognitive Efficiency |`;
      for (const s of summaries) md += ` ${s.metacognitiveEfficiency !== undefined ? s.metacognitiveEfficiency.toFixed(3) : "—"} |`;
      md += `\n`;

      md += `| Self-Regulation Index |`;
      for (const s of summaries) md += ` ${s.selfRegulationIndex !== undefined ? s.selfRegulationIndex.toFixed(3) : "—"} |`;
      md += `\n`;

      md += `| Avg SOLO Quality |`;
      for (const s of summaries) md += ` ${s.avgSoloLevel !== undefined ? s.avgSoloLevel.toFixed(1) : "—"} |`;
      md += `\n`;

      md += `| Skill Profile |`;
      for (const s of summaries) md += ` ${s.skillType ?? "—"} |`;
      md += `\n`;
    }

    // Cognitive profile key metrics in head-to-head
    const anyCogProfile = summaries.some(s => s.cognitiveProfile);
    if (anyCogProfile) {
      md += `| **Information-Gathering** |`;
      for (const _ of summaries) md += ` |`;
      md += `\n`;

      md += `| Web Searches |`;
      for (const s of summaries) md += ` ${s.cognitiveProfile ? s.cognitiveProfile.informationGathering.webSearches : "—"} |`;
      md += `\n`;

      md += `| Web Fetches |`;
      for (const s of summaries) md += ` ${s.cognitiveProfile ? s.cognitiveProfile.informationGathering.webFetches : "—"} |`;
      md += `\n`;

      md += `| **Productive Thinking** |`;
      for (const _ of summaries) md += ` |`;
      md += `\n`;

      md += `| Lines Added |`;
      for (const s of summaries) md += ` ${s.cognitiveProfile ? formatNumber(s.cognitiveProfile.productiveThinking.linesAdded) : "—"} |`;
      md += `\n`;

      md += `| Output Tokens |`;
      for (const s of summaries) md += ` ${s.cognitiveProfile ? formatNumber(s.cognitiveProfile.productiveThinking.outputTokens) : "—"} |`;
      md += `\n`;

      md += `| **Strategic & Reflective** |`;
      for (const _ of summaries) md += ` |`;
      md += `\n`;

      md += `| Correction Cycles |`;
      for (const s of summaries) md += ` ${s.cognitiveProfile ? s.cognitiveProfile.strategicReflective.correctionCycles : "—"} |`;
      md += `\n`;

    }

    md += `\n`;

    // Multi-run aggregate head-to-head (if any tool has multiple runs)
    const hasMultiRun = latestRuns.some(r => (allRuns.get(r.tool)?.length ?? 0) > 1);
    if (hasMultiRun) {
      md += `## Head-to-Head Comparison (Aggregate Means)\n\n`;
      md += `| Metric |`;
      for (const s of summaries) {
        const name = s.tool.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const n = allRuns.get(s.tool)?.length ?? 1;
        md += ` ${name}${n > 1 ? ` (N=${n})` : ""} |`;
      }
      md += `\n`;
      md += `|---|`;
      for (const _ of summaries) md += `:---:|`;
      md += `\n`;

      // Compute aggregates for each tool
      const aggMap = new Map<string, RunAggregate>();
      for (const s of summaries) {
        const runs = allRuns.get(s.tool) ?? [];
        aggMap.set(s.tool, computeAggregate(runs));
      }

      const totalTasks = latestRuns[0]?.results.length ?? 5;

      md += `| Mean Pass Rate |`;
      for (const s of summaries) { const a = aggMap.get(s.tool)!; md += ` ${fmtNum(a.passRate.mean, 1)}/${totalTasks} |`; }
      md += `\n`;

      md += `| Mean First-Attempt |`;
      for (const s of summaries) { const a = aggMap.get(s.tool)!; md += ` ${fmtNum(a.firstAttemptRate.mean, 1)}/${totalTasks} |`; }
      md += `\n`;

      md += `| Mean Avg Cycles |`;
      for (const s of summaries) { const a = aggMap.get(s.tool)!; md += ` ${fmtNum(a.avgCycles.mean)} |`; }
      md += `\n`;

      md += `| Mean Cost |`;
      for (const s of summaries) { const a = aggMap.get(s.tool)!; md += ` $${fmtNum(a.costUsd.mean)} |`; }
      md += `\n`;

      md += `| Mean Wall Time (min) |`;
      for (const s of summaries) { const a = aggMap.get(s.tool)!; md += ` ${fmtNum(a.wallTimeMin.mean, 1)} |`; }
      md += `\n`;

      md += `| Cost Range |`;
      for (const s of summaries) { const a = aggMap.get(s.tool)!; md += ` $${fmtNum(a.costUsd.range[0])}–$${fmtNum(a.costUsd.range[1])} |`; }
      md += `\n`;

      md += `\n`;
    }
  }

  return md;
}

// ---------------------------------------------------------------------------
// Aggregate report (cross-category)
// ---------------------------------------------------------------------------

export function generateAggregateReport(runsDir: string): string {
  const lines: string[] = [];
  lines.push("# Aggregate Benchmark Results\n");
  lines.push(`> Generated: ${new Date().toISOString().slice(0, 10)}\n`);

  // Discover categories
  if (!fs.existsSync(runsDir)) return lines.join("\n") + "\n";

  const categories = fs.readdirSync(runsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const cat of categories) {
    const categoryDir = path.join(runsDir, cat);
    const allRunsMap = loadAllRuns(categoryDir);
    if (allRunsMap.size === 0) continue;

    lines.push(`## ${cat.toUpperCase()} Tools\n`);

    // Determine max runs across all tools in category
    let maxRuns = 0;
    for (const [, runs] of allRunsMap) maxRuns = Math.max(maxRuns, runs.length);

    // Header
    const runHeaders = Array.from({ length: maxRuns }, (_, i) => `Run ${i + 1}`).join(" | ");
    lines.push(`| Tool | Metric | ${runHeaders} | Mean | Median | Range |`);
    lines.push(`|------|--------|${Array(maxRuns).fill("------").join("|")}|------|--------|-------|`);

    for (const [toolName, runs] of allRunsMap) {
      const agg = computeAggregate(runs);
      const totalTasks = runs[0]?.results.length ?? 5;
      type MetricDef = { label: string; values: AggregateMetricStats; format: (v: number) => string };

      const metrics: MetricDef[] = [
        {
          label: "First-Attempt",
          values: agg.firstAttemptRate,
          format: (v) => `${v}/${totalTasks}`,
        },
        {
          label: "Avg Cycles",
          values: agg.avgCycles,
          format: (v) => fmtNum(v),
        },
        {
          label: "Cost ($)",
          values: agg.costUsd,
          format: (v) => fmtNum(v),
        },
        {
          label: "Wall Time (min)",
          values: agg.wallTimeMin,
          format: (v) => fmtNum(v, 1),
        },
      ];

      for (let m = 0; m < metrics.length; m++) {
        const metric = metrics[m];
        const toolLabel = m === 0 ? `**${toolName}**` : "";
        const runCells: string[] = [];

        for (let r = 0; r < maxRuns; r++) {
          if (r < metric.values.values.length) {
            runCells.push(metric.format(metric.values.values[r]));
          } else {
            runCells.push("—");
          }
        }

        const meanStr = metric.values.values.length > 0
          ? metric.label === "First-Attempt"
            ? `${fmtNum(metric.values.mean, 1)}/${totalTasks}`
            : metric.format(metric.values.mean)
          : "—";
        const medianStr = metric.values.values.length > 0
          ? metric.label === "First-Attempt"
            ? `${metric.values.median}/${totalTasks}`
            : metric.format(metric.values.median)
          : "—";
        const rangeStr = metric.values.values.length > 0
          ? `${metric.format(metric.values.range[0])}–${metric.format(metric.values.range[1])}`
          : "—";

        lines.push(`| ${toolLabel} | ${metric.label} | ${runCells.join(" | ")} | ${meanStr} | ${medianStr} | ${rangeStr} |`);
      }
    }
    lines.push("");
  }

  // Summary table
  lines.push("## Summary\n");
  lines.push("| Tool | Category | Runs | Mean First-Attempt | Mean Cost ($) | Mean Wall Time (min) |");
  lines.push("|------|----------|------|--------------------|---------------|----------------------|");

  for (const cat of categories) {
    const categoryDir = path.join(runsDir, cat);
    const allRunsMap = loadAllRuns(categoryDir);
    for (const [toolName, runs] of allRunsMap) {
      const agg = computeAggregate(runs);
      const totalTasks = runs[0]?.results.length ?? 5;
      lines.push(`| ${toolName} | ${cat} | ${agg.runCount} | ${fmtNum(agg.firstAttemptRate.mean, 1)}/${totalTasks} | ${fmtNum(agg.costUsd.mean)} | ${fmtNum(agg.wallTimeMin.mean, 1)} |`);
    }
  }

  return lines.join("\n") + "\n";
}
