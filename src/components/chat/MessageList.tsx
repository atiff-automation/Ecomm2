'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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
  const [botIconUrl, setBotIconUrl] = useState<string | null>(null);

  // Fetch bot icon from chat config
  useEffect(() => {
    const fetchBotIcon = async () => {
      try {
        const response = await fetch('/api/chat/config');
        const data = await response.json();
        if (data.success && data.config?.botIconUrl) {
          setBotIconUrl(data.config.botIconUrl);
        }
      } catch (error) {
        console.error('Failed to fetch bot icon:', error);
      }
    };

    fetchBotIcon();
  }, []);


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
        {botIconUrl ? (
          <div className="message-list__typing-avatar-image">
            <Image
              src={botIconUrl}
              alt="Bot"
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
              unoptimized={false}
            />
          </div>
        ) : (
          <div className="message-list__typing-avatar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V17.5C20 16.1193 18.8807 15 17.5 15S15 16.1193 15 17.5V21M12 7V21M8 11V21M4 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
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
        {/* Welcome message always appears as first message (UI only, not stored in DB) */}
        {config.welcomeMessage && (
          <div className="message-list__welcome">
            <div className="message-list__welcome-bubble">
              <div className="message-list__welcome-avatar">
                {botIconUrl ? (
                  <div className="message-list__welcome-avatar-image">
                    <Image
                      src={botIconUrl}
                      alt="Bot"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover rounded-full"
                      unoptimized={false}
                    />
                  </div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="message-list__welcome-content">
                <div className="message-list__welcome-text">
                  {config.welcomeMessage}
                </div>
              </div>
            </div>
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
          padding: 20px 0;
          margin-bottom: 16px;
        }

        .message-list__welcome-bubble {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          max-width: 300px;
        }

        .message-list__welcome-avatar {
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

        .message-list__welcome-avatar svg {
          color: white;
          opacity: 0.9;
        }

        .message-list__welcome-avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .message-list__welcome-content {
          flex: 1;
          min-width: 0;
        }

        .message-list__welcome-text {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(229, 231, 235, 0.5);
          border-radius: 20px 20px 20px 6px;
          padding: 16px 20px;
          font-size: 15px;
          line-height: 1.5;
          color: #1a202c;
          margin: 0;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(10px);
          white-space: pre-wrap;
          font-family: inherit;
          font-weight: 400;
          letter-spacing: -0.01em;
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

        .message-list__typing-avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
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