import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import { createPolygonClient } from '@/lib/financial/polygon-client';
import { z } from 'zod';

interface EarningsCall {
  id: string;
  symbol: string;
  companyName: string;
  quarter: string;
  year: number;
  date: Date;
  time: string;
  status: 'scheduled' | 'live' | 'completed';
  transcript?: string;
  audioUrl?: string;
  participantCount?: number;
}

interface EarningsMetrics {
  reportedEPS: number;
  estimatedEPS: number;
  epsSurprise: number;
  epsSurprisePercent: number;
  reportedRevenue: number;
  estimatedRevenue: number;
  revenueSurprise: number;
  revenueSurprisePercent: number;
  guidance: {
    nextQuarterEPS?: { low: number; high: number };
    nextQuarterRevenue?: { low: number; high: number };
    fullYearEPS?: { low: number; high: number };
    fullYearRevenue?: { low: number; high: number };
  };
}

interface KeyTakeaway {
  category: 'guidance' | 'strategy' | 'market' | 'operations' | 'financial' | 'risk';
  point: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  importance: 'high' | 'medium' | 'low';
  tradingImplication: string;
}

interface ManagementTone {
  confidence: number; // 1-10 scale
  optimism: number; // 1-10 scale
  transparency: number; // 1-10 scale
  keyPersonalities: string[];
  notableQuotes: Array<{
    speaker: string;
    quote: string;
    context: string;
  }>;
}

interface QAInsights {
  totalQuestions: number;
  keyThemes: string[];
  analystConcerns: string[];
  managementResponses: Array<{
    question: string;
    answer: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    evasiveness: number; // 1-10 scale
  }>;
}

interface TradingReaction {
  preMarketMove: number;
  afterHoursMove: number;
  volumeSpike: number;
  optionsActivity: {
    callVolume: number;
    putVolume: number;
    putCallRatio: number;
  };
  analystActions: Array<{
    firm: string;
    action: 'upgrade' | 'downgrade' | 'initiate' | 'reiterate';
    newRating: string;
    newTarget: number;
  }>;
}

interface EarningsIntelligence {
  call: EarningsCall;
  metrics: EarningsMetrics;
  keyTakeaways: KeyTakeaway[];
  managementTone: ManagementTone;
  qaInsights: QAInsights;
  tradingReaction: TradingReaction;
  overallSentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  investmentImplication: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidenceScore: number; // 0-100
  generatedAt: Date;
}

const EarningsAnalysisSchema = z.object({
  keyTakeaways: z.array(z.object({
    category: z.enum(['guidance', 'strategy', 'market', 'operations', 'financial', 'risk']),
    point: z.string().describe("Key point or insight"),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    importance: z.enum(['high', 'medium', 'low']),
    tradingImplication: z.string().describe("What this means for trading")
  })).describe("Top 5-8 key takeaways from the earnings call"),
  
  managementTone: z.object({
    confidence: z.number().min(1).max(10).describe("Management confidence level 1-10"),
    optimism: z.number().min(1).max(10).describe("Management optimism level 1-10"),
    transparency: z.number().min(1).max(10).describe("Management transparency level 1-10"),
    keyPersonalities: z.array(z.string()).describe("Key management personalities mentioned"),
    notableQuotes: z.array(z.object({
      speaker: z.string(),
      quote: z.string(),
      context: z.string()
    })).describe("Notable quotes from management")
  }),
  
  qaInsights: z.object({
    totalQuestions: z.number().describe("Total number of questions asked"),
    keyThemes: z.array(z.string()).describe("Main themes of analyst questions"),
    analystConcerns: z.array(z.string()).describe("Primary analyst concerns raised"),
    managementResponses: z.array(z.object({
      question: z.string(),
      answer: z.string(),
      sentiment: z.enum(['positive', 'negative', 'neutral']),
      evasiveness: z.number().min(1).max(10).describe("How evasive was the response 1-10")
    })).describe("Key Q&A exchanges")
  }),
  
  overallSentiment: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
  investmentImplication: z.enum(['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']),
  confidenceScore: z.number().min(0).max(100).describe("Confidence in this analysis 0-100")
});

export class EarningsCallIntelligence {
  private aiProvider: any;
  private polygonClient: ReturnType<typeof createPolygonClient>;

  constructor() {
    this.aiProvider = createAIProvider('claude-4'); // Use Claude for earnings analysis
    this.polygonClient = createPolygonClient();
  }

