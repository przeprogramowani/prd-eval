import {existsSync, readFileSync, appendFileSync} from "fs";
import path from "path";
import config from "./promptfoo.config";

// ============================================================================
// Configuration
// ============================================================================

const RESULTS_PATH = path.join(
  __dirname,
  "..",
  "dist",
  "results",
  "latest.lite.json"
);

const CRITERIA = [
  "problemDefinition",
  "requirementsClarity",
  "scopeBoundaries",
  "userStories",
  "measurability",
] as const;

const CRITERIA_COUNT = CRITERIA.length;

// ============================================================================
// Types
// ============================================================================

type Criterion = (typeof CRITERIA)[number];

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

interface ModelDetails {
  metrics: Partial<Record<Criterion, number>>;
}

interface TopModel {
  vendor: string;
  average: number;
}

type ProviderIdentifier = string | Record<string, any>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extracts provider ID from promptfoo provider object or string.
 */
function extractProviderId(provider: ProviderIdentifier): string | null {
  if (typeof provider === "string") {
    return provider;
  }
  if (provider && typeof provider === "object" && "id" in provider) {
    const candidate = provider.id;
    return typeof candidate === "string" ? candidate : null;
  }
  return null;
}

/**
 * Extracts provider label from promptfoo provider object.
 */
function extractProviderLabel(provider: ProviderIdentifier): string | null {
  if (typeof provider === "string") {
    return provider;
  }
  if (provider && typeof provider === "object" && "label" in provider) {
    const candidate = provider.label;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  const providerId = extractProviderId(provider);
  return providerId;
}

/**
 * Converts a provider ID to a short, sanitized judge name.
 * Uses the same logic as evalRunner.ts for consistency.
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

/**
 * Gets the ordered list of models from config.
 */
function getConfiguredModelOrder(): string[] {
  const configuredTests = config.tests;
  if (!Array.isArray(configuredTests)) {
    return [];
  }

  const seen = new Set<string>();
  const orderedModels: string[] = [];

  for (const testCase of configuredTests) {
    if (!testCase || typeof testCase !== "object") {
      continue;
    }
    const vars = (testCase as any).vars;
    if (!vars || typeof vars !== "object") {
      continue;
    }
    const candidate = vars.modelName;
    if (typeof candidate === "string" && !seen.has(candidate)) {
      seen.add(candidate);
      orderedModels.push(candidate);
    }
  }

  return orderedModels;
}

/**
 * Gets the ordered list of judges from config.
 */
function getConfiguredJudgeOrder(): string[] {
  const providers = config.providers;
  if (!Array.isArray(providers)) {
    return [];
  }

  const seen = new Set<string>();
  const orderedJudges: string[] = [];

  for (const provider of providers) {
    const providerId = extractProviderId(provider);
    if (!providerId) {
      continue;
    }
    const alias = createJudgeNameFromProviderId(providerId);
    if (!seen.has(alias)) {
      seen.add(alias);
      orderedJudges.push(alias);
    }
  }

  return orderedJudges;
}

/**
 * Builds a map of judge aliases to display labels.
 */
function buildJudgeDisplayMap(): Record<string, string> {
  const providers = config.providers;
  if (!Array.isArray(providers)) {
    return {};
  }

  const labels: Record<string, string> = {};

  for (const provider of providers) {
    const providerId = extractProviderId(provider);
    if (!providerId) {
      continue;
    }
    const alias = createJudgeNameFromProviderId(providerId);
    const label = extractProviderLabel(provider);
    if (!label) {
      continue;
    }

    if (labels[alias]) {
      if (!labels[alias].includes(label)) {
        labels[alias] = `${labels[alias]}, ${label}`;
      }
    } else {
      labels[alias] = label;
    }
  }

  return labels;
}

/**
 * Parses the lite results JSON file.
 */
function parseLiteResults(filePath: string): LiteResults | null {
  if (!existsSync(filePath)) {
    console.error("⚠️  Lite results file not found");
    return null;
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed: unknown = JSON.parse(content);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Lite results JSON malformed");
    }

    const lite = parsed as Partial<LiteResults>;
    if (!lite.runId || !lite.timestamp || !lite.judges) {
      throw new Error("Lite results JSON missing required fields");
    }

    return lite as LiteResults;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`⚠️  Failed to read lite results: ${message}`);
    return null;
  }
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Groups scores by vendor (model) and judge.
 */
