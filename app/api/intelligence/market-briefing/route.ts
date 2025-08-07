import { NextRequest, NextResponse } from "next/server";
import { createMarketBriefingEngine } from "@/lib/intelligence/market-briefings";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const date = searchParams.get('date'); // YYYY-MM-DD format
    
    // Default user preferences if not provided
    const defaultPreferences = {
      sectors: ['Technology', 'Healthcare', 'Financial Services'],
      watchlist: ['AAPL', 'MSFT', 'GOOGL', 'TSLA'],
      riskTolerance: 'moderate' as const,
      investmentStyle: 'growth' as const,
      focusAreas: ['earnings', 'macro', 'technical'] as ('earnings' | 'macro' | 'technical' | 'options' | 'commodities')[],
      region: 'us' as const,
      briefingLength: 'medium' as const
    };

    const briefingEngine = createMarketBriefingEngine();
    
    // Generate today's briefing by default
    const briefing = await briefingEngine.generateDailyBriefing(userId, defaultPreferences);
    
    return NextResponse.json({
      success: true,
      data: {
        briefing,
        metadata: {
          userId,
          requestDate: date || new Date().toISOString().split('T')[0],
          generatedAt: briefing.generatedAt.toISOString(),
          confidence: briefing.confidence
        }
      }
    });
  } catch (error) {
    console.error('Market briefing API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate market briefing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // Validate preferences structure
    const validatedPreferences = {
      sectors: preferences?.sectors || ['Technology', 'Healthcare'],
      watchlist: preferences?.watchlist || ['AAPL', 'MSFT'],
      riskTolerance: preferences?.riskTolerance || 'moderate',
      investmentStyle: preferences?.investmentStyle || 'balanced',
      focusAreas: preferences?.focusAreas || ['earnings', 'macro'],
      region: preferences?.region || 'us',
      briefingLength: preferences?.briefingLength || 'medium'
    };

    // Validate enum values
    const validRiskTolerance = ['conservative', 'moderate', 'aggressive'];
    const validInvestmentStyle = ['value', 'growth', 'momentum', 'dividend', 'balanced'];
    const validFocusAreas = ['earnings', 'macro', 'technical', 'options', 'commodities'];
    const validRegions = ['us', 'global', 'emerging'];
    const validLengths = ['short', 'medium', 'detailed'];

    if (!validRiskTolerance.includes(validatedPreferences.riskTolerance)) {
      validatedPreferences.riskTolerance = 'moderate';
    }
    
    if (!validInvestmentStyle.includes(validatedPreferences.investmentStyle)) {
      validatedPreferences.investmentStyle = 'balanced';
    }

    if (!validRegions.includes(validatedPreferences.region)) {
      validatedPreferences.region = 'us';
    }

    if (!validLengths.includes(validatedPreferences.briefingLength)) {
      validatedPreferences.briefingLength = 'medium';
    }

    // Filter focus areas
    validatedPreferences.focusAreas = validatedPreferences.focusAreas
      .filter((area: string) => validFocusAreas.includes(area));
    
    if (validatedPreferences.focusAreas.length === 0) {
      validatedPreferences.focusAreas = ['earnings', 'macro'];
    }

    const briefingEngine = createMarketBriefingEngine();
    
    const briefing = await briefingEngine.generateDailyBriefing(
      userId, 
      validatedPreferences as any
    );
    
    return NextResponse.json({
      success: true,
      data: {
        briefing,
        preferences: validatedPreferences,
        metadata: {
          userId,
          customPreferences: true,
          generatedAt: briefing.generatedAt.toISOString(),
          confidence: briefing.confidence
        }
      }
    });
  } catch (error) {
    console.error('Custom market briefing API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate custom market briefing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating user preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // In a real application, you would save these preferences to a database
    // For now, we'll just validate and return them
    
    const updatedPreferences = {
      userId,
      sectors: preferences?.sectors || [],
      watchlist: preferences?.watchlist || [],
      riskTolerance: preferences?.riskTolerance || 'moderate',
      investmentStyle: preferences?.investmentStyle || 'balanced',
      focusAreas: preferences?.focusAreas || ['earnings'],
      region: preferences?.region || 'us',
      briefingLength: preferences?.briefingLength || 'medium',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        message: 'Preferences updated successfully',
        preferences: updatedPreferences
      }
    });
  } catch (error) {
    console.error('Update preferences API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}