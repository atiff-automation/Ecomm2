'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SuperAdminRoute } from '@/components/auth/ProtectedRoute';
import { Badge } from '@/components/ui/badge';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

interface SystemStatus {
  uptime: string;
  errorCount: number;
  maintenanceMode: boolean;
}

export default function SuperAdminPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    uptime: '0h 0m',
    errorCount: 0,
    maintenanceMode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordResetEmail, setPasswordResetEmail] = useState('');

  useEffect(() => {
    fetchAdminUsers();
    fetchSystemStatus();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/superadmin/users');
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data);
      } else {
        setError('Failed to fetch admin users');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/superadmin/system-status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch {
      console.error('Failed to fetch system status');
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordResetEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/superadmin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: passwordResetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Password reset email sent to ${passwordResetEmail}`);
        setPasswordResetEmail('');
        setError('');
      } else {
        setError(data.message || 'Failed to send password reset email');
      }
    } catch {
      setError('Failed to process password reset request');
    }
  };

  const handleUserStatusToggle = async (
    userId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      const response = await fetch(`/api/superadmin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`User ${newStatus.toLowerCase()} successfully`);
        fetchAdminUsers(); // Refresh the list
        setError('');
      } else {
        setError(data.message || 'Failed to update user status');
      }
    } catch {
      setError('Failed to update user status');
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      const response = await fetch('/api/superadmin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !systemStatus.maintenanceMode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSystemStatus(prev => ({
          ...prev,
          maintenanceMode: !prev.maintenanceMode,
        }));
        setSuccessMessage(
          `Maintenance mode ${!systemStatus.maintenanceMode ? 'enabled' : 'disabled'}`
        );
        setError('');
      } else {
        setError(data.message || 'Failed to toggle maintenance mode');
      }
    } catch {
      setError('Failed to toggle maintenance mode');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <SuperAdminRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              SuperAdmin Emergency Panel
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Emergency access for admin account management only
            </p>
            <div className="mt-4 flex justify-center">
              <Badge variant="destructive" className="text-sm">
                🚨 EMERGENCY ACCESS ONLY - NO BUSINESS DATA
              </Badge>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔧 System Status
              </CardTitle>
              <CardDescription>
                Basic system monitoring for emergency purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">System Uptime</p>
                  <p className="text-2xl font-bold text-green-600">
                    {systemStatus.uptime}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Recent Errors</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {systemStatus.errorCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Maintenance Mode</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge
                      variant={
                        systemStatus.maintenanceMode
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {systemStatus.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={
                        systemStatus.maintenanceMode ? 'default' : 'destructive'
                      }
                      onClick={handleMaintenanceToggle}
                    >
                      {systemStatus.maintenanceMode ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Password Reset */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔑 Emergency Password Reset
              </CardTitle>
              <CardDescription>
                Reset admin user passwords for emergency access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="resetEmail">Admin Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={passwordResetEmail}
                    onChange={e => setPasswordResetEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handlePasswordReset} variant="destructive">
                  Send Reset Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Users Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👥 Admin Account Management
              </CardTitle>
              <CardDescription>
                Manage admin user accounts and access status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Role</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Last Login</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(user => (
                      <tr key={user.id} className="border-b">
                        <td className="py-2">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={
                              user.role === UserRole.SUPERADMIN
                                ? 'destructive'
                                : user.role === UserRole.ADMIN
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={
                              user.status === 'ACTIVE'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="py-2">
                          {user.role !== UserRole.SUPERADMIN && (
                            <Button
                              size="sm"
                              variant={
                                user.status === 'ACTIVE'
                                  ? 'destructive'
                                  : 'default'
                              }
                              onClick={() =>
                                handleUserStatusToggle(user.id, user.status)
                              }
                            >
                              {user.status === 'ACTIVE'
                                ? 'Suspend'
                                : 'Activate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-900">
                    SuperAdmin Security Notice
                  </h3>
                  <p className="text-sm text-red-800 mt-1">
                    This interface provides emergency access to admin account
                    management only. Business data, customer information, and
                    sales data are not accessible through this interface for
                    security reasons.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminRoute>
  );
}
