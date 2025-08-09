'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Bot,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Bell,
  Brain,
  Target,
  Zap,
  Clock,
  RefreshCw,
  Eye,
  Briefcase,
  Search,
  AlertCircle
} from 'lucide-react';

// Types for Agent Dashboard
interface Agent {
  id: string;
  name: string;
  type: 'trading' | 'research' | 'portfolio' | 'risk' | 'analysis';
  status: 'active' | 'paused' | 'stopped' | 'error';
  isActive: boolean;
  uptime: number;
  performance: {
    totalReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
  };
  riskLimits: {
    maxDailyLoss: number;
    maxPositionSize: number;
    maxLeverage: number;
  };
  lastDecision: Date;
  decisionsToday: number;
  currentTask?: string;
  health: 'healthy' | 'degraded' | 'error';
  errorMessage?: string;
}

interface AgentDecision {
  id: string;
  agentId: string;
  timestamp: Date;
  action: 'buy' | 'sell' | 'hold' | 'analyze' | 'alert';
  symbol?: string;
  confidence: number;
  reasoning: string;
  outcome?: 'pending' | 'success' | 'failure';
  risk: 'low' | 'medium' | 'high';
}

interface RiskAlert {
  id: string;
  type: 'position' | 'portfolio' | 'market' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  agentId: string;
  createdAt: Date;
  acknowledged: boolean;
}

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAgentData = async () => {
    try {
      // Fetch data from our API endpoint
      const response = await fetch('/api/agents?action=mock_data');
      if (!response.ok) {
        throw new Error('Failed to fetch agent data');
      }
      
      const data = await response.json();
      
      setAgents(data.agents || []);
      setDecisions(data.decisions || []);
      setRiskAlerts(data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching agent data:', error);
      
      // Fallback to mock data for demonstration
      const mockAgents: Agent[] = [
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
            totalReturn: 0, // Research agents don't have returns
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

      const mockDecisions: AgentDecision[] = [
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
        }
      ];

      const mockAlerts: RiskAlert[] = [
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

        setAgents(mockAgents);
        setDecisions(mockDecisions);
        setRiskAlerts(mockAlerts);
        setLoading(false);
      }
    }
  };

  const handleAgentAction = async (agentId: string, action: 'start' | 'stop' | 'pause') => {
    try {
      // API call to control agent
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `${action}_agent`,
          agentId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} agent`);
      }
      
      // Update local state
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { 
              ...agent, 
              status: action === 'start' ? 'active' : action === 'stop' ? 'stopped' : 'paused',
              isActive: action === 'start'
            }
          : agent
      ));
    } catch (error) {
      console.error(`Error ${action} agent:`, error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // API call to acknowledge alert
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge_alert',
          alertId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      setRiskAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getAgentTypeIcon = (type: Agent['type']) => {
    switch (type) {
      case 'trading': return <TrendingUp className="h-4 w-4" />;
      case 'research': return <Search className="h-4 w-4" />;
      case 'portfolio': return <Briefcase className="h-4 w-4" />;
      case 'risk': return <Shield className="h-4 w-4" />;
      case 'analysis': return <BarChart3 className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: RiskAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalDecisions = decisions.length;
  const unacknowledgedAlerts = riskAlerts.filter(a => !a.acknowledged).length;
  const avgPerformance = agents.filter(a => a.performance.totalReturn > 0)
    .reduce((sum, a) => sum + a.performance.totalReturn, 0) / Math.max(1, agents.filter(a => a.performance.totalReturn > 0).length);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading agent dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-green-600">{activeAgents}</p>
                <p className="text-xs text-gray-500">of {agents.length} total</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Decisions</p>
                <p className="text-2xl font-bold text-blue-600">{agents.reduce((sum, a) => sum + a.decisionsToday, 0)}</p>
                <p className="text-xs text-gray-500">across all agents</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className={`text-2xl font-bold ${avgPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {avgPerformance.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">portfolio return</p>
              </div>
              {avgPerformance >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Alerts</p>
                <p className={`text-2xl font-bold ${unacknowledgedAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {unacknowledgedAlerts}
                </p>
                <p className="text-xs text-gray-500">unacknowledged</p>
              </div>
              {unacknowledgedAlerts > 0 ? (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              ) : (
                <Shield className="h-8 w-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>Agent Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.filter(a => a.performance.totalReturn > 0).map(agent => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getAgentTypeIcon(agent.type)}
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${agent.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {agent.performance.totalReturn.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Sharpe: {agent.performance.sharpeRatio.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {decisions.slice(0, 5).map(decision => (
                    <div key={decision.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          decision.action === 'buy' ? 'bg-green-500' : 
                          decision.action === 'sell' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <span className="font-medium">{decision.action.toUpperCase()}</span>
                        {decision.symbol && <span className="text-gray-600">{decision.symbol}</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{(decision.confidence * 100).toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">
                          {decision.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{agents.reduce((sum, a) => sum + a.decisionsToday, 0)}</div>
                  <div className="text-sm text-gray-600">Decisions Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{agents.filter(a => a.health === 'healthy').length}</div>
                  <div className="text-sm text-gray-600">Healthy Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map(agent => (
              <Card key={agent.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getAgentTypeIcon(agent.type)}
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <p className="text-sm text-gray-600 capitalize">{agent.type} Agent</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                      <div className="flex space-x-1">
                        {agent.status === 'stopped' && (
                          <Button size="sm" onClick={() => handleAgentAction(agent.id, 'start')}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {agent.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleAgentAction(agent.id, 'pause')}>
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleAgentAction(agent.id, 'stop')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {agent.status === 'paused' && (
                          <Button size="sm" onClick={() => handleAgentAction(agent.id, 'start')}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Status */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Status</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Uptime:</span>
                          <span>{formatUptime(agent.uptime)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Decisions Today:</span>
                          <span>{agent.decisionsToday}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Current Task:</span>
                          <span className="text-gray-600 text-right">{agent.currentTask || 'Idle'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Health:</span>
                          <Badge className={agent.health === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {agent.health}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Performance */}
                    {agent.performance.totalReturn > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Performance</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Total Return:</span>
                            <span className={agent.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {agent.performance.totalReturn.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Win Rate:</span>
                            <span>{agent.performance.winRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Sharpe Ratio:</span>
                            <span>{agent.performance.sharpeRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Max Drawdown:</span>
                            <span className="text-red-600">{agent.performance.maxDrawdown.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Risk Limits */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Risk Limits</h4>
                      <div className="space-y-1">
                        {agent.riskLimits.maxDailyLoss > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Max Daily Loss:</span>
                            <span>${agent.riskLimits.maxDailyLoss.toLocaleString()}</span>
                          </div>
                        )}
                        {agent.riskLimits.maxPositionSize > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Max Position:</span>
                            <span>${agent.riskLimits.maxPositionSize.toLocaleString()}</span>
                          </div>
                        )}
                        {agent.riskLimits.maxLeverage > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Max Leverage:</span>
                            <span>{agent.riskLimits.maxLeverage.toFixed(1)}:1</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Recent AI Decisions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {decisions.map(decision => (
                  <div key={decision.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          decision.action === 'buy' ? 'bg-green-500' : 
                          decision.action === 'sell' ? 'bg-red-500' : 
                          decision.action === 'hold' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <span className="font-medium capitalize">{decision.action}</span>
                        {decision.symbol && (
                          <Badge variant="outline">{decision.symbol}</Badge>
                        )}
                        <Badge className={`${
                          decision.risk === 'low' ? 'bg-green-100 text-green-800' :
                          decision.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {decision.risk} risk
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {decision.timestamp.toLocaleString()}
                        </span>
                        {decision.outcome && (
                          <Badge className={decision.outcome === 'success' ? 'bg-green-100 text-green-800' : 
                            decision.outcome === 'failure' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                            {decision.outcome}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 flex-1">{decision.reasoning}</p>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium">Confidence</div>
                        <div className="text-lg font-bold">{(decision.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Risk Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskAlerts.map(alert => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">{alert.title}</span>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!alert.acknowledged && (
                          <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                        <span className="text-sm text-gray-500">
                          {alert.createdAt.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}