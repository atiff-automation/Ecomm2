'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useChatContext } from '../ChatProvider';
import type { ChatMessage } from '../types';
import { logger } from '@/lib/logger/production-logger';

/**
 * Main chat hook that provides comprehensive chat functionality
 * Primary interface for chat interactions using HTTP-based polling architecture
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


  // Force health check when chat opens to ensure connection status is accurate
  useEffect(() => {
    if (state.isOpen) {
      logger.debug('Chat opened - triggering health check', { component: 'chat-hook' });
      forceHealthCheck().catch(error => {
        logger.error('Failed to perform health check on chat open', { component: 'chat-hook' }, error);
      });
    }
  }, [state.isOpen, forceHealthCheck]);

  // Auto-create session if none exists and chat is opened
  useEffect(() => {
    if (state.isOpen && !state.session && !state.isSessionLoading) {
      // Use UI init flag to bypass rate limits for widget initialization
      createSession(undefined, true).catch(error => {
        logger.error('Failed to auto-create session', { component: 'chat-hook' }, error);
      });
    }
  }, [state.isOpen, state.session, state.isSessionLoading, createSession]);

  // Auto-load messages when session is available
  useEffect(() => {
    if (state.session && state.messages.length === 0 && !state.isMessagesLoading) {
      loadMessages().catch(error => {
        logger.error('Failed to auto-load messages', { component: 'chat-hook' }, error);
      });
    }
  }, [state.session, state.messages.length, state.isMessagesLoading, loadMessages]);

  // Check for expired session
  useEffect(() => {
    if (state.session && isSessionExpired()) {
      logger.warn('Chat session has expired', { component: 'chat-hook', sessionId: state.session?.sessionId });
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
        logger.warn('Session expired during message send, creating new session', {
          component: 'chat-hook',
          sessionId: state.session?.sessionId
        });
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
        logger.warn('Session expired during send, retrying with new session', {
          component: 'chat-hook',
          sessionId: state.session?.sessionId
        });
        clearSession();
        // Auto-retry with new session
        await createSession();
        await sendMessage(content, messageType);
      } else {
        logger.error('Failed to send message', { component: 'chat-hook' }, error);
        throw error;
      }
    }
  }, [state.session, createSession, sendMessage, isSessionExpired, clearSession]);

  // Enhanced quick reply handler
  const handleQuickReply = useCallback(async (reply: string) => {
    try {
      await sendQuickReply(reply);
    } catch (error) {
      logger.error('Failed to send quick reply', { component: 'chat-hook' }, error);
      throw error;
    }
  }, [sendQuickReply]);

  // Enhanced session creation supporting authenticated sessions - systematic approach
  const startNewSession = useCallback(async (
    contactOrEmail?: string,
    contactType?: 'email' | 'phone' | 'authenticated',
    userId?: string
  ) => {
    try {
      // Clear existing session first - centralized cleanup
      if (state.session) {
        clearSession();
      }

      // Create new session with enhanced parameters
      if (contactType === 'authenticated' && userId) {
        // Authenticated session creation
        await createSession(contactOrEmail, 'authenticated', userId);
      } else if (contactType === 'phone') {
        // Phone-based guest session
        await createSession(contactOrEmail, 'phone');
      } else {
        // Email-based guest session (backward compatibility)
        await createSession(contactOrEmail, 'email');
      }

      // Open chat after session is created
      openChat();
    } catch (error) {
      logger.error('Failed to start new session', { component: 'chat-hook' }, error);
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
      logger.error('Failed to reconnect', { component: 'chat-hook' }, error);
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
    
    // Real-time simulation actions
    sendTyping,
    
    // Configuration
    updateConfig,
    
    // Loading states
    isSessionLoading: state.isSessionLoading,
    isMessagesLoading: state.isMessagesLoading
  };
};