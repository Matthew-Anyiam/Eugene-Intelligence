import type { AIModel } from "@/types";

export const AI_MODELS = {
  "claude-4": {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    name: "Claude 4",
    description: "Most advanced reasoning and analysis",
    contextWindow: 200000,
    maxTokens: 4096,
    streaming: true,
    multimodal: true,
  },
  "gpt-4o": {
    provider: "openai",
    model: "gpt-4o",
    name: "GPT-4o",
    description: "Multimodal capabilities with vision",
    contextWindow: 128000,
    maxTokens: 4096,
    streaming: true,
    multimodal: true,
  },
  "grok-3": {
    provider: "xai",
    model: "grok-beta",
    name: "Grok 3",
    description: "Real-time information access",
    contextWindow: 131072,
    maxTokens: 4096,
    streaming: true,
    multimodal: false,
  },
  "gemini-2.5": {
    provider: "google",
    model: "gemini-1.5-pro",
    name: "Gemini 2.5",
    description: "Long context understanding",
    contextWindow: 1000000,
    maxTokens: 8192,
    streaming: true,
    multimodal: true,
  },
  "qwen-2.5": {
    provider: "groq",
    model: "qwen2.5-72b-instruct",
    name: "Qwen 2.5",
    description: "Ultra-fast inference",
    contextWindow: 32768,
    maxTokens: 8192,
    streaming: true,
    multimodal: false,
  },
  "llama-4": {
    provider: "groq",
    model: "llama3-groq-70b-8192-tool-use-preview",
    name: "Llama 4",
    description: "Open-source AI power",
    contextWindow: 8192,
    maxTokens: 8192,
    streaming: true,
    multimodal: false,
  },
} as const;

export const SYSTEM_PROMPTS = {
  search_analysis: `You are Eugene Intelligence, an advanced AI search assistant. Your role is to analyze search results and provide comprehensive, accurate, and insightful responses.

Guidelines:
1. Analyze the provided search results thoroughly
2. Synthesize information from multiple sources
3. Provide accurate, well-reasoned answers
4. Include relevant citations using [1], [2], etc. format
5. If information is conflicting, acknowledge different viewpoints
6. If search results don't fully answer the query, indicate what's missing
7. Be concise yet comprehensive
8. Maintain objectivity and fact-based responses

When citing sources:
- Use numbered citations [1], [2], [3] etc.
- Reference specific search results provided
- Place citations immediately after relevant information
- Provide a citation list at the end of your response`,

  conversation: `You are Eugene Intelligence, a helpful AI assistant with access to real-time search capabilities. You provide informative, accurate, and engaging responses while maintaining a professional yet approachable tone.

Your capabilities include:
- Web search and analysis
- Academic research
- Code analysis and execution
- Weather and location information
- Financial market data
- Social media insights

Always:
- Provide accurate, well-sourced information
- Use citations when referencing search results
- Be helpful and informative
- Acknowledge limitations when appropriate
- Maintain user privacy and safety`,
} as const;

export function getModelConfig(model: AIModel) {
  return AI_MODELS[model];
}

export function isModelAvailable(model: AIModel): boolean {
  const config = AI_MODELS[model];
  if (!config) return false;

  const envKey = getAPIKeyName(config.provider);
  return !!process.env[envKey];
}

function getAPIKeyName(provider: string): string {
  const keyMap = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    xai: "XAI_API_KEY",
    google: "GOOGLE_GENERATIVE_AI_API_KEY",
    groq: "GROQ_API_KEY",
  };
  return keyMap[provider as keyof typeof keyMap] || "";
}