'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  RefreshCw,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ComplianceStatus {
  overallStatus: 'compliant' | 'non_compliant' | 'partial';
  requirements: ComplianceRequirement[];
  violations: Array<{
    requirementId: string;
    description: string;
    severity: string;
    remediation: string;
  }>;
}

interface ComplianceRequirement {
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

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'blocked';
  riskScore: number;
}

export default function ComplianceDashboard() {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegulation, setSelectedRegulation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const [complianceRes, auditRes] = await Promise.all([
        fetch('/api/security/compliance?action=assessment'),
        fetch('/api/security/compliance?action=audit-trail')
      ]);

      const [compliance, audit] = await Promise.all([
        complianceRes.json(),
        auditRes.json()
      ]);

      setComplianceStatus(compliance);
      setAuditEvents(audit);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-purple-600 bg-purple-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failure': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'blocked': return <Shield className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const filteredRequirements = complianceStatus?.requirements.filter(req => {
    const matchesRegulation = selectedRegulation === 'all' || req.regulation === selectedRegulation;
    const matchesSearch = searchTerm === '' || 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegulation && matchesSearch;
  }) || [];

  const complianceStats = complianceStatus ? {
    total: complianceStatus.requirements.length,
    compliant: complianceStatus.requirements.filter(r => r.implementation.status === 'compliant').length,
    nonCompliant: complianceStatus.requirements.filter(r => r.implementation.status === 'non_compliant').length,
    partial: complianceStatus.requirements.filter(r => r.implementation.status === 'partial').length,
    violations: complianceStatus.violations.length
  } : { total: 0, compliant: 0, nonCompliant: 0, partial: 0, violations: 0 };

  if (loading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading compliance data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Compliance Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Compliance Overview</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(complianceStatus?.overallStatus || 'unknown')}>
              {complianceStatus?.overallStatus || 'Unknown'}
            </Badge>
            <Button size="sm" onClick={fetchComplianceData}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {complianceStats.total}
              </div>
              <div className="text-sm text-gray-600">Total Requirements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {complianceStats.compliant}
              </div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {complianceStats.partial}
              </div>
              <div className="text-sm text-gray-600">Partial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {complianceStats.nonCompliant}
              </div>
              <div className="text-sm text-gray-600">Non-Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {complianceStats.violations}
              </div>
              <div className="text-sm text-gray-600">Violations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Violations Alert */}
      {complianceStatus?.violations.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Critical Compliance Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceStatus.violations.slice(0, 3).map((violation, index) => (
              <div key={index} className="p-3 bg-white rounded border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getRiskColor(violation.severity)}>
                    {violation.severity}
                  </Badge>
                  <span className="text-sm text-gray-600">{violation.requirementId}</span>
                </div>
                <p className="text-sm text-gray-800 mb-2">{violation.description}</p>
                <p className="text-xs text-gray-600">
                  <strong>Remediation:</strong> {violation.remediation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Compliance Requirements</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="SEC">SEC</SelectItem>
                  <SelectItem value="FINRA">FINRA</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="SOX">SOX</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {filteredRequirements.map(requirement => (
              <div key={requirement.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {requirement.regulation}
                    </Badge>
                    <Badge className={getRiskColor(requirement.riskLevel)}>
                      {requirement.riskLevel}
                    </Badge>
                  </div>
                  <Badge className={getStatusColor(requirement.implementation.status)}>
                    {requirement.implementation.status}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm">{requirement.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{requirement.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last audit: {formatDate(requirement.implementation.lastAudit)}</span>
                  <span>Next review: {formatDate(requirement.implementation.nextReview)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Audit Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Recent Audit Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {auditEvents.slice(0, 15).map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getOutcomeIcon(event.outcome)}
                  <div>
                    <div className="text-sm font-medium">{event.action}</div>
                    <div className="text-xs text-gray-600">{event.userId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {formatDateTime(event.timestamp)}
                  </div>
                  <div className="text-xs">
                    <Badge 
                      className={
                        event.riskScore > 80 ? 'bg-red-100 text-red-800' :
                        event.riskScore > 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      Risk: {event.riskScore}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Download className="h-6 w-6" />
              <span>Export Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span>Generate Audit</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Risk Assessment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Shield className="h-6 w-6" />
              <span>Security Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}