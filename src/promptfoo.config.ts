import {readFileSync} from "fs";
import * as path from "path";
import {config as loadEnv} from "dotenv";
import type {TestCase, UnifiedConfig} from "promptfoo";

const repoRoot = path.resolve(__dirname, "..");
loadEnv({path: path.join(repoRoot, ".env")});
const rubricPath = path.join(repoRoot, "prd-job-interview.md");
const rubric = readFileSync(rubricPath, "utf-8");

const modelDirectories = [
  "gpt-5",
  "gemini-25",
  "grok-4-fast",
  "sonnet-45",
] as const;

type ModelDirectory = (typeof modelDirectories)[number];

interface EvaluationCase {
  modelName: ModelDirectory;
  prdPath: string;
  prdContent: string;
}

const evaluationCases: EvaluationCase[] = modelDirectories.map((modelName) => {
  const prdPath = path.join(repoRoot, "data", modelName, "prd.md");
  const prdContent = readFileSync(prdPath, "utf-8");

  return {
    modelName,
    prdPath,
    prdContent,
  };
});

const promptTemplate = `You are acting as a staff-level product interviewer. Your job is to evaluate the candidate's product requirement document (PRD) strictly according to the rubric below.

Rubric (verbatim):
{{rubric}}

Scoring instructions:
- Score each criterion independently on a 1-10 integer scale; do not average or reuse rationales across criteria.
- Reference concrete evidence from the PRD to justify each score.
- Highlight the strongest gap to discuss during the interview follow-up.
- After scoring all criteria, compute the total score (sum of five criteria) and assign a qualitative verdict: "exceptional" (40-50), "strong" (30-39), "developing" (20-29), or "needs support" (below 20).

Return a minified JSON object that matches the schema exactly:
{
  "model": string,
  "file": string,
  "scores": {
    "problemDefinition": { "score": number, "rationale": string },
    "requirementsClarity": { "score": number, "rationale": string },
    "scopeBoundaries": { "score": number, "rationale": string },
    "userStories": { "score": number, "rationale": string },
    "measurability": { "score": number, "rationale": string }
  },
  "totalScore": number,
  "verdict": string,
  "keyFollowUp": string
}

Formatting rules:
- Output MUST be valid JSON, no Markdown code fences, no additional commentary.
- Keep rationales under 400 characters each but include at least one concrete reference (quote, metric, or section name).
- Use {{modelName}} and {{prdPath}} to populate the "model" and "file" fields, respectively.
- The FIRST character of your response must be "{" and the LAST character must be "}". Do not emit any leading or trailing whitespace, explanations, apologies, or reasoning text.
- Never return thoughts such as "Thinking", "Analysis", or any text wrapped in Markdown fences. If you cannot comply, return exactly the string "{"error":"formatting"}".
- Follow the schema exactly and do not add or remove keys.

Valid response example (for illustration only; replace values with your own scores):
{"model":"${modelDirectories[0]}","file":"/path/to/prd.md","scores":{"problemDefinition":{"score":7,"rationale":"Example"},"requirementsClarity":{"score":7,"rationale":"Example"},"scopeBoundaries":{"score":7,"rationale":"Example"},"userStories":{"score":7,"rationale":"Example"},"measurability":{"score":7,"rationale":"Example"}},"totalScore":35,"verdict":"strong","keyFollowUp":"Example"}

Candidate PRD to evaluate:
---
{{prdContent}}
---`;

const tests: TestCase[] = evaluationCases.map(
  ({modelName, prdPath, prdContent}) => ({
    description: `Evaluate ${modelName} PRD`,
    vars: {
      modelName,
      prdPath,
      prdContent,
      rubric,
    },
  })
);

const config: UnifiedConfig = {
  description:
    "Evaluate vendor PRDs using GPT-5, Claude Sonnet 4.5, and Gemini 2.5 Pro as judges",
  providers: [
    {
      id: "openai:gpt-5",
      config: {
        model: "gpt-5",
        temperature: 0,
        response_format: {type: "json_object"},
        // GPT-5 (o1 series) has reasoning enabled by default
      },
    },
    {
      id: "anthropic:messages:claude-sonnet-4-5-20250929",
      config: {
        temperature: 0,
        response_format: {type: "json_object"},
        // Claude Sonnet 4.5 supports extended thinking
        extended_thinking: true,
      },
    },
    {
      id: "openrouter:google/gemini-2.5-pro",
      config: {
        temperature: 0,
        max_tokens: 4096,
        response_format: {type: "json_object"},
        // Gemini 2.5 Pro has thinking mode (already active based on output)
      },
    },
  ],
  prompts: [promptTemplate],
  tests,
  outputPath: path.join("dist", "results", "latest.json"),
  evaluateOptions: {
    cache: false,
    maxConcurrency: 4,
  },
  commandLineOptions: {},
  // @ts-expect-error promptfoo types do not yet expose "tags" but CLI supports it
  tags: ["prd", "rubric", "interview"],
};

export default config;
