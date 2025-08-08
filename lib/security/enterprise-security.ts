import { z } from 'zod';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'data_access' | 'authentication' | 'audit' | 'compliance' | 'operational';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rules: SecurityRule[];
  enforcement: 'block' | 'warn' | 'log';
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'require_approval';
  parameters: Record<string, any>;
  description: string;
}

export interface ComplianceRequirement {
  id: string;
  regulation: 'SEC' | 'FINRA' | 'GDPR' | 'SOX' | 'INTERNAL';
  title: string;
  description: string;
  requirements: string[];
  implementation: {
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    evidence: string[];
    lastAudit: Date;
    nextReview: Date;
  };
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure' | 'blocked';
  riskScore: number;
  sessionId: string;
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: ('pii' | 'financial' | 'proprietary' | 'client_data')[];
  retention: {
    period: number; // in days
    policy: 'delete' | 'archive' | 'anonymize';
  };
  encryption: {
    required: boolean;
    algorithm: string;
  };
  access: {
    roles: string[];
    conditions: string[];
  };
}

const AuditEventSchema = z.object({
  userId: z.string(),
  action: z.string(),
  resource: z.string(),
  details: z.record(z.any()),
  outcome: z.enum(['success', 'failure', 'blocked']),
  riskScore: z.number().min(0).max(100)
});

export class EnterpriseSecurityFramework {
  private policies: Map<string, SecurityPolicy> = new Map();
  private complianceRequirements: Map<string, ComplianceRequirement> = new Map();
  private auditLog: AuditEvent[] = [];
  private dataClassifications: Map<string, DataClassification> = new Map();
  private encryptionKeys: Map<string, string> = new Map();

  constructor() {
    this.initializeSecurityPolicies();
    this.initializeComplianceRequirements();
    this.initializeDataClassifications();
  }

