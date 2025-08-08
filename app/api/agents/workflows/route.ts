import { NextRequest, NextResponse } from 'next/server';
import { createAutonomousFinancialAgents } from '@/lib/agents/autonomous-financial-agents';

const agentsSystem = createAutonomousFinancialAgents();

export async function GET(request: NextRequest) {
  try {
    // Get all active workflows
    const workflows = Array.from(agentsSystem['coordination'].workflows.values());
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowId, ...workflowData } = body;

    switch (action) {
      case 'create':
        const workflow = await agentsSystem.createWorkflow(workflowData);
        return NextResponse.json(workflow);
      
      case 'execute':
        if (!workflowId) {
          return NextResponse.json(
            { error: 'Workflow ID required' },
            { status: 400 }
          );
        }
        const result = await agentsSystem.executeWorkflow(workflowId);
        return NextResponse.json(result);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in workflows API:', error);
    return NextResponse.json(
      { error: 'Failed to process workflow request' },
      { status: 500 }
    );
  }
}