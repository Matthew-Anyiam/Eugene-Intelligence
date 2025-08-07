import Exa from "exa-js";
import type { SearchResult } from "@/types";
import type { SearchOptions } from "../config";

export class ExaSearchProvider {
  private client: Exa;

  constructor() {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error("EXA_API_KEY environment variable is required");
    }
    this.client = new Exa(apiKey);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const searchOptions = {
        numResults: options.numResults || 10,
        type: "neural" as const,
        useAutoprompt: true,
        includeDomains: options.includeDomains || [],
        excludeDomains: options.excludeDomains || ["facebook.com", "instagram.com"],
        startCrawlDate: options.dateRange?.start || "2020-01-01",
        endCrawlDate: options.dateRange?.end || new Date().toISOString().split('T')[0],
      };

      console.log("Exa search options:", { query: options.query, ...searchOptions });

      const response = await this.client.searchAndContents(
        options.query,
        searchOptions
      );

      console.log("Exa response:", response);

      if (!response.results || response.results.length === 0) {
        return [];
      }

      return response.results.map((result, index) => ({
        id: `exa-${index}-${Date.now()}`,
        title: result.title || "Untitled",
        description: this.extractDescription(result.text),
        url: result.url,
        source: "Exa AI",
        timestamp: new Date(),
        relevanceScore: result.score,
        author: result.author || undefined,
        publishedDate: result.publishedDate ? new Date(result.publishedDate) : undefined,
      }));
    } catch (error) {
      console.error("Exa search error:", error);
      throw new Error(`Exa search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private extractDescription(text?: string): string {
    if (!text) return "No description available";
    
    const maxLength = 300;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let description = "";
    for (const sentence of sentences) {
      if (description.length + sentence.length > maxLength) break;
      description += sentence.trim() + ". ";
    }
    
    return description.trim() || text.substring(0, maxLength) + "...";
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.searchAndContents("test", { numResults: 1 });
      return true;
    } catch {
      return false;
    }
  }
}