import type {UnifiedConfig} from "promptfoo";

export const modelConfigs: UnifiedConfig["providers"] = [
  {
    id: "openai:gpt-5",
    config: {
      model: "gpt-5",
      temperature: 0,
      response_format: {type: "json_object"},
      max_tokens: 16000, // o1 models support up to 100k output tokens; 16k is reasonable for structured evaluation
      // GPT-5 (o1 series) has reasoning enabled by default
    },
  },
  // {
  //   id: "anthropic:messages:claude-sonnet-4-5-20250929",
  //   config: {
  //     temperature: 0,
  //     max_tokens: 8192, // Claude supports up to 8k output tokens
  //     // Claude uses different structured output approach - verify with Anthropic docs
  //     // response_format may not be supported; rely on prompt engineering
  //     extended_thinking: true, // Enable extended thinking for complex evaluation
  //   },
  // },
  {
    id: "openrouter:z-ai/glm-4.6",
    config: {
      temperature: 0,
      max_tokens: 4096,
      response_format: {type: "json_object"}, // Added for JSON enforcement via OpenRouter
      // GLM-4.6 should support JSON mode through OpenRouter's unified API
    },
  },
  {
    id: "openrouter:deepseek/deepseek-v3.2-exp",
    config: {
      temperature: 0,
      max_tokens: 8192, // DeepSeek v3 supports longer outputs; increased for detailed evaluations
      response_format: {type: "json_object"},
      // DeepSeek v3 has strong JSON mode support
    },
  },
  {
    id: "openrouter:google/gemini-2.5-pro",
    config: {
      temperature: 0,
      max_tokens: 8192, // Gemini 2.5 Pro supports up to 8k output; increased for detailed rationales
      response_format: {type: "json_object"},
      // Gemini 2.5 Pro has thinking mode enabled by default for complex tasks
    },
  },
];
