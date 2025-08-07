import type { SearchResult, SearchType } from "@/types";
import type { SearchOptions, SearchProvider } from "./config";
import { ExaSearchProvider } from "./providers/exa";
import { TavilySearchProvider } from "./providers/tavily";

export class SearchManager {
  private exaProvider: ExaSearchProvider | null = null;
  private tavilyProvider: TavilySearchProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    try {
      this.exaProvider = new ExaSearchProvider();
    } catch (error) {
      console.warn("Exa provider initialization failed:", error);
    }

    try {
      this.tavilyProvider = new TavilySearchProvider();
    } catch (error) {
      console.warn("Tavily provider initialization failed:", error);
    }

    if (!this.exaProvider && !this.tavilyProvider) {
      throw new Error("No search providers available. Please check your API keys.");
    }
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const provider = this.getPreferredProvider(options.provider);
    
    if (!provider) {
      throw new Error("No available search provider");
    }

    try {
      const results = await provider.search(options);
      
      return results.map(result => ({
        ...result,
        metadata: {
          searchProvider: provider === this.exaProvider ? "exa" : "tavily",
          query: options.query,
          timestamp: new Date(),
        },
      }));
    } catch (error) {
      console.error(`Search failed with primary provider:`, error);
      
      const fallbackProvider = this.getFallbackProvider(provider);
      if (fallbackProvider) {
        console.log("Attempting fallback provider...");
        try {
          const results = await fallbackProvider.search(options);
          return results.map(result => ({
            ...result,
            metadata: {
              searchProvider: fallbackProvider === this.exaProvider ? "exa" : "tavily",
              query: options.query,
              timestamp: new Date(),
              fallback: true,
            },
          }));
        } catch (fallbackError) {
          console.error("Fallback provider also failed:", fallbackError);
        }
      }
      
      throw error;
    }
  }

  async searchByType(query: string, searchType: SearchType, numResults = 10): Promise<SearchResult[]> {
    const searchOptions: SearchOptions = {
      query: this.enhanceQueryForType(query, searchType),
      numResults,
      ...this.getTypeSpecificOptions(searchType),
    };

    return this.search(searchOptions);
  }

  private getPreferredProvider(requested?: SearchProvider): ExaSearchProvider | TavilySearchProvider | null {
    if (requested === "exa" && this.exaProvider) return this.exaProvider;
    if (requested === "tavily" && this.tavilyProvider) return this.tavilyProvider;
    
    return this.tavilyProvider || this.exaProvider;
  }

  private getFallbackProvider(current: ExaSearchProvider | TavilySearchProvider): ExaSearchProvider | TavilySearchProvider | null {
    if (current === this.exaProvider) return this.tavilyProvider;
    if (current === this.tavilyProvider) return this.exaProvider;
    return null;
  }

  private enhanceQueryForType(query: string, searchType: SearchType): string {
    const enhancements = {
      academic: `${query} site:scholar.google.com OR site:arxiv.org OR site:pubmed.ncbi.nlm.nih.gov OR "research paper" OR "academic study"`,
      news: `${query} site:news.google.com OR site:reuters.com OR site:bbc.com OR site:cnn.com OR "breaking news" OR "latest news"`,
      social: `${query} site:reddit.com OR site:twitter.com OR site:linkedin.com`,
      code: `${query} site:github.com OR site:stackoverflow.com OR site:gitlab.com OR "source code" OR "programming"`,
      financial: `${query} site:yahoo.com/finance OR site:bloomberg.com OR site:marketwatch.com OR "stock price" OR "financial data"`,
      images: `${query} filetype:jpg OR filetype:png OR filetype:gif OR filetype:webp`,
      videos: `${query} site:youtube.com OR site:vimeo.com OR filetype:mp4`,
      web: query, // No enhancement for general web search
      weather: `${query} weather forecast temperature`,
      maps: `${query} location address map directions`,
    };

    return enhancements[searchType] || query;
  }

  private getTypeSpecificOptions(searchType: SearchType): Partial<SearchOptions> {
    const options = {
      academic: {
        includeDomains: ["scholar.google.com", "arxiv.org", "pubmed.ncbi.nlm.nih.gov", "researchgate.net"],
        excludeDomains: ["facebook.com", "instagram.com", "twitter.com"],
      },
      news: {
        includeDomains: ["reuters.com", "bbc.com", "cnn.com", "npr.org", "apnews.com"],
        dateRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      },
      social: {
        includeDomains: ["reddit.com", "twitter.com", "linkedin.com"],
      },
      code: {
        includeDomains: ["github.com", "stackoverflow.com", "gitlab.com", "bitbucket.org"],
      },
      financial: {
        includeDomains: ["yahoo.com", "bloomberg.com", "marketwatch.com", "sec.gov"],
      },
      web: {},
      images: { includeImages: true },
      videos: {},
      weather: {},
      maps: {},
    };

    return options[searchType] || {};
  }

  async getProviderStatus() {
    const status = {
      exa: { available: !!this.exaProvider, healthy: false },
      tavily: { available: !!this.tavilyProvider, healthy: false },
    };

    if (this.exaProvider) {
      status.exa.healthy = await this.exaProvider.isHealthy();
    }

    if (this.tavilyProvider) {
      status.tavily.healthy = await this.tavilyProvider.isHealthy();
    }

    return status;
  }
}