import { InMemoryDataLayer, DataQuery, DataPoint } from './in-memory-data-layer';
import { createPolygonClient } from '@/lib/financial/polygon-client';
import { z } from 'zod';

// Standardized Data Models
export interface StandardizedQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: Date;
  source: string;
  confidence: number;
}

export interface StandardizedFundamental {
  symbol: string;
  period: 'Q' | 'Y';
  periodDate: Date;
  revenue: number;
  netIncome: number;
  eps: number;
  assets: number;
  equity: number;
  debt: number;
  freeCashFlow: number;
  timestamp: Date;
  source: string;
  confidence: number;
}

export interface StandardizedNews {
  id: string;
  title: string;
  summary: string;
  content?: string;
  symbols: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  impact: 'high' | 'medium' | 'low';
  publishedAt: Date;
  source: string;
  url: string;
  confidence: number;
}

export interface StandardizedEconomic {
  indicator: string;
  country: string;
  value: number;
  previousValue?: number;
  forecast?: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  releaseDate: Date;
  nextReleaseDate?: Date;
  importance: 'high' | 'medium' | 'low';
  source: string;
  confidence: number;
}

export interface StandardizedOptions {
  symbol: string;
  optionSymbol: string;
  strike: number;
  expiration: Date;
  type: 'call' | 'put';
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  timestamp: Date;
  source: string;
  confidence: number;
}

// Data Request/Response Types
export interface DataRequest {
  type: 'quote' | 'fundamental' | 'news' | 'economic' | 'options' | 'custom';
  symbols?: string[];
  parameters: Record<string, any>;
  realTime?: boolean;
  sources?: string[];
  fallbackToCache?: boolean;
  maxAge?: number; // milliseconds
}

export interface DataResponse<T = any> {
  data: T[];
  metadata: {
    sources: string[];
    timestamp: Date;
    latency: number;
    fromCache: boolean;
    dataQuality: 'high' | 'medium' | 'low';
    confidence: number;
  };
  errors?: Array<{
    source: string;
    error: string;
    fallbackUsed: boolean;
  }>;
}

// Validation Schemas
const QuoteRequestSchema = z.object({
  symbols: z.array(z.string()).min(1),
  includeAfterHours: z.boolean().optional(),
  includePreMarket: z.boolean().optional()
});

const FundamentalRequestSchema = z.object({
  symbols: z.array(z.string()).min(1),
  periods: z.array(z.enum(['Q', 'Y'])).optional(),
  yearsBack: z.number().min(1).max(10).optional()
});

const NewsRequestSchema = z.object({
  symbols: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  timeRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  minImpact: z.enum(['high', 'medium', 'low']).optional(),
  limit: z.number().min(1).max(100).optional()
});

export class UnifiedDataInterface {
  private dataLayer: InMemoryDataLayer;
  private polygonClient: ReturnType<typeof createPolygonClient>;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();
  
  constructor(dataLayer: InMemoryDataLayer) {
    this.dataLayer = dataLayer;
    this.polygonClient = createPolygonClient();
    
    // Initialize circuit breakers for each data source
    this.initializeCircuitBreakers();
  }

