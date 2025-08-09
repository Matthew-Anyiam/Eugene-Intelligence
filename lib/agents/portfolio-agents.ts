import { z } from 'zod';
import { createFinancialAgentCore, AgentConfig, AgentDecision, FinancialDataRequest } from './financial-agent-core';

// Portfolio-specific interfaces
export interface Portfolio {
  id: string;
  name: string;
  description: string;
  totalValue: number;
  totalCash: number;
  totalInvested: number;
  dailyPnL: number;
  totalReturn: number;
  totalReturnPercent: number;
  createdAt: Date;
  updatedAt: Date;
  positions: Position[];
  agentId: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  investmentObjective: 'income' | 'growth' | 'balanced';
}

export interface Position {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  totalReturn: number;
  totalReturnPercent: number;
  weight: number; // Portfolio weight percentage
  sector: string;
  firstPurchaseDate: Date;
  lastTradeDate: Date;
  dividendYield: number;
  annualDividends: number;
}

export interface PortfolioMetrics {
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortino: number;
    calmar: number;
    maxDrawdown: number;
    volatility: number;
    beta: number;
    alpha: number;
    informationRatio: number;
  };
  risk: {
    var95: number; // Value at Risk 95%
    var99: number; // Value at Risk 99%
    expectedShortfall: number;
    concentrationRisk: number;
    sectorRisk: number;
    correlationRisk: number;
  };
  attribution: {
    assetAllocation: number;
    stockSelection: number;
    interaction: number;
    total: number;
  };
  diversification: {
    effectiveNumberStocks: number;
    herfindahlIndex: number;
    sectorDiversification: Array<{
      sector: string;
      weight: number;
      contribution: number;
    }>;
  };
}

export interface RebalancingRecommendation {
  id: string;
  portfolioId: string;
  type: 'strategic' | 'tactical' | 'risk_driven' | 'opportunity_driven';
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  expectedImpact: {
    riskReduction: number;
    returnImprovement: number;
    costEstimate: number;
  };
  trades: Array<{
    action: 'buy' | 'sell' | 'trim' | 'add';
    symbol: string;
    currentWeight: number;
    targetWeight: number;
    shares: number;
    estimatedCost: number;
  }>;
  rationale: string;
  generatedAt: Date;
  agentId: string;
}

export interface PortfolioOptimization {
  id: string;
  portfolioId: string;
  objective: 'max_return' | 'min_risk' | 'max_sharpe' | 'target_risk' | 'target_return';
  constraints: {
    maxWeight: number;
    minWeight: number;
    sectorLimits: Record<string, number>;
    excludeSymbols: string[];
    includeSymbols: string[];
    turnoverLimit: number;
  };
  currentAllocation: Record<string, number>;
  optimizedAllocation: Record<string, number>;
  expectedResults: {
    expectedReturn: number;
    expectedRisk: number;
    sharpeRatio: number;
    diversificationRatio: number;
  };
  trades: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    shares: number;
    weight: number;
  }>;
  confidenceScore: number;
  generatedAt: Date;
}

// AI Models Integration for Portfolio Management
export interface AIPortfolioModels {
  claude: (prompt: string, data: any) => Promise<string>;
  gpt: (prompt: string, data: any) => Promise<string>;
  grok: (prompt: string, data: any) => Promise<string>;
  gemini: (prompt: string, data: any) => Promise<string>;
  qwen: (prompt: string, data: any) => Promise<string>;
  llama: (prompt: string, data: any) => Promise<string>;
}

export class AutonomousPortfolioAgent {
  private agentCore = createFinancialAgentCore();
  private portfolios: Map<string, Portfolio> = new Map();
  private portfolioMetrics: Map<string, PortfolioMetrics> = new Map();
  private rebalancingRecommendations: Map<string, RebalancingRecommendation[]> = new Map();
  private optimizations: Map<string, PortfolioOptimization> = new Map();
  private portfolioModels: AIPortfolioModels;
  private benchmarkData: Map<string, any> = new Map();
  
  constructor(portfolioModels: AIPortfolioModels) {
    this.portfolioModels = portfolioModels;
    this.initializeBenchmarks();
  }

  private initializeBenchmarks(): void {
    // Initialize common benchmarks for performance comparison
    const benchmarks = ['SPY', 'QQQ', 'VTI', 'VXUS', 'AGG', 'VNQ'];
    benchmarks.forEach(benchmark => {
      this.benchmarkData.set(benchmark, { symbol: benchmark, data: [] });
    });
  }

