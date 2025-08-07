"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume?: number;
}

interface MarketData {
  indices: MarketIndex[];
  topGainers: MarketIndex[];
  topLosers: MarketIndex[];
  mostActive: MarketIndex[];
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock market data - in real implementation, fetch from Polygon API
  useEffect(() => {
    const mockData: MarketData = {
      indices: [
        { symbol: "SPX", name: "S&P 500", value: 4567.23, change: 23.45, changePercent: 0.52 },
        { symbol: "DJI", name: "Dow Jones", value: 34123.45, change: -89.12, changePercent: -0.26 },
        { symbol: "IXIC", name: "NASDAQ", value: 14567.89, change: 67.34, changePercent: 0.47 },
        { symbol: "RUT", name: "Russell 2000", value: 1876.45, change: 12.34, changePercent: 0.66 },
      ],
      topGainers: [
        { symbol: "AAPL", name: "Apple Inc.", value: 178.45, change: 5.67, changePercent: 3.28 },
        { symbol: "MSFT", name: "Microsoft", value: 345.67, change: 8.90, changePercent: 2.64 },
        { symbol: "GOOGL", name: "Alphabet", value: 2456.78, change: 45.32, changePercent: 1.88 },
      ],
      topLosers: [
        { symbol: "TSLA", name: "Tesla", value: 234.56, change: -12.34, changePercent: -5.01 },
        { symbol: "NFLX", name: "Netflix", value: 456.78, change: -8.90, changePercent: -1.91 },
        { symbol: "META", name: "Meta", value: 298.45, change: -4.56, changePercent: -1.51 },
      ],
      mostActive: [
        { symbol: "SPY", name: "SPDR S&P 500", value: 456.78, change: 2.34, changePercent: 0.51, volume: 45600000 },
        { symbol: "QQQ", name: "Invesco QQQ", value: 367.89, change: 1.45, changePercent: 0.40, volume: 23400000 },
        { symbol: "SQQQ", name: "ProShares UltraPro", value: 12.34, change: -0.23, changePercent: -1.83, volume: 15600000 },
      ],
    };

    setTimeout(() => {
      setMarketData(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  const formatVolume = (volume?: number) => {
    if (!volume) return 'N/A';
    return formatNumber(volume);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!marketData) return null;

  return (
    <div className="space-y-6">
      {/* Major Indices */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Market Overview</h2>
          <Badge variant="outline" className="text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketData.indices.map((index) => (
            <div key={index.symbol} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm text-gray-600">{index.symbol}</div>
                {getTrendIcon(index.change)}
              </div>
              <div className="text-lg font-semibold">{index.value.toLocaleString()}</div>
              <div className={`text-sm ${getTrendColor(index.change)}`}>
                {index.change > 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent > 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
              </div>
              <div className="text-xs text-gray-500 mt-1">{index.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Market Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Gainers */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-green-600">Top Gainers</h3>
          <div className="space-y-3">
            {marketData.topGainers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{stock.symbol}</div>
                  <div className="text-xs text-gray-500 truncate">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${stock.value.toFixed(2)}</div>
                  <div className="text-xs text-green-500">
                    +{stock.change.toFixed(2)} (+{stock.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Losers */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-red-600">Top Losers</h3>
          <div className="space-y-3">
            {marketData.topLosers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{stock.symbol}</div>
                  <div className="text-xs text-gray-500 truncate">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${stock.value.toFixed(2)}</div>
                  <div className="text-xs text-red-500">
                    {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Most Active */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-blue-600">Most Active</h3>
          <div className="space-y-3">
            {marketData.mostActive.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{stock.symbol}</div>
                  <div className="text-xs text-gray-500">Vol: {formatVolume(stock.volume)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${stock.value.toFixed(2)}</div>
                  <div className={`text-xs ${getTrendColor(stock.change)}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}