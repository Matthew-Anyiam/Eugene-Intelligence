import { EventEmitter } from 'events';

export interface DataSource {
  id: string;
  name: string;
  type: 'market_data' | 'fundamental' | 'news' | 'economic' | 'alternative';
  priority: number;
  updateFrequency: number; // milliseconds
  isActive: boolean;
  lastUpdate: Date;
  errorCount: number;
  healthStatus: 'healthy' | 'degraded' | 'offline';
}

export interface DataPoint {
  id: string;
  sourceId: string;
  symbol?: string;
  timestamp: Date;
  dataType: string;
  value: any;
  metadata: Record<string, any>;
  quality: 'high' | 'medium' | 'low' | 'questionable';
  relationships: string[]; // IDs of related data points
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
  dependencies: string[];
}

export interface DataQuery {
  sources?: string[];
  symbols?: string[];
  dataTypes?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  aggregation?: 'raw' | 'minute' | 'hour' | 'daily' | 'weekly';
  includeMetadata?: boolean;
}

export interface StreamSubscription {
  id: string;
  query: DataQuery;
  callback: (data: DataPoint[]) => void;
  isActive: boolean;
  lastUpdate: Date;
}

export class InMemoryDataLayer extends EventEmitter {
  private cache: Map<string, CacheEntry> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  private liveData: Map<string, DataPoint> = new Map();
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private relationships: Map<string, Set<string>> = new Map();
  private queryPatterns: Map<string, number> = new Map();
  