  // Core Portfolio Management Methods
  async createPortfolio(config: {
    name: string;
    description: string;
    initialCash: number;
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    investmentObjective: 'income' | 'growth' | 'balanced';
    agentId: string;
  }): Promise<Portfolio> {
    const portfolio: Portfolio = {
      id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: config.description,
      totalValue: config.initialCash,
      totalCash: config.initialCash,
      totalInvested: 0,
      dailyPnL: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      positions: [],
      agentId: config.agentId,
      riskProfile: config.riskProfile,
      investmentObjective: config.investmentObjective
    };

    this.portfolios.set(portfolio.id, portfolio);
    
    // Initialize empty metrics
    await this.calculatePortfolioMetrics(portfolio.id);
    
    return portfolio;
  }

  async analyzePortfolio(portfolioId: string): Promise<{
    portfolio: Portfolio;
    metrics: PortfolioMetrics;
    analysis: string;
    recommendations: string[];
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Update portfolio with latest prices
    await this.updatePortfolioPrices(portfolioId);
    
    // Calculate comprehensive metrics
    const metrics = await this.calculatePortfolioMetrics(portfolioId);
    
    // Generate AI-powered analysis
    const analysisPrompt = this.buildPortfolioAnalysisPrompt(portfolio, metrics);
    
    const [claudeAnalysis, gptAnalysis] = await Promise.all([
      this.portfolioModels.claude(analysisPrompt, { portfolio, metrics }),
      this.portfolioModels.gpt(analysisPrompt, { portfolio, metrics })
    ]);

    const combinedAnalysis = this.combineAnalyses([claudeAnalysis, gptAnalysis]);
    
    return {
      portfolio,
      metrics,
      analysis: combinedAnalysis.analysis,
      recommendations: combinedAnalysis.recommendations
    };
  }

  async optimizePortfolio(
    portfolioId: string,
    objective: 'max_return' | 'min_risk' | 'max_sharpe' | 'target_risk' | 'target_return',
    constraints: Partial<PortfolioOptimization['constraints']> = {}
  ): Promise<PortfolioOptimization> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Get current allocation
    const currentAllocation = this.getCurrentAllocation(portfolio);
    
    // Prepare optimization data
    const optimizationData = await this.prepareOptimizationData(portfolio, objective);
    
    // Use AI models for portfolio optimization
    const optimizationPrompt = this.buildOptimizationPrompt(
      portfolio,
      objective,
      constraints,
      optimizationData
    );

    const [claudeOpt, gptOpt, geminiOpt] = await Promise.all([
      this.portfolioModels.claude(optimizationPrompt, optimizationData),
      this.portfolioModels.gpt(optimizationPrompt, optimizationData),
      this.portfolioModels.gemini(optimizationPrompt, optimizationData)
    ]);

    // Combine optimization results
    const optimization = this.combineOptimizations(
      portfolioId,
      objective,
      currentAllocation,
      [claudeOpt, gptOpt, geminiOpt],
      constraints
    );

    this.optimizations.set(optimization.id, optimization);
    
