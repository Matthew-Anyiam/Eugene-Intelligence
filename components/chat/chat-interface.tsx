"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./chat-message";
import { useAIChat } from "@/hooks/use-ai-chat";
import { StopCircle, Trash2 } from "lucide-react";
import type { SearchResult, AIModel } from "@/types";

interface ChatInterfaceProps {
  searchResults: SearchResult[];
  query: string;
  model: AIModel;
  onResponseGenerated?: (message: any) => void;
}

export function ChatInterface({ 
  searchResults, 
  query, 
  model,
  onResponseGenerated 
}: ChatInterfaceProps) {
  const {
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useAIChat({ model, streaming: true });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Generate AI response when query and search results are available
  useEffect(() => {
    if (query && searchResults.length > 0 && messages.length === 0) {
      sendMessage(query, searchResults, model)
        .then((response) => {
          if (onResponseGenerated) {
            onResponseGenerated(response);
          }
        })
        .catch(console.error);
    }
  }, [query, searchResults, model, messages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              AI response will appear here after searching...
            </p>
          </Card>
        )}

        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message}
            isStreaming={isStreaming && message.role === "assistant" && message.id === messages[messages.length - 1]?.id}
            streamingContent={streamingMessage}
          />
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingMessage && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-4xl">
              <Card className="bg-card">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm font-medium">
                      Eugene Intelligence ({model})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Generating...
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none prose-gray dark:prose-invert">
                    <div className="whitespace-pre-wrap">
                      {streamingMessage}
                      <span className="animate-pulse">▋</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="text-red-800">
              <p className="font-medium">AI Response Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Controls */}
      {(messages.length > 0 || isStreaming) && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isStreaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopStreaming}
                  className="text-red-600 hover:text-red-700"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Generation
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}