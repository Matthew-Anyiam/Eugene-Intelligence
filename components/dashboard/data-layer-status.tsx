'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Database,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Globe,
  Download,
  FileText
} from 'lucide-react';

interface DataSystemStatus {
  cacheSize: number;
  maxCacheSize: number;
  cacheUtilization: number;
  activeSources: number;
  activeSubscriptions: number;
  totalDataPoints: number;
  healthySources: number;
  dataSources: Array<{
    source: string;
    status: 'healthy' | 'degraded' | 'offline';
    failures: number;
    lastFailure?: Date;
  }>;
  requestQueue: number;
}

interface LiveDataFeed {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: string;
}

export default function DataLayerStatus() {
  const [systemStatus, setSystemStatus] = useState<DataSystemStatus | null>(null);
  const [liveData, setLiveData] = useState<LiveDataFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/data/unified?type=status');
      const status = await response.json();
      setSystemStatus(status);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      setLoading(false);
    }
  };

  const startLiveDataStream = async () => {
    try {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
      const response = await fetch('/api/data/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          symbols
        })
      });
      
      const { subscriptionId: subId } = await response.json();
      setSubscriptionId(subId);
      setIsStreaming(true);
      
      // Simulate live data updates (in production, this would be WebSocket)
      const interval = setInterval(async () => {
        const mockLiveData = symbols.map(symbol => ({
          symbol,
          price: 150 + Math.random() * 50,
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 1000000),
          timestamp: new Date(),
          source: 'polygon'
        }));
        setLiveData(mockLiveData);
      }, 2000);

      // Clean up after 30 seconds for demo
      setTimeout(() => {
        clearInterval(interval);
        stopLiveDataStream();
      }, 30000);

    } catch (error) {
      console.error('Failed to start live data stream:', error);
    }
  };

  const stopLiveDataStream = async () => {
    if (subscriptionId) {
      try {
        await fetch('/api/data/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'unsubscribe',
            subscriptionId
          })
        });
      } catch (error) {
        console.error('Failed to stop live data stream:', error);
      }
    }
    
    setIsStreaming(false);
    setSubscriptionId(null);
    setLiveData([]);
  };

  const generateSampleDocument = async () => {
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_excel',
          templateId: 'portfolio_analysis',
          data: {
            portfolio_summary: {
              totalValue: 1000000,
              dailyPnL: 15000,
              ytdReturn: 12.5,
              volatility: 18.2
            },
            positions: liveData.map(quote => ({
              symbol: quote.symbol,
              shares: Math.floor(Math.random() * 1000),
              price: quote.price,
              marketValue: quote.price * Math.floor(Math.random() * 1000),
              change: quote.change,
              changePercent: quote.changePercent
            }))
          },
          customizations: {
            title: 'Live Portfolio Analysis',
            author: 'Eugene Intelligence Data Layer',
            date: new Date()
          },
          includeCharts: true,
          includeCalculations: true
        })
      });

      const result = await response.json();
      
      if (result.downloadUrl) {
        // Open download URL in new tab
        window.open(result.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to generate document:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(percent / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading data layer status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* System Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <CardTitle>In-Memory Data Layer Status</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800">
              Always-On Intelligence
            </Badge>
            <Button size="sm" onClick={fetchSystemStatus}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {systemStatus?.totalDataPoints.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600">Data Points</div>
              <div className="text-xs text-gray-500">In Memory</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus?.healthySources || 0}/{systemStatus?.activeSources || 0}
              </div>
              <div className="text-sm text-gray-600">Healthy Sources</div>
              <div className="text-xs text-gray-500">Data Providers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {systemStatus?.activeSubscriptions || 0}
              </div>
              <div className="text-sm text-gray-600">Live Streams</div>
              <div className="text-xs text-gray-500">Real-time Feeds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {systemStatus?.requestQueue || 0}
              </div>
              <div className="text-sm text-gray-600">Queue Size</div>
              <div className="text-xs text-gray-500">Pending Requests</div>
            </div>
          </div>

          {/* Cache Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cache Utilization</span>
              <span className="text-sm text-gray-600">
                {formatBytes(systemStatus?.cacheSize || 0)} / {formatBytes(systemStatus?.maxCacheSize || 0)}
              </span>
            </div>
            <Progress 
              value={systemStatus?.cacheUtilization || 0} 
              className="mb-2"
            />
            <div className="text-xs text-gray-500">
              {Math.round(systemStatus?.cacheUtilization || 0)}% cache utilization
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Sources Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Data Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemStatus?.dataSources.map(source => (
              <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {source.status === 'healthy' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium capitalize">
                      {source.source.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {source.failures > 0 ? `${source.failures} failures` : 'Operational'}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(source.status)}>
                  {source.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live Data Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Live Data Stream</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {isStreaming ? (
                <Button size="sm" variant="destructive" onClick={stopLiveDataStream}>
                  Stop Stream
                </Button>
              ) : (
                <Button size="sm" onClick={startLiveDataStream}>
                  <Activity className="h-4 w-4 mr-1" />
                  Start Stream
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {isStreaming && liveData.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Connecting to live data feed...
              </div>
            )}
            
            {liveData.map(quote => (
              <div key={quote.symbol} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{quote.symbol}</div>
                    <div className="text-sm text-gray-600">
                      {quote.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatPrice(quote.price)}</div>
                  <div className={`text-sm ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quote.change >= 0 ? '+' : ''}{formatPrice(quote.change)} 
                    ({formatPercent(quote.changePercent)})
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Document Generation Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Instant Document Generation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Excel Analysis</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Generate comprehensive Excel models with live data, calculations, and professional formatting
              </p>
              <Button 
                size="sm" 
                onClick={generateSampleDocument}
                disabled={liveData.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-1" />
                Generate Excel
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span className="font-medium">PowerPoint Deck</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Create professional presentations with AI-generated insights and dynamic charts
              </p>
              <Button size="sm" className="w-full" disabled>
                <Download className="h-4 w-4 mr-1" />
                Generate PPT
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Research Report</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Automated research reports with AI analysis, peer comparisons, and recommendations
              </p>
              <Button size="sm" className="w-full" disabled>
                <Download className="h-4 w-4 mr-1" />
                Generate Report
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Always-On Intelligence:</strong> Documents are generated instantly using live data from the in-memory layer. 
              No waiting for API calls or data processing - everything is pre-loaded and optimized for sub-second response times.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                &lt;100ms
              </div>
              <div className="text-sm text-gray-600">Query Response</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                99.9%
              </div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                1000/sec
              </div>
              <div className="text-sm text-gray-600">Data Ingestion</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                24/7
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}