/**
 * Retention Status Component
 * Following @CLAUDE.md DRY principles - displays data retention policy information
 * Shows compliance status and retention policy details
 */

'use client';

import React from 'react';
import { 
  Shield, 
  Calendar, 
  Database, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Info,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RetentionPolicy, ArchiveStats } from '@/types/chat';

interface RetentionStatusProps {
  policy: RetentionPolicy;
  stats: ArchiveStats;
  compliance: {
    compliant: boolean;
    violations: string[];
    warnings: string[];
    score: number;
  };
  onPolicySettings?: () => void;
  onRunRetention?: () => void;
  disabled?: boolean;
}

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  loading?: boolean;
}

function StatusCard({ title, value, subtitle, icon: Icon, status = 'neutral', loading }: StatusCardProps) {
  const statusColors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    neutral: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-sm opacity-75 mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className="h-8 w-8 opacity-75" />
      </div>
    </div>
  );
}

export function RetentionStatus({ 
  policy, 
  stats, 
  compliance, 
  onPolicySettings,
  onRunRetention,
  disabled = false 
}: RetentionStatusProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getComplianceStatus = () => {
    if (compliance.score >= 90) return 'success';
    if (compliance.score >= 70) return 'warning';
    return 'error';
  };

  const getComplianceText = () => {
    if (compliance.score >= 90) return 'Excellent';
    if (compliance.score >= 70) return 'Good';
    if (compliance.score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Policy Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Data Retention Policy</h3>
              <p className="text-sm text-gray-500">{policy.description}</p>
            </div>
          </div>
          
          {onPolicySettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPolicySettings}
              disabled={disabled}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Auto Archive</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {policy.autoArchiveAfterDays} days
            </p>
            <p className="text-xs text-gray-500">After session end</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Retention Period</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {policy.purgeAfterDays} days
            </p>
            <p className="text-xs text-gray-500">Total retention</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Policy Status</span>
            </div>
            <p className={`text-lg font-semibold ${policy.enabled ? 'text-green-600' : 'text-red-600'}`}>
              {policy.enabled ? 'Active' : 'Disabled'}
            </p>
            <p className="text-xs text-gray-500">
              {policy.enabled ? 'Enforcing policy' : 'Manual only'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Total Archived"
          value={stats.totalArchived}
          subtitle="All archived sessions"
          icon={Database}
          status="neutral"
        />

        <StatusCard
          title="Archived Today"
          value={stats.archivedToday}
          subtitle="Today's archives"
          icon={Calendar}
          status="neutral"
        />

        <StatusCard
          title="Scheduled for Purge"
          value={stats.scheduledForPurge}
          subtitle="Awaiting deletion"
          icon={AlertTriangle}
          status={stats.scheduledForPurge > 0 ? 'warning' : 'success'}
        />

        <StatusCard
          title="Storage Used"
          value={formatStorage(stats.storageUsed)}
          subtitle="Archive storage"
          icon={Database}
          status="neutral"
        />
      </div>

      {/* Compliance Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              getComplianceStatus() === 'success' ? 'bg-green-100' :
              getComplianceStatus() === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {compliance.compliant ? (
                <CheckCircle2 className={`h-5 w-5 ${
                  getComplianceStatus() === 'success' ? 'text-green-600' : 'text-yellow-600'
                }`} />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Compliance Status: {getComplianceText()}
              </h3>
              <p className="text-sm text-gray-500">
                Score: {compliance.score}/100
              </p>
            </div>
          </div>

          {onRunRetention && (
            <Button
              size="sm"
              onClick={onRunRetention}
              disabled={disabled}
            >
              <Clock className="h-4 w-4 mr-2" />
              Run Retention
            </Button>
          )}
        </div>

        {/* Compliance Details */}
        <div className="space-y-4">
          {/* Violations */}
          {compliance.violations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Policy Violations</h4>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {compliance.violations.map((violation, index) => (
                      <li key={index}>• {violation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {compliance.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Warnings</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    {compliance.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Retention Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Last Run:</span>
                <span className="ml-2 font-medium">{formatDate(policy.lastRun)}</span>
              </div>
              <div>
                <span className="text-gray-600">Next Run:</span>
                <span className="ml-2 font-medium">{formatDate(policy.nextRun)}</span>
              </div>
              <div>
                <span className="text-gray-600">Oldest Archive:</span>
                <span className="ml-2 font-medium">{formatDate(stats.oldestArchive)}</span>
              </div>
              <div>
                <span className="text-gray-600">Newest Archive:</span>
                <span className="ml-2 font-medium">{formatDate(stats.newestArchive)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetentionStatus;