'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Bot, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Settings,
  Zap,
  TrendingUp
} from 'lucide-react';

interface AgentStatus {
  isRunning: boolean;
  activeAgents: number;
  pendingTasks: number;
  activeWorkflows: number;
  completedTasksToday: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'busy' | 'maintenance';
  completedTasks: number;
  successRate: number;
  lastActive: Date;
}

interface Task {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedAgent: string;
  createdAt: Date;
}

export default function AgentsDashboard() {
  const [systemStatus, setSystemStatus] = useState<AgentStatus | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [statusRes, agentsRes, tasksRes] = await Promise.all([
        fetch('/api/agents?action=status'),
        fetch('/api/agents?action=agents'),
        fetch('/api/agents/tasks')
      ]);

      const [status, agentsData, tasksData] = await Promise.all([
        statusRes.json(),
        agentsRes.json(),
        tasksRes.json()
      ]);

      setSystemStatus(status);
      setAgents(agentsData);
      setTasks(tasksData.slice(0, 10)); // Show latest 10 tasks
      setLoading(false);
    } catch (error) {
      console.error('Error fetching system data:', error);
      setLoading(false);
    }
  };

  const toggleSystem = async (start: boolean) => {
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: start ? 'start_system' : 'stop_system' })
      });
      fetchSystemData();
    } catch (error) {
      console.error('Error toggling system:', error);
    }
  };

  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAgentIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      portfolio_monitor: <TrendingUp className="h-4 w-4" />,
      risk_analyst: <AlertCircle className="h-4 w-4" />,
      research_assistant: <Bot className="h-4 w-4" />,
      compliance_officer: <CheckCircle className="h-4 w-4" />,
      market_watcher: <Activity className="h-4 w-4" />,
      execution_trader: <Zap className="h-4 w-4" />
    };
    return icons[type] || <Bot className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-purple-100 text-purple-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatUptime = (lastActive: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(lastActive).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading agents system...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* System Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <CardTitle>Autonomous Agents System</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(systemStatus?.systemHealth || 'healthy')}>
              {systemStatus?.systemHealth || 'Unknown'}
            </Badge>
            <Button
              size="sm"
              onClick={() => toggleSystem(!systemStatus?.isRunning)}
              className="flex items-center space-x-1"
            >
              {systemStatus?.isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {systemStatus?.activeAgents || 0}
              </div>
              <div className="text-sm text-gray-600">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {systemStatus?.pendingTasks || 0}
              </div>
              <div className="text-sm text-gray-600">Pending Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemStatus?.activeWorkflows || 0}
              </div>
              <div className="text-sm text-gray-600">Active Workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus?.completedTasksToday || 0}
              </div>
              <div className="text-sm text-gray-600">Tasks Today</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${systemStatus?.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus?.isRunning ? 'ON' : 'OFF'}
              </div>
              <div className="text-sm text-gray-600">System Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Active Agents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agents.length === 0 ? (
              <p className="text-gray-500">No active agents</p>
            ) : (
              agents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAgentIcon(agent.type)}
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-gray-600">
                        {agent.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={
                        agent.status === 'active' ? 'bg-green-100 text-green-800' :
                        agent.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                        agent.status === 'idle' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {agent.status}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {agent.completedTasks} tasks • {agent.successRate}% success
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatUptime(agent.lastActive)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-gray-500">No recent tasks</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTaskStatusIcon(task.status)}
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-600">
                        {task.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>Portfolio Analysis</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Bot className="h-6 w-6" />
              <span>Research Task</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <AlertCircle className="h-6 w-6" />
              <span>Risk Assessment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Activity className="h-6 w-6" />
              <span>Market Watch</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}