'use client';

import React, { useState } from 'react';
import UnifiedPlatformNav from '@/components/navigation/unified-platform-nav';
import { cn } from '@/lib/utils';
import { 
  PanelLeftOpen, 
  PanelLeftClose,
  Search,
  Command,
  Lightbulb,
  Zap,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

interface PlatformLayoutProps {
  children: React.ReactNode;
}

interface QuickAction {
  title: string;
  description: string;
  action: () => void;
  shortcut?: string;
  icon: React.ReactNode;
  category: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Search Companies',
    description: 'Search for company information and analysis',
    action: () => console.log('Search companies'),
    shortcut: 'Cmd+S',
    icon: <Search className="h-4 w-4" />,
    category: 'Research'
  },
  {
    title: 'Create Investment Memo',
    description: 'Start a new investment committee memo',
    action: () => console.log('Create memo'),
    shortcut: 'Cmd+M',
    icon: <Brain className="h-4 w-4" />,
    category: 'Documents'
  },
  {
    title: 'Portfolio Analysis',
    description: 'Run comprehensive portfolio analytics',
    action: () => console.log('Portfolio analysis'),
    shortcut: 'Cmd+P',
    icon: <Zap className="h-4 w-4" />,
    category: 'Analytics'
  },
  {
    title: 'Market Intelligence',
    description: 'Get latest market insights and news',
    action: () => console.log('Market intelligence'),
    shortcut: 'Cmd+I',
    icon: <Lightbulb className="h-4 w-4" />,
    category: 'Intelligence'
  }
];

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Keyboard shortcuts
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const groupedActions = quickActions.reduce((groups, action) => {
    const category = action.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(action);
    return groups;
  }, {} as Record<string, QuickAction[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search or run a command..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedActions).map(([category, actions]) => (
            <React.Fragment key={category}>
              <CommandGroup heading={category}>
                {actions.map((action) => (
                  <CommandItem
                    key={action.title}
                    onSelect={() => {
                      action.action();
                      setCommandOpen(false);
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      {action.icon}
                      <span>{action.title}</span>
                    </span>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>

      {/* Top Navigation */}
      <UnifiedPlatformNav />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className={cn(
          "bg-white border-r transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Quick Access</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search..."
                className="pl-8"
                onClick={() => setCommandOpen(true)}
                readOnly
              />
            </div>

            {/* Recent Items */}
            <div>
              <h4 className="text-sm font-medium mb-2">Recent</h4>
              <div className="space-y-1 text-sm">
                <div className="p-2 rounded hover:bg-gray-50 cursor-pointer">
                  Apple Inc. Analysis
                </div>
                <div className="p-2 rounded hover:bg-gray-50 cursor-pointer">
                  Q4 Portfolio Review
                </div>
                <div className="p-2 rounded hover:bg-gray-50 cursor-pointer">
                  Tech Sector Research
                </div>
              </div>
            </div>

            {/* Favorites */}
            <div>
              <h4 className="text-sm font-medium mb-2">Favorites</h4>
              <div className="space-y-1 text-sm">
                <div className="p-2 rounded hover:bg-gray-50 cursor-pointer">
                  Daily Briefing
                </div>
                <div className="p-2 rounded hover:bg-gray-50 cursor-pointer">
                  Risk Dashboard
                </div>
                <div className="p-2 rounded hover:bg-gray-50 cursor-pointer">
                  Portfolio Analytics
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Eugene Intelligence</span>
                <span>/</span>
                <span className="text-gray-900">Dashboard</span>
              </nav>
            </div>

            <div className="flex items-center space-x-2">
              {/* Global Search */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-64 justify-start text-left font-normal"
                  onClick={() => setCommandOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline-flex">Search anything...</span>
                  <span className="sr-only">Search</span>
                  <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
              </div>

              {/* AI Assistant Button */}
              <Button
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700"
              >
                <Brain className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}