'use client';

import { useEffect, useState } from 'react';
import '@n8n/chat/style.css';

export function SimpleN8nChatLoader() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Load config from API
    fetch('/api/chat-config/public')
      .then(res => res.json())
      .then(data => {
        console.log('📡 Chat config loaded:', data);
        if (data.isEnabled && data.webhookUrl) {
          setConfig(data);
        }
      })
      .catch(err => console.error('❌ Failed to load chat config:', err));
  }, []);

  useEffect(() => {
    if (!config) return;

    console.log('🚀 Initializing n8n chat with webhook:', config.webhookUrl);

    // Import and initialize using the installed package
    import('@n8n/chat').then(({ createChat }) => {
      console.log('📦 @n8n/chat loaded, creating chat with config:', {
        webhookUrl: config.webhookUrl,
        mode: 'window'
      });

      createChat({
        webhookUrl: config.webhookUrl,
        mode: 'window',
        showWelcomeScreen: false,
        initialMessages: config.welcomeMessage.split('\n'),
        i18n: {
          en: {
            title: config.title,
            subtitle: config.subtitle,
            footer: '',
            getStarted: 'New Conversation',
            inputPlaceholder: config.inputPlaceholder,
          }
        },
        chatInputKey: 'chatInput',
        chatSessionKey: 'sessionId',
        loadPreviousSession: false,
        defaultLanguage: 'en',
        target: '#n8n-chat'
      });

      console.log('✅ n8n chat initialized');

      // Inject dynamic CSS for colors and styling
      const styleElement = document.createElement('style');
      styleElement.id = 'n8n-chat-custom-styles';
      styleElement.textContent = `
        /* ===== VARIABLES ===== */
        :root {
          --chat--color-primary: ${config.primaryColor};
          --chat--color-primary-shade-50: ${adjustColor(config.primaryColor, -10)};
          --chat--color-primary-shade-100: ${adjustColor(config.primaryColor, -20)};
          --chat--header--background: ${config.primaryColor};
        }

        /* ===== FONT IMPORT ===== */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* ===== BASE STYLES ===== */
        [class*="chat-window"],
        [class*="ChatWindow"] {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
          max-width: 400px !important;
          max-height: 600px !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* ===== HEADER ===== */
        [class*="chat-header"],
        [class*="ChatHeader"] {
          background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-primary-shade-50) 100%) !important;
          padding: 20px !important;
          border-radius: 16px 16px 0 0 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          flex-shrink: 0 !important;
          min-height: auto !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
        }

        /* Avatar styling with enhanced size */
        .bot-avatar {
          width: 50px !important;
          height: 50px !important;
          border-radius: 50% !important;
          border: 3px solid rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          object-fit: cover !important;
          flex-shrink: 0 !important;
          position: static !important;
          transform: none !important;
          animation: avatarPulse 3s ease-in-out infinite !important;
        }

        /* Header text container */
        [class*="chat-heading"],
        [class*="ChatHeading"] {
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
          flex: 1 !important;
          min-width: 0 !important;
        }

        /* ===== TYPOGRAPHY ===== */
        [class*="chat-heading"] h1,
        [class*="chat-heading"] [class*="title"],
        [class*="ChatHeading"] h1,
        [class*="ChatHeading"] [class*="title"] {
          font-size: 18px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          letter-spacing: -0.02em !important;
          margin: 0 !important;
          color: white !important;
        }

        [class*="chat-header"] p,
        [class*="chat-header"] [class*="subtitle"],
        [class*="ChatHeader"] p,
        [class*="ChatHeader"] [class*="subtitle"] {
          font-size: 14px !important;
          font-weight: 400 !important;
          line-height: 1.4 !important;
          opacity: 0.9 !important;
          margin: 0 !important;
          color: white !important;
        }

        /* ===== MESSAGES ===== */
        [class*="chat-body"],
        [class*="ChatBody"] {
          padding: 16px !important;
          flex: 1 !important;
          overflow-y: auto !important;
          min-height: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        [class*="chat-messages-list"],
        [class*="ChatMessagesList"] {
          display: flex !important;
          flex-direction: column !important;
          gap: 16px !important;
        }

        [class*="chat-message"],
        [class*="ChatMessage"] {
          font-size: 15px !important;
          line-height: 1.6 !important;
          padding: 12px 14px !important;
          border-radius: 16px !important;
          max-width: 75% !important;
          word-wrap: break-word !important;
          animation: slideInMessage 0.3s ease-out !important;
          transition: transform 0.2s ease !important;
        }

        [class*="chat-message"]:hover,
        [class*="ChatMessage"]:hover {
          transform: translateY(-1px) !important;
        }

        /* Bot messages with softer background */
        [class*="chat-message-from-bot"],
        [class*="ChatMessageFromBot"] {
          background-color: #F7F8FA !important;
          color: #1f2937 !important;
          border-radius: 16px 16px 16px 4px !important;
          align-self: flex-start !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        }

        /* User messages */
        [class*="chat-message-from-user"],
        [class*="ChatMessageFromUser"] {
          background-color: var(--chat--color-primary) !important;
          color: white !important;
          font-weight: 500 !important;
          border-radius: 16px 16px 4px 16px !important;
          align-self: flex-end !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }

        [class*="chat-message-markdown"],
        [class*="ChatMessageMarkdown"] {
          margin: 0 !important;
        }

        [class*="chat-message-markdown"] p,
        [class*="ChatMessageMarkdown"] p {
          margin: 0 !important;
          line-height: 1.6 !important;
        }

        /* ===== INPUT/FOOTER ===== */
        [class*="chat-footer"],
        [class*="ChatFooter"],
        [class*="chat-input-container"],
        [class*="ChatInputContainer"] {
          padding: 16px !important;
          background: white !important;
          border-top: 1px solid #e5e7eb !important;
          flex-shrink: 0 !important;
          min-height: auto !important;
        }

        [class*="chat-input"],
        [class*="ChatInput"] input,
        [class*="ChatInput"] textarea {
          border: 1px solid #e5e7eb !important;
          border-radius: 28px !important;
          background: #f9fafb !important;
          padding: 14px 20px !important;
          font-size: 15px !important;
          line-height: 1.5 !important;
          min-height: 52px !important;
          transition: all 0.2s ease !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        [class*="chat-input"]:focus,
        [class*="ChatInput"] input:focus,
        [class*="ChatInput"] textarea:focus {
          border-color: var(--chat--color-primary) !important;
          background: white !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
          outline: none !important;
        }

        [class*="chat-input"]::placeholder,
        [class*="ChatInput"] input::placeholder,
        [class*="ChatInput"] textarea::placeholder {
          font-size: 14px !important;
          opacity: 0.6 !important;
        }

        /* Send button */
        [class*="chat-input-send-button"],
        [class*="ChatInputSendButton"] {
          background: var(--chat--color-primary) !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
        }

        [class*="chat-input-send-button"]:hover,
        [class*="ChatInputSendButton"]:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
        }

        /* ===== ANIMATIONS ===== */
        @keyframes slideInMessage {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes avatarPulse {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          50% {
            box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
          }
        }

        /* Typing indicator */
        [class*="typing-indicator"],
        [class*="TypingIndicator"] {
          display: flex !important;
          gap: 6px !important;
          padding: 12px 16px !important;
          background: #F7F8FA !important;
          border-radius: 18px !important;
          width: fit-content !important;
        }

        [class*="typing-indicator"] span,
        [class*="TypingIndicator"] span {
          width: 8px !important;
          height: 8px !important;
          background: #9ca3af !important;
          border-radius: 50% !important;
          animation: typingDot 1.4s infinite !important;
        }

        [class*="typing-indicator"] span:nth-child(2),
        [class*="TypingIndicator"] span:nth-child(2) {
          animation-delay: 0.2s !important;
        }

        [class*="typing-indicator"] span:nth-child(3),
        [class*="TypingIndicator"] span:nth-child(3) {
          animation-delay: 0.4s !important;
        }

        @keyframes typingDot {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* ===== SCROLLBAR ===== */
        [class*="chat-messages"]::-webkit-scrollbar,
        [class*="ChatMessages"]::-webkit-scrollbar {
          width: 6px !important;
        }

        [class*="chat-messages"]::-webkit-scrollbar-track,
        [class*="ChatMessages"]::-webkit-scrollbar-track {
          background: transparent !important;
        }

        [class*="chat-messages"]::-webkit-scrollbar-thumb,
        [class*="ChatMessages"]::-webkit-scrollbar-thumb {
          background: #d1d5db !important;
          border-radius: 3px !important;
        }

        [class*="chat-messages"]::-webkit-scrollbar-thumb:hover,
        [class*="ChatMessages"]::-webkit-scrollbar-thumb:hover {
          background: #9ca3af !important;
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 480px) {
          [class*="chat-window"],
          [class*="ChatWindow"] {
            max-width: 100vw !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }

          [class*="chat-header"],
          [class*="ChatHeader"] {
            padding: 16px !important;
            border-radius: 0 !important;
            gap: 10px !important;
          }

          .bot-avatar {
            width: 44px !important;
            height: 44px !important;
          }

          [class*="chat-heading"] h1,
          [class*="chat-heading"] [class*="title"],
          [class*="ChatHeading"] h1,
          [class*="ChatHeading"] [class*="title"] {
            font-size: 16px !important;
          }

          [class*="chat-header"] p,
          [class*="chat-header"] [class*="subtitle"],
          [class*="ChatHeader"] p,
          [class*="ChatHeader"] [class*="subtitle"] {
            font-size: 13px !important;
          }

          [class*="chat-message"],
          [class*="ChatMessage"] {
            font-size: 14px !important;
            max-width: 80% !important;
          }

          [class*="chat-input"],
          [class*="ChatInput"] input,
          [class*="ChatInput"] textarea {
            font-size: 14px !important;
            min-height: 48px !important;
          }
        }

        /* ===== ACCESSIBILITY ===== */
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
          outline: 2px solid var(--chat--color-primary) !important;
          outline-offset: 2px !important;
        }

        button:focus,
        input:focus,
        textarea:focus {
          outline: none !important;
        }

        /* Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
      document.head.appendChild(styleElement);

      // Inject bot avatar if configured
      if (config.botAvatarUrl) {
        const observer = new MutationObserver(() => {
          const chatHeader = document.querySelector('[class*="chat-header"]');
          if (chatHeader && !chatHeader.querySelector('.bot-avatar')) {
            // Convert header to flexbox layout
            chatHeader.style.display = 'flex';
            chatHeader.style.alignItems = 'center';
            chatHeader.style.gap = '12px';
            chatHeader.style.padding = '20px';

            // Create avatar element
            const avatar = document.createElement('img');
            avatar.src = config.botAvatarUrl;
            avatar.alt = 'Chat Bot';
            avatar.className = 'bot-avatar';
            // No inline positioning styles - let CSS handle it

            // Create text container for title and subtitle
            const textContainer = chatHeader.querySelector('[class*="chat-heading"]');
            if (textContainer) {
              textContainer.style.flex = '1';
              textContainer.style.minWidth = '0';
            }

            chatHeader.prepend(avatar);
            observer.disconnect();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Cleanup on unmount
        return () => {
          observer.disconnect();
          const styleEl = document.getElementById('n8n-chat-custom-styles');
          if (styleEl) styleEl.remove();
        };
      }
    }).catch(err => {
      console.error('❌ Failed to load @n8n/chat:', err);
    });
  }, [config]);

  // Color adjustment helper function
  const adjustColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  };

  return <div id="n8n-chat" />;
}
