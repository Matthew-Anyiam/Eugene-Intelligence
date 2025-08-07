import { NextRequest, NextResponse } from "next/server";
import { createPolygonClient } from "@/lib/financial/polygon-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');
    const type = searchParams.get('type') || 'quotes';

    const polygonClient = createPolygonClient();
    
    if (!polygonClient) {
      return NextResponse.json(
        { error: 'Financial data service not available' },
        { status: 503 }
      );
    }

    switch (type) {
      case 'indices':
        const indices = await polygonClient.getMarketIndices();
        return NextResponse.json({ success: true, data: indices });

      case 'movers':
        const movers = await polygonClient.getTopMovers();
        return NextResponse.json({ success: true, data: movers });

      case 'quotes':
        if (!symbols) {
          return NextResponse.json(
            { error: 'Symbols parameter required for quotes' },
            { status: 400 }
          );
        }
        
        const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
        const quotes = await polygonClient.getMultipleQuotes(symbolList);
        return NextResponse.json({ success: true, data: quotes });

      case 'company':
        if (!symbols) {
          return NextResponse.json(
            { error: 'Symbol parameter required for company info' },
            { status: 400 }
          );
        }
        
        const companyInfo = await polygonClient.getCompanyInfo(symbols);
        return NextResponse.json({ success: true, data: companyInfo });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Financial API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, action } = body;

    if (!symbols || !action) {
      return NextResponse.json(
        { error: 'Symbols and action required' },
        { status: 400 }
      );
    }

    const polygonClient = createPolygonClient();
    
    if (!polygonClient) {
      return NextResponse.json(
        { error: 'Financial data service not available' },
        { status: 503 }
      );
    }

    switch (action) {
      case 'batch_quotes':
        const batchQuotes = await polygonClient.getMultipleQuotes(symbols);
        return NextResponse.json({ success: true, data: batchQuotes });

      case 'search':
        const query = symbols[0]; // Use first symbol as search query
        const searchResults = await polygonClient.searchTickers(query);
        return NextResponse.json({ success: true, data: searchResults });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Financial API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}