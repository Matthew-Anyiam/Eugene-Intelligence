"use client";

import { useState, useEffect } from "react";
import { Calculator, Download, Save, RefreshCw, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DCFInputs {
  // Company Info
  symbol: string;
  currentPrice: number;
  
  // Cash Flow Projections (5 years)
  currentFreeCashFlow: number;
  revenueGrowthRates: number[]; // 5 years
  fcfMargins: number[]; // 5 years
  
  // Terminal Value Assumptions
  terminalGrowthRate: number;
  
  // Discount Rate Components
  riskFreeRate: number;
  marketRiskPremium: number;
  beta: number;
  
  // Additional Assumptions
  taxRate: number;
  sharesOutstanding: number;
  netCash: number;
  netDebt: number;
}

interface DCFResults {
  wacc: number;
  projectedFCFs: number[];
  presentValues: number[];
  terminalValue: number;
  terminalValuePV: number;
  enterpriseValue: number;
  equityValue: number;
  shareValue: number;
  upside: number;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

export function DCFCalculator() {
  const [inputs, setInputs] = useState<DCFInputs>({
    symbol: '',
    currentPrice: 0,
    currentFreeCashFlow: 0,
    revenueGrowthRates: [0.15, 0.12, 0.10, 0.08, 0.06], // Example: 15% declining to 6%
    fcfMargins: [0.15, 0.16, 0.17, 0.17, 0.18], // Example: improving margins
    terminalGrowthRate: 0.025,
    riskFreeRate: 0.04,
    marketRiskPremium: 0.06,
    beta: 1.2,
    taxRate: 0.21,
    sharesOutstanding: 0,
    netCash: 0,
    netDebt: 0
  });

  const [results, setResults] = useState<DCFResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateDCF = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      // Calculate WACC (simplified - using only equity cost)
      const wacc = inputs.riskFreeRate + (inputs.beta * inputs.marketRiskPremium);
      
      // Project Free Cash Flows for 5 years
      const projectedFCFs: number[] = [];
      let baseFCF = inputs.currentFreeCashFlow;
      
      for (let i = 0; i < 5; i++) {
        // Simple approximation: FCF grows with revenue growth and margin improvement
        const growthFactor = 1 + inputs.revenueGrowthRates[i];
        const marginFactor = inputs.fcfMargins[i] / (inputs.fcfMargins[0] || 0.15);
        baseFCF = baseFCF * growthFactor * marginFactor;
        projectedFCFs.push(baseFCF);
      }
      
      // Calculate Present Values
      const presentValues = projectedFCFs.map((fcf, index) => {
        return fcf / Math.pow(1 + wacc, index + 1);
      });
      
      // Terminal Value
      const year5FCF = projectedFCFs[4];
      const terminalValue = (year5FCF * (1 + inputs.terminalGrowthRate)) / (wacc - inputs.terminalGrowthRate);
      const terminalValuePV = terminalValue / Math.pow(1 + wacc, 5);
      
      // Enterprise and Equity Value
      const enterpriseValue = presentValues.reduce((sum, pv) => sum + pv, 0) + terminalValuePV;
      const equityValue = enterpriseValue + inputs.netCash - inputs.netDebt;
      const shareValue = inputs.sharesOutstanding > 0 ? equityValue / inputs.sharesOutstanding : 0;
      
      // Calculate upside and recommendation
      const upside = inputs.currentPrice > 0 ? ((shareValue - inputs.currentPrice) / inputs.currentPrice) * 100 : 0;
      
      let recommendation: DCFResults['recommendation'];
      if (upside > 25) recommendation = 'Strong Buy';
      else if (upside > 10) recommendation = 'Buy';
      else if (upside > -10) recommendation = 'Hold';
      else if (upside > -25) recommendation = 'Sell';
      else recommendation = 'Strong Sell';
      
      const dcfResults: DCFResults = {
        wacc,
        projectedFCFs,
        presentValues,
        terminalValue,
        terminalValuePV,
        enterpriseValue,
        equityValue,
        shareValue,
        upside,
        recommendation
      };
      
      setResults(dcfResults);
      setIsCalculating(false);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Buy': return 'bg-green-500 text-white';
      case 'Buy': return 'bg-green-400 text-white';
      case 'Hold': return 'bg-yellow-500 text-white';
      case 'Sell': return 'bg-red-400 text-white';
      case 'Strong Sell': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">DCF Valuation Model</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Model
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        <p className="text-gray-600">
          Professional discounted cash flow analysis for equity valuation
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Company Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Symbol</label>
                  <Input
                    value={inputs.symbol}
                    onChange={(e) => setInputs({...inputs, symbol: e.target.value})}
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.currentPrice}
                    onChange={(e) => setInputs({...inputs, currentPrice: parseFloat(e.target.value)})}
                    placeholder="150.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current FCF ($M)</label>
                  <Input
                    type="number"
                    value={inputs.currentFreeCashFlow}
                    onChange={(e) => setInputs({...inputs, currentFreeCashFlow: parseFloat(e.target.value)})}
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shares Outstanding (M)</label>
                  <Input
                    type="number"
                    value={inputs.sharesOutstanding}
                    onChange={(e) => setInputs({...inputs, sharesOutstanding: parseFloat(e.target.value)})}
                    placeholder="16000"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Growth Assumptions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">5-Year Growth Projections</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Revenue Growth Rates (%)</label>
                <div className="grid grid-cols-5 gap-2">
                  {inputs.revenueGrowthRates.map((rate, index) => (
                    <Input
                      key={index}
                      type="number"
                      step="0.01"
                      value={(rate * 100).toFixed(1)}
                      onChange={(e) => {
                        const newRates = [...inputs.revenueGrowthRates];
                        newRates[index] = parseFloat(e.target.value) / 100;
                        setInputs({...inputs, revenueGrowthRates: newRates});
                      }}
                      placeholder={`Y${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">FCF Margins (%)</label>
                <div className="grid grid-cols-5 gap-2">
                  {inputs.fcfMargins.map((margin, index) => (
                    <Input
                      key={index}
                      type="number"
                      step="0.01"
                      value={(margin * 100).toFixed(1)}
                      onChange={(e) => {
                        const newMargins = [...inputs.fcfMargins];
                        newMargins[index] = parseFloat(e.target.value) / 100;
                        setInputs({...inputs, fcfMargins: newMargins});
                      }}
                      placeholder={`Y${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Discount Rate */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Discount Rate (WACC)</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Risk-Free Rate (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(inputs.riskFreeRate * 100).toFixed(2)}
                    onChange={(e) => setInputs({...inputs, riskFreeRate: parseFloat(e.target.value) / 100})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Market Risk Premium (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(inputs.marketRiskPremium * 100).toFixed(2)}
                    onChange={(e) => setInputs({...inputs, marketRiskPremium: parseFloat(e.target.value) / 100})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Beta</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs.beta}
                    onChange={(e) => setInputs({...inputs, beta: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Terminal Growth Rate (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(inputs.terminalGrowthRate * 100).toFixed(2)}
                    onChange={(e) => setInputs({...inputs, terminalGrowthRate: parseFloat(e.target.value) / 100})}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Valuation Results</h3>
              <Button 
                onClick={calculateDCF} 
                disabled={isCalculating}
                className="flex items-center space-x-2"
              >
                {isCalculating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                <span>{isCalculating ? 'Calculating...' : 'Calculate DCF'}</span>
              </Button>
            </div>

            {results ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Fair Value</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(results.shareValue)}
                    </div>
                    <div className="text-xs text-gray-500">per share</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Upside/Downside</div>
                    <div className={`text-2xl font-bold ${results.upside > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.upside > 0 ? '+' : ''}{results.upside.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">vs current price</div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="text-center">
                  <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(results.recommendation)}`}>
                    {results.recommendation}
                  </Badge>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Valuation Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>WACC (Discount Rate):</span>
                        <span>{formatPercentage(results.wacc)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PV of Projected FCFs:</span>
                        <span>{formatCurrency(results.presentValues.reduce((a, b) => a + b, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PV of Terminal Value:</span>
                        <span>{formatCurrency(results.terminalValuePV)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Enterprise Value:</span>
                        <span>{formatCurrency(results.enterpriseValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net Cash/Debt:</span>
                        <span>{formatCurrency(inputs.netCash - inputs.netDebt)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Equity Value:</span>
                        <span>{formatCurrency(results.equityValue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Projected Cash Flows Table */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">5-Year FCF Projections</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Year</th>
                            <th className="text-right py-2">Projected FCF</th>
                            <th className="text-right py-2">Present Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.projectedFCFs.map((fcf, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">Year {index + 1}</td>
                              <td className="text-right py-2">{formatCurrency(fcf)}</td>
                              <td className="text-right py-2">{formatCurrency(results.presentValues[index])}</td>
                            </tr>
                          ))}
                          <tr className="font-medium">
                            <td className="py-2">Terminal</td>
                            <td className="text-right py-2">{formatCurrency(results.terminalValue)}</td>
                            <td className="text-right py-2">{formatCurrency(results.terminalValuePV)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Enter your assumptions and click Calculate DCF</p>
              </div>
            )}
          </Card>

          {/* Sensitivity Analysis placeholder */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Sensitivity Analysis</h3>
            <div className="text-center py-6 text-gray-500">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Coming Soon: WACC vs Growth Rate sensitivity table</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}