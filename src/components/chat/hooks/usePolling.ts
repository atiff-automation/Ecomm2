'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatContext } from '../ChatProvider';
import { chatApi } from '../utils/api-client';

interface PollingOptions {
  interval?: number;
  enabled?: boolean;
  onNewMessages?: (messages: any[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Polling hook for basic real-time message updates
 * This provides a fallback mechanism when WebSocket is not available
 */
export const usePolling = (options: PollingOptions = {}) => {
  const {
    interval = 3000, // 3 seconds default
    enabled = true,
    onNewMessages,
    onError
  } = options;

  const { state, loadMessages } = useChatContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  // Update last message timestamp when messages change
  useEffect(() => {
    if (state.messages.length > 0) {
      const lastMessage = state.messages[state.messages.length - 1];
      lastMessageTimestampRef.current = lastMessage.createdAt;
    }
  }, [state.messages]);

  // Polling function
  const poll = useCallback(async () => {
    if (isPollingRef.current || !state.session?.id || !state.isConnected) {
      return;
    }

    isPollingRef.current = true;

    try {
      const response = await chatApi.getMessages({
        sessionId: state.session.id,
        limit: 20 // Get recent messages
      });

      if (response.success && response.data?.messages) {
        const serverMessages = response.data.messages;
        
        // Filter for new messages
        let newMessages = serverMessages;
        
        if (lastMessageTimestampRef.current) {
          newMessages = serverMessages.filter(msg => 
            new Date(msg.createdAt) > new Date(lastMessageTimestampRef.current!)
          );
        }

        // Check if we have any new messages
        if (newMessages.length > 0) {
          // Call the messages update through context
          await loadMessages();
          
          // Notify callback if provided
          if (onNewMessages) {
            onNewMessages(newMessages);
          }
        }
      }
    } catch (error) {
      console.warn('Polling error:', error);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error('Polling failed'));
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [state.session?.id, state.isConnected, loadMessages, onNewMessages, onError]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled && state.session?.id && state.isConnected) {
      // Initial poll
      poll();
      
      // Set up interval
      intervalRef.current = setInterval(poll, interval);
    }
  }, [enabled, state.session?.id, state.isConnected, interval, poll]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start/stop polling based on conditions
  useEffect(() => {
    if (enabled && state.session?.id && state.isConnected && state.isOpen) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, state.session?.id, state.isConnected, state.isOpen, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Pause polling when tab is not visible (Page Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled && state.session?.id && state.isConnected && state.isOpen) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, state.session?.id, state.isConnected, state.isOpen, startPolling, stopPolling]);

  return {
    isPolling: intervalRef.current !== null,
    startPolling,
    stopPolling,
    poll
  };
};