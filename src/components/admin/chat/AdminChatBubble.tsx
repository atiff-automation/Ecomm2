'use client';

import React from 'react';
import { User, Bot } from 'lucide-react';
import { chatUtils } from '@/components/chat/utils/chat-utils';

interface AdminChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'bot' | 'system';
  createdAt: string;
}

interface AdminChatBubbleProps {
  message: AdminChatMessage;
  isConsecutive?: boolean;
}

export const AdminChatBubble: React.FC<AdminChatBubbleProps> = ({
  message,
  isConsecutive = false,
}) => {
  const isUser = message.senderType === 'user';
  const isBot = message.senderType === 'bot';
  const isSystem = message.senderType === 'system';

  const renderAvatar = () => {
    if (isUser || isConsecutive) return null;

    return (
      <div className="admin-chat-bubble__avatar">
        {isBot ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-xs text-white font-medium">S</span>
          </div>
        )}
      </div>
    );
  };

  const formatSimpleTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (isSystem) {
    return (
      <div className="admin-chat-bubble admin-chat-bubble--system">
        <div className="admin-chat-bubble__system-content">
          <span className="admin-chat-bubble__system-text">
            {message.content}
          </span>
          <span className="admin-chat-bubble__timestamp">
            {formatSimpleTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`admin-chat-bubble admin-chat-bubble--${message.senderType}`}
    >
      <div className="admin-chat-bubble__wrapper">
        {renderAvatar()}

        <div className="admin-chat-bubble__content">
          <div className="admin-chat-bubble__bubble">
            <div className="admin-chat-bubble__text">{message.content}</div>
          </div>

          {!isConsecutive && (
            <div className="admin-chat-bubble__meta">
              <span className="admin-chat-bubble__timestamp">
                {formatSimpleTime(message.createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-chat-bubble {
          margin-bottom: 16px;
          max-width: 100%;
        }

        .admin-chat-bubble--system {
          margin-bottom: 12px;
        }

        .admin-chat-bubble__system-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .admin-chat-bubble__system-text {
          background: #f3f4f6;
          color: #6b7280;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 12px;
          text-align: center;
          max-width: 300px;
          line-height: 1.4;
        }

        .admin-chat-bubble__wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .admin-chat-bubble--user .admin-chat-bubble__wrapper {
          flex-direction: row-reverse;
        }

        .admin-chat-bubble__avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 2px;
        }

        .admin-chat-bubble__content {
          flex: 1;
          min-width: 0;
          max-width: 320px;
        }

        .admin-chat-bubble--user .admin-chat-bubble__content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .admin-chat-bubble__bubble {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px 18px 18px 4px;
          padding: 12px 16px;
          word-wrap: break-word;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .admin-chat-bubble--user .admin-chat-bubble__bubble {
          background: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
          border-radius: 18px 18px 4px 18px;
        }

        .admin-chat-bubble__text {
          font-size: 15px;
          line-height: 1.4;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          color: inherit;
        }

        .admin-chat-bubble__meta {
          margin-top: 4px;
          display: flex;
          align-items: center;
        }

        .admin-chat-bubble--user .admin-chat-bubble__meta {
          justify-content: flex-end;
        }

        .admin-chat-bubble__timestamp {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .admin-chat-bubble--system .admin-chat-bubble__timestamp {
          font-size: 10px;
          color: #9ca3af;
        }

        /* Hover effect for better interactivity */
        .admin-chat-bubble__bubble:hover {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }

        .admin-chat-bubble--user .admin-chat-bubble__bubble:hover {
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .admin-chat-bubble__content {
            max-width: 280px;
          }

          .admin-chat-bubble__bubble {
            padding: 10px 14px;
            font-size: 14px;
          }

          .admin-chat-bubble__avatar {
            width: 28px;
            height: 28px;
          }
        }

        /* Animation for message appearance */
        .admin-chat-bubble {
          animation: adminMessageAppear 0.3s ease-out;
        }

        @keyframes adminMessageAppear {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-chat-bubble {
            animation: none;
          }

          .admin-chat-bubble__bubble:hover {
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};
