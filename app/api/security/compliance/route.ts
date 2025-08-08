import { NextRequest, NextResponse } from 'next/server';
import { createEnterpriseSecurityFramework } from '@/lib/security/enterprise-security';

const securityFramework = createEnterpriseSecurityFramework();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'assessment':
        const compliance = await securityFramework.assessCompliance();
        return NextResponse.json(compliance);
      
      case 'audit-trail':
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
        const userId = searchParams.get('userId') || undefined;
        const actionFilter = searchParams.get('actionFilter') || undefined;

        const auditTrail = await securityFramework.getAuditTrail({
          startDate,
          endDate,
          userId,
          action: actionFilter
        });

        return NextResponse.json(auditTrail.slice(0, 100)); // Limit to 100 recent events
      
      default:
        const overallStatus = await securityFramework.assessCompliance();
        return NextResponse.json({
          compliance: overallStatus,
          recentAuditEvents: (await securityFramework.getAuditTrail({})).slice(0, 10)
        });
    }
  } catch (error) {
    console.error('Error in compliance API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'log_event':
        await securityFramework.logAuditEvent(
          data.action,
          data.resource,
          data.details,
          data.outcome,
          data.userId,
          data.sessionId
        );
        return NextResponse.json({ success: true });
      
      case 'evaluate_policy':
        const evaluation = await securityFramework.evaluateSecurityPolicy(
          data.userId,
          data.action,
          data.resource,
          data.context
        );
        return NextResponse.json(evaluation);
      
      case 'classify_data':
        const classification = await securityFramework.classifyData(
          data.dataType,
          data.content
        );
        return NextResponse.json(classification);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in compliance API POST:', error);
    return NextResponse.json(
      { error: 'Failed to process compliance request' },
      { status: 500 }
    );
  }
}