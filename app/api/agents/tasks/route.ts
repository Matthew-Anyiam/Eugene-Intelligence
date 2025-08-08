import { NextRequest, NextResponse } from 'next/server';
import { createAutonomousFinancialAgents } from '@/lib/agents/autonomous-financial-agents';

const agentsSystem = createAutonomousFinancialAgents();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const taskQueue = agentsSystem['coordination'].taskQueue;
    const tasks = status ? taskQueue.filter(task => task.status === status) : taskQueue;
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskId, ...taskData } = body;

    switch (action) {
      case 'create':
        const task = await agentsSystem.createTask(taskData);
        return NextResponse.json(task);
      
      case 'execute':
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID required' },
            { status: 400 }
          );
        }
        const result = await agentsSystem.executeTask(taskId);
        return NextResponse.json(result);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in tasks API:', error);
    return NextResponse.json(
      { error: 'Failed to process task request' },
      { status: 500 }
    );
  }
}