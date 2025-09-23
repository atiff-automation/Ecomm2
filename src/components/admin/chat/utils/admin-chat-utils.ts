/**
 * Admin Chat Utility Functions
 * Centralized utilities for admin panel chat display
 * Extends existing chat utilities with simplified, non-technical formatting
 */

import { chatUtils } from '@/components/chat/utils/chat-utils';

interface AdminChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'bot' | 'system';
  messageType?: 'text' | 'quick_reply' | 'rich_content' | 'media' | 'system';
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
  metadata?: Record<string, any>;
}

class AdminChatUtilities {
  /**
   * Convert technical message to simplified admin message
   * Removes technical complexity while preserving essential data
   */
  simplifyMessage(message: any): AdminChatMessage {
    return {
      id: message.id,
      content: this.sanitizeContent(message.content),
      senderType: message.senderType,
      createdAt: message.createdAt
    };
  }

  /**
   * Sanitize and clean message content for admin display
   * Remove technical formatting but preserve readability
   */
  sanitizeContent(content: string): string {
    if (!content) return '';

    return content
      .trim()
      .replace(/\[SYSTEM\]/gi, '')
      .replace(/\[DEBUG\]/gi, '')
      .replace(/\[ERROR\]/gi, '')
      .replace(/^\w+:\s*/, '') // Remove technical prefixes like "INFO:", "WARN:"
      .trim();
  }

  /**
   * Group messages by conversation flow
   * Identify consecutive messages from same sender for better bubble grouping
   */
  groupConsecutiveMessages(messages: AdminChatMessage[]): Array<{
    message: AdminChatMessage;
    isConsecutive: boolean;
  }> {
    return messages.map((message, index) => {
      const previousMessage = messages[index - 1];
      const isConsecutive = previousMessage &&
        chatUtils.areConsecutiveMessages(message as any, previousMessage as any);

      return {
        message,
        isConsecutive: !!isConsecutive
      };
    });
  }

  /**
   * Format relative time for admin display
   * Simple, human-readable format without technical precision
   */
  formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Format conversation summary
   * Generate non-technical summary of conversation for admin overview
   */
  generateConversationSummary(messages: AdminChatMessage[]): {
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    systemMessages: number;
    duration: string;
    lastActivity: string;
  } {
    const userMessages = messages.filter(m => m.senderType === 'user').length;
    const botMessages = messages.filter(m => m.senderType === 'bot').length;
    const systemMessages = messages.filter(m => m.senderType === 'system').length;

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];

