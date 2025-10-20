/**
 * Main Sales Report Page
 * Admin-only page for comprehensive sales analytics
 * Malaysian E-commerce Platform
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { SalesDashboard } from '@/components/admin/reports/sales-dashboard';

export const metadata: Metadata = {
  title: 'Sales Reports | Admin Dashboard',
  description:
    'Comprehensive sales analytics for Malaysian e-commerce platform',
};

export default async function SalesReportsPage() {
  const session = await getServerSession(authOptions);

  // Check authentication and authorization
  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/admin');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Admin</span>
          <span>→</span>
          <span>Reports</span>
          <span>→</span>
          <span className="font-medium text-foreground">Sales</span>
        </div>
      </div>

      {/* Main Dashboard */}
      <SalesDashboard />
    </div>
  );
}
