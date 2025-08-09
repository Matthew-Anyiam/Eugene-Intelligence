import { z } from 'zod';
import { createFinancialAgentCore, AgentConfig, AgentDecision, FinancialDataRequest } from './financial-agent-core';

// Trading-specific interfaces
export interface TradingSignal {
  action: 'buy' | 'sell' | 'hold';
  symbol: string;
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  positionSize: number;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MarketAnalysis {
  symbol: string;
  technicalIndicators: {
    rsi: number;
    movingAverage: { ma20: number; ma50: number; ma200: number };
    macd: { signal: number; histogram: number };
    bollinger: { upper: number; lower: number };
    volume: { average: number; current: number; volumeRatio: number };
  };
  fundamentalMetrics: {
    pe: number;
    eps: number;
    revenue: number;
    revenueGrowth: number;
    profitMargin: number;
    debtToEquity: number;
  };
  newssentiment: {
    score: number; // -1 to 1
    articles: number;
    keyThemes: string[];
  };
  priceTargets: {
    bullish: number;
    bearish: number;
    consensus: number;
  };
  risk: {
    volatility: number;
    beta: number;
    maxDrawdown: number;
    correlations: Array<{ symbol: string; correlation: number }>;
  };
  timestamp: Date;
}

export interface TradingStrategy {
  name: string;
  type: 'momentum' | 'mean_reversion' | 'breakout' | 'scalping' | 'swing' | 'value';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  indicators: string[];
  entryConditions: string[];
  exitConditions: string[];
  riskManagement: {
    stopLossPercentage: number;
    takeProfitPercentage: number;
    maxPositionSize: number;
    riskPerTrade: number;
  };
  backTestResults?: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryTime: Date;
  unrealizedPnL: number;
  realizedPnL?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy: string;
  agentId: string;
}

// AI Models Integration for Trading Decisions
export interface AITradingModels {
  claude: (prompt: string, data: any) => Promise<string>;
  gpt: (prompt: string, data: any) => Promise<string>;
  grok: (prompt: string, data: any) => Promise<string>;
  gemini: (prompt: string, data: any) => Promise<string>;
  qwen: (prompt: string, data: any) => Promise<string>;
  llama: (prompt: string, data: any) => Promise<string>;
}

export class AutonomousTradingAgent {
  private agentCore = createFinancialAgentCore();
  private positions: Map<string, Position> = new Map();
  private activeStrategies: Map<string, TradingStrategy> = new Map();
  private tradingModels: AITradingModels;
  
  constructor(tradingModels: AITradingModels) {
    this.tradingModels = tradingModels;
    this.initializeTradingStrategies();
  }

  private initializeTradingStrategies(): void {
    // Momentum Strategy
    const momentumStrategy: TradingStrategy = {
      name: 'AI_Momentum_v1',
      type: 'momentum',
      timeframe: '15m',
      indicators: ['RSI', 'MACD', 'Volume', 'Price_Action'],
      entryConditions: [
        'RSI > 60 AND RSI < 80',
        'MACD crossover signal',
        'Volume > 1.5x average',
        'Price above MA20'
      ],
      exitConditions: [
        'RSI > 80 OR RSI < 40',
        'MACD bearish crossover',
        'Stop loss triggered',
        'Take profit reached'
      ],
      riskManagement: {
        stopLossPercentage: 2,
        takeProfitPercentage: 4,
        maxPositionSize: 0.1, // 10% of portfolio
        riskPerTrade: 0.02 // 2% risk per trade
      }
    };

    // Mean Reversion Strategy
    const meanReversionStrategy: TradingStrategy = {
      name: 'AI_MeanReversion_v1',
      type: 'mean_reversion',
      timeframe: '1h',
      indicators: ['RSI', 'Bollinger_Bands', 'Price_Action'],
      entryConditions: [
        'RSI < 30',
        'Price below lower Bollinger Band',
        'Recent oversold condition'
      ],
      exitConditions: [
        'RSI > 50',
        'Price above middle Bollinger Band',
        'Take profit reached'
      ],
      riskManagement: {
        stopLossPercentage: 3,
        takeProfitPercentage: 6,
        maxPositionSize: 0.15,
        riskPerTrade: 0.025
      }
    };

    this.activeStrategies.set(momentumStrategy.name, momentumStrategy);
    this.activeStrategies.set(meanReversionStrategy.name, meanReversionStrategy);
  }

