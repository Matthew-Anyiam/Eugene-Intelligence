"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, Globe } from "lucide-react";
import { formatDate, extractDomain } from "@/lib/utils";
import type { SearchResult } from "@/types";

interface SearchResultsProps {
  results: {
    query: string;
    type: string;
    results: SearchResult[];
  };
  isLoading: boolean;
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search Results</h2>
          <p className="text-muted-foreground">
            Found {results.results.length} results for "{results.query}" in {results.type} search
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {results.type}
        </Badge>
      </div>

      <div className="space-y-4">
        {results.results.map((result) => (
          <SearchResultCard key={result.id} result={result} />
        ))}
      </div>

      {results.results.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground text-lg mb-4">
              No results found for your search.
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or using a different search type.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const domain = extractDomain(result.url);
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-2"
              >
                <span>{result.title}</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>{domain}</span>
              <span>•</span>
              <span>{result.source}</span>
              {result.timestamp && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(result.timestamp)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {result.thumbnailUrl && (
            <img
              src={result.thumbnailUrl}
              alt={result.title}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {result.description}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {result.author && (
              <span className="text-xs text-muted-foreground">
                by {result.author}
              </span>
            )}
            {result.publishedDate && (
              <span className="text-xs text-muted-foreground">
                Published {formatDate(result.publishedDate)}
              </span>
            )}
          </div>
          
          {result.relevanceScore && (
            <Badge variant="outline" className="text-xs">
              {Math.round(result.relevanceScore * 100)}% relevant
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}