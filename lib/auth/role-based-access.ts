export type UserRole = 
  | 'portfolio_manager' 
  | 'research_analyst' 
  | 'compliance_officer' 
  | 'team_lead' 
  | 'junior_analyst'
  | 'client_service'
  | 'risk_manager'
  | 'investment_committee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  department: string;
  seniority: 'junior' | 'mid' | 'senior' | 'director' | 'c_suite';
  preferences: {
    dashboardLayout: string;
    focusAreas: string[];
    notifications: Record<string, boolean>;
    dataAccess: 'restricted' | 'standard' | 'full';
  };
}

export interface RoleConfiguration {
  name: string;
  description: string;
  permissions: string[];
  dashboardWidgets: string[];
  navigationItems: string[];
  dataAccessLevel: 'restricted' | 'standard' | 'full';
  features: {
    canCreateDocuments: boolean;
    canApproveInvestments: boolean;
    canAccessRealTimeData: boolean;
    canRunAnalytics: boolean;
    canManageTeam: boolean;
    canViewAllPortfolios: boolean;
    canEditModels: boolean;
    canAccessCompliance: boolean;
  };
}

export const roleConfigurations: Record<UserRole, RoleConfiguration> = {
  portfolio_manager: {
    name: 'Portfolio Manager',
    description: 'Senior investment professional managing portfolios',
    permissions: [
      'read_all_portfolios',
      'write_portfolios',
      'approve_investments',
      'access_real_time_data',
      'run_analytics',
      'create_documents',
      'manage_team'
    ],
    dashboardWidgets: [
      'portfolio_overview',
      'performance_attribution',
      'risk_metrics',
      'market_overview',
      'news_intelligence',
      'agents_dashboard',
      'upcoming_earnings',
      'economic_calendar'
    ],
    navigationItems: [
      'dashboard',
      'portfolio',
      'terminal',
      'research',
      'intelligence',
      'agents',
      'workspaces',
      'documents'
    ],
    dataAccessLevel: 'full',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: true,
      canAccessRealTimeData: true,
      canRunAnalytics: true,
      canManageTeam: true,
      canViewAllPortfolios: true,
      canEditModels: true,
      canAccessCompliance: true
    }
  },

  research_analyst: {
    name: 'Research Analyst',
    description: 'Investment research and analysis specialist',
    permissions: [
      'read_portfolios',
      'access_research_data',
      'create_research',
      'run_analytics',
      'create_documents'
    ],
    dashboardWidgets: [
      'research_pipeline',
      'company_screener',
      'market_intelligence',
      'news_intelligence',
      'sector_analysis',
      'valuation_models'
    ],
    navigationItems: [
      'dashboard',
      'research',
      'intelligence',
      'terminal',
      'documents',
      'workspaces'
    ],
    dataAccessLevel: 'standard',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: false,
      canAccessRealTimeData: true,
      canRunAnalytics: true,
      canManageTeam: false,
      canViewAllPortfolios: false,
      canEditModels: true,
      canAccessCompliance: false
    }
  },

  compliance_officer: {
    name: 'Compliance Officer',
    description: 'Regulatory compliance and risk oversight',
    permissions: [
      'read_all_portfolios',
      'access_compliance_data',
      'audit_transactions',
      'create_compliance_reports',
      'manage_risk_limits'
    ],
    dashboardWidgets: [
      'compliance_dashboard',
      'risk_monitoring',
      'audit_trail',
      'regulatory_calendar',
      'violation_alerts',
      'position_limits'
    ],
    navigationItems: [
      'dashboard',
      'compliance',
      'risk',
      'audit',
      'reports',
      'agents'
    ],
    dataAccessLevel: 'full',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: false,
      canAccessRealTimeData: true,
      canRunAnalytics: true,
      canManageTeam: false,
      canViewAllPortfolios: true,
      canEditModels: false,
      canAccessCompliance: true
    }
  },

  team_lead: {
    name: 'Team Lead',
    description: 'Team leadership and coordination',
    permissions: [
      'read_team_portfolios',
      'manage_team',
      'approve_research',
      'access_team_analytics',
      'create_documents'
    ],
    dashboardWidgets: [
      'team_performance',
      'portfolio_overview',
      'research_pipeline',
      'team_workload',
      'performance_attribution',
      'market_overview'
    ],
    navigationItems: [
      'dashboard',
      'portfolio',
      'research',
      'team',
      'workspaces',
      'documents',
      'agents'
    ],
    dataAccessLevel: 'standard',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: true,
      canAccessRealTimeData: true,
      canRunAnalytics: true,
      canManageTeam: true,
      canViewAllPortfolios: false,
      canEditModels: true,
      canAccessCompliance: false
    }
  },

  junior_analyst: {
    name: 'Junior Analyst',
    description: 'Entry-level research and analysis support',
    permissions: [
      'read_assigned_portfolios',
      'create_draft_research',
      'access_basic_data'
    ],
    dashboardWidgets: [
      'assigned_research',
      'learning_resources',
      'market_overview',
      'news_intelligence',
      'basic_analytics'
    ],
    navigationItems: [
      'dashboard',
      'research',
      'intelligence',
      'learning',
      'documents'
    ],
    dataAccessLevel: 'restricted',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: false,
      canAccessRealTimeData: false,
      canRunAnalytics: false,
      canManageTeam: false,
      canViewAllPortfolios: false,
      canEditModels: false,
      canAccessCompliance: false
    }
  },

  client_service: {
    name: 'Client Service',
    description: 'Client relationship management and reporting',
    permissions: [
      'read_client_portfolios',
      'create_client_reports',
      'access_client_data'
    ],
    dashboardWidgets: [
      'client_overview',
      'portfolio_performance',
      'client_communications',
      'market_commentary',
      'meeting_calendar'
    ],
    navigationItems: [
      'dashboard',
      'clients',
      'portfolio',
      'reports',
      'documents'
    ],
    dataAccessLevel: 'restricted',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: false,
      canAccessRealTimeData: false,
      canRunAnalytics: false,
      canManageTeam: false,
      canViewAllPortfolios: false,
      canEditModels: false,
      canAccessCompliance: false
    }
  },

  risk_manager: {
    name: 'Risk Manager',
    description: 'Portfolio risk management and analysis',
    permissions: [
      'read_all_portfolios',
      'access_risk_data',
      'run_risk_analytics',
      'set_risk_limits',
      'create_risk_reports'
    ],
    dashboardWidgets: [
      'risk_dashboard',
      'var_monitoring',
      'stress_testing',
      'correlation_analysis',
      'limit_monitoring',
      'scenario_analysis'
    ],
    navigationItems: [
      'dashboard',
      'risk',
      'terminal',
      'analytics',
      'agents',
      'reports'
    ],
    dataAccessLevel: 'full',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: false,
      canAccessRealTimeData: true,
      canRunAnalytics: true,
      canManageTeam: false,
      canViewAllPortfolios: true,
      canEditModels: true,
      canAccessCompliance: true
    }
  },

  investment_committee: {
    name: 'Investment Committee',
    description: 'Senior decision makers for investment approvals',
    permissions: [
      'read_all_portfolios',
      'approve_all_investments',
      'access_all_data',
      'strategic_oversight'
    ],
    dashboardWidgets: [
      'ic_dashboard',
      'investment_pipeline',
      'portfolio_overview',
      'performance_summary',
      'strategic_initiatives',
      'market_outlook'
    ],
    navigationItems: [
      'dashboard',
      'investments',
      'portfolio',
      'strategy',
      'workspaces',
      'reports'
    ],
    dataAccessLevel: 'full',
    features: {
      canCreateDocuments: true,
      canApproveInvestments: true,
      canAccessRealTimeData: true,
      canRunAnalytics: true,
      canManageTeam: true,
      canViewAllPortfolios: true,
      canEditModels: false,
      canAccessCompliance: true
    }
  }
};

