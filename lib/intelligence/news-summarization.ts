import { createPolygonClient } from '@/lib/financial/polygon-client';
import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import { z } from 'zod';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  tickers?: string[];
  content?: string;
}

interface NewsSummary {
  id: string;
  title: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  impactLevel: 'high' | 'medium' | 'low';
  affectedTickers: string[];
  tradingImplications: string[];
  summary: string;
  confidence: number; // 0 to 1
  timestamp: Date;
  sourceCount: number;
}

interface MarketTheme {
  theme: string;
  relevantNews: string[];
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  keyDrivers: string[];
  affectedSectors: string[];
}

const NewsSummarySchema = z.object({
  keyPoints: z.array(z.string()).describe("3-5 key points from the news"),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).describe("Overall market sentiment"),
  sentimentScore: z.number().min(-1).max(1).describe("Sentiment score from -1 (very bearish) to 1 (very bullish)"),
  impactLevel: z.enum(['high', 'medium', 'low']).describe("Potential market impact level"),
  affectedTickers: z.array(z.string()).describe("Stock tickers that could be impacted"),
  tradingImplications: z.array(z.string()).describe("Key trading implications and opportunities"),
  summary: z.string().describe("Professional 2-3 sentence executive summary"),
  confidence: z.number().min(0).max(1).describe("Analysis confidence level")
});

const MarketThemeSchema = z.object({
  themes: z.array(z.object({
    theme: z.string().describe("Market theme or trend"),
    overallSentiment: z.enum(['bullish', 'bearish', 'neutral']),
    keyDrivers: z.array(z.string()).describe("Key drivers behind this theme"),
    affectedSectors: z.array(z.string()).describe("Sectors most impacted by this theme"),
    relevantNewsIds: z.array(z.string()).describe("IDs of news articles supporting this theme")
  }))
});

export class NewsIntelligenceEngine {
  private polygonClient: ReturnType<typeof createPolygonClient>;
  private aiProvider: any;

  constructor() {
    this.polygonClient = createPolygonClient();
    this.aiProvider = createAIProvider('claude-4'); // Use Claude for news analysis
  }

