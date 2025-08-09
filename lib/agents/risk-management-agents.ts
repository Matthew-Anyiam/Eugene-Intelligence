import { z } from 'zod';
import { createFinancialAgentCore, AgentConfig, AgentDecision, FinancialDataRequest } from './financial-agent-core';
import { Position, Portfolio } from './portfolio-agents';

// Risk Management specific interfaces
export interface RiskAlert {
  id: string;
  type: 'position' | 'portfolio' | 'market' | 'liquidity' | 'compliance' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  symbol?: string;
  portfolioId?: string;
  metric: {
    name: string;
    current: number;
    threshold: number;
    unit: string;
  };
  recommendation: string;
  actionRequired: boolean;
  autoResponse?: 'stop_trading' | 'reduce_position' | 'hedge' | 'alert_only';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  agentId: string;
}

export interface RiskLimits {
  position: {
    maxWeight: number; // % of portfolio
    maxValue: number; // $ amount
    maxLoss: number; // $ amount
    maxLossPercent: number; // % of position
  };
  portfolio: {
    maxDrawdown: number; // %
    maxVaR: number; // $ amount
    maxLeverage: number; // ratio
    maxConcentration: number; // % in single position
    maxSectorExposure: number; // % in single sector
  };
  trading: {
    maxTradesPerDay: number;
    maxVolumePerTrade: number; // $ amount
    maxSlippage: number; // %
    cooldownPeriod: number; // minutes between trades
  };
  market: {
    volatilityThreshold: number; // VIX level
    liquidityThreshold: number; // minimum daily volume
    correlationThreshold: number; // max correlation between positions
  };
}

export interface RiskScenario {
  id: string;
  name: string;
  type: 'stress_test' | 'monte_carlo' | 'historical' | 'hypothetical';
  description: string;
  marketConditions: {
    equityMove: number; // %
    bondMove: number; // %
    fxMove: number; // %
    volatilityMultiplier: number;
    correlationIncrease: number; // %
  };
  expectedImpact: {
    portfolioValue: number; // $ impact
    portfolioPercent: number; // % impact
    worstPositions: Array<{
      symbol: string;
      impact: number;
      impactPercent: number;
    }>;
  };
  probability: number; // 0-1
  timeHorizon: '1d' | '1w' | '1m' | '3m' | '1y';
  lastRun: Date;
}

export interface ComplianceRule {
  id: string;
  name: string;
  type: 'regulatory' | 'internal' | 'client' | 'fiduciary';
  description: string;
  rule: {
    field: string; // 'position_size', 'concentration', 'leverage', etc.
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne';
    value: number;
    scope: 'position' | 'portfolio' | 'account' | 'firm';
  };
  violation: {
    severity: 'warning' | 'minor' | 'major' | 'critical';
    action: 'alert' | 'block' | 'force_liquidation' | 'halt_trading';
    reportingRequired: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  lastChecked?: Date;
}

export interface RiskReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  portfolioId?: string;
  title: string;
  executiveSummary: string;
  keyMetrics: {
    var95: number;
    var99: number;
    expectedShortfall: number;
    maxDrawdown: number;
    leverageRatio: number;
    concentrationRisk: number;
    liquidityRisk: number;
  };
  positions: Array<{
    symbol: string;
    riskContribution: number;
    var: number;
    beta: number;
    correlation: number;
    riskRating: 'low' | 'medium' | 'high';
  }>;
  scenarios: RiskScenario[];
  alerts: RiskAlert[];
  recommendations: string[];
  complianceStatus: {
    rulesChecked: number;
    violations: number;
    warnings: number;
  };
  generatedAt: Date;
  agentId: string;
}

// AI Models Integration for Risk Management
export interface AIRiskModels {
  claude: (prompt: string, data: any) => Promise<string>;
  gpt: (prompt: string, data: any) => Promise<string>;
  grok: (prompt: string, data: any) => Promise<string>;
  gemini: (prompt: string, data: any) => Promise<string>;
  qwen: (prompt: string, data: any) => Promise<string>;
  llama: (prompt: string, data: any) => Promise<string>;
}

export class AutonomousRiskAgent {
  private agentCore = createFinancialAgentCore();
  private riskAlerts: Map<string, RiskAlert> = new Map();
  private riskLimits: Map<string, RiskLimits> = new Map(); // by portfolio/agent ID
  private riskScenarios: Map<string, RiskScenario> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private riskReports: Map<string, RiskReport> = new Map();
  private riskModels: AIRiskModels;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor(riskModels: AIRiskModels) {
    this.riskModels = riskModels;
    this.initializeDefaultRiskLimits();
    this.initializeComplianceRules();
    this.startContinuousMonitoring();
  }

