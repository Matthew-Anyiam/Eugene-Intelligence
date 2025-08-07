"use client";

import { useState, useEffect } from "react";
import { Newspaper, TrendingUp, TrendingDown, Brain, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NewsSummary {
  id: string;
  title: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  impactLevel: 'high' | 'medium' | 'low';
  affectedTickers: string[];
  tradingImplications: string[];
  summary: string;
  confidence: number;
}

interface MarketTheme {
  theme: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  keyDrivers: string[];
  affectedSectors: string[];
}

interface SentimentReport {
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  highImpactNews: NewsSummary[];
  topAffectedTickers: Array<{
    ticker: string;
    mentions: number;
    avgSentiment: number;
  }>;
}

interface NewsDigest {
  summaries: NewsSummary[];
  themes: MarketTheme[];
  sentimentReport: SentimentReport;
}

export function NewsIntelligenceWidget() {
  const [digest, setDigest] = useState<NewsDigest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsDigest();
  }, []);

  const fetchNewsDigest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/intelligence/news-analysis?analysis=digest&limit=15');
      
      if (!response.ok) {
        throw new Error('Failed to fetch news digest');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDigest(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching news digest:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatSentimentScore = (score: number) => {
    if (score > 0.5) return 'Very Bullish';
    if (score > 0.1) return 'Bullish';
    if (score > -0.1) return 'Neutral';
    if (score > -0.5) return 'Bearish';
    return 'Very Bearish';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-40"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={fetchNewsDigest} variant="outline" size="sm" className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!digest) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No news digest available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">News Intelligence</h2>
        </div>
        <Button onClick={fetchNewsDigest} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Market Sentiment Overview */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
          Market Sentiment
        </h3>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getSentimentIcon(digest.sentimentReport.overallSentiment)}
            <Badge className={`text-sm ${getSentimentColor(digest.sentimentReport.overallSentiment)}`}>
              {digest.sentimentReport.overallSentiment.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            {formatSentimentScore(digest.sentimentReport.sentimentScore)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="font-semibold text-green-600">{digest.sentimentReport.bullishCount}</div>
            <div className="text-green-700">Bullish</div>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="font-semibold text-gray-600">{digest.sentimentReport.neutralCount}</div>
            <div className="text-gray-700">Neutral</div>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="font-semibold text-red-600">{digest.sentimentReport.bearishCount}</div>
            <div className="text-red-700">Bearish</div>
          </div>
        </div>
      </div>

      {/* High Impact News */}
      {digest.sentimentReport.highImpactNews.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
            High Impact News
          </h3>
          <div className="space-y-3">
            {digest.sentimentReport.highImpactNews.slice(0, 2).map((news) => (
              <div key={news.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-2 flex-1">{news.title}</h4>
                  <div className="flex space-x-1 ml-2 flex-shrink-0">
                    <Badge variant="secondary" className={`text-xs ${getSentimentColor(news.sentiment)}`}>
                      {news.sentiment}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${getImpactColor(news.impactLevel)}`}>
                      {news.impactLevel}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{news.summary}</p>
                
                {news.affectedTickers.length > 0 && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-gray-500">Affects:</span>
                    <div className="flex space-x-1">
                      {news.affectedTickers.slice(0, 3).map(ticker => (
                        <Badge key={ticker} variant="outline" className="text-xs">
                          {ticker}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {news.tradingImplications.length > 0 && (
                  <div className="text-xs text-blue-600 font-medium">
                    💡 {news.tradingImplications[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Themes */}
      {digest.themes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
            Market Themes
          </h3>
          <div className="space-y-2">
            {digest.themes.slice(0, 3).map((theme, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{theme.theme}</h4>
                  <Badge variant="secondary" className={`text-xs ${getSentimentColor(theme.overallSentiment)}`}>
                    {theme.overallSentiment}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">Key Drivers:</span> {theme.keyDrivers.slice(0, 2).join(', ')}
                </div>
                
                {theme.affectedSectors.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Sectors:</span> {theme.affectedSectors.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Mentioned Tickers */}
      {digest.sentimentReport.topAffectedTickers.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
            Most Mentioned
          </h3>
          <div className="flex flex-wrap gap-2">
            {digest.sentimentReport.topAffectedTickers.slice(0, 6).map((ticker) => (
              <div key={ticker.ticker} className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="font-medium text-sm">{ticker.ticker}</span>
                <div className="flex items-center space-x-1">
                  {ticker.avgSentiment > 0.1 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : ticker.avgSentiment < -0.1 ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <div className="h-3 w-3" />
                  )}
                  <span className="text-xs text-gray-500">{ticker.mentions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-500">
        <span>{digest.summaries.length} articles analyzed</span>
        <Button variant="outline" size="sm">
          <Newspaper className="mr-2 h-3 w-3" />
          View All
        </Button>
      </div>
    </Card>
  );
}