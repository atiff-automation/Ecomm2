'use client';

import React, { useState } from 'react';
import type { ChatConfig } from './types';

/**
 * AuthChoiceModal Component
 * Provides authenticated users with choice between authenticated and guest chat
 * Following @CLAUDE.md systematic approach with centralized configuration - NO hardcoded values
 */

// Helper function to get timeout display from config - single source of truth
const getTimeoutDisplay = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${remainingMinutes}min`;
    }
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

// Dynamic benefits configuration based on config - NO hardcoded values
const getChatBenefits = (config: ChatConfig) => ({
  AUTHENTICATED: [
    `Extended ${getTimeoutDisplay(config.authenticatedSessionTimeoutMinutes)} chat session`,
    'No need to re-enter contact details',
    'Chat history linked to your account',
    'Faster response prioritization'
  ],
  GUEST: [
    `${getTimeoutDisplay(config.guestSessionTimeoutMinutes)} anonymous session`,
    'Privacy-focused experience',
    'No account linking required',
    'Quick contact entry'
  ]
});

interface AuthChoiceModalProps {
  isOpen: boolean;
  user: {
    name: string | null;
    email: string;
    id: string;
  };
  config: ChatConfig;
  onAuthenticatedStart: () => Promise<void>;
  onGuestStart: () => void;
  onClose: () => void;
}

export const AuthChoiceModal: React.FC<AuthChoiceModalProps> = ({
  isOpen,
  user,
  config,
  onAuthenticatedStart,
  onGuestStart,
  onClose
}) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [error, setError] = useState('');

  // Centralized display name logic
  const displayName = user.name || user.email.split('@')[0];

  // Get dynamic benefits and timeouts from config - NO hardcoded values
  const chatBenefits = getChatBenefits(config);
  const timeoutDisplay = {
    AUTHENTICATED: getTimeoutDisplay(config.authenticatedSessionTimeoutMinutes),
    GUEST: getTimeoutDisplay(config.guestSessionTimeoutMinutes)
  };

  const handleAuthenticatedStart = async () => {
    setError('');
    setIsLoadingAuth(true);

    try {
      await onAuthenticatedStart();
    } catch (error) {
      console.error('Failed to start authenticated session:', error);
      setError('Failed to start authenticated chat. Please try again.');
      setIsLoadingAuth(false);
    }
  };

  const handleGuestStart = () => {
    setError('');
    onGuestStart();
  };

  const handleClose = () => {
    if (!isLoadingAuth) {
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-choice-overlay">
      <div className="auth-choice-modal">
        <div className="auth-choice-modal__header">
          <h3 className="auth-choice-modal__title">Start Chat Session</h3>
          <button
            className="auth-choice-modal__close"
            onClick={handleClose}
            disabled={isLoadingAuth}
            aria-label="Close"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="auth-choice-modal__body">
          <p className="auth-choice-modal__greeting">
            Hello <strong>{displayName}</strong>! Choose your preferred chat experience:
          </p>

          {error && (
            <div className="auth-choice-modal__error">
              {error}
            </div>
          )}

          <div className="auth-choice-modal__options">
            {/* Authenticated Option */}
            <button
              className="auth-choice-modal__option auth-choice-modal__option--primary"
              onClick={handleAuthenticatedStart}
              disabled={isLoadingAuth}
              type="button"
            >
              <div className="auth-choice-modal__option-header">
                <div className="auth-choice-modal__option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="m19 8 2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="m17 10h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="auth-choice-modal__option-title">
                  Continue as {displayName}
                </div>
                <div className="auth-choice-modal__option-duration">
                  {timeoutDisplay.AUTHENTICATED}
                </div>
              </div>

              <ul className="auth-choice-modal__option-benefits">
                {chatBenefits.AUTHENTICATED.map((benefit, index) => (
                  <li key={index}>• {benefit}</li>
                ))}
              </ul>

              {isLoadingAuth && (
                <div className="auth-choice-modal__loading">
                  <div className="auth-choice-modal__loading-spinner"></div>
                  Starting chat session...
                </div>
              )}
            </button>

            <div className="auth-choice-modal__divider">
              <span>or</span>
            </div>

            {/* Guest Option */}
            <button
              className="auth-choice-modal__option auth-choice-modal__option--secondary"
              onClick={handleGuestStart}
              disabled={isLoadingAuth}
              type="button"
            >
              <div className="auth-choice-modal__option-header">
                <div className="auth-choice-modal__option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="auth-choice-modal__option-title">
                  Chat as Guest
                </div>
                <div className="auth-choice-modal__option-duration">
                  {timeoutDisplay.GUEST}
                </div>
              </div>

              <ul className="auth-choice-modal__option-benefits">
                {chatBenefits.GUEST.map((benefit, index) => (
                  <li key={index}>• {benefit}</li>
                ))}
              </ul>
            </button>
          </div>

          <div className="auth-choice-modal__footer">
            <p className="auth-choice-modal__note">
              You can change your preference anytime by signing out and back in.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-choice-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
          animation: fadeIn 200ms ease-out;
        }

        .auth-choice-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow: hidden;
          animation: slideInScale 300ms ease-out;
        }

        .auth-choice-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          border-bottom: 1px solid #e1e5e9;
          background: ${config.primaryColor};
          color: white;
        }

        .auth-choice-modal__title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .auth-choice-modal__close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          opacity: 0.8;
          transition: opacity 200ms ease, background 200ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-choice-modal__close:hover:not(:disabled) {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        .auth-choice-modal__close:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .auth-choice-modal__body {
          padding: 28px;
        }

        .auth-choice-modal__greeting {
          margin: 0 0 24px;
          color: #2d3748;
          font-size: 16px;
          line-height: 1.5;
          text-align: center;
        }

        .auth-choice-modal__error {
          background: #fed7d7;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid #feb2b2;
          margin-bottom: 20px;
        }

        .auth-choice-modal__options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-choice-modal__option {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 200ms ease;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .auth-choice-modal__option--primary {
          border-color: ${config.primaryColor};
          background: linear-gradient(135deg, ${config.primaryColor}08 0%, ${config.primaryColor}04 100%);
        }

        .auth-choice-modal__option--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, ${config.primaryColor}12 0%, ${config.primaryColor}08 100%);
          border-color: ${config.primaryColor};
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 123, 255, 0.15);
        }

        .auth-choice-modal__option--secondary:hover:not(:disabled) {
          border-color: #a0aec0;
          background: #f7fafc;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .auth-choice-modal__option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .auth-choice-modal__option-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .auth-choice-modal__option-icon {
          color: ${config.primaryColor};
          flex-shrink: 0;
        }

        .auth-choice-modal__option--secondary .auth-choice-modal__option-icon {
          color: #718096;
        }

        .auth-choice-modal__option-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          flex: 1;
        }

        .auth-choice-modal__option-duration {
          font-size: 12px;
          font-weight: 500;
          color: ${config.primaryColor};
          background: ${config.primaryColor}15;
          padding: 4px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .auth-choice-modal__option--secondary .auth-choice-modal__option-duration {
          color: #718096;
          background: #f7fafc;
        }

        .auth-choice-modal__option-benefits {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 13px;
          color: #4a5568;
          line-height: 1.4;
        }

        .auth-choice-modal__option-benefits li {
          margin-bottom: 4px;
        }

        .auth-choice-modal__loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          color: ${config.primaryColor};
        }

        .auth-choice-modal__loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid ${config.primaryColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .auth-choice-modal__divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 8px 0;
        }

        .auth-choice-modal__divider::before,
        .auth-choice-modal__divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .auth-choice-modal__divider span {
          padding: 0 16px;
          font-size: 12px;
          color: #a0aec0;
          text-transform: uppercase;
          font-weight: 500;
        }

        .auth-choice-modal__footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .auth-choice-modal__note {
          margin: 0;
          font-size: 12px;
          color: #718096;
          text-align: center;
          line-height: 1.4;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .auth-choice-overlay {
            padding: 16px;
          }

          .auth-choice-modal {
            max-width: none;
            border-radius: 12px;
          }

          .auth-choice-modal__header {
            padding: 20px 24px;
          }

          .auth-choice-modal__body {
            padding: 24px;
          }

          .auth-choice-modal__title {
            font-size: 18px;
          }

          .auth-choice-modal__option {
            padding: 16px;
          }

          .auth-choice-modal__option-header {
            flex-wrap: wrap;
            gap: 8px;
          }

          .auth-choice-modal__option-duration {
            order: -1;
            margin-left: 36px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-choice-overlay,
          .auth-choice-modal {
            animation: none;
          }

          .auth-choice-modal__option:hover:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};