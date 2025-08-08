import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import { createPolygonClient } from '@/lib/financial/polygon-client';

export interface PortfolioPosition {
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  weight: number;
  sector: string;
  beta: number;
  dailyReturn: number;
  ytdReturn: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dailyPnL: number;
  ytdPnL: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  var95: number; // Value at Risk 95%
  expectedShortfall: number;
  trackingError?: number;
  informationRatio?: number;
}

export interface RiskMetrics {
  portfolioVaR: number;
  componentVaR: { [symbol: string]: number };
  marginalVaR: { [symbol: string]: number };
  correlationMatrix: { [key: string]: { [key: string]: number } };
  betaToMarket: { [symbol: string]: number };
  sectorsExposure: { [sector: string]: number };
  concentrationRisk: number;
  liquidityRisk: number;
}

export interface PerformanceAttribution {
  totalReturn: number;
  benchmarkReturn: number;
  activeReturn: number;
  allocation: {
    sectors: { [sector: string]: { allocation: number; benchmark: number; effect: number } };
    securities: { [symbol: string]: { allocation: number; return: number; contribution: number } };
  };
  selection: {
    total: number;
    bySector: { [sector: string]: number };
  };
  interaction: number;
}

export interface MonteCarloScenario {
  probability: number;
  portfolioReturn: number;
  worstCase: number;
  bestCase: number;
  scenarios: Array<{
    return: number;
    probability: number;
    description: string;
  }>;
}

export interface StressTest {
  name: string;
  scenario: string;
  portfolioImpact: number;
  positionImpacts: { [symbol: string]: number };
  riskMetricsChange: {
    varChange: number;
    volatilityChange: number;
    correlationShift: number;
  };
}

export interface TechnicalIndicators {
  symbol: string;
  sma20: number;
  sma50: number;
  sma200: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  support: number[];
  resistance: number[];
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 1-100
}

export interface OptionsAnalytics {
  symbol: string;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsicValue: number;
  timeValue: number;
  moneyness: number;
  probabilityITM: number;
}

export class AdvancedAnalyticsEngine {
  private aiProvider: any;
  private polygonClient: ReturnType<typeof createPolygonClient>;
  private portfolioCache: Map<string, PortfolioPosition[]> = new Map();
  
  constructor() {
    this.aiProvider = createAIProvider('claude-4');
    this.polygonClient = createPolygonClient();
  }

  // Portfolio Analytics
  async calculatePortfolioMetrics(positions: PortfolioPosition[]): Promise<PortfolioMetrics> {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    // Calculate returns and volatility
    const returns = positions.map(pos => pos.dailyReturn * pos.weight);
    const portfolioReturn = returns.reduce((sum, ret) => sum + ret, 0);
    
    // Calculate beta (weighted average)
    const portfolioBeta = positions.reduce((sum, pos) => sum + (pos.beta * pos.weight), 0);
    
    // Calculate volatility using historical correlation matrix
    const volatility = await this.calculatePortfolioVolatility(positions);
    
    // Calculate Value at Risk (95%)
    const var95 = this.calculateVaR(portfolioReturn, volatility, 0.95);
    
    // Calculate Expected Shortfall (Conditional VaR)
    const expectedShortfall = this.calculateExpectedShortfall(portfolioReturn, volatility, 0.95);
    
    // Calculate Sharpe Ratio (assuming risk-free rate of 4%)
    const riskFreeRate = 0.04 / 252; // Daily risk-free rate
    const excessReturn = portfolioReturn - riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;
    
    // Calculate max drawdown (simplified)
    const maxDrawdown = await this.calculateMaxDrawdown(positions);
    
    return {
      totalValue,
      totalReturn: positions.reduce((sum, pos) => sum + (pos.currentPrice - pos.avgCost) * pos.shares, 0),
      totalReturnPercent: positions.reduce((sum, pos) => sum + pos.ytdReturn * pos.weight, 0),
      dailyPnL: positions.reduce((sum, pos) => sum + pos.dailyReturn * pos.marketValue / 100, 0),
      ytdPnL: positions.reduce((sum, pos) => sum + pos.ytdReturn * pos.marketValue / 100, 0),
      beta: portfolioBeta,
      sharpeRatio: sharpeRatio * Math.sqrt(252), // Annualized
      maxDrawdown,
      volatility: volatility * Math.sqrt(252), // Annualized
      var95,
      expectedShortfall
    };
  }

