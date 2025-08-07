"use client";

import { useState, useEffect } from "react";
import { Plus, X, TrendingUp, TrendingDown, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

export function WatchlistWidget() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Mock watchlist data
  useEffect(() => {
    const mockWatchlist: WatchlistStock[] = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        price: 178.45,
        change: 5.67,
        changePercent: 3.28,
        volume: 67234000,
        marketCap: 2800000000000
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corp.",
        price: 345.67,
        change: 8.90,
        changePercent: 2.64,
        volume: 23456000,
        marketCap: 2567000000000
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        price: 2456.78,
        change: 45.32,
        changePercent: 1.88,
        volume: 12345000,
        marketCap: 1456000000000
      },
      {
        symbol: "TSLA",
        name: "Tesla Inc.",
        price: 234.56,
        change: -12.34,
        changePercent: -5.01,
        volume: 89123000,
        marketCap: 745000000000
      },
      {
        symbol: "NVDA",
        name: "NVIDIA Corp.",
        price: 756.32,
        change: 23.45,
        changePercent: 3.20,
        volume: 45678000,
        marketCap: 1867000000000
      }
    ];

    setTimeout(() => {
      setWatchlist(mockWatchlist);
      setIsLoading(false);
    }, 600);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    setIsAdding(true);
    
    // Mock API call to add stock to watchlist
    setTimeout(() => {
      // In real implementation, fetch stock data and add to watchlist
      const mockStock: WatchlistStock = {
        symbol: newSymbol.toUpperCase(),
        name: "New Company Inc.",
        price: 100.00,
        change: 0,
        changePercent: 0,
        volume: 1000000
      };
      
      setWatchlist(prev => [...prev, mockStock]);
      setNewSymbol("");
      setIsAdding(false);
    }, 1000);
  };

  const handleRemoveStock = (symbol: string) => {
    setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-24"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Watchlist</h2>
        <Badge variant="outline" className="text-xs">
          {watchlist.length} stocks
        </Badge>
      </div>

      {/* Add New Stock Form */}
      <form onSubmit={handleAddStock} className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Add symbol (e.g., AAPL)"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          className="flex-1"
          disabled={isAdding}
        />
        <Button type="submit" disabled={!newSymbol.trim() || isAdding} size="sm">
          {isAdding ? (
            <Star className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Watchlist Items */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {watchlist.map((stock) => (
          <div key={stock.symbol} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm">{stock.symbol}</span>
                {getTrendIcon(stock.change)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveStock(stock.symbol)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {stock.name}
              </div>
              {stock.marketCap && (
                <div className="text-xs text-gray-400">
                  MCap: ${formatNumber(stock.marketCap)}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-sm">
                {formatCurrency(stock.price)}
              </div>
              <div className={`text-xs flex items-center space-x-1 ${getTrendColor(stock.change)}`}>
                <span>
                  {stock.change > 0 ? '+' : ''}{formatCurrency(stock.change)}
                </span>
                <span>
                  ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Vol: {formatNumber(stock.volume)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {watchlist.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Your watchlist is empty</p>
          <p className="text-xs">Add stocks to track their performance</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <Button variant="outline" className="w-full" size="sm">
          <TrendingUp className="mr-2 h-4 w-4" />
          View Market Screener
        </Button>
      </div>
    </Card>
  );
}