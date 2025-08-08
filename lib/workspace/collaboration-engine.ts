import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'portfolio_manager' | 'research_analyst' | 'compliance_officer' | 'team_lead' | 'junior_analyst';
  avatar?: string;
  isOnline: boolean;
  lastActive: Date;
}

export interface WorkspaceDocument {
  id: string;
  title: string;
  type: 'investment_memo' | 'due_diligence' | 'pitch_deck' | 'research_report' | 'model' | 'dashboard';
  content: any; // JSON content structure
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  collaborators: string[];
  status: 'draft' | 'review' | 'approved' | 'archived';
  tags: string[];
  parentId?: string;
  templateId?: string;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  position?: { x: number; y: number; elementId?: string };
  isResolved: boolean;
  createdAt: Date;
  replies: Comment[];
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  type: WorkspaceDocument['type'];
  description: string;
  category: 'investment' | 'analysis' | 'compliance' | 'reporting';
  structure: any; // JSON template structure
  requiredFields: string[];
  automationRules?: AutomationRule[];
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'document_created' | 'status_changed' | 'data_updated' | 'deadline_approaching';
  conditions: Record<string, any>;
  actions: Array<{
    type: 'notify' | 'assign' | 'update_status' | 'generate_report' | 'run_analysis';
    params: Record<string, any>;
  }>;
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'team' | 'project' | 'client' | 'fund';
  members: Array<{ userId: string; role: 'owner' | 'editor' | 'viewer'; permissions: string[] }>;
  documents: WorkspaceDocument[];
  settings: {
    privacy: 'private' | 'internal' | 'client_accessible';
    integrations: Record<string, any>;
    notifications: Record<string, boolean>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DocumentContentSchema = z.object({
  blocks: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'heading', 'financial_chart', 'data_table', 'model_output', 'ai_analysis']),
    content: z.any(),
    position: z.object({ x: z.number(), y: z.number() }),
    metadata: z.record(z.any()).optional()
  })),
  layout: z.object({
    columns: z.number(),
    width: z.number(),
    height: z.number()
  }).optional()
});

export class CollaborationEngine {
  private workspaces: Map<string, Workspace> = new Map();
  private documents: Map<string, WorkspaceDocument> = new Map();
  private comments: Map<string, Comment[]> = new Map();
  private templates: Map<string, WorkspaceTemplate> = new Map();
  private activeUsers: Map<string, User> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // Workspace Management
  async createWorkspace(data: Omit<Workspace, 'id' | 'documents' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const workspace: Workspace = {
      ...data,
      id: `ws_${Date.now()}`,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.get(id) || null;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values()).filter(ws =>
      ws.members.some(member => member.userId === userId)
    );
  }

