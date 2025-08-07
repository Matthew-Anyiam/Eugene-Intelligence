import { NextRequest, NextResponse } from "next/server";
import { createNewsIntelligenceEngine } from "@/lib/intelligence/news-summarization";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers');
    const limit = parseInt(searchParams.get('limit') || '10');
    const analysis = searchParams.get('analysis') || 'digest';

    const newsEngine = createNewsIntelligenceEngine();

    switch (analysis) {
      case 'digest':
        const tickerList = tickers ? tickers.split(',').map(t => t.trim().toUpperCase()) : undefined;
        const digest = await newsEngine.getIntelligentNewsDigest(tickerList, limit);
        
        return NextResponse.json({
          success: true,
          data: {
            ...digest,
            metadata: {
              tickers: tickerList,
              limit,
              generatedAt: new Date().toISOString()
            }
          }
        });

      case 'sentiment':
        const sentimentNews = await newsEngine.getLatestNews(
          tickers ? tickers.split(',').map(t => t.trim().toUpperCase()) : undefined,
          limit
        );
        
        const sentimentSummaries = await newsEngine.generateBulkNewsSummaries(sentimentNews);
        const sentimentReport = await newsEngine.generateMarketSentimentReport(sentimentSummaries);
        
        return NextResponse.json({
          success: true,
          data: {
            sentimentReport,
            summaryCount: sentimentSummaries.length,
            metadata: {
              tickers: tickers?.split(','),
              generatedAt: new Date().toISOString()
            }
          }
        });

      case 'themes':
        const themeNews = await newsEngine.getLatestNews(undefined, 20);
        const themeSummaries = await newsEngine.generateBulkNewsSummaries(themeNews);
        const themes = await newsEngine.identifyMarketThemes(themeSummaries);
        
        return NextResponse.json({
          success: true,
          data: {
            themes,
            newsAnalyzed: themeSummaries.length,
            metadata: {
              generatedAt: new Date().toISOString()
            }
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: digest, sentiment, or themes' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('News analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles, analysisType = 'summary' } = body;

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: 'Articles array is required' },
        { status: 400 }
      );
    }

    const newsEngine = createNewsIntelligenceEngine();

    switch (analysisType) {
      case 'summary':
        const summaries = await newsEngine.generateBulkNewsSummaries(articles);
        return NextResponse.json({
          success: true,
          data: { summaries }
        });

      case 'sentiment':
        const sentimentSummaries = await newsEngine.generateBulkNewsSummaries(articles);
        const sentimentReport = await newsEngine.generateMarketSentimentReport(sentimentSummaries);
        
        return NextResponse.json({
          success: true,
          data: { sentimentReport, summaries: sentimentSummaries }
        });

      case 'themes':
        const themeSummaries = await newsEngine.generateBulkNewsSummaries(articles);
        const themes = await newsEngine.identifyMarketThemes(themeSummaries);
        
        return NextResponse.json({
          success: true,
          data: { themes, summaries: themeSummaries }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('News analysis POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze provided articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}