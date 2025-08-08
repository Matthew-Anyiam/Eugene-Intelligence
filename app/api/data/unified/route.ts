import { NextRequest, NextResponse } from 'next/server';
import { createInMemoryDataLayer } from '@/lib/data/in-memory-data-layer';
import { createUnifiedDataInterface } from '@/lib/data/unified-data-interface';

// Create singleton instances
const dataLayer = createInMemoryDataLayer();
const unifiedInterface = createUnifiedDataInterface(dataLayer);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const symbols = searchParams.get('symbols')?.split(',') || [];
    const realTime = searchParams.get('realTime') === 'true';

    switch (type) {
      case 'quotes':
        const quotes = await unifiedInterface.getQuotes({
          type: 'quote',
          symbols,
          parameters: { symbols, includeAfterHours: true },
          realTime,
          fallbackToCache: !realTime
        });
        return NextResponse.json(quotes);

      case 'fundamentals':
        const fundamentals = await unifiedInterface.getFundamentals({
          type: 'fundamental',
          symbols,
          parameters: { symbols, yearsBack: 5 },
          realTime: false
        });
        return NextResponse.json(fundamentals);

      case 'news':
        const news = await unifiedInterface.getNews({
          type: 'news',
          symbols,
          parameters: { 
            symbols: symbols.length > 0 ? symbols : undefined,
            limit: 20,
            timeRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              end: new Date()
            }
          },
          realTime
        });
        return NextResponse.json(news);

      case 'economic':
        const economic = await unifiedInterface.getEconomicData({
          type: 'economic',
          parameters: {
            indicators: searchParams.get('indicators')?.split(',') || ['GDP', 'INFLATION', 'UNEMPLOYMENT'],
            country: searchParams.get('country') || 'US'
          },
          realTime: false
        });
        return NextResponse.json(economic);

      case 'options':
        if (symbols.length === 0) {
          return NextResponse.json({ error: 'Symbol required for options data' }, { status: 400 });
        }
        
        const options = await unifiedInterface.getOptions({
          type: 'options',
          symbols,
          parameters: {
            symbol: symbols[0],
            expiration: searchParams.get('expiration') || undefined
          },
          realTime
        });
        return NextResponse.json(options);

      case 'status':
        const systemStatus = unifiedInterface.getSystemStatus();
        return NextResponse.json(systemStatus);

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Unified data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'subscribe':
        const subscriptionId = unifiedInterface.subscribeToQuotes(
          data.symbols || [],
          (quotes) => {
            // In a real implementation, this would use WebSocket or Server-Sent Events
            console.log('Real-time quotes:', quotes);
          }
        );
        return NextResponse.json({ subscriptionId });

      case 'unsubscribe':
        if (!data.subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
        }
        unifiedInterface.unsubscribe(data.subscriptionId);
        return NextResponse.json({ success: true });

      case 'ingest':
        // Allow external systems to push data into our layer
        if (!data.dataPoints || !Array.isArray(data.dataPoints)) {
          return NextResponse.json({ error: 'Invalid data points' }, { status: 400 });
        }
        
        await dataLayer.ingestData(data.dataPoints);
        return NextResponse.json({ success: true, count: data.dataPoints.length });

      case 'query':
        const results = await dataLayer.query(data.query);
        return NextResponse.json({ results });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Unified data API POST error:', error);
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}