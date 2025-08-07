import { generateText, streamText } from "ai";
import type { AIModel, SearchResult } from "@/types";
import { createAIProvider } from "./providers/ai-provider-factory";
import { CitationManager, createSearchContext } from "./utils/citation-system";
import { SYSTEM_PROMPTS, getModelConfig } from "./config";

export interface AIResponseRequest {
  query: string;
  searchResults: SearchResult[];
  model: AIModel;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  citations: Array<{
    id: number;
    title: string;
    url: string;
    source: string;
    snippet?: string;
  }>;
  model: AIModel;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  processingTime: number;
}

export class AIResponseGenerator {
  private citationManager: CitationManager;

  constructor() {
    this.citationManager = new CitationManager();
  }

  async generateResponse(request: AIResponseRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Clear previous citations and add new search results
      this.citationManager.clear();
      this.citationManager.addSearchResults(request.searchResults);

      // Create AI provider
      const model = createAIProvider(request.model);
      const modelConfig = getModelConfig(request.model);

      // Prepare the context
      const searchContext = createSearchContext(request.searchResults);
      const systemPrompt = SYSTEM_PROMPTS.search_analysis;

      // Build the conversation
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        ...(request.conversationHistory || []),
        {
          role: "user" as const,
          content: `Query: ${request.query}\n\n${searchContext}`,
        },
      ];

      console.log("Generating AI response with:", {
        model: request.model,
        provider: modelConfig.provider,
        searchResults: request.searchResults.length,
      });

      // Generate response
      const result = await generateText({
        model,
        messages,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || modelConfig.maxTokens,
      });

      const processingTime = Date.now() - startTime;

      const response: AIResponse = {
        content: result.text + this.citationManager.formatCitationList(),
        citations: this.citationManager.getAllCitations(),
        model: request.model,
        tokensUsed: {
          input: result.usage?.promptTokens || 0,
          output: result.usage?.completionTokens || 0,
          total: result.usage?.totalTokens || 0,
        },
        processingTime,
      };

      console.log("AI response generated:", {
        model: request.model,
        tokensUsed: response.tokensUsed,
        processingTime: response.processingTime,
        citations: response.citations.length,
      });

      return response;
    } catch (error) {
      console.error("AI response generation failed:", error);
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async *generateStreamingResponse(request: AIResponseRequest): AsyncGenerator<string, AIResponse, unknown> {
    const startTime = Date.now();
    
    try {
      // Clear previous citations and add new search results
      this.citationManager.clear();
      this.citationManager.addSearchResults(request.searchResults);

      // Create AI provider
      const model = createAIProvider(request.model);
      const modelConfig = getModelConfig(request.model);

      // Prepare the context
      const searchContext = createSearchContext(request.searchResults);
      const systemPrompt = SYSTEM_PROMPTS.search_analysis;

      // Build the conversation
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        ...(request.conversationHistory || []),
        {
          role: "user" as const,
          content: `Query: ${request.query}\n\n${searchContext}`,
        },
      ];

      console.log("Starting streaming AI response:", {
        model: request.model,
        provider: modelConfig.provider,
        searchResults: request.searchResults.length,
      });

      // Generate streaming response
      const result = await streamText({
        model,
        messages,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || modelConfig.maxTokens,
      });

      let fullContent = "";

      // Stream the response
      for await (const delta of result.textStream) {
        fullContent += delta;
        yield delta;
      }

      // Wait for final result
      const finalResult = await result.usage;
      const processingTime = Date.now() - startTime;

      // Add citations to the end
      const citationList = this.citationManager.formatCitationList();
      if (citationList) {
        yield citationList;
        fullContent += citationList;
      }

      const response: AIResponse = {
        content: fullContent,
        citations: this.citationManager.getAllCitations(),
        model: request.model,
        tokensUsed: {
          input: finalResult?.promptTokens || 0,
          output: finalResult?.completionTokens || 0,
          total: finalResult?.totalTokens || 0,
        },
        processingTime,
      };

      console.log("Streaming AI response completed:", {
        model: request.model,
        tokensUsed: response.tokensUsed,
        processingTime: response.processingTime,
        citations: response.citations.length,
      });

      return response;
    } catch (error) {
      console.error("Streaming AI response generation failed:", error);
      throw new Error(`Failed to generate streaming AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getModelStatus(): Promise<Record<AIModel, { available: boolean; error?: string }>> {
    const models: AIModel[] = ["claude-4", "gpt-4o", "grok-3", "gemini-2.5", "qwen-2.5", "llama-4"];
    const status: Record<string, { available: boolean; error?: string }> = {};

    for (const model of models) {
      try {
        createAIProvider(model);
        status[model] = { available: true };
      } catch (error) {
        status[model] = { 
          available: false, 
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }

    return status as Record<AIModel, { available: boolean; error?: string }>;
  }
}