export class RoleBasedAccessControl {
  static hasPermission(user: User, permission: string): boolean {
    return user.permissions.includes(permission) || 
           roleConfigurations[user.role].permissions.includes(permission);
  }

  static canAccessWidget(user: User, widgetId: string): boolean {
    return roleConfigurations[user.role].dashboardWidgets.includes(widgetId);
  }

  static canAccessNavItem(user: User, navItem: string): boolean {
    return roleConfigurations[user.role].navigationItems.includes(navItem);
  }

  static getPermittedWidgets(user: User): string[] {
    return roleConfigurations[user.role].dashboardWidgets;
  }

  static getPermittedNavItems(user: User): string[] {
    return roleConfigurations[user.role].navigationItems;
  }

  static canPerformAction(user: User, action: keyof RoleConfiguration['features']): boolean {
    return roleConfigurations[user.role].features[action];
  }

  static getDataAccessLevel(user: User): 'restricted' | 'standard' | 'full' {
    return Math.max(
      user.preferences.dataAccess === 'restricted' ? 0 : 
      user.preferences.dataAccess === 'standard' ? 1 : 2,
      roleConfigurations[user.role].dataAccessLevel === 'restricted' ? 0 : 
      roleConfigurations[user.role].dataAccessLevel === 'standard' ? 1 : 2
    ) === 0 ? 'restricted' : 
      Math.max(
        user.preferences.dataAccess === 'restricted' ? 0 : 
        user.preferences.dataAccess === 'standard' ? 1 : 2,
        roleConfigurations[user.role].dataAccessLevel === 'restricted' ? 0 : 
        roleConfigurations[user.role].dataAccessLevel === 'standard' ? 1 : 2
      ) === 1 ? 'standard' : 'full';
  }