  async getUpcomingEarningsCalls(days: number = 7): Promise<EarningsCall[]> {
    // Mock implementation - in production, integrate with earnings calendar API
    const mockCalls: EarningsCall[] = [
      {
        id: '1',
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        quarter: 'Q1',
        year: 2024,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        time: '4:30 PM ET',
        status: 'scheduled'
      },
      {
        id: '2',
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        quarter: 'Q1',
        year: 2024,
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        time: '5:00 PM ET',
        status: 'scheduled'
      }
    ];

    return mockCalls;
  }

  async analyzeEarningsCall(
    call: EarningsCall,
    transcript: string,
    metrics: EarningsMetrics
  ): Promise<EarningsIntelligence> {
    if (!this.aiProvider) {
      throw new Error('AI provider not available for earnings analysis');
    }

    const prompt = `Analyze this earnings call transcript for ${call.companyName} (${call.symbol}) ${call.quarter} ${call.year}:

EARNINGS METRICS:
- Reported EPS: $${metrics.reportedEPS} vs Est. $${metrics.estimatedEPS} (${metrics.epsSurprisePercent > 0 ? '+' : ''}${metrics.epsSurprisePercent.toFixed(1)}% surprise)
- Reported Revenue: $${(metrics.reportedRevenue / 1e6).toFixed(0)}M vs Est. $${(metrics.estimatedRevenue / 1e6).toFixed(0)}M (${metrics.revenueSurprisePercent > 0 ? '+' : ''}${metrics.revenueSurprisePercent.toFixed(1)}% surprise)

TRANSCRIPT (First 3000 chars):
${transcript.substring(0, 3000)}...

Provide comprehensive institutional-quality analysis covering:
1. Key strategic takeaways and business insights
2. Management tone and confidence assessment
3. Q&A session analysis with analyst concerns
4. Trading and investment implications
5. Risk factors and opportunities identified

Focus on actionable insights for professional investors and traders.`;

    try {
      const result = await generateObject({
        model: this.aiProvider,
        schema: EarningsAnalysisSchema,
        prompt
      });

      // Mock trading reaction data (in production, get from market data)
      const tradingReaction: TradingReaction = {
        preMarketMove: metrics.epsSurprisePercent > 5 ? 3.2 : -1.5,
        afterHoursMove: metrics.revenueSurprisePercent > 2 ? 2.8 : -0.8,
        volumeSpike: 2.5,
        optionsActivity: {
          callVolume: 125000,
          putVolume: 85000,
          putCallRatio: 0.68
        },
        analystActions: [
          {
            firm: 'Morgan Stanley',
            action: metrics.epsSurprisePercent > 10 ? 'upgrade' : 'reiterate',
            newRating: 'Buy',
            newTarget: 180
          }
        ]
      };

      return {
        call,
        metrics,
        keyTakeaways: result.object.keyTakeaways,
        managementTone: result.object.managementTone,
        qaInsights: result.object.qaInsights,
        tradingReaction,
        overallSentiment: result.object.overallSentiment,
        investmentImplication: result.object.investmentImplication,
        confidenceScore: result.object.confidenceScore,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error analyzing earnings call:', error);
      throw new Error('Failed to analyze earnings call');
    }
  }

  async getLiveEarningsInsights(symbol: string): Promise<{
    isLive: boolean;
    call?: EarningsCall;
    realTimeInsights?: string[];
    keyMoments?: Array<{
      timestamp: Date;
      moment: string;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
    socialSentiment?: {
      twitterMentions: number;
      overallSentiment: 'bullish' | 'bearish' | 'neutral';
      keyTweets: string[];
    };
  }> {
    // Mock implementation for live earnings tracking
    const upcomingCalls = await this.getUpcomingEarningsCalls();
    const liveCall = upcomingCalls.find(call => 
      call.symbol === symbol.toUpperCase() && call.status === 'live'
    );

    if (!liveCall) {
      return { isLive: false };
    }

    return {
      isLive: true,
      call: liveCall,
      realTimeInsights: [
        'Management sounds confident about Q2 guidance',
        'Strong margins mentioned multiple times',
        'Expansion plans into new markets announced'
      ],
      keyMoments: [
        {
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          moment: 'CEO announces 15% revenue growth guidance',
          impact: 'positive'
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          moment: 'CFO mentions margin pressure concerns',
          impact: 'negative'
        }
      ],
      socialSentiment: {
        twitterMentions: 1250,
        overallSentiment: 'bullish',
        keyTweets: [
          'Strong guidance from $AAPL management',
          'Impressive margin expansion story',
          'Q&A getting tough questions on competition'
        ]
      }
    };
  }

  async generateEarningsPreview(symbol: string): Promise<{
    expectations: {
      epsEstimate: number;
      revenueEstimate: number;
      keyMetricsToWatch: string[];
    };
    keyQuestions: string[];
    riskFactors: string[];
    tradingSetup: {
      supportLevels: number[];
      resistanceLevels: number[];
      impliedMove: number;
      optionsFlow: string;
    };
    analystExpectations: {
      consensus: string;
      keyFirms: Array<{
        firm: string;
        rating: string;
        target: number;
        keyThemes: string[];
      }>;
    };
  }> {
    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

    // Get company info and recent financial data
    const companyInfo = await this.polygonClient?.getCompanyInfo(symbol);
    const recentNews = await this.polygonClient?.getNews(5, [symbol]);

    const prompt = `Generate a comprehensive earnings preview for ${companyInfo?.name || symbol} (${symbol}):

Company Context:
- Industry: ${companyInfo?.industry || 'Unknown'}
- Market Cap: $${companyInfo?.marketCap ? (companyInfo.marketCap / 1e9).toFixed(2) + 'B' : 'Unknown'}

Recent News Context:
${recentNews?.slice(0, 3).map(news => `- ${news.title}`).join('\n') || 'No recent news available'}

Provide institutional-quality earnings preview covering:
1. Key metrics and expectations to watch
2. Critical questions for management
3. Risk factors that could impact results
4. Trading setup and technical levels

Focus on actionable insights for professional investors preparing for earnings.`;

    try {
      const analysis = await generateText({
        model: this.aiProvider,
        prompt
      });

      // Mock structured data (in production, parse AI response or use structured generation)
      return {
        expectations: {
          epsEstimate: 1.25,
          revenueEstimate: 85000000000,
          keyMetricsToWatch: [
            'iPhone unit sales',
            'Services revenue growth',
            'Gross margins',
            'China revenue trends'
          ]
        },
        keyQuestions: [
          'How is demand holding up in key markets?',
          'What is the impact of macroeconomic headwinds?',
          'Can margins be sustained at current levels?',
          'What are the key growth drivers for next year?'
        ],
        riskFactors: [
          'Weaker than expected demand',
          'Supply chain disruptions',
          'Currency headwinds',
          'Competitive pressure'
        ],
        tradingSetup: {
          supportLevels: [145, 140, 135],
          resistanceLevels: [160, 165, 170],
          impliedMove: 8.5,
          optionsFlow: 'Heavy call buying in near-term strikes'
        },
        analystExpectations: {
          consensus: 'Buy',
          keyFirms: [
            {
              firm: 'Goldman Sachs',
              rating: 'Buy',
              target: 170,
              keyThemes: ['AI integration', 'Services growth']
            },
            {
              firm: 'Morgan Stanley',
              rating: 'Overweight',
              target: 165,
              keyThemes: ['Innovation cycle', 'Market share']
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error generating earnings preview:', error);
      throw new Error('Failed to generate earnings preview');
    }
  }
}

// Factory function
export function createEarningsCallIntelligence(): EarningsCallIntelligence {
  return new EarningsCallIntelligence();
}

// Utility functions
export function formatEPSSurprise(surprise: number, surprisePercent: number): string {
  const sign = surprise > 0 ? '+' : '';
  return `${sign}$${surprise.toFixed(2)} (${sign}${surprisePercent.toFixed(1)}%)`;
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'very_positive': return 'text-green-600 bg-green-100';
    case 'positive': return 'text-green-500 bg-green-50';
    case 'neutral': return 'text-gray-600 bg-gray-100';
    case 'negative': return 'text-red-500 bg-red-50';
    case 'very_negative': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getImplicationColor(implication: string): string {
  switch (implication) {
    case 'strong_buy': return 'text-green-600 bg-green-100';
    case 'buy': return 'text-green-500 bg-green-50';
    case 'hold': return 'text-yellow-600 bg-yellow-100';
    case 'sell': return 'text-red-500 bg-red-50';
    case 'strong_sell': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function formatManagementTone(tone: ManagementTone): string {
  const avg = (tone.confidence + tone.optimism + tone.transparency) / 3;
  if (avg >= 8) return 'Very Confident';
  if (avg >= 6) return 'Confident';
  if (avg >= 4) return 'Cautious';
  return 'Uncertain';
}