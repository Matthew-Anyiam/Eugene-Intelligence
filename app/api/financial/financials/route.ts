import { NextRequest, NextResponse } from "next/server";
import { createPolygonClient } from "@/lib/financial/polygon-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const polygonClient = createPolygonClient();
    
    if (!polygonClient) {
      return NextResponse.json(
        { error: 'Financial data service not available' },
        { status: 503 }
      );
    }

    const financials = await polygonClient.getFinancials(symbol.toUpperCase(), limit);

    // Calculate key financial ratios
    const enhancedFinancials = financials.map(financial => {
      const ratios = calculateFinancialRatios(financial);
      return {
        ...financial,
        ratios
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        financials: enhancedFinancials,
        count: enhancedFinancials.length
      }
    });
  } catch (error) {
    console.error('Financials API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}

function calculateFinancialRatios(financial: any) {
  const {
    revenue,
    netIncome,
    totalAssets,
    totalDebt,
    shareholderEquity,
    freeCashFlow,
    operatingCashFlow
  } = financial;

  return {
    // Profitability Ratios
    netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0, // Return on Assets
    roe: shareholderEquity > 0 ? (netIncome / shareholderEquity) * 100 : 0, // Return on Equity
    
    // Leverage Ratios
    debtToEquity: shareholderEquity > 0 ? totalDebt / shareholderEquity : 0,
    debtToAssets: totalAssets > 0 ? totalDebt / totalAssets : 0,
    
    // Efficiency Ratios
    assetTurnover: totalAssets > 0 ? revenue / totalAssets : 0,
    
    // Cash Flow Ratios
    freeCashFlowMargin: revenue > 0 ? (freeCashFlow / revenue) * 100 : 0,
    operatingCashFlowMargin: revenue > 0 ? (operatingCashFlow / revenue) * 100 : 0,
  };
}