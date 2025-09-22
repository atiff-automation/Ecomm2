/**
 * Chat System Type Definitions
 * Centralized type definitions for the chat system following DRY principles
 */

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'user' | 'bot';
  content: string;
  messageType: 'text' | 'quick_reply' | 'rich_content';
  metadata?: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
  updatedAt?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  guestEmail?: string; // Keep for backward compatibility during transition
  guestPhone?: string; // New field for contact number
  status: 'active' | 'ended';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface QuickReply {
  id?: string;
  text: string;
  value?: string; // The value to send when clicked
  payload?: string; // Additional payload data
  icon?: string; // Optional icon (emoji or icon name)
  metadata?: Record<string, any>;
}

export interface ChatAttachment {
  type: 'image' | 'file' | 'link';
  url: string;
  title?: string;
  description?: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface RichContentCard {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  buttons?: QuickReply[];
  metadata?: Record<string, any>;
}

export interface RichContent {
  type: 'card' | 'carousel' | 'list' | 'image_gallery';
  cards?: RichContentCard[];
  images?: string[];
  metadata?: Record<string, any>;
}

export interface BotResponse {
  content: string;
  type: 'text' | 'quick_reply' | 'rich_content';
  quickReplies?: QuickReply[];
  attachments?: ChatAttachment[];
  richContent?: RichContent;
  metadata?: Record<string, any>;
}

// Configuration interfaces following centralized approach
export interface ChatConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  maxMessageLength: number;
  enableFileUpload: boolean;
  enableTypingIndicator: boolean;
  enableSound: boolean;
  autoExpand: boolean;
  showTimestamp: boolean;
  placeholder: string;
  welcomeMessage?: string;
}

export interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isTyping: boolean;
  error: string | null;
  config: ChatConfig;
}

// Polling-based real-time updates - no WebSocket dependency required

// Component prop interfaces
export interface ChatWidgetProps {
  userId?: string;
  guestEmail?: string; // Keep for backward compatibility during transition
  guestPhone?: string; // New field for contact number
  config?: Partial<ChatConfig>;
  onSessionCreate?: (sessionId: string) => void;
  onMessageSent?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

export interface ChatWindowProps {
  sessionId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isTyping: boolean;
  config: ChatConfig;
  onSendMessage: (content: string, type?: ChatMessage['messageType']) => void;
  onClose: () => void;
  onMinimize: () => void;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  config: ChatConfig;
  sessionId: string;
}

export interface MessageItemProps {
  message: ChatMessage;
  config: ChatConfig;
  onQuickReply?: (reply: QuickReply) => void;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  config: ChatConfig;
  placeholder?: string;
}

export interface TypingIndicatorProps {
  isVisible: boolean;
  config: ChatConfig;
}

export interface ConnectionStatusProps {
  isConnected: boolean;
  config: ChatConfig;
}

// Hook interfaces
export interface UseChatOptions {
  userId?: string;
  guestEmail?: string; // Keep for backward compatibility during transition
  guestPhone?: string; // New field for contact number
  autoConnect?: boolean;
  config?: Partial<ChatConfig>;
}

export interface UseChatReturn {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isTyping: boolean;
  error: string | null;
  config: ChatConfig;
  sendMessage: (content: string, type?: ChatMessage['messageType']) => Promise<void>;
  sendQuickReply: (reply: QuickReply) => Promise<void>;
  loadHistory: (page?: number) => Promise<void>;
  clearHistory: () => void;
  reconnect: () => void;
  disconnect: () => void;
}

// Polling interfaces for HTTP-based real-time simulation
export interface PollingOptions {
  interval?: number;
  enabled?: boolean;
  onNewMessages?: (messages: ChatMessage[]) => void;
  onError?: (error: Error) => void;
}

export interface PollingState {
  isPolling: boolean;
  lastPollTimestamp: string | null;
  pollCount: number;
  errorCount: number;
}

// API response interfaces
export interface CreateSessionResponse {
  sessionId: string;
  status: string;
  expiresAt: string;
  userContext?: {
    id: string;
    name: string;
    email: string;
    isMember: boolean;
  };
}

export interface SendMessageResponse {
  messageId: string;
  status: string;
  timestamp: string;
  sessionId: string;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sessionInfo: {
    sessionId: string;
    status: string;
    expiresAt?: string;
  };
}

// Error types
export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Default configurations - single source of truth
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  position: 'bottom-right',
  theme: 'light',
  primaryColor: '#007bff',
  maxMessageLength: 1000,
  enableFileUpload: false,
  enableTypingIndicator: true,
  enableSound: false,
  autoExpand: false,
  showTimestamp: true,
  placeholder: 'Type a message...'
} as const;

export const CHAT_CONSTANTS = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 3000,
  TYPING_TIMEOUT: 3000,
  MESSAGE_BATCH_SIZE: 1000, // Match backend validation limit
  ANIMATION_DURATION: 300,
  POLLING_INTERVAL: 3000,
  POLLING_RETRY_DELAY: 5000
} as const;

// Event types for consistency
export const CHAT_EVENTS = {
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS: 'message_status',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  CONNECTION_STATUS: 'connection_status'
} as const;

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
} as const;

export const SESSION_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended'
} as const;