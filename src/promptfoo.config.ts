import {readFileSync} from "fs";
import * as path from "path";
import {config as loadEnv} from "dotenv";
import type {TestCase, UnifiedConfig} from "promptfoo";
import {modelConfigs} from "./modelConfigs";
import {judgePrompt} from "./prompts/judge-prompt";

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
  description: "Evaluate vendor PRDs using LLMs as judges",
  providers: modelConfigs,
  prompts: [judgePrompt],
  tests,
  outputPath: path.join("dist", "results", "latest.json"),
  evaluateOptions: {
    cache: false,
    maxConcurrency: 12,
  },
  commandLineOptions: {},
  // @ts-expect-error promptfoo types do not yet expose "tags" but CLI supports it
  tags: ["prd", "rubric", "interview"],
};

export default config;