  async calculateRiskMetrics(positions: PortfolioPosition[]): Promise<RiskMetrics> {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    // Calculate correlation matrix
    const correlationMatrix = await this.calculateCorrelationMatrix(positions.map(p => p.symbol));
    
    // Calculate component VaR for each position
    const componentVaR: { [symbol: string]: number } = {};
    const marginalVaR: { [symbol: string]: number } = {};
    
    for (const position of positions) {
      const positionVolatility = 0.2; // Mock volatility
      const positionValue = position.marketValue;
      const weight = positionValue / totalValue;
      
      componentVaR[position.symbol] = this.calculateVaR(
        position.dailyReturn / 100, 
        positionVolatility / Math.sqrt(252), 
        0.95
      ) * positionValue;
      
      marginalVaR[position.symbol] = componentVaR[position.symbol] / weight;
    }
    
    // Portfolio VaR
    const portfolioVaR = Object.values(componentVaR).reduce((sum, var) => sum + var, 0);
    
    // Calculate sector exposure
    const sectorsExposure: { [sector: string]: number } = {};
    positions.forEach(pos => {
      sectorsExposure[pos.sector] = (sectorsExposure[pos.sector] || 0) + pos.weight;
    });
    
    // Calculate concentration risk (Herfindahl-Hirschman Index)
    const concentrationRisk = positions.reduce((sum, pos) => sum + Math.pow(pos.weight, 2), 0);
    
    // Calculate beta to market for each position
    const betaToMarket: { [symbol: string]: number } = {};
    positions.forEach(pos => {
      betaToMarket[pos.symbol] = pos.beta;
    });
    
    return {
      portfolioVaR,
      componentVaR,
      marginalVaR,
      correlationMatrix,
      betaToMarket,
      sectorsExposure,
      concentrationRisk,
      liquidityRisk: this.calculateLiquidityRisk(positions)
    };
  }

  async performPerformanceAttribution(
    positions: PortfolioPosition[], 
    benchmarkWeights: { [symbol: string]: number },
    benchmarkReturn: number
  ): Promise<PerformanceAttribution> {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const portfolioReturn = positions.reduce((sum, pos) => sum + pos.ytdReturn * pos.weight, 0);
    
    // Allocation effect: (portfolio weight - benchmark weight) * benchmark return
    const allocationEffect: { [sector: string]: { allocation: number; benchmark: number; effect: number } } = {};
    const sectorReturns: { [sector: string]: number } = {};
    
    // Group by sector
    const sectorData: { [sector: string]: { portfolioWeight: number; return: number } } = {};
    positions.forEach(pos => {
      if (!sectorData[pos.sector]) {
        sectorData[pos.sector] = { portfolioWeight: 0, return: 0 };
      }
      sectorData[pos.sector].portfolioWeight += pos.weight;
      sectorData[pos.sector].return += pos.ytdReturn * pos.weight;
    });
    
    // Calculate allocation and selection effects
    let totalAllocationEffect = 0;
    let totalSelectionEffect = 0;
    
    Object.entries(sectorData).forEach(([sector, data]) => {
      const benchmarkWeight = 0.1; // Mock benchmark weight
      const sectorReturn = data.return / data.portfolioWeight;
      
      const allocationEff = (data.portfolioWeight - benchmarkWeight) * benchmarkReturn;
      const selectionEff = benchmarkWeight * (sectorReturn - benchmarkReturn);
      
      allocationEffect[sector] = {
        allocation: data.portfolioWeight,
        benchmark: benchmarkWeight,
        effect: allocationEff
      };
      
      sectorReturns[sector] = selectionEff;
      totalAllocationEffect += allocationEff;
      totalSelectionEffect += selectionEff;
    });
    
    // Securities-level attribution
    const securitiesAttribution: { [symbol: string]: { allocation: number; return: number; contribution: number } } = {};
    positions.forEach(pos => {
      securitiesAttribution[pos.symbol] = {
        allocation: pos.weight,
        return: pos.ytdReturn,
        contribution: pos.weight * pos.ytdReturn
      };
    });
    
    return {
      totalReturn: portfolioReturn,
      benchmarkReturn,
      activeReturn: portfolioReturn - benchmarkReturn,
      allocation: {
        sectors: allocationEffect,
        securities: securitiesAttribution
      },
      selection: {
        total: totalSelectionEffect,
        bySector: sectorReturns
      },
      interaction: 0.01 // Mock interaction effect
    };
  }

