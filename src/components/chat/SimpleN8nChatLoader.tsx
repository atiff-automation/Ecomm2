'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import '@n8n/chat/style.css';

export function SimpleN8nChatLoader() {
  const pathname = usePathname();
  const [config, setConfig] = useState<any>(null);

  // Hide chat on admin pages - chat should only be visible on customer-facing pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

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
        :root {
          --chat--color-primary: ${config.primaryColor};
          --chat--color-primary-shade-50: ${adjustColor(config.primaryColor, -10)};
          --chat--color-primary-shade-100: ${adjustColor(config.primaryColor, -20)};
          --chat--header--background: ${config.primaryColor};
        }

        /* Ensure rounded corners for chat window */
        [class*="chat-window"],
        [class*="ChatWindow"] {
          border-radius: 16px !important;
          overflow: hidden !important;
        }

        /* Rounded header */
        [class*="chat-header"],
        [class*="ChatHeader"] {
          border-radius: 16px 16px 0 0 !important;
        }

        /* Rounded message bubbles */
        [class*="chat-message"],
        [class*="ChatMessage"] {
          border-radius: 12px !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Inject bot avatar if configured
      if (config.botAvatarUrl) {
        const observer = new MutationObserver(() => {
          const chatHeader = document.querySelector('[class*="chat-header"]');
          if (chatHeader && !chatHeader.querySelector('.bot-avatar')) {
            const avatar = document.createElement('img');
            avatar.src = config.botAvatarUrl;
            avatar.alt = 'Chat Bot';
            avatar.className = 'bot-avatar';
            avatar.style.cssText = `
              width: 40px;
              height: 40px;
              border-radius: 50%;
              position: absolute;
              left: 12px;
              top: 50%;
              transform: translateY(-50%);
              object-fit: cover;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;

            chatHeader.style.position = 'relative';
            chatHeader.style.paddingLeft = '60px';
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
