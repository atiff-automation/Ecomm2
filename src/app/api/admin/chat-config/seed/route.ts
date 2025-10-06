/**
 * Seed Chat Configuration - Admin Only
 * This endpoint seeds the chat configuration directly into the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const webhookUrl = 'https://general-n8n.l30n8p.easypanel.host/webhook/31852ca2-1581-4862-85df-a5f8a7499b88/chat';

    const configs = [
      { key: 'n8n_chat_webhook_url', value: webhookUrl, type: 'string' },
      { key: 'n8n_chat_enabled', value: 'true', type: 'boolean' },
      { key: 'n8n_chat_position', value: 'bottom-right', type: 'string' },
      { key: 'n8n_chat_primary_color', value: '#2563eb', type: 'string' },
      { key: 'n8n_chat_title', value: 'Chat Support', type: 'string' },
      { key: 'n8n_chat_subtitle', value: "We're here to help", type: 'string' },
      { key: 'n8n_chat_welcome_message', value: 'Hello! 👋\\nHow can I help you today?', type: 'string' },
      { key: 'n8n_chat_input_placeholder', value: 'Type your message...', type: 'string' },
    ];

    const results = [];

    for (const config of configs) {
      const result = await prisma.systemConfig.upsert({
        where: { key: config.key },
        create: config,
        update: { value: config.value },
      });
      results.push(result);
    }

    // Verify
    const savedConfigs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'n8n_chat',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Chat configuration seeded successfully',
      seeded: results.length,
      verified: savedConfigs.length,
      configs: savedConfigs,
    });
  } catch (error) {
    console.error('Error seeding chat config:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
