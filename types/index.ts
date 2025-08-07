export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  timestamp: Date;
  relevanceScore?: number;
  thumbnailUrl?: string;
  author?: string;
  publishedDate?: Date;
}

export interface SearchQuery {
  query: string;
  type: SearchType;
  aiModel?: AIModel;
  filters?: SearchFilters;
}

export type SearchType = 
  | "web"
  | "academic"
  | "social"
  | "news"
  | "images"
  | "videos"
  | "code"
  | "weather"
  | "maps"
  | "financial";

export type AIModel = 
  | "claude-4"
  | "gpt-4o"
  | "grok-3"
  | "gemini-2.5"
  | "qwen-2.5"
  | "llama-4";

export interface SearchFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  domain?: string;
  language?: string;
  country?: string;
  sortBy?: "relevance" | "date" | "popularity";
}

export interface AIProvider {
  id: string;
  name: string;
  model: AIModel;
  available: boolean;
  rateLimit?: {
    requests: number;
    period: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  searchResults?: SearchResult[];
  metadata?: {
    model: AIModel;
    tokens?: {
      input: number;
      output: number;
    };
    processingTime?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: {
    date: Date;
    high: number;
    low: number;
    condition: string;
  }[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  language: string;
}