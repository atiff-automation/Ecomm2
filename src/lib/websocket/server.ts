/**
 * WebSocket Server Implementation
 * Centralized WebSocket server following single source of truth principles
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';
import { chatValidation } from '@/components/chat/utils/validation';
import { chatUtils } from '@/components/chat/utils/chat-utils';
import type {
  ClientToServerEvent,
  ServerToClientEvent,
  WebSocketContext,
  ChatRoom,
  WebSocketConfig
} from './events';

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private connections = new Map<string, WebSocketContext>();
  private rooms = new Map<string, ChatRoom>();
  private config: WebSocketConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      port: parseInt(process.env.WEBSOCKET_PORT || '3001'),
      heartbeatInterval: parseInt(process.env.WEBSOCKET_HEARTBEAT_INTERVAL || '30000'),
      connectionTimeout: 60000, // 1 minute
      maxConnections: parseInt(process.env.WEBSOCKET_MAX_CONNECTIONS || '1000'),
      corsOrigins: process.env.WEBSOCKET_CORS_ORIGIN 
        ? [process.env.WEBSOCKET_CORS_ORIGIN] 
        : ['http://localhost:3000'],
      enableCompression: true,
      ...config
    };
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: this.config.corsOrigins,
        methods: ['GET', 'POST']
      },
      compression: this.config.enableCompression,
      pingTimeout: this.config.connectionTimeout,
      pingInterval: this.config.heartbeatInterval,
      maxHttpBufferSize: 1024 * 1024, // 1MB max message size
      connectTimeout: 45000, // 45 second connection timeout
      upgradeTimeout: 30000, // 30 second upgrade timeout
      allowEIO3: true, // Enable Engine.IO v3 compatibility for better browser support
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    
    console.log(`🔌 WebSocket server initialized on port ${this.config.port}`);
  }

  /**
   * Setup event handlers for WebSocket connections
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const connectionId = socket.id;
      
      // Check connection limits
      if (this.connections.size >= this.config.maxConnections) {
        console.warn(`🚫 Connection limit reached: ${this.connections.size}/${this.config.maxConnections}`);
        socket.emit('error', {
          type: 'error',
          error: { code: 'CONNECTION_LIMIT_EXCEEDED', message: 'Too many connections' }
        });
        socket.disconnect(true);
        return;
      }
      
      console.log(`🔗 Client connected: ${connectionId} (${this.connections.size + 1}/${this.config.maxConnections})`);

      // Initialize connection context
      const context: WebSocketContext = {
        connectionId,
        connectedAt: new Date(),
        lastSeen: new Date(),
        status: 'online'
      };
      this.connections.set(connectionId, context);

      // Handle client events
      this.handleClientEvents(socket, context);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Client disconnected: ${connectionId}, reason: ${reason}`);
        this.handleDisconnection(connectionId, context);
      });

      // Send connection confirmation
      socket.emit('connection_status', { 
        type: 'connection_status',
        status: 'connected' 
      });
    });
  }

  /**
   * Handle client-to-server events
   */
  private handleClientEvents(socket: Socket, context: WebSocketContext): void {
    // Join chat session
    socket.on('join_chat', async (data: any) => {
      try {
        const { sessionId, userId } = data;
        
        // Validate session
        if (!chatValidation.validateSessionId(sessionId).isValid) {
          socket.emit('error', {
            type: 'error',
            error: { code: 'INVALID_SESSION', message: 'Invalid session ID' }
          });
          return;
        }

        // Update connection context
        context.sessionId = sessionId;
        context.userId = userId;
        context.lastSeen = new Date();
        this.connections.set(socket.id, context);

        // Join socket room
        await socket.join(sessionId);

        // Add to chat room tracking
        this.addToRoom(sessionId, socket.id);

        // Broadcast presence update
        this.broadcastPresenceUpdate(sessionId, context.userId || socket.id, 'online');

        console.log(`👤 User joined chat: session=${sessionId}, connection=${socket.id}`);

        // Emit success
        socket.emit('join_chat_success', { sessionId });

      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', {
          type: 'error',
          error: { code: 'JOIN_FAILED', message: 'Failed to join chat' }
        });
      }
    });

    // Leave chat session
    socket.on('leave_chat', async (data: any) => {
      try {
        const { sessionId } = data;
        
        if (context.sessionId === sessionId) {
          await socket.leave(sessionId);
          this.removeFromRoom(sessionId, socket.id);
          
          context.sessionId = undefined;
          this.connections.set(socket.id, context);
          
          console.log(`👤 User left chat: session=${sessionId}, connection=${socket.id}`);
        }
      } catch (error) {
        console.error('Error leaving chat:', error);
      }
    });

    // Handle typing indicators with timeout management
    socket.on('typing', async (data: any) => {
      try {
        const { sessionId, isTyping } = data;
        
        if (context.sessionId === sessionId) {
          context.lastSeen = new Date();
          
          const room = this.rooms.get(sessionId);
          if (room) {
            const userId = context.userId || socket.id;
            
            if (isTyping) {
              // Clear existing timeout
              const existingTyping = room.typingUsers.get(userId);
              if (existingTyping) {
                clearTimeout(existingTyping.timeout);
              }
              
              // Set new timeout (5 seconds)
              const timeout = setTimeout(() => {
                room.typingUsers.delete(userId);
                socket.to(sessionId).emit('user_typing', {
                  type: 'user_typing',
                  sessionId,
                  isTyping: false,
                  userId,
                  timestamp: Date.now()
                });
              }, 5000);
              
              room.typingUsers.set(userId, { timeout, timestamp: Date.now() });
            } else {
              // User stopped typing
              const existingTyping = room.typingUsers.get(userId);
              if (existingTyping) {
                clearTimeout(existingTyping.timeout);
                room.typingUsers.delete(userId);
              }
            }
          }
          
          this.connections.set(socket.id, context);
          
          // Broadcast typing status to other users in the session
          socket.to(sessionId).emit('user_typing', {
            type: 'user_typing',
            sessionId,
            isTyping,
            userId: context.userId || socket.id,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });
    
    // Handle message read receipts
    socket.on('message_read', async (data: any) => {
      try {
        const { messageId, sessionId } = data;
        
        if (context.sessionId === sessionId) {
          // Update message status in database
          await prisma.chatMessage.update({
            where: { id: messageId },
            data: { status: 'read' }
          });
          
          // Broadcast read receipt
          socket.to(sessionId).emit('message_read', {
            type: 'message_read',
            messageId,
            sessionId,
            readAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error handling message read:', error);
      }
    });
    
    // Handle presence updates
    socket.on('presence_update', async (data: any) => {
      try {
        const { sessionId, status } = data;
        
        if (context.sessionId === sessionId && ['online', 'away'].includes(status)) {
          context.status = status;
          context.lastSeen = new Date();
          this.connections.set(socket.id, context);
          
          this.broadcastPresenceUpdate(sessionId, context.userId || socket.id, status);
        }
      } catch (error) {
        console.error('Error handling presence update:', error);
      }
    });

    // Handle heartbeat/ping
    socket.on('ping', () => {
      context.lastSeen = new Date();
      this.connections.set(socket.id, context);
      socket.emit('pong');
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(connectionId: string, context: WebSocketContext): void {
    // Clear any typing timeouts
    if (context.typingTimeout) {
      clearTimeout(context.typingTimeout);
    }
    
    // Remove from room if in one
    if (context.sessionId) {
      // Broadcast offline status
      this.broadcastPresenceUpdate(
        context.sessionId, 
        context.userId || connectionId, 
        'offline'
      );
      
      this.removeFromRoom(context.sessionId, connectionId);
    }

    // Remove connection tracking
    this.connections.delete(connectionId);
  }

  /**
   * Add connection to chat room
   */
  private addToRoom(sessionId: string, connectionId: string): void {
    if (!this.rooms.has(sessionId)) {
      this.rooms.set(sessionId, {
        sessionId,
        connections: new Set(),
        lastActivity: new Date(),
        typingUsers: new Map()
      });
    }

    const room = this.rooms.get(sessionId)!;
    room.connections.add(connectionId);
    room.lastActivity = new Date();
  }

  /**
   * Remove connection from chat room
   */
  private removeFromRoom(sessionId: string, connectionId: string): void {
    const room = this.rooms.get(sessionId);
    if (room) {
      room.connections.delete(connectionId);
      
      // Clear typing indicators for this user
      const context = this.connections.get(connectionId);
      if (context) {
        const userId = context.userId || connectionId;
        const typingData = room.typingUsers.get(userId);
        if (typingData) {
          clearTimeout(typingData.timeout);
          room.typingUsers.delete(userId);
        }
      }
      
      // Clean up empty rooms
      if (room.connections.size === 0) {
        // Clear all remaining typing timeouts
        for (const [userId, typingData] of room.typingUsers) {
          clearTimeout(typingData.timeout);
        }
        this.rooms.delete(sessionId);
      } else {
        room.lastActivity = new Date();
      }
    }
  }

  /**
   * Broadcast new message to session
   */
  async broadcastMessage(sessionId: string, message: any): Promise<void> {
    if (!this.io) return;

    const event: ServerToClientEvent = {
      type: 'new_message',
      sessionId,
      message
    };

    this.io.to(sessionId).emit('new_message', event);
    console.log(`📨 Message broadcasted to session: ${sessionId}`);
  }

  /**
   * Update message status for session
   */
  async updateMessageStatus(messageId: string, status: string, sessionId?: string): Promise<void> {
    if (!this.io) return;

    const event: ServerToClientEvent = {
      type: 'message_status',
      messageId,
      status: status as any
    };

    if (sessionId) {
      this.io.to(sessionId).emit('message_status', event);
    } else {
      // If no session specified, broadcast to all connections (less efficient but failsafe)
      this.io.emit('message_status', event);
    }
  }

  /**
   * Send bot typing indicator
   */
  async sendBotTyping(sessionId: string, isTyping: boolean): Promise<void> {
    if (!this.io) return;

    const event: ServerToClientEvent = {
      type: 'bot_typing',
      sessionId,
      isTyping,
      timestamp: Date.now()
    };

    this.io.to(sessionId).emit('bot_typing', event);
  }

  /**
   * Broadcast presence update to session
   */
  private broadcastPresenceUpdate(sessionId: string, userId: string, status: 'online' | 'offline' | 'away'): void {
    if (!this.io) return;

    const event: ServerToClientEvent = {
      type: 'user_presence',
      sessionId,
      status,
      lastSeen: status === 'offline' ? new Date().toISOString() : undefined
    };

    this.io.to(sessionId).emit('user_presence', event);
    console.log(`👤 Presence updated: user=${userId}, status=${status}, session=${sessionId}`);
  }

  /**
   * Send message delivery receipt
   */
  async sendDeliveryReceipt(messageId: string, sessionId: string): Promise<void> {
    if (!this.io) return;

    try {
      // Update message status in database
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { status: 'delivered' }
      });

      const event: ServerToClientEvent = {
        type: 'message_delivered',
        messageId,
        sessionId,
        deliveredAt: new Date().toISOString()
      };

      this.io.to(sessionId).emit('message_delivered', event);
      console.log(`✅ Delivery receipt sent: messageId=${messageId}, session=${sessionId}`);
    } catch (error) {
      console.error('Error sending delivery receipt:', error);
    }
  }

  /**
   * Start heartbeat monitoring with performance optimization
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.cleanupStaleConnections();
      this.performMemoryCleanup();
      this.logPerformanceMetrics();
    }, this.config.heartbeatInterval);
  }

  /**
   * Clean up stale connections
   */
  private cleanupStaleConnections(): void {
    const now = new Date();
    const staleThreshold = this.config.connectionTimeout;

    for (const [connectionId, context] of this.connections.entries()) {
      const timeSinceLastSeen = now.getTime() - context.lastSeen.getTime();
      
      if (timeSinceLastSeen > staleThreshold) {
        console.log(`🧹 Cleaning up stale connection: ${connectionId}`);
        
        // Remove from room if in one
        if (context.sessionId) {
          this.removeFromRoom(context.sessionId, connectionId);
        }
        
        // Disconnect socket
        const socket = this.io?.sockets.sockets.get(connectionId);
        socket?.disconnect(true);
        
        // Remove from tracking
        this.connections.delete(connectionId);
      }
    }
  }

  /**
   * Perform memory cleanup and optimization
   */
  private performMemoryCleanup(): void {
    const now = new Date();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old rooms with no activity
    for (const [sessionId, room] of this.rooms.entries()) {
      if (room.connections.size === 0 && 
          (now.getTime() - room.lastActivity.getTime()) > cleanupThreshold) {
        // Clean up typing timeouts
        for (const [userId, typingData] of room.typingUsers) {
          clearTimeout(typingData.timeout);
        }
        this.rooms.delete(sessionId);
        console.log(`🧹 Cleaned up inactive room: ${sessionId}`);
      }
    }

    // Force garbage collection if available (Node.js with --expose-gc)
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(): void {
    const stats = this.getStats();
    const memoryUsage = process.memoryUsage();
    
    console.log(`📊 WebSocket Performance Metrics:
      - Active Connections: ${stats.totalConnections}/${this.config.maxConnections}
      - Active Rooms: ${stats.activeRooms}
      - Memory Usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memoryUsage.rss / 1024 / 1024)}MB RSS
      - Uptime: ${Math.round(process.uptime())}s`);
  }

  /**
   * Get connection statistics with enhanced metrics
   */
  getStats(): {
    totalConnections: number;
    activeRooms: number;
    connectionsPerRoom: Record<string, number>;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  } {
    const connectionsPerRoom: Record<string, number> = {};
    
    for (const [sessionId, room] of this.rooms.entries()) {
      connectionsPerRoom[sessionId] = room.connections.size;
    }

    return {
      totalConnections: this.connections.size,
      activeRooms: this.rooms.size,
      connectionsPerRoom,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          console.log('🔌 WebSocket server shutdown complete');
          resolve();
        });
      });
    }
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();

// Export class for testing
export { WebSocketManager };