  async runMonteCarloSimulation(
    positions: PortfolioPosition[], 
    timeHorizonDays: number = 252,
    numSimulations: number = 10000
  ): Promise<MonteCarloScenario> {
    // Simplified Monte Carlo - in production, use proper correlation structure
    const portfolioReturn = positions.reduce((sum, pos) => sum + pos.ytdReturn * pos.weight, 0);
    const portfolioVolatility = 0.15; // Mock portfolio volatility
    
    const scenarios: Array<{ return: number; probability: number; description: string }> = [];
    const returns: number[] = [];
    
    // Generate random scenarios
    for (let i = 0; i < numSimulations; i++) {
      const randomReturn = this.generateNormalRandom() * portfolioVolatility + portfolioReturn / 100;
      returns.push(randomReturn);
    }
    
    // Sort returns for percentile analysis
    returns.sort((a, b) => a - b);
    
    const worstCase = returns[Math.floor(numSimulations * 0.05)]; // 5th percentile
    const bestCase = returns[Math.floor(numSimulations * 0.95)]; // 95th percentile
    const median = returns[Math.floor(numSimulations * 0.5)]; // 50th percentile
    
    // Create scenario descriptions
    scenarios.push(
      { return: worstCase, probability: 0.05, description: 'Market crash scenario' },
      { return: returns[Math.floor(numSimulations * 0.25)], probability: 0.25, description: 'Bear market scenario' },
      { return: median, probability: 0.50, description: 'Base case scenario' },
      { return: returns[Math.floor(numSimulations * 0.75)], probability: 0.75, description: 'Bull market scenario' },
      { return: bestCase, probability: 0.95, description: 'Optimistic scenario' }
    );
    
    return {
      probability: 0.68, // 1 standard deviation probability
      portfolioReturn: median,
      worstCase,
      bestCase,
      scenarios
    };
  }

  async performStressTests(positions: PortfolioPosition[]): Promise<StressTest[]> {
    const stressTests: StressTest[] = [];
    
    // Market Crash Scenario
    const marketCrashImpacts: { [symbol: string]: number } = {};
    let portfolioCrashImpact = 0;
    
    positions.forEach(pos => {
      const impact = -0.20 * pos.beta; // 20% market decline adjusted by beta
      marketCrashImpacts[pos.symbol] = impact;
      portfolioCrashImpact += impact * pos.weight;
    });
    
    stressTests.push({
      name: 'Market Crash',
      scenario: '20% market decline with increased volatility',
      portfolioImpact: portfolioCrashImpact,
      positionImpacts: marketCrashImpacts,
      riskMetricsChange: {
        varChange: 0.5, // 50% increase in VaR
        volatilityChange: 0.3, // 30% increase in volatility
        correlationShift: 0.2 // Correlations move toward 1
      }
    });
    
    // Interest Rate Shock
    const rateShockImpacts: { [symbol: string]: number } = {};
    let portfolioRateImpact = 0;
    
    positions.forEach(pos => {
      // Impact based on sector sensitivity to rates
      const sensitivity = pos.sector === 'Real Estate' ? -0.15 : 
                         pos.sector === 'Utilities' ? -0.10 :
                         pos.sector === 'Technology' ? -0.05 : -0.02;
      rateShockImpacts[pos.symbol] = sensitivity;
      portfolioRateImpact += sensitivity * pos.weight;
    });
    
    stressTests.push({
      name: 'Interest Rate Shock',
      scenario: '200 basis points increase in interest rates',
      portfolioImpact: portfolioRateImpact,
      positionImpacts: rateShockImpacts,
      riskMetricsChange: {
        varChange: 0.25,
        volatilityChange: 0.15,
        correlationShift: 0.1
      }
    });
    
    // Sector Rotation Stress Test
    const sectorRotationImpacts: { [symbol: string]: number } = {};
    let portfolioSectorImpact = 0;
    
    positions.forEach(pos => {
      // Mock sector rotation - Growth to Value
      const impact = pos.sector === 'Technology' ? -0.12 :
                    pos.sector === 'Healthcare' ? -0.08 :
                    pos.sector === 'Financial Services' ? 0.10 :
                    pos.sector === 'Energy' ? 0.15 : 0;
      sectorRotationImpacts[pos.symbol] = impact;
      portfolioSectorImpact += impact * pos.weight;
    });
    
    stressTests.push({
      name: 'Sector Rotation',
      scenario: 'Growth to Value rotation with Energy outperformance',
      portfolioImpact: portfolioSectorImpact,
      positionImpacts: sectorRotationImpacts,
      riskMetricsChange: {
        varChange: 0.10,
        volatilityChange: 0.05,
        correlationShift: -0.1
      }
    });
    
    return stressTests;
  }

