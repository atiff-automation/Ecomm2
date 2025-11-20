/**
 * Landing Page Scheduler Service
 * Handles automatic publishing and unpublishing of scheduled landing pages
 * Designed to be triggered by cron jobs or middleware
 */

import { prisma } from '@/lib/db/prisma';

export interface SchedulerResult {
  published: number;
  unpublished: number;
  errors: string[];
  processedAt: Date;
}

/**
 * Process scheduled landing pages
 * Auto-publish and auto-unpublish based on scheduled times
 */
export async function processScheduledLandingPages(): Promise<SchedulerResult> {
  const result: SchedulerResult = {
    published: 0,
    unpublished: 0,
    errors: [],
    processedAt: new Date(),
  };

  const now = new Date();

  try {
    // Find all pages with active scheduling
    const scheduledPages = await prisma.landingPage.findMany({
      where: {
        isScheduled: true,
        OR: [
          {
            // Pages ready to be published
            status: 'SCHEDULED',
            scheduledPublishAt: {
              lte: now,
            },
          },
          {
            // Pages ready to be unpublished
            status: 'PUBLISHED',
            scheduledUnpublishAt: {
              lte: now,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        scheduledPublishAt: true,
        scheduledUnpublishAt: true,
        campaignName: true,
      },
    });

    // Process each scheduled page
    for (const page of scheduledPages) {
      try {
        // Check for auto-publish
        if (
          page.status === 'SCHEDULED' &&
          page.scheduledPublishAt &&
          page.scheduledPublishAt <= now
        ) {
          await prisma.landingPage.update({
            where: { id: page.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: now,
              // Keep isScheduled=true if there's an unpublish date
              isScheduled: !!page.scheduledUnpublishAt,
            },
          });

          result.published++;
          console.log(
            `[Scheduler] Auto-published landing page: ${page.title} (${page.slug})${
              page.campaignName ? ` - Campaign: ${page.campaignName}` : ''
            }`
          );
        }

        // Check for auto-unpublish
        if (
          page.status === 'PUBLISHED' &&
          page.scheduledUnpublishAt &&
          page.scheduledUnpublishAt <= now
        ) {
          await prisma.landingPage.update({
            where: { id: page.id },
            data: {
              status: 'DRAFT',
              isScheduled: false,
              // Clear scheduling dates after unpublishing
              scheduledPublishAt: null,
              scheduledUnpublishAt: null,
            },
          });

          result.unpublished++;
          console.log(
            `[Scheduler] Auto-unpublished landing page: ${page.title} (${page.slug})${
              page.campaignName ? ` - Campaign: ${page.campaignName}` : ''
            }`
          );
        }
      } catch (pageError) {
        const errorMessage = `Failed to process landing page ${page.id}: ${
          pageError instanceof Error ? pageError.message : 'Unknown error'
        }`;
        result.errors.push(errorMessage);
        console.error(`[Scheduler] ${errorMessage}`);
      }
    }

    // Log summary
    console.log(
      `[Scheduler] Completed: ${result.published} published, ${result.unpublished} unpublished, ${result.errors.length} errors`
    );

    return result;
  } catch (error) {
    const errorMessage = `Scheduler process failed: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`;
    result.errors.push(errorMessage);
    console.error(`[Scheduler] ${errorMessage}`);
    return result;
  }
}

/**
 * Get upcoming scheduled landing pages
 * Useful for displaying schedule in admin UI
 */
export async function getUpcomingScheduledLandingPages() {
  const now = new Date();

  return await prisma.landingPage.findMany({
    where: {
      isScheduled: true,
      OR: [
        {
          status: 'SCHEDULED',
          scheduledPublishAt: {
            gt: now,
          },
        },
        {
          status: 'PUBLISHED',
          scheduledUnpublishAt: {
            gt: now,
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      scheduledPublishAt: true,
      scheduledUnpublishAt: true,
      campaignName: true,
      createdAt: true,
    },
    orderBy: [
      { scheduledPublishAt: 'asc' },
      { scheduledUnpublishAt: 'asc' },
    ],
  });
}

/**
 * Calculate time until next scheduled action
 * Returns null if no scheduled actions
 */
export function getTimeUntilNextAction(
  scheduledPublishAt: Date | null,
  scheduledUnpublishAt: Date | null,
  status: string
): number | null {
  const now = new Date();

  if (status === 'SCHEDULED' && scheduledPublishAt) {
    const diff = scheduledPublishAt.getTime() - now.getTime();
    return diff > 0 ? diff : null;
  }

  if (status === 'PUBLISHED' && scheduledUnpublishAt) {
    const diff = scheduledUnpublishAt.getTime() - now.getTime();
    return diff > 0 ? diff : null;
  }

  return null;
}

/**
 * Format countdown timer for display
 * e.g., "2d 5h 30m" or "5h 30m" or "30m" or "Live now"
 */
export function formatCountdown(milliseconds: number | null): string {
  if (milliseconds === null || milliseconds <= 0) {
    return 'Ready';
  }

  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : 'Less than 1m';
}
