import { NextRequest, NextResponse } from "next/server";
import { createPolygonClient } from "@/lib/financial/polygon-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers');
    const limit = parseInt(searchParams.get('limit') || '10');

    const polygonClient = createPolygonClient();
    
    if (!polygonClient) {
      return NextResponse.json(
        { error: 'Financial news service not available' },
        { status: 503 }
      );
    }

    const tickerList = tickers ? tickers.split(',').map(t => t.trim().toUpperCase()) : undefined;
    const news = await polygonClient.getNews(limit, tickerList);

    return NextResponse.json({
      success: true,
      data: {
        results: news,
        count: news.length,
        filters: {
          tickers: tickerList,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Financial news API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial news' },
      { status: 500 }
    );
  }
}