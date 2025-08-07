import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import { createPolygonClient } from '@/lib/financial/polygon-client';
import { createNewsIntelligenceEngine } from './news-summarization';
import { createEarningsCallIntelligence } from './earnings-call-intelligence';
import { z } from 'zod';

interface UserPreferences {
  sectors: string[];
  watchlist: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentStyle: 'value' | 'growth' | 'momentum' | 'dividend' | 'balanced';
  focusAreas: ('earnings' | 'macro' | 'technical' | 'options' | 'commodities')[];
  region: 'us' | 'global' | 'emerging';
  briefingLength: 'short' | 'medium' | 'detailed';
}

interface MarketOverview {
  marketSentiment: 'risk_on' | 'risk_off' | 'neutral';
  keyDrivers: string[];
  majorIndices: {
    [key: string]: {
      change: number;
      changePercent: number;
      level: number;
    };
  };
  sectorRotation: {
    outperforming: string[];
    underperforming: string[];
  };
  vixLevel: number;
  bondYields: {
    '10yr': number;
    '2yr': number;
    spread: number;
  };
}

interface TopStories {
  headline: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  affectedAssets: string[];
  tradingImplication: string;
  timeframe: 'immediate' | 'short_term' | 'long_term';
}

interface PersonalizedInsights {
  watchlistAlerts: Array<{
    symbol: string;
    alert: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
  }>;
  sectorInsights: Array<{
    sector: string;
    trend: string;
    implication: string;
    confidence: number;
  }>;
  opportunitySpotlight: Array<{
    type: 'breakout' | 'reversal' | 'earnings' | 'merger' | 'dividend';
    description: string;
    tickers: string[];
    timeframe: string;
    riskReward: string;
  }>;
}

