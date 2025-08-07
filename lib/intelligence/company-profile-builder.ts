import { createPolygonClient } from '@/lib/financial/polygon-client';
import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import { z } from 'zod';

interface CompanyBasicInfo {
  symbol: string;
  name: string;
  description: string;
  industry: string;
  sector: string;
  marketCap: number;
  employees: number;
  website: string;
  exchange: string;
  founded?: number;
  headquarters?: string;
}

interface FinancialMetrics {
  revenue: number;
  netIncome: number;
  eps: number;
  peRatio: number;
  pbRatio: number;
  debtToEquity: number;
  roe: number;
  roa: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  freeCashFlow: number;
  dividendYield: number;
  payoutRatio: number;
}

interface BusinessSegments {
  segment: string;
  revenue: number;
  revenuePercent: number;
  operatingIncome: number;
  description: string;
}

interface CompetitiveAnalysis {
  mainCompetitors: string[];
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  competitiveAdvantages: string[];
  threats: string[];
  marketShare: number;
}

interface RiskFactors {
  category: 'operational' | 'financial' | 'regulatory' | 'market' | 'technology';
  risk: string;
  impact: 'high' | 'medium' | 'low';
  probability: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface ESGProfile {
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  overallRating: 'A' | 'B' | 'C' | 'D' | 'F';
  keyInitiatives: string[];
  controversies: string[];
}

interface CompanyProfile {
  basicInfo: CompanyBasicInfo;
  financialMetrics: FinancialMetrics;
  businessSegments: BusinessSegments[];
  competitiveAnalysis: CompetitiveAnalysis;
  riskFactors: RiskFactors[];
  esgProfile: ESGProfile;
  recentNews: Array<{
    title: string;
    date: Date;
    sentiment: 'positive' | 'negative' | 'neutral';
    impact: string;
  }>;
  analystCoverage: {
    averageRating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    priceTarget: number;
    analystCount: number;
    upgrades: number;
    downgrades: number;
  };
  keyEvents: Array<{
    date: Date;
    event: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  investmentThesis: {
    bullish: string[];
    bearish: string[];
    keyQuestions: string[];
  };
  generatedAt: Date;
  confidence: number;
}

const BusinessAnalysisSchema = z.object({
  competitiveAnalysis: z.object({
    mainCompetitors: z.array(z.string()).describe("Top 3-5 main competitors"),
    marketPosition: z.enum(['leader', 'challenger', 'follower', 'niche']).describe("Market position classification"),
    competitiveAdvantages: z.array(z.string()).describe("Key competitive advantages"),
    threats: z.array(z.string()).describe("Main competitive threats"),
    marketShare: z.number().describe("Estimated market share percentage")
  }),
  riskFactors: z.array(z.object({
    category: z.enum(['operational', 'financial', 'regulatory', 'market', 'technology']),
    risk: z.string().describe("Description of the risk"),
    impact: z.enum(['high', 'medium', 'low']).describe("Potential impact level"),
    probability: z.enum(['high', 'medium', 'low']).describe("Probability of occurrence"),
    mitigation: z.string().describe("How company is mitigating this risk")
  })).describe("Top 5-7 risk factors"),
  investmentThesis: z.object({
    bullish: z.array(z.string()).describe("Top bullish arguments for investing"),
    bearish: z.array(z.string()).describe("Top bearish arguments against investing"),
    keyQuestions: z.array(z.string()).describe("Key questions investors should ask")
  })
});

export class CompanyProfileBuilder {
  private polygonClient: ReturnType<typeof createPolygonClient>;
  private aiProvider: any;

  constructor() {
    this.polygonClient = createPolygonClient();
    this.aiProvider = createAIProvider('claude-4'); // Use Claude for comprehensive analysis
  }