  static filterDataByAccessLevel(
    data: any[], 
    user: User, 
    dataType: 'portfolio' | 'research' | 'compliance'
  ): any[] {
    const accessLevel = this.getDataAccessLevel(user);
    
    if (accessLevel === 'full') {
      return data;
    }
    
    if (accessLevel === 'restricted') {
      // Return only data specifically assigned to the user or their department
      return data.filter(item => 
        item.assignedTo === user.id || 
        item.department === user.department ||
        item.createdBy === user.id
      );
    }
    
    // Standard access - filter based on role-specific rules
    switch (user.role) {
      case 'research_analyst':
        return data.filter(item => 
          dataType === 'research' || 
          (dataType === 'portfolio' && item.analystsAssigned?.includes(user.id))
        );
      
      case 'client_service':
        return data.filter(item => 
          item.clientFacing === true || 
          item.assignedClientManager === user.id
        );
        
      default:
        return data;
    }
  }

  static getDashboardLayout(user: User): {
    widgets: string[];
    layout: 'compact' | 'standard' | 'detailed';
    focusAreas: string[];
  } {
    const roleConfig = roleConfigurations[user.role];
    
    return {
      widgets: roleConfig.dashboardWidgets,
      layout: user.seniority === 'junior' ? 'compact' : 
              user.seniority === 'senior' || user.seniority === 'director' ? 'detailed' : 
              'standard',
      focusAreas: user.preferences.focusAreas
    };
  }
}

// Utility functions for UI components
export function getUserRoleDisplay(role: UserRole): { name: string; color: string; icon: string } {
  const config = roleConfigurations[role];
  const colors: Record<UserRole, string> = {
    portfolio_manager: 'bg-blue-100 text-blue-800',
    research_analyst: 'bg-green-100 text-green-800',
    compliance_officer: 'bg-red-100 text-red-800',
    team_lead: 'bg-purple-100 text-purple-800',
    junior_analyst: 'bg-yellow-100 text-yellow-800',
    client_service: 'bg-indigo-100 text-indigo-800',
    risk_manager: 'bg-orange-100 text-orange-800',
    investment_committee: 'bg-gray-900 text-white'
  };

  const icons: Record<UserRole, string> = {
    portfolio_manager: '📊',
    research_analyst: '🔍',
    compliance_officer: '🛡️',
    team_lead: '👥',
    junior_analyst: '📚',
    client_service: '🤝',
    risk_manager: '⚠️',
    investment_committee: '🏛️'
  };

  return {
    name: config.name,
    color: colors[role],
    icon: icons[role]
  };
}