"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, FileText, TrendingUp, Building2, Globe, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIModelSelector } from "@/components/search/ai-model-selector";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { AIModel, SearchResult } from "@/types";

interface ResearchCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
}

const RESEARCH_CATEGORIES: ResearchCategory[] = [
  {
    id: "company",
    name: "Company Analysis",
    description: "Deep dive into company fundamentals, financials, and competitive position",
    icon: <Building2 className="h-5 w-5" />,
    examples: [
      "Apple quarterly earnings analysis",
      "Tesla competitive positioning",
      "Microsoft cloud growth strategy"
    ]
  },
  {
    id: "sector",
    name: "Sector Research",
    description: "Industry trends, sector rotation analysis, and thematic investing",
    icon: <TrendingUp className="h-5 w-5" />,
    examples: [
      "Semiconductor industry outlook",
      "Clean energy sector analysis",
      "Healthcare innovation trends"
    ]
  },
  {
    id: "market",
    name: "Market Intelligence",
    description: "Macro analysis, market sentiment, and economic indicators",
    icon: <Globe className="h-5 w-5" />,
    examples: [
      "Federal Reserve policy impact",
      "Inflation trends analysis",
      "Emerging markets outlook"
    ]
  },
  {
    id: "sec",
    name: "SEC Filings",
    description: "10-K, 10-Q, 8-K analysis with key insights extraction",
    icon: <FileText className="h-5 w-5" />,
    examples: [
      "Latest 10-K risk factors",
      "Quarterly earnings calls",
      "Insider trading activity"
    ]
  }
];

interface RecentReport {
  id: string;
  title: string;
  category: string;
  timestamp: Date;
  model: AIModel;
  summary: string;
}

export function ResearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("company");
  const [aiModel, setAiModel] = useState<AIModel>("claude-4");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  // Mock recent reports
  useEffect(() => {
    const mockReports: RecentReport[] = [
      {
        id: "1",
        title: "Apple Q4 2024 Earnings Deep Dive",
        category: "Company Analysis",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        model: "claude-4",
        summary: "Comprehensive analysis of Apple's Q4 results, showing strong iPhone sales and services growth..."
      },
      {
        id: "2", 
        title: "Semiconductor Sector Outlook",
        category: "Sector Research",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        model: "gpt-4o",
        summary: "Industry analysis covering AI chip demand, supply chain normalization, and key players..."
      },
      {
        id: "3",
        title: "Fed Policy Impact Analysis",
        category: "Market Intelligence", 
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        model: "grok-3",
        summary: "Analysis of recent Federal Reserve policy changes and market implications..."
      }
    ];
    setRecentReports(mockReports);
  }, []);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowAIResponse(false);

    // Mock search results - in real implementation, call search API
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: "1",
          title: "Apple Inc. - Latest Financial Results",
          description: "Quarterly earnings report with detailed financial metrics and forward guidance",
          url: "https://investor.apple.com",
          source: "Apple Investor Relations",
          timestamp: new Date(),
        },
        {
          id: "2", 
          title: "Apple Stock Analysis - Wall Street Journal",
          description: "Professional analysis of Apple's stock performance and future outlook",
          url: "https://wsj.com/apple-analysis",
          source: "Wall Street Journal",
          timestamp: new Date(),
        }
      ];

      setSearchResults(mockResults);
      setIsSearching(false);
      setShowAIResponse(true);
    }, 1500);
  };

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Research Interface */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Financial Research</h2>
          <Badge variant="outline" className="text-xs">
            AI-Powered Analysis
          </Badge>
        </div>

        <form onSubmit={handleResearch} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Ask Eugene: 'Analyze Apple's latest earnings' or 'Compare tech sector performance'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              disabled={isSearching}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Sparkles className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Research Focus</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {RESEARCH_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="h-auto p-3 flex-col items-start text-left"
                    size="sm"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {category.icon}
                      <span className="text-xs font-medium">{category.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-2">AI Model</label>
              <AIModelSelector
                value={aiModel}
                onValueChange={setAiModel}
                disabled={isSearching}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!searchQuery.trim() || isSearching}
              className="w-full sm:w-auto"
            >
              {isSearching ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Research
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Selected Category Info */}
        {RESEARCH_CATEGORIES.find(cat => cat.id === selectedCategory) && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              {RESEARCH_CATEGORIES.find(cat => cat.id === selectedCategory)?.icon}
              <div>
                <h4 className="font-medium text-sm mb-1">
                  {RESEARCH_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {RESEARCH_CATEGORIES.find(cat => cat.id === selectedCategory)?.description}
                </p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Examples: </span>
                  {RESEARCH_CATEGORIES.find(cat => cat.id === selectedCategory)?.examples.join(", ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Research Results */}
      {showAIResponse && searchResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Results */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Research Sources</h3>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div key={result.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1 text-xs">
                      [{index + 1}]
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{result.title}</h4>
                      <p className="text-xs text-gray-600 mb-2">{result.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{result.source}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(result.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Analysis */}
          <Card className="p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="eugene-text-gradient">AI Research Analysis</span>
                <Badge variant="secondary" className="text-xs">{aiModel}</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive analysis with citations and insights
              </p>
            </div>
            <div className="h-[500px] overflow-hidden">
              <ChatInterface
                searchResults={searchResults}
                query={searchQuery}
                model={aiModel}
                onResponseGenerated={(response) => {
                  console.log("Research analysis generated:", response);
                }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Recent Reports */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Research Reports</h3>
        <div className="space-y-3">
          {recentReports.map((report) => (
            <div key={report.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-sm">{report.title}</h4>
                  <Badge variant="outline" className="text-xs">{report.model}</Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{report.summary}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{report.category}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(report.timestamp)}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}