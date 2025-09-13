import { NextResponse } from 'next/server';

export class ChatError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: any;

  constructor(message: string, code: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Chat-specific error types
export const CHAT_ERRORS = {
  // Session errors
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_CREATION_FAILED: 'SESSION_CREATION_FAILED',
  
  // Message errors
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  MESSAGE_CREATION_FAILED: 'MESSAGE_CREATION_FAILED',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  INVALID_MESSAGE_TYPE: 'INVALID_MESSAGE_TYPE',
  
  // Webhook errors
  WEBHOOK_VALIDATION_FAILED: 'WEBHOOK_VALIDATION_FAILED',
  WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',
  WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
  WEBHOOK_TIMEOUT: 'WEBHOOK_TIMEOUT',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Error factory functions
export function createChatError(
  errorType: keyof typeof CHAT_ERRORS,
  message?: string,
  details?: any
): ChatError {
  const errorCode = CHAT_ERRORS[errorType];
  
  switch (errorType) {
    case 'SESSION_NOT_FOUND':
      return new ChatError(
        message || 'Chat session not found',
        errorCode,
        404,
        details
      );
      
    case 'SESSION_EXPIRED':
      return new ChatError(
        message || 'Your chat session has expired. Please start a new conversation to continue.',
        errorCode,
        410,
        { 
          ...details,
          userFriendly: true,
          action: 'start_new_session',
          suggestion: 'Click "Start New Chat" to continue your conversation'
        }
      );
      
    case 'MESSAGE_TOO_LONG':
      return new ChatError(
        message || 'Message content exceeds maximum length',
        errorCode,
        400,
        details
      );
      
    case 'RATE_LIMIT_EXCEEDED':
      return new ChatError(
        message || 'Rate limit exceeded. Please try again later',
        errorCode,
        429,
        details
      );
      
    case 'WEBHOOK_SIGNATURE_INVALID':
      return new ChatError(
        message || 'Invalid webhook signature',
        errorCode,
        401,
        details
      );
      
    case 'VALIDATION_ERROR':
      return new ChatError(
        message || 'Invalid input data',
        errorCode,
        400,
        details
      );
      
    case 'DATABASE_ERROR':
      return new ChatError(
        message || 'Database operation failed',
        errorCode,
        500,
        details
      );
      
    default:
      return new ChatError(
        message || 'Internal server error',
        errorCode,
        500,
        details
      );
  }
}

// Error response handler
export function handleChatError(error: unknown): NextResponse {
  console.error('Chat Error:', error);
  
  if (error instanceof ChatError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    );
  }
  
  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      {
        error: {
          code: CHAT_ERRORS.VALIDATION_ERROR,
          message: 'Invalid input data',
          details: error,
        },
      },
      { status: 400 }
    );
  }
  
  // Generic error fallback
  return NextResponse.json(
    {
      error: {
        code: CHAT_ERRORS.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

// Success response helper
export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
}