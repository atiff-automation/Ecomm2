import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Get current chat configuration for client-side use
 * Returns only public configuration fields that clients need
 */
export async function GET() {
  try {
    // Get active chat configuration
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true },
      select: {
        welcomeMessage: true,
        maxMessageLength: true,
        isActive: true,
      },
    });

    // If no config exists, return defaults
    if (!config) {
      return NextResponse.json({
        success: true,
        config: {
          welcomeMessage: 'Hi! How can we help you today?',
          maxMessageLength: 4000,
          isActive: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        welcomeMessage: config.welcomeMessage || 'Hi! How can we help you today?',
        maxMessageLength: config.maxMessageLength,
        isActive: config.isActive,
      },
    });

  } catch (error) {
    console.error('Public chat config GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chat configuration',
        config: {
          welcomeMessage: 'Hi! How can we help you today?',
          maxMessageLength: 4000,
          isActive: false,
        }
      },
      { status: 500 }
    );
  }
}