  private maxCacheSize: number = 1024 * 1024 * 1024; // 1GB
  private currentCacheSize: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    super();
    this.initializeDataSources();
    this.startBackgroundProcesses();
  }

  // Data Source Management
  registerDataSource(source: Omit<DataSource, 'lastUpdate' | 'errorCount' | 'healthStatus'>): void {
    const dataSource: DataSource = {
      ...source,
      lastUpdate: new Date(),
      errorCount: 0,
      healthStatus: 'healthy'
    };
    
    this.dataSources.set(source.id, dataSource);
    this.emit('sourceRegistered', dataSource);
  }

  async updateSourceHealth(sourceId: string, status: DataSource['healthStatus'], error?: string): Promise<void> {
    const source = this.dataSources.get(sourceId);
    if (!source) return;

    source.healthStatus = status;
    source.lastUpdate = new Date();
    
    if (status !== 'healthy') {
      source.errorCount++;
      this.emit('sourceError', { sourceId, status, error });
    } else {
      source.errorCount = 0;
    }
    
    this.dataSources.set(sourceId, source);
  }

  // Real-Time Data Ingestion
  async ingestData(data: Omit<DataPoint, 'id' | 'timestamp'>[]): Promise<void> {
    const processedData: DataPoint[] = [];
    
    for (const item of data) {
      const dataPoint: DataPoint = {
        ...item,
        id: this.generateDataPointId(item),
        timestamp: new Date()
      };
      
      // Store in live data
      this.liveData.set(dataPoint.id, dataPoint);
      
      // Update relationships
      this.updateDataRelationships(dataPoint);
      
      // Cache frequently accessed data
      if (this.shouldCache(dataPoint)) {
        await this.cacheDataPoint(dataPoint);
      }
      
      processedData.push(dataPoint);
    }
    
    // Notify subscribers
    this.notifySubscribers(processedData);
    
    this.emit('dataIngested', processedData);
  }

  // Advanced Caching System
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (entry.expiresAt <= new Date()) {
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    this.emit('cacheHit', key);
    return entry.data;
  }

  async set(key: string, data: any, ttl: number = 300000): Promise<void> { // 5min default TTL
    const size = this.estimateObjectSize(data);
    
    // Ensure cache doesn't exceed max size
    await this.ensureCacheSpace(size);
    
    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      accessCount: 0,
      lastAccessed: new Date(),
      size,
      dependencies: this.extractDependencies(data)
    };
    
    this.cache.set(key, entry);
    this.currentCacheSize += size;
    
    this.emit('cacheSet', { key, size });
  }

  // Intelligent Query System
  async query(query: DataQuery): Promise<DataPoint[]> {
    const cacheKey = this.generateQueryCacheKey(query);
    
    // Check cache first
    const cached = await this.get(cacheKey);
    if (cached) {
      this.trackQueryPattern(query);
      return cached;
    }
    
    // Execute query across data sources
    const results = await this.executeQuery(query);
    
    // Cache results
    await this.set(cacheKey, results, this.getQueryTTL(query));
    
    // Track query patterns for prefetching
    this.trackQueryPattern(query);
    
    return results;
  }

  private async executeQuery(query: DataQuery): Promise<DataPoint[]> {
    let results: DataPoint[] = [];
    
    // Query live data
    const liveResults = Array.from(this.liveData.values())
      .filter(point => this.matchesQuery(point, query));
    
    results = results.concat(liveResults);
    
    // Query cache for historical data
    const cacheResults = await this.queryCache(query);
    results = results.concat(cacheResults);
    
    // Apply aggregation if specified
    if (query.aggregation && query.aggregation !== 'raw') {
      results = this.aggregateData(results, query.aggregation);
    }
    
    // Sort by timestamp
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return results;
  }

  // Real-Time Streaming
  subscribe(query: DataQuery, callback: (data: DataPoint[]) => void): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: StreamSubscription = {
      id: subscriptionId,
      query,
      callback,
      isActive: true,
      lastUpdate: new Date()
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    // Send initial data
    this.query(query).then(initialData => {
      if (subscription.isActive) {
        callback(initialData);
      }
    });
    
    this.emit('subscriptionCreated', subscriptionId);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      this.emit('subscriptionRemoved', subscriptionId);
    }
  }

  private notifySubscribers(data: DataPoint[]): void {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;
      
      const relevantData = data.filter(point => this.matchesQuery(point, subscription.query));
      if (relevantData.length > 0) {
        try {
          subscription.callback(relevantData);
          subscription.lastUpdate = new Date();
        } catch (error) {
          console.error(`Subscription callback error:`, error);
          this.emit('subscriptionError', { subscriptionId: subscription.id, error });
        }
      }
    }
  }

  // Data Normalization and Mapping
  async normalizeData(sourceData: any, sourceId: string): Promise<DataPoint[]> {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Unknown data source: ${sourceId}`);
    }
    
    const normalized: DataPoint[] = [];
    
    // Apply source-specific normalization rules
    switch (source.type) {
      case 'market_data':
        normalized.push(...this.normalizeMarketData(sourceData, sourceId));
        break;
      case 'fundamental':
        normalized.push(...this.normalizeFundamentalData(sourceData, sourceId));
        break;
      case 'news':
        normalized.push(...this.normalizeNewsData(sourceData, sourceId));
        break;
      default:
        normalized.push(...this.normalizeGenericData(sourceData, sourceId));
    }
    
    // Apply quality scoring
    normalized.forEach(point => {
      point.quality = this.calculateDataQuality(point);
    });
    
    return normalized;
  }

  // Intelligent Prefetching
  private async performIntelligentPrefetch(): Promise<void> {
    const popularQueries = Array.from(this.queryPatterns.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 10)
      .map(([pattern]) => JSON.parse(pattern) as DataQuery);
    
    for (const query of popularQueries) {
      const cacheKey = this.generateQueryCacheKey(query);
      if (!this.cache.has(cacheKey)) {
        try {
          await this.query(query);
        } catch (error) {
          console.warn('Prefetch failed:', error);
        }
      }
    }
  }

  // Background Processes
  private startBackgroundProcesses(): void {
    // Cache cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCacheCleanup();
    }, 300000);
    
    // Data refresh every minute
    this.refreshInterval = setInterval(() => {
      this.performDataRefresh();
    }, 60000);
    
    // Intelligent prefetching every 10 minutes
    setInterval(() => {
      this.performIntelligentPrefetch();
    }, 600000);
  }

  private performCacheCleanup(): void {
    const now = new Date();
    let cleanedSize = 0;
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        cleanedSize += entry.size;
        cleanedCount++;
      }
    }
    
    this.currentCacheSize -= cleanedSize;
    
    if (cleanedCount > 0) {
      this.emit('cacheCleanup', { cleanedCount, cleanedSize });
    }
  }

  private async performDataRefresh(): Promise<void> {
    const staleSources = Array.from(this.dataSources.values())
      .filter(source => {
        const timeSinceUpdate = Date.now() - source.lastUpdate.getTime();
        return source.isActive && timeSinceUpdate > source.updateFrequency;
      });
    
    for (const source of staleSources) {
      try {
        await this.refreshDataSource(source.id);
      } catch (error) {
        await this.updateSourceHealth(source.id, 'degraded', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  // Helper Methods
  private generateDataPointId(data: Omit<DataPoint, 'id' | 'timestamp'>): string {
    const key = `${data.sourceId}:${data.symbol || 'global'}:${data.dataType}`;
    return Buffer.from(key).toString('base64').replace(/[/+=]/g, '');
  }

  private generateQueryCacheKey(query: DataQuery): string {
    return `query:${JSON.stringify(query)}`;
  }

  private estimateObjectSize(obj: any): number {
    return JSON.stringify(obj).length * 2; // Rough estimate
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    if (this.currentCacheSize + requiredSize <= this.maxCacheSize) {
      return;
    }
    
    // Evict least recently used entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
    
    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSize) break;
      
      this.cache.delete(key);
      freedSpace += entry.size;
      this.currentCacheSize -= entry.size;
    }
  }

  private matchesQuery(point: DataPoint, query: DataQuery): boolean {
    if (query.sources && !query.sources.includes(point.sourceId)) return false;
    if (query.symbols && point.symbol && !query.symbols.includes(point.symbol)) return false;
    if (query.dataTypes && !query.dataTypes.includes(point.dataType)) return false;
    
    if (query.timeRange) {
      if (point.timestamp < query.timeRange.start || point.timestamp > query.timeRange.end) {
        return false;
      }
    }
    
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        if (point.metadata[key] !== value) return false;
      }
    }
    
    return true;
  }

  private trackQueryPattern(query: DataQuery): void {
    const pattern = JSON.stringify(query);
    const currentCount = this.queryPatterns.get(pattern) || 0;
    this.queryPatterns.set(pattern, currentCount + 1);
  }

  private shouldCache(dataPoint: DataPoint): boolean {
    // Cache high-quality, frequently accessed data
    return dataPoint.quality === 'high' && 
           (dataPoint.dataType.includes('price') || 
            dataPoint.dataType.includes('fundamental') ||
            dataPoint.dataType.includes('earnings'));
  }

  private async cacheDataPoint(dataPoint: DataPoint): Promise<void> {
    const key = `datapoint:${dataPoint.id}`;
    await this.set(key, dataPoint, 86400000); // 24 hour TTL
  }

  private updateDataRelationships(dataPoint: DataPoint): void {
    if (!dataPoint.symbol) return;
    
    // Create relationships based on symbol
    const symbolRelations = this.relationships.get(dataPoint.symbol) || new Set();
    symbolRelations.add(dataPoint.id);
    this.relationships.set(dataPoint.symbol, symbolRelations);
    
    // Create relationships based on data type
    const typeKey = `type:${dataPoint.dataType}`;
    const typeRelations = this.relationships.get(typeKey) || new Set();
    typeRelations.add(dataPoint.id);
    this.relationships.set(typeKey, typeRelations);
  }

  private calculateDataQuality(point: DataPoint): 'high' | 'medium' | 'low' | 'questionable' {
    let score = 100;
    
    // Age penalty
    const ageMs = Date.now() - point.timestamp.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    
    if (ageHours > 24) score -= 20;
    else if (ageHours > 1) score -= 5;
    
    // Source reliability
    const source = this.dataSources.get(point.sourceId);
    if (source?.errorCount > 5) score -= 30;
    else if (source?.errorCount > 2) score -= 15;
    
    // Data completeness
    const requiredFields = ['value'];
    const missingFields = requiredFields.filter(field => !point[field as keyof DataPoint]);
    score -= missingFields.length * 25;
    
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 30) return 'low';
    return 'questionable';
  }

  private extractDependencies(data: any): string[] {
    // Extract symbols, data types, and other identifiers that this data depends on
    const dependencies: string[] = [];
    
    if (data.symbol) dependencies.push(`symbol:${data.symbol}`);
    if (data.dataType) dependencies.push(`type:${data.dataType}`);
    if (data.sector) dependencies.push(`sector:${data.sector}`);
    
    return dependencies;
  }

  private getQueryTTL(query: DataQuery): number {
    // Determine TTL based on query type and data freshness requirements
    if (query.dataTypes?.some(type => type.includes('price'))) {
      return 30000; // 30 seconds for price data
    }
    if (query.dataTypes?.some(type => type.includes('fundamental'))) {
      return 3600000; // 1 hour for fundamental data
    }
    return 300000; // 5 minutes default
  }

  // Normalization methods for different data types
  private normalizeMarketData(data: any, sourceId: string): DataPoint[] {
    // Implementation specific to market data sources
    return [];
  }

  private normalizeFundamentalData(data: any, sourceId: string): DataPoint[] {
    // Implementation specific to fundamental data sources
    return [];
  }

  private normalizeNewsData(data: any, sourceId: string): DataPoint[] {
    // Implementation specific to news data sources
    return [];
  }

  private normalizeGenericData(data: any, sourceId: string): DataPoint[] {
    // Generic normalization for unknown data types
    return [];
  }

  private async queryCache(query: DataQuery): Promise<DataPoint[]> {
    // Query cached data points that match the criteria
    const results: DataPoint[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith('datapoint:') && entry.expiresAt > new Date()) {
        const dataPoint = entry.data as DataPoint;
        if (this.matchesQuery(dataPoint, query)) {
          results.push(dataPoint);
        }
      }
    }
    
    return results;
  }

  private aggregateData(data: DataPoint[], aggregation: string): DataPoint[] {
    // Implement data aggregation logic based on the specified aggregation type
    return data;
  }

  private async refreshDataSource(sourceId: string): Promise<void> {
    // Refresh data from specific source
    const source = this.dataSources.get(sourceId);
    if (source) {
      source.lastUpdate = new Date();
      this.dataSources.set(sourceId, source);
    }
  }

  private initializeDataSources(): void {
    // Initialize default data sources
    this.registerDataSource({
      id: 'polygon',
      name: 'Polygon.io',
      type: 'market_data',
      priority: 1,
      updateFrequency: 1000, // 1 second
      isActive: true
    });

    this.registerDataSource({
      id: 'alpha_vantage',
      name: 'Alpha Vantage',
      type: 'fundamental',
      priority: 2,
      updateFrequency: 300000, // 5 minutes
      isActive: true
    });

    this.registerDataSource({
      id: 'news_api',
      name: 'News API',
      type: 'news',
      priority: 3,
      updateFrequency: 60000, // 1 minute
      isActive: true
    });
  }

  // Public API for system status
  getSystemStatus(): {
    cacheSize: number;
    maxCacheSize: number;
    cacheUtilization: number;
    activeSources: number;
    activeSubscriptions: number;
    totalDataPoints: number;
    healthySources: number;
  } {
    const healthySources = Array.from(this.dataSources.values())
      .filter(source => source.healthStatus === 'healthy').length;

    return {
      cacheSize: this.currentCacheSize,
      maxCacheSize: this.maxCacheSize,
      cacheUtilization: (this.currentCacheSize / this.maxCacheSize) * 100,
      activeSources: Array.from(this.dataSources.values()).filter(s => s.isActive).length,
      activeSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.isActive).length,
      totalDataPoints: this.liveData.size,
      healthySources
    };
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    
    this.cache.clear();
    this.liveData.clear();
    this.subscriptions.clear();
    this.relationships.clear();
    this.queryPatterns.clear();
    
    this.removeAllListeners();
  }
}

// Factory function
export function createInMemoryDataLayer(): InMemoryDataLayer {
  return new InMemoryDataLayer();
}

// Utility functions for performance monitoring
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getDataHealthColor(health: DataSource['healthStatus']): string {
  switch (health) {
    case 'healthy': return 'text-green-600 bg-green-100';
    case 'degraded': return 'text-yellow-600 bg-yellow-100';
    case 'offline': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}