interface EconomicCalendar {
  todayEvents: Array<{
    time: string;
    event: string;
    importance: 'high' | 'medium' | 'low';
    forecast?: string;
    previous?: string;
    impact: string;
  }>;
  weekAhead: Array<{
    date: Date;
    event: string;
    importance: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

interface TechnicalOutlook {
  marketRegime: 'bull' | 'bear' | 'sideways';
  keyLevels: {
    [index: string]: {
      support: number[];
      resistance: number[];
      trend: 'up' | 'down' | 'sideways';
    };
  };
  breadthIndicators: {
    advanceDecline: number;
    newHighsLows: number;
    sector_breadth: number;
  };
}

interface DailyBriefing {
  id: string;
  date: Date;
  user: string;
  preferences: UserPreferences;
  marketOverview: MarketOverview;
  topStories: TopStories[];
  personalizedInsights: PersonalizedInsights;
  economicCalendar: EconomicCalendar;
  technicalOutlook: TechnicalOutlook;
  earningsPreview: Array<{
    symbol: string;
    date: Date;
    keyPoints: string[];
  }>;
  riskFactors: string[];
  opportunities: string[];
  actionItems: Array<{
    item: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  aiInsights: string[];
  confidence: number;
  generatedAt: Date;
}

const BriefingAnalysisSchema = z.object({
  marketOverview: z.object({
    marketSentiment: z.enum(['risk_on', 'risk_off', 'neutral']),
    keyDrivers: z.array(z.string()).describe("3-5 key market drivers today"),
    sectorRotation: z.object({
      outperforming: z.array(z.string()).describe("Outperforming sectors"),
      underperforming: z.array(z.string()).describe("Underperforming sectors")
    })
  }),
  topStories: z.array(z.object({
    headline: z.string(),
    summary: z.string().describe("2-3 sentence summary"),
    impact: z.enum(['high', 'medium', 'low']),
    affectedAssets: z.array(z.string()).describe("Tickers or asset classes affected"),
    tradingImplication: z.string().describe("Key trading implication"),
    timeframe: z.enum(['immediate', 'short_term', 'long_term'])
  })).describe("Top 3-5 market-moving stories"),
  riskFactors: z.array(z.string()).describe("Key risks to monitor today"),
  opportunities: z.array(z.string()).describe("Key opportunities identified"),
  aiInsights: z.array(z.string()).describe("AI-generated insights and predictions"),
  confidence: z.number().min(0).max(100).describe("Overall confidence in analysis")
});

const PersonalizedInsightsSchema = z.object({
  watchlistAlerts: z.array(z.object({
    symbol: z.string(),
    alert: z.string().describe("Alert message"),
    priority: z.enum(['high', 'medium', 'low']),
    action: z.string().describe("Recommended action")
  })),
  sectorInsights: z.array(z.object({
    sector: z.string(),
    trend: z.string().describe("Current sector trend"),
    implication: z.string().describe("What this means for investments"),
    confidence: z.number().min(0).max(100)
  })),
  opportunitySpotlight: z.array(z.object({
    type: z.enum(['breakout', 'reversal', 'earnings', 'merger', 'dividend']),
    description: z.string().describe("Description of the opportunity"),
    tickers: z.array(z.string()),
    timeframe: z.string().describe("Investment timeframe"),
    riskReward: z.string().describe("Risk/reward assessment")
  }))
});

export class MarketBriefingEngine {
  private aiProvider: any;
  private polygonClient: ReturnType<typeof createPolygonClient>;
  private newsEngine: ReturnType<typeof createNewsIntelligenceEngine>;
  private earningsIntelligence: ReturnType<typeof createEarningsCallIntelligence>;

  constructor() {
    this.aiProvider = createAIProvider('claude-4');
    this.polygonClient = createPolygonClient();
    this.newsEngine = createNewsIntelligenceEngine();
    this.earningsIntelligence = createEarningsCallIntelligence();
  }

  async generateDailyBriefing(
    userId: string,
    preferences: UserPreferences
  ): Promise<DailyBriefing> {
    if (!this.aiProvider) {
      throw new Error('AI provider not available for briefing generation');
    }

    try {
      // Step 1: Gather market data
      const marketData = await this.gatherMarketData();
      
      // Step 2: Get latest news and analysis
      const newsDigest = await this.newsEngine.getIntelligentNewsDigest(
        preferences.watchlist.length > 0 ? preferences.watchlist : undefined,
        15
      );

      // Step 3: Generate AI market analysis
      const marketAnalysis = await this.generateMarketAnalysis(marketData, newsDigest);
      
      // Step 4: Generate personalized insights
      const personalizedInsights = await this.generatePersonalizedInsights(
        preferences,
        marketData,
        newsDigest
      );
      
      // Step 5: Generate economic calendar
      const economicCalendar = await this.generateEconomicCalendar();
      
      // Step 6: Generate technical outlook
      const technicalOutlook = await this.generateTechnicalOutlook(marketData);
      
      // Step 7: Get earnings preview
      const earningsPreview = await this.getEarningsPreview(preferences.watchlist);

      return {
        id: `briefing_${Date.now()}`,
        date: new Date(),
        user: userId,
        preferences,
        marketOverview: {
          ...marketAnalysis.marketOverview,
          majorIndices: Object.keys(marketData.indices || {}).reduce((acc, key) => {
            const index = marketData.indices[key];
            acc[key] = {
              change: index.change,
              changePercent: index.changePercent,
              level: index.value
            };
            return acc;
          }, {} as { [key: string]: { change: number; changePercent: number; level: number } }),
          vixLevel: 18.5, // Mock VIX level
          bondYields: {
            '10yr': 4.25,
            '2yr': 4.15,
            spread: 0.10
          }
        },
        topStories: marketAnalysis.topStories,
        personalizedInsights,
        economicCalendar,
        technicalOutlook,
        earningsPreview,
        riskFactors: marketAnalysis.riskFactors,
        opportunities: marketAnalysis.opportunities,
        actionItems: await this.generateActionItems(preferences, marketAnalysis, personalizedInsights),
        aiInsights: marketAnalysis.aiInsights,
        confidence: marketAnalysis.confidence,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating daily briefing:', error);
      throw new Error('Failed to generate daily market briefing');
    }
  }

  private async gatherMarketData() {
    if (!this.polygonClient) {
      throw new Error('Market data not available');
    }

    // Get major indices
    const indices = await this.polygonClient.getMarketIndices();
    
    // Get market movers
    const movers = await this.polygonClient.getTopMovers();
    
    return {
      indices,
      movers,
      timestamp: new Date()
    };
  }

  private async generateMarketAnalysis(marketData: any, newsDigest: any) {
    const prompt = `Generate today's institutional-quality market analysis:

MARKET DATA:
Indices: ${JSON.stringify(marketData.indices, null, 2)}
Top Gainers: ${marketData.movers.gainers?.slice(0, 3).map((g: any) => `${g.symbol}: +${g.changePercent}%`).join(', ') || 'N/A'}
Top Losers: ${marketData.movers.losers?.slice(0, 3).map((l: any) => `${l.symbol}: ${l.changePercent}%`).join(', ') || 'N/A'}

NEWS SENTIMENT:
Overall Sentiment: ${newsDigest.sentimentReport?.overallSentiment || 'neutral'}
Market Themes: ${newsDigest.themes?.map((t: any) => t.theme).join(', ') || 'None identified'}
High Impact News Count: ${newsDigest.sentimentReport?.highImpactNews?.length || 0}

Provide institutional-quality analysis covering:
1. Current market sentiment and key drivers
2. Sector rotation and leadership changes  
3. Top market-moving stories with trading implications
4. Key risks and opportunities for professional investors
5. AI-driven insights and pattern recognition

Focus on actionable insights for institutional investors and portfolio managers.`;

    try {
      const result = await generateObject({
        model: this.aiProvider,
        schema: BriefingAnalysisSchema,
        prompt
      });

      return result.object;
    } catch (error) {
      console.error('Error generating market analysis:', error);
      
      // Fallback analysis
      return {
        marketOverview: {
          marketSentiment: 'neutral' as const,
          keyDrivers: ['Market consolidation', 'Earnings season', 'Economic data'],
          sectorRotation: {
            outperforming: ['Technology'],
            underperforming: ['Real Estate']
          }
        },
        topStories: [{
          headline: 'Market Analysis Unavailable',
          summary: 'Unable to generate market analysis at this time',
          impact: 'low' as const,
          affectedAssets: [],
          tradingImplication: 'Monitor market conditions',
          timeframe: 'immediate' as const
        }],
        riskFactors: ['Market volatility', 'Economic uncertainty'],
        opportunities: ['Sector rotation plays', 'Earnings opportunities'],
        aiInsights: ['Analysis temporarily unavailable'],
        confidence: 50
      };
    }
  }

  private async generatePersonalizedInsights(
    preferences: UserPreferences,
    marketData: any,
    newsDigest: any
  ): Promise<PersonalizedInsights> {
    const prompt = `Generate personalized investment insights for a ${preferences.riskTolerance} investor with ${preferences.investmentStyle} style:

PORTFOLIO CONTEXT:
Watchlist: ${preferences.watchlist.join(', ')}
Sectors of Interest: ${preferences.sectors.join(', ')}
Focus Areas: ${preferences.focusAreas.join(', ')}

MARKET CONTEXT:
${JSON.stringify(marketData, null, 2)}

NEWS CONTEXT:
${newsDigest.sentimentReport ? `Sentiment: ${newsDigest.sentimentReport.overallSentiment}` : 'No news data'}
${newsDigest.themes ? `Themes: ${newsDigest.themes.map((t: any) => t.theme).join(', ')}` : ''}

Provide personalized insights including watchlist alerts, sector insights, and opportunities tailored to their investment profile.`;

    try {
      const result = await generateObject({
        model: this.aiProvider,
        schema: PersonalizedInsightsSchema,
        prompt
      });

      return result.object;
    } catch (error) {
      console.error('Error generating personalized insights:', error);
      
      // Fallback insights
      return {
        watchlistAlerts: preferences.watchlist.slice(0, 3).map(symbol => ({
          symbol,
          alert: 'Monitor for market developments',
          priority: 'medium' as const,
          action: 'Watch for key levels'
        })),
        sectorInsights: preferences.sectors.slice(0, 2).map(sector => ({
          sector,
          trend: 'Mixed signals',
          implication: 'Monitor sector rotation',
          confidence: 60
        })),
        opportunitySpotlight: [{
          type: 'breakout' as const,
          description: 'Technical setup developing',
          tickers: preferences.watchlist.slice(0, 2),
          timeframe: 'Short-term',
          riskReward: 'Favorable'
        }]
      };
    }
  }

  private async generateEconomicCalendar(): Promise<EconomicCalendar> {
    // Mock implementation - in production, integrate with economic calendar API
    return {
      todayEvents: [
        {
          time: '8:30 AM ET',
          event: 'Initial Jobless Claims',
          importance: 'medium',
          forecast: '220K',
          previous: '218K',
          impact: 'USD strength if below forecast'
        },
        {
          time: '2:00 PM ET',
          event: 'Fed Chair Speech',
          importance: 'high',
          impact: 'Monitor for policy hints'
        }
      ],
      weekAhead: [
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          event: 'CPI Report',
          importance: 'high',
          description: 'Key inflation data that could impact Fed policy'
        },
        {
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          event: 'FOMC Meeting Minutes',
          importance: 'high',
          description: 'Insights into Fed thinking and future policy direction'
        }
      ]
    };
  }

  private async generateTechnicalOutlook(marketData: any): Promise<TechnicalOutlook> {
    // Mock implementation - in production, integrate with technical analysis tools
    return {
      marketRegime: 'sideways',
      keyLevels: {
        'SPX': {
          support: [4400, 4350, 4300],
          resistance: [4500, 4550, 4600],
          trend: 'sideways'
        },
        'IXIC': {
          support: [13500, 13200, 13000],
          resistance: [14000, 14200, 14500],
          trend: 'up'
        }
      },
      breadthIndicators: {
        advanceDecline: 1.2,
        newHighsLows: 0.8,
        sector_breadth: 65
      }
    };
  }

  private async getEarningsPreview(watchlist: string[]) {
    const upcomingEarnings = await this.earningsIntelligence.getUpcomingEarningsCalls(7);
    
    return upcomingEarnings
      .filter(call => watchlist.includes(call.symbol))
      .map(call => ({
        symbol: call.symbol,
        date: call.date,
        keyPoints: [
          'Revenue growth expectations',
          'Margin pressure concerns',
          'Guidance for next quarter'
        ]
      }));
  }

  private async generateActionItems(
    preferences: UserPreferences,
    marketAnalysis: any,
    personalizedInsights: PersonalizedInsights
  ): Promise<Array<{
    item: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>> {
    const actionItems = [];

    // High priority watchlist alerts
    const highPriorityAlerts = personalizedInsights.watchlistAlerts
      .filter(alert => alert.priority === 'high');
    
    highPriorityAlerts.forEach(alert => {
      actionItems.push({
        item: `Review ${alert.symbol}: ${alert.action}`,
        priority: 'high' as const,
        timeframe: 'Today'
      });
    });

    // Market opportunities
    personalizedInsights.opportunitySpotlight.forEach(opportunity => {
      actionItems.push({
        item: `Evaluate ${opportunity.type} opportunity in ${opportunity.tickers.join(', ')}`,
        priority: 'medium' as const,
        timeframe: opportunity.timeframe
      });
    });

    // Risk monitoring
    if (marketAnalysis.riskFactors.length > 0) {
      actionItems.push({
        item: `Monitor key risk: ${marketAnalysis.riskFactors[0]}`,
        priority: 'medium' as const,
        timeframe: 'This week'
      });
    }

    return actionItems.slice(0, 5); // Top 5 action items
  }
}

// Factory function
export function createMarketBriefingEngine(): MarketBriefingEngine {
  return new MarketBriefingEngine();
}

// Utility functions
export function getBriefingLength(preferences: UserPreferences): number {
  switch (preferences.briefingLength) {
    case 'short': return 500;
    case 'medium': return 1000;
    case 'detailed': return 2000;
    default: return 1000;
  }
}

export function formatMarketSentiment(sentiment: string): {
  label: string;
  color: string;
  icon: string;
} {
  switch (sentiment) {
    case 'risk_on':
      return { label: 'Risk On', color: 'text-green-600 bg-green-100', icon: '📈' };
    case 'risk_off':
      return { label: 'Risk Off', color: 'text-red-600 bg-red-100', icon: '📉' };
    default:
      return { label: 'Neutral', color: 'text-gray-600 bg-gray-100', icon: '➡️' };
  }
}

export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}