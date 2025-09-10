/**
 * WebSocket Event Types and Handlers
 * Centralized event definitions following DRY principles
 */

// Client to Server Events
export interface JoinChatEvent {
  type: 'join_chat';
  sessionId: string;
  userId?: string;
}

export interface LeaveChatEvent {
  type: 'leave_chat';
  sessionId: string;
}

export interface TypingEvent {
  type: 'typing';
  sessionId: string;
  isTyping: boolean;
  userId?: string;
  timestamp?: number;
}

export interface SendMessageEvent {
  type: 'send_message';
  sessionId: string;
  content: string;
  messageType?: 'text' | 'quick_reply';
}

export type ClientToServerEvent = 
  | JoinChatEvent 
  | LeaveChatEvent 
  | TypingEvent 
  | SendMessageEvent;

// Server to Client Events
export interface NewMessageEvent {
  type: 'new_message';
  sessionId: string;
  message: {
    id: string;
    sessionId: string;
    senderType: 'user' | 'bot';
    content: string;
    messageType: string;
    status: string;
    createdAt: string;
  };
}

export interface MessageStatusEvent {
  type: 'message_status';
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface BotTypingEvent {
  type: 'bot_typing';
  sessionId: string;
  isTyping: boolean;
  timestamp?: number;
}

export interface UserPresenceEvent {
  type: 'user_presence';
  sessionId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface MessageDeliveredEvent {
  type: 'message_delivered';
  messageId: string;
  sessionId: string;
  deliveredAt: string;
}

export interface MessageReadEvent {
  type: 'message_read';
  messageId: string;
  sessionId: string;
  readAt: string;
}

export interface ConnectionStatusEvent {
  type: 'connection_status';
  status: 'connected' | 'disconnected' | 'reconnecting';
}

export interface ErrorEvent {
  type: 'error';
  error: {
    code: string;
    message: string;
  };
}

export type ServerToClientEvent = 
  | NewMessageEvent 
  | MessageStatusEvent 
  | BotTypingEvent 
  | UserPresenceEvent 
  | MessageDeliveredEvent 
  | MessageReadEvent 
  | ConnectionStatusEvent 
  | ErrorEvent;

// Event Handler Types
export type EventHandler<T> = (event: T) => void | Promise<void>;

// WebSocket Connection Context
export interface WebSocketContext {
  sessionId?: string;
  userId?: string;
  connectionId: string;
  connectedAt: Date;
  lastSeen: Date;
  status: 'online' | 'offline' | 'away';
  typingTimeout?: NodeJS.Timeout;
}

// Room Management
export interface ChatRoom {
  sessionId: string;
  connections: Set<string>;
  lastActivity: Date;
  typingUsers: Map<string, { timeout: NodeJS.Timeout; timestamp: number }>;
  metadata?: Record<string, any>;
}

// WebSocket Server Configuration
export interface WebSocketConfig {
  port: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  maxConnections: number;
  corsOrigins: string[];
  enableCompression: boolean;
}