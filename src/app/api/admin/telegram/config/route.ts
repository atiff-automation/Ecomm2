/**
 * Telegram Configuration API - Malaysian E-commerce Platform
 * Allows admin to save Telegram bot credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { telegramService } from '@/lib/telegram/telegram-service';
import { z } from 'zod';

const configSchema = z.object({
  botToken: z.string().min(10, 'Bot token is required'),
  chatId: z.string().min(1, 'Chat ID is required'),
});

/**
 * POST /api/admin/telegram/config - Save Telegram configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { botToken, chatId } = configSchema.parse(body);

    // Store in system config table (more flexible than env variables)
    await prisma.$transaction(async (tx) => {
      // Update or create bot token
      await tx.systemConfig.upsert({
        where: { key: 'TELEGRAM_BOT_TOKEN' },
        update: { value: botToken },
        create: {
          key: 'TELEGRAM_BOT_TOKEN',
          value: botToken,
          type: 'string',
        },
      });

      // Update or create chat ID
      await tx.systemConfig.upsert({
        where: { key: 'TELEGRAM_CHAT_ID' },
        update: { value: chatId },
        create: {
          key: 'TELEGRAM_CHAT_ID',
          value: chatId,
          type: 'string',
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          resource: 'TelegramConfig',
          details: {
            action: 'telegram_config_updated',
            hasBotToken: !!botToken,
            hasChatId: !!chatId,
            timestamp: new Date().toISOString(),
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    });

    // Reload the telegram service configuration
    await telegramService.reloadConfiguration();

    return NextResponse.json({
      success: true,
      message: 'Telegram configuration saved successfully',
    });

  } catch (error) {
    console.error('Error saving Telegram config:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Invalid configuration data',
          errors: error.issues.map(issue => issue.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to save Telegram configuration' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/telegram/config - Get current Telegram configuration (without sensitive data)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']
        }
      },
      select: {
        key: true,
        value: true,
      },
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      configured: !!(configMap.TELEGRAM_BOT_TOKEN && configMap.TELEGRAM_CHAT_ID),
      hasToken: !!configMap.TELEGRAM_BOT_TOKEN,
      hasChatId: !!configMap.TELEGRAM_CHAT_ID,
      // Don't return actual values for security
    });

  } catch (error) {
    console.error('Error fetching Telegram config:', error);
    return NextResponse.json(
      { message: 'Failed to fetch Telegram configuration' },
      { status: 500 }
    );
  }
}