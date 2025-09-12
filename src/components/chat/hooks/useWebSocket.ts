'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatContext } from '../ChatProvider';
import type { ChatMessage } from '../types';
import type { 
  ClientToServerEvent, 
  ServerToClientEvent 
} from '@/lib/websocket/events';

interface WebSocketOptions {
  url?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
  state?: any;
  dispatch?: any;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

/**
 * WebSocket hook for real-time chat communication using Socket.io
 * Integrates with the WebSocket server from Phase 3: Real-time Enhancement
 */
export const useWebSocket = (options: WebSocketOptions = {}) => {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    reconnectDelay = 5000,
    maxReconnectAttempts = 5,
    enabled = true,
    state: providedState,
    dispatch: providedDispatch
  } = options;

  // Use provided state/dispatch or get from context
  let chatContext;
  
  // Only try to get context if not provided explicitly (to avoid circular dependency)
  if (!providedState && !providedDispatch) {
    try {
      chatContext = useChatContext();
    } catch (error) {
      // Context not available - this is expected during initialization
      chatContext = null;
    }
  } else {
    chatContext = null; // Use provided state/dispatch instead
  }
  
  const state = providedState || chatContext?.state;
  const dispatch = providedDispatch || chatContext?.dispatch;
  const socketRef = useRef<Socket | null>(null);
  
