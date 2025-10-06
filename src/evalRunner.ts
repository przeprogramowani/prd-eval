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
const LITE_JSON_PATH = path.join(RESULTS_DIR, "latest.lite.json");

const CRITERIA = [
  "problemDefinition",
  "requirementsClarity",
  "scopeBoundaries",
  "userStories",
  "measurability",
] as const;

/**
 * Builds judge name mappings from the providers in promptfoo config.
 * Extracts provider IDs and creates normalized short names for CSV columns.
 */
function buildJudgeMappings(): Record<string, string> {
  const mappings: Record<string, string> = {};

  if (!config.providers || !Array.isArray(config.providers)) {
    return mappings;
  }

  for (const provider of config.providers) {
    let providerId: string | undefined;

    if (typeof provider === "string") {
      providerId = provider;
    } else if (provider && typeof provider === "object" && "id" in provider) {
      providerId = provider.id as string;
    }

    if (!providerId) continue;

    // Create normalized judge name from provider ID
    const judgeName = createJudgeNameFromProviderId(providerId);
    mappings[providerId] = judgeName;
  }

  return mappings;
}

/**
 * Converts a provider ID to a short, sanitized judge name.
 * Examples:
 * - "openai:gpt-5" → "gpt5"
 * - "openrouter:z-ai/glm-4.6" → "glm46"
 * - "openrouter:google/gemini-2.5-pro" → "gemini25pro"
 * - "anthropic:messages:claude-sonnet-4-5-20250929" → "claudesonnet45"
 */
function createJudgeNameFromProviderId(providerId: string): string {
  // Strip provider prefix (e.g., "openai:", "openrouter:", "anthropic:messages:")
  let name = providerId.replace(/^[^:]+:(?:messages:)?/, "");

  // For OpenRouter format (org/model), take the model part
  if (name.includes("/")) {
    const parts = name.split("/");
    name = parts[parts.length - 1] || name;
  }

  // Strip version suffixes like -20250929
  name = name.replace(/-\d{8}$/, "");

  // Remove dots, hyphens, and underscores
  name = name.replace(/[.\-_]/g, "");

  // Keep only alphanumeric characters
  name = name.replace(/[^a-zA-Z0-9]/g, "");

  return name.toLowerCase();
}

const JUDGE_MAPPINGS: Record<string, string> = buildJudgeMappings();

// ============================================================================
// Types
// ============================================================================

type Criterion = (typeof CRITERIA)[number];

interface JudgeOutput {
  model: string;
  scores: Record<string, number>;
  judge?: string;
  file?: string;
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

interface LiteJudgeModelResult {
  file?: string;
  scores: Partial<Record<Criterion, number>>;
}

interface ParseFailure {
  judge: string;
  model: string;
  reason: string;
  output?: string;
}

interface LiteResults {
  runId: string;
  timestamp: string;
  judges: Record<string, Record<string, LiteJudgeModelResult>>;
  failures?: ParseFailure[];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Strips markdown code fences and thinking blocks from JSON output.
 * Handles formats like ```json\n...\n``` or ```\n...\n```
 * Also removes "Thinking:" blocks that some models emit despite instructions
 */
function stripMarkdownFences(text: string): string {
  let cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "");

  // Find the first "{" which should be the start of JSON
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart > 0) {
    cleaned = cleaned.substring(jsonStart);
  }

  // Find the last "}" which should be the end of JSON
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonEnd > 0 && jsonEnd < cleaned.length - 1) {
    cleaned = cleaned.substring(0, jsonEnd + 1);
  }

  return cleaned.trim();
}

/**
 * Extracts provider ID from promptfoo provider object or string.
 */
function extractProviderId(provider: ProviderIdentifier): string {
  return typeof provider === "string" ? provider : provider?.id ?? "";
}

/**
 * Normalizes provider ID to a short judge name.
 * Uses dynamically built mappings from config or creates name on the fly.
 */
