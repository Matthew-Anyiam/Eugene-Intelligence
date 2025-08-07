"use client";

import { useState, useEffect } from "react";
import { Calendar, Mic, TrendingUp, Clock, Building2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EarningsCall {
  id: string;
  symbol: string;
  companyName: string;
  quarter: string;
  year: number;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'completed';
}

interface EarningsPreview {
  expectations: {
    epsEstimate: number;
    revenueEstimate: number;
    keyMetricsToWatch: string[];
  };
  keyQuestions: string[];
  riskFactors: string[];
  tradingSetup: {
    supportLevels: number[];
    resistanceLevels: number[];
    impliedMove: number;
    optionsFlow: string;
  };
}

export function EarningsIntelligenceWidget() {
  const [upcomingCalls, setUpcomingCalls] = useState<EarningsCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<EarningsCall | null>(null);
  const [preview, setPreview] = useState<EarningsPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchUpcomingEarnings();
  }, []);

  const fetchUpcomingEarnings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/intelligence/earnings?action=upcoming&days=14');
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUpcomingCalls(data.data.calls);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEarningsPreview = async (symbol: string) => {
    try {
      setLoadingPreview(true);
      
      const response = await fetch(`/api/intelligence/earnings?action=preview&symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings preview');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPreview(data.data.preview);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching earnings preview:', err);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    return `$${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <Button onClick={fetchUpcomingEarnings} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Earnings Intelligence</h2>
        </div>
        <Button onClick={fetchUpcomingEarnings} variant="ghost" size="sm">
          <Clock className="h-4 w-4" />
        </Button>
      </div>

      {upcomingCalls.length === 0 ? (
        <div className="text-center text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No upcoming earnings calls</p>
        </div>
      ) : (
        <>
          {/* Upcoming Earnings List */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
              Upcoming Calls
            </h3>
            {upcomingCalls.slice(0, 5).map((call) => (
              <div 
                key={call.id} 
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedCall?.id === call.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'
                }`}
                onClick={() => {
                  setSelectedCall(call);
                  fetchEarningsPreview(call.symbol);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-sm">{call.symbol}</span>
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(call.status)}`}>
                      {call.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(call.date)} at {call.time}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 truncate flex-1">{call.companyName}</p>
                  <span className="text-xs text-gray-500 ml-2">{call.quarter} {call.year}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Earnings Preview */}
          {selectedCall && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
                  {selectedCall.symbol} Preview
                </h3>
                {selectedCall.status === 'live' && (
                  <Badge className="text-xs bg-red-500 text-white animate-pulse">
                    <Mic className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                )}
              </div>

              {loadingPreview ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : preview ? (
                <div className="space-y-4">
                  {/* Expectations */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Expectations</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-gray-600">EPS Est:</span>
                        <span className="font-semibold ml-1">${preview.expectations.epsEstimate.toFixed(2)}</span>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-gray-600">Revenue Est:</span>
                        <span className="font-semibold ml-1">{formatCurrency(preview.expectations.revenueEstimate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics to Watch */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Metrics</h4>
                    <div className="flex flex-wrap gap-1">
                      {preview.expectations.keyMetricsToWatch.slice(0, 4).map((metric, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Key Questions */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Questions</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {preview.keyQuestions.slice(0, 2).map((question, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Trading Setup */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Trading Setup</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">Implied Move:</span>
                        <span className="font-semibold ml-1 text-blue-600">±{preview.tradingSetup.impliedMove}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Support:</span>
                        <span className="font-semibold ml-1">${preview.tradingSetup.supportLevels[0]}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{preview.tradingSetup.optionsFlow}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Click on a call to see preview</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-500">
            <span>{upcomingCalls.length} calls in next 2 weeks</span>
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-3 w-3" />
              Full Calendar
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}