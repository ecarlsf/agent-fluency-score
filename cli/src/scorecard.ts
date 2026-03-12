import * as fs from "fs";
import * as path from "path";
import { BenchmarkRun, BenchmarkSummary, AgentMetrics, aggregateMetrics } from "./types.js";

const CYCLE_CAP = 10;

// ---------------------------------------------------------------------------
// Multi-run loading
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

export function generateAggregateReport(runsDir: string): string {
  const lines: string[] = [];
  lines.push("# Aggregate Benchmark Results\n");
  lines.push(`> Generated: ${new Date().toISOString().slice(0, 10)}\n`);

  if (!fs.existsSync(runsDir)) return lines.join("\n") + "\n";

  const categories = fs.readdirSync(runsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  lines.push("| Tool | Category | Runs | Mean First-Attempt | Mean Avg Cycles | Mean Wall Time (min) |");
  lines.push("|------|----------|:----:|:------------------:|:---------------:|:--------------------:|");

  for (const cat of categories) {
    const categoryDir = path.join(runsDir, cat);
    const allRunsMap = loadAllRuns(categoryDir);

    for (const [toolName, runs] of allRunsMap) {
      const totalTasks = runs[0]?.results.length ?? 5;
      const summaries = runs.map(calculateSummary);

      const meanFirstAttempt = summaries.reduce((sum, s) => {
        const [n] = s.firstAttemptRate.split("/").map(Number);
        return sum + n;
      }, 0) / summaries.length;

      const meanCycles = summaries.reduce((sum, s) => sum + s.avgCorrectionCycles, 0) / summaries.length;

      const meanWallTimeMin = summaries.reduce((sum, s) => {
        return sum + (s.metrics?.durationMs ?? 0) / 60000;
      }, 0) / summaries.length;

      lines.push(`| ${toolName} | ${cat} | ${runs.length} | ${meanFirstAttempt.toFixed(1)}/${totalTasks} | ${meanCycles.toFixed(2)} | ${meanWallTimeMin.toFixed(1)} |`);
    }
  }

  return lines.join("\n") + "\n";
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
  const totalCycles = results.reduce((sum, r) => {
    return sum + (r.outcome === "failed" ? CYCLE_CAP : r.correctionCycles);
  }, 0);
  const avgCycles = totalCycles / total;
  const totalHallucinations = results.reduce(
    (sum, r) => sum + r.hallucinationCount,
    0
  );

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

  return {
    tool: run.tool,
    passRate: `${working}/${total}`,
    firstAttemptRate: `${firstAttempt}/${total}`,
    avgCorrectionCycles: Math.round(avgCycles * 10) / 10,
    totalHallucinations,
    overallBand: band,
    metrics,
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

export function generateScorecard(
  category: string,
  runsOrMap: BenchmarkRun[] | Map<string, BenchmarkRun[]>
): string {
  // Normalize input: accept either a flat array or a Map (multi-run)
  let runs: BenchmarkRun[];
  if (runsOrMap instanceof Map) {
    runs = [];
    for (const [, toolRuns] of runsOrMap) {
      if (toolRuns.length > 0) runs.push(toolRuns[toolRuns.length - 1]);
    }
  } else {
    runs = runsOrMap;
  }

  const categoryDisplay = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const summaries = runs.map(calculateSummary);

  let md = `# Agent Fluency Score — ${categoryDisplay} Benchmark\n\n`;
  md += `**Protocol Version:** ${runs[0]?.protocolVersion ?? "0.1"}\n`;
  md += `**Agent:** ${runs[0]?.agent ?? "Claude Code"}\n`;
  md += `**Date:** ${new Date().toISOString().split("T")[0]}\n\n`;
  md += `---\n\n`;

  // Per-tool details
  for (const run of runs) {
    const toolDisplay = run.tool.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const summary = summaries.find((s) => s.tool === run.tool)!;

    md += `## ${toolDisplay}\n\n`;
    md += `**Test Mode:** ${run.testMode}\n`;
    md += `**Agent Version:** ${run.agentVersion}\n`;
    md += `**Started:** ${run.startedAt}\n`;
    if (run.completedAt) md += `**Completed:** ${run.completedAt}\n`;
    md += `\n`;

    // Task table
    md += `| # | Tier | First Attempt | Cycles | Hallucinations | Doc Dependency | Outcome |\n`;
    md += `|---|------|:---:|:---:|:---:|:---:|:---:|\n`;

    for (const result of run.results) {
      md += `| ${result.taskId} `;
      md += `| ${result.tier} `;
      md += `| ${result.firstAttemptSuccess ? "✅" : "❌"} `;
      md += `| ${result.correctionCycles} `;
      md += `| ${result.hallucinationCount} `;
      md += `| ${result.documentationDependency} `;
      md += `| ${result.outcome} |\n`;
    }

    md += `\n`;

    // Summary
    md += `**Pass Rate:** ${summary.passRate} · `;
    md += `**First-Attempt:** ${summary.firstAttemptRate} · `;
    md += `**Avg Cycles:** ${summary.avgCorrectionCycles} · `;
    md += `**Hallucinations:** ${summary.totalHallucinations} · `;
    md += `**Band: ${summary.overallBand}**\n\n`;

    // Efficiency metrics table
    const hasMetrics = run.results.some(r => r.metrics && r.metrics.costUsd > 0);
    if (hasMetrics) {
      md += `### Efficiency Metrics\n\n`;
      md += `| # | Tier | Turns | Cost | Output Tokens | Wall Time |\n`;
      md += `|---|------|:---:|:---:|:---:|:---:|\n`;

      for (const result of run.results) {
        const m = result.metrics;
        if (m) {
          md += `| ${result.taskId} `;
          md += `| ${result.tier} `;
          md += `| ${m.turns} `;
          md += `| ${formatCost(m.costUsd)} `;
          md += `| ${formatNumber(m.outputTokens)} `;
          md += `| ${formatDuration(m.durationMs)} |\n`;
        }
      }

      if (summary.metrics) {
        const sm = summary.metrics;
        md += `\n**Totals:** ${sm.turns} turns · ${formatCost(sm.costUsd)} · ${formatNumber(sm.outputTokens)} output tokens · ${formatDuration(sm.durationMs)} wall time\n`;
      }
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

    md += `| Hallucinations |`;
    for (const s of summaries) md += ` ${s.totalHallucinations} |`;
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

      md += `| Output Tokens |`;
      for (const s of summaries) md += ` ${s.metrics ? formatNumber(s.metrics.outputTokens) : "—"} |`;
      md += `\n`;
    }

    md += `\n`;
  }

  return md;
}
