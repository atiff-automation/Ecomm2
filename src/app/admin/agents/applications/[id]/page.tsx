/**
 * Admin Agent Application Detail Page
 * Detailed view of a single agent application
 * Following CLAUDE.md principles: Server-side data fetching, systematic implementation
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { ApplicationDetail } from '@/components/admin/agent-applications/ApplicationDetail';
import { AgentApplicationService } from '@/lib/services/agent-application.service';
import {
  AdminPageLayout,
  BreadcrumbItem,
  BREADCRUMB_CONFIGS,
} from '@/components/admin/layout';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const application = await AgentApplicationService.getApplicationById(
      params.id
    );

    if (!application) {
      return {
        title: 'Permohonan Tidak Dijumpai | Admin Dashboard',
        robots: 'noindex, nofollow',
      };
    }

    return {
      title: `Permohonan ${application.fullName} | Admin Dashboard`,
      description: `Lihat butiran permohonan ejen dari ${application.fullName}`,
      robots: 'noindex, nofollow',
    };
  } catch {
    return {
      title: 'Ralat | Admin Dashboard',
      robots: 'noindex, nofollow',
    };
  }
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/agents/applications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Memuat maklumat permohonan...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function getApplicationData(id: string) {
  try {
    const application = await AgentApplicationService.getApplicationById(id);
    return application;
  } catch (error) {
    console.error('Error fetching application:', error);
    return null;
  }
}

export default async function AdminAgentApplicationDetailPage({
  params,
}: PageProps) {
  // Check authentication
  const session = await getServerSession();
  if (
    !session?.user?.role ||
    !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
  ) {
    redirect(
      '/auth/signin?callbackUrl=/admin/agents/applications/' + params.id
    );
  }

  // Fetch application data
  const application = await getApplicationData(params.id);

  if (!application) {
    notFound();
  }

  // Define breadcrumbs for application detail
  const breadcrumbs: BreadcrumbItem[] = [
    BREADCRUMB_CONFIGS.agents.applications,
    {
      label: application.fullName,
      href: `/admin/agents/applications/${params.id}`,
    },
  ];

  return (
    <AdminPageLayout
      title={`Application: ${application.fullName}`}
      subtitle={`Review agent application submission - ID: ${application.id}`}
      breadcrumbs={breadcrumbs}
      showBackButton={true}
      backButtonLabel="Back to Applications"
      backButtonHref="/admin/agents/applications"
    >
      <Suspense fallback={<LoadingFallback />}>
        <ApplicationDetail
          application={application}
          onStatusUpdate={() => {
            // This will be handled client-side
          }}
        />
      </Suspense>
    </AdminPageLayout>
  );
}
