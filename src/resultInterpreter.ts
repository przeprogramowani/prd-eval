import * as fs from "fs";
import * as path from "path";

interface ScoreRow {
  run_id: string;
  timestamp: string;
  scores: Record<string, string>;
}

function parseCSV(filePath: string): ScoreRow | null {
  if (!fs.existsSync(filePath)) {
    console.error("⚠️ Score history file not found");
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  if (lines.length < 2) {
    console.error("⚠️ No score data found in CSV");
    return null;
  }

  const headerLine = lines[0];
  const lastDataLine = lines[lines.length - 1];

  if (!headerLine || !lastDataLine) {
    console.error("⚠️ Invalid CSV structure");
    return null;
  }

  const headers = headerLine.split(",");
  const dataValues = lastDataLine.split(",");

  const scores: Record<string, string> = {};
  for (let i = 2; i < headers.length; i++) {
    const header = headers[i];
    const value = dataValues[i];
    if (header && value !== undefined) {
      scores[header] = value;
    }
  }

  const runId = dataValues[0];
  const timestamp = dataValues[1];

  if (!runId || !timestamp) {
    console.error("⚠️ Missing run_id or timestamp");
    return null;
  }

  return {
    run_id: runId,
    timestamp: timestamp,
    scores,
  };
}

interface VendorJudgeScores {
  [vendor: string]: {
    [judge: string]: Record<string, string>;
  };
}

function groupScoresByVendorAndJudge(
  scores: Record<string, string>
): VendorJudgeScores {
  const grouped: VendorJudgeScores = {};

  for (const [key, value] of Object.entries(scores)) {
    const parts = key.split("_");

    // New format: judge_vendor_metric
    if (parts.length >= 3) {
      const judge = parts[0];
      const vendor = parts[1];
      const metric = parts.slice(2).join("_");

      if (!judge || !vendor || !metric) {
        continue;
      }

      if (!grouped[vendor]) {
        grouped[vendor] = {};
      }
      if (!grouped[vendor][judge]) {
        grouped[vendor][judge] = {};
      }
      grouped[vendor][judge][metric] = value;
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

function calculateAverage(scores: Record<string, string>): string {
  const values = Object.values(scores).map(Number);
  const sum = values.reduce((a, b) => a + b, 0);
  return (sum / values.length).toFixed(1);
}

function formatScoreSummary(row: ScoreRow): string {
  const groupedScores = groupScoresByVendorAndJudge(row.scores);
  const vendors = Object.keys(groupedScores).sort();

  if (vendors.length === 0) {
    return "⚠️ No vendor scores found\n";
  }

  const timestamp = new Date(row.timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let output = "## 📊 PRD Evaluation Scores\n\n";
  output += `**Run ID:** \`${row.run_id}\`  \n`;
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
        output += `${score ?? "N/A"} | `;
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

function main() {
  const resultsPath = path.join(
    __dirname,
    "..",
    "dist",
    "results",
    "score-history.csv"
  );
  const scoreRow = parseCSV(resultsPath);

  if (!scoreRow) {
    process.exit(1);
  }

  const summary = formatScoreSummary(scoreRow);

  // Check if running in GitHub Actions
  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (isGitHubActions && stepSummaryPath) {
    // Write to GitHub Actions summary
    fs.appendFileSync(stepSummaryPath, summary);
    console.log("✅ Score summary written to GitHub Actions step summary");
  } else {
    // Just log to console
    console.log(summary);
  }
}

main();