function groupScoresByVendorAndJudge(
  lite: LiteResults
): Record<string, Record<string, ModelDetails>> {
  const grouped: Record<string, Record<string, ModelDetails>> = {};

  for (const [judge, models] of Object.entries(lite.judges)) {
    if (!models) {
      continue;
    }

    for (const [vendor, data] of Object.entries(models)) {
      if (!grouped[vendor]) {
        grouped[vendor] = {};
      }

      const metrics: Partial<Record<Criterion, number>> = {};
      const scoreEntries = data?.scores ?? {};

      for (const criterion of CRITERIA) {
        const value = scoreEntries[criterion];
        if (typeof value === "number" && !Number.isNaN(value)) {
          metrics[criterion] = value;
        }
      }

      const details: ModelDetails = {metrics};

      grouped[vendor][judge] = details;
    }
  }

  return grouped;
}

/**
 * Formats criterion name for display.
 */
function formatMetricName(metric: string): string {
  return metric
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Calculates average score for a model judged by one judge.
 */
function calculateAverage(details: ModelDetails): string {
  const values = Object.values(details.metrics).filter(
    (value) => typeof value === "number" && !Number.isNaN(value)
  );

  if (values.length === 0) {
    return "N/A";
  }

  const sum = values.reduce((a, b) => a + b, 0);
  return (sum / values.length).toFixed(1);
}

/**
 * Finds top N models per judge based on average scores.
 */
function findTopModelsPerJudge(
  groupedScores: Record<string, Record<string, ModelDetails>>,
  topN = 3
): Record<string, TopModel[]> {
  const judgeAverages: Record<string, TopModel[]> = {};

  for (const [vendor, judgeData] of Object.entries(groupedScores)) {
    for (const [judge, details] of Object.entries(judgeData)) {
      const avg = calculateAverage(details);
      if (avg === "N/A") {
        continue;
      }

      const average = parseFloat(avg);
      if (Number.isNaN(average)) {
        continue;
      }

      if (!judgeAverages[judge]) {
        judgeAverages[judge] = [];
      }

      judgeAverages[judge].push({
        vendor,
        average,
      });
    }
  }

  const topPerJudge: Record<string, TopModel[]> = {};

  for (const [judge, averages] of Object.entries(judgeAverages)) {
    const sorted = averages
      .slice()
      .sort((a, b) => b.average - a.average)
      .slice(0, topN);
    topPerJudge[judge] = sorted;
  }

  return topPerJudge;
}

/**
 * Formats failure summary section.
 */
function formatFailureSummary(failures: ParseFailure[]): string {
  if (failures.length === 0) {
    return "";
  }

  let output = "\n## ⚠️  Evaluation Failures\n\n";

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
    output += `**${judge}**:\n`;
    for (const failure of judgeFailures) {
      output += `- \`${failure.model}\`: ${failure.reason}\n`;
      if (failure.output && failure.output.trim().length > 0) {
        const preview = failure.output.slice(0, 100).replace(/\n/g, " ");
        output += `  > ${preview}${failure.output.length > 100 ? "..." : ""}\n`;
      }
    }
    output += "\n";
  }

  return output;
}

/**
 * Formats the main score summary table.
 */
