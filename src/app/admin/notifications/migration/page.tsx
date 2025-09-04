'use client';

/**
 * Admin Telegram Migration Page
 * MULTI-TENANT: Migration management interface for admins
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Database,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Shield,
  Settings,
  Play,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

// TYPES: Migration status interfaces
interface MigrationStatus {
  migrationStatus: {
    needed: boolean;
    reason: string;
    globalConfigExists: boolean;
    userConfigsExist: boolean;
  };
  globalConfig: {
    hasToken: boolean;
    ordersEnabled: boolean;
    inventoryEnabled: boolean;
    hasOrdersChat: boolean;
    hasInventoryChat: boolean;
  };
  timestamp: string;
}

interface MigrationResult {
  action: string;
  result: {
    success: boolean;
    message: string;
    details?: any;
  };
  executedBy: string;
  timestamp: string;
}

export default function TelegramMigrationPage() {
  // STATE: Migration data
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<MigrationResult | null>(null);

  // INITIALIZATION: Load migration status
  useEffect(() => {
    loadMigrationStatus();
  }, []);

  /**
   * Load migration status
   * ASSESSMENT: Check current migration state
   */
  const loadMigrationStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/telegram/migration');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load migration status');
      }

      setStatus(data);
    } catch (error) {
      console.error('Error loading migration status:', error);
      toast.error('Failed to load migration status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute migration action
   * SYSTEMATIC: Controlled migration execution
   */
  const executeMigrationAction = async (action: string, userId?: string) => {
    setExecuting(action);
    try {
      const response = await fetch('/api/admin/telegram/migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration action failed');
      }

      setLastResult(data);
      
      if (data.result.success) {
        toast.success(data.result.message);
      } else {
        toast.error(data.result.message);
      }

      // REFRESH: Reload status after action
      await loadMigrationStatus();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      toast.error(error instanceof Error ? error.message : 'Migration action failed');
    } finally {
      setExecuting(null);
    }
  };

  /**
   * Get status badge for migration state
   * UI HELPER: Visual status indication
   */
  const getStatusBadge = () => {
    if (!status) return null;

    const { needed, globalConfigExists, userConfigsExist } = status.migrationStatus;

    if (needed) {
      return <Badge variant="destructive">Migration Required</Badge>;
    }

    if (globalConfigExists && userConfigsExist) {
      return <Badge variant="default" className="bg-blue-500">Hybrid Mode</Badge>;
    }

    if (!globalConfigExists && !userConfigsExist) {
      return <Badge variant="secondary">Fresh Installation</Badge>;
    }

    return <Badge variant="default" className="bg-green-500">Migration Complete</Badge>;
  };

  // LOADING STATE
  if (loading) {
    return (
      <AdminPageLayout
        title="Telegram Migration"
        subtitle="Migrate from global to multi-tenant configuration"
        loading={true}
      />
    );
  }

  // TAB CONFIGURATION
  const tabs: TabConfig[] = [
    {
      id: 'notifications',
      label: 'Global Notifications',
      href: '/admin/notifications',
    },
    {
      id: 'multi-tenant',
      label: 'User Management',
      href: '/admin/notifications/multi-tenant',
    },
    {
      id: 'migration',
      label: 'Migration',
      href: '/admin/notifications/migration',
    },
  ];

  // PAGE ACTIONS
  const pageActions = (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      <Button
        onClick={loadMigrationStatus}
        variant="outline"
        size="sm"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        Refresh
      </Button>
    </div>
  );

  return (
    <AdminPageLayout
      title="Telegram Migration"
      subtitle="Seamlessly transition from global to multi-tenant Telegram configuration"
      actions={pageActions}
      tabs={tabs}
    >
      {/* MIGRATION STATUS */}
      {status && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CURRENT STATE */}
              <div>
                <h4 className="font-medium mb-3">Current Configuration</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Global Configuration</span>
                    <Badge variant={status.migrationStatus.globalConfigExists ? "default" : "secondary"}>
                      {status.migrationStatus.globalConfigExists ? "Present" : "None"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">User Configurations</span>
                    <Badge variant={status.migrationStatus.userConfigsExist ? "default" : "secondary"}>
                      {status.migrationStatus.userConfigsExist ? "Present" : "None"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* GLOBAL CONFIG DETAILS */}
              {status.migrationStatus.globalConfigExists && (
                <div>
                  <h4 className="font-medium mb-3">Global Configuration Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Bot Token</span>
                      <Badge variant={status.globalConfig.hasToken ? "default" : "secondary"}>
                        {status.globalConfig.hasToken ? "Configured" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Orders Channel</span>
                      <Badge variant={status.globalConfig.ordersEnabled ? "default" : "secondary"}>
                        {status.globalConfig.ordersEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Inventory Channel</span>
                      <Badge variant={status.globalConfig.inventoryEnabled ? "default" : "secondary"}>
                        {status.globalConfig.inventoryEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* STATUS MESSAGE */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Status:</strong> {status.migrationStatus.reason}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* MIGRATION ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* QUICK MIGRATION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Automatically migrate global configuration to all admin users with fallback preservation.
            </p>
            
            <Button
              onClick={() => executeMigrationAction('full-migration')}
              disabled={executing === 'full-migration' || !status?.migrationStatus.needed}
              className="w-full"
              size="lg"
            >
              {executing === 'full-migration' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running Full Migration...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Run Full Migration
                </>
              )}
            </Button>

            {!status?.migrationStatus.needed && (
              <p className="text-xs text-muted-foreground">
                Migration is not required at this time.
              </p>
            )}
          </CardContent>
        </Card>

        {/* INDIVIDUAL ACTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Individual Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => executeMigrationAction('migrate-all-admins')}
              disabled={!!executing || !status?.migrationStatus.globalConfigExists}
              variant="outline"
              className="w-full"
            >
              {executing === 'migrate-all-admins' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Migrate to All Admins
            </Button>

            <Button
              onClick={() => executeMigrationAction('create-fallback')}
              disabled={!!executing || !status?.migrationStatus.globalConfigExists}
              variant="outline"
              className="w-full"
            >
              {executing === 'create-fallback' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Create Global Fallback
            </Button>

            <Button
              onClick={() => executeMigrationAction('check')}
              disabled={!!executing}
              variant="outline"
              className="w-full"
            >
              {executing === 'check' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Validate System
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* LAST RESULT */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Last Migration Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Action:</span>
                <Badge variant="outline">{lastResult.action}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={lastResult.result.success ? "default" : "destructive"}>
                  {lastResult.result.success ? "Success" : "Failed"}
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">Message:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {lastResult.result.message}
                </p>
              </div>
              
              {lastResult.result.details && (
                <div>
                  <span className="font-medium">Details:</span>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg mt-1 overflow-auto">
                    {JSON.stringify(lastResult.result.details, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Executed at: {new Date(lastResult.timestamp).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HELP SECTION */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Migration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">What Migration Does</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Converts global configuration to user-specific</li>
                <li>• Preserves existing functionality</li>
                <li>• Creates fallback for backward compatibility</li>
                <li>• Enables multi-tenant features</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Migration Process</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 1. Extract global configuration</li>
                <li>• 2. Create user configurations for admins</li>
                <li>• 3. Preserve global fallback</li>
                <li>• 4. Validate migration success</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Migration is reversible and maintains backward compatibility. 
              Your existing Telegram notifications will continue to work during and after migration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}