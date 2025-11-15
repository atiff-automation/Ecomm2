'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChangePasswordForm } from '@/components/member/ChangePasswordForm';

export default function AdminPasswordChangePage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your admin account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm
            redirectPath="/admin/settings"
            showCancel={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