  // Core Trading Agent Methods
  async analyzeMarket(symbol: string): Promise<MarketAnalysis> {
    // Get comprehensive market data
    const quoteData = await this.agentCore.getFinancialData({
      type: 'quote',
      symbols: [symbol],
      parameters: { includeAfterHours: true },
      realTime: true
    });

    const fundamentalData = await this.agentCore.getFinancialData({
      type: 'fundamental',
      symbols: [symbol],
      parameters: { yearsBack: 2 }
    });

    const newsData = await this.agentCore.getFinancialData({
      type: 'news',
      symbols: [symbol],
      parameters: { limit: 20 }
    });

    // Calculate technical indicators
    const technicalIndicators = await this.calculateTechnicalIndicators(symbol, quoteData);
    
    // Extract fundamental metrics
    const fundamentalMetrics = this.extractFundamentalMetrics(fundamentalData);
    
    // Analyze news sentiment using AI models
    const newsAnalysis = await this.analyzeNewsSentiment(newsData);
    
    // Calculate price targets using AI
    const priceTargets = await this.calculatePriceTargets(symbol, quoteData, fundamentalData);
    
    // Assess risk metrics
    const riskMetrics = await this.calculateRiskMetrics(symbol, quoteData);

    return {
      symbol,
      technicalIndicators,
      fundamentalMetrics,
      newssentiment: newsAnalysis,
      priceTargets,
      risk: riskMetrics,
      timestamp: new Date()
    };
  }

  async generateTradingSignal(symbol: string, strategy: string): Promise<TradingSignal> {
    const analysis = await this.analyzeMarket(symbol);
    const strategyConfig = this.activeStrategies.get(strategy);
    
    if (!strategyConfig) {
      throw new Error(`Strategy ${strategy} not found`);
    }

    // Use multiple AI models for consensus
    const aiPrompt = this.buildTradingPrompt(analysis, strategyConfig);
    
    const [claudeSignal, gptSignal, grokSignal] = await Promise.all([
      this.tradingModels.claude(aiPrompt, analysis),
      this.tradingModels.gpt(aiPrompt, analysis),
      this.tradingModels.grok(aiPrompt, analysis)
    ]);

    // Parse and aggregate AI responses
    const signals = [
      this.parseAISignal(claudeSignal),
      this.parseAISignal(gptSignal),
      this.parseAISignal(grokSignal)
    ];

    // Create consensus signal
    const consensusSignal = this.createConsensusSignal(symbol, signals, analysis, strategyConfig);
    
    // Validate against risk limits
    const riskValidation = this.validateTradingRisk(consensusSignal, strategyConfig);
    
    if (!riskValidation.valid) {
      consensusSignal.action = 'hold';
      consensusSignal.reasoning = `Risk validation failed: ${riskValidation.violations.join(', ')}`;
      consensusSignal.riskLevel = 'high';
    }

    return consensusSignal;
  }

  async executeTrade(signal: TradingSignal, agentId: string): Promise<Position | null> {
    if (signal.action === 'hold') {
      return null;
    }

    // Calculate position size based on risk management
    const positionSize = this.calculatePositionSize(signal);
    
    // Create position
    const position: Position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: signal.symbol,
      quantity: signal.action === 'buy' ? positionSize : -positionSize,
      entryPrice: signal.targetPrice || 0,
      currentPrice: signal.targetPrice || 0,
      entryTime: new Date(),
      unrealizedPnL: 0,
      stopLoss: signal.stopLoss,
      takeProfit: signal.targetPrice,
      strategy: 'AI_Generated',
      agentId
    };

    // Store position
    this.positions.set(position.id, position);