function normalizeJudgeName(providerId: string): string {
  // Try exact match first
  if (JUDGE_MAPPINGS[providerId]) {
    return JUDGE_MAPPINGS[providerId];
  }

  // Try substring match (for flexibility with provider variations)
  for (const [key, value] of Object.entries(JUDGE_MAPPINGS)) {
    if (providerId.includes(key) || key.includes(providerId)) {
      return value;
    }
  }

  // Fallback: create judge name on the fly using the same logic
  return createJudgeNameFromProviderId(providerId);
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
 * Returns parsed output or null if parsing fails, along with failure details.
 */
function parseJudgeOutput(result: EvaluateResult): {
  output: JudgeOutput | null;
  failure?: ParseFailure;
} {
  const providerId = extractProviderId(result.provider as ProviderIdentifier);
  const judge = normalizeJudgeName(providerId);

  // Get model name from test case or vars
  const model =
    (result.testCase?.vars?.modelName as string) ||
    (result.vars?.modelName as string) ||
    "unknown";

  // Check for API errors
  if (result.response?.error) {
    return {
      output: null,
      failure: {
        judge,
        model,
        reason: "API error",
        output: String(result.response.error).slice(0, 200),
      },
    };
  }

  const raw = result.response?.output;

  if (typeof raw !== "string") {
    return {
      output: null,
      failure: {
        judge,
        model,
        reason: "Missing or non-string output",
        output: String(raw),
      },
    };
  }

  // Check for empty or whitespace-only output
  if (raw.trim().length === 0) {
    return {
      output: null,
      failure: {
        judge,
        model,
        reason: "Empty output",
        output: raw,
      },
    };
  }

  try {
    const cleanedJson = stripMarkdownFences(raw);
    const parsed: unknown = JSON.parse(cleanedJson);

    if (!isValidJudgeOutput(parsed)) {
      return {
        output: null,
        failure: {
          judge,
          model,
          reason: "Invalid schema (missing model or scores)",
          output: cleanedJson.slice(0, 200),
        },
      };
    }

    return {
      output: {
        ...parsed,
        judge,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      output: null,
      failure: {
        judge,
        model,
        reason: `JSON parse error: ${errorMsg}`,
        output: raw.slice(0, 200),
      },
    };
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
      const score = entry.scores[criterion];
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

/**
 * Builds a lite JSON representation of judge results.
 * Organizes by judge -> model -> scores, and includes failures.
 */
function buildLiteResults(
  judgeOutputs: JudgeOutput[],
  failures: ParseFailure[],
  runId: string,
  timestamp: string
): LiteResults {
  const judges: Record<string, Record<string, LiteJudgeModelResult>> = {};

  for (const output of judgeOutputs) {
    const judge = output.judge ?? "unknown";
    const model = output.model;

    if (!judges[judge]) {
      judges[judge] = {};
    }

    const scores: Partial<Record<Criterion, number>> = {};
    for (const criterion of CRITERIA) {
      const score = output.scores[criterion];
      if (typeof score === "number") {
        scores[criterion] = score;
      }
    }

    const result: LiteJudgeModelResult = {
      scores,
    };

    if (output.file) {
      result.file = output.file;
    }

    judges[judge][model] = result;
  }

  const liteResults: LiteResults = {
    runId,
    timestamp,
    judges,
  };

  if (failures.length > 0) {
    liteResults.failures = failures;
  }

  return liteResults;
}

/**
 * Writes lite JSON format to file for use by resultInterpreter.
 */
function writeLiteJson(liteResults: LiteResults): void {
  ensureResultsDir();
  const json = JSON.stringify(liteResults, null, 2);
  writeFileSync(LITE_JSON_PATH, json);
}

/**
 * Logs a detailed summary of evaluation results and failures.
 */
function logEvaluationSummary(
  judgeOutputs: JudgeOutput[],
  failures: ParseFailure[]
): void {
  console.log("\n" + "=".repeat(70));
  console.log("📊 EVALUATION SUMMARY");
  console.log("=".repeat(70));

  // Overall stats
  const totalResults = judgeOutputs.length + failures.length;
  const successRate =
    totalResults > 0
      ? ((judgeOutputs.length / totalResults) * 100).toFixed(1)
      : "0.0";

  console.log(
    `\n✅ Successful: ${judgeOutputs.length}/${totalResults} (${successRate}%)`
  );
  console.log(`❌ Failed: ${failures.length}/${totalResults}`);

  // Success breakdown by judge
  if (judgeOutputs.length > 0) {
    console.log("\n📈 Successful evaluations by judge:");
    const successByJudge = new Map<string, string[]>();

    for (const output of judgeOutputs) {
      const judge = output.judge ?? "unknown";
      if (!successByJudge.has(judge)) {
        successByJudge.set(judge, []);
      }
      successByJudge.get(judge)!.push(output.model);
    }

    for (const [judge, models] of Array.from(successByJudge.entries()).sort()) {
      console.log(`  ${judge}: ${models.sort().join(", ")}`);
    }
  }

  // Failure breakdown
  if (failures.length > 0) {
    console.log("\n⚠️  Failed evaluations:");

    // Group by judge
    const failuresByJudge = new Map<string, ParseFailure[]>();
    for (const failure of failures) {
      if (!failuresByJudge.has(failure.judge)) {
        failuresByJudge.set(failure.judge, []);
      }
      failuresByJudge.get(failure.judge)!.push(failure);
    }

    for (const [judge, judgeFailures] of Array.from(
      failuresByJudge.entries()
    ).sort()) {
      console.log(`\n  🔴 ${judge}:`);
      for (const failure of judgeFailures) {
        console.log(`     • ${failure.model}: ${failure.reason}`);
        if (failure.output && failure.output.length > 0) {
          const preview = failure.output.replace(/\n/g, "\\n");
          console.log(
            `       Output: ${preview}${
              failure.output.length > 200 ? "..." : ""
            }`
          );
        }
      }
    }
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main orchestration function:
 * 1. Runs promptfoo evaluation
 * 2. Parses judge outputs and collects failures
 * 3. Logs summary of successes and failures
 * 4. Combines scores into CSV row
 * 5. Writes to score history file
 */
async function main(): Promise<void> {
  // Run evaluation
  console.log("🔄 Running evaluation...\n");
  const {results, runId, timestamp} = await runEvaluation();

  // Parse judge outputs and collect failures
  const judgeOutputs: JudgeOutput[] = [];
  const failures: ParseFailure[] = [];

  for (const result of results) {
    const {output, failure} = parseJudgeOutput(result);
    if (output) {
      judgeOutputs.push(output);
    } else if (failure) {
      failures.push(failure);
    }
  }

  // Log summary
  logEvaluationSummary(judgeOutputs, failures);

  if (judgeOutputs.length === 0) {
    throw new Error(
      "No valid judge outputs detected. All evaluations failed. Check logs above for details."
    );
  }

  // Extract metadata and combine scores
  const judgeModelPairs = extractJudgeModelPairs(judgeOutputs);
  const csvRow = combineIntoRow(judgeOutputs, runId, timestamp);
  const liteResults = buildLiteResults(
    judgeOutputs,
    failures,
    runId,
    timestamp
  );

  // Write outputs
  writeCsvRow(csvRow, judgeModelPairs);
  writeLiteJson(liteResults);

  console.log(`✅ Logged scores to ${path.relative(REPO_ROOT, CSV_PATH)}`);
  console.log(
    `✅ Wrote lite JSON to ${path.relative(REPO_ROOT, LITE_JSON_PATH)}`
  );

  if (failures.length > 0) {
    console.log(
      `⚠️  Warning: ${failures.length} evaluation(s) failed. Check summary above.\n`
    );
  }
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
