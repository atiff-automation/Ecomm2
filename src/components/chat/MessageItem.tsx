'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { chatUtils } from './utils/chat-utils';
import { QuickReply } from './QuickReply';
import { RichContent } from './RichContent';
import type { ChatConfig, ChatMessage, QuickReply as QuickReplyType } from './types';

interface MessageItemProps {
  message: ChatMessage;
  showTimestamp: boolean;
  isConsecutive: boolean;
  config: ChatConfig;
  onQuickReply: (reply: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  showTimestamp,
  isConsecutive,
  config,
  onQuickReply
}) => {
  const isUser = chatUtils.isUserMessage(message);
  const isBot = chatUtils.isBotMessage(message);
  const quickReplies = chatUtils.parseQuickReplies(message);
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

  const messageClasses = [
    'message-item',
    isUser && 'message-item--user',
    isBot && 'message-item--bot',
    isConsecutive && 'message-item--consecutive',
    message.status === 'failed' && 'message-item--failed'
  ].filter(Boolean).join(' ');

  const renderAvatar = () => {
    if (isUser || isConsecutive) return null;

    return (
      <div className="message-item__avatar">
        {botIconUrl ? (
          <div className="message-item__avatar-image">
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
          <div className="message-item__avatar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V17.5C20 16.1193 18.8807 15 17.5 15S15 16.1193 15 17.5V21M12 7V21M8 11V21M4 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    // Handle rich content with dedicated RichContent component
    if (chatUtils.hasRichContent(message)) {
      const richContent = chatUtils.extractRichContent(message);
      return (
        <div className="message-item__rich-content">
          {message.content && (
            <div className="message-item__text">
              {message.content}
            </div>
          )}
          {richContent && (
            <RichContent
              richContent={richContent}
              onQuickReply={onQuickReply}
              disabled={message.status === 'failed'}
            />
          )}
        </div>
      );
    }

    return (
      <div className="message-item__text">
        {message.content}
      </div>
    );
  };

  const renderQuickReplies = () => {
    if (quickReplies.length === 0 || chatUtils.hasRichContent(message)) return null;

    return (
      <div className="message-item__quick-replies">
        <QuickReply
          replies={quickReplies}
          onQuickReply={onQuickReply}
          disabled={message.status === 'failed'}
          config={{
            layout: 'horizontal',
            buttonStyle: 'pill',
            maxReplies: 4
          }}
        />
      </div>
    );
  };

  const renderStatus = () => {
    if (!isUser) return null;

    const statusIcon = chatUtils.getMessageStatusIcon(message.status);
    const statusColor = chatUtils.getMessageStatusColor(message.status);

    return (
      <div 
        className="message-item__status"
        style={{ color: statusColor }}
        title={`Message ${message.status}`}
        aria-label={`Message ${message.status}`}
      >
        {statusIcon}
      </div>
    );
  };

  const renderTimestamp = () => {
    if (!showTimestamp && !message.status) return null;

    return (
      <div className="message-item__meta">
        {showTimestamp && (
          <span className="message-item__timestamp">
            {chatUtils.formatMessageTime(message.createdAt)}
          </span>
        )}
        {renderStatus()}
      </div>
    );
  };

  return (
    <div className={messageClasses}>
      <div className="message-item__wrapper">
        {renderAvatar()}
        
        <div className="message-item__content">
          <div className="message-item__bubble">
            {renderContent()}
            {renderQuickReplies()}
          </div>
          {renderTimestamp()}
        </div>
      </div>

      <style jsx>{`
        .message-item {
          margin-bottom: 16px;
          max-width: 100%;
        }

        .message-item--consecutive {
          margin-bottom: 4px;
        }

        .message-item__wrapper {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .message-item--user .message-item__wrapper {
          flex-direction: row-reverse;
        }

        .message-item__avatar {
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

        .message-item__avatar-icon {
          color: white;
          opacity: 0.9;
        }

        .message-item__avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .message-item__content {
          flex: 1;
          min-width: 0;
          max-width: 300px;
        }

        .message-item--user .message-item__content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-item__bubble {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(229, 231, 235, 0.5);
          border-radius: 20px 20px 20px 6px;
          padding: 16px 20px;
          word-wrap: break-word;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
          position: relative;
          backdrop-filter: blur(10px);
        }

        .message-item--user .message-item__bubble {
          background: linear-gradient(135deg, var(--chat-primary-color, #2563eb) 0%, #3b82f6 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px 20px 6px 20px;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25), 0 2px 8px rgba(37, 99, 235, 0.15);
        }

        .message-item--consecutive .message-item__bubble {
          border-radius: 20px 20px 20px 8px;
        }

        .message-item--user.message-item--consecutive .message-item__bubble {
          border-radius: 20px 20px 8px 20px;
        }

        .message-item--failed .message-item__bubble {
          background: #f8d7da;
          border-color: #f5c6cb;
          color: #721c24;
        }

        .message-item__text {
          font-size: 15px;
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
          font-weight: 400;
          letter-spacing: -0.01em;
          font-family: inherit;
          color: #1a202c;
        }

        .message-item__rich-content {
          font-size: 15px;
          line-height: 1.5;
          font-family: inherit;
          color: #1a202c;
        }

        .message-item__quick-replies {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e1e5e9;
        }

        .message-item--user .message-item__quick-replies {
          border-top-color: rgba(255, 255, 255, 0.2);
        }

        .message-item__quick-replies-label {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 6px;
          opacity: 0.8;
        }

        .message-item__quick-replies-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .message-item__quick-reply-btn {
          background: rgba(0, 123, 255, 0.1);
          border: 1px solid rgba(0, 123, 255, 0.3);
          color: var(--chat-primary-color, #007bff);
          border-radius: 12px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .message-item__quick-reply-btn:hover {
          background: rgba(0, 123, 255, 0.2);
          border-color: rgba(0, 123, 255, 0.5);
        }

        .message-item--user .message-item__quick-reply-btn {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
        }

        .message-item--user .message-item__quick-reply-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .message-item__meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 11px;
          color: #666;
        }

        .message-item--user .message-item__meta {
          justify-content: flex-end;
        }

        .message-item__timestamp {
          opacity: 0.7;
        }

        .message-item__status {
          font-size: 12px;
          opacity: 0.8;
        }

        /* Dark theme */
        .chat-window--dark .message-item__bubble {
          background: #4a5568;
          border-color: #718096;
          color: #e2e8f0;
        }

        .chat-window--dark .message-item--failed .message-item__bubble {
          background: #742a2a;
          border-color: #9c4221;
          color: #feb2b2;
        }

        .chat-window--dark .message-item__quick-replies {
          border-top-color: #718096;
        }

        .chat-window--dark .message-item__meta {
          color: #a0aec0;
        }

        /* Animation for new messages */
        .message-item {
          animation: messageAppear 300ms ease-out;
        }

        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .message-item__content {
            max-width: 240px;
          }

          .message-item__bubble {
            padding: 10px 12px;
            font-size: 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .message-item {
            animation: none;
          }
          
          .message-item__quick-reply-btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};