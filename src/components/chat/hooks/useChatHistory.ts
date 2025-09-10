'use client';

import { useMemo, useCallback } from 'react';
import { useChatContext } from '../ChatProvider';
import { chatUtils } from '../utils/chat-utils';
import { chatStorage } from '../utils/storage';
import type { ChatMessage } from '../types';

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
  displayDate: string;
}

interface ConversationMetrics {
  totalMessages: number;
  userMessages: number;
  botMessages: number;
  averageResponseTime: number;
  conversationStarted: string | null;
  lastActivity: string | null;
  sessionDuration: number; // in minutes
}

/**
 * Hook for managing and analyzing chat message history
 */
export const useChatHistory = () => {
  const { state } = useChatContext();

  // Group messages by date
  const messageGroups = useMemo((): MessageGroup[] => {
    const grouped = chatUtils.groupMessagesByDate(state.messages);
    
    return Object.entries(grouped)
      .map(([date, messages]) => {
        const dateObj = new Date(date);
        const isToday = dateObj.toDateString() === new Date().toDateString();
        const isYesterday = dateObj.toDateString() === new Date(Date.now() - 86400000).toDateString();
        
        let displayDate: string;
        if (isToday) {
          displayDate = 'Today';
        } else if (isYesterday) {
          displayDate = 'Yesterday';
        } else {
          displayDate = dateObj.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
          });
        }

        return {
          date,
          messages: messages.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
          displayDate
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.messages]);

  // Calculate conversation metrics
  const metrics = useMemo((): ConversationMetrics => {
    const messages = state.messages;
    
    if (messages.length === 0) {
      return {
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
        averageResponseTime: 0,
        conversationStarted: null,
        lastActivity: null,
        sessionDuration: 0
      };
    }

    const userMessages = messages.filter(msg => msg.senderType === 'user');
    const botMessages = messages.filter(msg => msg.senderType === 'bot');
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      if (current.senderType === 'bot' && previous.senderType === 'user') {
        const responseTime = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
    
    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    
    // Session duration
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const sessionDuration = (
      new Date(lastMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()
    ) / (1000 * 60); // Convert to minutes

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      averageResponseTime: Math.round(averageResponseTime),
      conversationStarted: firstMessage.createdAt,
      lastActivity: lastMessage.createdAt,
      sessionDuration: Math.round(sessionDuration)
    };
  }, [state.messages]);

  // Find messages by content
  const searchMessages = useCallback((query: string): ChatMessage[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return state.messages.filter(message =>
      message.content.toLowerCase().includes(searchTerm)
    );
  }, [state.messages]);

  // Get messages by type
  const getMessagesByType = useCallback((messageType: ChatMessage['messageType']): ChatMessage[] => {
    return state.messages.filter(message => message.messageType === messageType);
  }, [state.messages]);

  // Get messages by sender
  const getMessagesBySender = useCallback((senderType: ChatMessage['senderType']): ChatMessage[] => {
    return state.messages.filter(message => message.senderType === senderType);
  }, [state.messages]);

  // Get messages in date range
  const getMessagesInRange = useCallback((startDate: Date, endDate: Date): ChatMessage[] => {
    return state.messages.filter(message => {
      const messageDate = new Date(message.createdAt);
      return messageDate >= startDate && messageDate <= endDate;
    });
  }, [state.messages]);

  // Get failed messages
  const getFailedMessages = useCallback((): ChatMessage[] => {
    return state.messages.filter(message => message.status === 'failed');
  }, [state.messages]);

  // Get pending messages
  const getPendingMessages = useCallback((): ChatMessage[] => {
    return state.messages.filter(message => message.status === 'pending');
  }, [state.messages]);

  // Export conversation history
  const exportHistory = useCallback(() => {
    const exportData = {
      session: state.session,
      messages: state.messages,
      metrics,
      exportedAt: new Date().toISOString(),
      config: state.config
    };
    
    return exportData;
  }, [state.session, state.messages, state.config, metrics]);

  // Get message statistics for a specific date
  const getDateStatistics = useCallback((date: string) => {
    const dateMessages = state.messages.filter(msg => 
      new Date(msg.createdAt).toDateString() === new Date(date).toDateString()
    );
    
    return {
      total: dateMessages.length,
      user: dateMessages.filter(msg => msg.senderType === 'user').length,
      bot: dateMessages.filter(msg => msg.senderType === 'bot').length,
      failed: dateMessages.filter(msg => msg.status === 'failed').length,
      firstMessage: dateMessages[0]?.createdAt || null,
      lastMessage: dateMessages[dateMessages.length - 1]?.createdAt || null
    };
  }, [state.messages]);

  // Clear history
  const clearHistory = useCallback(() => {
    if (state.session) {
      chatStorage.clearMessages(state.session.id);
    }
  }, [state.session]);

  // Get recent messages (last N messages)
  const getRecentMessages = useCallback((count: number = 10): ChatMessage[] => {
    return state.messages.slice(-count);
  }, [state.messages]);

  // Check if there are consecutive messages from same sender
  const getConsecutiveMessages = useCallback((): ChatMessage[][] => {
    const consecutiveGroups: ChatMessage[][] = [];
    let currentGroup: ChatMessage[] = [];
    
    state.messages.forEach((message, index) => {
      if (index === 0) {
        currentGroup = [message];
      } else {
        const previousMessage = state.messages[index - 1];
        
        if (chatUtils.areConsecutiveMessages(message, previousMessage)) {
          currentGroup.push(message);
        } else {
          if (currentGroup.length > 1) {
            consecutiveGroups.push([...currentGroup]);
          }
          currentGroup = [message];
        }
      }
    });
    
    if (currentGroup.length > 1) {
      consecutiveGroups.push(currentGroup);
    }
    
    return consecutiveGroups;
  }, [state.messages]);

  return {
    // Structured data
    messageGroups,
    metrics,
    
    // Search and filter
    searchMessages,
    getMessagesByType,
    getMessagesBySender,
    getMessagesInRange,
    getFailedMessages,
    getPendingMessages,
    getRecentMessages,
    getConsecutiveMessages,
    
    // Analytics
    getDateStatistics,
    
    // Utilities
    exportHistory,
    clearHistory,
    
    // Raw data access
    messages: state.messages,
    hasHistory: state.messages.length > 0,
    isEmpty: state.messages.length === 0
  };
};