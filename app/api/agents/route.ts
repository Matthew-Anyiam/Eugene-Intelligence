import { NextRequest, NextResponse } from 'next/server';
import { createFinancialAgentCore } from '@/lib/agents/financial-agent-core';
import { createAutonomousTradingAgent } from '@/lib/agents/trading-agents';
import { createAutonomousResearchAgent } from '@/lib/agents/research-agents';
import { createAutonomousPortfolioAgent } from '@/lib/agents/portfolio-agents';
import { createAutonomousRiskAgent } from '@/lib/agents/risk-management-agents';

// Create singleton instances
const agentCore = createFinancialAgentCore();

// Mock AI models for demonstration
const mockAIModels = {
  claude: async (prompt: string, data: any) => {
    // Simulate AI model response
    return JSON.stringify({
      action: 'hold',
      confidence: 0.7,
      reasoning: 'Market conditions suggest cautious approach',
      analysis: 'Comprehensive analysis completed'
    });
  },
  gpt: async (prompt: string, data: any) => {
    return JSON.stringify({
      action: 'buy',
      confidence: 0.8,
      reasoning: 'Strong fundamentals and technical indicators',
      analysis: 'Positive outlook identified'
    });
  },
  grok: async (prompt: string, data: any) => {
    return JSON.stringify({
      action: 'sell',
      confidence: 0.6,
      reasoning: 'Risk factors outweigh potential returns',
      analysis: 'Risk assessment completed'
    });
  },
  gemini: async (prompt: string, data: any) => {
    return JSON.stringify({
      recommendation: 'buy',
      confidence: 0.75,
      reasoning: 'Growth potential identified'
    });
  },
  qwen: async (prompt: string, data: any) => {
    return JSON.stringify({
      signal: 'neutral',
      confidence: 0.65
    });
  },
  llama: async (prompt: string, data: any) => {
    return JSON.stringify({
      decision: 'monitor',
      confidence: 0.70
    });
  }
};

