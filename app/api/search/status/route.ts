import { NextResponse } from "next/server";
import { SearchManager } from "@/lib/search/search-manager";

export async function GET() {
  try {
    const searchManager = new SearchManager();
    const status = await searchManager.getProviderStatus();

    return NextResponse.json({
      success: true,
      providers: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Search status API error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to get search provider status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}