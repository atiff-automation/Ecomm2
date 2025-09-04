/**
 * Telegram Validation API Routes
 * Handles validation endpoints for bot tokens and chat IDs
 * Provides real-time validation without saving configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramConfigService } from '@/lib/services/telegram-config.service';
import { z } from 'zod';

const tokenValidationSchema = z.object({
  token: z.string().min(10, 'Bot token is required'),
});

const chatValidationSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  botToken: z.string().min(10, 'Bot token is required'),
});

const fullConfigValidationSchema = z.object({
  botToken: z.string().min(10, 'Bot token is required'),
  ordersChatId: z.string().optional(),
  inventoryChatId: z.string().optional(),
});

/**
 * POST /api/admin/telegram/validate
 * Validate bot token, chat ID, or full configuration
 * Supports different validation types via request body type
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin authorization check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'token': {
        const { token } = tokenValidationSchema.parse(body);
        const validation = await telegramConfigService.validateBotToken(token);
        
        return NextResponse.json({
          success: true,
          type: 'token',
          valid: validation.valid,
          error: validation.error,
          botInfo: validation.botInfo,
        });
      }

      case 'chat': {
        const { chatId, botToken } = chatValidationSchema.parse(body);
        const validation = await telegramConfigService.validateChatId(chatId, botToken);
        
        return NextResponse.json({
          success: true,
          type: 'chat',
          valid: validation.valid,
          error: validation.error,
          warnings: validation.warnings,
          channelInfo: validation.channelInfo,
        });
      }

      case 'full': {
        const config = fullConfigValidationSchema.parse(body);
        
        // Validate bot token first
        const tokenValidation = await telegramConfigService.validateBotToken(config.botToken);
        if (!tokenValidation.valid) {
          return NextResponse.json({
            success: true,
            type: 'full',
            valid: false,
            error: `Bot token validation failed: ${tokenValidation.error}`,
          });
        }

        // Validate chat IDs if provided
        const chatValidations: any[] = [];
        
        if (config.ordersChatId) {
          const ordersChatValidation = await telegramConfigService.validateChatId(
            config.ordersChatId, 
            config.botToken
          );
          chatValidations.push({
            channel: 'orders',
            chatId: config.ordersChatId,
            valid: ordersChatValidation.valid,
            error: ordersChatValidation.error,
            warnings: ordersChatValidation.warnings,
            channelInfo: ordersChatValidation.channelInfo,
          });
        }

        if (config.inventoryChatId) {
          const inventoryChatValidation = await telegramConfigService.validateChatId(
            config.inventoryChatId, 
            config.botToken
          );
          chatValidations.push({
            channel: 'inventory',
            chatId: config.inventoryChatId,
            valid: inventoryChatValidation.valid,
            error: inventoryChatValidation.error,
            warnings: inventoryChatValidation.warnings,
            channelInfo: inventoryChatValidation.channelInfo,
          });
        }

        const allValid = chatValidations.every(v => v.valid);
        
        return NextResponse.json({
          success: true,
          type: 'full',
          valid: allValid,
          botInfo: tokenValidation.botInfo,
          chatValidations,
          summary: {
            botTokenValid: tokenValidation.valid,
            totalChats: chatValidations.length,
            validChats: chatValidations.filter(v => v.valid).length,
            invalidChats: chatValidations.filter(v => !v.valid).length,
          },
        });
      }

      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid validation type. Supported types: token, chat, full' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Failed to validate Telegram configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid validation request',
          details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}