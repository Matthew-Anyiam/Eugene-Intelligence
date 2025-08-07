"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Bot, Copy, ExternalLink, Clock, Zap } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-ai-chat";

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function ChatMessage({ message, isStreaming, streamingContent }: ChatMessageProps) {
  const isUser = message.role === "user";
  const displayContent = isStreaming && streamingContent 
    ? streamingContent 
    : message.content;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-4xl ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? "text-right" : "text-left"}`}>
          <Card className={`${isUser ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            <CardContent className="p-4">
              {/* Message Header */}
              <div className={`flex items-center gap-2 mb-2 ${isUser ? "justify-end" : "justify-start"}`}>
                <span className="text-sm font-medium">
                  {isUser ? "You" : `Eugene Intelligence${message.model ? ` (${message.model})` : ""}`}
                </span>
                <span className={`text-xs ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>

              {/* Message Content */}
              <div className={`prose prose-sm max-w-none ${
                isUser 
                  ? "prose-invert" 
                  : "prose-gray dark:prose-invert"
              }`}>
                <div className="whitespace-pre-wrap">
                  {displayContent}
                  {isStreaming && <span className="animate-pulse">▋</span>}
                </div>
              </div>

              {/* Message Footer */}
              {!isUser && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {message.model && (
                      <Badge variant="outline" className="text-xs">
                        {message.model}
                      </Badge>
                    )}
                    {message.processingTime && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {message.processingTime}ms
                      </Badge>
                    )}
                    {message.tokensUsed && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {message.tokensUsed.total} tokens
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-6 px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-medium text-muted-foreground mb-2">Sources:</div>
              <div className="space-y-1">
                {message.citations.map((citation) => (
                  <Card key={citation.id} className="p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {citation.id}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {citation.title}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {citation.source}
                        </div>
                        {citation.snippet && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {citation.snippet}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-6 w-6 p-0"
                      >
                        <a 
                          href={citation.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}