import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import { createPolygonClient } from '@/lib/financial/polygon-client';
import { createNewsIntelligenceEngine } from '@/lib/intelligence/news-summarization';
import { createAIResearchAgent } from '@/lib/research/ai-research-agents';
import { createAdvancedAnalyticsEngine } from '@/lib/terminal/advanced-analytics-engine';
import { createMarketBriefingEngine } from '@/lib/intelligence/market-briefings';
import { z } from 'zod';

export interface AgentTask {
  id: string;
  name: string;
  type: 'analysis' | 'monitoring' | 'execution' | 'research' | 'reporting' | 'compliance';
  description: string;
  parameters: Record<string, any>;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignedAgent: string;
  createdBy: string;
  createdAt: Date;
  scheduledFor?: Date;
  deadline?: Date;
  dependencies?: string[];
  result?: any;
  errorMessage?: string;
  duration?: number;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: 'scheduled' | 'event' | 'manual' | 'market_condition';
  triggerConditions: Record<string, any>;
  tasks: AgentTask[];
  status: 'active' | 'paused' | 'completed' | 'failed';
  createdBy: string;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successRate: number;
}

export interface FinancialAgent {
  id: string;
  name: string;
  type: 'portfolio_monitor' | 'risk_analyst' | 'research_assistant' | 'compliance_officer' | 'execution_trader' | 'market_watcher';
  description: string;
  capabilities: string[];
  specialization: string[];
  status: 'active' | 'idle' | 'busy' | 'maintenance';
  currentTask?: string;
  completedTasks: number;
  successRate: number;
  lastActive: Date;
  configuration: Record<string, any>;
}

export interface AgentCoordination {
  activeAgents: Map<string, FinancialAgent>;
  taskQueue: AgentTask[];
  workflows: Map<string, AgentWorkflow>;
  executionHistory: Array<{
    taskId: string;
    agentId: string;
    startTime: Date;
    endTime?: Date;
    result?: any;
    error?: string;
  }>;
}

const TaskExecutionSchema = z.object({
  status: z.enum(['completed', 'failed']),
  result: z.any().optional(),
  insights: z.array(z.string()).describe("Key insights from task execution"),
  recommendations: z.array(z.object({
    action: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    timeframe: z.string(),
    rationale: z.string()
  })),
  confidence: z.number().min(0).max(100).describe("Confidence in task execution"),
  nextSteps: z.array(z.string()).describe("Recommended next steps or follow-up tasks")
});

const WorkflowAnalysisSchema = z.object({
  shouldExecute: z.boolean().describe("Whether the workflow should be executed now"),
  reasoning: z.string().describe("Reasoning for the decision"),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  estimatedDuration: z.number().describe("Estimated duration in minutes"),
  resourceRequirements: z.array(z.string()).describe("Required resources or agents"),
  riskAssessment: z.string().describe("Risk assessment of executing this workflow")
});

export class AutonomousFinancialAgents {
  private aiProvider: any;
  private polygonClient: ReturnType<typeof createPolygonClient>;
  private newsEngine: ReturnType<typeof createNewsIntelligenceEngine>;
  private researchAgent: ReturnType<typeof createAIResearchAgent>;
  private analyticsEngine: ReturnType<typeof createAdvancedAnalyticsEngine>;
  private briefingEngine: ReturnType<typeof createMarketBriefingEngine>;
  
  private coordination: AgentCoordination;
  private executionInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor() {
    this.aiProvider = createAIProvider('claude-4');
    this.polygonClient = createPolygonClient();
    this.newsEngine = createNewsIntelligenceEngine();
    this.researchAgent = createAIResearchAgent();
    this.analyticsEngine = createAdvancedAnalyticsEngine();
    this.briefingEngine = createMarketBriefingEngine();
    
    this.coordination = {
      activeAgents: new Map(),
      taskQueue: [],
      workflows: new Map(),
      executionHistory: []
    };

    this.initializeDefaultAgents();
    this.initializeDefaultWorkflows();
  }

  // Agent Management
  async registerAgent(agent: Omit<FinancialAgent, 'id' | 'completedTasks' | 'successRate' | 'lastActive'>): Promise<FinancialAgent> {
    const newAgent: FinancialAgent = {
      ...agent,
      id: `agent_${Date.now()}`,
      completedTasks: 0,
      successRate: 100,
      lastActive: new Date()
    };

    this.coordination.activeAgents.set(newAgent.id, newAgent);
    return newAgent;
  }

