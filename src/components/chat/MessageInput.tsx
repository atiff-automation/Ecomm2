'use client';

import React, { useState, useRef, useEffect } from 'react';
import { chatUtils } from './utils/chat-utils';
import { chatValidation } from './utils/validation';
import { MediaUpload } from './MediaUpload';
import type { ChatConfig, ChatMessage, ChatAttachment } from './types';

interface MessageInputProps {
  isConnected: boolean;
  isDisabled: boolean;
  config: ChatConfig;
  placeholder: string;
  onSendMessage: (
    content: string,
    messageType?: ChatMessage['messageType'],
    attachments?: ChatAttachment[]
  ) => void;
  onTyping?: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  isConnected,
  isDisabled,
  config,
  placeholder,
  onSendMessage,
  onTyping,
}) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Maximum 5 lines approximately
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;

      setIsExpanded(scrollHeight > 44); // Single line height
    }
  }, [message]);

  // Focus management
  useEffect(() => {
    if (!isDisabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isDisabled]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Debounced validation
  const debouncedValidation = chatUtils.debounce((content: string) => {
    if (content.trim()) {
      const validation = chatValidation.validateMessage(content, {
        maxLength: config.maxMessageLength,
        allowEmpty: false,
        sanitize: true,
      });

      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid message');
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    debouncedValidation(value);

    // Handle typing indicators
    if (onTyping && isConnected && config.enableTypingIndicator) {
      const hasContent = value.trim().length > 0;

      if (hasContent && !isTyping) {
        setIsTyping(true);
        onTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTyping(false);
        }
      }, 1500); // Stop typing after 1.5 seconds of inactivity
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();

    if (
      (!trimmedMessage && attachments.length === 0) ||
      isDisabled ||
      !isConnected
    ) {
      return;
    }

    // Validate message if present
    if (trimmedMessage) {
      const validation = chatValidation.validateMessage(trimmedMessage, {
        maxLength: config.maxMessageLength,
        allowEmpty: false,
        sanitize: true,
      });

      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid message');
        return;
      }
    }

    // Stop typing indicator
    if (onTyping && isTyping) {
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Clear validation error and send message
    setValidationError(null);
    const messageType = attachments.length > 0 ? 'rich_content' : 'text';
    onSendMessage(
      trimmedMessage || '',
      messageType,
      attachments.length > 0 ? attachments : undefined
    );
    setMessage('');
    setAttachments([]);
    setShowMediaUpload(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setIsExpanded(false);
    }
  };

  const handleMediaUpload = (
    files: File[],
    newAttachments: ChatAttachment[]
  ) => {
    if (!config.enableFileUpload) return;

    // Add new attachments to existing ones
    setAttachments(prev => [...prev, ...newAttachments]);
    setValidationError(null);

    // Auto-focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const toggleMediaUpload = () => {
    if (!config.enableFileUpload || isDisabled || !isConnected) return;
    setShowMediaUpload(!showMediaUpload);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Revoke object URLs to prevent memory leaks
      const removed = prev[index];
      if (removed.url?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      if (removed.thumbnail?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.thumbnail);
      }
      return updated;
    });
  };

  const canSend =
    (message.trim() || attachments.length > 0) &&
    isConnected &&
    !isDisabled &&
    !validationError;
  const characterCount = message.length;
  const isNearLimit = characterCount > config.maxMessageLength * 0.8;
  const isOverLimit = characterCount > config.maxMessageLength;

  const inputClasses = [
    'message-input',
    isExpanded && 'message-input--expanded',
    !isConnected && 'message-input--disconnected',
    isDisabled && 'message-input--disabled',
    validationError && 'message-input--error',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={inputClasses}>
      {validationError && (
        <div className="message-input__error" role="alert">
          {validationError}
        </div>
      )}

      {/* Media Upload Component */}
      {config.enableFileUpload && showMediaUpload && (
        <div className="message-input__media-upload">
          <MediaUpload
            onFileUpload={handleMediaUpload}
            disabled={isDisabled || !isConnected}
            maxFiles={5}
            maxFileSize={10}
            acceptedTypes={[
              'image/*',
              'video/*',
              'audio/*',
              'application/pdf',
              '.doc,.docx',
            ]}
            config={{
              enableDragDrop: true,
              showPreview: true,
              enableCompression: true,
            }}
          />
        </div>
      )}

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="message-input__attachments">
          <div className="message-input__attachments-header">
            <span className="message-input__attachments-count">
              {attachments.length} file{attachments.length > 1 ? 's' : ''}{' '}
              attached
            </span>
            <button
              type="button"
              className="message-input__clear-attachments"
              onClick={() => {
                // Revoke all object URLs
                attachments.forEach(attachment => {
                  if (attachment.url?.startsWith('blob:')) {
                    URL.revokeObjectURL(attachment.url);
                  }
                  if (attachment.thumbnail?.startsWith('blob:')) {
                    URL.revokeObjectURL(attachment.thumbnail);
                  }
                });
                setAttachments([]);
              }}
            >
              Clear All
            </button>
          </div>
          <div className="message-input__attachments-list">
            {attachments.map((attachment, index) => (
              <div
                key={`attachment-${index}`}
                className="message-input__attachment"
              >
                <div className="message-input__attachment-icon">
                  {attachment.type === 'image' ? '🖼️' : '📄'}
                </div>
                <div className="message-input__attachment-name">
                  {attachment.title}
                </div>
                <button
                  type="button"
                  className="message-input__remove-attachment"
                  onClick={() => removeAttachment(index)}
                  aria-label={`Remove ${attachment.title}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="message-input__container">
        {/* File upload button */}
        {config.enableFileUpload && (
          <button
            type="button"
            className={`message-input__file-btn ${showMediaUpload ? 'message-input__file-btn--active' : ''}`}
            onClick={toggleMediaUpload}
            disabled={isDisabled || !isConnected}
            title="Attach files"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 21.9983 8.005 21.9983C6.41278 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63417 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42944 14.0948 2.00613 15.155 2.00613C16.2152 2.00613 17.2294 2.42944 17.98 3.18C18.7306 3.93056 19.1539 4.94477 19.1539 6.005C19.1539 7.06523 18.7306 8.07944 17.98 8.83L10.69 16.12C10.3148 16.4952 9.80186 16.7077 9.27 16.7077C8.73814 16.7077 8.22518 16.4952 7.85 16.12C7.47482 15.7448 7.26234 15.2319 7.26234 14.7C7.26234 14.1681 7.47482 13.6552 7.85 13.28L15.54 5.59"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Text input */}
        <div className="message-input__text-container">
          <textarea
            ref={textareaRef}
            className="message-input__textarea"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? placeholder : 'Connecting...'}
            disabled={isDisabled || !isConnected}
            maxLength={(config.maxMessageLength || 1000) + 100} // Allow some overflow for validation
            rows={1}
            aria-label="Type your message"
          />

          {/* Character counter */}
          {(isNearLimit || isOverLimit) && (
            <div
              className={`message-input__counter ${isOverLimit ? 'message-input__counter--over' : ''}`}
            >
              {characterCount}/{config.maxMessageLength}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          className="message-input__send-btn"
          onClick={handleSend}
          disabled={!canSend}
          type="button"
          aria-label="Send message"
          title={!canSend ? 'Enter a message to send' : 'Send message (Enter)'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .message-input {
          padding: 20px 24px;
          background: linear-gradient(180deg, white 0%, #fafafa 100%);
          border-top: 1px solid rgba(229, 231, 235, 0.6);
          backdrop-filter: blur(10px);
        }

        .message-input__error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .message-input__container {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: linear-gradient(135deg, white 0%, #f9fafb 100%);
          border: 1.5px solid #e5e7eb;
          border-radius: 28px;
          padding: 14px 18px;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 3px 12px rgba(0, 0, 0, 0.06),
            0 1px 4px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(10px);
        }

        .message-input__container:focus-within {
          border-color: var(--chat-primary-color, #2563eb);
          box-shadow:
            0 0 0 4px rgba(37, 99, 235, 0.12),
            0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .message-input--disconnected .message-input__container {
          border-color: #dc3545;
          background: #f8f9fa;
          opacity: 0.7;
        }

        .message-input--disabled .message-input__container {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .message-input--error .message-input__container {
          border-color: #dc3545;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
        }

        .message-input__media-upload {
          margin-bottom: 16px;
        }

        .message-input__attachments {
          margin-bottom: 12px;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }

        .message-input__attachments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8f9fa;
          border-bottom: 1px solid #e1e5e9;
        }

        .message-input__attachments-count {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        .message-input__clear-attachments {
          font-size: 11px;
          color: #dc3545;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 200ms ease;
        }

        .message-input__clear-attachments:hover {
          background: #ffe6e6;
        }

        .message-input__attachments-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .message-input__attachment {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: white;
          transition: background-color 200ms ease;
        }

        .message-input__attachment:hover {
          background: #f8f9fa;
        }

        .message-input__attachment-icon {
          flex-shrink: 0;
          font-size: 16px;
        }

        .message-input__attachment-name {
          flex: 1;
          min-width: 0;
          font-size: 12px;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .message-input__remove-attachment {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: #f1f3f4;
          color: #6c757d;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          transition: all 200ms ease;
        }

        .message-input__remove-attachment:hover {
          background: #dc3545;
          color: white;
        }

        .message-input__file-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          color: #666;
          cursor: pointer;
          border-radius: 50%;
          transition: all 200ms ease;
          flex-shrink: 0;
        }

        .message-input__file-btn:hover:not(:disabled) {
          background: rgba(0, 123, 255, 0.1);
          color: var(--chat-primary-color, #007bff);
        }

        .message-input__file-btn--active {
          background: var(--chat-primary-color, #007bff);
          color: white;
        }

        .message-input__file-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .message-input__text-container {
          flex: 1;
          position: relative;
          min-width: 0;
        }

        .message-input__textarea {
          width: 100%;
          border: none;
          background: transparent;
          resize: none;
          outline: none;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.5;
          font-weight: 400;
          letter-spacing: -0.01em;
          color: #1a202c;
          padding: 6px 0;
          max-height: 120px;
          overflow-y: auto;
        }

        .message-input__textarea::placeholder {
          color: #999;
        }

        .message-input__textarea:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .message-input__counter {
          position: absolute;
          bottom: -18px;
          right: 0;
          font-size: 10px;
          color: #666;
          background: white;
          padding: 2px 4px;
          border-radius: 4px;
          border: 1px solid #e1e5e9;
        }

        .message-input__counter--over {
          color: #dc3545;
          border-color: #dc3545;
          background: #fff5f5;
        }

        .message-input__send-btn {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border: none;
          background: linear-gradient(
            135deg,
            var(--chat-primary-color, #2563eb) 0%,
            #3b82f6 100%
          );
          color: white;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(1);
          box-shadow:
            0 5px 16px rgba(37, 99, 235, 0.3),
            0 3px 8px rgba(37, 99, 235, 0.2);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
        }

        .message-input__send-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: scale(1.05) translateY(-1px);
          box-shadow:
            0 6px 16px rgba(37, 99, 235, 0.35),
            0 3px 8px rgba(37, 99, 235, 0.2);
        }

        .message-input__send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .message-input__send-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: scale(1);
          opacity: 0.6;
        }

        /* Expanded state */
        .message-input--expanded .message-input__container {
          border-radius: 16px;
          padding: 12px;
        }

        .message-input--expanded .message-input__text-container {
          margin: 4px 0;
        }

        /* Dark theme */
        .chat-window--dark .message-input {
          background: #2d3748;
        }

        .chat-window--dark .message-input__container {
          background: #4a5568;
          border-color: #718096;
        }

        .chat-window--dark .message-input__container:focus-within {
          border-color: var(--chat-primary-color, #007bff);
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
        }

        .chat-window--dark .message-input__textarea {
          color: #e2e8f0;
        }

        .chat-window--dark .message-input__textarea::placeholder {
          color: #a0aec0;
        }

        .chat-window--dark .message-input__file-btn {
          color: #a0aec0;
        }

        .chat-window--dark .message-input__file-btn:hover {
          background: rgba(0, 123, 255, 0.2);
          color: var(--chat-primary-color, #007bff);
        }

        .chat-window--dark .message-input__counter {
          background: #2d3748;
          color: #a0aec0;
          border-color: #4a5568;
        }

        .chat-window--dark .message-input__error {
          background: #742a2a;
          color: #feb2b2;
          border-color: #9c4221;
        }

        .chat-window--dark .message-input__attachments {
          border-color: #4a5568;
          background: #2d3748;
        }

        .chat-window--dark .message-input__attachments-header {
          background: #374151;
          border-bottom-color: #4a5568;
        }

        .chat-window--dark .message-input__attachments-count {
          color: #e2e8f0;
        }

        .chat-window--dark .message-input__attachment {
          background: #2d3748;
        }

        .chat-window--dark .message-input__attachment:hover {
          background: #374151;
        }

        .chat-window--dark .message-input__attachment-name {
          color: #e2e8f0;
        }

        .chat-window--dark .message-input__remove-attachment {
          background: #4a5568;
          color: #a0aec0;
        }

        /* Mobile adjustments */
        @media (max-width: 480px) {
          .message-input {
            padding: 12px;
          }

          .message-input__container {
            padding: 6px 10px;
          }

          .message-input__textarea {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }

        /* Scrollbar for textarea */
        .message-input__textarea::-webkit-scrollbar {
          width: 4px;
        }

        .message-input__textarea::-webkit-scrollbar-track {
          background: transparent;
        }

        .message-input__textarea::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .message-input__container,
          .message-input__file-btn,
          .message-input__send-btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};