  // Security Policy Management
  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'lastModified'>): Promise<SecurityPolicy> {
    const newPolicy: SecurityPolicy = {
      ...policy,
      id: `policy_${Date.now()}`,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.policies.set(newPolicy.id, newPolicy);
    await this.logAuditEvent('security_policy_created', newPolicy.id, {
      policyName: newPolicy.name,
      category: newPolicy.category
    });

    return newPolicy;
  }

  async evaluateSecurityPolicy(
    userId: string, 
    action: string, 
    resource: string, 
    context: Record<string, any>
  ): Promise<{ allowed: boolean; reason?: string; requiredApproval?: boolean }> {
    const relevantPolicies = Array.from(this.policies.values())
      .filter(policy => policy.isActive && this.policyApplies(policy, action, resource));

    for (const policy of relevantPolicies) {
      for (const rule of policy.rules) {
        const evaluation = await this.evaluateRule(rule, userId, action, resource, context);
        
        if (evaluation.action === 'deny') {
          await this.logAuditEvent('access_denied', resource, {
            userId,
            action,
            policyId: policy.id,
            rule: rule.id
          }, 'blocked');

          return { 
            allowed: false, 
            reason: `Access denied by policy: ${policy.name}` 
          };
        }
        
        if (evaluation.action === 'require_approval') {
          return { 
            allowed: false, 
            requiredApproval: true,
            reason: `Approval required by policy: ${policy.name}` 
          };
        }
      }
    }

    return { allowed: true };
  }

  // Compliance Management
  async assessCompliance(): Promise<{
    overallStatus: 'compliant' | 'non_compliant' | 'partial';
    requirements: ComplianceRequirement[];
    violations: Array<{
      requirementId: string;
      description: string;
      severity: string;
      remediation: string;
    }>;
  }> {
    const requirements = Array.from(this.complianceRequirements.values());
    const violations = [];

    let compliantCount = 0;
    let nonCompliantCount = 0;

    for (const req of requirements) {
      if (req.implementation.status === 'compliant') {
        compliantCount++;
      } else if (req.implementation.status === 'non_compliant') {
        nonCompliantCount++;
        violations.push({
          requirementId: req.id,
          description: req.description,
          severity: req.riskLevel,
          remediation: this.getRemediationSteps(req)
        });
      }
    }

    const overallStatus = nonCompliantCount === 0 ? 'compliant' : 
                         compliantCount > nonCompliantCount ? 'partial' : 'non_compliant';

    return { overallStatus, requirements, violations };
  }

  // Audit and Monitoring
  async logAuditEvent(
    action: string,
    resource: string,
    details: Record<string, any>,
    outcome: 'success' | 'failure' | 'blocked' = 'success',
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      userId: userId || 'system',
      userRole: 'system', // Would be retrieved from user context
      action,
      resource,
      details,
      ipAddress: '127.0.0.1', // Would be retrieved from request
      userAgent: 'Eugene Intelligence Platform',
      outcome,
      riskScore: this.calculateRiskScore(action, resource, details, outcome),
      sessionId: sessionId || 'system_session'
    };

    this.auditLog.push(auditEvent);

    // Trigger alerts for high-risk events
    if (auditEvent.riskScore > 80) {
      await this.triggerSecurityAlert(auditEvent);
    }
  }

  async getAuditTrail(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    resource?: string;
    outcome?: string;
  }): Promise<AuditEvent[]> {
    let filteredEvents = this.auditLog;

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === filters.userId);
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= filters.endDate!);
    }

    if (filters.action) {
      filteredEvents = filteredEvents.filter(event => event.action === filters.action);
    }

    if (filters.resource) {
      filteredEvents = filteredEvents.filter(event => event.resource.includes(filters.resource!));
    }

    if (filters.outcome) {
      filteredEvents = filteredEvents.filter(event => event.outcome === filters.outcome);
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Data Protection and Encryption
  async classifyData(dataType: string, content: any): Promise<DataClassification> {
    // Intelligent data classification based on content analysis
    let classification = this.dataClassifications.get(dataType) || this.dataClassifications.get('default')!;

    // Enhanced classification based on content scanning
    if (this.containsPII(content)) {
      classification.categories.push('pii');
      classification.level = 'confidential';
    }

    if (this.containsFinancialData(content)) {
      classification.categories.push('financial');
      if (classification.level === 'public') {
        classification.level = 'internal';
      }
    }

    if (this.containsClientData(content)) {
      classification.categories.push('client_data');
      classification.level = 'restricted';
    }

    return classification;
  }

  async encryptData(data: string, classification: DataClassification): Promise<{
    encryptedData: string;
    keyId: string;
    algorithm: string;
  }> {
    if (!classification.encryption.required) {
      return {
        encryptedData: data,
        keyId: 'none',
        algorithm: 'none'
      };
    }

    const keyId = `key_${Date.now()}`;
    const algorithm = classification.encryption.algorithm || 'AES-256-GCM';
    
    // Mock encryption - in production, use proper encryption libraries
    const encryptedData = Buffer.from(data).toString('base64');
    this.encryptionKeys.set(keyId, 'mock_encryption_key');

    await this.logAuditEvent('data_encrypted', 'data_protection', {
      keyId,
      algorithm,
      dataSize: data.length,
      classification: classification.level
    });

    return { encryptedData, keyId, algorithm };
  }

  async decryptData(encryptedData: string, keyId: string): Promise<string> {
    if (keyId === 'none') {
      return encryptedData;
    }

    const encryptionKey = this.encryptionKeys.get(keyId);
    if (!encryptionKey) {
      throw new Error('Encryption key not found');
    }

    // Mock decryption - in production, use proper decryption
    const decryptedData = Buffer.from(encryptedData, 'base64').toString();

    await this.logAuditEvent('data_decrypted', 'data_protection', {
      keyId,
      dataSize: decryptedData.length
    });

    return decryptedData;
  }

  // Risk Assessment
  private calculateRiskScore(
    action: string, 
    resource: string, 
    details: Record<string, any>, 
    outcome: string
  ): number {
    let riskScore = 0;

    // Base risk by action type
    const actionRisk = {
      'login': 10,
      'data_access': 20,
      'data_export': 60,
      'configuration_change': 70,
      'user_creation': 50,
      'permission_change': 80,
      'system_modification': 90
    };

    riskScore += actionRisk[action as keyof typeof actionRisk] || 30;

    // Increase risk for failures or blocks
    if (outcome === 'failure') riskScore += 40;
    if (outcome === 'blocked') riskScore += 60;

    // Resource sensitivity
    if (resource.includes('portfolio')) riskScore += 20;
    if (resource.includes('client')) riskScore += 30;
    if (resource.includes('admin')) riskScore += 50;

    // Time-based risk (after hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 20) riskScore += 20;

    return Math.min(100, riskScore);
  }

  private async triggerSecurityAlert(event: AuditEvent): Promise<void> {
    // In production, this would send alerts via email, Slack, etc.
    console.warn('HIGH RISK SECURITY EVENT:', {
      eventId: event.id,
      userId: event.userId,
      action: event.action,
      riskScore: event.riskScore,
      timestamp: event.timestamp
    });

    await this.logAuditEvent('security_alert_triggered', 'security_monitoring', {
      originalEventId: event.id,
      riskScore: event.riskScore,
      alertLevel: 'high'
    });
  }

  // Private helper methods
  private policyApplies(policy: SecurityPolicy, action: string, resource: string): boolean {
    // Simple policy matching - in production, use more sophisticated rule engine
    return true; // Simplified for demo
  }

  private async evaluateRule(
    rule: SecurityRule,
    userId: string,
    action: string,
    resource: string,
    context: Record<string, any>
  ): Promise<{ action: 'allow' | 'deny' | 'require_approval' }> {
    // Rule evaluation logic - simplified for demo
    return { action: 'allow' };
  }

  private getRemediationSteps(requirement: ComplianceRequirement): string {
    const steps = {
      'data_retention': 'Implement automated data retention and deletion policies',
      'access_control': 'Review and update user access permissions',
      'audit_logging': 'Ensure all system activities are properly logged',
      'encryption': 'Implement encryption for sensitive data at rest and in transit'
    };

    return steps[requirement.id as keyof typeof steps] || 'Contact compliance team for guidance';
  }

  private containsPII(content: any): boolean {
    // PII detection logic - simplified
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/ // Phone
    ];

    const contentStr = JSON.stringify(content);
    return piiPatterns.some(pattern => pattern.test(contentStr));
  }

  private containsFinancialData(content: any): boolean {
    // Financial data detection
    const financialPatterns = [
      /\$[\d,]+\.?\d*/,
      /portfolio/i,
      /investment/i,
      /trading/i
    ];

    const contentStr = JSON.stringify(content);
    return financialPatterns.some(pattern => pattern.test(contentStr));
  }

  private containsClientData(content: any): boolean {
    // Client data detection
    const clientPatterns = [
      /client/i,
      /customer/i,
      /account.*\d{4,}/i
    ];

    const contentStr = JSON.stringify(content);
    return clientPatterns.some(pattern => pattern.test(contentStr));
  }

  // Initialization methods
  private initializeSecurityPolicies(): void {
    const defaultPolicies: Array<Omit<SecurityPolicy, 'id' | 'createdAt' | 'lastModified'>> = [
      {
        name: 'Data Access Control',
        description: 'Controls access to sensitive financial data',
        category: 'data_access',
        severity: 'critical',
        enforcement: 'block',
        isActive: true,
        rules: [
          {
            id: 'rule_portfolio_access',
            condition: 'action == "read_portfolio" && resource.sensitivity == "high"',
            action: 'require_approval',
            parameters: { approvers: ['compliance_officer', 'portfolio_manager'] },
            description: 'High-sensitivity portfolio data requires approval'
          }
        ]
      },
      {
        name: 'After Hours Access',
        description: 'Restricts system access during non-business hours',
        category: 'operational',
        severity: 'medium',
        enforcement: 'warn',
        isActive: true,
        rules: [
          {
            id: 'rule_after_hours',
            condition: 'time.hour < 6 || time.hour > 20',
            action: 'require_approval',
            parameters: { requireJustification: true },
            description: 'After-hours access requires justification'
          }
        ]
      }
    ];

    defaultPolicies.forEach(async policy => {
      const newPolicy = await this.createSecurityPolicy(policy);
    });
  }

  private initializeComplianceRequirements(): void {
    const requirements: ComplianceRequirement[] = [
      {
        id: 'sec_rule_201',
        regulation: 'SEC',
        title: 'Investment Adviser Recordkeeping',
        description: 'Maintain records of investment advice and client communications',
        requirements: [
          'Maintain records for 5 years',
          'Ensure records are easily accessible',
          'Implement backup and recovery procedures'
        ],
        implementation: {
          status: 'compliant',
          evidence: ['audit_log_system', 'backup_procedures', 'retention_policy'],
          lastAudit: new Date('2024-01-15'),
          nextReview: new Date('2024-07-15')
        },
        riskLevel: 'high'
      },
      {
        id: 'finra_3110',
        regulation: 'FINRA',
        title: 'Supervision',
        description: 'Establish supervisory procedures for investment activities',
        requirements: [
          'Written supervisory procedures',
          'Regular review of investment activities',
          'Training for supervisory personnel'
        ],
        implementation: {
          status: 'partial',
          evidence: ['supervisory_procedures_v1'],
          lastAudit: new Date('2024-02-01'),
          nextReview: new Date('2024-05-01')
        },
        riskLevel: 'critical'
      },
      {
        id: 'gdpr_data_protection',
        regulation: 'GDPR',
        title: 'Data Protection',
        description: 'Protect personal data of EU residents',
        requirements: [
          'Implement privacy by design',
          'Obtain explicit consent for data processing',
          'Enable data portability and deletion rights'
        ],
        implementation: {
          status: 'compliant',
          evidence: ['privacy_policy', 'consent_management', 'data_deletion_procedures'],
          lastAudit: new Date('2024-01-30'),
          nextReview: new Date('2024-07-30')
        },
        riskLevel: 'high'
      }
    ];

    requirements.forEach(req => {
      this.complianceRequirements.set(req.id, req);
    });
  }

  private initializeDataClassifications(): void {
    const classifications: Array<[string, DataClassification]> = [
      ['default', {
        level: 'internal',
        categories: [],
        retention: { period: 2555, policy: 'archive' }, // 7 years
        encryption: { required: false, algorithm: 'AES-256-GCM' },
        access: { roles: ['all'], conditions: [] }
      }],
      ['portfolio_data', {
        level: 'confidential',
        categories: ['financial', 'proprietary'],
        retention: { period: 2555, policy: 'archive' },
        encryption: { required: true, algorithm: 'AES-256-GCM' },
        access: { roles: ['portfolio_manager', 'research_analyst'], conditions: ['authenticated'] }
      }],
      ['client_data', {
        level: 'restricted',
        categories: ['pii', 'client_data'],
        retention: { period: 1825, policy: 'anonymize' }, // 5 years
        encryption: { required: true, algorithm: 'AES-256-GCM' },
        access: { roles: ['client_service', 'portfolio_manager'], conditions: ['authenticated', 'authorized'] }
      }],
      ['compliance_data', {
        level: 'restricted',
        categories: ['financial', 'proprietary'],
        retention: { period: 2555, policy: 'archive' },
        encryption: { required: true, algorithm: 'AES-256-GCM' },
        access: { roles: ['compliance_officer'], conditions: ['authenticated', 'audit_trail'] }
      }]
    ];

    classifications.forEach(([key, classification]) => {
      this.dataClassifications.set(key, classification);
    });
  }
}

// Factory function
export function createEnterpriseSecurityFramework(): EnterpriseSecurityFramework {
  return new EnterpriseSecurityFramework();
}

// Utility functions
export function getComplianceStatusColor(status: ComplianceRequirement['implementation']['status']): string {
  switch (status) {
    case 'compliant': return 'text-green-600 bg-green-100';
    case 'non_compliant': return 'text-red-600 bg-red-100';
    case 'partial': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getRiskLevelColor(level: ComplianceRequirement['riskLevel']): string {
  switch (level) {
    case 'critical': return 'text-purple-600 bg-purple-100';
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}