  async buildCompanyProfile(symbol: string): Promise<CompanyProfile> {
    if (!this.polygonClient || !this.aiProvider) {
      throw new Error('Company profile service unavailable');
    }

    try {
      // Step 1: Gather basic company information
      const basicInfo = await this.getBasicCompanyInfo(symbol);
      
      // Step 2: Get financial metrics
      const financialMetrics = await this.getFinancialMetrics(symbol);
      
      // Step 3: Get recent news for context
      const recentNews = await this.getRecentCompanyNews(symbol);
      
      // Step 4: Generate AI-powered business analysis
      const businessAnalysis = await this.generateBusinessAnalysis(basicInfo, financialMetrics, recentNews);
      
      // Step 5: Generate business segments (mock data for now)
      const businessSegments = await this.getBusinessSegments(symbol);
      
      // Step 6: Generate ESG profile (mock data for now)
      const esgProfile = await this.generateESGProfile(basicInfo);
      
      // Step 7: Generate analyst coverage summary (mock data for now)
      const analystCoverage = await this.generateAnalystCoverage(symbol);
      
      // Step 8: Generate key events timeline
      const keyEvents = await this.generateKeyEvents(recentNews);

      return {
        basicInfo,
        financialMetrics,
        businessSegments,
        competitiveAnalysis: businessAnalysis.competitiveAnalysis,
        riskFactors: businessAnalysis.riskFactors,
        esgProfile,
        recentNews: recentNews.map(news => ({
          title: news.title,
          date: news.publishedAt,
          sentiment: news.sentiment || 'neutral',
          impact: 'Market moving news'
        })),
        analystCoverage,
        keyEvents,
        investmentThesis: businessAnalysis.investmentThesis,
        generatedAt: new Date(),
        confidence: 0.85
      };
    } catch (error) {
      console.error('Error building company profile:', error);
      throw new Error(`Failed to build company profile for ${symbol}`);
    }
  }

  private async getBasicCompanyInfo(symbol: string): Promise<CompanyBasicInfo> {
    const companyInfo = await this.polygonClient!.getCompanyInfo(symbol);
    const quote = await this.polygonClient!.getStockQuote(symbol);
    
    return {
      symbol: symbol.toUpperCase(),
      name: companyInfo?.name || symbol,
      description: companyInfo?.description || '',
      industry: companyInfo?.industry || 'Unknown',
      sector: companyInfo?.sector || 'Unknown',
      marketCap: companyInfo?.marketCap || 0,
      employees: companyInfo?.employees || 0,
      website: companyInfo?.website || '',
      exchange: companyInfo?.exchange || 'NASDAQ',
      founded: undefined, // Would need additional data source
      headquarters: undefined // Would need additional data source
    };
  }

  private async getFinancialMetrics(symbol: string): Promise<FinancialMetrics> {
    const financials = await this.polygonClient!.getFinancials(symbol, 1);
    const quote = await this.polygonClient!.getStockQuote(symbol);
    
    if (financials.length === 0) {
      throw new Error(`No financial data available for ${symbol}`);
    }

    const latest = financials[0];
    const price = quote?.price || 0;
    
    // Calculate derived metrics
    const peRatio = latest.eps > 0 ? price / latest.eps : 0;
    const pbRatio = latest.shareholderEquity > 0 ? (price * 1000000) / latest.shareholderEquity : 0;
    const debtToEquity = latest.shareholderEquity > 0 ? latest.totalDebt / latest.shareholderEquity : 0;
    const roe = latest.shareholderEquity > 0 ? (latest.netIncome / latest.shareholderEquity) * 100 : 0;
    const roa = latest.totalAssets > 0 ? (latest.netIncome / latest.totalAssets) * 100 : 0;
    
    return {
      revenue: latest.revenue,
      netIncome: latest.netIncome,
      eps: latest.eps,
      peRatio,
      pbRatio,
      debtToEquity,
      roe,
      roa,
      grossMargin: 0, // Would need additional calculations
      operatingMargin: 0, // Would need additional calculations
      profitMargin: latest.revenue > 0 ? (latest.netIncome / latest.revenue) * 100 : 0,
      freeCashFlow: latest.freeCashFlow,
      dividendYield: 0, // Would need additional data
      payoutRatio: 0 // Would need additional data
    };
  }

