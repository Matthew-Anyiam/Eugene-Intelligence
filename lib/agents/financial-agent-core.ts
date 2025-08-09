import { EventEmitter } from 'events';
import { z } from 'zod';
import { createUnifiedDataInterface } from '@/lib/data/unified-data-interface';
import { createInMemoryDataLayer } from '@/lib/data/in-memory-data-layer';

// Core Agent Types
export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  description?: string;
  isActive: boolean;
  riskLimits: RiskLimits;
  parameters: AgentParameters;
  capabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type AgentType = 'trading' | 'research' | 'portfolio' | 'risk' | 'analysis';

export interface RiskLimits {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxWeeklyLoss: number;
  maxMonthlyLoss: number;
  maxExposure: number;
  maxLeverage: number;
  allowedSymbols?: string[];
  blockedSymbols?: string[];
  maxTradesPerDay: number;
}

export interface AgentParameters {
  models: string[];
  dataFrequency: 'realtime' | 'minute' | 'hour' | 'daily';
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  decisionThreshold: number;
  confidenceMinimum: number;
  customSettings: Record<string, any>;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  currentStreak: number;
  lastUpdated: Date;
}

export interface AgentDecision {
  id: string;
  agentId: string;
  timestamp: Date;
  action: 'buy' | 'sell' | 'hold' | 'analyze' | 'alert';
  symbol?: string;
  confidence: number;
  reasoning: string;
  dataUsed: string[];
  outcome?: 'pending' | 'success' | 'failure';
  risk: 'low' | 'medium' | 'high';
  executedAt?: Date;
}

export interface AgentStatus {
  id: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  uptime: number;
  lastDecision?: Date;
  decisionsToday: number;
  currentTask?: string;
  health: 'healthy' | 'degraded' | 'error';
  errorMessage?: string;
}

// Enhanced Financial Tools for AI Agents
export interface FinancialDataRequest {
  type: 'quote' | 'fundamental' | 'news' | 'economic' | 'options';
  symbols: string[];
  parameters: Record<string, any>;
  realTime?: boolean;
  fallbackToCache?: boolean;
}

export class FinancialAgentCore extends EventEmitter {
  private dataLayer = createInMemoryDataLayer();
  private unifiedInterface = createUnifiedDataInterface(this.dataLayer);
  private agents: Map<string, AgentConfig> = new Map();
  private agentStatuses: Map<string, AgentStatus> = new Map();
  private decisions: Map<string, AgentDecision[]> = new Map();
  private performances: Map<string, PerformanceMetrics> = new Map();
  
  constructor() {
    super();
    this.initializeAgentSystem();
  }

  private async initializeAgentSystem(): Promise<void> {
    // Initialize the agent management system
    this.emit('system:initialized');
  }

