'use client';

import React from 'react';
import { MessageCircle, Clock, User, Bot } from 'lucide-react';
import { AdminChatBubble } from './AdminChatBubble';
import { adminChatUtils } from './utils/admin-chat-utils';

interface AdminChatViewProps {
  messages: any[];
  isLoading?: boolean;
  showSummary?: boolean;
  className?: string;
}

export const AdminChatView: React.FC<AdminChatViewProps> = ({
  messages,
  isLoading = false,
  showSummary = true,
  className = ''
}) => {
  // Filter and simplify messages for admin view
  const adminMessages = adminChatUtils.filterAdminRelevantMessages(messages);
  const groupedMessages = adminChatUtils.groupConsecutiveMessages(adminMessages);
  const summary = adminChatUtils.generateConversationSummary(adminMessages);
  const highlights = adminChatUtils.extractConversationHighlights(adminMessages);
  const attention = adminChatUtils.needsAttention(adminMessages);

  if (isLoading) {
    return (
      <div className={`admin-chat-view ${className}`}>
        <div className="admin-chat-view__loading">
          <div className="admin-chat-view__loading-spinner" />
          <span className="admin-chat-view__loading-text">Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (adminMessages.length === 0) {
    return (
      <div className={`admin-chat-view ${className}`}>
        <div className="admin-chat-view__empty">
          <MessageCircle className="admin-chat-view__empty-icon" />
          <p className="admin-chat-view__empty-text">No messages in this conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-chat-view ${className}`}>
      {/* Attention Indicator */}
      {showSummary && attention.needsAttention && (
        <div className={`admin-chat-view__attention admin-chat-view__attention--${attention.urgency}`}>
          <span className="admin-chat-view__attention-label">
            Needs Attention ({attention.urgency})
          </span>
          <ul className="admin-chat-view__attention-reasons">
            {attention.reasons.map((reason, index) => (
              <li key={index} className="admin-chat-view__attention-reason">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Highlights */}
      {showSummary && highlights.length > 0 && (
        <div className="admin-chat-view__highlights">
          <span className="admin-chat-view__highlights-label">Key Moments:</span>
          <div className="admin-chat-view__highlights-list">
            {highlights.slice(0, 3).map((highlight, index) => (
              <span
                key={index}
                className={`admin-chat-view__highlight admin-chat-view__highlight--${highlight.type}`}
              >
                {highlight.context}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="admin-chat-view__messages">
        {groupedMessages.map(({ message, isConsecutive }) => (
          <AdminChatBubble
            key={message.id}
            message={message}
            isConsecutive={isConsecutive}
          />
        ))}
      </div>

      <style jsx>{`
        .admin-chat-view {
          display: flex;
          flex-direction: column;
          height: 100%;
        }


        .admin-chat-view__attention {
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .admin-chat-view__attention--low {
          background: #f0f9ff;
          border-color: #0ea5e9;
        }

        .admin-chat-view__attention--medium {
          background: #fffbeb;
          border-color: #f59e0b;
        }

        .admin-chat-view__attention--high {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .admin-chat-view__attention-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          display: block;
          margin-bottom: 4px;
        }

        .admin-chat-view__attention-reasons {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .admin-chat-view__attention-reason {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .admin-chat-view__highlights {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .admin-chat-view__highlights-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          display: block;
          margin-bottom: 8px;
        }

        .admin-chat-view__highlights-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .admin-chat-view__highlight {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
        }

        .admin-chat-view__highlight--escalation {
          background: #fef2f2;
          color: #dc2626;
        }

        .admin-chat-view__highlight--issue {
          background: #fffbeb;
          color: #d97706;
        }

        .admin-chat-view__highlight--satisfaction {
          background: #f0fdf4;
          color: #16a34a;
        }

        .admin-chat-view__highlight--transfer {
          background: #f0f9ff;
          color: #0284c7;
        }

        .admin-chat-view__messages {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .admin-chat-view__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          color: #6b7280;
        }

        .admin-chat-view__loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        .admin-chat-view__loading-text {
          font-size: 14px;
          font-weight: 500;
        }

        .admin-chat-view__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          color: #9ca3af;
        }

        .admin-chat-view__empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
        }

        .admin-chat-view__empty-text {
          font-size: 16px;
          font-weight: 500;
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .admin-chat-view__summary {
            padding: 12px;
            margin-bottom: 16px;
          }

          .admin-chat-view__summary-stats {
            gap: 12px;
          }

          .admin-chat-view__stat-text {
            font-size: 13px;
          }

          .admin-chat-view__highlights-list {
            gap: 6px;
          }

          .admin-chat-view__highlight {
            font-size: 11px;
            padding: 3px 6px;
          }
        }
      `}</style>
    </div>
  );
};