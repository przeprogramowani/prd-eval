import {appendFileSync, existsSync, mkdirSync, writeFileSync} from "fs";
import {randomUUID} from "crypto";
import path from "path";
import {config as loadEnv} from "dotenv";
import promptfoo, {type EvaluateResult} from "promptfoo";
import config from "./promptfoo.config";

loadEnv();

// ============================================================================
// Configuration
// ============================================================================

const REPO_ROOT = path.resolve(__dirname, "..");
const RESULTS_DIR = path.join(REPO_ROOT, "dist", "results");
const CSV_PATH = path.join(RESULTS_DIR, "score-history.csv");

const CRITERIA = [
  "problemDefinition",
  "requirementsClarity",
  "scopeBoundaries",
  "userStories",
  "measurability",
] as const;

const JUDGE_MAPPINGS: Record<string, string> = {
  "gpt-5": "gpt5",
  "claude-sonnet-4-5": "claude45",
};

// ============================================================================
// Types
// ============================================================================

type Criterion = (typeof CRITERIA)[number];

interface ScoreEntry {
  score: number;
  rationale?: string;
}

interface JudgeOutput {
  model: string;
  scores: Record<string, ScoreEntry>;
  judge?: string;
}

interface JudgeModelPair {
  judge: string;
  model: string;
}

interface CsvRow {
  run_id: string;
  timestamp: string;
  [key: string]: string;
}

interface EvaluationResults {
  runId: string;
  timestamp: string;
  results: EvaluateResult[];
}

type ProviderIdentifier = string | {id: string; label?: string};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Strips markdown code fences from JSON output.
 * Handles formats like ```json\n...\n``` or ```\n...\n```
 */
function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
}

/**
 * Extracts provider ID from promptfoo provider object or string.
 */
function extractProviderId(provider: ProviderIdentifier): string {
  return typeof provider === "string" ? provider : provider?.id ?? "";
}

/**
 * Normalizes provider ID to a short judge name.
 * Uses configured mappings or falls back to sanitized first token.
 */
function normalizeJudgeName(providerId: string): string {
  // Check configured mappings
  for (const [key, value] of Object.entries(JUDGE_MAPPINGS)) {
    if (providerId.includes(key)) {
      return value;
    }
  }

  // Fallback: sanitize first recognizable token
  const match = providerId.match(/[a-zA-Z0-9-]+/);
  return match ? match[0].replace(/-/g, "") : "unknown";
}

/**
 * Validates that a parsed object contains required judge output fields.
 */
function isValidJudgeOutput(parsed: unknown): parsed is JudgeOutput {
  if (!parsed || typeof parsed !== "object") {
    return false;
  }
  const obj = parsed as Partial<JudgeOutput>;
  return Boolean(obj.model && obj.scores && typeof obj.scores === "object");
}

/**
 * Ensures the results directory exists.
 */
function ensureResultsDir(): void {
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, {recursive: true});
  }
}

// ============================================================================
// Core Logic
// ============================================================================

/**
 * Runs promptfoo evaluation and returns structured results.
 */
async function runEvaluation(): Promise<EvaluationResults> {
  const evalRecord = await promptfoo.evaluate(config as any);
  const runId = evalRecord.id ?? randomUUID();
  const timestamp = evalRecord.createdAt
    ? new Date(evalRecord.createdAt).toISOString()
    : new Date().toISOString();

  const resultsArray = Array.isArray(evalRecord.results)
    ? evalRecord.results
    : (evalRecord as any)?.results ?? [];

  return {
    runId,
    timestamp,
    results: resultsArray as EvaluateResult[],
  };
}

/**
 * Parses a single evaluation result into structured judge output.
 * Returns null if parsing fails.
 */
function parseJudgeOutput(result: EvaluateResult): JudgeOutput | null {
  const raw = result.response?.output;

  if (typeof raw !== "string") {
    return null;
  }

  try {
    const cleanedJson = stripMarkdownFences(raw);
    const parsed: unknown = JSON.parse(cleanedJson);

    if (!isValidJudgeOutput(parsed)) {
      return null;
    }

    const providerId = extractProviderId(result.provider as ProviderIdentifier);
    const judge = normalizeJudgeName(providerId);

    return {
      ...parsed,
      judge,
    };
  } catch (error) {
    // Silent failure - invalid JSON is expected for non-judge results
    return null;
  }
}

/**
 * Extracts unique judge-model pairs from parsed outputs.
 */
function extractJudgeModelPairs(entries: JudgeOutput[]): JudgeModelPair[] {
  const uniquePairs = new Set(
    entries.map((entry) =>
      JSON.stringify({
        judge: entry.judge ?? "unknown",
        model: entry.model,
      })
    )
  );

  return Array.from(uniquePairs).map((str) => JSON.parse(str));
}

/**
 * Builds CSV header with run metadata and score columns.
 */
function buildCsvHeader(pairs: JudgeModelPair[]): string[] {
  const base = ["run_id", "timestamp"];

  const scoreColumns = pairs
    .slice()
    .sort((a, b) => {
      const judgeCompare = a.judge.localeCompare(b.judge);
      return judgeCompare !== 0 ? judgeCompare : a.model.localeCompare(b.model);
    })
    .flatMap(({judge, model}) =>
      CRITERIA.map((criterion) => `${judge}_${model}_${criterion}`)
    );

  return [...base, ...scoreColumns];
}

/**
 * Combines judge outputs into a single CSV row.
 */
function combineIntoRow(
  entries: JudgeOutput[],
  runId: string,
  timestamp: string
): CsvRow {
  const row: CsvRow = {run_id: runId, timestamp};

  for (const entry of entries) {
    const judge = entry.judge ?? "unknown";
    for (const criterion of CRITERIA) {
      const score = entry.scores[criterion]?.score;
      if (typeof score === "number") {
        row[`${judge}_${entry.model}_${criterion}`] = score.toString();
      }
    }
  }

  return row;
}

/**
 * Writes a CSV row to the score history file.
 * Creates header if file doesn't exist.
 */
function writeCsvRow(row: CsvRow, pairs: JudgeModelPair[]): void {
  ensureResultsDir();

  const header = buildCsvHeader(pairs);
  if (!existsSync(CSV_PATH)) {
    writeFileSync(CSV_PATH, `${header.join(",")}\n`);
  }

  const orderedValues = header.map((column) => row[column] ?? "");
  appendFileSync(CSV_PATH, `${orderedValues.join(",")}\n`);
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main orchestration function:
 * 1. Runs promptfoo evaluation
 * 2. Parses judge outputs
 * 3. Combines scores into CSV row
 * 4. Writes to score history file
 */
async function main(): Promise<void> {
  // Run evaluation
  const {results, runId, timestamp} = await runEvaluation();

  // Parse judge outputs
  const judgeOutputs = results
    .map(parseJudgeOutput)
    .filter((entry): entry is JudgeOutput => entry !== null);

  if (judgeOutputs.length === 0) {
    throw new Error(
      "No valid judge outputs detected. Check that models are returning valid JSON."
    );
  }

  // Extract metadata and combine scores
  const judgeModelPairs = extractJudgeModelPairs(judgeOutputs);
  const csvRow = combineIntoRow(judgeOutputs, runId, timestamp);

  // Write to CSV
  writeCsvRow(csvRow, judgeModelPairs);

  console.log(`✅ Logged scores to ${path.relative(REPO_ROOT, CSV_PATH)}`);
}

// Run and handle errors
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Evaluation failed: ${message}`);
    process.exit(1);
  });
