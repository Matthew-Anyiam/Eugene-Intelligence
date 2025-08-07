"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, AlertCircle, Search, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketOverview } from "./market-overview";
import { PortfolioSummary } from "./portfolio-summary";
import { ResearchPanel } from "./research-panel";
import { WatchlistWidget } from "./watchlist-widget";
import { NewsAndAlerts } from "./news-and-alerts";
import { QuickActions } from "./quick-actions";

export function FinancialDashboard() {
  const [activePanel, setActivePanel] = useState<'overview' | 'portfolio' | 'research' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    // Implement financial search logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">
                <span className="eugene-text-gradient">Eugene Intelligence</span>
              </h1>
              <div className="hidden md:flex space-x-1">
                <Button
                  variant={activePanel === 'overview' ? 'default' : 'ghost'}
                  onClick={() => setActivePanel('overview')}
                  size="sm"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  variant={activePanel === 'portfolio' ? 'default' : 'ghost'}
                  onClick={() => setActivePanel('portfolio')}
                  size="sm"
                >
                  <PieChart className="mr-2 h-4 w-4" />
                  Portfolio
                </Button>
                <Button
                  variant={activePanel === 'research' ? 'default' : 'ghost'}
                  onClick={() => setActivePanel('research')}
                  size="sm"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Research
                </Button>
                <Button
                  variant={activePanel === 'analytics' ? 'default' : 'ghost'}
                  onClick={() => setActivePanel('analytics')}
                  size="sm"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </div>
            </div>

            {/* Quick Search */}
            <form onSubmit={handleQuickSearch} className="flex-1 max-w-md mx-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search stocks, companies, or ask Eugene..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 w-full"
                  disabled={isLoading}
                />
                {isLoading && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Sparkles className="h-4 w-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </form>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <AlertCircle className="mr-2 h-4 w-4" />
                Alerts (3)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activePanel === 'overview' && (
          <div className="space-y-6">
            {/* Market Overview */}
            <MarketOverview />
            
            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Portfolio Summary */}
              <div className="lg:col-span-1">
                <PortfolioSummary />
              </div>

              {/* Middle Column - Watchlist */}
              <div className="lg:col-span-1">
                <WatchlistWidget />
              </div>

              {/* Right Column - News & Alerts */}
              <div className="lg:col-span-1">
                <NewsAndAlerts />
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />
          </div>
        )}

        {activePanel === 'portfolio' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Portfolio Management</h2>
              <p className="text-gray-600">Portfolio tracking and analysis features coming soon...</p>
            </Card>
          </div>
        )}

        {activePanel === 'research' && (
          <div className="space-y-6">
            <ResearchPanel />
          </div>
        )}

        {activePanel === 'analytics' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
              <p className="text-gray-600">Risk analytics and modeling tools coming soon...</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}