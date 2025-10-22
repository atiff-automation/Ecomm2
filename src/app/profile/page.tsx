'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { validateMalaysianPhoneNumber } from '@/lib/utils';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isMember: boolean;
  memberSince: string | null;
  membershipTotal: number;
}

export default function ProfilePage() {
  const { update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch {
      console.error('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (profile) {
      setProfile(prev => (prev ? { ...prev, [name]: value } : null));
    }
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile?.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profile?.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (profile?.phone && !validateMalaysianPhoneNumber(profile.phone)) {
      newErrors.phone = 'Invalid Malaysian phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || !validateForm()) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');

    try {
      const response = await fetchWithCSRF('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          phone: profile.phone || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setSuccessMessage('Profile updated successfully');

        // Update session with new name
        await update({
          name: `${data.firstName} ${data.lastName}`,
        });
      } else {
        if (data.field) {
          setErrors({ [data.field]: data.message });
        } else {
          setErrors({ general: data.message || 'Failed to update profile' });
        }
      }
    } catch {
      setErrors({ general: 'An error occurred while updating profile' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Profile Not Found
          </h2>
          <p className="text-gray-600">
            Unable to load your profile information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          {/* Member Status Card */}
          {profile.isMember && (
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">
                  🎉 Member Status
                </CardTitle>
                <CardDescription className="text-blue-700">
                  You are an active member with exclusive benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Member Since</p>
                    <p className="font-semibold text-blue-900">
                      {profile.memberSince
                        ? new Date(profile.memberSince).toLocaleDateString(
                            'en-MY'
                          )
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Total Purchases</p>
                    <p className="font-semibold text-blue-900">
                      RM {profile.membershipTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.general}
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {successMessage}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={profile.firstName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={profile.lastName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profile.phone || ''}
                    onChange={handleInputChange}
                    placeholder="012-345 6789"
                    className="mt-1"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Malaysian phone number format (optional)
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchProfile}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Additional account management options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  Download My Data
                </Button>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
