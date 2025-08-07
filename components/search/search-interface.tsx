"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Mic, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SearchTypeSelector } from "./search-type-selector";
import { AIModelSelector } from "./ai-model-selector";
import { SearchResults } from "./search-results";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useSearch, useSearchStatus } from "@/hooks/use-search";
import { useAIModels } from "@/hooks/use-ai-chat";
import type { SearchQuery, SearchType, AIModel, SearchResult } from "@/types";

export function SearchInterface() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("web");
  const [aiModel, setAiModel] = useState<AIModel>("claude-4");
  const [currentSearchQuery, setCurrentSearchQuery] = useState<SearchQuery | null>(null);
  const [showAIResponse, setShowAIResponse] = useState(false);
  
  // Use the search hook
  const { 
    data: searchData, 
    results, 
    isLoading, 
    isError, 
    error, 
    performSearch 
  } = useSearch(currentSearchQuery);
  
  // Get search provider status and AI models
  const { data: statusData } = useSearchStatus();
  const { data: aiModelsData } = useAIModels();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const searchQuery: SearchQuery = {
      query: query.trim(),
      type: searchType,
      aiModel,
    };

    // Trigger the search
    await performSearch(searchQuery);
    setCurrentSearchQuery(searchQuery);
    setShowAIResponse(false); // Reset AI response when new search starts
  };

  // Effect to show AI response after search results are loaded
  useEffect(() => {
    if (searchData && results.length > 0 && !showAIResponse) {
      setShowAIResponse(true);
    }
  }, [searchData, results.length, showAIResponse]);

  return (
    <div className="w-full space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Ask Eugene Intelligence anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-24 h-12 text-lg search-input-focus"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isLoading}
              >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Voice search</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isLoading}
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Image search</span>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <SearchTypeSelector
              value={searchType}
              onValueChange={setSearchType}
              disabled={isLoading}
            />
            
            <AIModelSelector
              value={aiModel}
              onValueChange={setAiModel}
              disabled={isLoading}
            />
            
            <Button 
              type="submit" 
              disabled={!query.trim() || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Search provider status */}
      {statusData && !(statusData as any)?.success && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Search providers may be unavailable. Please check your API keys.</span>
          </div>
        </Card>
      )}

      {/* Error handling */}
      {isError && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Search Error</p>
              <p className="text-sm">{error || "An unexpected error occurred while searching."}</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Search results and AI response in two columns */}
      {searchData && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Results Column */}
          <div>
            <SearchResults
              results={{
                query: searchData?.query || "",
                type: searchData?.type || "web",
                results: results,
              }}
              isLoading={isLoading}
            />
          </div>

          {/* AI Response Column */}
          <div>
            {showAIResponse && results.length > 0 && (
              <Card className="h-full">
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="eugene-text-gradient">AI Analysis</span>
                    {aiModelsData && (
                      <span className="text-sm text-muted-foreground">
                        ({aiModelsData.summary?.available || 0}/{aiModelsData.summary?.total || 6} models available)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Intelligent analysis of search results with citations
                  </p>
                </div>
                <div className="h-[600px] overflow-hidden">
                  <ChatInterface
                    searchResults={results}
                    query={searchData?.query || ""}
                    model={aiModel}
                    onResponseGenerated={(response) => {
                      console.log("AI response generated:", response);
                    }}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Default cards when no search */}
      {!searchData && !isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Web Search</h3>
            <p className="text-sm text-muted-foreground">
              Search the entire web with AI-powered results and analysis.
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Academic Research</h3>
            <p className="text-sm text-muted-foreground">
              Access scholarly articles, papers, and academic databases.
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Code Execution</h3>
            <p className="text-sm text-muted-foreground">
              Run and analyze code in multiple programming languages.
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Weather & Maps</h3>
            <p className="text-sm text-muted-foreground">
              Get weather forecasts and location-based information.
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Social Media</h3>
            <p className="text-sm text-muted-foreground">
              Search Reddit, Twitter, and other social platforms.
            </p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Financial Data</h3>
            <p className="text-sm text-muted-foreground">
              Access real-time market data and financial analysis.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}