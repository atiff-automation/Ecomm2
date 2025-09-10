'use client';

import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { chatUtils } from './utils/chat-utils';
import type { ChatConfig, ChatMessage, ChatSession } from './types';

interface ChatWindowProps {
  isOpen: boolean;
  isConnected: boolean;
  isTyping: boolean;
  session: ChatSession | null;
  messages: ChatMessage[];
  config: ChatConfig;
  onClose: () => void;
  onSendMessage: (content: string, messageType?: ChatMessage['messageType']) => void;
  onQuickReply: (reply: string) => void;
  onTyping?: (isTyping: boolean) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  isConnected,
  isTyping,
  session,
  messages,
  config,
  onClose,
  onSendMessage,
  onQuickReply,
  onTyping
}) => {
  const themeClasses = chatUtils.getThemeClasses(config);
  const themeStyles = chatUtils.generateThemeStyles(config);

  if (!isOpen) return null;

  const windowClasses = [
    'chat-window',
    `chat-window--${config.position}`,
    `chat-window--${config.theme}`,
    !isConnected && 'chat-window--disconnected'
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={windowClasses} 
      style={themeStyles}
      role="dialog"
      aria-label="Chat window"
      aria-modal="true"
    >
      {/* Header */}
      <div className="chat-window__header">
        <div className="chat-window__header-content">
          <div className="chat-window__title">
            <span>Chat Support</span>
            <div className={`chat-window__status ${isConnected ? 'chat-window__status--connected' : 'chat-window__status--disconnected'}`}>
              {isConnected ? 'Online' : 'Offline'}
            </div>
          </div>
          <button
            className="chat-window__close"
            onClick={onClose}
            aria-label="Close chat"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* Session info */}
        {session && (
          <div className="chat-window__session-info">
            <span className="chat-window__session-id" title={`Session: ${session.id}`}>
              Session active
            </span>
            {session.expiresAt && (
              <span className="chat-window__session-expires">
                {chatUtils.formatSessionTimeRemaining(session.expiresAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="chat-window__body">
        <MessageList
          messages={messages}
          isTyping={isTyping}
          config={config}
          onQuickReply={onQuickReply}
        />
      </div>

      {/* Input */}
      <div className="chat-window__footer">
        <MessageInput
          isConnected={isConnected}
          isDisabled={!session}
          config={config}
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          placeholder={config.placeholder}
        />
      </div>

      <style jsx>{`
        .chat-window {
          position: fixed;
          width: 380px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          overflow: hidden;
          animation: slideUp 300ms ease-out;
        }

        .chat-window--dark {
          background: #2d3748;
          color: white;
        }

        .chat-window--bottom-right {
          bottom: 90px;
          right: 24px;
        }

        .chat-window--bottom-left {
          bottom: 90px;
          left: 24px;
        }

        .chat-window--top-right {
          top: 90px;
          right: 24px;
        }

        .chat-window--top-left {
          top: 90px;
          left: 24px;
        }

        .chat-window--disconnected {
          border: 2px solid #dc3545;
        }

        .chat-window__header {
          padding: 16px 20px 12px;
          border-bottom: 1px solid #e1e5e9;
          background: var(--chat-primary-color, #007bff);
          color: white;
          flex-shrink: 0;
        }

        .chat-window--dark .chat-window__header {
          border-bottom-color: #4a5568;
        }

        .chat-window__header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-window__title {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chat-window__title span {
          font-size: 16px;
          font-weight: 600;
          line-height: 1;
        }

        .chat-window__status {
          font-size: 12px;
          opacity: 0.9;
        }

        .chat-window__status--connected::before {
          content: '●';
          color: #28a745;
          margin-right: 4px;
        }

        .chat-window__status--disconnected::before {
          content: '●';
          color: #dc3545;
          margin-right: 4px;
        }

        .chat-window__close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.8;
          transition: opacity 200ms ease;
        }

        .chat-window__close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        .chat-window__session-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          font-size: 11px;
          opacity: 0.8;
        }

        .chat-window__session-id {
          font-weight: 500;
        }

        .chat-window__session-expires {
          font-style: italic;
        }

        .chat-window__body {
          flex: 1;
          min-height: 0;
          background: #f8f9fa;
        }

        .chat-window--dark .chat-window__body {
          background: #1a202c;
        }

        .chat-window__footer {
          flex-shrink: 0;
          border-top: 1px solid #e1e5e9;
          background: white;
        }

        .chat-window--dark .chat-window__footer {
          border-top-color: #4a5568;
          background: #2d3748;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .chat-window {
            width: calc(100vw - 32px);
            height: calc(100vh - 120px);
            max-width: 380px;
            max-height: 600px;
          }

          .chat-window--bottom-right,
          .chat-window--bottom-left {
            bottom: 80px;
          }

          .chat-window--bottom-right {
            right: 16px;
          }

          .chat-window--bottom-left {
            left: 16px;
          }

          .chat-window--top-right,
          .chat-window--top-left {
            top: 80px;
          }

          .chat-window--top-right {
            right: 16px;
          }

          .chat-window--top-left {
            left: 16px;
          }
        }

        @media (max-width: 480px) {
          .chat-window {
            width: calc(100vw - 16px);
            height: calc(100vh - 100px);
          }

          .chat-window--bottom-right,
          .chat-window--bottom-left,
          .chat-window--top-right,
          .chat-window--top-left {
            right: 8px;
            left: 8px;
            bottom: 70px;
            top: auto;
            width: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .chat-window {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};