  const [wsState, setWsState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  });

  // Connect to Socket.io
  const connect = useCallback(() => {
    if (!enabled || !state?.session?.id || socketRef.current?.connected) {
      return;
    }

    setWsState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const socket = io(url, {
        reconnection: true,
        reconnectionDelay: reconnectDelay,
        reconnectionAttempts: maxReconnectAttempts,
        transports: ['websocket', 'polling'],
        // Performance optimizations
        forceNew: false, // Reuse existing connections
        multiplex: true, // Enable multiplexing
        timeout: 30000, // 30 second connection timeout
        upgrade: true, // Allow transport upgrades
        compress: true, // Enable compression
        perMessageDeflate: true // Enable per-message deflate compression
      });

      // Connection established
      socket.on('connect', () => {
        console.log('🔌 Socket.io connected:', socket.id);
        setWsState({
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0
        });

        // Join chat session
        socket.emit('join_chat', {
          sessionId: state?.session?.id,
          userId: state?.session?.metadata?.userId
        });
      });

      // Connection confirmed
      socket.on('connection_status', (data: any) => {
        console.log('Connection status:', data);
        if (data.status === 'connected' && dispatch) {
          dispatch({ type: 'SET_CONNECTED', payload: true });
        }
      });

      // Chat join confirmed
      socket.on('join_chat_success', (data: any) => {
        console.log('Successfully joined chat:', data.sessionId);
      });

      // New message received
      socket.on('new_message', (event: ServerToClientEvent) => {
        if (event.type === 'new_message' && dispatch) {
          console.log('📨 New message received:', event.message);
          dispatch({ type: 'ADD_MESSAGE', payload: event.message });
          
          // Mark as unread if chat is closed
          if (!state?.isOpen) {
            dispatch({ type: 'SET_UNREAD_MESSAGES', payload: true });
          }
        }
      });

      // Message status update
      socket.on('message_status', (event: ServerToClientEvent) => {
        if (event.type === 'message_status' && dispatch) {
          console.log('Message status update:', event);
          dispatch({ 
            type: 'UPDATE_MESSAGE', 
            payload: { 
              id: event.messageId, 
              updates: { status: event.status } 
            }
          });
        }
      });

      // Bot typing indicator
      socket.on('bot_typing', (event: ServerToClientEvent) => {
        if (event.type === 'bot_typing' && dispatch) {
          dispatch({ type: 'SET_TYPING', payload: event.isTyping });
        }
      });

      // User typing indicator
      socket.on('user_typing', (event: ServerToClientEvent) => {
        if (event.type === 'user_typing') {
          // Handle other users typing (for multi-user scenarios)
          console.log('User typing:', event);
        }
      });
      
      // User presence updates
      socket.on('user_presence', (event: ServerToClientEvent) => {
        if (event.type === 'user_presence' && dispatch) {
          console.log('👤 User presence update:', event);
          // Update user presence in chat state if needed
          dispatch({ 
            type: 'UPDATE_USER_PRESENCE', 
            payload: { 
              status: event.status, 
              lastSeen: event.lastSeen 
            }
          });
        }
      });
      
      // Message delivered receipts
      socket.on('message_delivered', (event: ServerToClientEvent) => {
        if (event.type === 'message_delivered' && dispatch) {
          console.log('✅ Message delivered:', event);
          dispatch({ 
            type: 'UPDATE_MESSAGE', 
            payload: { 
              id: event.messageId, 
              updates: { 
                status: 'delivered',
                deliveredAt: event.deliveredAt
              } 
            }
          });
        }
      });
      
      // Message read receipts
      socket.on('message_read', (event: ServerToClientEvent) => {
        if (event.type === 'message_read' && dispatch) {
          console.log('📖 Message read:', event);
          dispatch({ 
            type: 'UPDATE_MESSAGE', 
            payload: { 
              id: event.messageId, 
              updates: { 
                status: 'read',
                readAt: event.readAt
              } 
            }
          });
        }
      });

      // Error handling
      socket.on('error', (event: ServerToClientEvent) => {
        if (event.type === 'error') {
          console.error('Socket.io server error:', event.error);
          setWsState(prev => ({ 
            ...prev, 
            error: event.error.message,
            isConnecting: false 
          }));
        }
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io disconnected:', reason);
        setWsState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false 
        }));
        if (dispatch) dispatch({ type: 'SET_CONNECTED', payload: false });
      });

      // Connection error
      socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        setWsState(prev => ({ 
          ...prev, 
          error: `Connection failed: ${error.message}`,
          isConnecting: false,
          reconnectAttempts: prev.reconnectAttempts + 1
        }));
        if (dispatch) dispatch({ type: 'SET_CONNECTION_ERROR', payload: error.message });
      });

      // Pong response for heartbeat
      socket.on('pong', () => {
        // Heartbeat confirmed
        console.log('💓 Heartbeat confirmed');
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create Socket.io connection:', error);
      setWsState(prev => ({ 
        ...prev, 
        error: 'Failed to create Socket.io connection',
        isConnecting: false 
      }));
    }
  }, [enabled, state?.session?.id, state?.isOpen, url, reconnectDelay, maxReconnectAttempts, dispatch]);

  // Disconnect Socket.io
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Leave chat session before disconnecting
      if (state?.session?.id) {
        socketRef.current.emit('leave_chat', {
          sessionId: state.session.id
        });
      }
      
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setWsState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0
    });
  }, [state.session?.id]);

  // Send message via Socket.io
  const sendMessage = useCallback((message: Partial<ChatMessage>) => {
    if (socketRef.current?.connected && state.session?.id) {
      // Note: Actual message sending should go through the API
      // This is primarily for real-time notifications
      console.log('Message sending handled by API, WebSocket for real-time updates only');
      return true;
    }
    return false;
  }, [state?.session?.id]);

  // Send typing indicator with enhanced timeout management
  const sendTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current?.connected && state?.session?.id) {
      socketRef.current.emit('typing', {
        sessionId: state.session.id,
        isTyping,
        userId: state.session?.metadata?.userId,
        timestamp: Date.now()
      });
      if (dispatch) dispatch({ type: 'SET_USER_TYPING', payload: isTyping });
    }
  }, [state?.session?.id, state?.session?.metadata?.userId, dispatch]);
  
  // Send presence update
  const sendPresenceUpdate = useCallback((status: 'online' | 'away') => {
    if (socketRef.current?.connected && state?.session?.id) {
      socketRef.current.emit('presence_update', {
        sessionId: state.session.id,
        status
      });
    }
  }, [state?.session?.id]);
  
  // Mark message as read
  const markMessageAsRead = useCallback((messageId: string) => {
    if (socketRef.current?.connected && state?.session?.id) {
      socketRef.current.emit('message_read', {
        messageId,
        sessionId: state.session.id
      });
    }
  }, [state.session?.id]);

  // Send heartbeat ping
  const sendPing = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, []);

  // Auto-connect when enabled and session is available
  useEffect(() => {
    if (enabled && state.session?.id) {
      connect();
    } else {
      disconnect();
    }

    return disconnect;
  }, [enabled, state.session?.id, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected: wsState.isConnected,
    isConnecting: wsState.isConnecting,
    error: wsState.error,
    reconnectAttempts: wsState.reconnectAttempts,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    sendPresenceUpdate,
    markMessageAsRead,
    sendPing,
    
    // Socket.io instance (for advanced usage)
    socket: socketRef.current,
    
    // Feature availability
    isSupported: typeof window !== 'undefined' && typeof io !== 'undefined',
    isEnabled: enabled
  };
};