  private initializeDefaultRiskLimits(): void {
    const defaultLimits: RiskLimits = {
      position: {
        maxWeight: 10, // 10% max per position
        maxValue: 500000, // $500k max per position
        maxLoss: 50000, // $50k max loss per position
        maxLossPercent: 20 // 20% max loss per position
      },
      portfolio: {
        maxDrawdown: 15, // 15% max drawdown
        maxVaR: 100000, // $100k daily VaR
        maxLeverage: 1.5, // 1.5x leverage
        maxConcentration: 25, // 25% max single position
        maxSectorExposure: 30 // 30% max sector exposure
      },
      trading: {
        maxTradesPerDay: 20,
        maxVolumePerTrade: 200000, // $200k per trade
        maxSlippage: 0.5, // 0.5% max slippage
        cooldownPeriod: 5 // 5 minutes between trades
      },
      market: {
        volatilityThreshold: 30, // VIX > 30
        liquidityThreshold: 1000000, // $1M daily volume minimum
        correlationThreshold: 0.8 // 80% max correlation
      }
    };

    this.riskLimits.set('default', defaultLimits);
  }

  private initializeComplianceRules(): void {
    const rules: ComplianceRule[] = [
      {
        id: 'position_concentration',
        name: 'Position Concentration Limit',
        type: 'regulatory',
        description: 'No single position should exceed 25% of portfolio',
        rule: {
          field: 'position_weight',
          operator: 'lte',
          value: 25,
          scope: 'position'
        },
        violation: {
          severity: 'major',
          action: 'alert',
          reportingRequired: true
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'portfolio_leverage',
        name: 'Portfolio Leverage Limit',
        type: 'internal',
        description: 'Portfolio leverage should not exceed 2:1',
        rule: {
          field: 'leverage_ratio',
          operator: 'lte',
          value: 2,
          scope: 'portfolio'
        },
        violation: {
          severity: 'critical',
          action: 'block',
          reportingRequired: true
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'daily_loss_limit',
        name: 'Daily Loss Limit',
        type: 'internal',
        description: 'Daily losses should not exceed $100k',
        rule: {
          field: 'daily_pnl',
          operator: 'gte',
          value: -100000,
          scope: 'portfolio'
        },
        violation: {
          severity: 'critical',
          action: 'halt_trading',
          reportingRequired: true
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    rules.forEach(rule => {
      this.complianceRules.set(rule.id, rule);
    });
  }

  private startContinuousMonitoring(): void {
    // Monitor risk every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performContinuousRiskMonitoring();
      } catch (error) {
        console.error('Error in continuous risk monitoring:', error);
      }
    }, 30000);
  }

  // Core Risk Management Methods
  async performContinuousRiskMonitoring(): Promise<void> {
    // Get all active portfolios (would be passed from portfolio agent)
    const portfolios = await this.getAllActivePortfolios();
    
    for (const portfolio of portfolios) {
      await this.monitorPortfolioRisk(portfolio.id, portfolio);
      await this.checkComplianceRules(portfolio);
      await this.monitorMarketConditions(portfolio);
    }

    // Check system-wide risks
    await this.monitorSystemRisk();
  }

  async monitorPortfolioRisk(portfolioId: string, portfolio: Portfolio): Promise<RiskAlert[]> {
    const newAlerts: RiskAlert[] = [];
    const limits = this.riskLimits.get(portfolioId) || this.riskLimits.get('default')!;

    // Monitor position-level risks
    for (const position of portfolio.positions) {
      const positionAlerts = await this.checkPositionRisk(position, portfolio, limits);
      newAlerts.push(...positionAlerts);
    }

    // Monitor portfolio-level risks
    const portfolioAlerts = await this.checkPortfolioRisk(portfolio, limits);
    newAlerts.push(...portfolioAlerts);

    // Store alerts
    newAlerts.forEach(alert => {
      this.riskAlerts.set(alert.id, alert);
      
      // Take automated action if required
      if (alert.actionRequired && alert.autoResponse) {
        this.executeAutomatedRiskResponse(alert);
      }
    });

    return newAlerts;
  }

  async calculateValueAtRisk(
    portfolio: Portfolio,
    confidenceLevel: 95 | 99 = 95,
    timeHorizon: number = 1
  ): Promise<{
    var: number;
    expectedShortfall: number;
    breakdown: Array<{
      symbol: string;
      contribution: number;
      individualVar: number;
    }>;
  }> {
    const portfolioValue = portfolio.totalValue;
    const positions = portfolio.positions;

    // Simplified VaR calculation using parametric method
    // In production, would use more sophisticated models (Monte Carlo, Historical Simulation)
    
    let portfolioVar = 0;
    const positionContributions = [];

    for (const position of positions) {
      // Get historical volatility
      const volatility = await this.getHistoricalVolatility(position.symbol);
      
      // Calculate individual position VaR
      const zScore = confidenceLevel === 95 ? 1.645 : 2.33;
      const individualVar = position.marketValue * volatility * zScore * Math.sqrt(timeHorizon);
      
      // Add to portfolio VaR (simplified - ignores correlations)
      portfolioVar += Math.pow(individualVar, 2);
      
      positionContributions.push({
        symbol: position.symbol,
        contribution: individualVar / portfolioValue,
        individualVar
      });
    }

    portfolioVar = Math.sqrt(portfolioVar);
    
    // Expected Shortfall (CVaR) - simplified calculation
    const expectedShortfall = portfolioVar * 1.2; // Rough approximation

    return {
      var: portfolioVar,
      expectedShortfall,
      breakdown: positionContributions
    };
  }

  async runStressTest(
    portfolio: Portfolio,
    scenario: RiskScenario
  ): Promise<{
    totalImpact: number;
    totalImpactPercent: number;
    positionImpacts: Array<{
      symbol: string;
      currentValue: number;
      stressedValue: number;
      impact: number;
      impactPercent: number;
    }>;
    worstCaseDrawdown: number;
  }> {
    const impacts = [];
    let totalImpact = 0;

    for (const position of portfolio.positions) {
      // Get position beta and sector exposure
      const beta = await this.getPositionBeta(position.symbol);
      const sector = position.sector;
      
      // Calculate stress impact based on scenario
      let stressMultiplier = 1;
      
      // Apply equity market move
      stressMultiplier += (scenario.marketConditions.equityMove / 100) * beta;
      
      // Apply sector-specific stress if applicable
      if (sector === 'Technology' && scenario.marketConditions.equityMove < -10) {
        stressMultiplier *= 1.2; // Tech more sensitive to negative moves
      }
      
      // Apply volatility multiplier
      const additionalVolatility = (scenario.marketConditions.volatilityMultiplier - 1) * 0.1;
      stressMultiplier -= additionalVolatility;

      const stressedValue = position.marketValue * stressMultiplier;
      const impact = stressedValue - position.marketValue;
      
      impacts.push({
        symbol: position.symbol,
        currentValue: position.marketValue,
        stressedValue,
        impact,
        impactPercent: (impact / position.marketValue) * 100
      });

      totalImpact += impact;
    }

    const totalImpactPercent = (totalImpact / portfolio.totalValue) * 100;
    const worstCaseDrawdown = Math.abs(Math.min(totalImpactPercent, 0));

    return {
      totalImpact,
      totalImpactPercent,
      positionImpacts: impacts,
      worstCaseDrawdown
    };
  }

  async generateRiskReport(
    portfolioId: string,
    type: 'daily' | 'weekly' | 'monthly' | 'ad_hoc' = 'daily'
  ): Promise<RiskReport> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Calculate key risk metrics
    const varAnalysis = await this.calculateValueAtRisk(portfolio, 95);
    const var99Analysis = await this.calculateValueAtRisk(portfolio, 99);
    
    // Run stress tests
    const stressScenarios = await this.getActiveStressScenarios();
    const stressResults = await Promise.all(
      stressScenarios.map(scenario => this.runStressTest(portfolio, scenario))
    );

    // Analyze position risks
    const positionRisks = await Promise.all(
      portfolio.positions.map(async position => {
        const beta = await this.getPositionBeta(position.symbol);
        const correlation = await this.getPositionCorrelation(position.symbol, 'SPY');
        
        return {
          symbol: position.symbol,
          riskContribution: varAnalysis.breakdown.find(b => b.symbol === position.symbol)?.contribution || 0,
          var: varAnalysis.breakdown.find(b => b.symbol === position.symbol)?.individualVar || 0,
          beta,
          correlation,
          riskRating: this.calculatePositionRiskRating(position, beta) as 'low' | 'medium' | 'high'
        };
      })
    );

    // Get recent alerts
    const recentAlerts = Array.from(this.riskAlerts.values())
      .filter(alert => alert.portfolioId === portfolioId)
      .filter(alert => alert.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Check compliance status
    const complianceStatus = await this.getComplianceStatus(portfolio);

    // Generate AI-powered analysis
    const analysisPrompt = this.buildRiskAnalysisPrompt(portfolio, {
      varAnalysis,
      var99Analysis,
      positionRisks,
      recentAlerts,
      stressResults
    });

    const riskAnalysis = await this.riskModels.claude(analysisPrompt, { portfolio });
    const parsedAnalysis = this.parseRiskAnalysis(riskAnalysis);

    const report: RiskReport = {
      id: `risk_report_${Date.now()}`,
      type,
      portfolioId,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Risk Report - ${portfolio.name}`,
      executiveSummary: parsedAnalysis.executiveSummary,
      keyMetrics: {
        var95: varAnalysis.var,
        var99: var99Analysis.var,
        expectedShortfall: varAnalysis.expectedShortfall,
        maxDrawdown: Math.max(...stressResults.map(r => r.worstCaseDrawdown)),
        leverageRatio: portfolio.totalInvested / portfolio.totalValue,
        concentrationRisk: Math.max(...portfolio.positions.map(p => p.weight)) / 100,
        liquidityRisk: this.calculateLiquidityRisk(portfolio)
      },
      positions: positionRisks,
      scenarios: stressScenarios,
      alerts: recentAlerts,
      recommendations: parsedAnalysis.recommendations,
      complianceStatus,
      generatedAt: new Date(),
      agentId: portfolio.agentId
    };

    this.riskReports.set(report.id, report);
    return report;
  }

  // Risk Monitoring Helper Methods
  private async checkPositionRisk(
    position: Position,
    portfolio: Portfolio,
    limits: RiskLimits
  ): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];

    // Check position weight
    if (position.weight > limits.position.maxWeight) {
      alerts.push({
        id: `alert_pos_weight_${position.symbol}_${Date.now()}`,
        type: 'position',
        severity: position.weight > limits.position.maxWeight * 1.5 ? 'high' : 'medium',
        title: 'Position Weight Limit Exceeded',
        message: `${position.symbol} represents ${position.weight.toFixed(1)}% of portfolio`,
        symbol: position.symbol,
        portfolioId: portfolio.id,
        metric: {
          name: 'Position Weight',
          current: position.weight,
          threshold: limits.position.maxWeight,
          unit: '%'
        },
        recommendation: 'Consider reducing position size to manage concentration risk',
        actionRequired: position.weight > limits.position.maxWeight * 2,
        autoResponse: position.weight > limits.position.maxWeight * 2 ? 'reduce_position' : 'alert_only',
        createdAt: new Date(),
        agentId: portfolio.agentId
      });
    }

    // Check position loss
    if (position.unrealizedPnL < -limits.position.maxLoss) {
      alerts.push({
        id: `alert_pos_loss_${position.symbol}_${Date.now()}`,
        type: 'position',
        severity: position.unrealizedPnL < -limits.position.maxLoss * 1.5 ? 'critical' : 'high',
        title: 'Position Loss Limit Exceeded',
        message: `${position.symbol} has unrealized loss of ${position.unrealizedPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        symbol: position.symbol,
        portfolioId: portfolio.id,
        metric: {
          name: 'Unrealized P&L',
          current: position.unrealizedPnL,
          threshold: -limits.position.maxLoss,
          unit: '$'
        },
        recommendation: 'Consider stop-loss or position reduction to limit further losses',
        actionRequired: position.unrealizedPnL < -limits.position.maxLoss * 2,
        autoResponse: 'alert_only',
        createdAt: new Date(),
        agentId: portfolio.agentId
      });
    }

    // Check position loss percentage
    if (position.unrealizedPnLPercent < -limits.position.maxLossPercent) {
      alerts.push({
        id: `alert_pos_loss_pct_${position.symbol}_${Date.now()}`,
        type: 'position',
        severity: position.unrealizedPnLPercent < -limits.position.maxLossPercent * 1.5 ? 'critical' : 'high',
        title: 'Position Loss Percentage Exceeded',
        message: `${position.symbol} is down ${Math.abs(position.unrealizedPnLPercent).toFixed(1)}%`,
        symbol: position.symbol,
        portfolioId: portfolio.id,
        metric: {
          name: 'Position Return',
          current: position.unrealizedPnLPercent,
          threshold: -limits.position.maxLossPercent,
          unit: '%'
        },
        recommendation: 'Review stop-loss strategy and consider position closure',
        actionRequired: position.unrealizedPnLPercent < -limits.position.maxLossPercent * 2,
        autoResponse: 'alert_only',
        createdAt: new Date(),
        agentId: portfolio.agentId
      });
    }

    return alerts;
  }

  private async checkPortfolioRisk(
    portfolio: Portfolio,
    limits: RiskLimits
  ): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];

