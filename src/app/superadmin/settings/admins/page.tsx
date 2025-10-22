'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  SettingsLayout,
  SettingsCard,
  SettingsSection,
} from '@/components/settings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Mail,
  Calendar,
  Activity,
} from 'lucide-react';

interface AdminAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: 'ADMIN' | 'SUPERADMIN';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
  _count?: {
    createdOrders: number;
    auditLogs: number;
  };
}

export default function SuperadminAdminManagementPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await fetchWithCSRF('/api/superadmin/settings/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data || []);
      } else {
        console.error('Failed to load admin accounts');
        toast.error('Failed to load admin accounts');
      }
    } catch (error) {
      console.error('Load admins error:', error);
      toast.error('Failed to load admin accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to activate this admin account?')) {
      return;
    }

    setIsActionLoading(adminId);
    try {
      const response = await fetch(
        `/api/superadmin/settings/admins/${adminId}/activate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to activate admin account');
      }

      toast.success('Admin account activated successfully');
      await loadAdmins(); // Reload the list
    } catch (error) {
      console.error('Activate admin error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to activate admin account'
      );
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeactivateAdmin = async (adminId: string) => {
    const reason = prompt(
      'Please provide a reason for deactivating this admin account:'
    );
    if (!reason || reason.trim() === '') {
      toast.error('Deactivation reason is required');
      return;
    }

    if (
      !confirm(
        'Are you sure you want to deactivate this admin account? They will lose access immediately.'
      )
    ) {
      return;
    }

    setIsActionLoading(adminId);
    try {
      const response = await fetch(
        `/api/superadmin/settings/admins/${adminId}/deactivate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to deactivate admin account');
      }

      toast.success('Admin account deactivated successfully');
      await loadAdmins(); // Reload the list
    } catch (error) {
      console.error('Deactivate admin error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to deactivate admin account'
      );
    } finally {
      setIsActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'INACTIVE':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'SUSPENDED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Inactive
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <SettingsLayout
        title="Admin Account Management"
        subtitle="Loading admin accounts..."
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SettingsLayout>
    );
  }

  const activeAdmins = admins.filter(admin => admin.status === 'ACTIVE').length;
  const totalAdmins = admins.length;

  return (
    <SettingsLayout
      title="Admin Account Management"
      subtitle="Manage admin account access and status"
    >
      {/* Overview Stats */}
      <SettingsCard
        title="Admin Account Overview"
        description="Summary of admin account status and activity"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Admins</p>
              <p className="text-2xl font-semibold">{totalAdmins}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Admins</p>
              <p className="text-2xl font-semibold">{activeAdmins}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Your Role</p>
              <Badge
                variant="default"
                className="bg-purple-100 text-purple-800"
              >
                Superadmin
              </Badge>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Admin Accounts List */}
      <SettingsCard
        title="Admin Accounts"
        description="All admin accounts and their current status"
      >
        <SettingsSection title="Account Management">
          <div className="space-y-4">
            {admins.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No admin accounts found</p>
              </div>
            ) : (
              admins.map(admin => (
                <div key={admin.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </h3>
                          {getStatusIcon(admin.status)}
                          {getStatusBadge(admin.status)}
                        </div>

                        <div className="mt-1 space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{admin.email}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Created:{' '}
                                {new Date(admin.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {admin.lastLoginAt && (
                              <div className="flex items-center space-x-1">
                                <Activity className="h-4 w-4" />
                                <span>
                                  Last login:{' '}
                                  {new Date(
                                    admin.lastLoginAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {admin._count && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>
                                Orders processed: {admin._count.createdOrders}
                              </span>
                              <span>
                                Activities logged: {admin._count.auditLogs}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {admin.status === 'ACTIVE' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateAdmin(admin.id)}
                          disabled={isActionLoading === admin.id}
                          loading={isActionLoading === admin.id}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleActivateAdmin(admin.id)}
                          disabled={isActionLoading === admin.id}
                          loading={isActionLoading === admin.id}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>

                  {admin.status === 'SUSPENDED' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Account Suspended
                          </p>
                          <p className="text-sm text-red-700">
                            This admin account has been suspended and cannot
                            access the system.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </SettingsSection>
      </SettingsCard>

      {/* Security Information */}
      <SettingsCard
        title="Security Information"
        description="Important security considerations for admin management"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">
                  Admin Account Security
                </h4>
                <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                  <li>
                    Deactivating an admin account immediately revokes all access
                  </li>
                  <li>All admin actions are logged and audited</li>
                  <li>Only superadmin accounts can manage admin access</li>
                  <li>
                    Admin accounts are automatically logged out when deactivated
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Audit Trail
                </h4>
                <p className="text-sm text-blue-700">
                  All admin status changes are logged with timestamps, reasons,
                  and responsible superadmin details. These logs are maintained
                  for compliance and security purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
