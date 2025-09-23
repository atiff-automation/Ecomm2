'use client';

import React from 'react';
import { chatUtils } from './utils/chat-utils';
import type { ChatConfig } from './types';

interface TypingIndicatorProps {
  isVisible: boolean;
  config: ChatConfig;
  userName?: string;
}

/**
 * Typing Indicator Component
 * Shows when someone is typing in the chat
 * Follows DRY principles with centralized styling
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  config,
  userName = 'Assistant',
}) => {
  if (!isVisible || !config.enableTypingIndicator) {
    return null;
  }

  return (
    <div className="typing-indicator">
      <div className="typing-indicator__wrapper">
        <div className="typing-indicator__avatar">
          <div className="typing-indicator__avatar-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21V17.5C20 16.1193 18.8807 15 17.5 15S15 16.1193 15 17.5V21M12 7V21M8 11V21M4 15V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="typing-indicator__content">
          <div className="typing-indicator__bubble">
            <div className="typing-indicator__text">
              <span className="typing-indicator__name">{userName}</span> is
              typing
            </div>
            <div className="typing-indicator__dots">
              <span className="typing-indicator__dot"></span>
              <span className="typing-indicator__dot"></span>
              <span className="typing-indicator__dot"></span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .typing-indicator {
          padding: 8px 16px 0;
          animation: fadeInUp 300ms ease-out;
        }

        .typing-indicator__wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 280px;
        }

        .typing-indicator__avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--chat-primary-color, #007bff);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 2px;
        }

        .typing-indicator__avatar-icon {
          color: white;
          opacity: 0.9;
        }

        .typing-indicator__content {
          flex: 1;
          min-width: 0;
        }

        .typing-indicator__bubble {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 16px 16px 16px 4px;
          padding: 10px 14px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .typing-indicator__text {
          font-size: 13px;
          color: #6c757d;
          line-height: 1.3;
        }

        .typing-indicator__name {
          font-weight: 500;
          color: #374151;
        }

        .typing-indicator__dots {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
        }

        .typing-indicator__dot {
          width: 6px;
          height: 6px;
          background: #6c757d;
          border-radius: 50%;
          animation: typingDot 1.4s infinite ease-in-out;
        }

        .typing-indicator__dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator__dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typingDot {
          0%,
          60%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          30% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        /* Dark theme support */
        .chat-window--dark .typing-indicator__bubble {
          background: #4a5568;
          border-color: #718096;
        }

        .chat-window--dark .typing-indicator__text {
          color: #a0aec0;
        }

        .chat-window--dark .typing-indicator__name {
          color: #e2e8f0;
        }

        .chat-window--dark .typing-indicator__dot {
          background: #a0aec0;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .typing-indicator {
            padding: 6px 12px 0;
          }

          .typing-indicator__wrapper {
            max-width: 240px;
          }

          .typing-indicator__avatar {
            width: 24px;
            height: 24px;
          }

          .typing-indicator__avatar-icon svg {
            width: 14px;
            height: 14px;
          }

          .typing-indicator__bubble {
            padding: 8px 12px;
          }

          .typing-indicator__text {
            font-size: 12px;
          }
        }

        /* Accessibility improvements */
        .typing-indicator__bubble {
          outline: 2px solid transparent;
        }

        .typing-indicator__bubble:focus-within {
          outline-color: var(--chat-primary-color, #007bff);
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .typing-indicator {
            animation: none;
          }

          .typing-indicator__dot {
            animation: none;
            opacity: 0.7;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .typing-indicator__bubble {
            border-width: 2px;
          }

          .typing-indicator__text {
            color: #000;
          }

          .typing-indicator__dot {
            background: #000;
          }
        }
      `}</style>
    </div>
  );
};
