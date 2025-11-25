/**
 * Edit Click Page Page
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ClickPageEditor } from '../../_components/ClickPageEditor';
import type { Block } from '@/types/click-page.types';
import type { ThemeSettings } from '@/types/click-page-styles.types';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const clickPage = await prisma.clickPage.findUnique({
    where: { id: params.id },
    select: { title: true },
  });

  return {
    title: clickPage ? `Edit: ${clickPage.title} | Admin` : 'Edit Click Page | Admin',
  };
}

export default async function EditClickPage({ params }: PageProps) {
  const clickPage = await prisma.clickPage.findUnique({
    where: { id: params.id },
  });

  if (!clickPage) {
    notFound();
  }

  // Transform the data for the editor
  const initialData = {
    id: clickPage.id,
    title: clickPage.title,
    slug: clickPage.slug,
    blocks: (clickPage.blocks as unknown as Block[]) || [],
    status: clickPage.status,
    metaTitle: clickPage.metaTitle || '',
    metaDescription: clickPage.metaDescription || '',
    metaKeywords: clickPage.metaKeywords || [],
    ogImageUrl: clickPage.ogImageUrl || '',
    fbPixelId: clickPage.fbPixelId || '',
    gaTrackingId: clickPage.gaTrackingId || '',
    gtmContainerId: clickPage.gtmContainerId || '',
    scheduledPublishAt: clickPage.scheduledPublishAt,
    scheduledUnpublishAt: clickPage.scheduledUnpublishAt,
    campaignName: clickPage.campaignName || '',
    themeSettings: (clickPage.themeSettings as unknown as ThemeSettings) || undefined,
  };

  return <ClickPageEditor mode="edit" initialData={initialData} />;
}
