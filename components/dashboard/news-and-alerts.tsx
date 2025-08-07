"use client";

import { useState, useEffect } from "react";
import { Bell, ExternalLink, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: 'market' | 'earnings' | 'economic' | 'breaking';
  sentiment?: 'positive' | 'negative' | 'neutral';
  tickers?: string[];
}

interface PriceAlert {
  id: string;
  symbol: string;
  type: 'price_above' | 'price_below' | 'volume_spike' | 'news_sentiment';
  trigger: string;
  currentValue: string;
  timestamp: Date;
  status: 'active' | 'triggered' | 'expired';
}

export function NewsAndAlerts() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'alerts'>('news');

  // Mock data
  useEffect(() => {
    const mockNews: NewsItem[] = [
      {
        id: "1",
        title: "Apple Reports Strong Q4 Earnings, iPhone Sales Exceed Expectations",
        summary: "Apple Inc. reported quarterly earnings that beat analyst expectations, driven by strong iPhone 15 sales and growing services revenue.",
        source: "MarketWatch",
        url: "https://marketwatch.com/apple-earnings",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        category: "earnings",
        sentiment: "positive",
        tickers: ["AAPL"]
      },
      {
        id: "2", 
        title: "Federal Reserve Signals Potential Rate Cut in Next Meeting",
        summary: "Fed Chairman Powell suggests the central bank may consider lowering interest rates if inflation continues to moderate.",
        source: "Reuters",
        url: "https://reuters.com/fed-policy",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        category: "economic",
        sentiment: "positive",
        tickers: ["SPY", "QQQ"]
      },
      {
        id: "3",
        title: "Tesla Stock Drops on Production Concerns",
        summary: "Tesla shares fell 5% in after-hours trading following reports of potential production delays at the Austin facility.",
        source: "CNBC",
        url: "https://cnbc.com/tesla-production",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        category: "breaking",
        sentiment: "negative",
        tickers: ["TSLA"]
      },
      {
        id: "4",
        title: "Semiconductor Stocks Rally on AI Demand Outlook",
        summary: "Chip stocks surge as analysts upgrade targets citing strong AI infrastructure spending and improved supply chains.",
        source: "Bloomberg",
        url: "https://bloomberg.com/semiconductor-rally",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        category: "market",
        sentiment: "positive",
        tickers: ["NVDA", "AMD", "INTC"]
      }
    ];

    const mockAlerts: PriceAlert[] = [
      {
        id: "1",
        symbol: "AAPL",
        type: "price_above",
        trigger: "Price above $180.00",
        currentValue: "$178.45",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: "active"
      },
      {
        id: "2",
        symbol: "TSLA",
        type: "price_below", 
        trigger: "Price below $250.00",
        currentValue: "$234.56",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: "triggered"
      },
      {
        id: "3",
        symbol: "NVDA",
        type: "volume_spike",
        trigger: "Volume > 50M shares",
        currentValue: "45.7M shares",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        status: "active"
      }
    ];

    setTimeout(() => {
      setNewsItems(mockNews);
      setAlerts(mockAlerts);
      setIsLoading(false);
    }, 500);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'earnings': return 'bg-blue-100 text-blue-800';
      case 'market': return 'bg-green-100 text-green-800';
      case 'economic': return 'bg-purple-100 text-purple-800';
      case 'breaking': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      case 'neutral': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'triggered': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Market Pulse</h2>
        <div className="flex space-x-1">
          <Button
            variant={activeTab === 'news' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('news')}
            size="sm"
          >
            News
          </Button>
          <Button
            variant={activeTab === 'alerts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('alerts')}
            size="sm"
          >
            <Bell className="mr-1 h-3 w-3" />
            Alerts
            {alerts.filter(alert => alert.status === 'triggered').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                {alerts.filter(alert => alert.status === 'triggered').length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {activeTab === 'news' && (
          <div className="space-y-4">
            {newsItems.map((item) => (
              <div key={item.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className={`text-xs ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(item.publishedAt)}</span>
                  </div>
                </div>
                
                <h4 className="font-medium text-sm mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h4>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {item.summary}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{item.source}</span>
                    {item.sentiment && (
                      <div className={`flex items-center space-x-1 ${getSentimentColor(item.sentiment)}`}>
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs capitalize">{item.sentiment}</span>
                      </div>
                    )}
                  </div>
                  
                  {item.tickers && item.tickers.length > 0 && (
                    <div className="flex space-x-1">
                      {item.tickers.slice(0, 3).map(ticker => (
                        <Badge key={ticker} variant="outline" className="text-xs">
                          {ticker}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{alert.symbol}</span>
                    <Badge variant="secondary" className={`text-xs ${getAlertStatusColor(alert.status)}`}>
                      {alert.status}
                    </Badge>
                  </div>
                  {alert.status === 'triggered' && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                
                <div className="text-xs text-gray-600 mb-1">
                  {alert.trigger}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Current: {alert.currentValue}</span>
                  <span className="text-gray-400">{formatTimeAgo(alert.timestamp)}</span>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active alerts</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <Button variant="outline" className="w-full" size="sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          {activeTab === 'news' ? 'View All News' : 'Manage Alerts'}
        </Button>
      </div>
    </Card>
  );
}