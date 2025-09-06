import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SettingsTabs } from '@/components/settings';
import { 
  User, 
  Crown, 
  Settings as SettingsIcon, 
  Shield, 
  MapPin 
} from 'lucide-react';

const settingsTabs = [
  {
    id: 'account',
    label: 'Account',
    href: '/settings/account',
    icon: <User className="h-5 w-5" />
  },
  {
    id: 'membership',
    label: 'Membership',
    href: '/settings/membership',
    icon: <Crown className="h-5 w-5" />
  },
  {
    id: 'preferences',
    label: 'Preferences',
    href: '/settings/preferences',
    icon: <SettingsIcon className="h-5 w-5" />
  },
  {
    id: 'privacy',
    label: 'Privacy',
    href: '/settings/privacy',
    icon: <Shield className="h-5 w-5" />
  }
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Only allow customers to access customer settings
  if (session.user.role !== 'CUSTOMER') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage your account settings and preferences
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.user.firstName} {session.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.user.isMember ? 'Member' : 'Customer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <SettingsTabs tabs={settingsTabs} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}