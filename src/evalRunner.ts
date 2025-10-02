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
  judge?: string;
};

type CombinedRow = {
  run_id: string;
  timestamp: string;
  [key: string]: string;
};

async function runPromptfoo() {
  const evalRecord = await promptfoo.evaluate(config as any);
  const runId = evalRecord.id ?? randomUUID();
  const timestamp = evalRecord.createdAt
    ? new Date(evalRecord.createdAt).toISOString()
    : new Date().toISOString();
  // Access results directly from evalRecord without database query
  const resultsArray = Array.isArray(evalRecord.results)
    ? evalRecord.results
    : (evalRecord as any)?.results ?? [];
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

function buildCsvHeader(
  judgeModelPairs: Array<{judge: string; model: string}>
): string[] {
  const base = ["run_id", "timestamp"];
  const perModelColumns = judgeModelPairs
    .slice()
    .sort((a, b) => {
      const judgeCompare = a.judge.localeCompare(b.judge);
      return judgeCompare !== 0 ? judgeCompare : a.model.localeCompare(b.model);
    })
    .flatMap(({judge, model}) =>
      criteria.map((criterion) => `${judge}_${model}_${criterion}`)
    );
  return base.concat(perModelColumns);
}

function normalizeJudgeName(providerId: string): string {
  if (providerId.includes("gpt-5")) {
    return "gpt5";
  }
  if (providerId.includes("claude-sonnet-4-5")) {
    return "claude45";
  }
  // Fallback: extract the first recognizable token
  const match = providerId.match(/[a-zA-Z0-9-]+/);
  return match ? match[0].replace(/-/g, "") : "unknown";
}

function parseJudgeOutput(result: EvaluateResult): JudgeJson | null {
  const raw = result.response?.output;
  if (typeof raw !== "string") {
    return null;
  }
  try {
    // Strip markdown code fences if present (e.g., ```json\n...\n```)
    const cleanedJson = raw
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "");
    const parsed = JSON.parse(cleanedJson) as JudgeJson;
    if (!parsed.model || !parsed.scores) {
      return null;
    }
    // Extract provider/judge information - handle both string and object formats
    const provider = result.provider as any;
    const providerId =
      typeof provider === "string" ? provider : provider?.id || "";
    parsed.judge = normalizeJudgeName(providerId);
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
    const judge = entry.judge || "unknown";
    for (const criterion of criteria) {
      const score = entry.scores[criterion]?.score;
      if (typeof score === "number") {
        row[`${judge}_${entry.model}_${criterion}`] = score.toString();
      }
    }
  }
  return row;
}

function writeCsvRow(
  row: CombinedRow,
  judgeModelPairs: Array<{judge: string; model: string}>
) {
  ensureResultsDir();
  const header = buildCsvHeader(judgeModelPairs);
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
  const judgeModelPairs = Array.from(
    new Set(
      judgeEntries.map((entry) =>
        JSON.stringify({judge: entry.judge || "unknown", model: entry.model})
      )
    )
  ).map((str) => JSON.parse(str) as {judge: string; model: string});
  const combined = combineRuns(judgeEntries, {
    runId: judgeEntries[0]?.runId ?? runId,
    timestamp: judgeEntries[0]?.timestamp ?? timestamp,
  });
  writeCsvRow(combined, judgeModelPairs);
  console.log(`Logged scores to ${path.relative(repoRoot, csvPath)}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