    return optimization;
  }

  async generateRebalancingRecommendations(
    portfolioId: string,
    triggers: {
      driftThreshold: number;
      timeThreshold: number; // days
      riskThreshold: number;
      opportunityThreshold: number;
    } = {
      driftThreshold: 0.05, // 5%
      timeThreshold: 30, // 30 days
      riskThreshold: 0.1, // 10%
      opportunityThreshold: 0.15 // 15%
    }
  ): Promise<RebalancingRecommendation[]> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    const recommendations: RebalancingRecommendation[] = [];
    const metrics = await this.calculatePortfolioMetrics(portfolioId);
    
    // Check for strategic rebalancing (target allocation drift)
    const strategicRebalancing = await this.checkStrategicRebalancing(
      portfolio,
      metrics,
      triggers.driftThreshold
    );
    if (strategicRebalancing) {
      recommendations.push(strategicRebalancing);
    }

    // Check for tactical rebalancing (market opportunities)
    const tacticalRebalancing = await this.checkTacticalRebalancing(
      portfolio,
      metrics,
      triggers.opportunityThreshold
    );
    if (tacticalRebalancing) {
      recommendations.push(tacticalRebalancing);
    }

    // Check for risk-driven rebalancing
    const riskRebalancing = await this.checkRiskDrivenRebalancing(
      portfolio,
      metrics,
      triggers.riskThreshold
    );
    if (riskRebalancing) {
      recommendations.push(riskRebalancing);
    }

    // Store recommendations
    this.rebalancingRecommendations.set(portfolioId, recommendations);
    
    return recommendations;
  }

  async executeRebalancing(
    portfolioId: string,
    recommendationId: string,
    agentId: string
  ): Promise<{
    success: boolean;
    executedTrades: Array<{
      symbol: string;
      action: 'buy' | 'sell';
      shares: number;
      price: number;
      value: number;
      timestamp: Date;
    }>;
    errors: string[];
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    const recommendations = this.rebalancingRecommendations.get(portfolioId) || [];
    const recommendation = recommendations.find(r => r.id === recommendationId);
    
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    const executedTrades = [];
    const errors = [];

    // Execute each trade in the recommendation
    for (const trade of recommendation.trades) {
      try {
        const currentPrice = await this.getCurrentPrice(trade.symbol);
        
        // Update portfolio based on trade
        if (trade.action === 'buy' || trade.action === 'add') {
          await this.addPosition(portfolioId, trade.symbol, trade.shares, currentPrice);
        } else if (trade.action === 'sell' || trade.action === 'trim') {
          await this.reducePosition(portfolioId, trade.symbol, trade.shares, currentPrice);
        }

        executedTrades.push({
          symbol: trade.symbol,
          action: trade.action === 'add' ? 'buy' : trade.action === 'trim' ? 'sell' : trade.action,
          shares: trade.shares,
          price: currentPrice,
          value: trade.shares * currentPrice,
          timestamp: new Date()
        });

        // Record decision
        await this.agentCore.recordDecision({
          agentId,
          action: trade.action === 'buy' || trade.action === 'add' ? 'buy' : 'sell',
          symbol: trade.symbol,
          confidence: recommendation.expectedImpact.riskReduction + recommendation.expectedImpact.returnImprovement,
          reasoning: `Rebalancing: ${recommendation.reason}`,
          dataUsed: ['portfolio_analysis', 'risk_metrics', 'optimization_model'],
          risk: recommendation.urgency === 'high' ? 'high' : recommendation.urgency === 'medium' ? 'medium' : 'low',
          executedAt: new Date()
        });

      } catch (error) {
        errors.push(`Failed to execute ${trade.action} ${trade.shares} shares of ${trade.symbol}: ${error}`);
      }
    }

    // Update portfolio
    await this.updatePortfolioPrices(portfolioId);
    
    return {
      success: errors.length === 0,
      executedTrades,
      errors
    };
  }

  async monitorPortfolioRisk(portfolioId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    alerts: Array<{
      type: 'concentration' | 'volatility' | 'drawdown' | 'correlation' | 'liquidity';
      severity: 'warning' | 'critical';
      message: string;
      metric: number;
      threshold: number;
      recommendation: string;
    }>;
    metrics: PortfolioMetrics['risk'];
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    const metrics = await this.calculatePortfolioMetrics(portfolioId);
    const alerts = [];
    let overallRiskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';

    // Check concentration risk
    const maxWeight = Math.max(...portfolio.positions.map(p => p.weight));
    if (maxWeight > 25) {
      alerts.push({
        type: 'concentration' as const,
        severity: 'critical' as const,
        message: `High concentration risk: Single position represents ${maxWeight.toFixed(1)}% of portfolio`,
        metric: maxWeight,
        threshold: 25,
        recommendation: 'Consider reducing position size or diversifying holdings'
      });
      overallRiskLevel = 'extreme';
    } else if (maxWeight > 15) {
      alerts.push({
        type: 'concentration' as const,
        severity: 'warning' as const,
        message: `Moderate concentration risk: Single position represents ${maxWeight.toFixed(1)}% of portfolio`,
        metric: maxWeight,
        threshold: 15,
        recommendation: 'Monitor position size and consider gradual reduction'
      });
      if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
    }

    // Check volatility risk
    if (metrics.performance.volatility > 25) {
      alerts.push({
        type: 'volatility' as const,
        severity: 'critical' as const,
        message: `High portfolio volatility: ${metrics.performance.volatility.toFixed(1)}%`,
        metric: metrics.performance.volatility,
        threshold: 25,
        recommendation: 'Add defensive positions or reduce equity allocation'
      });
      if (overallRiskLevel !== 'extreme') overallRiskLevel = 'high';
    } else if (metrics.performance.volatility > 18) {
      alerts.push({
        type: 'volatility' as const,
        severity: 'warning' as const,
        message: `Elevated portfolio volatility: ${metrics.performance.volatility.toFixed(1)}%`,
        metric: metrics.performance.volatility,
        threshold: 18,
        recommendation: 'Monitor risk exposure and consider risk reduction'
      });
      if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
    }

    // Check drawdown risk
    if (metrics.performance.maxDrawdown > 20) {
      alerts.push({
        type: 'drawdown' as const,
        severity: 'critical' as const,
        message: `Large maximum drawdown: ${metrics.performance.maxDrawdown.toFixed(1)}%`,
        metric: metrics.performance.maxDrawdown,
        threshold: 20,
        recommendation: 'Review risk management and stop-loss procedures'
      });
      if (overallRiskLevel !== 'extreme') overallRiskLevel = 'high';
    }

    // Check VaR limits
    if (metrics.risk.var95 > 5) {
      alerts.push({
        type: 'volatility' as const,
        severity: 'warning' as const,
        message: `High Value at Risk: ${metrics.risk.var95.toFixed(1)}% potential loss`,
        metric: metrics.risk.var95,
        threshold: 5,
        recommendation: 'Consider reducing portfolio risk or adding hedging'
      });
      if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
    }

    return {
      riskLevel: overallRiskLevel,
      alerts,
      metrics: metrics.risk
    };
  }

  // Portfolio Calculation Methods
  private async updatePortfolioPrices(portfolioId: string): Promise<void> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio || portfolio.positions.length === 0) return;

    const symbols = portfolio.positions.map(p => p.symbol);
    
    try {
      const quoteData = await this.agentCore.getFinancialData({
        type: 'quote',
        symbols,
        parameters: { includeAfterHours: true },
        realTime: true
      });

      const quotes = quoteData.data || [];
      
      // Update positions with current prices
      portfolio.positions.forEach(position => {
        const quote = quotes.find((q: any) => q.symbol === position.symbol);
        if (quote) {
          const oldMarketValue = position.marketValue;
          position.currentPrice = quote.price;
          position.marketValue = position.quantity * quote.price;
          position.unrealizedPnL = position.marketValue - (position.quantity * position.averageCost);
          position.unrealizedPnLPercent = (position.unrealizedPnL / (position.quantity * position.averageCost)) * 100;
          position.totalReturn = position.unrealizedPnL + position.realizedPnL;
          position.totalReturnPercent = (position.totalReturn / (position.quantity * position.averageCost)) * 100;
          position.weight = (position.marketValue / portfolio.totalValue) * 100;
          
          // Update daily P&L
          portfolio.dailyPnL += (position.marketValue - oldMarketValue);
        }
      });

      // Recalculate portfolio totals
      portfolio.totalInvested = portfolio.positions.reduce((sum, pos) => sum + (pos.quantity * pos.averageCost), 0);
      const totalMarketValue = portfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
      portfolio.totalValue = totalMarketValue + portfolio.totalCash;
      portfolio.totalReturn = portfolio.positions.reduce((sum, pos) => sum + pos.totalReturn, 0);
      portfolio.totalReturnPercent = portfolio.totalInvested > 0 ? (portfolio.totalReturn / portfolio.totalInvested) * 100 : 0;
      portfolio.updatedAt = new Date();

      this.portfolios.set(portfolioId, portfolio);
    } catch (error) {
      console.error(`Error updating portfolio prices for ${portfolioId}:`, error);
    }
  }

  private async calculatePortfolioMetrics(portfolioId: string): Promise<PortfolioMetrics> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Calculate performance metrics
    const performance = await this.calculatePerformanceMetrics(portfolio);
    
    // Calculate risk metrics
    const risk = await this.calculateRiskMetrics(portfolio);
    
    // Calculate attribution
    const attribution = await this.calculatePerformanceAttribution(portfolio);
    
    // Calculate diversification metrics
    const diversification = await this.calculateDiversificationMetrics(portfolio);

    const metrics: PortfolioMetrics = {
      performance,
      risk,
      attribution,
      diversification
    };

    this.portfolioMetrics.set(portfolioId, metrics);
    return metrics;
  }

  private async calculatePerformanceMetrics(portfolio: Portfolio): Promise<PortfolioMetrics['performance']> {
    // Simplified performance calculations - in production, use proper time series analysis
    const totalReturn = portfolio.totalReturnPercent / 100;
    const annualizedReturn = totalReturn; // Simplified - would need time series for proper calculation
    
    // Mock calculations for demonstration
    return {
      totalReturn: totalReturn,
      annualizedReturn: annualizedReturn,
      sharpeRatio: Math.max(0, annualizedReturn / 0.15), // Assuming 15% volatility
      sortino: Math.max(0, annualizedReturn / 0.10), // Assuming 10% downside deviation
      calmar: Math.max(0, annualizedReturn / 0.08), // Assuming 8% max drawdown
      maxDrawdown: Math.min(0, totalReturn - 0.08), // Simplified calculation
      volatility: 15 + Math.random() * 10, // Mock volatility 15-25%
      beta: 0.8 + Math.random() * 0.4, // Mock beta 0.8-1.2
      alpha: annualizedReturn - 0.08, // Assuming 8% benchmark return
      informationRatio: annualizedReturn / 0.05 // Assuming 5% tracking error
    };
  }

  private async calculateRiskMetrics(portfolio: Portfolio): Promise<PortfolioMetrics['risk']> {
    const portfolioValue = portfolio.totalValue;
    
    return {
      var95: portfolioValue * 0.02, // 2% VaR
      var99: portfolioValue * 0.04, // 4% VaR
      expectedShortfall: portfolioValue * 0.06, // 6% Expected Shortfall
      concentrationRisk: Math.max(...portfolio.positions.map(p => p.weight)) / 100,
      sectorRisk: this.calculateSectorRisk(portfolio),
      correlationRisk: 0.6 // Mock correlation risk
    };
  }

  private async calculatePerformanceAttribution(portfolio: Portfolio): Promise<PortfolioMetrics['attribution']> {
    // Simplified attribution analysis
    const totalReturn = portfolio.totalReturnPercent / 100;
    
    return {
      assetAllocation: totalReturn * 0.4, // 40% from asset allocation
      stockSelection: totalReturn * 0.5, // 50% from stock selection
      interaction: totalReturn * 0.1, // 10% from interaction
      total: totalReturn
    };
  }

  private async calculateDiversificationMetrics(portfolio: Portfolio): Promise<PortfolioMetrics['diversification']> {
    const positions = portfolio.positions;
    const weights = positions.map(p => p.weight / 100);
    
    // Calculate Herfindahl Index
    const herfindahlIndex = weights.reduce((sum, weight) => sum + weight * weight, 0);
    
    // Calculate Effective Number of Stocks
    const effectiveNumberStocks = 1 / herfindahlIndex;
    
    // Calculate sector diversification
    const sectorWeights = this.calculateSectorWeights(portfolio);
    const sectorDiversification = Object.entries(sectorWeights).map(([sector, weight]) => ({
      sector,
      weight,
      contribution: weight * portfolio.totalReturnPercent / 100
    }));

    return {
      effectiveNumberStocks,
      herfindahlIndex,
      sectorDiversification
    };
  }

  // Helper Methods
  private calculateSectorRisk(portfolio: Portfolio): number {
    const sectorWeights = this.calculateSectorWeights(portfolio);
    const maxSectorWeight = Math.max(...Object.values(sectorWeights));
    return maxSectorWeight;
  }

  private calculateSectorWeights(portfolio: Portfolio): Record<string, number> {
    const sectorWeights: Record<string, number> = {};
    
    portfolio.positions.forEach(position => {
      const sector = position.sector || 'Unknown';
      sectorWeights[sector] = (sectorWeights[sector] || 0) + position.weight;
    });
    
    return sectorWeights;
  }

  private getCurrentAllocation(portfolio: Portfolio): Record<string, number> {
    const allocation: Record<string, number> = {};
    
    portfolio.positions.forEach(position => {
      allocation[position.symbol] = position.weight / 100;
    });
    
    return allocation;
  }

  private async prepareOptimizationData(
    portfolio: Portfolio,
    objective: string
  ): Promise<any> {
    const symbols = portfolio.positions.map(p => p.symbol);
    
    // Get historical data for optimization
    const historicalData = await Promise.all(
      symbols.map(async symbol => {
        try {
          const data = await this.agentCore.getFinancialData({
            type: 'quote',
            symbols: [symbol],
            parameters: { 
              start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end_date: new Date().toISOString().split('T')[0]
            }
          });
          return { symbol, data: data.data || [] };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return { symbol, data: [] };
        }
      })
    );

    return {
      symbols,
      currentWeights: this.getCurrentAllocation(portfolio),
      historicalData,
      objective,
      portfolioValue: portfolio.totalValue,
      riskProfile: portfolio.riskProfile,
      investmentObjective: portfolio.investmentObjective
    };
  }

  private buildPortfolioAnalysisPrompt(portfolio: Portfolio, metrics: PortfolioMetrics): string {
    return `
    Analyze this portfolio and provide insights:

    PORTFOLIO OVERVIEW:
    - Name: ${portfolio.name}
    - Total Value: $${portfolio.totalValue.toLocaleString()}
    - Total Return: ${portfolio.totalReturnPercent.toFixed(2)}%
    - Risk Profile: ${portfolio.riskProfile}
    - Investment Objective: ${portfolio.investmentObjective}
    - Number of Positions: ${portfolio.positions.length}

    PERFORMANCE METRICS:
    - Annualized Return: ${metrics.performance.annualizedReturn.toFixed(2)}%
    - Sharpe Ratio: ${metrics.performance.sharpeRatio.toFixed(2)}
    - Max Drawdown: ${metrics.performance.maxDrawdown.toFixed(2)}%
    - Volatility: ${metrics.performance.volatility.toFixed(2)}%
    - Beta: ${metrics.performance.beta.toFixed(2)}

    RISK METRICS:
    - VaR (95%): ${metrics.risk.var95.toFixed(0)}
    - Concentration Risk: ${(metrics.risk.concentrationRisk * 100).toFixed(1)}%
    - Sector Risk: ${(metrics.risk.sectorRisk).toFixed(1)}%

    TOP POSITIONS:
    ${portfolio.positions
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(p => `- ${p.symbol}: ${p.weight.toFixed(1)}% (${p.unrealizedPnLPercent.toFixed(1)}% return)`)
      .join('\n')}

    Provide analysis in this JSON format:
    {
      "analysis": "comprehensive portfolio analysis",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "recommendations": ["rec 1", "rec 2", "rec 3"],
      "riskAssessment": "risk analysis",
      "performanceAssessment": "performance analysis"
    }
    `;
  }

  private buildOptimizationPrompt(
    portfolio: Portfolio,
    objective: string,
    constraints: any,
    optimizationData: any
  ): string {
    return `
    Optimize this portfolio for objective: ${objective}

    CURRENT PORTFOLIO:
    ${Object.entries(optimizationData.currentWeights)
      .map(([symbol, weight]) => `${symbol}: ${(weight * 100).toFixed(1)}%`)
      .join(', ')}

    CONSTRAINTS:
    - Max Weight per Position: ${constraints.maxWeight || 25}%
    - Min Weight per Position: ${constraints.minWeight || 1}%
    - Risk Profile: ${portfolio.riskProfile}
    - Investment Objective: ${portfolio.investmentObjective}

    Provide optimized allocation in this JSON format:
    {
      "optimizedWeights": {"SYMBOL": weight},
      "expectedReturn": number,
      "expectedRisk": number,
      "rationale": "optimization reasoning",
      "trades": [{"symbol": "SYMBOL", "action": "buy|sell", "weight": number}]
    }
    `;
  }

  private combineAnalyses(analyses: string[]): { analysis: string; recommendations: string[] } {
    // Combine multiple AI analyses
    try {
      const parsedAnalyses = analyses.map(analysis => {
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }).filter(Boolean);

      if (parsedAnalyses.length === 0) {
        return {
          analysis: 'Unable to parse AI analysis',
          recommendations: ['Review portfolio manually']
        };
      }

      // Combine analyses
      const combinedAnalysis = parsedAnalyses[0].analysis || 'Portfolio analysis completed';
      const allRecommendations = parsedAnalyses.flatMap(a => a.recommendations || []);
      const uniqueRecommendations = [...new Set(allRecommendations)];

      return {
        analysis: combinedAnalysis,
        recommendations: uniqueRecommendations.slice(0, 5) // Top 5 recommendations
      };
    } catch (error) {
      return {
        analysis: 'Error processing AI analysis',
        recommendations: ['Manual review recommended']
      };
    }
  }

  private combineOptimizations(
    portfolioId: string,
    objective: string,
    currentAllocation: Record<string, number>,
    optimizations: string[],
    constraints: any
  ): PortfolioOptimization {
    // Combine multiple AI optimization results
    const parsedOptimizations = optimizations.map(opt => {
      try {
        const jsonMatch = opt.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (parsedOptimizations.length === 0) {
      // Fallback to current allocation
      return {
        id: `opt_${Date.now()}`,
        portfolioId,
        objective,
        constraints: {
          maxWeight: 25,
          minWeight: 1,
          sectorLimits: {},
          excludeSymbols: [],
          includeSymbols: [],
          turnoverLimit: 0.5,
          ...constraints
        },
        currentAllocation,
        optimizedAllocation: currentAllocation,
        expectedResults: {
          expectedReturn: 0.08,
          expectedRisk: 0.15,
          sharpeRatio: 0.53,
          diversificationRatio: 1.2
        },
        trades: [],
        confidenceScore: 0.3,
        generatedAt: new Date()
      };
    }

    // Average the optimizations
    const avgOptimization = parsedOptimizations[0];
    
    return {
      id: `opt_${Date.now()}`,
      portfolioId,
      objective,
      constraints: {
        maxWeight: 25,
        minWeight: 1,
        sectorLimits: {},
        excludeSymbols: [],
        includeSymbols: [],
        turnoverLimit: 0.5,
        ...constraints
      },
      currentAllocation,
      optimizedAllocation: avgOptimization.optimizedWeights || currentAllocation,
      expectedResults: {
        expectedReturn: avgOptimization.expectedReturn || 0.08,
        expectedRisk: avgOptimization.expectedRisk || 0.15,
        sharpeRatio: (avgOptimization.expectedReturn || 0.08) / (avgOptimization.expectedRisk || 0.15),
        diversificationRatio: 1.2
      },
      trades: avgOptimization.trades || [],
      confidenceScore: 0.7,
      generatedAt: new Date()
    };
  }

  // Rebalancing Methods
  private async checkStrategicRebalancing(
    portfolio: Portfolio,
    metrics: PortfolioMetrics,
    driftThreshold: number
  ): Promise<RebalancingRecommendation | null> {
    // Check if any position has drifted significantly from target
    const significantDrifts = portfolio.positions.filter(pos => {
      const targetWeight = 100 / portfolio.positions.length; // Equal weight target
      const drift = Math.abs(pos.weight - targetWeight) / targetWeight;
      return drift > driftThreshold;
    });

    if (significantDrifts.length === 0) return null;

    const trades = significantDrifts.map(pos => {
      const targetWeight = 100 / portfolio.positions.length;
      const weightDiff = pos.weight - targetWeight;
      const action = weightDiff > 0 ? 'trim' : 'add';
      const targetShares = (portfolio.totalValue * targetWeight / 100) / pos.currentPrice;
      const shareDiff = Math.abs(pos.quantity - targetShares);

      return {
        action: action as 'buy' | 'sell' | 'trim' | 'add',
        symbol: pos.symbol,
        currentWeight: pos.weight,
        targetWeight: targetWeight,
        shares: Math.floor(shareDiff),
        estimatedCost: shareDiff * pos.currentPrice
      };
    });

    return {
      id: `rebal_strategic_${Date.now()}`,
      portfolioId: portfolio.id,
      type: 'strategic',
      reason: 'Position weights have drifted from target allocation',
      urgency: 'medium',
      expectedImpact: {
        riskReduction: 0.05,
        returnImprovement: 0.02,
        costEstimate: trades.reduce((sum, trade) => sum + trade.estimatedCost, 0)
      },
      trades,
      rationale: `${trades.length} positions have drifted beyond ${(driftThreshold * 100).toFixed(0)}% threshold`,
      generatedAt: new Date(),
      agentId: portfolio.agentId
    };
  }

  private async checkTacticalRebalancing(
    portfolio: Portfolio,
    metrics: PortfolioMetrics,
    opportunityThreshold: number
  ): Promise<RebalancingRecommendation | null> {
    // Simplified tactical rebalancing based on performance
    const underperformers = portfolio.positions.filter(pos => 
      pos.totalReturnPercent < -opportunityThreshold * 100
    );
    
    if (underperformers.length === 0) return null;

    const trades = underperformers.map(pos => ({
      action: 'sell' as const,
      symbol: pos.symbol,
      currentWeight: pos.weight,
      targetWeight: pos.weight * 0.5, // Reduce by 50%
      shares: Math.floor(pos.quantity * 0.5),
      estimatedCost: pos.quantity * 0.5 * pos.currentPrice
    }));

    return {
      id: `rebal_tactical_${Date.now()}`,
      portfolioId: portfolio.id,
      type: 'tactical',
      reason: 'Underperforming positions identified for tactical rebalancing',
      urgency: 'low',
      expectedImpact: {
        riskReduction: 0.03,
        returnImprovement: 0.08,
        costEstimate: trades.reduce((sum, trade) => sum + trade.estimatedCost, 0)
      },
      trades,
      rationale: `${trades.length} positions underperforming by more than ${(opportunityThreshold * 100).toFixed(0)}%`,
      generatedAt: new Date(),
      agentId: portfolio.agentId
    };
  }

  private async checkRiskDrivenRebalancing(
    portfolio: Portfolio,
    metrics: PortfolioMetrics,
    riskThreshold: number
  ): Promise<RebalancingRecommendation | null> {
    // Check if portfolio risk exceeds threshold
    if (metrics.risk.concentrationRisk < riskThreshold) return null;

    const overconcentratedPositions = portfolio.positions.filter(pos => 
      pos.weight > riskThreshold * 100
    );

    const trades = overconcentratedPositions.map(pos => ({
      action: 'trim' as const,
      symbol: pos.symbol,
      currentWeight: pos.weight,
      targetWeight: riskThreshold * 100,
      shares: Math.floor(pos.quantity * (1 - riskThreshold * 100 / pos.weight)),
      estimatedCost: pos.quantity * (1 - riskThreshold * 100 / pos.weight) * pos.currentPrice
    }));

    return {
      id: `rebal_risk_${Date.now()}`,
      portfolioId: portfolio.id,
      type: 'risk_driven',
      reason: 'High concentration risk requires rebalancing',
      urgency: 'high',
      expectedImpact: {
        riskReduction: 0.15,
        returnImprovement: -0.02,
        costEstimate: trades.reduce((sum, trade) => sum + trade.estimatedCost, 0)
      },
      trades,
      rationale: `Concentration risk of ${(metrics.risk.concentrationRisk * 100).toFixed(1)}% exceeds ${(riskThreshold * 100).toFixed(0)}% threshold`,
      generatedAt: new Date(),
      agentId: portfolio.agentId
    };
  }

  // Position Management Methods
  private async addPosition(
    portfolioId: string,
    symbol: string,
    shares: number,
    price: number
  ): Promise<void> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    const existingPosition = portfolio.positions.find(p => p.symbol === symbol);
    
    if (existingPosition) {
      // Add to existing position
      const totalShares = existingPosition.quantity + shares;
      const totalCost = (existingPosition.quantity * existingPosition.averageCost) + (shares * price);
      existingPosition.averageCost = totalCost / totalShares;
      existingPosition.quantity = totalShares;
      existingPosition.marketValue = totalShares * price;
      existingPosition.lastTradeDate = new Date();
    } else {
      // Create new position
      const newPosition: Position = {
        id: `pos_${Date.now()}_${symbol}`,
        symbol,
        companyName: symbol, // Would fetch from API in production
        quantity: shares,
        averageCost: price,
        currentPrice: price,
        marketValue: shares * price,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        realizedPnL: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        weight: 0,
        sector: 'Unknown', // Would fetch from API in production
        firstPurchaseDate: new Date(),
        lastTradeDate: new Date(),
        dividendYield: 0,
        annualDividends: 0
      };
      
      portfolio.positions.push(newPosition);
    }

    // Update portfolio cash
    portfolio.totalCash -= shares * price;
    this.portfolios.set(portfolioId, portfolio);
  }

  private async reducePosition(
    portfolioId: string,
    symbol: string,
    shares: number,
    price: number
  ): Promise<void> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    const position = portfolio.positions.find(p => p.symbol === symbol);
    if (!position || position.quantity < shares) return;

    // Calculate realized P&L
    const realizedPnL = (price - position.averageCost) * shares;
    position.realizedPnL += realizedPnL;
    
    // Update position
    position.quantity -= shares;
    position.marketValue = position.quantity * price;
    position.lastTradeDate = new Date();

    // Remove position if fully sold
    if (position.quantity === 0) {
      portfolio.positions = portfolio.positions.filter(p => p.symbol !== symbol);
    }

    // Update portfolio cash
    portfolio.totalCash += shares * price;
    this.portfolios.set(portfolioId, portfolio);
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const quoteData = await this.agentCore.getFinancialData({
        type: 'quote',
        symbols: [symbol],
        parameters: {},
        realTime: true
      });
      
      return quoteData.data?.[0]?.price || 0;
    } catch (error) {
      console.error(`Error getting current price for ${symbol}:`, error);
      return 0;
    }
  }

  // Public Interface Methods
  getPortfolio(portfolioId: string): Portfolio | undefined {
    return this.portfolios.get(portfolioId);
  }

  getAllPortfolios(agentId?: string): Portfolio[] {
    const portfolios = Array.from(this.portfolios.values());
    return agentId ? portfolios.filter(p => p.agentId === agentId) : portfolios;
  }

  getPortfolioMetrics(portfolioId: string): PortfolioMetrics | undefined {
    return this.portfolioMetrics.get(portfolioId);
  }

  getRebalancingRecommendations(portfolioId: string): RebalancingRecommendation[] {
    return this.rebalancingRecommendations.get(portfolioId) || [];
  }

  getOptimization(optimizationId: string): PortfolioOptimization | undefined {
    return this.optimizations.get(optimizationId);
  }

  async deletePortfolio(portfolioId: string): Promise<void> {
    this.portfolios.delete(portfolioId);
    this.portfolioMetrics.delete(portfolioId);
    this.rebalancingRecommendations.delete(portfolioId);
  }
}

// Factory function
export function createAutonomousPortfolioAgent(models: AIPortfolioModels): AutonomousPortfolioAgent {
  return new AutonomousPortfolioAgent(models);
}