import { NextRequest, NextResponse } from 'next/server';
import { createAutonomousFinancialAgents } from '@/lib/agents/autonomous-financial-agents';

const agentsSystem = createAutonomousFinancialAgents();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await agentsSystem.getSystemStatus();
        return NextResponse.json(status);
      
      case 'agents':
        const agents = await agentsSystem.getActiveAgents();
        return NextResponse.json(agents);
      
      default:
        const systemOverview = {
          status: await agentsSystem.getSystemStatus(),
          agents: await agentsSystem.getActiveAgents()
        };
        return NextResponse.json(systemOverview);
    }
  } catch (error) {
    console.error('Error in agents API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_task':
        const task = await agentsSystem.createTask(data);
        return NextResponse.json(task);
      
      case 'start_system':
        await agentsSystem.startAutonomousOperation();
        return NextResponse.json({ message: 'Autonomous system started' });
      
      case 'stop_system':
        await agentsSystem.stopAutonomousOperation();
        return NextResponse.json({ message: 'Autonomous system stopped' });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in agents API POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}