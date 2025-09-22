'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  const [botIconUrl, setBotIconUrl] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>('Customer Support');

  // Fetch bot icon and agent name from chat config
  useEffect(() => {
    const fetchChatConfig = async () => {
      try {
        const response = await fetch('/api/chat/config');
        const data = await response.json();
        if (data.success && data.config) {
          if (data.config.botIconUrl) {
            setBotIconUrl(data.config.botIconUrl);
          }
          if (data.config.agentName) {
            setAgentName(data.config.agentName);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat config:', error);
      }
    };

    fetchChatConfig();
  }, []);

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
          <div className="chat-window__profile">
            <div className="chat-window__avatar">
              {botIconUrl ? (
                <div className="chat-window__avatar-image">
                  <Image
                    src={botIconUrl}
                    alt="Bot"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover rounded-full"
                    unoptimized={false}
                  />
                </div>
              ) : (
                <div className="chat-window__avatar-img">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="chat-window__info">
              <div className="chat-window__title">
                <span>Chat with</span>
                <span className="chat-window__agent-name">{agentName}</span>
              </div>
              <div className={`chat-window__status ${isConnected ? 'chat-window__status--connected' : 'chat-window__status--disconnected'}`}>
                {isConnected ? "We're online" : 'Currently offline'}
              </div>
            </div>
          </div>
          <div className="chat-window__actions">
            <button
              className="chat-window__minimize"
              onClick={onClose}
              aria-label="Minimize chat"
              type="button"
              title="Minimize"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="chat-window__close"
              onClick={onClose}
              aria-label="Close chat"
              type="button"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
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
          width: 400px;
          height: 560px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
          overflow: hidden;
          animation: slideUp 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
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
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          background: linear-gradient(135deg, var(--chat-primary-color, #2563eb) 0%, #3b82f6 100%);
          color: white;
          flex-shrink: 0;
          position: relative;
          backdrop-filter: blur(10px);
        }

        .chat-window__header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .chat-window--dark .chat-window__header {
          border-bottom-color: #4a5568;
        }

        .chat-window__header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .chat-window__profile {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .chat-window__avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .chat-window__avatar-img {
          color: white;
          opacity: 0.9;
        }

        .chat-window__avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-window__info {
          flex: 1;
          min-width: 0;
        }

        .chat-window__title {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .chat-window__title span:first-child {
          font-size: 13px;
          font-weight: 400;
          opacity: 0.85;
          line-height: 1;
        }

        .chat-window__agent-name {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.2;
        }

        .chat-window__actions {
          display: flex;
          align-items: center;
          gap: 4px;
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

        .chat-window__minimize,
        .chat-window__close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          opacity: 0.8;
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          min-height: 32px;
        }

        .chat-window__minimize:hover,
        .chat-window__close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
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
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
          position: relative;
        }

        .chat-window__body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%);
          pointer-events: none;
          z-index: 1;
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