    // Record decision
    await this.agentCore.recordDecision({
      agentId,
      action: signal.action,
      symbol: signal.symbol,
      confidence: signal.confidence,
      reasoning: signal.reasoning,
      dataUsed: ['market_analysis', 'ai_models', 'risk_assessment'],
      risk: signal.riskLevel,
      executedAt: new Date()
    });

    return position;
  }

  async monitorPositions(agentId: string): Promise<void> {
    const agentPositions = Array.from(this.positions.values())
      .filter(pos => pos.agentId === agentId);

    for (const position of agentPositions) {
      // Get current price
      const currentData = await this.agentCore.getFinancialData({
        type: 'quote',
        symbols: [position.symbol],
        parameters: {},
        realTime: true
      });

      // Update position
      position.currentPrice = currentData.data?.[0]?.price || position.currentPrice;
      position.unrealizedPnL = (position.currentPrice - position.entryPrice) * position.quantity;

      // Check exit conditions
      const shouldExit = await this.checkExitConditions(position);
      
      if (shouldExit.exit) {
        await this.closePosition(position, shouldExit.reason);
      }
    }
  }

  // Technical Analysis Methods
  private async calculateTechnicalIndicators(symbol: string, priceData: any): Promise<any> {
    // Simplified technical indicators - in production, use proper TA libraries
    const prices = priceData.data || [];
    
    if (prices.length < 20) {
      throw new Error('Insufficient data for technical analysis');
    }

    const closePrices = prices.map((p: any) => p.close);
    const volumes = prices.map((p: any) => p.volume);

    return {
      rsi: this.calculateRSI(closePrices),
      movingAverage: {
        ma20: this.calculateMA(closePrices, 20),
        ma50: this.calculateMA(closePrices, 50),
        ma200: this.calculateMA(closePrices, 200)
      },
      macd: this.calculateMACD(closePrices),
      bollinger: this.calculateBollingerBands(closePrices),
      volume: {
        current: volumes[volumes.length - 1],
        average: this.calculateMA(volumes, 20),
        volumeRatio: volumes[volumes.length - 1] / this.calculateMA(volumes, 20)
      }
    };
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period) return 50;
    
