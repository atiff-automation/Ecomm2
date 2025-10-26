/**
 * Development Admin Setup Page - JRM E-commerce Platform
 * DEVELOPMENT ONLY - Create admin/staff/member accounts for testing
 * This page should be removed in production
 */

'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, UserPlus } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPERADMIN';
  isMember: boolean;
}

const roleDescriptions = {
  CUSTOMER: 'Regular customer account with basic access',
  STAFF: 'Staff account with admin panel access (limited permissions)',
  ADMIN: 'Administrator account with full admin panel access',
  SUPERADMIN: 'Super administrator with all permissions',
};

export default function DevAdminSetupPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: 'DevPassword123!',
    firstName: '',
    lastName: '',
    role: 'CUSTOMER',
    isMember: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [createdAccounts, setCreatedAccounts] = useState<
    Array<{
      email: string;
      role: string;
      isMember: boolean;
    }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetchWithCSRF('/api/dev/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `User created successfully: ${formData.email}`,
        });
        setCreatedAccounts(prev => [
          ...prev,
          {
            email: formData.email,
            role: formData.role,
            isMember: formData.isMember,
          },
        ]);

        // Reset form but keep role and password for easier testing
        setFormData(prev => ({
          ...prev,
          email: '',
          firstName: '',
          lastName: '',
          isMember: prev.role === 'CUSTOMER' ? false : prev.isMember,
        }));
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to create user',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while creating user',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role: role as FormData['role'],
      // Auto-enable member for non-customer roles
      isMember: role !== 'CUSTOMER' ? true : prev.isMember,
    }));
  };

  const quickCreateAccounts = async () => {
    const accounts = [
      {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN' as const,
        isMember: true,
      },
      {
        email: 'staff@test.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'STAFF' as const,
        isMember: true,
      },
      {
        email: 'member@test.com',
        firstName: 'Member',
        lastName: 'User',
        role: 'CUSTOMER' as const,
        isMember: true,
      },
      {
        email: 'customer@test.com',
        firstName: 'Regular',
        lastName: 'Customer',
        role: 'CUSTOMER' as const,
        isMember: false,
      },
    ];

    for (const account of accounts) {
      try {
        const response = await fetchWithCSRF('/api/dev/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...account,
            password: 'DevPassword123!',
          }),
        });

        if (response.ok) {
          setCreatedAccounts(prev => [
            ...prev,
            {
              email: account.email,
              role: account.role,
              isMember: account.isMember,
            },
          ]);
        }
      } catch (error) {
        console.error(`Failed to create ${account.email}:`, error);
      }
    }

    setMessage({
      type: 'success',
      text: 'Quick setup completed! Check created accounts below.',
    });
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Development Only
            </h2>
            <p className="text-gray-600">
              This page is not available in production.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Development Admin Setup
          </h1>
          <p className="text-gray-600 mt-2">
            Create test accounts with different roles
          </p>

          <Alert className="mt-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Development Only:</strong> This page should be removed
              before production deployment.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Create Test User
              </CardTitle>
              <CardDescription>
                Create individual user accounts for testing different roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <Alert
                    className={
                      message.type === 'error'
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                    }
                  >
                    {message.type === 'error' ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <AlertDescription
                      className={
                        message.type === 'error'
                          ? 'text-red-800'
                          : 'text-green-800'
                      }
                    >
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="test@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: DevPassword123! (meets all requirements)
                  </p>
                </div>

                <div>
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {roleDescriptions[formData.role]}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isMember"
                    name="isMember"
                    checked={formData.isMember}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <Label htmlFor="isMember">Member Status</Label>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Create User'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={quickCreateAccounts}
                  variant="outline"
                  className="w-full"
                  type="button"
                >
                  Quick Setup (Create All Test Accounts)
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Creates: admin@test.com, staff@test.com, member@test.com,
                  customer@test.com
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Created Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Created Test Accounts</CardTitle>
              <CardDescription>
                Use these credentials to test different user roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {createdAccounts.length > 0 ? (
                <div className="space-y-3">
                  {createdAccounts.map((account, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{account.email}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{account.role}</Badge>
                          {account.isMember && (
                            <Badge className="bg-green-100 text-green-800">
                              Member
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Password: DevPassword123!
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No accounts created yet. Use the form to create test accounts.
                </p>
              )}

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Access Levels:</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>CUSTOMER:</strong> Homepage, products, member
                    dashboard
                  </div>
                  <div>
                    <strong>STAFF:</strong> Customer access + limited admin
                    panel
                  </div>
                  <div>
                    <strong>ADMIN:</strong> Full admin panel access
                  </div>
                  <div>
                    <strong>SUPERADMIN:</strong> All permissions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Test Different Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">1. Create Test Accounts</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Use the form above or click "Quick Setup" to create accounts
                  with different roles.
                </p>

                <h4 className="font-medium mb-2">2. Login Process</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>
                    1. Go to the homepage and click "Sign In" in the header
                  </li>
                  <li>2. Use the credentials from the created accounts</li>
                  <li>3. After login, check the user dropdown in header</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. Role-Based Access</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <strong>Customer:</strong> /member/dashboard
                  </li>
                  <li>
                    <strong>Staff/Admin:</strong> /admin/dashboard (plus member
                    access)
                  </li>
                  <li>
                    <strong>Member Benefits:</strong> Available if isMember =
                    true
                  </li>
                </ul>

                <h4 className="font-medium mb-2 mt-4">
                  4. Default Credentials
                </h4>
                <div className="text-sm bg-gray-100 p-3 rounded">
                  <div>Email: [created above]</div>
                  <div>Password: DevPassword123!</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