    // Check portfolio drawdown
    const currentDrawdown = this.calculateCurrentDrawdown(portfolio);
    if (currentDrawdown > limits.portfolio.maxDrawdown) {
      alerts.push({
        id: `alert_portfolio_drawdown_${portfolio.id}_${Date.now()}`,
        type: 'portfolio',
        severity: currentDrawdown > limits.portfolio.maxDrawdown * 1.5 ? 'critical' : 'high',
        title: 'Portfolio Drawdown Limit Exceeded',
        message: `Portfolio drawdown is ${currentDrawdown.toFixed(1)}%`,
        portfolioId: portfolio.id,
        metric: {
          name: 'Drawdown',
          current: currentDrawdown,
          threshold: limits.portfolio.maxDrawdown,
          unit: '%'
        },
        recommendation: 'Consider reducing risk exposure and reviewing position sizing',
        actionRequired: currentDrawdown > limits.portfolio.maxDrawdown * 1.5,
        autoResponse: 'alert_only',
        createdAt: new Date(),
        agentId: portfolio.agentId
      });
    }

    // Check concentration risk
    const maxWeight = Math.max(...portfolio.positions.map(p => p.weight));
    if (maxWeight > limits.portfolio.maxConcentration) {
      alerts.push({
        id: `alert_concentration_${portfolio.id}_${Date.now()}`,
        type: 'portfolio',
        severity: 'medium',
        title: 'Portfolio Concentration Risk',
        message: `Single position represents ${maxWeight.toFixed(1)}% of portfolio`,
        portfolioId: portfolio.id,
        metric: {
          name: 'Max Position Weight',
          current: maxWeight,
          threshold: limits.portfolio.maxConcentration,
          unit: '%'
        },
        recommendation: 'Diversify holdings to reduce concentration risk',
        actionRequired: false,
        autoResponse: 'alert_only',
        createdAt: new Date(),
        agentId: portfolio.agentId
      });
    }

