export interface Task {
  id: number;
  tier: string;
  prompt: string;
  description: string;
}

export interface AgentMetrics {
  durationMs: number;
  apiTimeMs: number;
  turns: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  webSearches: number;
  webFetches: number;
}

export function aggregateMetrics(items: (AgentMetrics | null | undefined)[]): AgentMetrics {
  const result: AgentMetrics = {
    durationMs: 0, apiTimeMs: 0, turns: 0, costUsd: 0,
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
    webSearches: 0, webFetches: 0,
  };
  for (const m of items) {
    if (!m) continue;
    result.durationMs += m.durationMs;
    result.apiTimeMs += m.apiTimeMs;
    result.turns += m.turns;
    result.costUsd += m.costUsd;
    result.inputTokens += m.inputTokens;
    result.outputTokens += m.outputTokens;
    result.cacheCreationTokens += m.cacheCreationTokens;
    result.cacheReadTokens += m.cacheReadTokens;
    result.webSearches += m.webSearches;
    result.webFetches += m.webFetches;
  }
  return result;
}

export interface DiffStats {
  filesCreated: number;
  filesModified: number;
  filesDeleted: number;
  linesAdded: number;
  linesRemoved: number;
  packagesAdded: string[];
  packagesRemoved: string[];
}

export function aggregateDiffStats(items: (DiffStats | null | undefined)[]): DiffStats {
  const result: DiffStats = {
    filesCreated: 0, filesModified: 0, filesDeleted: 0,
    linesAdded: 0, linesRemoved: 0,
    packagesAdded: [], packagesRemoved: [],
  };
  for (const d of items) {
    if (!d) continue;
    result.filesCreated += d.filesCreated;
    result.filesModified += d.filesModified;
    result.filesDeleted += d.filesDeleted;
    result.linesAdded += d.linesAdded;
    result.linesRemoved += d.linesRemoved;
    result.packagesAdded.push(...d.packagesAdded);
    result.packagesRemoved.push(...d.packagesRemoved);
  }
  result.packagesAdded = [...new Set(result.packagesAdded)];
  result.packagesRemoved = [...new Set(result.packagesRemoved)];
  return result;
}

export interface TestDetail {
  name: string;
  suiteName: string;
  file: string;
  tier: number;
  status: "passed" | "failed" | "timedOut" | "skipped";
  durationMs: number;
}

export interface TestRunResults {
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  testDurationMs: number;
  testResults: TestDetail[];
  regressions: TestDetail[];
}

// SOLO taxonomy levels (Biggs & Collis)
export type SoloLevel = 0 | 1 | 2 | 3 | 4;

export const SOLO_LABELS: Record<SoloLevel, string> = {
  0: "Prestructural",
  1: "Unistructural",
  2: "Multistructural",
  3: "Relational",
  4: "Extended Abstract",
};

// Skill type (Romiszowski)
export type SkillType = "Reproductive" | "Productive" | "Mixed";

// Cognitive profile (integrated model)
export interface CognitiveProfile {
  informationGathering: {
    webSearches: number;
    webFetches: number;
    docDependency: string;
    cacheReadTokens: number;
  };
  buildingUnderstanding: {
    inputTokens: number;
    cacheCreationTokens: number;
  };
  productiveThinking: {
    linesAdded: number;
    linesRemoved: number;
    filesCreated: number;
    filesModified: number;
    packagesAdded: number;
    outputTokens: number;
  };
  strategicReflective: {
    correctionCycles: number;
    firstAttemptRate: string;
    hallucinations: number | null;
    regressions: number;
  };
}

export interface TaskResult {
  taskId: number;
  tier: string;
  prompt: string;
  firstAttemptSuccess: boolean;
  correctionCycles: number;
  hallucinationCount: number | null;
  hallucinationNotes: string;
  documentationDependency: "none" | "likely" | "certain" | null;
  outcome: "working" | "partial" | "failed";
  notes: string;
  timestamp: string;
  metrics?: AgentMetrics;
  stopReason?: string | null;
  agentSubtype?: string | null;
  agentResultText?: string | null;
  finalTestRunResults?: TestRunResults;
  diffStats?: DiffStats;
  noChangesNeeded?: boolean;
}

export interface CycleDetail {
  taskId: number;
  cycle: number;
  promptSent: string;
  agentExitCode: number;
  agentSessionId: string | null;
  agentStdoutHead: string;
  agentStderrHead?: string;
  agentDurationMs: number;
  buildExitCode: number | null;
  buildError: string | null;
  testExitCode: number | null;
  testError: string | null;
  agentTimedOut: boolean;
  result: string;
  metrics: AgentMetrics | null;
  stopReason?: string | null;
  agentSubtype?: string | null;
  agentResultText?: string | null;
  testRunResults?: TestRunResults | null;
}

export interface BenchmarkRun {
  tool: string;
  category: string;
  agent: string;
  agentVersion: string;
  protocolVersion: string;
  testMode: "cold-start" | "integration";
  startedAt: string;
  completedAt?: string;
  starterProjectCommit?: string;
  results: TaskResult[];
  metrics?: AgentMetrics;
  runNumber?: number;
}

export interface BenchmarkSummary {
  tool: string;
  passRate: string;
  firstAttemptRate: string;
  avgCorrectionCycles: number;
  totalHallucinations: number | null;
  overallBand: "Fluent" | "Functional" | "Friction" | "Failure";
  metrics?: AgentMetrics;
  totalDiffStats?: DiffStats;
  costPerSuccessfulTask?: number;
  outputTokensPerTurn?: number;
  correctionLinesAdded?: number;
  noChangesCount?: number;
  totalRegressions?: number;
  metacognitiveEfficiency?: number;
  selfRegulationIndex?: number;
  avgSoloLevel?: number;
  skillType?: SkillType;
  cognitiveProfile?: CognitiveProfile;
}

export interface CategoryDefinition {
  name: string;
  tools: string[];
  tasks: Task[];
  starterAppPath?: string;
}

export function tierNumber(tier: string): number {
  const mapping: Record<string, number> = {
    "Basic Setup": 1,
    "Core Feature": 2,
    "Integration": 3,
    "Production": 4,
    "Advanced": 5,
  };
  return mapping[tier] ?? 0;
}
