import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import type { AIModel } from "@/types";
import { AI_MODELS } from "../config";

export function createAIProvider(model: AIModel): any {
  const config = AI_MODELS[model];
  if (!config) {
    throw new Error(`Unsupported AI model: ${model}`);
  }

  switch (config.provider) {
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is required for Claude models");
      }
      return anthropic(config.model);

    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required for GPT models");
      }
      return openai(config.model);

    case "xai":
      if (!process.env.XAI_API_KEY) {
        throw new Error("XAI_API_KEY is required for Grok models");
      }
      return xai(config.model);

    case "google":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required for Gemini models");
      }
      return google(config.model);

    case "groq":
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is required for Groq models");
      }
      return groq(config.model);

    default:
      const _exhaustiveCheck: never = config;
      throw new Error(`Unsupported AI provider: ${_exhaustiveCheck}`);
  }
}

export function getAvailableModels(): AIModel[] {
  return (Object.keys(AI_MODELS) as AIModel[]).filter(model => {
    const config = AI_MODELS[model];
    const envKey = getAPIKeyName(config.provider);
    return !!process.env[envKey];
  });
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