  private async getRecentCompanyNews(symbol: string): Promise<Array<{
    title: string;
    publishedAt: Date;
    description: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>> {
    const news = await this.polygonClient!.getNews(10, [symbol]);
    
    return news.map(item => ({
      title: item.title,
      publishedAt: new Date(item.publishedUtc),
      description: item.description,
      sentiment: undefined // Will be analyzed by AI
    }));
  }

  private async generateBusinessAnalysis(
    basicInfo: CompanyBasicInfo,
    financialMetrics: FinancialMetrics,
    recentNews: any[]
  ): Promise<{
    competitiveAnalysis: CompetitiveAnalysis;
    riskFactors: RiskFactors[];
    investmentThesis: { bullish: string[]; bearish: string[]; keyQuestions: string[] };
  }> {
    const prompt = `Conduct a comprehensive business analysis for ${basicInfo.name} (${basicInfo.symbol}):

Company Overview:
- Industry: ${basicInfo.industry}
- Sector: ${basicInfo.sector}
- Market Cap: $${(basicInfo.marketCap / 1e9).toFixed(2)}B
- Employees: ${basicInfo.employees?.toLocaleString() || 'N/A'}

Financial Metrics:
- Revenue: $${(financialMetrics.revenue / 1e6).toFixed(0)}M
- Net Income: $${(financialMetrics.netIncome / 1e6).toFixed(0)}M
- P/E Ratio: ${financialMetrics.peRatio.toFixed(1)}
- Debt/Equity: ${financialMetrics.debtToEquity.toFixed(2)}
- ROE: ${financialMetrics.roe.toFixed(1)}%

Recent News Context:
${recentNews.slice(0, 3).map(news => `- ${news.title}`).join('\n')}

Provide institutional-quality analysis covering:
1. Competitive positioning and main competitors
2. Key risk factors across different categories
3. Comprehensive investment thesis with both sides

Focus on actionable insights for professional investors.`;

    try {
      const result = await generateObject({
        model: this.aiProvider,
        schema: BusinessAnalysisSchema,
        prompt
      });

      return result.object;
    } catch (error) {
      console.error('Error generating business analysis:', error);
      
      // Fallback analysis
      return {
        competitiveAnalysis: {
          mainCompetitors: ['Competitor A', 'Competitor B', 'Competitor C'],
          marketPosition: 'challenger',
          competitiveAdvantages: ['Strong brand', 'Technology leadership'],
          threats: ['Market competition', 'Regulatory changes'],
          marketShare: 10
        },
        riskFactors: [
          {
            category: 'market',
            risk: 'Economic downturn impact',
            impact: 'high',
            probability: 'medium',
            mitigation: 'Diversified revenue streams'
          }
        ],
        investmentThesis: {
          bullish: ['Strong fundamentals', 'Growth opportunities'],
          bearish: ['Market headwinds', 'Valuation concerns'],
          keyQuestions: ['Can growth continue?', 'Competitive position sustainable?']
        }
      };
    }
  }

  private async getBusinessSegments(symbol: string): Promise<BusinessSegments[]> {
    // Mock implementation - in production, this would parse 10-K filings
    return [
      {
        segment: 'Primary Business',
        revenue: 80000000,
        revenuePercent: 80,
        operatingIncome: 12000000,
        description: 'Core business operations'
      },
      {
        segment: 'Secondary Business',
        revenue: 20000000,
        revenuePercent: 20,
        operatingIncome: 3000000,
        description: 'Supporting business units'
      }
    ];
  }

  private async generateESGProfile(basicInfo: CompanyBasicInfo): Promise<ESGProfile> {
    // Mock implementation - in production, this would integrate with ESG data providers
    return {
      environmentalScore: 75,
      socialScore: 80,
      governanceScore: 85,
      overallRating: 'B',
      keyInitiatives: [
        'Carbon neutrality by 2030',
        'Diversity and inclusion programs',
        'Board independence improvements'
      ],
      controversies: []
    };
  }

  private async generateAnalystCoverage(symbol: string): Promise<{
    averageRating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    priceTarget: number;
    analystCount: number;
    upgrades: number;
    downgrades: number;
  }> {
    // Mock implementation - in production, this would integrate with analyst data
    return {
      averageRating: 'Buy',
      priceTarget: 150.0,
      analystCount: 12,
      upgrades: 3,
      downgrades: 1
    };
  }

  private async generateKeyEvents(recentNews: any[]): Promise<Array<{
    date: Date;
    event: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>> {
    return recentNews.slice(0, 5).map(news => ({
      date: news.publishedAt,
      event: news.title,
      impact: 'neutral' as const
    }));
  }
}

// Factory function
export function createCompanyProfileBuilder(): CompanyProfileBuilder {
  return new CompanyProfileBuilder();
}

// Utility functions
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toFixed(0)}`;
}

export function getRatingColor(rating: string): string {
  switch (rating) {
    case 'Strong Buy': return 'text-green-600 bg-green-100';
    case 'Buy': return 'text-green-500 bg-green-50';
    case 'Hold': return 'text-yellow-600 bg-yellow-100';
    case 'Sell': return 'text-red-500 bg-red-50';
    case 'Strong Sell': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getRiskColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}