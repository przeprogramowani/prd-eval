import {appendFileSync, existsSync, mkdirSync, writeFileSync} from "fs";
import {randomUUID} from "crypto";
import path from "path";
import {config as loadEnv} from "dotenv";
import promptfoo, {type EvaluateResult} from "promptfoo";
import config from "./promptfoo.config";

loadEnv();

const repoRoot = path.resolve(__dirname, "..");
const resultsDir = path.join(repoRoot, "dist", "results");
const csvPath = path.join(resultsDir, "score-history.csv");

const criteria = [
  "problemDefinition",
  "requirementsClarity",
  "scopeBoundaries",
  "userStories",
  "measurability",
];

type JudgeJson = {
  model: string;
  scores: Record<string, {score: number}>;
  runId?: string;
  timestamp?: string;
};

type CombinedRow = {
  run_id: string;
  timestamp: string;
  [key: string]: string;
};

async function runPromptfoo() {
  const evalRecord = await promptfoo.evaluate(config as any);
  const results = await evalRecord.getResults();
  const runId = evalRecord.id ?? randomUUID();
  const timestamp = evalRecord.createdAt
    ? new Date(evalRecord.createdAt).toISOString()
    : new Date().toISOString();
  // getResults() returns an object with a nested 'results' array
  const resultsArray = Array.isArray(results)
    ? results
    : (results as any)?.results ?? [];
  return {
    runId,
    timestamp,
    results: resultsArray as EvaluateResult[],
  };
}

function ensureResultsDir() {
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, {recursive: true});
  }
}

function buildCsvHeader(models: string[]): string[] {
  const base = ["run_id", "timestamp"];
  const perModelColumns = models
    .slice()
    .sort()
    .flatMap((model) => criteria.map((criterion) => `${model}_${criterion}`));
  return base.concat(perModelColumns);
}

function parseJudgeOutput(result: EvaluateResult): JudgeJson | null {
  const raw = result.response?.output;
  if (typeof raw !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as JudgeJson;
    if (!parsed.model || !parsed.scores) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function combineRuns(
  entries: JudgeJson[],
  defaults: {runId: string; timestamp: string}
): CombinedRow {
  const row: CombinedRow = {
    run_id: defaults.runId,
    timestamp: defaults.timestamp,
  };
  for (const entry of entries) {
    for (const criterion of criteria) {
      const score = entry.scores[criterion]?.score;
      if (typeof score === "number") {
        row[`${entry.model}_${criterion}`] = score.toString();
      }
    }
  }
  return row;
}

function writeCsvRow(row: CombinedRow, models: string[]) {
  ensureResultsDir();
  const header = buildCsvHeader(models);
  if (!existsSync(csvPath)) {
    writeFileSync(csvPath, `${header.join(",")}\n`);
  }
  const orderedValues = header.map((column) => row[column] ?? "");
  appendFileSync(csvPath, `${orderedValues.join(",")}\n`);
}

async function main() {
  const {results: evalResults, runId, timestamp} = await runPromptfoo();
  const judgeEntries = evalResults
    .map(parseJudgeOutput)
    .filter((entry): entry is JudgeJson => entry !== null);
  if (!judgeEntries.length) {
    throw new Error("No JSON judge outputs detected");
  }
  const models = Array.from(new Set(judgeEntries.map((entry) => entry.model)));
  const combined = combineRuns(judgeEntries, {
    runId: judgeEntries[0]?.runId ?? runId,
    timestamp: judgeEntries[0]?.timestamp ?? timestamp,
  });
  writeCsvRow(combined, models);
  console.log(`Logged scores to ${path.relative(repoRoot, csvPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