  async getAgent(agentId: string): Promise<FinancialAgent | null> {
    return this.coordination.activeAgents.get(agentId) || null;
  }

  async getActiveAgents(): Promise<FinancialAgent[]> {
    return Array.from(this.coordination.activeAgents.values()).filter(agent => 
      agent.status === 'active' || agent.status === 'idle'
    );
  }

  async updateAgentStatus(agentId: string, status: FinancialAgent['status']): Promise<boolean> {
    const agent = this.coordination.activeAgents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActive = new Date();
      return true;
    }
    return false;
  }

  // Task Management
  async createTask(task: Omit<AgentTask, 'id' | 'status' | 'createdAt'>): Promise<AgentTask> {
    const newTask: AgentTask = {
      ...task,
      id: `task_${Date.now()}`,
      status: 'pending',
      createdAt: new Date()
    };

    this.coordination.taskQueue.push(newTask);
    return newTask;
  }

  async executeTask(taskId: string): Promise<any> {
    const task = this.coordination.taskQueue.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const agent = this.coordination.activeAgents.get(task.assignedAgent);
    if (!agent) {
      throw new Error(`Agent ${task.assignedAgent} not found`);
    }

    const startTime = Date.now();
    task.status = 'in_progress';
    agent.status = 'busy';
    agent.currentTask = taskId;

    const executionRecord = {
      taskId,
      agentId: agent.id,
      startTime: new Date()
    };

    try {
      const result = await this.delegateTaskExecution(task, agent);
      
      task.status = 'completed';
      task.result = result;
      task.duration = Date.now() - startTime;
      
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.completedTasks += 1;
      agent.lastActive = new Date();

      executionRecord.endTime = new Date();
      executionRecord.result = result;
      this.coordination.executionHistory.push(executionRecord);

      return result;
    } catch (error) {
      task.status = 'failed';
      task.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.lastActive = new Date();

      executionRecord.endTime = new Date();
      executionRecord.error = task.errorMessage;
      this.coordination.executionHistory.push(executionRecord);

      throw error;
    }
  }

  private async delegateTaskExecution(task: AgentTask, agent: FinancialAgent): Promise<any> {
    const prompt = `Execute this financial analysis task as a ${agent.type} agent:

TASK: ${task.name}
TYPE: ${task.type}
DESCRIPTION: ${task.description}
PARAMETERS: ${JSON.stringify(task.parameters, null, 2)}

AGENT CAPABILITIES:
${agent.capabilities.join('\n- ')}

SPECIALIZATION:
${agent.specialization.join('\n- ')}

Execute the task and provide detailed results, insights, and recommendations.
Focus on actionable intelligence for institutional investors and portfolio managers.`;

    try {
      // Route task execution based on type and agent specialization
      let result;
      
      switch (task.type) {
        case 'analysis':
          result = await this.executeAnalysisTask(task, agent);
          break;
        case 'monitoring':
          result = await this.executeMonitoringTask(task, agent);
          break;
        case 'research':
          result = await this.executeResearchTask(task, agent);
          break;
        case 'reporting':
          result = await this.executeReportingTask(task, agent);
          break;
        case 'compliance':
          result = await this.executeComplianceTask(task, agent);
          break;
        default:
          result = await this.executeGenericTask(task, agent, prompt);
      }

      // Enhance result with AI analysis
      const aiAnalysis = await generateObject({
        model: this.aiProvider,
        schema: TaskExecutionSchema,
        prompt: `Analyze the task execution result and provide insights:

Task: ${task.name}
Agent: ${agent.type}
Result: ${JSON.stringify(result, null, 2)}

Provide professional analysis with insights and recommendations.`
      });

      return {
        ...result,
        aiAnalysis: aiAnalysis.object
      };
    } catch (error) {
      console.error(`Task execution failed for ${task.id}:`, error);
      throw error;
    }
  }

  private async executeAnalysisTask(task: AgentTask, agent: FinancialAgent): Promise<any> {
    switch (agent.type) {
      case 'portfolio_monitor':
        if (task.parameters.positions) {
          const metrics = await this.analyticsEngine.calculatePortfolioMetrics(task.parameters.positions);
          const riskMetrics = await this.analyticsEngine.calculateRiskMetrics(task.parameters.positions);
          return { portfolioMetrics: metrics, riskMetrics };
        }
        break;
      case 'risk_analyst':
        if (task.parameters.positions) {
          const stressTests = await this.analyticsEngine.performStressTests(task.parameters.positions);
          const monteCarloResults = await this.analyticsEngine.runMonteCarloSimulation(task.parameters.positions);
          return { stressTests, monteCarloResults };
        }
        break;
    }
    
    return { message: 'Analysis task completed', timestamp: new Date() };
  }

  private async executeMonitoringTask(task: AgentTask, agent: FinancialAgent): Promise<any> {
    switch (agent.type) {
      case 'market_watcher':
        if (task.parameters.symbols) {
          const newsDigest = await this.newsEngine.getIntelligentNewsDigest(task.parameters.symbols);
          const alerts = this.generateMarketAlerts(newsDigest);
          return { newsDigest, alerts };
        }
        break;
    }
    
    return { message: 'Monitoring task completed', timestamp: new Date() };
  }

  private async executeResearchTask(task: AgentTask, agent: FinancialAgent): Promise<any> {
    if (agent.type === 'research_assistant' && task.parameters.query) {
      const research = await this.researchAgent.executeResearch({
        id: `research_${Date.now()}`,
        query: task.parameters.query,
        type: task.parameters.researchType || 'company_analysis',
        parameters: task.parameters,
        requiredSources: task.parameters.sources || ['financial_data', 'news'],
        depth: task.parameters.depth || 'standard',
        userId: task.createdBy,
        createdAt: new Date()
      });
      
      return { research };
    }
    
    return { message: 'Research task completed', timestamp: new Date() };
  }

  private async executeReportingTask(task: AgentTask, agent: FinancialAgent): Promise<any> {
    if (task.parameters.reportType === 'daily_briefing') {
      const briefing = await this.briefingEngine.generateDailyBriefing(
        task.createdBy,
        task.parameters.preferences
      );
      return { briefing };
    }
    
    return { message: 'Reporting task completed', timestamp: new Date() };
  }

  private async executeComplianceTask(task: AgentTask, agent: FinancialAgent): Promise<any> {
    // Mock compliance task execution
    return {
      complianceCheck: 'passed',
      violations: [],
      recommendations: ['Regular monitoring advised'],
      timestamp: new Date()
    };
  }

  private async executeGenericTask(task: AgentTask, agent: FinancialAgent, prompt: string): Promise<any> {
    const result = await generateText({
      model: this.aiProvider,
      prompt
    });

    return {
      analysis: result.text,
      timestamp: new Date()
    };
  }

  // Workflow Management
  async createWorkflow(workflow: Omit<AgentWorkflow, 'id' | 'status' | 'runCount' | 'successRate'>): Promise<AgentWorkflow> {
    const newWorkflow: AgentWorkflow = {
      ...workflow,
      id: `workflow_${Date.now()}`,
      status: 'active',
      runCount: 0,
      successRate: 100
    };

    this.coordination.workflows.set(newWorkflow.id, newWorkflow);
    return newWorkflow;
  }

  async executeWorkflow(workflowId: string): Promise<any> {
    const workflow = this.coordination.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const shouldExecute = await this.evaluateWorkflowExecution(workflow);
    if (!shouldExecute.shouldExecute) {
      return { skipped: true, reason: shouldExecute.reasoning };
    }

    const results = [];
    workflow.lastRun = new Date();
    workflow.runCount += 1;

    try {
      // Execute tasks in dependency order
      const orderedTasks = this.resolveDependencies(workflow.tasks);
      
      for (const task of orderedTasks) {
        const result = await this.executeTask(task.id);
        results.push({ taskId: task.id, result });
      }

      workflow.status = 'completed';
      return { results, completedAt: new Date() };
    } catch (error) {
      workflow.status = 'failed';
      throw error;
    }
  }

  private async evaluateWorkflowExecution(workflow: AgentWorkflow): Promise<any> {
    const prompt = `Evaluate whether this financial workflow should be executed now:

WORKFLOW: ${workflow.name}
DESCRIPTION: ${workflow.description}
TRIGGER: ${workflow.trigger}
TRIGGER CONDITIONS: ${JSON.stringify(workflow.triggerConditions)}
LAST RUN: ${workflow.lastRun || 'Never'}
SUCCESS RATE: ${workflow.successRate}%

Current market conditions and system status should be considered.
Provide analysis of whether execution is appropriate at this time.`;

    try {
      const evaluation = await generateObject({
        model: this.aiProvider,
        schema: WorkflowAnalysisSchema,
        prompt
      });

      return evaluation.object;
    } catch (error) {
      // Fallback decision
      return {
        shouldExecute: true,
        reasoning: 'Default execution approved',
        priority: 'medium',
        estimatedDuration: 30,
        resourceRequirements: ['general'],
        riskAssessment: 'Low risk'
      };
    }
  }

  private resolveDependencies(tasks: AgentTask[]): AgentTask[] {
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const resolved: AgentTask[] = [];
    const visited = new Set<string>();

    function resolveDeps(task: AgentTask) {
      if (visited.has(task.id)) return;
      visited.add(task.id);

      if (task.dependencies) {
        for (const depId of task.dependencies) {
          const depTask = taskMap.get(depId);
          if (depTask) {
            resolveDeps(depTask);
          }
        }
      }

      resolved.push(task);
    }

    tasks.forEach(resolveDeps);
    return resolved;
  }

  // Autonomous Operation
  async startAutonomousOperation(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('Starting autonomous financial agents system...');

    // Check for pending tasks and workflows every 30 seconds
    this.executionInterval = setInterval(async () => {
      await this.processPendingTasks();
      await this.evaluateScheduledWorkflows();
    }, 30000);
  }

  async stopAutonomousOperation(): Promise<void> {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = undefined;
    }
    this.isRunning = false;
    console.log('Autonomous financial agents system stopped');
  }

  private async processPendingTasks(): Promise<void> {
    const pendingTasks = this.coordination.taskQueue
      .filter(task => task.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    for (const task of pendingTasks.slice(0, 3)) { // Process up to 3 tasks concurrently
      const agent = this.coordination.activeAgents.get(task.assignedAgent);
      if (agent && agent.status === 'idle') {
        try {
          await this.executeTask(task.id);
        } catch (error) {
          console.error(`Failed to execute task ${task.id}:`, error);
        }
      }
    }
  }

  private async evaluateScheduledWorkflows(): Promise<void> {
    const workflows = Array.from(this.coordination.workflows.values())
      .filter(workflow => workflow.status === 'active');

    for (const workflow of workflows) {
      if (this.shouldRunWorkflow(workflow)) {
        try {
          await this.executeWorkflow(workflow.id);
        } catch (error) {
          console.error(`Failed to execute workflow ${workflow.id}:`, error);
        }
      }
    }
  }

  private shouldRunWorkflow(workflow: AgentWorkflow): boolean {
    if (workflow.trigger === 'manual') return false;
    
    if (workflow.trigger === 'scheduled' && workflow.nextRun) {
      return new Date() >= workflow.nextRun;
    }
    
    // Add more trigger condition evaluation logic here
    return false;
  }

  // Utility Methods
  private generateMarketAlerts(newsDigest: any): Array<{ type: string; message: string; priority: string }> {
    const alerts = [];
    
    if (newsDigest.sentimentReport?.highImpactNews?.length > 0) {
      alerts.push({
        type: 'news_alert',
        message: `High impact news detected: ${newsDigest.sentimentReport.highImpactNews.length} stories`,
        priority: 'high'
      });
    }

    if (newsDigest.themes?.length > 0) {
      alerts.push({
        type: 'theme_alert',
        message: `Market themes identified: ${newsDigest.themes.map((t: any) => t.theme).join(', ')}`,
        priority: 'medium'
      });
    }

    return alerts;
  }

  // Initialize default agents and workflows
  private initializeDefaultAgents(): void {
    const defaultAgents = [
      {
        name: 'Portfolio Guardian',
        type: 'portfolio_monitor' as const,
        description: 'Monitors portfolio performance and risk metrics',
        capabilities: ['portfolio_analysis', 'performance_tracking', 'risk_monitoring'],
        specialization: ['equity_portfolios', 'risk_management', 'performance_attribution'],
        status: 'active' as const,
        configuration: { checkInterval: 300000, alertThreshold: 0.02 }
      },
      {
        name: 'Market Sentinel',
        type: 'market_watcher' as const,
        description: 'Monitors market conditions and news flow',
        capabilities: ['market_monitoring', 'news_analysis', 'sentiment_tracking'],
        specialization: ['equity_markets', 'news_intelligence', 'technical_analysis'],
        status: 'active' as const,
        configuration: { newsUpdateInterval: 600000, sentimentThreshold: 0.3 }
      },
      {
        name: 'Research Analyst',
        type: 'research_assistant' as const,
        description: 'Conducts comprehensive financial research and analysis',
        capabilities: ['fundamental_analysis', 'company_research', 'sector_analysis'],
        specialization: ['equity_research', 'financial_modeling', 'valuation_analysis'],
        status: 'active' as const,
        configuration: { researchDepth: 'comprehensive', updateFrequency: 'daily' }
      },
      {
        name: 'Risk Analyst',
        type: 'risk_analyst' as const,
        description: 'Performs advanced risk analysis and stress testing',
        capabilities: ['var_calculation', 'stress_testing', 'correlation_analysis'],
        specialization: ['portfolio_risk', 'market_risk', 'scenario_analysis'],
        status: 'active' as const,
        configuration: { stressTestFrequency: 'weekly', confidenceLevel: 0.95 }
      },
      {
        name: 'Compliance Monitor',
        type: 'compliance_officer' as const,
        description: 'Ensures compliance with regulations and internal policies',
        capabilities: ['compliance_checking', 'regulatory_monitoring', 'policy_enforcement'],
        specialization: ['sec_compliance', 'risk_limits', 'reporting_requirements'],
        status: 'active' as const,
        configuration: { checkFrequency: 'continuous', alertLevel: 'immediate' }
      }
    ];

    defaultAgents.forEach(async agentData => {
      await this.registerAgent(agentData);
    });
  }

  private initializeDefaultWorkflows(): void {
    const defaultWorkflows = [
      {
        name: 'Daily Market Intelligence',
        description: 'Comprehensive daily market analysis and briefing generation',
        trigger: 'scheduled' as const,
        triggerConditions: { time: '07:00', timezone: 'EST' },
        tasks: [], // Tasks would be created dynamically
        createdBy: 'system'
      },
      {
        name: 'Risk Monitoring Cycle',
        description: 'Continuous portfolio risk monitoring and alerting',
        trigger: 'scheduled' as const,
        triggerConditions: { interval: 900000 }, // 15 minutes
        tasks: [],
        createdBy: 'system'
      },
      {
        name: 'News Event Response',
        description: 'Responds to high-impact news events with immediate analysis',
        trigger: 'event' as const,
        triggerConditions: { event: 'high_impact_news', threshold: 0.8 },
        tasks: [],
        createdBy: 'system'
      }
    ];

    defaultWorkflows.forEach(async workflowData => {
      await this.createWorkflow(workflowData);
    });
  }

  // Status and Metrics
  async getSystemStatus(): Promise<{
    isRunning: boolean;
    activeAgents: number;
    pendingTasks: number;
    activeWorkflows: number;
    completedTasksToday: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  }> {
    const activeAgents = Array.from(this.coordination.activeAgents.values())
      .filter(agent => agent.status === 'active' || agent.status === 'idle').length;
    
    const pendingTasks = this.coordination.taskQueue
      .filter(task => task.status === 'pending').length;
    
    const activeWorkflows = Array.from(this.coordination.workflows.values())
      .filter(workflow => workflow.status === 'active').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedTasksToday = this.coordination.executionHistory
      .filter(record => record.startTime >= today && record.result).length;

    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (activeAgents === 0) systemHealth = 'critical';
    else if (pendingTasks > 50) systemHealth = 'warning';

    return {
      isRunning: this.isRunning,
      activeAgents,
      pendingTasks,
      activeWorkflows,
      completedTasksToday,
      systemHealth
    };
  }
}

// Factory function
export function createAutonomousFinancialAgents(): AutonomousFinancialAgents {
  return new AutonomousFinancialAgents();
}

// Utility functions
export function getAgentTypeIcon(type: FinancialAgent['type']): string {
  const icons = {
    portfolio_monitor: '📊',
    risk_analyst: '⚠️',
    research_assistant: '🔍',
    compliance_officer: '🛡️',
    execution_trader: '⚡',
    market_watcher: '👁️'
  };
  
  return icons[type] || '🤖';
}

export function getTaskStatusColor(status: AgentTask['status']): string {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100';
    case 'in_progress': return 'text-blue-600 bg-blue-100';
    case 'failed': return 'text-red-600 bg-red-100';
    case 'cancelled': return 'text-gray-600 bg-gray-100';
    default: return 'text-yellow-600 bg-yellow-100';
  }
}

export function getPriorityColor(priority: AgentTask['priority']): string {
  switch (priority) {
    case 'critical': return 'text-purple-600 bg-purple-100';
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function formatAgentUptime(lastActive: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}