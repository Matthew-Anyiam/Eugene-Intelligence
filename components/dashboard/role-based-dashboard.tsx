'use client';

import React, { useState, useEffect } from 'react';
import { RoleBasedAccessControl, User, UserRole } from '@/lib/auth/role-based-access';
import PortfolioOverviewWidget from './portfolio-overview-widget';
import MarketIntelligenceWidget from './market-intelligence-widget';
import NewsIntelligenceWidget from './news-intelligence-widget';
import EarningsWidget from './earnings-widget';
import AgentsDashboard from './agents-dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Grid3X3, 
  LayoutGrid,
  Maximize2,
  RefreshCw
} from 'lucide-react';

// Widget Registry
const widgetComponents: Record<string, React.ComponentType<any>> = {
  portfolio_overview: PortfolioOverviewWidget,
  market_intelligence: MarketIntelligenceWidget,
  news_intelligence: NewsIntelligenceWidget,
  upcoming_earnings: EarningsWidget,
  agents_dashboard: AgentsDashboard,
  // Add more widget components as needed
  research_pipeline: ({ user }: { user: User }) => (
    <Card>
      <CardHeader>
        <CardTitle>Research Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Research tasks and projects for {user.name}</p>
      </CardContent>
    </Card>
  ),
  compliance_dashboard: ({ user }: { user: User }) => (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Regulatory compliance overview</p>
      </CardContent>
    </Card>
  ),
  risk_dashboard: ({ user }: { user: User }) => (
    <Card>
      <CardHeader>
        <CardTitle>Risk Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Portfolio risk metrics and monitoring</p>
      </CardContent>
    </Card>
  ),
  team_performance: ({ user }: { user: User }) => (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Team metrics and performance tracking</p>
      </CardContent>
    </Card>
  ),
  client_overview: ({ user }: { user: User }) => (
    <Card>
      <CardHeader>
        <CardTitle>Client Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Client portfolio and relationship summary</p>
      </CardContent>
    </Card>
  ),
  ic_dashboard: ({ user }: { user: User }) => (
    <Card>
      <CardHeader>
        <CardTitle>Investment Committee Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Strategic investment oversight and decisions</p>
      </CardContent>
    </Card>
  ),
  learning_resources: ({ user }: { user: User }) => (
    <Card>
      <CardHeader>
        <CardTitle>Learning Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Training materials and educational content</p>
      </CardContent>
    </Card>
  )
};

interface RoleBasedDashboardProps {
  user: User;
  onUserUpdate?: (user: User) => void;
}

export default function RoleBasedDashboard({ user, onUserUpdate }: RoleBasedDashboardProps) {
  const [dashboardLayout, setDashboardLayout] = useState(RoleBasedAccessControl.getDashboardLayout(user));
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [isCustomizing, setIsCustomizing] = useState(false);

  const toggleWidget = (widgetId: string) => {
    setHiddenWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const visibleWidgets = dashboardLayout.widgets.filter(widgetId => 
    !hiddenWidgets.includes(widgetId) && 
    RoleBasedAccessControl.canAccessWidget(user, widgetId)
  );

  const renderWidget = (widgetId: string) => {
    const WidgetComponent = widgetComponents[widgetId];
    
    if (!WidgetComponent) {
      return (
        <Card key={widgetId}>
          <CardHeader>
            <CardTitle>Widget Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Widget {widgetId} is not implemented</p>
          </CardContent>
        </Card>
      );
    }

    return <WidgetComponent key={widgetId} user={user} />;
  };

  const getGridClasses = () => {
    switch (viewMode) {
      case 'compact':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 'list':
        return 'grid-cols-1';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getRoleSpecificInsights = () => {
    switch (user.role) {
      case 'portfolio_manager':
        return [
          'Portfolio performance is tracking 2.3% above benchmark',
          '3 positions require attention based on risk metrics',
          'Next IC meeting scheduled for Friday'
        ];
      
      case 'research_analyst':
        return [
          '5 research reports pending review',
          'Apple earnings call analysis due tomorrow',
          'Tech sector rotation showing momentum'
        ];
      
      case 'compliance_officer':
        return [
          'All portfolios within regulatory limits',
          '2 audit items require attention',
          'New SEC filing requirements effective next month'
        ];
        
      default:
        return [
          'Market conditions remain favorable',
          'All systems operational',
          'No immediate action items'
        ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800">
            {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Customize
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Role-specific Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Daily Insights for {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getRoleSpecificInsights().map((insight, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Customization Controls */}
      {isCustomizing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Dashboard Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View Mode Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">View Mode:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compact')}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Compact
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Maximize2 className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>

            {/* Widget Visibility Controls */}
            <div>
              <span className="text-sm font-medium mb-2 block">Widget Visibility:</span>
              <div className="flex flex-wrap gap-2">
                {dashboardLayout.widgets.map((widgetId) => (
                  <Button
                    key={widgetId}
                    variant={hiddenWidgets.includes(widgetId) ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleWidget(widgetId)}
                    className="flex items-center space-x-1"
                  >
                    {hiddenWidgets.includes(widgetId) ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    <span>{widgetId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Widgets Grid */}
      <div className={`grid gap-6 ${getGridClasses()}`}>
        {visibleWidgets.map(renderWidget)}
      </div>

      {/* Role-specific Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {user.role === 'portfolio_manager' && (
              <>
                <Button className="h-20 flex flex-col space-y-2">
                  <span className="text-lg">📊</span>
                  <span>Portfolio Review</span>
                </Button>
                <Button className="h-20 flex flex-col space-y-2">
                  <span className="text-lg">📈</span>
                  <span>Performance Report</span>
                </Button>
              </>
            )}
            
            {user.role === 'research_analyst' && (
              <>
                <Button className="h-20 flex flex-col space-y-2">
                  <span className="text-lg">🔍</span>
                  <span>New Research</span>
                </Button>
                <Button className="h-20 flex flex-col space-y-2">
                  <span className="text-lg">📋</span>
                  <span>Company Analysis</span>
                </Button>
              </>
            )}
            
            {user.role === 'compliance_officer' && (
              <>
                <Button className="h-20 flex flex-col space-y-2">
                  <span className="text-lg">🛡️</span>
                  <span>Compliance Check</span>
                </Button>
                <Button className="h-20 flex flex-col space-y-2">
                  <span className="text-lg">📋</span>
                  <span>Audit Report</span>
                </Button>
              </>
            )}

            {/* Universal actions available to all roles */}
            <Button className="h-20 flex flex-col space-y-2">
              <span className="text-lg">📧</span>
              <span>Messages</span>
            </Button>
            <Button className="h-20 flex flex-col space-y-2">
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}