    let gains = 0, losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }

  private calculateMA(values: number[], period: number): number {
    if (values.length < period) return 0;
    const sum = values.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateMACD(prices: number[]): { signal: number; histogram: number } {
    // Simplified MACD calculation
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    return {
      signal: macdLine,
      histogram: macdLine * 0.9 // Simplified
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[prices.length - period];
    
    for (let i = prices.length - period + 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number = 20): { upper: number; lower: number } {
    const ma = this.calculateMA(prices, period);
    const recentPrices = prices.slice(-period);
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: ma + (stdDev * 2),
      lower: ma - (stdDev * 2)
    };
  }

  // AI Integration Methods
  private buildTradingPrompt(analysis: MarketAnalysis, strategy: TradingStrategy): string {
    return `
You are an expert trading AI analyzing ${analysis.symbol}. Based on the following data, provide a trading signal:

TECHNICAL ANALYSIS:
- RSI: ${analysis.technicalIndicators.rsi}
- Moving Averages: MA20=${analysis.technicalIndicators.movingAverage.ma20}, MA50=${analysis.technicalIndicators.movingAverage.ma50}
- MACD Signal: ${analysis.technicalIndicators.macd.signal}
- Volume Ratio: ${analysis.technicalIndicators.volume.volumeRatio}

FUNDAMENTAL METRICS:
- P/E Ratio: ${analysis.fundamentalMetrics.pe}
- Revenue Growth: ${analysis.fundamentalMetrics.revenueGrowth}%
- Profit Margin: ${analysis.fundamentalMetrics.profitMargin}%

NEWS SENTIMENT: ${analysis.newssentiment.score} (${analysis.newssentiment.articles} articles)
Key Themes: ${analysis.newssentiment.keyThemes.join(', ')}

RISK METRICS:
- Volatility: ${analysis.risk.volatility}
- Beta: ${analysis.risk.beta}

STRATEGY: ${strategy.name} (${strategy.type})
Entry Conditions: ${strategy.entryConditions.join(', ')}
Risk Management: Stop Loss ${strategy.riskManagement.stopLossPercentage}%, Take Profit ${strategy.riskManagement.takeProfitPercentage}%

Provide your response in this JSON format:
{
  "action": "buy|sell|hold",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation",
  "targetPrice": number,
  "stopLoss": number,
  "riskLevel": "low|medium|high"
}
    `;
  }

  private parseAISignal(aiResponse: string): Partial<TradingSignal> {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Fallback to conservative signal
      return {
        action: 'hold',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
        riskLevel: 'high'
      };
    }
  }

  private createConsensusSignal(
    symbol: string,
    signals: Partial<TradingSignal>[],
    analysis: MarketAnalysis,
    strategy: TradingStrategy
  ): TradingSignal {
    // Calculate consensus
    const buyCount = signals.filter(s => s.action === 'buy').length;
    const sellCount = signals.filter(s => s.action === 'sell').length;
    const holdCount = signals.filter(s => s.action === 'hold').length;

    const avgConfidence = signals.reduce((sum, s) => sum + (s.confidence || 0), 0) / signals.length;
    
    let consensusAction: 'buy' | 'sell' | 'hold';
    if (buyCount > sellCount && buyCount > holdCount) {
      consensusAction = 'buy';
    } else if (sellCount > buyCount && sellCount > holdCount) {
      consensusAction = 'sell';
    } else {
      consensusAction = 'hold';
    }

    // Calculate position size based on strategy
    const basePositionSize = strategy.riskManagement.maxPositionSize;
    const adjustedSize = basePositionSize * avgConfidence;

    return {
      action: consensusAction,
      symbol,
      confidence: avgConfidence,
      reasoning: `Consensus from 3 AI models: ${buyCount} buy, ${sellCount} sell, ${holdCount} hold`,
      targetPrice: analysis.priceTargets.consensus,
      stopLoss: analysis.priceTargets.consensus * (1 - strategy.riskManagement.stopLossPercentage / 100),
      positionSize: adjustedSize,
      timeframe: strategy.timeframe,
      riskLevel: avgConfidence > 0.7 ? 'low' : avgConfidence > 0.4 ? 'medium' : 'high'
    };
  }

  // Risk Management Methods
  private validateTradingRisk(signal: TradingSignal, strategy: TradingStrategy): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check confidence threshold
    if (signal.confidence < 0.6) {
      violations.push('Confidence below minimum threshold (0.6)');
    }

    // Check position size limits
    if (signal.positionSize > strategy.riskManagement.maxPositionSize) {
      violations.push('Position size exceeds strategy limit');
    }

    // Check risk level
    if (signal.riskLevel === 'high' && signal.action !== 'hold') {
      violations.push('High risk signal not allowed');
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  private calculatePositionSize(signal: TradingSignal): number {
    // Kelly Criterion-inspired position sizing
    const winRate = 0.55; // Historical or estimated win rate
    const avgWin = 0.04;   // Average win percentage
    const avgLoss = 0.02;  // Average loss percentage
    
    const kellyPercent = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    const conservativeKelly = Math.min(kellyPercent * 0.5, signal.positionSize);
    
    return Math.max(conservativeKelly, 0.01); // Minimum 1%
  }

  private async checkExitConditions(position: Position): Promise<{ exit: boolean; reason: string }> {
    const currentPnLPercent = position.unrealizedPnL / (Math.abs(position.quantity) * position.entryPrice);
    
    // Stop loss check
    if (position.stopLoss) {
      const stopLossPercent = (position.entryPrice - position.stopLoss) / position.entryPrice;
      if (Math.abs(currentPnLPercent) >= stopLossPercent) {
        return { exit: true, reason: 'Stop loss triggered' };
      }
    }

    // Take profit check
    if (position.takeProfit) {
      const takeProfitPercent = (position.takeProfit - position.entryPrice) / position.entryPrice;
      if (currentPnLPercent >= takeProfitPercent) {
        return { exit: true, reason: 'Take profit reached' };
      }
    }

    // Time-based exit (24 hours max for day trading)
    const hoursOpen = (Date.now() - position.entryTime.getTime()) / (1000 * 60 * 60);
    if (hoursOpen > 24) {
      return { exit: true, reason: 'Maximum hold time reached' };
    }

    return { exit: false, reason: '' };
  }

  private async closePosition(position: Position, reason: string): Promise<void> {
    // Calculate final P&L
    position.realizedPnL = position.unrealizedPnL;
    position.unrealizedPnL = 0;

    // Remove from active positions
    this.positions.delete(position.id);

    // Log the closure
    console.log(`Position ${position.id} closed: ${reason}, P&L: ${position.realizedPnL}`);
  }

  // Helper methods
  private extractFundamentalMetrics(fundamentalData: any): any {
    const latest = fundamentalData.data?.[0] || {};
    return {
      pe: latest.pe_ratio || 0,
      eps: latest.earnings_per_share || 0,
      revenue: latest.total_revenue || 0,
      revenueGrowth: latest.revenue_growth_rate || 0,
      profitMargin: latest.profit_margin || 0,
      debtToEquity: latest.debt_to_equity || 0
    };
  }

  private async analyzeNewsSentiment(newsData: any): Promise<any> {
    const articles = newsData.data || [];
    if (articles.length === 0) {
      return { score: 0, articles: 0, keyThemes: [] };
    }

    // Simplified sentiment analysis - in production, use proper NLP models
    const sentiments = articles.map((article: any) => {
      const text = (article.title + ' ' + article.summary).toLowerCase();
      let score = 0;
      
      // Positive keywords
      const positiveWords = ['growth', 'profit', 'increase', 'strong', 'beat', 'exceed', 'positive', 'gain'];
      const negativeWords = ['loss', 'decline', 'decrease', 'weak', 'miss', 'fall', 'negative', 'drop'];
      
      positiveWords.forEach(word => {
        if (text.includes(word)) score += 0.1;
      });
      
      negativeWords.forEach(word => {
        if (text.includes(word)) score -= 0.1;
      });
      
      return Math.max(-1, Math.min(1, score));
    });

    const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    
    return {
      score: avgSentiment,
      articles: articles.length,
      keyThemes: ['earnings', 'growth', 'market'] // Simplified
    };
  }

  private async calculatePriceTargets(symbol: string, quoteData: any, fundamentalData: any): Promise<any> {
    const currentPrice = quoteData.data?.[0]?.price || 0;
    
    // Simplified price target calculation
    return {
      bullish: currentPrice * 1.15,
      bearish: currentPrice * 0.85,
      consensus: currentPrice * 1.05
    };
  }

  private async calculateRiskMetrics(symbol: string, priceData: any): Promise<any> {
    const prices = priceData.data?.map((d: any) => d.close) || [];
    
    if (prices.length < 30) {
      return { volatility: 0.2, beta: 1.0, maxDrawdown: 0.1, correlations: [] };
    }

    // Calculate volatility
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 252); // Annualized

    return {
      volatility,
      beta: 1.0, // Simplified - would need market data for proper calculation
      maxDrawdown: 0.15, // Simplified
      correlations: [] // Would require multiple symbols for calculation
    };
  }

  // Public interface methods
  getCurrentPositions(agentId: string): Position[] {
    return Array.from(this.positions.values())
      .filter(pos => pos.agentId === agentId);
  }

  getTradingStrategies(): TradingStrategy[] {
    return Array.from(this.activeStrategies.values());
  }

  async addCustomStrategy(strategy: TradingStrategy): Promise<void> {
    this.activeStrategies.set(strategy.name, strategy);
  }
}

// Create and export factory function
export function createAutonomousTradingAgent(models: AITradingModels): AutonomousTradingAgent {
  return new AutonomousTradingAgent(models);
}