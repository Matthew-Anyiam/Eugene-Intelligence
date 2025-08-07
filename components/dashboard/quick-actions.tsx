"use client";

import { Calculator, FileText, BarChart3, Search, TrendingUp, PieChart, Target, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'analysis' | 'research' | 'tools' | 'screening';
  action: () => void;
}

export function QuickActions() {
  const quickActions: QuickAction[] = [
    {
      id: "dcf",
      title: "DCF Calculator",
      description: "Value stocks with discounted cash flow modeling",
      icon: <Calculator className="h-5 w-5" />,
      category: "analysis",
      action: () => console.log("Open DCF Calculator")
    },
    {
      id: "screener",
      title: "Stock Screener",
      description: "Find stocks by fundamental and technical criteria",
      icon: <Target className="h-5 w-5" />,
      category: "screening",
      action: () => console.log("Open Stock Screener")
    },
    {
      id: "earnings",
      title: "Earnings Calendar",
      description: "Track upcoming earnings announcements",
      icon: <FileText className="h-5 w-5" />,
      category: "research",
      action: () => console.log("Open Earnings Calendar")
    },
    {
      id: "portfolio-optimizer",
      title: "Portfolio Optimizer",
      description: "Optimize portfolio allocation and risk metrics",
      icon: <PieChart className="h-5 w-5" />,
      category: "analysis",
      action: () => console.log("Open Portfolio Optimizer")
    },
    {
      id: "sector-analysis",
      title: "Sector Analysis",
      description: "Compare sector performance and rotation trends",
      icon: <BarChart3 className="h-5 w-5" />,
      category: "research",
      action: () => console.log("Open Sector Analysis")
    },
    {
      id: "options-chain",
      title: "Options Analysis",
      description: "Analyze options chains and volatility",
      icon: <Zap className="h-5 w-5" />,
      category: "tools",
      action: () => console.log("Open Options Analysis")
    },
    {
      id: "peer-comparison",
      title: "Peer Comparison",
      description: "Compare companies within the same industry",
      icon: <TrendingUp className="h-5 w-5" />,
      category: "analysis",
      action: () => console.log("Open Peer Comparison")
    },
    {
      id: "ai-research",
      title: "AI Research Assistant",
      description: "Generate institutional research reports",
      icon: <Search className="h-5 w-5" />,
      category: "research",
      action: () => console.log("Open AI Research Assistant")
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800';
      case 'research': return 'border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800';
      case 'tools': return 'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800';
      case 'screening': return 'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800';
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'analysis': return 'Analysis';
      case 'research': return 'Research';
      case 'tools': return 'Tools';
      case 'screening': return 'Screening';
      default: return 'Other';
    }
  };

  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="text-sm text-gray-500">
          Professional financial tools at your fingertips
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActions).map(([category, actions]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
              {getCategoryLabel(category)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  onClick={action.action}
                  className={`h-auto p-4 flex flex-col items-start text-left space-y-2 transition-all duration-200 ${getCategoryColor(category)}`}
                >
                  <div className="flex items-center space-x-2 w-full">
                    {action.icon}
                    <span className="font-medium text-sm">{action.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {action.description}
                  </p>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Features */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Coming Soon
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="text-gray-400 mb-1">
              <BarChart3 className="h-4 w-4 mx-auto" />
            </div>
            <div className="text-xs text-gray-500 font-medium">Monte Carlo Simulation</div>
          </div>
          <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="text-gray-400 mb-1">
              <TrendingUp className="h-4 w-4 mx-auto" />
            </div>
            <div className="text-xs text-gray-500 font-medium">Algorithmic Trading</div>
          </div>
          <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="text-gray-400 mb-1">
              <FileText className="h-4 w-4 mx-auto" />
            </div>
            <div className="text-xs text-gray-500 font-medium">ESG Analytics</div>
          </div>
        </div>
      </div>
    </Card>
  );
}