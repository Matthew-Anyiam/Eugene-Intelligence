import { NextRequest, NextResponse } from "next/server";
import { SearchManager } from "@/lib/search/search-manager";
import { z } from "zod";
import type { SearchType } from "@/types";

const searchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  type: z.enum(["web", "academic", "social", "news", "images", "videos", "code", "weather", "maps", "financial"]).default("web"),
  numResults: z.number().min(1).max(50).default(10),
  provider: z.enum(["exa", "tavily"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type, numResults, provider } = searchSchema.parse(body);

    console.log("Search API request:", { query, type, numResults, provider });

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const searchManager = new SearchManager();
    
    const results = await searchManager.searchByType(
      query.trim(),
      type as SearchType,
      numResults
    );

    console.log(`Search completed: ${results.length} results found`);

    return NextResponse.json({
      success: true,
      query: query.trim(),
      type,
      numResults: results.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Search API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid request parameters", 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Search service configuration error" },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { 
          error: "Search failed", 
          message: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const type = url.searchParams.get("type") || "web";
    const numResults = parseInt(url.searchParams.get("numResults") || "10");
    const provider = url.searchParams.get("provider");

    const searchParams = {
      query: query || "",
      type,
      numResults,
      ...(provider && { provider }),
    };

    const validatedParams = searchSchema.parse(searchParams);

    const searchManager = new SearchManager();
    
    const results = await searchManager.searchByType(
      validatedParams.query,
      validatedParams.type as SearchType,
      validatedParams.numResults
    );

    return NextResponse.json({
      success: true,
      query: validatedParams.query,
      type: validatedParams.type,
      numResults: results.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Search API GET error:", error);
    
    return NextResponse.json(
      { error: "Search failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}