/**
 * Chat Utility Functions
 * Centralized utility functions for chat operations
 */

import type { ChatMessage, ChatConfig, QuickReply } from '../types';
import { CHAT_CONSTANTS } from '../types';

class ChatUtilities {
  /**
   * Generate a unique client-side message ID
   */
  generateTempMessageId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format timestamp for display
   */
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  /**
   * Check if a message is from the current user
   */
  isUserMessage(message: ChatMessage): boolean {
    return message.senderType === 'user';
  }

  /**
   * Check if a message is from the bot
   */
  isBotMessage(message: ChatMessage): boolean {
    return message.senderType === 'bot';
  }

  /**
   * Validate message content
   */
  validateMessageContent(content: string, maxLength: number = CHAT_CONSTANTS.MESSAGE_BATCH_SIZE): {
    isValid: boolean;
    error?: string;
  } {
    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        error: 'Message cannot be empty'
      };
    }

    if (content.length > maxLength) {
      return {
        isValid: false,
        error: `Message cannot exceed ${maxLength} characters`
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitize message content
   */
  sanitizeMessageContent(content: string): string {
    return content
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }

  /**
   * Create optimistic user message
   */
  createOptimisticMessage(
    sessionId: string,
    content: string,
    messageType: ChatMessage['messageType'] = 'text',
    metadata?: Record<string, any>
  ): ChatMessage {
    // Validate inputs to prevent invalid messages
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid sessionId provided to createOptimisticMessage');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content provided to createOptimisticMessage');
    }

    const sanitizedContent = this.sanitizeMessageContent(content);
    if (!sanitizedContent.trim()) {
      throw new Error('Message content cannot be empty after sanitization');
    }

    return {
      id: this.generateTempMessageId(),
      sessionId,
      senderType: 'user',
      content: sanitizedContent,
      messageType,
      metadata,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Check if two messages are consecutive from the same sender
   */
  areConsecutiveMessages(current: ChatMessage, previous: ChatMessage): boolean {
    if (!current || !previous) return false;
    
    return (
      current.senderType === previous.senderType &&
      this.getTimeDifference(current.createdAt, previous.createdAt) < 5 * 60 * 1000 // 5 minutes
    );
  }

  /**
   * Get time difference between two timestamps in milliseconds
   */
  getTimeDifference(timestamp1: string, timestamp2: string): number {
    return Math.abs(new Date(timestamp1).getTime() - new Date(timestamp2).getTime());
  }

  /**
   * Group messages by date
   */
  groupMessagesByDate(messages: ChatMessage[]): Record<string, ChatMessage[]> {
    return messages.reduce((groups, message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {} as Record<string, ChatMessage[]>);
  }

  /**
   * Get theme CSS classes based on config
   */
  getThemeClasses(config: ChatConfig): string {
    const base = 'chat-widget';
    const position = `chat-widget--${config.position}`;
    const theme = `chat-widget--${config.theme}`;
    
    return `${base} ${position} ${theme}`;
  }

  /**
   * Generate CSS custom properties for theme
   */
  generateThemeStyles(config: ChatConfig): Record<string, string> {
    return {
      '--chat-primary-color': config.primaryColor,
      '--chat-animation-duration': `${CHAT_CONSTANTS.ANIMATION_DURATION}ms`,
    };
  }

  /**
   * Parse quick replies from message metadata
   */
  parseQuickReplies(message: ChatMessage): QuickReply[] {
    if (message.messageType !== 'quick_reply' || !message.metadata?.quickReplies) {
      return [];
    }

    return message.metadata.quickReplies.map((reply: any, index: number) => ({
      id: reply.id || `quick_reply_${index}`,
      text: reply.text || reply,
      value: reply.value || reply.text || reply,
      payload: reply.payload,
      icon: reply.icon,
      metadata: reply.metadata
    }));
  }

  /**
   * Validate quick reply data
   */
  validateQuickReply(reply: QuickReply): boolean {
    return !!(reply.text && reply.text.trim().length > 0);
  }

  /**
   * Sanitize quick reply text
   */
  sanitizeQuickReply(reply: QuickReply): QuickReply {
    return {
      ...reply,
      text: this.sanitizeMessageContent(reply.text),
      value: reply.value ? this.sanitizeMessageContent(reply.value) : undefined
    };
  }

  /**
   * Check if message has rich content
   */
  hasRichContent(message: ChatMessage): boolean {
    return message.messageType === 'rich_content' || 
           !!(message.metadata?.richContent || message.metadata?.attachments);
  }

  /**
   * Extract rich content from message
   */
  extractRichContent(message: ChatMessage): any {
    return message.metadata?.richContent || null;
  }

  /**
   * Extract attachments from message
   */
  extractAttachments(message: ChatMessage): any[] {
    return message.metadata?.attachments || [];
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  /**
   * Calculate session time remaining
   */
  getSessionTimeRemaining(expiresAt?: string): number {
    if (!expiresAt) return 0;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Format session time remaining for display
   */
  formatSessionTimeRemaining(expiresAt?: string): string {
    const remaining = this.getSessionTimeRemaining(expiresAt);
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor(remaining / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    
    return `${minutes}m remaining`;
  }

  /**
   * Check if session needs warning (within 5 minutes of expiry)
   */
  shouldWarnSessionExpiry(expiresAt?: string): boolean {
    const remaining = this.getSessionTimeRemaining(expiresAt);
    return remaining > 0 && remaining <= 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get session expiry warning message
   */
  getSessionExpiryWarning(expiresAt?: string): string | null {
    if (!this.shouldWarnSessionExpiry(expiresAt)) return null;
    
    const remaining = this.getSessionTimeRemaining(expiresAt);
    const minutes = Math.floor(remaining / (1000 * 60));
    
    if (minutes <= 1) {
      return 'Your session expires in less than 1 minute. Your conversation will be saved, but you\'ll need to start a new session to continue.';
    }
    
    return `Your session expires in ${minutes} minutes. Your conversation will be saved, but you'll need to start a new session to continue.`;
  }


  /**
   * Debounce function for typing indicators
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function for API calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Scroll element to bottom smoothly
   */
  scrollToBottom(element: HTMLElement, smooth = true): void {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  /**
   * Check if element is scrolled to bottom
   */
  isScrolledToBottom(element: HTMLElement, threshold = 50): boolean {
    return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
  }

  /**
   * Play notification sound (if enabled)
   */
  playNotificationSound(config: ChatConfig): void {
    if (!config.enableSound || typeof Audio === 'undefined') return;

    try {
      // Use a subtle notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeChiM1fTDgzQGAAgWp+Wxjz0IAEWm4MNyJAUbf8v0yIYxCAAbgdDz1J1QEAXS6u2hUhAIR6Hi1HcpBSB6y++kWBELTqPj1IJYEwFRptzCbCECHBZ9xrGKMwYAlMLw2YVsCBFhkMvdtVcSCUWj4dJxJAUajMzrpFchC1Yl7KlvGAYdUsHhZmYcCBCJyNlgWRAOArjxrV0dCltG5Z9rBSgOlvdHMQYFW8DjxlcTCC2JzfFdAQIYsN1qOgIBXsHl2nQnBECh5N5xNwUAFmG5KAEAFG+72V4dCBAHgcndtgkBFXm7EQEAGwOwjsLTIwUdZLLTZQYAfRCGdaOJOgcYvEYtAAQKHXf/bvCnhvQsR8nxvX5+tgAuZxXhk7+VqCAkULgNUxASiC1VZbQPGJLUhVNVBQOYQfHVMQYWoFHNfQoAG1nYI84AEKKoRyUAyI8E8YyYRi0AiGXnHQGhLhHl9vJmCQUP2TjfJQICFJzmBQAY4SkAg9LpB58yKQoAGc7xYwgBFXHE0Q6EzfZV8BAAIIzM2hwDGQgXQRAS4VNdBQCZS');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors - sound is optional
      });
    } catch (error) {
      // Ignore sound errors
    }
  }

  /**
   * Get message delivery status color
   */
  getMessageStatusColor(status: ChatMessage['status']): string {
    const colors = {
      pending: '#ffc107', // yellow
      sent: '#6c757d',    // gray
      delivered: '#28a745', // green
      failed: '#dc3545'   // red
    };
    
    return colors[status] || colors.pending;
  }

  /**
   * Get message status icon
   */
  getMessageStatusIcon(status: ChatMessage['status']): string {
    const icons = {
      pending: '○',
      sent: '✓',
      delivered: '✓✓',
      failed: '❌'
    };

    return icons[status] || icons.pending;
  }

  /**
   * Check if browser supports WebSocket
   */
  supportsWebSocket(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  /**
   * Check if browser supports local storage
   */
  supportsLocalStorage(): boolean {
    try {
      const test = '__chat_storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if browser supports notifications
   */
  supportsNotifications(): boolean {
    return 'Notification' in window;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.supportsNotifications()) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Show browser notification
   */
  showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }
}

// Export singleton instance
export const chatUtils = new ChatUtilities();