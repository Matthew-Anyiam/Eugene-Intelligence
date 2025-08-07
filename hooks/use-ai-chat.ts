"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AIModel, SearchResult } from "@/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Array<{
    id: number;
    title: string;
    url: string;
    source: string;
    snippet?: string;
  }>;
  model?: AIModel;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  processingTime?: number;
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

interface UseAIChatOptions {
  model?: AIModel;
  temperature?: number;
  streaming?: boolean;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { model = "claude-4", temperature = 0.7, streaming = true } = options;

  // Mutation for non-streaming AI responses
  const aiResponseMutation = useMutation({
    mutationFn: async ({
      query,
      searchResults,
      aiModel,
      conversationHistory,
    }: {
      query: string;
      searchResults: SearchResult[];
      aiModel: AIModel;
      conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    }) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          searchResults,
          model: aiModel,
          conversationHistory,
          temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || data.message || "AI response failed");
      }

      return data.response as AIResponse;
    },
  });

  // Function for streaming AI responses
  const generateStreamingResponse = async (
    query: string,
    searchResults: SearchResult[],
    aiModel: AIModel,
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
  ) => {
    try {
      setIsStreaming(true);
      setStreamingMessage("");

      // Create abort controller
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          searchResults,
          model: aiModel,
          conversationHistory,
          temperature,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            
            if (data === "[DONE]") {
              setIsStreaming(false);
              return fullContent;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === "content") {
                fullContent += parsed.content;
                setStreamingMessage(prev => prev + parsed.content);
              } else if (parsed.type === "complete") {
                setIsStreaming(false);
                return parsed.data as AIResponse;
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              console.warn("Failed to parse streaming data:", data);
            }
          }
        }
      }

      setIsStreaming(false);
      return { content: fullContent } as AIResponse;
    } catch (error) {
      setIsStreaming(false);
      setStreamingMessage("");
      throw error;
    }
  };

  const sendMessage = async (
    query: string,
    searchResults: SearchResult[],
    aiModel?: AIModel
  ) => {
    const currentModel = aiModel || model;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Prepare conversation history
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      if (streaming) {
        const response = await generateStreamingResponse(
          query,
          searchResults,
          currentModel,
          conversationHistory
        );

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: typeof response === 'string' ? response : response.content,
          timestamp: new Date(),
          citations: typeof response === 'object' ? response.citations : undefined,
          model: currentModel,
          tokensUsed: typeof response === 'object' ? response.tokensUsed : undefined,
          processingTime: typeof response === 'object' ? response.processingTime : undefined,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingMessage("");
        
        return assistantMessage;
      } else {
        const response = await aiResponseMutation.mutateAsync({
          query,
          searchResults,
          aiModel: currentModel,
          conversationHistory,
        });

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.content,
          timestamp: new Date(),
          citations: response.citations,
          model: currentModel,
          tokensUsed: response.tokensUsed,
          processingTime: response.processingTime,
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        return assistantMessage;
      }
    } catch (error) {
      console.error("AI chat error:", error);
      throw error;
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingMessage("");
  };

  const clearMessages = () => {
    setMessages([]);
    setStreamingMessage("");
    setIsStreaming(false);
  };

  return {
    messages,
    streamingMessage,
    isStreaming,
    isLoading: aiResponseMutation.isPending || isStreaming,
    error: aiResponseMutation.error?.message,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}

export function useAIModels() {
  return useQuery({
    queryKey: ["aiModels"],
    queryFn: async () => {
      const response = await fetch("/api/ai/models");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch AI models");
      }
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}