  async getLatestNews(tickers?: string[], limit: number = 20): Promise<NewsArticle[]> {
    if (!this.polygonClient) {
      throw new Error('News service unavailable - Polygon API not configured');
    }

    const polygonNews = await this.polygonClient.getNews(limit, tickers);
    
    return polygonNews.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      source: item.author || 'Unknown',
      publishedAt: new Date(item.publishedUtc),
      tickers: item.tickers
    }));
  }

  async generateNewsSummary(article: NewsArticle): Promise<NewsSummary> {
    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

    const prompt = `Analyze this financial news article for trading and investment insights:

Title: ${article.title}
Description: ${article.description}
Source: ${article.source}
Related Tickers: ${article.tickers?.join(', ') || 'None specified'}

Provide a professional financial analysis focusing on:
1. Key market-moving information
2. Sentiment impact on stocks/markets
3. Trading implications and opportunities
4. Risk factors to consider

Be specific about potential stock impacts and provide actionable insights for institutional investors.`;

    try {
      const result = await generateObject({
        model: this.aiProvider,
        schema: NewsSummarySchema,
        prompt
      });

      return {
        id: `summary_${article.id}`,
        title: article.title,
        ...result.object,
        timestamp: new Date(),
        sourceCount: 1
      };
    } catch (error) {
      console.error('Error generating news summary:', error);
      
      // Fallback basic summary
      return {
        id: `summary_${article.id}`,
        title: article.title,
        keyPoints: [article.description],
        sentiment: 'neutral',
        sentimentScore: 0,
        impactLevel: 'medium',
        affectedTickers: article.tickers || [],
        tradingImplications: ['Monitor for market reaction'],
        summary: article.description,
        confidence: 0.5,
        timestamp: new Date(),
        sourceCount: 1
      };
    }
  }

  async generateBulkNewsSummaries(articles: NewsArticle[]): Promise<NewsSummary[]> {
    const summaries = await Promise.allSettled(
      articles.map(article => this.generateNewsSummary(article))
    );

    return summaries
      .filter((result): result is PromiseFulfilledResult<NewsSummary> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  async identifyMarketThemes(summaries: NewsSummary[]): Promise<MarketTheme[]> {
    if (!this.aiProvider || summaries.length === 0) {
      return [];
    }

    const newsContext = summaries.map(summary => ({
      id: summary.id,
      title: summary.title,
      keyPoints: summary.keyPoints,
      sentiment: summary.sentiment,
      affectedTickers: summary.affectedTickers
    }));

    const prompt = `Analyze these financial news summaries to identify major market themes and trends:

${newsContext.map((news, index) => 
  `${index + 1}. ${news.title}\n   Key Points: ${news.keyPoints.join('; ')}\n   Sentiment: ${news.sentiment}\n   Tickers: ${news.affectedTickers.join(', ')}\n`
).join('\n')}

Identify 3-5 major market themes that emerge from this news. Focus on:
1. Sector trends and rotations
2. Economic themes and policy impacts
3. Company-specific themes affecting multiple stocks
4. Geopolitical or regulatory themes
5. Technology or innovation themes

For each theme, analyze the overall sentiment and key driving factors.`;

    try {
      const result = await generateObject({
        model: this.aiProvider,
        schema: MarketThemeSchema,
        prompt
      });

      return result.object.themes.map(theme => ({
        theme: theme.theme,
        relevantNews: theme.relevantNewsIds,
        overallSentiment: theme.overallSentiment,
        keyDrivers: theme.keyDrivers,
        affectedSectors: theme.affectedSectors
      }));
    } catch (error) {
      console.error('Error identifying market themes:', error);
      return [];
    }
  }

  async generateMarketSentimentReport(summaries: NewsSummary[]): Promise<{
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    highImpactNews: NewsSummary[];
    topAffectedTickers: { ticker: string; mentions: number; avgSentiment: number }[];
  }> {
    if (summaries.length === 0) {
      return {
        overallSentiment: 'neutral',
        sentimentScore: 0,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        highImpactNews: [],
        topAffectedTickers: []
      };
    }

    // Calculate sentiment distribution
    const bullishCount = summaries.filter(s => s.sentiment === 'bullish').length;
    const bearishCount = summaries.filter(s => s.sentiment === 'bearish').length;
    const neutralCount = summaries.filter(s => s.sentiment === 'neutral').length;

    // Calculate weighted sentiment score
    const totalScore = summaries.reduce((sum, s) => sum + s.sentimentScore, 0);
    const sentimentScore = totalScore / summaries.length;

    // Determine overall sentiment
    let overallSentiment: 'bullish' | 'bearish' | 'neutral';
    if (sentimentScore > 0.1) overallSentiment = 'bullish';
    else if (sentimentScore < -0.1) overallSentiment = 'bearish';
    else overallSentiment = 'neutral';

    // Get high impact news
    const highImpactNews = summaries
      .filter(s => s.impactLevel === 'high')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    // Calculate ticker mention frequency and sentiment
    const tickerMap = new Map<string, { mentions: number; totalSentiment: number }>();
    
    summaries.forEach(summary => {
      summary.affectedTickers.forEach(ticker => {
        const current = tickerMap.get(ticker) || { mentions: 0, totalSentiment: 0 };
        tickerMap.set(ticker, {
          mentions: current.mentions + 1,
          totalSentiment: current.totalSentiment + summary.sentimentScore
        });
      });
    });

    const topAffectedTickers = Array.from(tickerMap.entries())
      .map(([ticker, data]) => ({
        ticker,
        mentions: data.mentions,
        avgSentiment: data.totalSentiment / data.mentions
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);

    return {
      overallSentiment,
      sentimentScore,
      bullishCount,
      bearishCount,
      neutralCount,
      highImpactNews,
      topAffectedTickers
    };
  }

  async getIntelligentNewsDigest(tickers?: string[], limit: number = 20): Promise<{
    summaries: NewsSummary[];
    themes: MarketTheme[];
    sentimentReport: {
      overallSentiment: 'bullish' | 'bearish' | 'neutral';
      sentimentScore: number;
      bullishCount: number;
      bearishCount: number;
      neutralCount: number;
      highImpactNews: NewsSummary[];
      topAffectedTickers: { ticker: string; mentions: number; avgSentiment: number }[];
    };
  }> {
    try {
      // Get latest news
      const articles = await this.getLatestNews(tickers, limit);
      
      if (articles.length === 0) {
        return {
          summaries: [],
          themes: [],
          sentimentReport: await this.generateMarketSentimentReport([])
        };
      }

      // Generate AI summaries
      const summaries = await this.generateBulkNewsSummaries(articles);
      
      // Identify market themes
      const themes = await this.identifyMarketThemes(summaries);
      
      // Generate sentiment report
      const sentimentReport = await this.generateMarketSentimentReport(summaries);

      return {
        summaries,
        themes,
        sentimentReport
      };
    } catch (error) {
      console.error('Error generating intelligent news digest:', error);
      throw new Error('Failed to generate news digest');
    }
  }
}

// Factory function
export function createNewsIntelligenceEngine(): NewsIntelligenceEngine {
  return new NewsIntelligenceEngine();
}

// Utility functions for formatting
export function formatSentimentScore(score: number): string {
  if (score > 0.5) return 'Very Bullish';
  if (score > 0.1) return 'Bullish';
  if (score > -0.1) return 'Neutral';
  if (score > -0.5) return 'Bearish';
  return 'Very Bearish';
}

export function getSentimentColor(sentiment: 'bullish' | 'bearish' | 'neutral'): string {
  switch (sentiment) {
    case 'bullish': return 'text-green-600';
    case 'bearish': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function getImpactBadgeColor(impact: 'high' | 'medium' | 'low'): string {
  switch (impact) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}