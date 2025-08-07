import type { SearchResult } from "@/types";

export interface Citation {
  id: number;
  title: string;
  url: string;
  source: string;
  snippet?: string;
}

export class CitationManager {
  private citations: Map<string, Citation> = new Map();
  private citationCounter = 0;

  addSearchResults(results: SearchResult[]): Citation[] {
    const newCitations: Citation[] = [];

    for (const result of results) {
      if (!this.citations.has(result.url)) {
        this.citationCounter++;
        const citation: Citation = {
          id: this.citationCounter,
          title: result.title,
          url: result.url,
          source: result.source,
          snippet: result.description?.substring(0, 150) + "...",
        };
        
        this.citations.set(result.url, citation);
        newCitations.push(citation);
      }
    }

    return newCitations;
  }

  getCitation(url: string): Citation | undefined {
    return this.citations.get(url);
  }

  getAllCitations(): Citation[] {
    return Array.from(this.citations.values()).sort((a, b) => a.id - b.id);
  }

  formatCitationList(): string {
    const citations = this.getAllCitations();
    if (citations.length === 0) return "";

    return "\n\n## Sources\n\n" + 
      citations.map(citation => 
        `[${citation.id}] ${citation.title} - ${citation.source}\n${citation.url}`
      ).join("\n\n");
  }

  clear(): void {
    this.citations.clear();
    this.citationCounter = 0;
  }
}

export function createSearchContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No search results were found for this query.";
  }

  let context = "Based on the following search results:\n\n";
  
  results.forEach((result, index) => {
    context += `[${index + 1}] ${result.title}\n`;
    context += `Source: ${result.source}\n`;
    context += `URL: ${result.url}\n`;
    context += `Content: ${result.description}\n`;
    if (result.publishedDate) {
      context += `Published: ${result.publishedDate.toLocaleDateString()}\n`;
    }
    context += "\n";
  });

  context += "Please analyze these search results and provide a comprehensive response. ";
  context += "Use numbered citations [1], [2], etc. to reference specific search results. ";
  context += "Synthesize information from multiple sources when possible.";

  return context;
}

export function extractCitationsFromText(text: string): number[] {
  const citationRegex = /\[(\d+)\]/g;
  const matches = Array.from(text.matchAll(citationRegex));
  return matches.map(match => parseInt(match[1], 10));
}

export function validateCitations(text: string, maxCitations: number): boolean {
  const citationNumbers = extractCitationsFromText(text);
  return citationNumbers.every(num => num >= 1 && num <= maxCitations);
}