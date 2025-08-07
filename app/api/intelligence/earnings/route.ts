import { NextRequest, NextResponse } from "next/server";
import { createEarningsCallIntelligence } from "@/lib/intelligence/earnings-call-intelligence";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const action = searchParams.get('action') || 'upcoming';
    const days = parseInt(searchParams.get('days') || '7');

    const earningsIntelligence = createEarningsCallIntelligence();

    switch (action) {
      case 'upcoming':
        const upcomingCalls = await earningsIntelligence.getUpcomingEarningsCalls(days);
        
        // Filter by symbol if provided
        const filteredCalls = symbol 
          ? upcomingCalls.filter(call => call.symbol === symbol.toUpperCase())
          : upcomingCalls;

        return NextResponse.json({
          success: true,
          data: {
            calls: filteredCalls,
            count: filteredCalls.length,
            dateRange: {
              from: new Date().toISOString().split('T')[0],
              to: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          }
        });

      case 'live':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter required for live earnings tracking' },
            { status: 400 }
          );
        }

        const liveInsights = await earningsIntelligence.getLiveEarningsInsights(symbol.toUpperCase());
        
        return NextResponse.json({
          success: true,
          data: {
            ...liveInsights,
            symbol: symbol.toUpperCase(),
            timestamp: new Date().toISOString()
          }
        });

      case 'preview':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter required for earnings preview' },
            { status: 400 }
          );
        }

        const preview = await earningsIntelligence.generateEarningsPreview(symbol.toUpperCase());
        
        return NextResponse.json({
          success: true,
          data: {
            symbol: symbol.toUpperCase(),
            preview,
            generatedAt: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: upcoming, live, or preview' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Earnings API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch earnings data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, call, transcript, metrics } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    const earningsIntelligence = createEarningsCallIntelligence();

    switch (action) {
      case 'analyze':
        if (!call || !transcript || !metrics) {
          return NextResponse.json(
            { error: 'Call, transcript, and metrics are required for analysis' },
            { status: 400 }
          );
        }

        const analysis = await earningsIntelligence.analyzeEarningsCall(call, transcript, metrics);
        
        return NextResponse.json({
          success: true,
          data: {
            analysis,
            metadata: {
              symbol: call.symbol,
              quarter: call.quarter,
              year: call.year,
              analysisDate: new Date().toISOString()
            }
          }
        });

      case 'batch_preview':
        const { symbols } = body;
        
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json(
            { error: 'Symbols array is required for batch preview' },
            { status: 400 }
          );
        }

        if (symbols.length > 10) {
          return NextResponse.json(
            { error: 'Maximum 10 symbols allowed for batch preview' },
            { status: 400 }
          );
        }

        const previews = await Promise.allSettled(
          symbols.map(symbol => 
            earningsIntelligence.generateEarningsPreview(symbol.toUpperCase())
          )
        );

        const results = symbols.map((symbol, index) => {
          const result = previews[index];
          
          if (result.status === 'fulfilled') {
            return {
              symbol: symbol.toUpperCase(),
              success: true,
              preview: result.value
            };
          } else {
            return {
              symbol: symbol.toUpperCase(),
              success: false,
              error: result.reason.message
            };
          }
        });

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
          success: successCount > 0,
          data: {
            results,
            summary: {
              total: symbols.length,
              successful: successCount,
              failed: symbols.length - successCount
            },
            generatedAt: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze or batch_preview' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Earnings POST API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process earnings request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}