    // Check leverage
    const leverage = portfolio.totalInvested / portfolio.totalValue;
    if (leverage > limits.portfolio.maxLeverage) {
      alerts.push({
        id: `alert_leverage_${portfolio.id}_${Date.now()}`,
        type: 'portfolio',
        severity: leverage > limits.portfolio.maxLeverage * 1.5 ? 'critical' : 'high',
        title: 'Portfolio Leverage Exceeded',
        message: `Portfolio leverage is ${leverage.toFixed(2)}:1`,
        portfolioId: portfolio.id,
        metric: {
          name: 'Leverage Ratio',
          current: leverage,
          threshold: limits.portfolio.maxLeverage,
          unit: ':1'
        },
        recommendation: 'Reduce leverage by decreasing position sizes or adding cash',
        actionRequired: leverage > limits.portfolio.maxLeverage * 1.5,
        autoResponse: leverage > limits.portfolio.maxLeverage * 2 ? 'reduce_position' : 'alert_only',
        createdAt: new Date(),
        agentId: portfolio.agentId
      });
    }

    return alerts;
  }

  private async checkComplianceRules(portfolio: Portfolio): Promise<void> {
    for (const rule of this.complianceRules.values()) {
      if (!rule.isActive) continue;

      const violation = await this.checkComplianceRule(portfolio, rule);
      if (violation) {
        const alert: RiskAlert = {
          id: `compliance_alert_${rule.id}_${Date.now()}`,
          type: 'compliance',
          severity: this.mapComplianceSeverity(rule.violation.severity),
          title: `Compliance Violation: ${rule.name}`,
          message: `${rule.description} - Current value violates rule`,
          portfolioId: portfolio.id,
          metric: {
            name: rule.rule.field,
            current: violation.currentValue,
            threshold: rule.rule.value,
            unit: violation.unit
          },
          recommendation: `Address ${rule.name} violation immediately`,
          actionRequired: rule.violation.action !== 'alert',
          autoResponse: this.mapComplianceAction(rule.violation.action),
          createdAt: new Date(),
          agentId: portfolio.agentId
        };

        this.riskAlerts.set(alert.id, alert);

        if (alert.actionRequired && alert.autoResponse) {
          await this.executeAutomatedRiskResponse(alert);
        }
      }

      rule.lastChecked = new Date();
    }
  }

  private async monitorMarketConditions(portfolio: Portfolio): Promise<void> {
    const limits = this.riskLimits.get(portfolio.id) || this.riskLimits.get('default')!;

    // Check VIX level
    const vixLevel = await this.getVIXLevel();
    if (vixLevel > limits.market.volatilityThreshold) {
      const alert: RiskAlert = {
        id: `market_volatility_${Date.now()}`,
        type: 'market',
        severity: vixLevel > limits.market.volatilityThreshold * 1.5 ? 'high' : 'medium',
        title: 'Elevated Market Volatility',
        message: `VIX level is ${vixLevel.toFixed(1)}`,
        portfolioId: portfolio.id,
        metric: {
          name: 'VIX Level',
          current: vixLevel,
          threshold: limits.market.volatilityThreshold,
          unit: ''
        },
        recommendation: 'Consider reducing portfolio risk in high volatility environment',
        actionRequired: false,
        autoResponse: 'alert_only',
        createdAt: new Date(),
        agentId: portfolio.agentId
      };

      this.riskAlerts.set(alert.id, alert);
    }

    // Check liquidity conditions for each position
    for (const position of portfolio.positions) {
      const dailyVolume = await this.getDailyVolume(position.symbol);
      const positionSize = position.marketValue;
      
      // Check if position is too large relative to daily volume
      if (dailyVolume > 0 && positionSize > dailyVolume * 0.1) { // Position > 10% of daily volume
        const alert: RiskAlert = {
          id: `liquidity_risk_${position.symbol}_${Date.now()}`,
          type: 'liquidity',
          severity: positionSize > dailyVolume * 0.25 ? 'high' : 'medium',
          title: 'Liquidity Risk Detected',
          message: `${position.symbol} position size relative to daily volume may impact liquidity`,
          symbol: position.symbol,
          portfolioId: portfolio.id,
          metric: {
            name: 'Position/Volume Ratio',
            current: positionSize / dailyVolume,
            threshold: 0.1,
            unit: ''
          },
          recommendation: 'Monitor liquidity carefully and consider gradual position reduction',
          actionRequired: false,
          autoResponse: 'alert_only',
          createdAt: new Date(),
          agentId: portfolio.agentId
        };

        this.riskAlerts.set(alert.id, alert);
      }
    }
  }

  private async monitorSystemRisk(): Promise<void> {
    // Monitor system-wide risks across all portfolios
    // This would include correlation risk, sector concentration, counterparty risk, etc.
    
    // For now, just log that system monitoring occurred
    console.log('System risk monitoring completed at', new Date());
  }

  // Automated Response Methods
  private async executeAutomatedRiskResponse(alert: RiskAlert): Promise<void> {
    try {
      switch (alert.autoResponse) {
        case 'stop_trading':
          await this.stopTrading(alert.portfolioId!);
          break;
        case 'reduce_position':
          if (alert.symbol) {
            await this.reducePosition(alert.portfolioId!, alert.symbol, 0.5); // Reduce by 50%
          }
          break;
        case 'hedge':
          await this.implementHedge(alert.portfolioId!);
          break;
        case 'alert_only':
        default:
          // Just log the alert
          console.log(`Risk alert generated: ${alert.title}`);
          break;
      }

      // Record the automated action
      await this.agentCore.recordDecision({
        agentId: alert.agentId,
        action: 'sell', // Simplified
        confidence: 0.9,
        reasoning: `Automated risk response to ${alert.title}`,
        dataUsed: ['risk_metrics', 'compliance_rules'],
        risk: 'high',
        executedAt: new Date()
      });

    } catch (error) {
      console.error(`Failed to execute automated risk response for alert ${alert.id}:`, error);
    }
  }

  private async stopTrading(portfolioId: string): Promise<void> {
    // Implementation would stop all trading for the portfolio
    console.log(`Trading stopped for portfolio ${portfolioId}`);
  }

  private async reducePosition(portfolioId: string, symbol: string, reduction: number): Promise<void> {
    // Implementation would reduce position by specified percentage
    console.log(`Reducing ${symbol} position by ${(reduction * 100).toFixed(0)}% in portfolio ${portfolioId}`);
  }

  private async implementHedge(portfolioId: string): Promise<void> {
    // Implementation would add hedging instruments
    console.log(`Implementing hedge for portfolio ${portfolioId}`);
  }

  // Helper Methods
  private async getHistoricalVolatility(symbol: string): Promise<number> {
    // Mock historical volatility - in production, calculate from historical prices
    return 0.15 + Math.random() * 0.15; // 15-30% volatility
  }

  private async getPositionBeta(symbol: string): Promise<number> {
    // Mock beta - in production, calculate from historical data
    return 0.7 + Math.random() * 0.6; // 0.7-1.3 beta
  }

  private async getPositionCorrelation(symbol: string, benchmark: string): Promise<number> {
    // Mock correlation - in production, calculate from historical data
    return 0.3 + Math.random() * 0.5; // 0.3-0.8 correlation
  }

  private calculateCurrentDrawdown(portfolio: Portfolio): number {
    // Simplified drawdown calculation
    // In production, would track high-water mark and calculate proper drawdown
    return Math.abs(Math.min(portfolio.totalReturnPercent, 0));
  }

  private calculatePositionRiskRating(position: Position, beta: number): string {
    const volatility = position.unrealizedPnLPercent;
    const size = position.weight;
    
    if (beta > 1.5 || size > 15 || Math.abs(volatility) > 25) return 'high';
    if (beta > 1.2 || size > 10 || Math.abs(volatility) > 15) return 'medium';
    return 'low';
  }

  private calculateLiquidityRisk(portfolio: Portfolio): number {
    // Simplified liquidity risk calculation
    // In production, would use more sophisticated measures
    return portfolio.positions.length > 0 ? 0.1 + Math.random() * 0.2 : 0;
  }

  private mapComplianceSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'major': return 'high';
      case 'minor': return 'medium';
      case 'warning': return 'low';
      default: return 'medium';
    }
  }

  private mapComplianceAction(action: string): 'stop_trading' | 'reduce_position' | 'hedge' | 'alert_only' {
    switch (action) {
      case 'halt_trading': return 'stop_trading';
      case 'force_liquidation': return 'reduce_position';
      case 'block': return 'stop_trading';
      case 'alert': return 'alert_only';
      default: return 'alert_only';
    }
  }

  private async checkComplianceRule(portfolio: Portfolio, rule: ComplianceRule): Promise<{
    currentValue: number;
    unit: string;
  } | null> {
    let currentValue: number;
    let unit: string;

    switch (rule.rule.field) {
      case 'position_weight':
        currentValue = Math.max(...portfolio.positions.map(p => p.weight));
        unit = '%';
        break;
      case 'leverage_ratio':
        currentValue = portfolio.totalInvested / portfolio.totalValue;
        unit = ':1';
        break;
      case 'daily_pnl':
        currentValue = portfolio.dailyPnL;
        unit = '$';
        break;
      default:
        return null;
    }

    const violates = this.checkRuleViolation(currentValue, rule.rule.operator, rule.rule.value);
    
    return violates ? { currentValue, unit } : null;
  }

  private checkRuleViolation(current: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'lt': return current >= threshold;
      case 'lte': return current > threshold;
      case 'gt': return current <= threshold;
      case 'gte': return current < threshold;
      case 'eq': return current !== threshold;
      case 'ne': return current === threshold;
      default: return false;
    }
  }

  private async getVIXLevel(): Promise<number> {
    // Mock VIX level - in production, fetch from market data
    return 15 + Math.random() * 20; // 15-35 VIX level
  }

  private async getDailyVolume(symbol: string): Promise<number> {
    // Mock daily volume - in production, fetch from market data
    return 1000000 + Math.random() * 10000000; // $1M-11M daily volume
  }

  private async getActiveStressScenarios(): Promise<RiskScenario[]> {
    // Return predefined stress scenarios
    return [
      {
        id: 'market_crash',
        name: 'Market Crash Scenario',
        type: 'stress_test',
        description: '20% market decline with increased volatility',
        marketConditions: {
          equityMove: -20,
          bondMove: 5,
          fxMove: 0,
          volatilityMultiplier: 2.0,
          correlationIncrease: 20
        },
        expectedImpact: { portfolioValue: 0, portfolioPercent: 0, worstPositions: [] },
        probability: 0.05,
        timeHorizon: '1w',
        lastRun: new Date()
      }
    ];
  }

  private async getComplianceStatus(portfolio: Portfolio): Promise<{
    rulesChecked: number;
    violations: number;
    warnings: number;
  }> {
    const activeRules = Array.from(this.complianceRules.values()).filter(r => r.isActive);
    let violations = 0;
    let warnings = 0;

    for (const rule of activeRules) {
      const violation = await this.checkComplianceRule(portfolio, rule);
      if (violation) {
        if (rule.violation.severity === 'critical' || rule.violation.severity === 'major') {
          violations++;
        } else {
          warnings++;
        }
      }
    }

    return {
      rulesChecked: activeRules.length,
      violations,
      warnings
    };
  }

  private buildRiskAnalysisPrompt(portfolio: Portfolio, riskData: any): string {
    return `
    Analyze the risk profile of this portfolio and provide insights:

    PORTFOLIO: ${portfolio.name}
    Total Value: $${portfolio.totalValue.toLocaleString()}
    Positions: ${portfolio.positions.length}
    Total Return: ${portfolio.totalReturnPercent.toFixed(2)}%

    RISK METRICS:
    - VaR (95%): $${riskData.varAnalysis.var.toLocaleString()}
    - VaR (99%): $${riskData.var99Analysis.var.toLocaleString()}
    - Expected Shortfall: $${riskData.varAnalysis.expectedShortfall.toLocaleString()}

    RECENT ALERTS: ${riskData.recentAlerts.length} alerts in last 24 hours
    ${riskData.recentAlerts.slice(0, 3).map((alert: RiskAlert) => `- ${alert.title}`).join('\n')}

    HIGH RISK POSITIONS:
    ${riskData.positionRisks
      .filter((p: any) => p.riskRating === 'high')
      .map((p: any) => `- ${p.symbol}: ${p.riskRating} risk, Beta: ${p.beta.toFixed(2)}`)
      .join('\n')}

    Provide analysis in JSON format:
    {
      "executiveSummary": "comprehensive risk assessment",
      "keyRisks": ["risk 1", "risk 2"],
      "riskLevel": "low|medium|high|critical",
      "recommendations": ["rec 1", "rec 2", "rec 3"],
      "immediateActions": ["action 1", "action 2"]
    }
    `;
  }

  private parseRiskAnalysis(aiResponse: string): {
    executiveSummary: string;
    recommendations: string[];
  } {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          executiveSummary: parsed.executiveSummary || 'Risk analysis completed',
          recommendations: parsed.recommendations || ['Monitor portfolio regularly']
        };
      }
    } catch (error) {
      console.error('Error parsing risk analysis:', error);
    }

    return {
      executiveSummary: 'Risk analysis completed - manual review recommended',
      recommendations: ['Review portfolio risk metrics manually', 'Check compliance status']
    };
  }

  // Mock data access methods (would be replaced with real portfolio data)
  private async getAllActivePortfolios(): Promise<Portfolio[]> {
    // Mock portfolios - in production, would fetch from portfolio agent
    return [];
  }

  private async getPortfolio(portfolioId: string): Promise<Portfolio | null> {
    // Mock portfolio fetch - in production, would fetch from portfolio agent
    return null;
  }

  // Public Interface Methods
  getRiskAlert(alertId: string): RiskAlert | undefined {
    return this.riskAlerts.get(alertId);
  }

  getAllRiskAlerts(portfolioId?: string, severity?: string): RiskAlert[] {
    const alerts = Array.from(this.riskAlerts.values());
    let filtered = alerts;

    if (portfolioId) {
      filtered = filtered.filter(alert => alert.portfolioId === portfolioId);
    }

    if (severity) {
      filtered = filtered.filter(alert => alert.severity === severity);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getRiskReport(reportId: string): RiskReport | undefined {
    return this.riskReports.get(reportId);
  }

  setRiskLimits(portfolioId: string, limits: RiskLimits): void {
    this.riskLimits.set(portfolioId, limits);
  }

  getRiskLimits(portfolioId: string): RiskLimits | undefined {
    return this.riskLimits.get(portfolioId) || this.riskLimits.get('default');
  }

  addComplianceRule(rule: ComplianceRule): void {
    this.complianceRules.set(rule.id, rule);
  }

  getComplianceRules(): ComplianceRule[] {
    return Array.from(this.complianceRules.values());
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.riskAlerts.get(alertId);
    if (alert) {
      alert.acknowledgedAt = new Date();
      this.riskAlerts.set(alertId, alert);
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.riskAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.riskAlerts.set(alertId, alert);
    }
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Factory function
export function createAutonomousRiskAgent(models: AIRiskModels): AutonomousRiskAgent {
  return new AutonomousRiskAgent(models);
}