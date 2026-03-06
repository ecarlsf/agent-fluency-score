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

export interface TaskResult {
  taskId: number;
  tier: string;
  prompt: string;
  firstAttemptSuccess: boolean;
  correctionCycles: number;
  hallucinationCount: number;
  hallucinationNotes: string;
  documentationDependency: "none" | "likely" | "certain";
  outcome: "working" | "partial" | "failed";
  notes: string;
  timestamp: string;
  metrics?: AgentMetrics;
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
}

export interface BenchmarkSummary {
  tool: string;
  passRate: string;
  firstAttemptRate: string;
  avgCorrectionCycles: number;
  totalHallucinations: number;
  overallBand: "Fluent" | "Functional" | "Friction" | "Failure";
  metrics?: AgentMetrics;
}

export interface CategoryDefinition {
  name: string;
  tools: string[];
  tasks: Task[];
}
