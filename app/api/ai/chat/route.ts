import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIResponseGenerator } from "@/lib/ai/ai-response-generator";
import type { AIModel, SearchResult } from "@/types";

const chatRequestSchema = z.object({
  query: z.string().min(1, "Query is required"),
  searchResults: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    url: z.string().url(),
    source: z.string(),
    timestamp: z.string().transform(str => new Date(str)),
    relevanceScore: z.number().optional(),
    author: z.string().optional(),
    publishedDate: z.string().transform(str => new Date(str)).optional(),
  })),
  model: z.enum(["claude-4", "gpt-4o", "grok-3", "gemini-2.5", "qwen-2.5", "llama-4"]),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = chatRequestSchema.parse(body);

    console.log("AI chat request:", {
      query: validatedData.query,
      model: validatedData.model,
      searchResults: validatedData.searchResults.length,
      stream: validatedData.stream,
    });

    const generator = new AIResponseGenerator();

    // Handle streaming response
    if (validatedData.stream) {
      const encoder = new TextEncoder();

      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const streamGenerator = generator.generateStreamingResponse({
              query: validatedData.query,
              searchResults: validatedData.searchResults as SearchResult[],
              model: validatedData.model as AIModel,
              conversationHistory: validatedData.conversationHistory,
              temperature: validatedData.temperature,
            });

            for await (const chunk of streamGenerator) {
              const data = typeof chunk === 'string' 
                ? JSON.stringify({ type: 'content', content: chunk })
                : JSON.stringify({ type: 'complete', data: chunk });
              
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            const errorData = JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : "Unknown error" 
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Handle non-streaming response
    const response = await generator.generateResponse({
      query: validatedData.query,
      searchResults: validatedData.searchResults as SearchResult[],
      model: validatedData.model as AIModel,
      conversationHistory: validatedData.conversationHistory,
      temperature: validatedData.temperature,
    });

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("AI chat API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid request parameters", 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "AI response generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}