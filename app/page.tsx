import { Metadata } from "next";
import { SearchInterface } from "@/components/search/search-interface";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Eugene Intelligence - AI-Powered Search & Research Platform",
  description: "Discover the power of AI-driven search. Eugene Intelligence provides comprehensive web search, academic research, code execution, and intelligent analysis all in one platform.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="eugene-text-gradient">Eugene Intelligence</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                AI-powered search engine and research platform
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Web Search
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Academic Research
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Code Execution
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Weather & Maps
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Multi-AI Models
                </span>
              </div>
            </div>
            <SearchInterface />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}