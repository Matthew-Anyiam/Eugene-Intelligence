"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchResult, SearchType, SearchQuery } from "@/types";

interface SearchResponse {
  success: boolean;
  query: string;
  type: SearchType;
  numResults: number;
  results: SearchResult[];
  timestamp: string;
  error?: string;
  message?: string;
}

interface UseSearchOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useSearch(
  searchQuery: SearchQuery | null, 
  options: UseSearchOptions = {}
) {
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([]);

  const {
    enabled = !!searchQuery?.query,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const queryKey = searchQuery 
    ? ["search", searchQuery.query, searchQuery.type, searchQuery.aiModel] as const
    : ["search", "empty"] as const;

  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<SearchResponse> => {
      if (!searchQuery) {
        throw new Error("No search query provided");
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery.query,
          type: searchQuery.type,
          numResults: 10,
          provider: "tavily", // Default to Tavily
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || data.message || "Search failed");
      }

      return data;
    },
    enabled: enabled && !!searchQuery?.query?.trim(),
    refetchOnWindowFocus,
    staleTime,
    gcTime,
    retry: (failureCount, error) => {
      // Retry up to 2 times, but not for 4xx errors
      if (failureCount < 2) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes("400") || errorMessage.includes("401") || errorMessage.includes("403")) {
          return false;
        }
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const performSearch = async (query: SearchQuery) => {
    if (query.query.trim()) {
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(h => 
          h.query !== query.query || h.type !== query.type
        )];
        return newHistory.slice(0, 20); // Keep last 20 searches
      });
    }
  };

  return {
    data: data as SearchResponse | undefined,
    results: (data as SearchResponse)?.results || [],
    isLoading,
    isError,
    error: error?.message || (data as SearchResponse)?.error,
    refetch,
    searchHistory,
    performSearch,
  };
}

export function useSearchStatus() {
  return useQuery({
    queryKey: ["searchStatus"],
    queryFn: async () => {
      const response = await fetch("/api/search/status");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}