/**
 * Chat API Client
 * Centralized API communication for chat system
 */

import type { 
  CreateSessionResponse, 
  SendMessageResponse, 
  GetMessagesResponse,
  ChatError,
  ChatMessage 
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ChatError;
}

interface CreateSessionRequest {
  userId?: string;
  guestEmail?: string; // Keep for backward compatibility during transition
  guestPhone?: string; // New field for contact number
  metadata?: Record<string, any>;
}

interface InitSessionRequest extends CreateSessionRequest {
  isUIInit: boolean;
}

interface SendMessageRequest {
  sessionId: string;
  content: string;
  messageType?: 'text' | 'quick_reply';
  metadata?: Record<string, any>;
}

interface GetMessagesParams {
  sessionId: string;
  page?: number;
  limit?: number;
}

interface GetSessionParams {
  sessionId: string;
}

class ChatApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(baseUrl = '/api/chat', timeout = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: data.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' }
        };
      }

      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: {
              code: 'TIMEOUT_ERROR',
              message: 'Request timed out'
            }
          };
        }
        
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error.message
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred'
        }
      };
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(request: CreateSessionRequest): Promise<ApiResponse<CreateSessionResponse>> {
    return this.makeRequest<CreateSessionResponse>('/session', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Initialize a chat session for UI (bypasses rate limits)
   */
  async initSession(request: InitSessionRequest): Promise<ApiResponse<CreateSessionResponse>> {
    return this.makeRequest<CreateSessionResponse>('/init', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get session details with recent messages
   */
  async getSession(params: GetSessionParams): Promise<ApiResponse<CreateSessionResponse & { messages: ChatMessage[] }>> {
    const searchParams = new URLSearchParams();
    searchParams.append('sessionId', params.sessionId);

    return this.makeRequest<CreateSessionResponse & { messages: ChatMessage[] }>(
      `/session?${searchParams.toString()}`,
      { method: 'GET' }
    );
  }

  /**
   * Send a message
   */
  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> {
    return this.makeRequest<SendMessageResponse>('/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get message history for a session
   */
  async getMessages(params: GetMessagesParams): Promise<ApiResponse<GetMessagesResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.makeRequest<GetMessagesResponse>(
      `/messages/${params.sessionId}?${searchParams.toString()}`,
      { method: 'GET' }
    );
  }

  /**
   * Check if a session exists and is valid
   */
  async validateSession(sessionId: string): Promise<ApiResponse<{ valid: boolean; session?: CreateSessionResponse }>> {
    try {
      const response = await this.getSession({ sessionId });
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            valid: true,
            session: response.data
          }
        };
      }

      return {
        success: true,
        data: { valid: false }
      };
    } catch (error) {
      return {
        success: true,
        data: { valid: false }
      };
    }
  }

  /**
   * Get chat health status (using fast lightweight endpoint)
   */
  async getHealthStatus(): Promise<ApiResponse<{ status: string; timestamp: string; service: string }>> {
    // Use dedicated health endpoint which is optimized for speed
    return this.makeRequest<{ status: string; timestamp: string; service: string }>('/health', {
      method: 'GET',
    });
  }

  /**
   * Make request with custom timeout (for health checks that need more time)
   */
  private async makeRequestWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {},
    customTimeout: number = this.timeout
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), customTimeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: data.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' }
        };
      }

      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: {
              code: 'TIMEOUT_ERROR',
              message: 'Request timed out'
            }
          };
        }
        
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error.message
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred'
        }
      };
    }
  }

  /**
   * Get chat health status with extended timeout
   */
  async getHealthStatusWithTimeout(): Promise<ApiResponse<{ status: string; timestamp: string; service: string }>> {
    // Use dedicated health endpoint with extended 30-second timeout for development
    return this.makeRequestWithTimeout<{ status: string; timestamp: string; service: string }>('/health', {
      method: 'GET',
    }, 30000);
  }
}

// Export singleton instance
export const chatApi = new ChatApiClient();

// Error handling utilities
export class ChatApiError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(error: ChatError) {
    super(error.message);
    this.name = 'ChatApiError';
    this.code = error.code;
    this.details = error.details;
  }
}

export function isChatApiError(error: unknown): error is ChatApiError {
  return error instanceof ChatApiError;
}

export function handleApiError(error: ChatError): ChatApiError {
  return new ChatApiError(error);
}

// Retry utility for failed requests
export async function withRetry<T>(
  operation: () => Promise<ApiResponse<T>>,
  maxAttempts = 3,
  delay = 1000
): Promise<ApiResponse<T>> {
  let lastError: ChatError = { code: 'UNKNOWN_ERROR', message: 'Unknown error' };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      if (result.success) {
        return result;
      }

      lastError = result.error!;
      
      // Don't retry for certain error codes
      const noRetryErrors = ['VALIDATION_ERROR', 'AUTHENTICATION_ERROR', 'RATE_LIMIT_EXCEEDED'];
      if (noRetryErrors.includes(lastError.code)) {
        break;
      }

    } catch (error) {
      lastError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  return {
    success: false,
    error: lastError
  };
}