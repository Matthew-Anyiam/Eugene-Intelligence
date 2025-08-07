export const SEARCH_CONFIG = {
  EXA: {
    API_URL: "https://api.exa.ai/search",
    DEFAULT_OPTIONS: {
      numResults: 10,
      includeDomains: [],
      excludeDomains: ["facebook.com", "instagram.com"],
      startCrawlDate: "2020-01-01",
      endCrawlDate: new Date().toISOString().split('T')[0],
    },
  },
  TAVILY: {
    API_URL: "https://api.tavily.com/search",
    DEFAULT_OPTIONS: {
      max_results: 10,
      search_depth: "advanced",
      include_images: false,
      include_answer: true,
      include_raw_content: false,
    },
  },
  RATE_LIMITS: {
    EXA: {
      requests_per_minute: 60,
      requests_per_hour: 1000,
    },
    TAVILY: {
      requests_per_minute: 100,
      requests_per_hour: 1000,
    },
  },
} as const;

export type SearchProvider = "exa" | "tavily";
export type SearchDepth = "basic" | "advanced";

export interface SearchOptions {
  query: string;
  provider?: SearchProvider;
  numResults?: number;
  searchDepth?: SearchDepth;
  includeDomains?: string[];
  excludeDomains?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  includeAnswer?: boolean;
  includeImages?: boolean;
}