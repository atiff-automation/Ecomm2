/**
 * Admin Agent Applications Page
 * Main listing page for managing agent applications
 * Following CLAUDE.md principles: Server-side data fetching, systematic implementation
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ApplicationsList } from '@/components/admin/agent-applications/ApplicationsList';
import { AgentApplicationService } from '@/lib/services/agent-application.service';
import { ApplicationFilters } from '@/types/agent-application';
import {
  AdminPageLayout,
  BreadcrumbItem,
  BREADCRUMB_CONFIGS,
} from '@/components/admin/layout';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Permohonan Ejen | Admin Dashboard',
  description: 'Urus semua permohonan ejen JRM',
  robots: 'noindex, nofollow',
};

interface PageProps {
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
    hasJrmExp?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Memuat data permohonan...</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function getApplicationsData(searchParams: PageProps['searchParams']) {
  try {
    const filters: ApplicationFilters = {
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: searchParams.limit ? parseInt(searchParams.limit) : 10,
      status: searchParams.status as any,
      search: searchParams.search || '',
      hasJrmExp:
        searchParams.hasJrmExp === 'true'
          ? true
          : searchParams.hasJrmExp === 'false'
            ? false
            : undefined,
      dateFrom: searchParams.dateFrom || undefined,
      dateTo: searchParams.dateTo || undefined,
    };

    const data = await AgentApplicationService.getApplications(filters);
    return data;
  } catch (error) {
    console.error('Error fetching applications:', error);
    return null;
  }
}

export default async function AdminAgentApplicationsPage({
  searchParams,
}: PageProps) {
  // Check authentication
  const session = await getServerSession();
  if (
    !session?.user?.role ||
    !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
  ) {
    redirect('/auth/signin?callbackUrl=/admin/agents/applications');
  }

  // Fetch initial data
  const initialData = await getApplicationsData(searchParams);

  // Define breadcrumbs for agent applications
  const breadcrumbs: BreadcrumbItem[] = [
    BREADCRUMB_CONFIGS.agents.applications,
  ];

  return (
    <AdminPageLayout
      title="Agent Applications"
      subtitle="Manage and review agent application submissions"
      breadcrumbs={breadcrumbs}
    >
      <Suspense fallback={<LoadingFallback />}>
        <ApplicationsList initialData={initialData} />
      </Suspense>
    </AdminPageLayout>
  );
}