  // Agent Management
  async createAgent(config: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentConfig> {
    const agentConfig: AgentConfig = {
      ...config,
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.agents.set(agentConfig.id, agentConfig);
    
    // Initialize agent status
    const status: AgentStatus = {
      id: agentConfig.id,
      status: 'stopped',
      uptime: 0,
      decisionsToday: 0,
      health: 'healthy'
    };
    this.agentStatuses.set(agentConfig.id, status);

    // Initialize performance metrics
    const performance: PerformanceMetrics = {
      totalTrades: 0,
      winRate: 0,
      totalReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      volatility: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      currentStreak: 0,
      lastUpdated: new Date()
    };
    this.performances.set(agentConfig.id, performance);

    // Initialize decisions array
    this.decisions.set(agentConfig.id, []);

    this.emit('agent:created', { agentId: agentConfig.id, config: agentConfig });
    return agentConfig;
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const status = this.agentStatuses.get(agentId);
    if (!status) {
      throw new Error(`Agent status for ${agentId} not found`);
    }

    // Update agent and status
    agent.isActive = true;
    agent.updatedAt = new Date();
    status.status = 'active';
    status.currentTask = 'initialization';

    this.agents.set(agentId, agent);
    this.agentStatuses.set(agentId, status);

    // Start agent execution loop
    this.startAgentExecutionLoop(agentId);
    
    this.emit('agent:started', { agentId });
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const status = this.agentStatuses.get(agentId);
    if (!status) {
      throw new Error(`Agent status for ${agentId} not found`);
    }

    // Update agent and status
    agent.isActive = false;
    agent.updatedAt = new Date();
    status.status = 'stopped';
    status.currentTask = undefined;

    this.agents.set(agentId, agent);
    this.agentStatuses.set(agentId, status);

    this.emit('agent:stopped', { agentId });
  }

  async pauseAgent(agentId: string): Promise<void> {
    const status = this.agentStatuses.get(agentId);
    if (!status) {
      throw new Error(`Agent status for ${agentId} not found`);
    }

    status.status = 'paused';
    this.agentStatuses.set(agentId, status);

    this.emit('agent:paused', { agentId });
  }

  async updateAgentConfiguration(agentId: string, config: Partial<AgentConfig>): Promise<AgentConfig> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const updatedAgent = {
      ...agent,
      ...config,
      id: agent.id, // Prevent ID changes
      updatedAt: new Date()
    };

    this.agents.set(agentId, updatedAgent);
    
    this.emit('agent:updated', { agentId, config: updatedAgent });
    return updatedAgent;
  }

  // Agent Execution
  private async startAgentExecutionLoop(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    const status = this.agentStatuses.get(agentId);
    
    if (!agent || !status || !agent.isActive) {
      return;
    }

    try {
      // Execute agent logic based on type
      switch (agent.type) {
        case 'trading':
          await this.executeTradingAgent(agent);
          break;
        case 'research':
          await this.executeResearchAgent(agent);
          break;
        case 'portfolio':
          await this.executePortfolioAgent(agent);
          break;
        case 'risk':
          await this.executeRiskAgent(agent);
          break;
        case 'analysis':
          await this.executeAnalysisAgent(agent);
          break;
        default:
          throw new Error(`Unknown agent type: ${agent.type}`);
      }

      // Update status
      status.lastDecision = new Date();
      status.currentTask = 'idle';
      status.health = 'healthy';
      this.agentStatuses.set(agentId, status);

      // Schedule next execution if agent is still active
      if (agent.isActive) {
        setTimeout(() => this.startAgentExecutionLoop(agentId), this.getExecutionInterval(agent));
      }

    } catch (error) {
      console.error(`Agent ${agentId} execution error:`, error);
      status.status = 'error';
      status.health = 'error';
      status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.agentStatuses.set(agentId, status);

      this.emit('agent:error', { agentId, error });
    }
  }

  private getExecutionInterval(agent: AgentConfig): number {
    switch (agent.parameters.dataFrequency) {
      case 'realtime': return 1000; // 1 second
      case 'minute': return 60000; // 1 minute
      case 'hour': return 3600000; // 1 hour
      case 'daily': return 86400000; // 1 day
      default: return 60000; // 1 minute default
    }
  }

  // Core Agent Execution Methods (to be implemented by specific agent types)
  private async executeTradingAgent(agent: AgentConfig): Promise<void> {
    // Implementation handled by trading agents
    this.emit('agent:execution', { agentId: agent.id, type: 'trading' });
  }

  private async executeResearchAgent(agent: AgentConfig): Promise<void> {
    // Implementation handled by research agents
    this.emit('agent:execution', { agentId: agent.id, type: 'research' });
  }

  private async executePortfolioAgent(agent: AgentConfig): Promise<void> {
    // Implementation handled by portfolio agents
    this.emit('agent:execution', { agentId: agent.id, type: 'portfolio' });
  }

  private async executeRiskAgent(agent: AgentConfig): Promise<void> {
    // Implementation handled by risk agents
    this.emit('agent:execution', { agentId: agent.id, type: 'risk' });
  }

  private async executeAnalysisAgent(agent: AgentConfig): Promise<void> {
    // Implementation handled by analysis agents
    this.emit('agent:execution', { agentId: agent.id, type: 'analysis' });
  }

  // Decision Management
  async recordDecision(decision: Omit<AgentDecision, 'id' | 'timestamp'>): Promise<AgentDecision> {
    const fullDecision: AgentDecision = {
      ...decision,
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const agentDecisions = this.decisions.get(decision.agentId) || [];
    agentDecisions.push(fullDecision);
    this.decisions.set(decision.agentId, agentDecisions);

    // Update decision count for today
    const status = this.agentStatuses.get(decision.agentId);
    if (status) {
      status.decisionsToday++;
      this.agentStatuses.set(decision.agentId, status);
    }

    this.emit('agent:decision', fullDecision);
    return fullDecision;
  }

  // Data Access Methods
  async getFinancialData(request: FinancialDataRequest): Promise<any> {
    switch (request.type) {
      case 'quote':
        return await this.unifiedInterface.getQuotes(request);
      case 'fundamental':
        return await this.unifiedInterface.getFundamentals(request);
      case 'news':
        return await this.unifiedInterface.getNews(request);
      case 'economic':
        return await this.unifiedInterface.getEconomicData(request);
      case 'options':
        return await this.unifiedInterface.getOptions(request);
      default:
        throw new Error(`Unknown data type: ${request.type}`);
    }
  }

  // System Status and Analytics
  getSystemStatus(): {
    totalAgents: number;
    activeAgents: number;
    totalDecisions: number;
    avgPerformance: number;
    systemHealth: string;
  } {
    const totalAgents = this.agents.size;
    const activeAgents = Array.from(this.agents.values()).filter(a => a.isActive).length;
    const totalDecisions = Array.from(this.decisions.values()).reduce((sum, decisions) => sum + decisions.length, 0);
    
    const performances = Array.from(this.performances.values());
    const avgPerformance = performances.length > 0 
      ? performances.reduce((sum, perf) => sum + perf.totalReturn, 0) / performances.length 
      : 0;

    const healthyAgents = Array.from(this.agentStatuses.values()).filter(s => s.health === 'healthy').length;
    const systemHealth = healthyAgents === totalAgents ? 'healthy' : 'degraded';

    return {
      totalAgents,
      activeAgents,
      totalDecisions,
      avgPerformance,
      systemHealth
    };
  }

  // Agent Getters
  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatuses.get(agentId);
  }

  getAgentPerformance(agentId: string): PerformanceMetrics | undefined {
    return this.performances.get(agentId);
  }

  getAgentDecisions(agentId: string, limit?: number): AgentDecision[] {
    const decisions = this.decisions.get(agentId) || [];
    return limit ? decisions.slice(-limit) : decisions;
  }

  // Risk Management
  validateDecisionAgainstRiskLimits(agentId: string, decision: Partial<AgentDecision>): {
    valid: boolean;
    violations: string[];
  } {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { valid: false, violations: ['Agent not found'] };
    }

    const violations: string[] = [];
    const limits = agent.riskLimits;
    const performance = this.performances.get(agentId);
    const status = this.agentStatuses.get(agentId);

    // Check daily trade limit
    if (status && status.decisionsToday >= limits.maxTradesPerDay) {
      violations.push('Daily trade limit exceeded');
    }

    // Check symbol restrictions
    if (decision.symbol) {
      if (limits.allowedSymbols && !limits.allowedSymbols.includes(decision.symbol)) {
        violations.push(`Symbol ${decision.symbol} not in allowed list`);
      }
      if (limits.blockedSymbols && limits.blockedSymbols.includes(decision.symbol)) {
        violations.push(`Symbol ${decision.symbol} is blocked`);
      }
    }

    // Check confidence threshold
    if (decision.confidence && decision.confidence < agent.parameters.confidenceMinimum) {
      violations.push('Confidence below minimum threshold');
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  // Cleanup
  async deleteAgent(agentId: string): Promise<void> {
    await this.stopAgent(agentId);
    
    this.agents.delete(agentId);
    this.agentStatuses.delete(agentId);
    this.decisions.delete(agentId);
    this.performances.delete(agentId);

    this.emit('agent:deleted', { agentId });
  }
}

// Create singleton instance
let agentCore: FinancialAgentCore | null = null;

export function createFinancialAgentCore(): FinancialAgentCore {
  if (!agentCore) {
    agentCore = new FinancialAgentCore();
  }
  return agentCore;
}