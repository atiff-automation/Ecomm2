'use client';

import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { chatUtils } from './utils/chat-utils';
import type { ChatConfig, ChatMessage, QuickReply } from './types';

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  config: ChatConfig;
  onQuickReply: (reply: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  config,
  onQuickReply
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScrollRef.current && scrollContainerRef.current) {
      chatUtils.scrollToBottom(scrollContainerRef.current, true);
    }
  }, [messages.length, isTyping]);

  // Check if user has scrolled up
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      shouldAutoScrollRef.current = chatUtils.isScrolledToBottom(
        scrollContainerRef.current,
        50
      );
    }
  };

  // Group messages by date for better organization
  const groupedMessages = React.useMemo(() => {
    return chatUtils.groupMessagesByDate(messages);
  }, [messages]);

  const renderDateSeparator = (date: string) => {
    const isToday = new Date(date).toDateString() === new Date().toDateString();
    const isYesterday = new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString();
    
    let displayDate: string;
    if (isToday) {
      displayDate = 'Today';
    } else if (isYesterday) {
      displayDate = 'Yesterday';
    } else {
      displayDate = new Date(date).toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }

    return (
      <div className="message-list__date-separator" key={`date-${date}`}>
        <span className="message-list__date-text">{displayDate}</span>
      </div>
    );
  };

  const renderTypingIndicator = () => (
    <div className="message-list__typing" key="typing-indicator">
      <div className="message-list__typing-avatar">
        <div className="message-list__typing-avatar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V17.5C20 16.1193 18.8807 15 17.5 15S15 16.1193 15 17.5V21M12 7V21M8 11V21M4 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div className="message-list__typing-content">
        <div className="message-list__typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="message-list"
      ref={scrollContainerRef}
      onScroll={handleScroll}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      <div className="message-list__content">
        {/* Welcome message if no messages */}
        {messages.length === 0 && !isTyping && (
          <div className="message-list__welcome">
            <div className="message-list__welcome-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="message-list__welcome-title">Welcome to Chat Support</h3>
            <p className="message-list__welcome-text">
              Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>
        )}

        {/* Render messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="message-list__date-group">
            {renderDateSeparator(date)}
            
            {dateMessages.map((message, index) => {
              const previousMessage = index > 0 ? dateMessages[index - 1] : null;
              const isConsecutive = previousMessage 
                ? chatUtils.areConsecutiveMessages(message, previousMessage)
                : false;

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  showTimestamp={config.showTimestamp}
                  isConsecutive={isConsecutive}
                  config={config}
                  onQuickReply={onQuickReply}
                />
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && renderTypingIndicator()}
      </div>

      <style jsx>{`
        .message-list {
          height: 100%;
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        .message-list__content {
          padding: 16px;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .message-list__welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 16px;
          flex: 1;
          min-height: 200px;
        }

        .message-list__welcome-icon {
          margin-bottom: 16px;
          color: var(--chat-primary-color, #007bff);
          opacity: 0.6;
        }

        .message-list__welcome-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #333;
        }

        .message-list__welcome-text {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.5;
          max-width: 280px;
        }

        .message-list__date-separator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 0 8px 0;
          position: relative;
        }

        .message-list__date-separator::before,
        .message-list__date-separator::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e1e5e9;
        }

        .message-list__date-text {
          padding: 0 12px;
          font-size: 11px;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 4px 8px;
          border: 1px solid #e1e5e9;
        }

        .message-list__date-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .message-list__typing {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-top: 8px;
          margin-bottom: 4px;
        }

        .message-list__typing-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--chat-primary-color, #007bff);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 2px;
        }

        .message-list__typing-avatar-icon {
          color: white;
          opacity: 0.9;
        }

        .message-list__typing-content {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 16px 16px 16px 4px;
          padding: 12px 16px;
          max-width: 80px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .message-list__typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
        }

        .message-list__typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #666;
          animation: typing-dot 1.4s infinite ease-in-out;
          animation-fill-mode: both;
        }

        .message-list__typing-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .message-list__typing-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes typing-dot {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Dark theme */
        .chat-window--dark .message-list__welcome-title {
          color: #e2e8f0;
        }

        .chat-window--dark .message-list__welcome-text {
          color: #a0aec0;
        }

        .chat-window--dark .message-list__date-separator::before,
        .chat-window--dark .message-list__date-separator::after {
          background: #4a5568;
        }

        .chat-window--dark .message-list__date-text {
          color: #a0aec0;
          background: #2d3748;
          border-color: #4a5568;
        }

        .chat-window--dark .message-list__typing-content {
          background: #4a5568;
          border-color: #718096;
          color: #e2e8f0;
        }

        /* Scrollbar styling */
        .message-list::-webkit-scrollbar {
          width: 6px;
        }

        .message-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .message-list::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }

        .message-list::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        .chat-window--dark .message-list::-webkit-scrollbar-thumb {
          background: #4a5568;
        }

        .chat-window--dark .message-list::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }

        @media (prefers-reduced-motion: reduce) {
          .message-list {
            scroll-behavior: auto;
          }
          
          .message-list__typing-dots span {
            animation: none;
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};