'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useChatContext } from '../ChatProvider';
import { useWebSocket } from './useWebSocket';
import type { ChatMessage } from '../types';

/**
 * Main chat hook that provides comprehensive chat functionality
 * This is the primary hook that components should use for chat interactions
 */
export const useChat = () => {
  const {
    state,
    createSession,
    loadSession,
    clearSession,
    sendMessage,
    sendQuickReply,
    loadMessages,
    openChat,
    closeChat,
    toggleChat,
    markAsRead,
    updateConfig,
    sendTyping,
    forceHealthCheck,
    isSessionExpired
  } = useChatContext();

  // WebSocket integration for real-time features (temporarily disabled to fix input issue)
  // TODO: Re-enable after fixing circular dependency completely
  // const webSocket = useWebSocket({
  //   enabled: true,
  //   url: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
  // });

  // Force health check when chat opens to ensure connection status is accurate
  useEffect(() => {
    if (state.isOpen) {
      console.log('📡 Chat opened - triggering health check...');
      forceHealthCheck().catch(error => {
        console.error('Failed to perform health check on chat open:', error);
      });
    }
  }, [state.isOpen, forceHealthCheck]);

  // Auto-create session if none exists and chat is opened
  useEffect(() => {
    if (state.isOpen && !state.session && !state.isSessionLoading) {
      // Use UI init flag to bypass rate limits for widget initialization
      createSession(undefined, true).catch(console.error);
    }
  }, [state.isOpen, state.session, state.isSessionLoading, createSession]);

  // Auto-load messages when session is available
  useEffect(() => {
    if (state.session && state.messages.length === 0 && !state.isMessagesLoading) {
      loadMessages().catch(console.error);
    }
  }, [state.session, state.messages.length, state.isMessagesLoading, loadMessages]);

  // Check for expired session
  useEffect(() => {
    if (state.session && isSessionExpired()) {
      console.warn('Chat session has expired');
      clearSession();
    }
  }, [state.session, isSessionExpired, clearSession]);

  // Enhanced send message with error handling and session expiration handling
  const handleSendMessage = useCallback(async (
    content: string, 
    messageType?: ChatMessage['messageType']
  ) => {
    try {
      // Check if session is expired first
      if (state.session && isSessionExpired()) {
        console.warn('⚠️ Session expired, clearing and creating new session');
        clearSession();
        await createSession();
      } else if (!state.session) {
        // For message sending, use normal session creation (with rate limits)
        await createSession();
      }
      
      await sendMessage(content, messageType);
    } catch (error) {
      // Handle session expiration errors gracefully
      if (error && typeof error === 'object' && 'code' in error && error.code === 'SESSION_EXPIRED') {
        console.warn('🔄 Session expired during send, creating new session...');
        clearSession();
        // Auto-retry with new session
        await createSession();
        await sendMessage(content, messageType);
      } else {
        console.error('Failed to send message:', error);
        throw error;
      }
    }
  }, [state.session, createSession, sendMessage, isSessionExpired, clearSession]);

  // Enhanced quick reply handler
  const handleQuickReply = useCallback(async (reply: string) => {
    try {
      await sendQuickReply(reply);
    } catch (error) {
      console.error('Failed to send quick reply:', error);
      throw error;
    }
  }, [sendQuickReply]);

  // Start new session with optional phone or email (for backward compatibility)
  const startNewSession = useCallback(async (guestContact?: string, contactType?: 'email' | 'phone') => {
    try {
      // Clear existing session first
      if (state.session) {
        clearSession();
      }
      
      // Create new session with contact info
      if (contactType === 'phone') {
        await createSession(undefined, false, guestContact); // guestEmail, isUIInit, guestPhone
      } else {
        await createSession(guestContact); // backward compatibility for email
      }
      
      // Open chat after session is created
      openChat();
    } catch (error) {
      console.error('Failed to start new session:', error);
      throw error;
    }
  }, [state.session, clearSession, createSession, openChat]);

  // Reconnect if connection is lost
  const reconnect = useCallback(async () => {
    try {
      if (state.session) {
        await loadSession();
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to reconnect:', error);
      throw error;
    }
  }, [state.session, loadSession, loadMessages]);

  // Get unread message count
  const unreadCount = useMemo(() => {
    return state.messages.filter(msg => 
      msg.senderType === 'bot' && 
      !state.isOpen && 
      new Date(msg.createdAt) > new Date(Date.now() - 60000) // Last minute
    ).length;
  }, [state.messages, state.isOpen]);

  // Get last message
  const lastMessage = useMemo(() => {
    return state.messages[state.messages.length - 1] || null;
  }, [state.messages]);

  // Check if chat can be used
  const isReady = useMemo(() => {
    return state.isConnected && !state.sessionError && !state.messagesError;
  }, [state.isConnected, state.sessionError, state.messagesError]);

  // Get loading status
  const isLoading = useMemo(() => {
    return state.isSessionLoading || state.isMessagesLoading;
  }, [state.isSessionLoading, state.isMessagesLoading]);

  // Get error state
  const error = useMemo(() => {
    return state.sessionError || state.messagesError || state.connectionError;
  }, [state.sessionError, state.messagesError, state.connectionError]);

  return {
    // State
    session: state.session,
    messages: state.messages,
    config: state.config,
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
    hasUnreadMessages: state.hasUnreadMessages,
    isConnected: state.isConnected,
    isTyping: state.isTyping,
    isUserTyping: state.isUserTyping,
    
    // Computed state
    unreadCount,
    lastMessage,
    isReady,
    isLoading,
    error,
    isSessionExpired: isSessionExpired(),
    
    // Actions
    sendMessage: handleSendMessage,
    sendQuickReply: handleQuickReply,
    startNewSession,
    clearSession,
    reconnect,
    
    // UI actions
    openChat,
    closeChat,
    toggleChat,
    markAsRead,
    
    // WebSocket actions
    sendTyping,
    
    // Configuration
    updateConfig,
    
    // Loading states
    isSessionLoading: state.isSessionLoading,
    isMessagesLoading: state.isMessagesLoading
  };
};