  async calculateTechnicalIndicators(symbol: string, period: number = 50): Promise<TechnicalIndicators> {
    // Mock technical indicators - in production, calculate from historical price data
    const currentPrice = 150; // Mock current price
    
    return {
      symbol,
      sma20: currentPrice * 0.98,
      sma50: currentPrice * 0.95,
      sma200: currentPrice * 0.92,
      rsi: 65,
      macd: {
        macd: 2.5,
        signal: 1.8,
        histogram: 0.7
      },
      bollingerBands: {
        upper: currentPrice * 1.04,
        middle: currentPrice,
        lower: currentPrice * 0.96
      },
      support: [currentPrice * 0.95, currentPrice * 0.90, currentPrice * 0.85],
      resistance: [currentPrice * 1.05, currentPrice * 1.10, currentPrice * 1.15],
      trend: 'bullish',
      strength: 75
    };
  }

  async analyzeOptionsChain(symbol: string, strike: number, expiry: Date): Promise<OptionsAnalytics> {
    // Mock options analytics - in production, integrate with options data provider
    const currentPrice = 150;
    const timeToExpiry = (expiry.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
    const riskFreeRate = 0.04;
    const impliedVolatility = 0.25;
    
    // Black-Scholes calculations (simplified)
    const moneyness = currentPrice / strike;
    const intrinsicValue = Math.max(currentPrice - strike, 0);
    
    return {
      symbol,
      impliedVolatility,
      delta: 0.65,
      gamma: 0.03,
      theta: -0.05,
      vega: 0.12,
      rho: 0.08,
      intrinsicValue,
      timeValue: 8.5 - intrinsicValue,
      moneyness,
      probabilityITM: 0.68
    };
  }

  // Private helper methods
  private async calculatePortfolioVolatility(positions: PortfolioPosition[]): Promise<number> {
    // Simplified portfolio volatility calculation
    // In production, use full covariance matrix
    const weightedVolatilities = positions.map(pos => {
      const volatility = 0.20; // Mock individual volatility
      return Math.pow(pos.weight * volatility, 2);
    });
    
    return Math.sqrt(weightedVolatilities.reduce((sum, vol) => sum + vol, 0));
  }

  private calculateVaR(expectedReturn: number, volatility: number, confidence: number): number {
    // Normal distribution VaR calculation
    const zScore = confidence === 0.95 ? 1.645 : confidence === 0.99 ? 2.326 : 1.282;
    return -(expectedReturn - zScore * volatility);
  }

  private calculateExpectedShortfall(expectedReturn: number, volatility: number, confidence: number): number {
    // Expected Shortfall (Conditional VaR)
    const var = this.calculateVaR(expectedReturn, volatility, confidence);
    return var * 1.3; // Simplified ES calculation
  }

  private async calculateMaxDrawdown(positions: PortfolioPosition[]): Promise<number> {
    // Mock max drawdown calculation
    return 0.15; // 15% maximum historical drawdown
  }

  private async calculateCorrelationMatrix(symbols: string[]): Promise<{ [key: string]: { [key: string]: number } }> {
    const matrix: { [key: string]: { [key: string]: number } } = {};
    
    symbols.forEach(symbol1 => {
      matrix[symbol1] = {};
      symbols.forEach(symbol2 => {
        if (symbol1 === symbol2) {
          matrix[symbol1][symbol2] = 1.0;
        } else {
          // Mock correlation - in production, calculate from historical returns
          matrix[symbol1][symbol2] = 0.3 + Math.random() * 0.4;
        }
      });
    });
    
    return matrix;
  }

  private calculateLiquidityRisk(positions: PortfolioPosition[]): number {
    // Mock liquidity risk calculation based on market cap and trading volume
    return positions.reduce((risk, pos) => {
      const positionRisk = pos.weight * 0.1; // Simplified liquidity risk
      return risk + positionRisk;
    }, 0);
  }

  private generateNormalRandom(): number {
    // Box-Muller transformation for normal random numbers
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

// Factory function
export function createAdvancedAnalyticsEngine(): AdvancedAnalyticsEngine {
  return new AdvancedAnalyticsEngine();
}

// Utility functions
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function getRiskLevel(value: number, thresholds: { low: number; medium: number }): 'low' | 'medium' | 'high' {
  if (value <= thresholds.low) return 'low';
  if (value <= thresholds.medium) return 'medium';
  return 'high';
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}