  // Main Data Access Methods
  async getQuotes(request: DataRequest): Promise<DataResponse<StandardizedQuote>> {
    const startTime = Date.now();
    const validatedRequest = QuoteRequestSchema.parse(request.parameters);
    
    try {
      // Check cache first
      if (request.fallbackToCache !== false) {
        const cachedData = await this.getCachedQuotes(validatedRequest.symbols);
        if (cachedData.length > 0) {
          return {
            data: cachedData,
            metadata: {
              sources: ['cache'],
              timestamp: new Date(),
              latency: Date.now() - startTime,
              fromCache: true,
              dataQuality: 'high',
              confidence: 95
            }
          };
        }
      }

      // Fetch from live sources
      const liveData = await this.fetchLiveQuotes(validatedRequest.symbols, request.sources);
      
      // Cache the results
      await this.cacheQuotes(liveData);
      
      return {
        data: liveData,
        metadata: {
          sources: request.sources || ['polygon', 'alpha_vantage'],
          timestamp: new Date(),
          latency: Date.now() - startTime,
          fromCache: false,
          dataQuality: this.assessDataQuality(liveData),
          confidence: this.calculateConfidence(liveData)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch quotes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFundamentals(request: DataRequest): Promise<DataResponse<StandardizedFundamental>> {
    const startTime = Date.now();
    const validatedRequest = FundamentalRequestSchema.parse(request.parameters);
    
    try {
      const data = await this.fetchFundamentals(validatedRequest.symbols, validatedRequest);
      
      return {
        data,
        metadata: {
          sources: request.sources || ['alpha_vantage', 'polygon'],
          timestamp: new Date(),
          latency: Date.now() - startTime,
          fromCache: false,
          dataQuality: this.assessDataQuality(data),
          confidence: this.calculateConfidence(data)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch fundamentals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNews(request: DataRequest): Promise<DataResponse<StandardizedNews>> {
    const startTime = Date.now();
    const validatedRequest = NewsRequestSchema.parse(request.parameters);
    
    try {
      const data = await this.fetchNews(validatedRequest);
      
      return {
        data,
        metadata: {
          sources: request.sources || ['news_api', 'polygon'],
          timestamp: new Date(),
          latency: Date.now() - startTime,
          fromCache: false,
          dataQuality: this.assessDataQuality(data),
          confidence: this.calculateConfidence(data)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEconomicData(request: DataRequest): Promise<DataResponse<StandardizedEconomic>> {
    const startTime = Date.now();
    
    try {
      const data = await this.fetchEconomicData(request.parameters);
      
      return {
        data,
        metadata: {
          sources: request.sources || ['fred', 'alpha_vantage'],
          timestamp: new Date(),
          latency: Date.now() - startTime,
          fromCache: false,
          dataQuality: this.assessDataQuality(data),
          confidence: this.calculateConfidence(data)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch economic data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOptions(request: DataRequest): Promise<DataResponse<StandardizedOptions>> {
    const startTime = Date.now();
    
    try {
      const data = await this.fetchOptionsData(request.parameters);
      
      return {
        data,
        metadata: {
          sources: request.sources || ['polygon', 'alpha_vantage'],
          timestamp: new Date(),
          latency: Date.now() - startTime,
          fromCache: false,
          dataQuality: this.assessDataQuality(data),
          confidence: this.calculateConfidence(data)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch options data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time Data Streaming
  subscribeToQuotes(symbols: string[], callback: (quotes: StandardizedQuote[]) => void): string {
    return this.dataLayer.subscribe({
      symbols,
      dataTypes: ['quote', 'price']
    }, (dataPoints: DataPoint[]) => {
      const quotes = this.normalizeQuotes(dataPoints);
      callback(quotes);
    });
  }

  subscribeToNews(symbols: string[], callback: (news: StandardizedNews[]) => void): string {
    return this.dataLayer.subscribe({
      symbols,
      dataTypes: ['news']
    }, (dataPoints: DataPoint[]) => {
      const news = this.normalizeNews(dataPoints);
      callback(news);
    });
  }

  unsubscribe(subscriptionId: string): void {
    this.dataLayer.unsubscribe(subscriptionId);
  }

  // Data Quality and Validation
  private assessDataQuality<T extends { confidence?: number; source?: string }>(data: T[]): 'high' | 'medium' | 'low' {
    if (data.length === 0) return 'low';
    
    const avgConfidence = data.reduce((sum, item) => sum + (item.confidence || 50), 0) / data.length;
    const hasReliableSources = data.some(item => ['polygon', 'alpha_vantage', 'bloomberg'].includes(item.source || ''));
    
    if (avgConfidence >= 80 && hasReliableSources) return 'high';
    if (avgConfidence >= 60 || hasReliableSources) return 'medium';
    return 'low';
  }

  private calculateConfidence<T extends { confidence?: number }>(data: T[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + (item.confidence || 50), 0) / data.length;
  }

  // Data Fetching with Circuit Breaker Pattern
  private async fetchWithCircuitBreaker<T>(
    source: string,
    fetchFunction: () => Promise<T>
  ): Promise<T | null> {
    const breaker = this.circuitBreakers.get(source);
    
    if (breaker?.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
      if (timeSinceLastFailure < 60000) { // 1 minute circuit breaker
        return null;
      } else {
        breaker.isOpen = false; // Try to close circuit
      }
    }
    
    try {
      const result = await fetchFunction();
      
      // Reset failure count on success
      if (breaker) {
        breaker.failures = 0;
      }
      
      return result;
    } catch (error) {
      if (breaker) {
        breaker.failures++;
        breaker.lastFailure = new Date();
        
        if (breaker.failures >= 5) {
          breaker.isOpen = true;
        }
      }
      
      throw error;
    }
  }

  // Source-specific fetch methods
  private async fetchLiveQuotes(symbols: string[], sources?: string[]): Promise<StandardizedQuote[]> {
    const results: StandardizedQuote[] = [];
    const requestId = `quotes_${symbols.join(',')}_${Date.now()}`;
    
    // Deduplicate identical requests
    if (this.requestQueue.has(requestId)) {
      return this.requestQueue.get(requestId);
    }
    
    const promise = this.executeFetchLiveQuotes(symbols, sources);
    this.requestQueue.set(requestId, promise);
    
    try {
      const data = await promise;
      return data;
    } finally {
      this.requestQueue.delete(requestId);
    }
  }

  private async executeFetchLiveQuotes(symbols: string[], sources?: string[]): Promise<StandardizedQuote[]> {
    const results: StandardizedQuote[] = [];
    const targetSources = sources || ['polygon', 'alpha_vantage'];
    
    for (const source of targetSources) {
      try {
        let sourceData: StandardizedQuote[] = [];
        
        switch (source) {
          case 'polygon':
            sourceData = await this.fetchFromPolygon(symbols);
            break;
          case 'alpha_vantage':
            sourceData = await this.fetchFromAlphaVantage(symbols);
            break;
        }
        
        results.push(...sourceData);
        
        // If we got data from a high-priority source, we might not need others
        if (sourceData.length === symbols.length) {
          break;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${source}:`, error);
      }
    }
    
    return results;
  }

  private async fetchFromPolygon(symbols: string[]): Promise<StandardizedQuote[]> {
    return this.fetchWithCircuitBreaker('polygon', async () => {
      const results: StandardizedQuote[] = [];
      
      for (const symbol of symbols) {
        try {
          const quote = await this.polygonClient.getStockQuote(symbol);
          
          results.push({
            symbol: quote.symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            marketCap: quote.marketCap,
            timestamp: new Date(),
            source: 'polygon',
            confidence: 95
          });
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} from Polygon:`, error);
        }
      }
      
      return results;
    }) || [];
  }

  private async fetchFromAlphaVantage(symbols: string[]): Promise<StandardizedQuote[]> {
    return this.fetchWithCircuitBreaker('alpha_vantage', async () => {
      // Implementation for Alpha Vantage quotes
      return [];
    }) || [];
  }

  private async fetchFundamentals(symbols: string[], params: any): Promise<StandardizedFundamental[]> {
    const results: StandardizedFundamental[] = [];
    
    for (const symbol of symbols) {
      try {
        // Mock implementation - in production, integrate with actual APIs
        const fundamental: StandardizedFundamental = {
          symbol,
          period: 'Q',
          periodDate: new Date(),
          revenue: 100000000,
          netIncome: 25000000,
          eps: 2.50,
          assets: 500000000,
          equity: 300000000,
          debt: 100000000,
          freeCashFlow: 30000000,
          timestamp: new Date(),
          source: 'alpha_vantage',
          confidence: 85
        };
        
        results.push(fundamental);
      } catch (error) {
        console.warn(`Failed to fetch fundamentals for ${symbol}:`, error);
      }
    }
    
    return results;
  }

  private async fetchNews(params: any): Promise<StandardizedNews[]> {
    // Mock implementation - in production, integrate with news APIs
    return [];
  }

  private async fetchEconomicData(params: any): Promise<StandardizedEconomic[]> {
    // Mock implementation - in production, integrate with economic data APIs
    return [];
  }

  private async fetchOptionsData(params: any): Promise<StandardizedOptions[]> {
    // Mock implementation - in production, integrate with options data APIs
    return [];
  }

  // Cache management
  private async getCachedQuotes(symbols: string[]): Promise<StandardizedQuote[]> {
    const cached: StandardizedQuote[] = [];
    
    for (const symbol of symbols) {
      const cacheKey = `quote:${symbol}`;
      const data = await this.dataLayer.get(cacheKey);
      if (data) {
        cached.push(data);
      }
    }
    
    return cached;
  }

  private async cacheQuotes(quotes: StandardizedQuote[]): Promise<void> {
    for (const quote of quotes) {
      const cacheKey = `quote:${quote.symbol}`;
      await this.dataLayer.set(cacheKey, quote, 30000); // 30 second TTL for quotes
    }
  }

  // Data normalization
  private normalizeQuotes(dataPoints: DataPoint[]): StandardizedQuote[] {
    return dataPoints
      .filter(point => point.dataType === 'quote' || point.dataType === 'price')
      .map(point => ({
        symbol: point.symbol || '',
        price: point.value?.price || 0,
        change: point.value?.change || 0,
        changePercent: point.value?.changePercent || 0,
        volume: point.value?.volume || 0,
        marketCap: point.value?.marketCap,
        timestamp: point.timestamp,
        source: point.sourceId,
        confidence: point.quality === 'high' ? 95 : point.quality === 'medium' ? 75 : 50
      }));
  }

  private normalizeNews(dataPoints: DataPoint[]): StandardizedNews[] {
    return dataPoints
      .filter(point => point.dataType === 'news')
      .map(point => ({
        id: point.id,
        title: point.value?.title || '',
        summary: point.value?.summary || '',
        content: point.value?.content,
        symbols: [point.symbol || ''],
        sentiment: point.value?.sentiment || 'neutral',
        sentimentScore: point.value?.sentimentScore || 0,
        impact: point.value?.impact || 'medium',
        publishedAt: point.value?.publishedAt || point.timestamp,
        source: point.sourceId,
        url: point.value?.url || '',
        confidence: point.quality === 'high' ? 95 : point.quality === 'medium' ? 75 : 50
      }));
  }

  // Circuit breaker initialization
  private initializeCircuitBreakers(): void {
    const sources = ['polygon', 'alpha_vantage', 'news_api', 'fred'];
    
    for (const source of sources) {
      this.circuitBreakers.set(source, {
        failures: 0,
        lastFailure: new Date(0),
        isOpen: false
      });
    }
  }

  // System status and monitoring
  getSystemStatus(): {
    dataSources: Array<{
      source: string;
      status: 'healthy' | 'degraded' | 'offline';
      failures: number;
      lastFailure?: Date;
    }>;
    cacheStats: any;
    requestQueue: number;
  } {
    const dataSources = Array.from(this.circuitBreakers.entries()).map(([source, breaker]) => ({
      source,
      status: breaker.isOpen ? 'offline' : breaker.failures > 0 ? 'degraded' : 'healthy',
      failures: breaker.failures,
      lastFailure: breaker.failures > 0 ? breaker.lastFailure : undefined
    }));

    return {
      dataSources,
      cacheStats: this.dataLayer.getSystemStatus(),
      requestQueue: this.requestQueue.size
    };
  }
}

// Factory function
export function createUnifiedDataInterface(dataLayer: InMemoryDataLayer): UnifiedDataInterface {
  return new UnifiedDataInterface(dataLayer);
}

// Utility functions for data validation
export function validateSymbol(symbol: string): boolean {
  return /^[A-Z]{1,5}$/.test(symbol);
}

export function validateTimeRange(start: Date, end: Date): boolean {
  return start < end && end <= new Date();
}

export function sanitizeSymbol(symbol: string): string {
  return symbol.toUpperCase().trim().replace(/[^A-Z]/g, '');
}