function formatScoreSummary(
  lite: LiteResults,
  groupedScores: Record<string, Record<string, ModelDetails>>,
  expectedModels: string[],
  judgeOrder: string[],
  judgeLabels: Record<string, string>
): string {
  const availableVendors = Object.keys(groupedScores);
  const vendorOrder =
    expectedModels.length > 0 ? expectedModels : availableVendors.sort();

  if (vendorOrder.length === 0) {
    return "⚠️  No vendor scores found\n";
  }

  const timestamp = new Date(lite.timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let output = "## 📊 PRD Evaluation Scores\n\n";
  output += `**Run ID:** \`${lite.runId}\`  \n`;
  output += `**Timestamp:** ${timestamp} UTC\n\n`;

  // Determine judges present in data
  const judgesInData = new Set<string>();
  for (const vendor of availableVendors) {
    const vendorData = groupedScores[vendor];
    Object.keys(vendorData ?? {}).forEach((judge) => judgesInData.add(judge));
  }

  // Build ordered judge list
  const orderedJudges = judgeOrder.length > 0 ? judgeOrder.slice() : [];
  for (const judge of judgesInData) {
    if (!orderedJudges.includes(judge)) {
      orderedJudges.push(judge);
    }
  }

  if (orderedJudges.length === 0) {
    return "⚠️  No judges found in results\n";
  }

  // Build table header
  const formattedCriteria = CRITERIA.map(formatMetricName);
  output += "| Model | Judge | ";
  formattedCriteria.forEach((name) => {
    output += `${name} | `;
  });
  output += "Total | Average |\n";

  output += "|-------|-------|";
  formattedCriteria.forEach(() => {
    output += "-------|";
  });
  output += "-------|--------|\n";

  // Build table rows
  for (const vendor of vendorOrder) {
    const vendorData = groupedScores[vendor];

    if (!vendorData || Object.keys(vendorData).length === 0) {
      const placeholderCells = CRITERIA.map(() => "N/A");
      const rowCells = [
        `**${vendor}** (0)`,
        "—",
        ...placeholderCells,
        "N/A",
        "N/A",
      ];
      output += `| ${rowCells.join(" | ")} |\n`;
      continue;
    }

    // Get judges for this vendor
    const judgesForVendor = orderedJudges.filter((judge) => vendorData[judge]);
    for (const judge of Object.keys(vendorData)) {
      if (!judgesForVendor.includes(judge)) {
        judgesForVendor.push(judge);
      }
    }

    const rowCount = judgesForVendor.length;

    judgesForVendor.forEach((judge, idx) => {
      const details = vendorData[judge];
      if (!details) {
        return;
      }

      const rowCells: string[] = [];

      // Model name (only on first row)
      if (idx === 0) {
        rowCells.push(`**${vendor}** (${rowCount})`);
      } else {
        rowCells.push("");
      }

      // Judge name
      const judgeLabel = judgeLabels[judge] ?? judge;
      rowCells.push(judgeLabel);

      // Criterion scores
      for (const criterion of CRITERIA) {
        const value = details.metrics[criterion];
        rowCells.push(
          typeof value === "number" && !Number.isNaN(value)
            ? value.toString()
            : "N/A"
        );
      }

      // Total score (calculated from metrics)
      const metricValues = CRITERIA.map(
        (criterion) => details.metrics[criterion]
      ).filter(
        (value) => typeof value === "number" && !Number.isNaN(value)
      ) as number[];
      const total =
        metricValues.length > 0
          ? metricValues.reduce((a, b) => a + b, 0).toString()
          : "N/A";
      rowCells.push(total);

      // Average
      const average = calculateAverage(details);
      rowCells.push(average === "N/A" ? "N/A" : `**${average}**`);

      output += `| ${rowCells.join(" | ")} |\n`;
    });
  }

  return output;
}

/**
 * Formats the top models per judge section.
 */
function formatTopModelsPerJudge(
  groupedScores: Record<string, Record<string, ModelDetails>>,
  judgeLabels: Record<string, string>
): string {
  const topPerJudge = findTopModelsPerJudge(groupedScores, 3);
  const judges = Object.keys(topPerJudge).sort();

  if (judges.length === 0) {
    return "";
  }

  let output = "\n## 🏆 Top 3 Models per Judge\n\n";

  for (const judge of judges) {
    const topModels = topPerJudge[judge];
    if (!topModels || topModels.length === 0) {
      continue;
    }

    const judgeName = judgeLabels[judge] ?? judge;
    output += `**${judgeName}**:\n`;

    topModels.forEach((model, index) => {
      const average = model.average.toFixed(1);
      output += `  ${index + 1}. \`${model.vendor}\` (avg: ${average})\n`;
    });
    output += "\n";
  }

  return output;
}

/**
 * Formats the overall model averages section.
 */
function formatModelAverages(
  groupedScores: Record<string, Record<string, ModelDetails>>,
  expectedModels: string[]
): string {
  const availableVendors = Object.keys(groupedScores);
  const vendorOrder =
    expectedModels.length > 0 ? expectedModels : availableVendors.sort();

  const rows: string[] = [];

  for (const vendor of vendorOrder) {
    const vendorData = groupedScores[vendor];
    if (!vendorData) {
      rows.push(`| ${vendor} | 0 | N/A | N/A |`);
      continue;
    }

    const totals: number[] = [];
    for (const details of Object.values(vendorData)) {
      const metricValues = CRITERIA.map(
        (criterion) => details.metrics[criterion]
      ).filter(
        (value) => typeof value === "number" && !Number.isNaN(value)
      ) as number[];

      if (metricValues.length > 0) {
        const total = metricValues.reduce((a, b) => a + b, 0);
        totals.push(total);
      }
    }

    if (totals.length === 0) {
      rows.push(`| ${vendor} | 0 | N/A | N/A |`);
      continue;
    }

    const sum = totals.reduce((a, b) => a + b, 0);
    const avgTotal = sum / totals.length;
    const avgScore = avgTotal / CRITERIA_COUNT;

    rows.push(
      `| ${vendor} | ${totals.length} | ${avgTotal.toFixed(
        1
      )} | ${avgScore.toFixed(1)} |`
    );
  }

  const hasData = rows.some((row) => !row.includes("| 0 | N/A |"));
  if (!hasData) {
    return "";
  }

  let output = "\n## 📈 Overall Model Averages\n\n";
  output += "| Model | Judges | Avg total | Avg score |\n";
  output += "|-------|--------|-----------|-----------|\n";
  output += rows.join("\n");
  output += "\n";

  return output;
}

// ============================================================================
// Main Execution
// ============================================================================

function main(): void {
  const liteResults = parseLiteResults(RESULTS_PATH);
  if (!liteResults) {
    process.exit(1);
  }

  const expectedModels = getConfiguredModelOrder();
  const judgeOrder = getConfiguredJudgeOrder();
  const judgeLabels = buildJudgeDisplayMap();
  const groupedScores = groupScoresByVendorAndJudge(liteResults);

  // Build all sections
  const summary = formatScoreSummary(
    liteResults,
    groupedScores,
    expectedModels,
    judgeOrder,
    judgeLabels
  );
  const modelAverages = formatModelAverages(groupedScores, expectedModels);
  const topModelsSummary = formatTopModelsPerJudge(groupedScores, judgeLabels);
  const failureSummary = formatFailureSummary(liteResults.failures ?? []);

  // Combine sections
  const sections = [
    summary,
    modelAverages,
    topModelsSummary,
    failureSummary,
  ].filter((section) => section && section.trim().length > 0);
  const combinedSummary = sections.join("");

  // Check if running in GitHub Actions
  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (isGitHubActions && stepSummaryPath) {
    appendFileSync(stepSummaryPath, combinedSummary);
    console.log("Score summary written to GitHub Actions step summary");
  } else {
    console.log(combinedSummary);
  }
}

main();
