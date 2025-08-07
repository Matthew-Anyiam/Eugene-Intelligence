import { TavilyClient } from "tavily";
import type { SearchResult } from "@/types";
import type { SearchOptions } from "../config";

export class TavilySearchProvider {
  private client: TavilyClient;

  constructor() {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY environment variable is required");
    }
    this.client = new TavilyClient({ apiKey });
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const searchOptions = {
        query: options.query,
        max_results: options.numResults || 10,
        search_depth: options.searchDepth || "advanced",
        include_images: options.includeImages || false,
        include_answer: options.includeAnswer || true,
        include_raw_content: false,
        include_domains: options.includeDomains || [],
        exclude_domains: options.excludeDomains || ["facebook.com", "instagram.com"],
      };

      console.log("Tavily search options:", searchOptions);

      const response = await this.client.search(searchOptions);

      console.log("Tavily response:", response);

      if (!response.results || response.results.length === 0) {
        return [];
      }

      return response.results.map((result: any, index: number) => ({
        id: `tavily-${index}-${Date.now()}`,
        title: result.title || "Untitled",
        description: result.content || "No description available",
        url: result.url,
        source: "Tavily AI",
        timestamp: new Date(),
        relevanceScore: result.score,
        publishedDate: result.published_date ? new Date(result.published_date) : undefined,
      }));
    } catch (error) {
      console.error("Tavily search error:", error);
      throw new Error(`Tavily search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.search({ query: "test", max_results: 1 });
      return true;
    } catch {
      return false;
    }
  }
}