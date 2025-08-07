import axios from 'axios';

interface PolygonConfig {
  apiKey: string;
  baseUrl: string;
}

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface StockFinancials {
  symbol: string;
  fiscalPeriod: string;
  fiscalYear: number;
  revenue: number;
  netIncome: number;
  eps: number;
  totalAssets: number;
  totalDebt: number;
  shareholderEquity: number;
  freeCashFlow: number;
  operatingCashFlow: number;
}

interface NewsItem {
  id: string;
  title: string;
  author: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedUtc: string;
  keywords: string[];
  tickers?: string[];
}

interface MarketIndicies {
  [key: string]: {
    value: number;
    change: number;
    changePercent: number;
  };
}

export class PolygonClient {
  private config: PolygonConfig;
  private rateLimitDelay = 1000; // 1 second between requests for free tier

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.polygon.io'
    };
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          apikey: this.config.apiKey,
          ...params
        }
      });

      // Add rate limiting for free tier
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      return response.data;
    } catch (error) {
      console.error('Polygon API error:', error);
      throw new Error(`Failed to fetch data from Polygon: ${error}`);
    }
  }

  async getStockQuote(symbol: string): Promise<MarketData | null> {
    try {
      const endpoint = `/v2/aggs/ticker/${symbol}/prev`;
      const data = await this.makeRequest(endpoint);

      if (!data.results || data.results.length === 0) {
        return null;
      }

      const result = data.results[0];
      const change = result.c - result.o;
      const changePercent = (change / result.o) * 100;

      return {
        symbol: symbol.toUpperCase(),
        name: symbol, // Will be enhanced with company name lookup
        price: result.c,
        change,
        changePercent,
        volume: result.v,
        high: result.h,
        low: result.l,
        open: result.o,
        previousClose: result.c
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<MarketData[]> {
    const quotes = await Promise.allSettled(
      symbols.map(symbol => this.getStockQuote(symbol))
    );

    return quotes
      .filter((result): result is PromiseFulfilledResult<MarketData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  async getMarketIndices(): Promise<MarketIndicies> {
    const indices = ['SPX', 'DJI', 'IXIC', 'RUT'];
    const quotes = await this.getMultipleQuotes(indices);
    
    const result: MarketIndicies = {};
    quotes.forEach(quote => {
      result[quote.symbol] = {
        value: quote.price,
        change: quote.change,
        changePercent: quote.changePercent
      };
    });

    return result;
  }

  async getCompanyInfo(symbol: string) {
    try {
      const endpoint = `/v3/reference/tickers/${symbol}`;
      const data = await this.makeRequest(endpoint);
      
      return {
        symbol: data.results?.ticker || symbol,
        name: data.results?.name || symbol,
        description: data.results?.description || '',
        industry: data.results?.sic_description || '',
        sector: data.results?.industry || '',
        marketCap: data.results?.market_cap || null,
        employees: data.results?.total_employees || null,
        website: data.results?.homepage_url || '',
        exchange: data.results?.primary_exchange || ''
      };
    } catch (error) {
      console.error(`Error fetching company info for ${symbol}:`, error);
      return null;
    }
  }

  async getFinancials(symbol: string, limit = 4): Promise<StockFinancials[]> {
    try {
      const endpoint = `/vX/reference/financials`;
      const data = await this.makeRequest(endpoint, {
        'ticker.gte': symbol,
        'ticker.lte': symbol,
        limit,
        sort: '-filing_date'
      });

      if (!data.results) return [];

      return data.results.map((item: any) => ({
        symbol: symbol.toUpperCase(),
        fiscalPeriod: item.fiscal_period || 'Q4',
        fiscalYear: item.fiscal_year || new Date().getFullYear(),
        revenue: item.financials?.income_statement?.revenues?.value || 0,
        netIncome: item.financials?.income_statement?.net_income_loss?.value || 0,
        eps: item.financials?.income_statement?.basic_earnings_per_share?.value || 0,
        totalAssets: item.financials?.balance_sheet?.assets?.value || 0,
        totalDebt: item.financials?.balance_sheet?.liabilities?.value || 0,
        shareholderEquity: item.financials?.balance_sheet?.equity?.value || 0,
        freeCashFlow: item.financials?.cash_flow_statement?.net_cash_flow_from_operating_activities?.value || 0,
        operatingCashFlow: item.financials?.cash_flow_statement?.net_cash_flow_from_operating_activities?.value || 0
      }));
    } catch (error) {
      console.error(`Error fetching financials for ${symbol}:`, error);
      return [];
    }
  }

  async getNews(limit = 10, tickers?: string[]): Promise<NewsItem[]> {
    try {
      const endpoint = '/v2/reference/news';
      const params: any = {
        limit,
        sort: '-published_utc'
      };

      if (tickers && tickers.length > 0) {
        params.ticker = tickers.join(',');
      }

      const data = await this.makeRequest(endpoint, params);

      if (!data.results) return [];

      return data.results.map((item: any) => ({
        id: item.id,
        title: item.title,
        author: item.author || 'Unknown',
        description: item.description || '',
        url: item.article_url,
        imageUrl: item.image_url,
        publishedUtc: item.published_utc,
        keywords: item.keywords || [],
        tickers: item.tickers || []
      }));
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  async getTopMovers() {
    try {
      const endpoint = '/v2/snapshot/locale/us/markets/stocks/gainers';
      const gainersData = await this.makeRequest(endpoint);

      const losersEndpoint = '/v2/snapshot/locale/us/markets/stocks/losers';
      const losersData = await this.makeRequest(losersEndpoint);

      const formatMover = (item: any) => ({
        symbol: item.ticker,
        name: item.ticker, // Will be enhanced with company name lookup
        price: item.todaysChange || 0,
        change: item.todaysChange || 0,
        changePercent: item.todaysChangePerc || 0,
        volume: item.volume || 0
      });

      return {
        gainers: (gainersData.results || []).slice(0, 5).map(formatMover),
        losers: (losersData.results || []).slice(0, 5).map(formatMover)
      };
    } catch (error) {
      console.error('Error fetching top movers:', error);
      return { gainers: [], losers: [] };
    }
  }

  async searchTickers(query: string, limit = 10) {
    try {
      const endpoint = '/v3/reference/tickers';
      const data = await this.makeRequest(endpoint, {
        search: query,
        active: true,
        limit
      });

      if (!data.results) return [];

      return data.results.map((item: any) => ({
        symbol: item.ticker,
        name: item.name,
        type: item.type,
        market: item.market,
        exchange: item.primary_exchange,
        currency: item.currency_name
      }));
    } catch (error) {
      console.error('Error searching tickers:', error);
      return [];
    }
  }
}

// Factory function to create Polygon client
export function createPolygonClient(): PolygonClient | null {
  const apiKey = process.env.POLYGON_API_KEY;
  
  if (!apiKey) {
    console.warn('Polygon API key not found');
    return null;
  }

  return new PolygonClient(apiKey);
}

// Utility function to format market data for display
export function formatMarketData(data: MarketData) {
  return {
    ...data,
    formattedPrice: `$${data.price.toFixed(2)}`,
    formattedChange: `${data.change > 0 ? '+' : ''}$${data.change.toFixed(2)}`,
    formattedChangePercent: `${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%`,
    formattedVolume: formatLargeNumber(data.volume),
    formattedMarketCap: data.marketCap ? formatLargeNumber(data.marketCap) : 'N/A'
  };
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}