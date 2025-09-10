'use client';

import React from 'react';
import type { ChatConfig } from './types';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  config: ChatConfig;
  onRetry?: () => void;
}

/**
 * Connection Status Component
 * Shows the WebSocket connection status to users
 * Follows DRY principles with centralized styling
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionStatus,
  config,
  onRetry
}) => {
  // Only show when not connected or in error state
  if (isConnected && connectionStatus === 'connected') {
    return null;
  }

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          message: 'Connecting...',
          icon: '🔄',
          color: '#ffc107',
          showRetry: false
        };
      case 'disconnected':
        return {
          message: 'Disconnected from chat',
          icon: '⚠️',
          color: '#dc3545',
          showRetry: true
        };
      case 'error':
        return {
          message: 'Connection error',
          icon: '❌',
          color: '#dc3545',
          showRetry: true
        };
      default:
        return {
          message: 'Connecting...',
          icon: '🔄',
          color: '#6c757d',
          showRetry: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="connection-status">
      <div className="connection-status__content">
        <div className="connection-status__icon" role="img" aria-label={statusInfo.message}>
          {statusInfo.icon}
        </div>
        
        <div className="connection-status__text">
          {statusInfo.message}
        </div>
        
        {statusInfo.showRetry && onRetry && (
          <button
            type="button"
            className="connection-status__retry"
            onClick={onRetry}
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}
      </div>

      <style jsx>{`
        .connection-status {
          padding: 8px 16px;
          background: ${statusInfo.color}10;
          border: 1px solid ${statusInfo.color}30;
          border-radius: 6px;
          margin: 12px;
          animation: slideDown 300ms ease-out;
        }

        .connection-status__content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connection-status__icon {
          font-size: 14px;
          animation: ${connectionStatus === 'connecting' ? 'spin 2s linear infinite' : 'none'};
        }

        .connection-status__text {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: ${statusInfo.color};
          line-height: 1.3;
        }

        .connection-status__retry {
          font-size: 12px;
          font-weight: 500;
          color: ${statusInfo.color};
          background: none;
          border: 1px solid ${statusInfo.color};
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .connection-status__retry:hover {
          background: ${statusInfo.color};
          color: white;
        }

        .connection-status__retry:active {
          transform: scale(0.95);
        }

        /* Animations */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark theme support */
        .chat-window--dark .connection-status {
          background: ${statusInfo.color}20;
          border-color: ${statusInfo.color}40;
        }

        .chat-window--dark .connection-status__text {
          color: ${statusInfo.color === '#ffc107' ? '#ffd700' : statusInfo.color === '#dc3545' ? '#ff6b6b' : statusInfo.color};
        }

        .chat-window--dark .connection-status__retry {
          color: ${statusInfo.color === '#ffc107' ? '#ffd700' : statusInfo.color === '#dc3545' ? '#ff6b6b' : statusInfo.color};
          border-color: ${statusInfo.color === '#ffc107' ? '#ffd700' : statusInfo.color === '#dc3545' ? '#ff6b6b' : statusInfo.color};
        }

        .chat-window--dark .connection-status__retry:hover {
          background: ${statusInfo.color === '#ffc107' ? '#ffd700' : statusInfo.color === '#dc3545' ? '#ff6b6b' : statusInfo.color};
          color: #1a202c;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .connection-status {
            padding: 6px 12px;
            margin: 8px 12px;
          }

          .connection-status__text {
            font-size: 12px;
          }

          .connection-status__retry {
            font-size: 11px;
            padding: 3px 6px;
          }
        }

        /* Accessibility improvements */
        .connection-status__retry:focus-visible {
          outline: 2px solid ${statusInfo.color};
          outline-offset: 2px;
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .connection-status {
            animation: none;
          }
          
          .connection-status__icon {
            animation: none !important;
          }
          
          .connection-status__retry:active {
            transform: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .connection-status {
            border-width: 2px;
          }
          
          .connection-status__text {
            color: ${statusInfo.color === '#ffc107' ? '#b8860b' : statusInfo.color};
            font-weight: 600;
          }
          
          .connection-status__retry {
            font-weight: 600;
            border-width: 2px;
          }
        }
      `}</style>
    </div>
  );
};