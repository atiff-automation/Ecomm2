/**
 * Public Click Page Viewer
 * Displays click pages to visitors at /click/[slug]
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ClickPageViewer } from './ClickPageViewer';
import type { Block } from '@/types/click-page.types';
import type { ThemeSettings } from '@/types/click-page-styles.types';

interface PageProps {
  params: { slug: string };
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const clickPage = await prisma.clickPage.findFirst({
    where: {
      slug: params.slug,
      status: 'PUBLISHED',
    },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImageUrl: true,
      twitterImageUrl: true,
      canonicalUrl: true,
      noIndex: true,
    },
  });

  if (!clickPage) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: clickPage.metaTitle || clickPage.title,
    description: clickPage.metaDescription || undefined,
    keywords: clickPage.metaKeywords?.length ? clickPage.metaKeywords : undefined,
    openGraph: {
      title: clickPage.metaTitle || clickPage.title,
      description: clickPage.metaDescription || undefined,
      images: clickPage.ogImageUrl ? [clickPage.ogImageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: clickPage.metaTitle || clickPage.title,
      description: clickPage.metaDescription || undefined,
      images: clickPage.twitterImageUrl || clickPage.ogImageUrl || undefined,
    },
    alternates: {
      canonical: clickPage.canonicalUrl || undefined,
    },
    robots: clickPage.noIndex ? 'noindex, nofollow' : 'index, follow',
  };
}

/**
 * Click Page Server Component
 */
export default async function ClickPage({ params }: PageProps) {
  const { slug } = params;

  // Fetch click page
  const clickPage = await prisma.clickPage.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      // Only show if not scheduled or if within scheduled dates
      OR: [
        { scheduledPublishAt: null },
        { scheduledPublishAt: { lte: new Date() } },
      ],
    },
  });

  // Check if page exists
  if (!clickPage) {
    notFound();
  }

  // Check if campaign is active (if scheduled unpublish date exists)
  if (clickPage.scheduledUnpublishAt && new Date() > clickPage.scheduledUnpublishAt) {
    notFound();
  }

  // Increment view count (fire and forget)
  prisma.clickPage
    .update({
      where: { id: clickPage.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch((error) => {
      console.error('Error incrementing view count:', error);
    });

  // Parse blocks and theme settings from JSON
  const blocks = (clickPage.blocks as unknown as Block[]) || [];
  const themeSettings = (clickPage.themeSettings as unknown as ThemeSettings) || undefined;

  // Render tracking scripts
  const trackingScripts: { type: 'facebook' | 'google-analytics' | 'gtm'; id: string }[] = [];
  if (clickPage.fbPixelId) {
    trackingScripts.push({
      type: 'facebook' as const,
      id: clickPage.fbPixelId,
    });
  }
  if (clickPage.gaTrackingId) {
    trackingScripts.push({
      type: 'google-analytics' as const,
      id: clickPage.gaTrackingId,
    });
  }
  if (clickPage.gtmContainerId) {
    trackingScripts.push({
      type: 'gtm' as const,
      id: clickPage.gtmContainerId,
    });
  }

  return (
    <>
      {/* Custom Scripts - Head */}
      {clickPage.customScripts &&
        typeof clickPage.customScripts === 'object' &&
        (clickPage.customScripts as { head?: string[] }).head?.map((script, i) => (
          <script key={`head-${i}`} dangerouslySetInnerHTML={{ __html: script }} />
        ))}

      <ClickPageViewer
        clickPageId={clickPage.id}
        slug={slug}
        blocks={blocks}
        themeSettings={themeSettings}
        trackingScripts={trackingScripts}
      />

      {/* Custom Scripts - Body */}
      {clickPage.customScripts &&
        typeof clickPage.customScripts === 'object' &&
        (clickPage.customScripts as { body?: string[] }).body?.map((script, i) => (
          <script key={`body-${i}`} dangerouslySetInnerHTML={{ __html: script }} />
        ))}
    </>
  );
}
