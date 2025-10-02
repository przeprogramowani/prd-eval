import * as fs from "fs";
import * as path from "path";

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

type Criterion = (typeof CRITERIA)[number];

interface LiteJudgeModelResult {
  file?: string;
  scores: Partial<Record<Criterion, number>>;
  totalScore?: number;
  verdict?: string;
  keyFollowUp?: string;
}

interface LiteResults {
  runId: string;
  timestamp: string;
  judges: Record<string, Record<string, LiteJudgeModelResult>>;
}

interface VendorJudgeScores {
  [vendor: string]: {
    [judge: string]: Record<string, number>;
  };
}

function parseLiteResults(filePath: string): LiteResults | null {
  if (!fs.existsSync(filePath)) {
    console.error("⚠️ Lite results file not found");
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as LiteResults;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Lite results JSON malformed");
    }

    if (!parsed.runId || !parsed.timestamp || !parsed.judges) {
      throw new Error("Lite results JSON missing required fields");
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`⚠️ Failed to read lite results: ${message}`);
    return null;
  }
}

function groupScoresByVendorAndJudge(lite: LiteResults): VendorJudgeScores {
  const grouped: VendorJudgeScores = {};

  for (const [judge, models] of Object.entries(lite.judges)) {
    if (!models) continue;

    for (const [vendor, data] of Object.entries(models)) {
      if (!grouped[vendor]) {
        grouped[vendor] = {};
      }
      if (!grouped[vendor][judge]) {
        grouped[vendor][judge] = {};
      }

      const scores = data?.scores ?? {};
      for (const [metric, value] of Object.entries(scores)) {
        if (typeof value === "number" && !Number.isNaN(value)) {
          grouped[vendor][judge][metric] = value;
        }
      }
    }
  }

  return grouped;
}

function formatMetricName(metric: string): string {
  return metric
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function calculateAverage(scores: Record<string, number>): string {
  const values = Object.values(scores);
  if (values.length === 0) {
    return "N/A";
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return (sum / values.length).toFixed(1);
}

function findBestModelPerJudge(
  groupedScores: VendorJudgeScores
): Record<string, {vendor: string; average: number}> {
  const judgeAverages: Record<
    string,
    Array<{vendor: string; average: number}>
  > = {};

  // Collect all averages per judge-vendor combination
  for (const [vendor, judgeData] of Object.entries(groupedScores)) {
    for (const [judge, scores] of Object.entries(judgeData)) {
      if (!judgeAverages[judge]) {
        judgeAverages[judge] = [];
      }
      const avg = parseFloat(calculateAverage(scores));
      judgeAverages[judge].push({vendor, average: avg});
    }
  }

  // Find best vendor for each judge
  const bestPerJudge: Record<string, {vendor: string; average: number}> = {};
  for (const [judge, averages] of Object.entries(judgeAverages)) {
    const best = averages.reduce((max, current) =>
      current.average > max.average ? current : max
    );
    bestPerJudge[judge] = best;
  }

  return bestPerJudge;
}

function formatScoreSummary(
  lite: LiteResults,
  groupedScores: VendorJudgeScores
): string {
  const vendors = Object.keys(groupedScores).sort();

  if (vendors.length === 0) {
    return "⚠️ No vendor scores found\n";
  }

  const timestamp = new Date(lite.timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let output = "## 📊 PRD Evaluation Scores\n\n";
  output += `**Run ID:** \`${lite.runId}\`  \n`;
  output += `**Timestamp:** ${timestamp} UTC\n\n`;

  // Extract all unique judges across all vendors
  const allJudges = new Set<string>();
  for (const vendor of vendors) {
    const vendorData = groupedScores[vendor];
    if (vendorData) {
      Object.keys(vendorData).forEach((judge) => allJudges.add(judge));
    }
  }
  const judges = Array.from(allJudges).sort();

  // Get metrics from the first available judge/vendor combo
  let metrics: string[] = [];
  for (const vendor of vendors) {
    const vendorData = groupedScores[vendor];
    if (!vendorData) continue;

    for (const judge of judges) {
      const judgeScores = vendorData[judge];
      if (judgeScores && Object.keys(judgeScores).length > 0) {
        metrics = Object.keys(judgeScores);
        break;
      }
    }
    if (metrics.length > 0) break;
  }

  if (metrics.length === 0) {
    return "⚠️ No metrics found\n";
  }

  // Create table header
  output += "| Vendor | Judge | ";
  metrics.forEach((metric) => {
    output += `${formatMetricName(metric)} | `;
  });
  output += "Average |\n";

  output += "|--------|-------|";
  metrics.forEach(() => {
    output += "--------|";
  });
  output += "--------|\n";

  // Data rows - one row per vendor-judge combination
  for (const vendor of vendors) {
    const vendorData = groupedScores[vendor];
    if (!vendorData) continue;

    const judgesForVendor = Object.keys(vendorData).sort();
    const rowSpan = judgesForVendor.length;

    judgesForVendor.forEach((judge, judgeIdx) => {
      const judgeScores = vendorData[judge];
      if (!judgeScores) return;

      // First row for this vendor includes the vendor name
      if (judgeIdx === 0) {
        output += `| **${vendor}** (${rowSpan}) | `;
      } else {
        output += "| | ";
      }

      output += `${judge} | `;

      metrics.forEach((metric) => {
        const score = judgeScores[metric];
        output += `${score !== undefined ? score : "N/A"} | `;
      });

      const avg = calculateAverage(judgeScores);
      output += `**${avg}** |\n`;
    });
  }

  output += `\n_Last updated: ${new Date()
    .toISOString()
    .replace("T", " ")
    .slice(0, -5)} UTC_\n`;

  return output;
}

function formatBestModelPerJudge(groupedScores: VendorJudgeScores): string {
  const bestPerJudge = findBestModelPerJudge(groupedScores);
  const judges = Object.keys(bestPerJudge).sort();

  if (judges.length === 0) {
    return "";
  }

  let output = "\n## 🏆 Best Model per Judge\n\n";

  for (const judge of judges) {
    const best = bestPerJudge[judge];
    if (best) {
      output += `**${judge}**: \`${best.vendor}\` (avg: ${best.average})\n`;
    }
  }

  return output;
}

function main(): void {
  const liteResults = parseLiteResults(RESULTS_PATH);

  if (!liteResults) {
    process.exit(1);
  }

  const groupedScores = groupScoresByVendorAndJudge(liteResults);
  const summary = formatScoreSummary(liteResults, groupedScores);
  const bestModelSummary = formatBestModelPerJudge(groupedScores);

  // Check if running in GitHub Actions
  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (isGitHubActions && stepSummaryPath) {
    // Write to GitHub Actions summary
    fs.appendFileSync(stepSummaryPath, summary + bestModelSummary);
    console.log("✅ Score summary written to GitHub Actions step summary");
  } else {
    // Log to console
    console.log(summary);
    console.log(bestModelSummary);
  }
}

main();
