'use client';

import React from 'react';
import { chatUtils } from './utils/chat-utils';
import type { ChatConfig } from './types';

interface ChatBubbleProps {
  isExpanded: boolean;
  isConnected: boolean;
  hasUnreadMessages: boolean;
  config: ChatConfig;
  onClick: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  isExpanded,
  isConnected,
  hasUnreadMessages,
  config,
  onClick,
}) => {
  const themeClasses = chatUtils.getThemeClasses(config);
  const themeStyles = chatUtils.generateThemeStyles(config);

  const bubbleClasses = [
    'chat-bubble',
    `chat-bubble--${config.position}`,
    `chat-bubble--${config.theme}`,
    isExpanded && 'chat-bubble--expanded',
    !isConnected && 'chat-bubble--disconnected',
    hasUnreadMessages && 'chat-bubble--has-unread',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={bubbleClasses}
      onClick={onClick}
      style={themeStyles}
      aria-label={isExpanded ? 'Close chat' : 'Open chat'}
      type="button"
      data-testid="chat-bubble"
    >
      <div className="chat-bubble__icon">
        {isExpanded ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Connection status indicator */}
      <div
        className={`chat-bubble__status ${isConnected ? 'chat-bubble__status--connected' : 'chat-bubble__status--disconnected'}`}
        aria-hidden="true"
      />

      {/* Unread message indicator */}
      {hasUnreadMessages && !isExpanded && (
        <div className="chat-bubble__unread" aria-label="Unread messages" />
      )}

      <style jsx>{`
        .chat-bubble {
          position: fixed;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--chat-primary-color, #007bff);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all var(--chat-animation-duration, 300ms) ease;
          z-index: 1000;
          outline: none;
        }

        .chat-bubble:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .chat-bubble:focus-visible {
          outline: 2px solid var(--chat-primary-color, #007bff);
          outline-offset: 2px;
        }

        .chat-bubble--bottom-right {
          bottom: 24px;
          right: 24px;
        }

        .chat-bubble--bottom-left {
          bottom: 24px;
          left: 24px;
        }

        .chat-bubble--top-right {
          top: 24px;
          right: 24px;
        }

        .chat-bubble--top-left {
          top: 24px;
          left: 24px;
        }

        .chat-bubble--dark {
          background-color: #2d3748;
        }

        .chat-bubble--expanded {
          background-color: #6c757d;
        }

        .chat-bubble--disconnected {
          background-color: #dc3545;
          animation: pulse-error 2s infinite;
        }

        .chat-bubble__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform var(--chat-animation-duration, 300ms) ease;
        }

        .chat-bubble--expanded .chat-bubble__icon {
          transform: rotate(180deg);
        }

        .chat-bubble__status {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          transition: all var(--chat-animation-duration, 300ms) ease;
        }

        .chat-bubble__status--connected {
          background-color: #28a745;
        }

        .chat-bubble__status--disconnected {
          background-color: #dc3545;
          animation: pulse-status 1s infinite;
        }

        .chat-bubble__unread {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background-color: #dc3545;
          border: 2px solid white;
          border-radius: 50%;
          animation: pulse-unread 1s infinite;
        }

        @keyframes pulse-error {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes pulse-status {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        @keyframes pulse-unread {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @media (max-width: 768px) {
          .chat-bubble {
            width: 56px;
            height: 56px;
          }

          .chat-bubble--bottom-right,
          .chat-bubble--bottom-left {
            bottom: 16px;
          }

          .chat-bubble--bottom-right {
            right: 16px;
          }

          .chat-bubble--bottom-left {
            left: 16px;
          }

          .chat-bubble--top-right,
          .chat-bubble--top-left {
            top: 16px;
          }

          .chat-bubble--top-right {
            right: 16px;
          }

          .chat-bubble--top-left {
            left: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .chat-bubble,
          .chat-bubble__icon,
          .chat-bubble__status {
            transition: none;
          }

          .chat-bubble--disconnected,
          .chat-bubble__status--disconnected,
          .chat-bubble__unread {
            animation: none;
          }
        }
      `}</style>
    </button>
  );
};
