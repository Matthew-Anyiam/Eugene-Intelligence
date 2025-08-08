'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Search,
  TrendingUp,
  Bot,
  FileText,
  Users,
  Settings,
  Bell,
  User,
  ChevronDown,
  Command,
  Zap,
  BarChart3,
  BookOpen,
  Shield,
  Globe,
  Briefcase,
  Target,
  Activity,
  Brain,
  Layers,
  Workflow
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  subitems?: NavigationItem[];
}

interface PlatformLayer {
  name: string;
  description: string;
  items: NavigationItem[];
  color: string;
}

const platformLayers: PlatformLayer[] = [
  {
    name: 'Notion for Finance',
    description: 'Collaborative workspace for financial teams',
    color: 'border-l-blue-500',
    items: [
      {
        title: 'Workspaces',
        href: '/workspaces',
        icon: <Layers className="h-4 w-4" />,
        description: 'Team collaboration spaces',
        subitems: [
          { title: 'Investment Committee', href: '/workspaces/investment', icon: <Briefcase className="h-4 w-4" />, description: 'IC meetings and decisions' },
          { title: 'Research Team', href: '/workspaces/research', icon: <BookOpen className="h-4 w-4" />, description: 'Research collaboration' },
          { title: 'Portfolio Management', href: '/workspaces/portfolio', icon: <Target className="h-4 w-4" />, description: 'Portfolio oversight' }
        ]
      },
      {
        title: 'Documents',
        href: '/documents',
        icon: <FileText className="h-4 w-4" />,
        description: 'Investment memos, reports, models',
        subitems: [
          { title: 'Investment Memos', href: '/documents/memos', icon: <FileText className="h-4 w-4" />, description: 'IC memos and pitches' },
          { title: 'Due Diligence', href: '/documents/dd', icon: <Shield className="h-4 w-4" />, description: 'DD reports and checklists' },
          { title: 'Financial Models', href: '/documents/models', icon: <BarChart3 className="h-4 w-4" />, description: 'Valuation models' }
        ]
      },
      {
        title: 'Templates',
        href: '/templates',
        icon: <Workflow className="h-4 w-4" />,
        description: 'Document templates and workflows',
      }
    ]
  },
  {
    name: 'Perplexity for Finance',
    description: 'AI-powered financial research agents',
    color: 'border-l-purple-500',
    items: [
      {
        title: 'Research Agents',
        href: '/research',
        icon: <Brain className="h-4 w-4" />,
        description: 'AI research automation',
        subitems: [
          { title: 'Company Analysis', href: '/research/company', icon: <Building className="h-4 w-4" />, description: 'Deep company research' },
          { title: 'Sector Research', href: '/research/sector', icon: <Globe className="h-4 w-4" />, description: 'Industry analysis' },
          { title: 'Comparative Analysis', href: '/research/comparative', icon: <BarChart3 className="h-4 w-4" />, description: 'Multi-company comparison' }
        ]
      },
      {
        title: 'Market Intelligence',
        href: '/intelligence',
        icon: <Search className="h-4 w-4" />,
        description: 'News, earnings, briefings',
        subitems: [
          { title: 'News Intelligence', href: '/intelligence/news', icon: <Bell className="h-4 w-4" />, description: 'AI news analysis' },
          { title: 'Earnings Intelligence', href: '/intelligence/earnings', icon: <TrendingUp className="h-4 w-4" />, description: 'Earnings call insights' },
          { title: 'Market Briefings', href: '/intelligence/briefings', icon: <FileText className="h-4 w-4" />, description: 'Daily market summaries' }
        ]
      }
    ]
  },
  {
    name: 'Bloomberg 2.0',
    description: 'Next-generation financial terminal',
    color: 'border-l-green-500',
    items: [
      {
        title: 'Terminal',
        href: '/terminal',
        icon: <Command className="h-4 w-4" />,
        description: 'Advanced analytics terminal',
        subitems: [
          { title: 'Portfolio Analytics', href: '/terminal/portfolio', icon: <TrendingUp className="h-4 w-4" />, description: 'Portfolio metrics and attribution' },
          { title: 'Risk Management', href: '/terminal/risk', icon: <Shield className="h-4 w-4" />, description: 'VaR, stress testing, scenarios' },
          { title: 'Technical Analysis', href: '/terminal/technical', icon: <BarChart3 className="h-4 w-4" />, description: 'Charts and indicators' }
        ]
      },
      {
        title: 'Market Data',
        href: '/market-data',
        icon: <Activity className="h-4 w-4" />,
        description: 'Real-time market information',
        subitems: [
          { title: 'Live Quotes', href: '/market-data/quotes', icon: <TrendingUp className="h-4 w-4" />, description: 'Real-time prices' },
          { title: 'Market Movers', href: '/market-data/movers', icon: <Zap className="h-4 w-4" />, description: 'Top gainers/losers' },
          { title: 'Economic Calendar', href: '/market-data/calendar', icon: <Calendar className="h-4 w-4" />, description: 'Economic events' }
        ]
      }
    ]
  },
  {
    name: 'Genspark Automation',
    description: 'Autonomous financial agents',
    color: 'border-l-orange-500',
    items: [
      {
        title: 'Agents',
        href: '/agents',
        icon: <Bot className="h-4 w-4" />,
        description: 'Autonomous financial agents',
        subitems: [
          { title: 'Portfolio Monitor', href: '/agents/portfolio', icon: <TrendingUp className="h-4 w-4" />, description: 'Portfolio monitoring agent' },
          { title: 'Risk Analyst', href: '/agents/risk', icon: <Shield className="h-4 w-4" />, description: 'Risk analysis agent' },
          { title: 'Research Assistant', href: '/agents/research', icon: <BookOpen className="h-4 w-4" />, description: 'Research automation agent' }
        ]
      },
      {
        title: 'Workflows',
        href: '/workflows',
        icon: <Workflow className="h-4 w-4" />,
        description: 'Automated investment workflows',
        subitems: [
          { title: 'Daily Intelligence', href: '/workflows/daily', icon: <Bell className="h-4 w-4" />, description: 'Daily market analysis' },
          { title: 'Risk Monitoring', href: '/workflows/risk', icon: <Shield className="h-4 w-4" />, description: 'Continuous risk monitoring' },
          { title: 'Earnings Response', href: '/workflows/earnings', icon: <TrendingUp className="h-4 w-4" />, description: 'Earnings event automation' }
        ]
      }
    ]
  }
];

const mainNavItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: 'Main dashboard overview'
  },
  {
    title: 'Search',
    href: '/search',
    icon: <Search className="h-4 w-4" />,
    description: 'Intelligent financial search'
  },
  {
    title: 'Portfolio',
    href: '/portfolio',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Portfolio management',
    badge: 'Live'
  }
];

export default function UnifiedPlatformNav() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState(3);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center px-6">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Eugene Intelligence
          </span>
          <Badge variant="secondary" className="text-xs">
            AI-First Platform
          </Badge>
        </div>

        {/* Main Navigation */}
        <NavigationMenu className="ml-8">
          <NavigationMenuList>
            {/* Main Nav Items */}
            {mainNavItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      isActive(item.href) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="flex items-center space-x-2">
                      {item.icon}
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          {item.badge}
                        </Badge>
                      )}
                    </span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}

            {/* Platform Layers */}
            {platformLayers.map((layer) => (
              <NavigationMenuItem key={layer.name}>
                <NavigationMenuTrigger className="text-sm">
                  <span className={cn("border-l-2 pl-2", layer.color)}>
                    {layer.name}
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                    <div className="row-span-3">
                      <div className="text-sm font-medium mb-2">{layer.name}</div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {layer.description}
                      </p>
                      <div className={cn("w-full h-24 bg-gradient-to-br rounded-lg", 
                        layer.color.includes('blue') ? 'from-blue-50 to-blue-100' :
                        layer.color.includes('purple') ? 'from-purple-50 to-purple-100' :
                        layer.color.includes('green') ? 'from-green-50 to-green-100' :
                        'from-orange-50 to-orange-100'
                      )} />
                    </div>
                    {layer.items.map((item) => (
                      <div key={item.href}>
                        <Link href={item.href} legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center space-x-2">
                              {item.icon}
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Portfolio Manager</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Secondary Navigation Bar */}
      <div className="border-t bg-gray-50 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All systems operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3" />
              <span>5 agents active</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3" />
              <span>Markets: Open</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}