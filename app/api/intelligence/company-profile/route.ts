import { NextRequest, NextResponse } from "next/server";
import { createCompanyProfileBuilder } from "@/lib/intelligence/company-profile-builder";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const sections = searchParams.get('sections'); // comma-separated list of sections

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const profileBuilder = createCompanyProfileBuilder();
    
    // Generate complete company profile
    const profile = await profileBuilder.buildCompanyProfile(symbol.toUpperCase());

    // Filter sections if requested
    let filteredProfile = profile;
    if (sections) {
      const requestedSections = sections.split(',').map(s => s.trim());
      const allowedSections = [
        'basicInfo', 'financialMetrics', 'businessSegments', 
        'competitiveAnalysis', 'riskFactors', 'esgProfile',
        'recentNews', 'analystCoverage', 'keyEvents', 'investmentThesis'
      ];

      filteredProfile = Object.keys(profile)
        .filter(key => allowedSections.includes(key) && 
                      (requestedSections.includes(key) || !sections))
        .reduce((obj, key) => {
          (obj as any)[key] = (profile as any)[key];
          return obj;
        }, {} as typeof profile);
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: filteredProfile,
        metadata: {
          symbol: symbol.toUpperCase(),
          sectionsRequested: sections?.split(',') || 'all',
          generatedAt: new Date().toISOString(),
          confidence: profile.confidence
        }
      }
    });
  } catch (error) {
    console.error('Company profile API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate company profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, sections } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    if (symbols.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 symbols allowed per request' },
        { status: 400 }
      );
    }

    const profileBuilder = createCompanyProfileBuilder();
    
    // Generate profiles for all symbols
    const profiles = await Promise.allSettled(
      symbols.map(symbol => profileBuilder.buildCompanyProfile(symbol.toUpperCase()))
    );

    const results = symbols.map((symbol, index) => {
      const result = profiles[index];
      
      if (result.status === 'fulfilled') {
        let profile = result.value;
        
        // Filter sections if requested
        if (sections && Array.isArray(sections)) {
          const allowedSections = [
            'basicInfo', 'financialMetrics', 'businessSegments', 
            'competitiveAnalysis', 'riskFactors', 'esgProfile',
            'recentNews', 'analystCoverage', 'keyEvents', 'investmentThesis'
          ];

          profile = Object.keys(profile)
            .filter(key => allowedSections.includes(key) && sections.includes(key))
            .reduce((obj, key) => {
              (obj as any)[key] = (profile as any)[key];
              return obj;
            }, {} as typeof profile);
        }

        return {
          symbol: symbol.toUpperCase(),
          success: true,
          profile
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
        metadata: {
          sectionsRequested: sections || 'all',
          generatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Batch company profile API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate company profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}