'use client';

import React from 'react';
import { chatUtils } from './utils/chat-utils';
import type { QuickReply as QuickReplyType } from './types';

interface QuickReplyProps {
  replies: QuickReplyType[];
  onQuickReply: (reply: string) => void;
  disabled?: boolean;
  config?: {
    maxReplies?: number;
    buttonStyle?: 'pill' | 'rounded' | 'square';
    layout?: 'horizontal' | 'vertical' | 'grid';
  };
}

/**
 * Quick Reply Component
 * Displays interactive quick reply buttons for user responses
 * Follows DRY principles with centralized configuration
 */
export const QuickReply: React.FC<QuickReplyProps> = ({
  replies,
  onQuickReply,
  disabled = false,
  config = {},
}) => {
  const {
    maxReplies = 6,
    buttonStyle = 'pill',
    layout = 'horizontal',
  } = config;

  // Limit the number of quick replies displayed
  const displayedReplies = replies.slice(0, maxReplies);

  if (displayedReplies.length === 0) {
    return null;
  }

  const handleQuickReply = (reply: QuickReplyType) => {
    if (disabled) return;

    // Validate reply before sending
    if (chatUtils.validateQuickReply(reply)) {
      onQuickReply(reply.value || reply.text);
    }
  };

  const getButtonClasses = (isDisabled: boolean) => {
    const baseClasses = [
      'quick-reply-button',
      `quick-reply-button--${buttonStyle}`,
      isDisabled && 'quick-reply-button--disabled',
    ]
      .filter(Boolean)
      .join(' ');

    return baseClasses;
  };

  const getContainerClasses = () => {
    return [
      'quick-reply-container',
      `quick-reply-container--${layout}`,
      disabled && 'quick-reply-container--disabled',
    ]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <div
      className={getContainerClasses()}
      role="group"
      aria-label="Quick reply options"
    >
      {displayedReplies.map((reply, index) => (
        <button
          key={reply.id || `quick-reply-${index}`}
          className={getButtonClasses(disabled)}
          onClick={() => handleQuickReply(reply)}
          disabled={disabled}
          aria-label={`Quick reply: ${reply.text}`}
          type="button"
        >
          {reply.icon && (
            <span className="quick-reply-button__icon" aria-hidden="true">
              {reply.icon}
            </span>
          )}
          <span className="quick-reply-button__text">{reply.text}</span>
        </button>
      ))}

      <style jsx>{`
        .quick-reply-container {
          display: flex;
          gap: 8px;
          margin: 12px 0 8px;
          flex-wrap: wrap;
          transition: opacity 200ms ease;
        }

        .quick-reply-container--horizontal {
          flex-direction: row;
          justify-content: flex-start;
        }

        .quick-reply-container--vertical {
          flex-direction: column;
          align-items: flex-start;
        }

        .quick-reply-container--grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .quick-reply-container--disabled {
          opacity: 0.6;
          pointer-events: none;
        }

        .quick-reply-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.2;
          border: 1px solid #e1e5e9;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
          transition: all 200ms ease;
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .quick-reply-button:hover:not(:disabled) {
          border-color: #007bff;
          background: #f8f9ff;
          color: #007bff;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
        }

        .quick-reply-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 123, 255, 0.1);
        }

        .quick-reply-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .quick-reply-button--pill {
          border-radius: 20px;
        }

        .quick-reply-button--rounded {
          border-radius: 8px;
        }

        .quick-reply-button--square {
          border-radius: 4px;
        }

        .quick-reply-button__icon {
          display: flex;
          align-items: center;
          font-size: 14px;
        }

        .quick-reply-button__text {
          flex: 1;
          min-width: 0;
        }

        /* Dark theme support */
        .chat-window--dark .quick-reply-button {
          border-color: #4a5568;
          background: #2d3748;
          color: #e2e8f0;
        }

        .chat-window--dark .quick-reply-button:hover:not(:disabled) {
          border-color: #63b3ed;
          background: #3182ce;
          color: white;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .quick-reply-container {
            gap: 6px;
          }

          .quick-reply-container--horizontal {
            flex-direction: column;
            align-items: stretch;
          }

          .quick-reply-button {
            padding: 10px 14px;
            font-size: 14px;
            max-width: none;
            justify-content: center;
          }

          .quick-reply-container--grid {
            grid-template-columns: 1fr;
          }
        }

        /* Accessibility improvements */
        .quick-reply-button:focus-visible {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }

        /* Animation for appearing quick replies */
        .quick-reply-container {
          animation: slideInUp 300ms ease-out;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .quick-reply-container {
            animation: none;
          }

          .quick-reply-button {
            transition: none;
          }

          .quick-reply-button:hover:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};