    let duration = 'Unknown';
    if (firstMessage && lastMessage) {
      const start = new Date(firstMessage.createdAt);
      const end = new Date(lastMessage.createdAt);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 1) {
        duration = 'Less than a minute';
      } else if (diffMins < 60) {
        duration = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        duration = `${hours}h ${remainingMins}m`;
      }
    }

    return {
      totalMessages: messages.length,
      userMessages,
      botMessages,
      systemMessages,
      duration,
      lastActivity: lastMessage ? this.formatRelativeTime(lastMessage.createdAt) : 'Unknown'
    };
  }

  /**
   * Filter messages for admin view
   * Hide technical system messages that aren't relevant for customer service
   */
  filterAdminRelevantMessages(messages: any[]): AdminChatMessage[] {
    return messages
      .filter(message => {
        // Keep user and bot messages
        if (message.senderType === 'user' || message.senderType === 'bot') {
          return true;
        }

        // For system messages, only keep important ones
        if (message.senderType === 'system') {
          const content = message.content?.toLowerCase() || '';

          // Keep important system messages
          const importantKeywords = [
            'session started',
            'session ended',
            'transferred to',
            'escalated to',
            'user left',
            'connection lost',
            'reconnected'
          ];

          return importantKeywords.some(keyword => content.includes(keyword));
        }

        return false;
      })
      .map(message => this.simplifyMessage(message));
  }

  /**
   * Extract conversation highlights
   * Identify key moments in the conversation for admin attention
   */
  extractConversationHighlights(messages: AdminChatMessage[]): Array<{
    type: 'escalation' | 'issue' | 'satisfaction' | 'transfer';
    message: AdminChatMessage;
    context: string;
  }> {
    const highlights: Array<{
      type: 'escalation' | 'issue' | 'satisfaction' | 'transfer';
      message: AdminChatMessage;
      context: string;
    }> = [];

    messages.forEach((message) => {
      const content = message.content.toLowerCase();

      // Escalation indicators
      if (content.includes('speak to manager') ||
          content.includes('escalate') ||
          content.includes('supervisor')) {
        highlights.push({
          type: 'escalation',
          message,
          context: 'Customer requested escalation'
        });
      }

      // Issue indicators
      if (content.includes('problem') ||
          content.includes('issue') ||
          content.includes('error') ||
          content.includes('not working')) {
        highlights.push({
          type: 'issue',
          message,
          context: 'Customer reported an issue'
        });
      }

      // Satisfaction indicators
      if (content.includes('thank') ||
          content.includes('great') ||
          content.includes('solved') ||
          content.includes('perfect')) {
        highlights.push({
          type: 'satisfaction',
          message,
          context: 'Positive customer feedback'
        });
      }

      // Transfer indicators
      if (message.senderType === 'system' &&
          (content.includes('transferred') || content.includes('escalated'))) {
        highlights.push({
          type: 'transfer',
          message,
          context: 'Conversation was transferred'
        });
      }
    });

    return highlights;
  }

  /**
   * Check if conversation needs attention
   * Identify conversations that may require follow-up
   */
  needsAttention(messages: AdminChatMessage[]): {
    needsAttention: boolean;
    reasons: string[];
    urgency: 'low' | 'medium' | 'high';
  } {
    const reasons: string[] = [];
    let urgency: 'low' | 'medium' | 'high' = 'low';

    const lastMessage = messages[messages.length - 1];
    const highlights = this.extractConversationHighlights(messages);

    // Check for unresolved issues
    const hasEscalation = highlights.some(h => h.type === 'escalation');
    const hasIssues = highlights.some(h => h.type === 'issue');
    const hasSatisfaction = highlights.some(h => h.type === 'satisfaction');

    if (hasEscalation) {
      reasons.push('Customer requested escalation');
      urgency = 'high';
    }

    if (hasIssues && !hasSatisfaction) {
      reasons.push('Unresolved customer issue');
      if (urgency === 'low') urgency = 'medium';
    }

    // Check if conversation ended abruptly
    if (lastMessage?.senderType === 'user') {
      const lastMessageTime = new Date(lastMessage.createdAt);
      const hoursAgo = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);

      if (hoursAgo < 24) {
        reasons.push('Customer message without response');
        if (urgency === 'low') urgency = 'medium';
      }
    }

    return {
      needsAttention: reasons.length > 0,
      reasons,
      urgency
    };
  }

  /**
   * Generate export data for technical analysis
   * When admin needs technical details, provide comprehensive data
   */
  generateTechnicalExport(originalMessages: any[]): {
    summary: ReturnType<typeof this.generateConversationSummary>;
    highlights: ReturnType<typeof this.extractConversationHighlights>;
    attention: ReturnType<typeof this.needsAttention>;
    technicalDetails: {
      messageTypes: Record<string, number>;
      statusBreakdown: Record<string, number>;
      metadataKeys: string[];
      averageResponseTime: number;
    };
    rawMessages: any[];
  } {
    const simplifiedMessages = this.filterAdminRelevantMessages(originalMessages);

    // Calculate technical metrics
    const messageTypes: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    const metadataKeys = new Set<string>();
    const responseTimes: number[] = [];

    originalMessages.forEach((message, index) => {
      // Count message types
      const type = message.messageType || 'unknown';
      messageTypes[type] = (messageTypes[type] || 0) + 1;

      // Count status breakdown
      const status = message.status || 'unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

      // Collect metadata keys
      if (message.metadata) {
        Object.keys(message.metadata).forEach(key => metadataKeys.add(key));
      }

      // Calculate response times (bot responses to user messages)
      if (message.senderType === 'bot' && index > 0) {
        const previousMessage = originalMessages[index - 1];
        if (previousMessage.senderType === 'user') {
          const responseTime = new Date(message.createdAt).getTime() -
                               new Date(previousMessage.createdAt).getTime();
          responseTimes.push(responseTime);
        }
      }
    });

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return {
      summary: this.generateConversationSummary(simplifiedMessages),
      highlights: this.extractConversationHighlights(simplifiedMessages),
      attention: this.needsAttention(simplifiedMessages),
      technicalDetails: {
        messageTypes,
        statusBreakdown,
        metadataKeys: Array.from(metadataKeys),
        averageResponseTime: Math.round(averageResponseTime / 1000) // Convert to seconds
      },
      rawMessages: originalMessages
    };
  }
}

// Export singleton instance following existing pattern
export const adminChatUtils = new AdminChatUtilities();