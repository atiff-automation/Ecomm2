'use client';

import React, { useState } from 'react';
import { ChatProvider } from './ChatProvider';
import { ChatBubble } from './ChatBubble';
import { ChatWindow } from './ChatWindow';
import { ContactForm } from './ContactForm';
import { useChat } from './hooks/useChat';
import { usePolling } from './hooks/usePolling';
import { useAuth } from '@/hooks/use-auth';
import type { ChatConfig } from './types';

interface ChatWidgetInternalProps {
  config: ChatConfig;
}

// Internal component that uses the chat context
const ChatWidgetInternal: React.FC<ChatWidgetInternalProps> = ({ config }) => {
  // Modal state management - centralized approach
  const [showContactForm, setShowContactForm] = useState(false);

  // Authentication detection - systematic approach
  const { isLoggedIn, user } = useAuth();

  const {
    // State
    session,
    messages,
    config: contextConfig,
    isOpen,
    isConnected,
    isTyping,
    hasUnreadMessages,
    error,

    // Actions
    sendMessage,
    sendQuickReply,
    sendTyping,
    startNewSession,
    openChat,
    closeChat,
    toggleChat
  } = useChat();

  // Set up polling for basic real-time updates
  usePolling({
    interval: 5000, // Increased from 3000ms to 5000ms to reduce rate limiting
    enabled: isOpen && !!session,
    onError: (error) => {
      console.warn('Polling error:', error);
    }
  });

  const handleSendMessage = async (content: string, messageType?: any) => {
    try {
      await sendMessage(content, messageType);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error is already handled by the context and displayed in UI
    }
  };

  const handleQuickReply = async (reply: string) => {
    try {
      await sendQuickReply(reply);
    } catch (error) {
      console.error('Failed to send quick reply:', error);
    }
  };

  const handleChatToggle = async () => {
    if (!session && !isOpen) {
      // Direct authenticated session for logged-in users - streamlined UX
      if (isLoggedIn && user) {
        try {
          // Start authenticated session directly - no choice modal
          await startNewSession(user.email, 'authenticated', user.id);
          // Chat will open automatically after session is created
        } catch (error) {
          console.error('Failed to create authenticated session:', error);
          // Fallback to guest flow if authenticated session fails
          setShowContactForm(true);
        }
      } else {
        // Non-authenticated user - existing guest flow
        setShowContactForm(true);
      }
    } else {
      // Normal toggle behavior
      toggleChat();
    }
  };

  const handleContactSubmit = async (contactInfo: { phone?: string; email?: string }) => {
    try {
      // Create session with contact info
      if (contactInfo.phone) {
        await startNewSession(contactInfo.phone, 'phone');
      } else if (contactInfo.email) {
        await startNewSession(contactInfo.email, 'email');
      }

      // Close contact form and open chat
      setShowContactForm(false);
      // Chat will open automatically after session is created
    } catch (error) {
      console.error('Failed to create session with contact info:', error);
      throw error; // Re-throw to be handled by ContactForm
    }
  };

  const handleContactFormClose = () => {
    setShowContactForm(false);
  };


  return (
    <>
      <ChatBubble
        isExpanded={isOpen}
        isConnected={isConnected}
        hasUnreadMessages={hasUnreadMessages}
        config={contextConfig}
        onClick={handleChatToggle}
      />

      <ChatWindow
        isOpen={isOpen}
        isConnected={isConnected}
        isTyping={isTyping}
        session={session}
        messages={messages}
        config={contextConfig}
        onClose={closeChat}
        onSendMessage={handleSendMessage}
        onQuickReply={handleQuickReply}
        onTyping={sendTyping}
      />


      {/* Contact Form - shown for guest chat selection */}
      <ContactForm
        isOpen={showContactForm}
        config={contextConfig}
        onSubmit={handleContactSubmit}
        onClose={handleContactFormClose}
      />

      {/* Error overlay for connection issues */}
      {error && (
        <div className="chat-error-overlay">
          <div className="chat-error-message">
            <span>{error}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="chat-error-retry"
            >
              Retry
            </button>
          </div>
          
          <style jsx>{`
            .chat-error-overlay {
              position: fixed;
              bottom: 100px;
              right: 24px;
              background: #dc3545;
              color: white;
              padding: 12px 16px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              z-index: 1001;
              max-width: 280px;
              animation: slideInUp 300ms ease-out;
            }

            .chat-error-message {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              font-size: 14px;
            }

            .chat-error-retry {
              background: rgba(255, 255, 255, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              transition: background 200ms ease;
            }

            .chat-error-retry:hover {
              background: rgba(255, 255, 255, 0.3);
            }

            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @media (max-width: 768px) {
              .chat-error-overlay {
                right: 16px;
                bottom: 80px;
                max-width: calc(100vw - 32px);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

// Main Chat Widget Props
interface ChatWidgetProps {
  /**
   * Chat configuration options
   */
  config?: Partial<ChatConfig>;
  
  /**
   * CSS class name for the widget container
   */
  className?: string;
  
  /**
   * Inline styles for the widget container
   */
  style?: React.CSSProperties;
  
  /**
   * Whether the chat widget should be enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Callback fired when chat is opened
   */
  onOpen?: () => void;
  
  /**
   * Callback fired when chat is closed
   */
  onClose?: () => void;
  
  /**
   * Callback fired when a message is sent
   */
  onMessage?: (message: any) => void;
}

/**
 * Main Chat Widget Component
 * 
 * This is the primary component that provides a complete chat interface
 * including the floating bubble, chat window, and all chat functionality.
 * 
 * Example usage:
 * ```tsx
 * <ChatWidget 
 *   config={{
 *     position: 'bottom-right',
 *     primaryColor: '#007bff',
 *     enableSound: true
 *   }}
 *   onMessage={(message) => console.log('New message:', message)}
 * />
 * ```
 */
export const ChatWidget: React.FC<ChatWidgetProps> = ({
  config = {},
  className,
  style,
  enabled = true,
  onOpen,
  onClose,
  onMessage
}) => {
  if (!enabled) {
    return null;
  }

  return (
    <div className={`chat-widget-container ${className || ''}`} style={style}>
      <ChatProvider initialConfig={config}>
        <ChatWidgetInternal config={config as ChatConfig} />
      </ChatProvider>
      
      <style jsx>{`
        .chat-widget-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};