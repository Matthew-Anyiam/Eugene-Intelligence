"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PortfolioPosition {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
}

interface PortfolioSummaryData {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  positions: PortfolioPosition[];
  cashBalance: number;
}

export function PortfolioSummary() {
  const [portfolioData, setPortfolioData] = useState<PortfolioSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock portfolio data - in real implementation, fetch from your backend
  useEffect(() => {
    const mockData: PortfolioSummaryData = {
      totalValue: 125430.67,
      dayChange: 1234.56,
      dayChangePercent: 0.99,
      totalReturn: 23456.78,
      totalReturnPercent: 23.01,
      cashBalance: 5420.33,
      positions: [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          shares: 50,
          avgCost: 150.25,
          currentPrice: 178.45,
          marketValue: 8922.50,
          dayChange: 283.50,
          dayChangePercent: 3.28,
          totalReturn: 1410.00,
          totalReturnPercent: 18.78,
        },
        {
          symbol: "MSFT",
          name: "Microsoft Corp.",
          shares: 25,
          avgCost: 320.80,
          currentPrice: 345.67,
          marketValue: 8641.75,
          dayChange: 222.50,
          dayChangePercent: 2.64,
          totalReturn: 621.75,
          totalReturnPercent: 7.75,
        },
        {
          symbol: "GOOGL",
          name: "Alphabet Inc.",
          shares: 10,
          avgCost: 2200.50,
          currentPrice: 2456.78,
          marketValue: 24567.80,
          dayChange: 453.20,
          dayChangePercent: 1.88,
          totalReturn: 2562.80,
          totalReturnPercent: 11.65,
        },
        {
          symbol: "TSLA",
          name: "Tesla Inc.",
          shares: 15,
          avgCost: 280.90,
          currentPrice: 234.56,
          marketValue: 3518.40,
          dayChange: -185.10,
          dayChangePercent: -5.01,
          totalReturn: -695.10,
          totalReturnPercent: -16.48,
        },
      ],
    };

    setTimeout(() => {
      setPortfolioData(mockData);
      setIsLoading(false);
    }, 800);
  }, []);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <DollarSign className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!portfolioData) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <Button variant="outline" size="sm">
          <PieChart className="mr-2 h-4 w-4" />
          View Full
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Portfolio Value</span>
            {getTrendIcon(portfolioData.dayChange)}
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(portfolioData.totalValue)}
          </div>
          <div className={`text-sm ${getTrendColor(portfolioData.dayChange)}`}>
            {portfolioData.dayChange > 0 ? '+' : ''}{formatCurrency(portfolioData.dayChange)} 
            ({portfolioData.dayChangePercent > 0 ? '+' : ''}{portfolioData.dayChangePercent.toFixed(2)}%) today
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Return</div>
            <div className={`font-semibold ${getTrendColor(portfolioData.totalReturn)}`}>
              {formatCurrency(portfolioData.totalReturn)}
            </div>
            <div className={`text-xs ${getTrendColor(portfolioData.totalReturn)}`}>
              {portfolioData.totalReturnPercent > 0 ? '+' : ''}{portfolioData.totalReturnPercent.toFixed(2)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Cash Balance</div>
            <div className="font-semibold">
              {formatCurrency(portfolioData.cashBalance)}
            </div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
        </div>
      </div>

      {/* Top Positions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Top Positions</h3>
          <Badge variant="outline" className="text-xs">
            {portfolioData.positions.length} holdings
          </Badge>
        </div>
        
        <div className="space-y-2">
          {portfolioData.positions.slice(0, 4).map((position) => (
            <div key={position.symbol} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{position.symbol}</span>
                  <Badge variant="secondary" className="text-xs">
                    {position.shares} shares
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 truncate">{position.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {formatCurrency(position.marketValue)}
                </div>
                <div className={`text-xs ${getTrendColor(position.dayChange)}`}>
                  {position.dayChange > 0 ? '+' : ''}{formatCurrency(position.dayChange)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full mt-4" size="sm">
          <BarChart3 className="mr-2 h-4 w-4" />
          View All Holdings
        </Button>
      </div>
    </Card>
  );
}