"use client";

import { useState, useEffect } from "react";
import { FileText, TrendingUp, AlertCircle, Clock, Target, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MarketBriefing {
  marketOverview: {
    marketSentiment: 'risk_on' | 'risk_off' | 'neutral';
    keyDrivers: string[];
    sectorRotation: {
      outperforming: string[];
      underperforming: string[];
    };
  };
  topStories: Array<{
    headline: string;
    summary: string;
    impact: 'high' | 'medium' | 'low';
    tradingImplication: string;
    timeframe: 'immediate' | 'short_term' | 'long_term';
  }>;
  personalizedInsights: {
    watchlistAlerts: Array<{
      symbol: string;
      alert: string;
      priority: 'high' | 'medium' | 'low';
      action: string;
    }>;
    opportunitySpotlight: Array<{
      type: string;
      description: string;
      tickers: string[];
      timeframe: string;
      riskReward: string;
    }>;
  };
  actionItems: Array<{
    item: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  aiInsights: string[];
  confidence: number;
  generatedAt: string;
}

export function MarketBriefingWidget() {
  const [briefing, setBriefing] = useState<MarketBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketBriefing();
  }, []);

  const fetchMarketBriefing = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/intelligence/market-briefing?userId=demo');
      
      if (!response.ok) {
        throw new Error('Failed to fetch market briefing');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBriefing(data.data.briefing);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching market briefing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load briefing');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarketSentiment = (sentiment: string) => {
    switch (sentiment) {
      case 'risk_on':
        return { label: 'Risk On', color: 'text-green-600 bg-green-100', icon: '📈' };
      case 'risk_off':
        return { label: 'Risk Off', color: 'text-red-600 bg-red-100', icon: '📉' };
      default:
        return { label: 'Neutral', color: 'text-gray-600 bg-gray-100', icon: '➡️' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
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

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
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
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={fetchMarketBriefing} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!briefing) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No briefing available</p>
        </div>
      </Card>
    );
  }

  const sentiment = formatMarketSentiment(briefing.marketOverview.marketSentiment);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Daily Market Briefing</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Confidence: {briefing.confidence}%
          </Badge>
          <Button onClick={fetchMarketBriefing} variant="ghost" size="sm">
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Market Overview */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
          Market Overview
        </h3>
        <div className="flex items-center space-x-4 mb-3">
          <Badge className={`text-sm ${sentiment.color}`}>
            {sentiment.icon} {sentiment.label}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-600">Key Drivers:</span>
            <ul className="mt-1 space-y-1">
              {briefing.marketOverview.keyDrivers.slice(0, 3).map((driver, index) => (
                <li key={index} className="text-gray-700 flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {driver}
                </li>
              ))}
            </ul>
          </div>
          
          {briefing.marketOverview.sectorRotation.outperforming.length > 0 && (
            <div>
              <span className="font-medium text-gray-600">Outperforming:</span>
              <span className="ml-2 text-green-600">
                {briefing.marketOverview.sectorRotation.outperforming.slice(0, 2).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Stories */}
      {briefing.topStories.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
            Top Stories
          </h3>
          <div className="space-y-3">
            {briefing.topStories.slice(0, 2).map((story, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-2">{story.headline}</h4>
                  <Badge variant="secondary" className={`text-xs ml-2 flex-shrink-0 ${getImpactColor(story.impact)}`}>
                    {story.impact}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{story.summary}</p>
                <p className="text-xs text-blue-600 font-medium">{story.tradingImplication}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist Alerts */}
      {briefing.personalizedInsights.watchlistAlerts.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
            Watchlist Alerts
          </h3>
          <div className="space-y-2">
            {briefing.personalizedInsights.watchlistAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{alert.symbol}</span>
                  <Badge variant="secondary" className={`text-xs ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 flex-1 mx-3 truncate">{alert.alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {briefing.actionItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide">
            Action Items
          </h3>
          <div className="space-y-2">
            {briefing.actionItems.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.item}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className={`text-xs ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </Badge>
                    <span className="text-xs text-gray-500">{item.timeframe}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {briefing.aiInsights.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide flex items-center">
            <Zap className="h-4 w-4 mr-1" />
            AI Insights
          </h3>
          <div className="space-y-2">
            {briefing.aiInsights.slice(0, 2).map((insight, index) => (
              <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-900 dark:text-blue-100">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-500">
        <span>
          Generated {new Date(briefing.generatedAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
        <Button variant="outline" size="sm">
          <TrendingUp className="mr-2 h-3 w-3" />
          Full Briefing
        </Button>
      </div>
    </Card>
  );
}