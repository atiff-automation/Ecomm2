'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import {
  SettingsLayout,
  SettingsCard,
  SettingsSection,
  SettingsInput,
  SettingsFormActions,
} from '@/components/settings';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  personalInfoSchema,
  passwordChangeSchema,
} from '@/lib/validation/settings';
import type {
  PersonalInfoFormData,
  PasswordChangeFormData,
} from '@/lib/validation/settings';
import {
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

export default function AccountSettingsPage() {
  const { data: session, update } = useSession();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // Personal Information Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfile,
    setValue: setProfileValue,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
  });

  // Password Change Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  // Load user data when session is available
  useEffect(() => {
    if (session?.user) {
      resetProfile({
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        dateOfBirth: session.user.dateOfBirth
          ? new Date(session.user.dateOfBirth).toISOString().split('T')[0]
          : '',
      });
    }
  }, [session, resetProfile]);

  const handleProfileUpdate = async (data: PersonalInfoFormData) => {
    if (!session?.user?.id) {
      return;
    }

    setIsLoadingProfile(true);
    try {
      const response = await fetchWithCSRF('/api/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      // Update session with new data
      await update({
        ...session,
        user: {
          ...session.user,
          ...data,
        },
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (data: PasswordChangeFormData) => {
    if (!session?.user?.id) {
      return;
    }

    setIsLoadingPassword(true);
    try {
      const response = await fetchWithCSRF('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      resetPassword();
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    } finally {
      setIsLoadingPassword(false);
    }
  };

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <SettingsLayout
      title="Account Settings"
      subtitle="Manage your personal information and account security"
    >
      {/* Account Overview */}
      <SettingsCard
        title="Account Overview"
        description="Your account status and basic information"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Account Type</p>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={session.user.isMember ? 'default' : 'secondary'}
                >
                  {session.user.isMember ? 'Member' : 'Customer'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email Status</p>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    session.user.emailVerified ? 'default' : 'destructive'
                  }
                >
                  {session.user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Member Since</p>
              <p className="text-sm text-gray-500">
                {session.user.memberSince
                  ? new Date(session.user.memberSince).toLocaleDateString()
                  : new Date(session.user.createdAt!).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Personal Information */}
      <SettingsCard
        title="Personal Information"
        description="Update your personal details and contact information"
      >
        <form
          onSubmit={handleProfileSubmit(handleProfileUpdate)}
          className="space-y-6"
        >
          <SettingsSection title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsInput
                label="First Name"
                type="text"
                required
                {...registerProfile('firstName')}
                error={profileErrors.firstName?.message}
                placeholder="Enter your first name"
              />

              <SettingsInput
                label="Last Name"
                type="text"
                required
                {...registerProfile('lastName')}
                error={profileErrors.lastName?.message}
                placeholder="Enter your last name"
              />
            </div>
          </SettingsSection>

          <SettingsSection title="Contact Information">
            <div className="space-y-4">
              <SettingsInput
                label="Email Address"
                type="email"
                required
                {...registerProfile('email')}
                error={profileErrors.email?.message}
                placeholder="Enter your email address"
                helperText="Your email address is used for login and notifications"
              />

              <SettingsInput
                label="Phone Number"
                type="tel"
                {...registerProfile('phone')}
                error={profileErrors.phone?.message}
                placeholder="012-3456789"
                helperText="Malaysian mobile number (optional)"
              />

              <SettingsInput
                label="Date of Birth"
                type="date"
                {...registerProfile('dateOfBirth')}
                error={profileErrors.dateOfBirth?.message}
                helperText="Optional - used for special birthday offers"
              />
            </div>
          </SettingsSection>

          <SettingsFormActions>
            <Button
              type="button"
              variant="outline"
              disabled={!isProfileDirty || isLoadingProfile}
              onClick={() => resetProfile()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isProfileDirty || isLoadingProfile}
              loading={isLoadingProfile}
            >
              {isLoadingProfile ? 'Updating...' : 'Update Profile'}
            </Button>
          </SettingsFormActions>
        </form>
      </SettingsCard>

      {/* Password Security */}
      <SettingsCard
        title="Password Security"
        description="Change your account password to keep your account secure"
      >
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">
                Password Requirements
              </h4>
              <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character (@$!%*?&)</li>
              </ul>
            </div>
          </div>
        </div>

        <form
          onSubmit={handlePasswordSubmit(handlePasswordChange)}
          className="space-y-6"
        >
          <SettingsSection title="Change Password">
            <div className="space-y-4">
              <SettingsInput
                label="Current Password"
                type="password"
                required
                {...registerPassword('currentPassword')}
                error={passwordErrors.currentPassword?.message}
                placeholder="Enter your current password"
              />

              <SettingsInput
                label="New Password"
                type="password"
                required
                {...registerPassword('newPassword')}
                error={passwordErrors.newPassword?.message}
                placeholder="Enter your new password"
              />

              <SettingsInput
                label="Confirm New Password"
                type="password"
                required
                {...registerPassword('confirmPassword')}
                error={passwordErrors.confirmPassword?.message}
                placeholder="Confirm your new password"
              />
            </div>
          </SettingsSection>

          <SettingsFormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => resetPassword()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoadingPassword}
              loading={isLoadingPassword}
            >
              {isLoadingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </SettingsFormActions>
        </form>
      </SettingsCard>

      {/* Quick Actions */}
      <SettingsCard
        title="Quick Actions"
        description="Frequently used account management tools"
      >
        <SettingsSection title="Address Management">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/settings/account/addresses">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Manage Addresses
                    </h4>
                    <p className="text-sm text-gray-500">
                      Add, edit, or delete your shipping and billing addresses
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </SettingsSection>
      </SettingsCard>

      {/* Account Actions */}
      <SettingsCard
        title="Account Actions"
        description="Manage your account status and data"
      >
        <SettingsSection title="Data Management">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Export Account Data
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Download a copy of your account data, including orders,
                addresses, and preferences.
              </p>
              <Button variant="outline" size="sm">
                Request Data Export
              </Button>
            </div>

            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h4 className="text-sm font-medium text-red-900 mb-2">
                Delete Account
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <Button variant="destructive" size="sm">
                Request Account Deletion
              </Button>
            </div>
          </div>
        </SettingsSection>
      </SettingsCard>
    </SettingsLayout>
  );
}
