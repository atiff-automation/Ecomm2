'use client';

import React, { useState } from 'react';
import type { ChatConfig } from './types';

interface ContactFormProps {
  isOpen: boolean;
  config: ChatConfig;
  onSubmit: (contactInfo: { phone?: string; email?: string }) => void;
  onClose: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  isOpen,
  config,
  onSubmit,
  onClose
}) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number (prioritize phone over email)
    if (!phone.trim() && !email.trim()) {
      setError('Please provide your contact number or email address');
      return;
    }

    if (phone.trim()) {
      // Validate phone format
      const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        setError('Please enter a valid contact number');
        return;
      }
    }

    if (email.trim()) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    }

    setIsLoading(true);
    try {
      const contactInfo: { phone?: string; email?: string } = {};
      
      // Prioritize phone number
      if (phone.trim()) {
        contactInfo.phone = phone.trim();
      } else if (email.trim()) {
        contactInfo.email = email.trim();
      }

      await onSubmit(contactInfo);
    } catch (error) {
      setError('Failed to start chat. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-form-overlay">
      <div className="contact-form">
        <div className="contact-form__header">
          <h3 className="contact-form__title">Start Chat</h3>
          <button
            className="contact-form__close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="contact-form__body">
          <p className="contact-form__description">
            Please provide your contact number to start the chat session.
          </p>

          <form onSubmit={handleSubmit} className="contact-form__form">
            <div className="contact-form__field">
              <label htmlFor="phone" className="contact-form__label">
                Contact Number <span className="contact-form__required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="contact-form__input"
                placeholder="e.g., +60123456789"
                disabled={isLoading}
                autoComplete="tel"
                maxLength={20}
              />
              <div className="contact-form__help">
                Include country code (e.g., +60 for Malaysia)
              </div>
            </div>

            <div className="contact-form__divider">
              <span>or</span>
            </div>

            <div className="contact-form__field">
              <label htmlFor="email" className="contact-form__label">
                Email Address (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="contact-form__input"
                placeholder="your@email.com"
                disabled={isLoading || !!phone.trim()}
                autoComplete="email"
                maxLength={100}
              />
            </div>

            {error && (
              <div className="contact-form__error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (!phone.trim() && !email.trim())}
              className="contact-form__submit"
            >
              {isLoading ? (
                <>
                  <div className="contact-form__loading"></div>
                  Starting Chat...
                </>
              ) : (
                'Start Chat'
              )}
            </button>

            <div className="contact-form__privacy">
              Your contact information will be used only for this chat session.
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .contact-form-overlay {
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

        .contact-form {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow: hidden;
          animation: slideInScale 300ms ease-out;
        }

        .contact-form__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e1e5e9;
          background: var(--chat-primary-color, #007bff);
          color: white;
        }

        .contact-form__title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .contact-form__close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.8;
          transition: opacity 200ms ease, background 200ms ease;
        }

        .contact-form__close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        .contact-form__body {
          padding: 24px;
        }

        .contact-form__description {
          margin: 0 0 20px;
          color: #4a5568;
          font-size: 14px;
          line-height: 1.5;
        }

        .contact-form__form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .contact-form__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .contact-form__label {
          font-size: 14px;
          font-weight: 500;
          color: #2d3748;
        }

        .contact-form__required {
          color: #e53e3e;
        }

        .contact-form__input {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 200ms ease, box-shadow 200ms ease;
          outline: none;
        }

        .contact-form__input:focus {
          border-color: var(--chat-primary-color, #007bff);
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .contact-form__input:disabled {
          background-color: #f7fafc;
          color: #a0aec0;
          cursor: not-allowed;
        }

        .contact-form__help {
          font-size: 12px;
          color: #718096;
        }

        .contact-form__divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 8px 0;
        }

        .contact-form__divider::before,
        .contact-form__divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .contact-form__divider span {
          padding: 0 12px;
          font-size: 12px;
          color: #a0aec0;
          text-transform: uppercase;
        }

        .contact-form__error {
          background: #fed7d7;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid #feb2b2;
        }

        .contact-form__submit {
          background: var(--chat-primary-color, #007bff);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }

        .contact-form__submit:hover:not(:disabled) {
          background: var(--chat-primary-color-dark, #0056b3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .contact-form__submit:disabled {
          background: #a0aec0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .contact-form__loading {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .contact-form__privacy {
          font-size: 11px;
          color: #718096;
          text-align: center;
          line-height: 1.4;
          margin-top: 4px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
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
          .contact-form-overlay {
            padding: 16px;
          }

          .contact-form {
            max-width: none;
          }

          .contact-form__header {
            padding: 16px 20px;
          }

          .contact-form__body {
            padding: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-form-overlay,
          .contact-form {
            animation: none;
          }

          .contact-form__submit:hover:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};