// Create agent instances
const tradingAgent = createAutonomousTradingAgent(mockAIModels);
const researchAgent = createAutonomousResearchAgent(mockAIModels);
const portfolioAgent = createAutonomousPortfolioAgent(mockAIModels);
const riskAgent = createAutonomousRiskAgent(mockAIModels);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agentId = searchParams.get('agentId');

    switch (action) {
      case 'list':
        const agents = agentCore.getAllAgents();
        return NextResponse.json({ agents });

      case 'status':
        const systemStatus = agentCore.getSystemStatus();
        return NextResponse.json({ status: systemStatus });

      case 'agent':
        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        const agent = agentCore.getAgent(agentId);
        if (!agent) {
          return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }
        
        const agentStatus = agentCore.getAgentStatus(agentId);
        const agentPerformance = agentCore.getAgentPerformance(agentId);
        const agentDecisions = agentCore.getAgentDecisions(agentId, 20);
        
        return NextResponse.json({
          agent,
          status: agentStatus,
          performance: agentPerformance,
          decisions: agentDecisions
        });

      case 'decisions':
        const allDecisions = agentId 
          ? agentCore.getAgentDecisions(agentId, 50)
          : agentCore.getAllAgents().flatMap(a => agentCore.getAgentDecisions(a.id, 10));
        
        return NextResponse.json({ decisions: allDecisions });

      case 'mock_data':
        // Return mock data for frontend development
        const mockAgents = [
          {
            id: 'agent_trading_001',
            name: 'Alpha Trading Agent',
            type: 'trading',
            status: 'active',
            isActive: true,
            uptime: 2456, // minutes
            performance: {
              totalReturn: 15.4,
              winRate: 68.5,
              sharpeRatio: 1.82,
              maxDrawdown: -4.2,
              totalTrades: 142
            },
            riskLimits: {
              maxDailyLoss: 50000,
              maxPositionSize: 100000,
              maxLeverage: 2.0
            },
            lastDecision: new Date(Date.now() - 5 * 60 * 1000),
            decisionsToday: 23,
            currentTask: 'Analyzing AAPL momentum',
            health: 'healthy'
          },
          {
            id: 'agent_research_001',
            name: 'Market Research AI',
            type: 'research',
            status: 'active',
            isActive: true,
            uptime: 3421,
            performance: {
              totalReturn: 0,
              winRate: 0,
              sharpeRatio: 0,
              maxDrawdown: 0,
              totalTrades: 0
            },
            riskLimits: {
              maxDailyLoss: 0,
              maxPositionSize: 0,
              maxLeverage: 0
            },
            lastDecision: new Date(Date.now() - 2 * 60 * 1000),
            decisionsToday: 15,
            currentTask: 'Scanning earnings opportunities',
            health: 'healthy'
          },
          {
            id: 'agent_portfolio_001',
            name: 'Portfolio Optimizer',
            type: 'portfolio',
            status: 'active',
            isActive: true,
            uptime: 1834,
            performance: {
              totalReturn: 12.1,
              winRate: 0,
              sharpeRatio: 1.45,
              maxDrawdown: -2.8,
              totalTrades: 0
            },
            riskLimits: {
              maxDailyLoss: 25000,
              maxPositionSize: 0,
              maxLeverage: 1.5
            },
            lastDecision: new Date(Date.now() - 15 * 60 * 1000),
            decisionsToday: 8,
            currentTask: 'Rebalancing portfolio',
            health: 'healthy'
          },
          {
            id: 'agent_risk_001',
            name: 'Risk Guardian',
            type: 'risk',
            status: 'active',
            isActive: true,
            uptime: 4521,
            performance: {
              totalReturn: 0,
              winRate: 0,
              sharpeRatio: 0,
              maxDrawdown: 0,
              totalTrades: 0
            },
            riskLimits: {
              maxDailyLoss: 0,
              maxPositionSize: 0,
              maxLeverage: 0
            },
            lastDecision: new Date(Date.now() - 1 * 60 * 1000),
            decisionsToday: 47,
            currentTask: 'Monitoring portfolio risk',
            health: 'healthy'
          }
        ];

        const mockDecisions = [
          {
            id: 'dec_001',
            agentId: 'agent_trading_001',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            action: 'buy',
            symbol: 'AAPL',
            confidence: 0.85,
            reasoning: 'Strong momentum with bullish technical indicators',
            outcome: 'success',
            risk: 'medium'
          },
          {
            id: 'dec_002',
            agentId: 'agent_research_001',
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            action: 'analyze',
            symbol: 'TSLA',
            confidence: 0.92,
            reasoning: 'Earnings report analysis completed',
            outcome: 'success',
            risk: 'low'
          },
          {
            id: 'dec_003',
            agentId: 'agent_trading_001',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            action: 'sell',
            symbol: 'NVDA',
            confidence: 0.78,
            reasoning: 'Technical resistance reached, taking profits',
            outcome: 'success',
            risk: 'low'
          }
        ];

        const mockAlerts = [
          {
            id: 'alert_001',
            type: 'position',
            severity: 'medium',
            title: 'Position Concentration Warning',
            message: 'NVDA position exceeds 15% of portfolio weight',
            agentId: 'agent_risk_001',
            createdAt: new Date(Date.now() - 30 * 60 * 1000),
            acknowledged: false
          },
          {
            id: 'alert_002',
            type: 'market',
            severity: 'high',
            title: 'Elevated Market Volatility',
            message: 'VIX level above threshold at 28.5',
            agentId: 'agent_risk_001',
            createdAt: new Date(Date.now() - 45 * 60 * 1000),
            acknowledged: true
          }
        ];

        return NextResponse.json({
          agents: mockAgents,
          decisions: mockDecisions,
          alerts: mockAlerts,
          systemStatus: {
            totalAgents: mockAgents.length,
            activeAgents: mockAgents.filter(a => a.status === 'active').length,
            totalDecisions: mockDecisions.length,
            avgPerformance: 13.8,
            systemHealth: 'healthy'
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_agent':
        const agentConfig = {
          name: data.name || 'New Agent',
          type: data.type || 'trading',
          description: data.description || '',
          isActive: false,
          riskLimits: data.riskLimits || {
            maxPositionSize: 100000,
            maxDailyLoss: 10000,
            maxWeeklyLoss: 50000,
            maxMonthlyLoss: 200000,
            maxExposure: 500000,
            maxLeverage: 2.0,
            maxTradesPerDay: 20
          },
          parameters: data.parameters || {
            models: ['claude', 'gpt'],
            dataFrequency: 'minute',
            analysisDepth: 'standard',
            decisionThreshold: 0.7,
            confidenceMinimum: 0.6,
            customSettings: {}
          },
          capabilities: data.capabilities || ['market_analysis', 'risk_assessment']
        };

        const newAgent = await agentCore.createAgent(agentConfig);
        return NextResponse.json({ agent: newAgent });

      case 'start_agent':
        if (!data.agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        await agentCore.startAgent(data.agentId);
        return NextResponse.json({ success: true, message: 'Agent started' });

      case 'stop_agent':
        if (!data.agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        await agentCore.stopAgent(data.agentId);
        return NextResponse.json({ success: true, message: 'Agent stopped' });

      case 'pause_agent':
        if (!data.agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        await agentCore.pauseAgent(data.agentId);
        return NextResponse.json({ success: true, message: 'Agent paused' });

      case 'update_agent':
        if (!data.agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        const updatedAgent = await agentCore.updateAgentConfiguration(data.agentId, data.config);
        return NextResponse.json({ agent: updatedAgent });

      case 'delete_agent':
        if (!data.agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }
        
        await agentCore.deleteAgent(data.agentId);
        return NextResponse.json({ success: true, message: 'Agent deleted' });

      case 'generate_trading_signal':
        if (!data.symbol || !data.strategy) {
          return NextResponse.json({ error: 'Symbol and strategy required' }, { status: 400 });
        }
        
        const signal = await tradingAgent.generateTradingSignal(data.symbol, data.strategy);
        return NextResponse.json({ signal });

      case 'analyze_company':
        if (!data.symbol) {
          return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }
        
        const analysis = await researchAgent.analyzeCompany(data.symbol);
        return NextResponse.json({ analysis });

      case 'scan_opportunities':
        const opportunities = await researchAgent.scanMarketOpportunities(data.sector);
        return NextResponse.json({ opportunities });

      case 'optimize_portfolio':
        if (!data.portfolioId || !data.objective) {
          return NextResponse.json({ error: 'Portfolio ID and objective required' }, { status: 400 });
        }
        
        const optimization = await portfolioAgent.optimizePortfolio(
          data.portfolioId,
          data.objective,
          data.constraints
        );
        return NextResponse.json({ optimization });

      case 'generate_risk_report':
        if (!data.portfolioId) {
          return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
        }
        
        const riskReport = await riskAgent.generateRiskReport(data.portfolioId, data.type || 'daily');
        return NextResponse.json({ report: riskReport });

      case 'acknowledge_alert':
        if (!data.alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }
        
        riskAgent.acknowledgeAlert(data.alertId);
        return NextResponse.json({ success: true, message: 'Alert acknowledged' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agents API POST error:', error);
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}