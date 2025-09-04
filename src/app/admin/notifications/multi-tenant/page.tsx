'use client';

/**
 * Admin Multi-Tenant Telegram Management Page
 * MULTI-TENANT: Admin oversight of all user Telegram configurations
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Settings,
  Activity,
  TrendingUp,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

// TYPES: User configuration interfaces
interface UserTelegramInfo {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: string | null;
  };
  telegram: {
    configured: boolean;
    verified: boolean;
    config: {
      ordersEnabled: boolean;
      inventoryEnabled: boolean;
      dailySummaryEnabled: boolean;
      timezone: string;
      healthStatus: string;
      lastHealthCheck: string | null;
      createdAt: string | null;
      updatedAt: string | null;
    } | null;
    health: {
      healthy: boolean;
      lastCheck: string | null;
      queuedMessages: number;
    } | null;
    error?: string;
  };
}

interface SystemHealthReport {
  timestamp: string;
  systemHealth: {
    overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'ERROR';
    score: number;
    global: {
      status: 'HEALTHY' | 'UNHEALTHY';
      error: string | null;
    };
    users: {
      total: number;
      healthy: number;
      unhealthy: number;
      healthPercentage: number;
    };
  };
  analysis: {
    errorTypes: Record<string, number>;
    recommendations: Array<{
      type: 'CRITICAL' | 'WARNING' | 'INFO';
      message: string;
      action: string;
    }>;
  };
}

export default function MultiTenantTelegramPage() {
  const router = useRouter();
  
  // STATE: Data management
  const [users, setUsers] = useState<UserTelegramInfo[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // STATE: Filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [configuredFilter, setConfiguredFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // INITIALIZATION: Load data on mount
  useEffect(() => {
    loadData();
  }, [currentPage, configuredFilter, healthFilter]);

  /**
   * Load all data - users and system health
   * CENTRALIZED: Single method for comprehensive data loading
   */
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadSystemHealth()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load Telegram management data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user configurations with filtering
   * SYSTEMATIC: Paginated user loading with filters
   */
  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(configuredFilter !== 'all' && { configured: configuredFilter }),
        ...(healthFilter !== 'all' && { health: healthFilter })
      });

      const response = await fetch(`/api/admin/telegram/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load user configurations');
    }
  };

  /**
   * Load system-wide health report
   * MONITORING: Comprehensive health assessment
   */
  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/telegram/system-health');
      const data = await response.json();

      if (response.ok) {
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  /**
   * Refresh all data
   * RELOAD: Manual data refresh
   */
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Filter users by search term
   * CLIENT-SIDE: Real-time search filtering
   */
  const filteredUsers = users.filter(userInfo => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      userInfo.user.name?.toLowerCase().includes(searchLower) ||
      userInfo.user.email?.toLowerCase().includes(searchLower) ||
      userInfo.user.id.toLowerCase().includes(searchLower)
    );
  });

  /**
   * Get status badge for user
   * UI HELPER: Consistent status display
   */
  const getUserStatusBadge = (userInfo: UserTelegramInfo) => {
    if (userInfo.telegram.error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    if (!userInfo.telegram.configured) {
      return <Badge variant="secondary">Not Configured</Badge>;
    }
    
    if (userInfo.telegram.verified && userInfo.telegram.health?.healthy) {
      return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
    }
    
    if (userInfo.telegram.configured) {
      return <Badge variant="destructive">Unhealthy</Badge>;
    }
    
    return <Badge variant="outline">Unknown</Badge>;
  };

  /**
   * Get system health color
   * UI HELPER: Visual health indication
   */
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600';
      case 'DEGRADED': return 'text-yellow-600';
      case 'UNHEALTHY': return 'text-red-600';
      case 'ERROR': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <AdminPageLayout
        title="Multi-Tenant Telegram Management"
        subtitle="Manage Telegram configurations for all users"
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
      id: 'monitoring',
      label: 'System Monitoring',
      href: '/admin/notifications/monitoring',
    },
  ];

  // PAGE ACTIONS
  const pageActions = (
    <div className="flex items-center gap-2">
      {systemHealth && (
        <Badge 
          variant="outline" 
          className={`${getHealthColor(systemHealth.systemHealth.overall)} border-current`}
        >
          <Activity className="h-3 w-3 mr-1" />
          {systemHealth.systemHealth.overall}
        </Badge>
      )}
      <Button
        onClick={refreshData}
        disabled={refreshing}
        variant="outline"
        size="sm"
      >
        {refreshing ? (
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
      title="Multi-Tenant Telegram Management"
      subtitle="Manage Telegram configurations for all users in your platform"
      actions={pageActions}
      tabs={tabs}
    >
      {/* SYSTEM HEALTH OVERVIEW */}
      {systemHealth && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getHealthColor(systemHealth.systemHealth.overall)}`}>
                    {systemHealth.systemHealth.score}%
                  </div>
                  <div className="text-sm text-muted-foreground">System Health</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemHealth.systemHealth.users.total}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{systemHealth.systemHealth.users.healthy}</div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{systemHealth.systemHealth.users.unhealthy}</div>
                  <div className="text-sm text-muted-foreground">Unhealthy</div>
                </div>
              </div>
              
              {/* RECOMMENDATIONS */}
              {systemHealth.analysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">System Recommendations</h4>
                  {systemHealth.analysis.recommendations.map((rec, index) => (
                    <Alert key={index} variant={rec.type === 'CRITICAL' ? 'destructive' : 'default'}>
                      <AlertDescription>
                        <strong>{rec.type}:</strong> {rec.message}
                        <br />
                        <em>Action: {rec.action}</em>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* FILTERS AND SEARCH */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={configuredFilter} onValueChange={setConfiguredFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by config" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">Configured Only</SelectItem>
                  <SelectItem value="false">Not Configured</SelectItem>
                </SelectContent>
              </Select>
              <Select value={healthFilter} onValueChange={setHealthFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health Status</SelectItem>
                  <SelectItem value="healthy">Healthy Only</SelectItem>
                  <SelectItem value="unhealthy">Unhealthy Only</SelectItem>
                  <SelectItem value="unknown">Unknown Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* USER LIST */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users match your search criteria.' : 'No users found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((userInfo) => (
            <Card key={userInfo.user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="font-medium">
                          {userInfo.user.name || 'Anonymous User'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {userInfo.user.email || userInfo.user.id}
                        </p>
                      </div>
                      {getUserStatusBadge(userInfo)}
                    </div>
                    
                    {/* CONFIGURATION DETAILS */}
                    {userInfo.telegram.configured && userInfo.telegram.config && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <div className="font-medium text-muted-foreground">Orders</div>
                          <div className={userInfo.telegram.config.ordersEnabled ? 'text-green-600' : 'text-gray-500'}>
                            {userInfo.telegram.config.ordersEnabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Inventory</div>
                          <div className={userInfo.telegram.config.inventoryEnabled ? 'text-green-600' : 'text-gray-500'}>
                            {userInfo.telegram.config.inventoryEnabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Daily Summary</div>
                          <div className={userInfo.telegram.config.dailySummaryEnabled ? 'text-green-600' : 'text-gray-500'}>
                            {userInfo.telegram.config.dailySummaryEnabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground">Last Updated</div>
                          <div className="text-gray-600">
                            {userInfo.telegram.config.updatedAt 
                              ? new Date(userInfo.telegram.config.updatedAt).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* ERROR MESSAGE */}
                    {userInfo.telegram.error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {userInfo.telegram.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/users/${userInfo.user.id}/telegram`)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}