  // Document Management
  async createDocument(
    workspaceId: string, 
    data: Omit<WorkspaceDocument, 'id' | 'createdAt' | 'updatedAt'>,
    templateId?: string
  ): Promise<WorkspaceDocument> {
    let content = data.content;
    
    // Apply template if specified
    if (templateId) {
      const template = this.templates.get(templateId);
      if (template) {
        content = this.applyTemplate(template, data.content);
      }
    }

    const document: WorkspaceDocument = {
      ...data,
      content,
      id: `doc_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.documents.set(document.id, document);

    // Add to workspace
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      workspace.documents.push(document);
      workspace.updatedAt = new Date();
    }

    return document;
  }

  async updateDocument(
    documentId: string, 
    updates: Partial<WorkspaceDocument>, 
    userId: string
  ): Promise<WorkspaceDocument | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    // Check permissions
    if (!document.collaborators.includes(userId) && document.createdBy !== userId) {
      throw new Error('Insufficient permissions to update document');
    }

    const updatedDocument = {
      ...document,
      ...updates,
      updatedAt: new Date()
    };

    this.documents.set(documentId, updatedDocument);
    
    // Trigger automation rules
    await this.processAutomationRules('document_updated', updatedDocument, userId);

    return updatedDocument;
  }

  async getDocument(documentId: string, userId: string): Promise<WorkspaceDocument | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    // Check access permissions
    if (!this.hasDocumentAccess(document, userId)) {
      throw new Error('Access denied');
    }

    return document;
  }

  // Real-time Collaboration
  async addComment(
    documentId: string, 
    userId: string, 
    content: string, 
    position?: Comment['position']
  ): Promise<Comment> {
    const comment: Comment = {
      id: `comment_${Date.now()}`,
      documentId,
      userId,
      content,
      position,
      isResolved: false,
      createdAt: new Date(),
      replies: []
    };

    const documentComments = this.comments.get(documentId) || [];
    documentComments.push(comment);
    this.comments.set(documentId, documentComments);

    return comment;
  }

  async resolveComment(commentId: string, userId: string): Promise<boolean> {
    for (const [documentId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        comment.isResolved = true;
        return true;
      }
    }
    return false;
  }

  async getDocumentComments(documentId: string): Promise<Comment[]> {
    return this.comments.get(documentId) || [];
  }

  // Template Management
  async createTemplate(template: Omit<WorkspaceTemplate, 'id'>): Promise<WorkspaceTemplate> {
    const newTemplate: WorkspaceTemplate = {
      ...template,
      id: `tpl_${Date.now()}`
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async getTemplates(category?: string): Promise<WorkspaceTemplate[]> {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  private applyTemplate(template: WorkspaceTemplate, existingContent?: any): any {
    // Merge template structure with existing content
    return {
      ...template.structure,
      ...existingContent,
      templateId: template.id,
      requiredFields: template.requiredFields
    };
  }

  // User Management
  async addUserToWorkspace(
    workspaceId: string, 
    userId: string, 
    role: 'owner' | 'editor' | 'viewer',
    permissions: string[] = []
  ): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const existingMember = workspace.members.find(m => m.userId === userId);
    if (existingMember) {
      existingMember.role = role;
      existingMember.permissions = permissions;
    } else {
      workspace.members.push({ userId, role, permissions });
    }

    workspace.updatedAt = new Date();
    return true;
  }

  async setUserOnline(userId: string, isOnline: boolean): Promise<void> {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastActive = new Date();
    }
  }

  async getActiveUsers(workspaceId: string): Promise<User[]> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return [];

    return workspace.members
      .map(member => this.activeUsers.get(member.userId))
      .filter((user): user is User => user !== undefined && user.isOnline);
  }

  // Automation & Workflows
  private async processAutomationRules(
    trigger: AutomationRule['trigger'], 
    context: any, 
    userId: string
  ): Promise<void> {
    // In a real implementation, this would process automation rules
    // For now, we'll implement basic notifications
    
    if (trigger === 'document_updated' && context.type === 'investment_memo') {
      // Notify stakeholders of investment memo updates
      await this.notifyStakeholders(context, 'Investment memo updated');
    }
  }

  private async notifyStakeholders(document: WorkspaceDocument, message: string): Promise<void> {
    // Implementation for notifications (email, in-app, Slack integration)
    console.log(`Notification: ${message} for document ${document.title}`);
  }

  private hasDocumentAccess(document: WorkspaceDocument, userId: string): boolean {
    return document.createdBy === userId || 
           document.collaborators.includes(userId);
  }

  // Initialize default templates
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<WorkspaceTemplate, 'id'>[] = [
      {
        name: 'Investment Committee Memo',
        type: 'investment_memo',
        description: 'Standard template for investment committee presentations',
        category: 'investment',
        requiredFields: ['investment_thesis', 'risk_factors', 'financial_projections', 'recommendation'],
        structure: {
          sections: [
            { title: 'Executive Summary', type: 'text', required: true },
            { title: 'Investment Thesis', type: 'text', required: true },
            { title: 'Financial Analysis', type: 'model_output', required: true },
            { title: 'Risk Factors', type: 'text', required: true },
            { title: 'Recommendation', type: 'text', required: true }
          ]
        }
      },
      {
        name: 'Due Diligence Checklist',
        type: 'due_diligence',
        description: 'Comprehensive due diligence checklist for investments',
        category: 'investment',
        requiredFields: ['company_overview', 'financial_review', 'legal_review', 'recommendation'],
        structure: {
          sections: [
            { title: 'Company Overview', type: 'text', required: true },
            { title: 'Management Assessment', type: 'text', required: true },
            { title: 'Financial Review', type: 'data_table', required: true },
            { title: 'Market Analysis', type: 'ai_analysis', required: true },
            { title: 'Legal & Compliance', type: 'text', required: true },
            { title: 'Final Recommendation', type: 'text', required: true }
          ]
        }
      },
      {
        name: 'Quarterly Portfolio Review',
        type: 'research_report',
        description: 'Template for quarterly portfolio performance reviews',
        category: 'reporting',
        requiredFields: ['performance_summary', 'attribution_analysis', 'outlook'],
        structure: {
          sections: [
            { title: 'Performance Summary', type: 'financial_chart', required: true },
            { title: 'Attribution Analysis', type: 'data_table', required: true },
            { title: 'Risk Metrics', type: 'data_table', required: true },
            { title: 'Market Outlook', type: 'ai_analysis', required: true },
            { title: 'Portfolio Changes', type: 'text', required: true }
          ]
        }
      }
    ];

    defaultTemplates.forEach(template => {
      const id = `tpl_${template.name.toLowerCase().replace(/\s+/g, '_')}`;
      this.templates.set(id, { ...template, id });
    });
  }
}

// Factory function
export function createCollaborationEngine(): CollaborationEngine {
  return new CollaborationEngine();
}

// Utility functions
export function getUserRolePermissions(role: User['role']): string[] {
  const permissions = {
    portfolio_manager: ['read', 'write', 'approve', 'manage_team', 'access_all'],
    team_lead: ['read', 'write', 'approve', 'manage_team'],
    research_analyst: ['read', 'write', 'create_reports'],
    compliance_officer: ['read', 'audit', 'approve_compliance'],
    junior_analyst: ['read', 'write_draft']
  };

  return permissions[role] || ['read'];
}

export function getDocumentTypeIcon(type: WorkspaceDocument['type']): string {
  const icons = {
    investment_memo: '📊',
    due_diligence: '🔍',
    pitch_deck: '📈',
    research_report: '📋',
    model: '🧮',
    dashboard: '📱'
  };

  return icons[type] || '📄';
}