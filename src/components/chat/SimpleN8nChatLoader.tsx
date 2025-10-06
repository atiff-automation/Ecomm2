'use client';

import { useEffect, useState } from 'react';

export function SimpleN8nChatLoader() {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load config from API
    fetch('/api/chat-config/public')
      .then(res => res.json())
      .then(config => {
        console.log('📡 Chat config loaded:', config);
        if (config.isEnabled && config.webhookUrl) {
          setWebhookUrl(config.webhookUrl);
          setIsEnabled(true);
        }
      })
      .catch(err => console.error('❌ Failed to load chat config:', err));
  }, []);

  useEffect(() => {
    if (!isEnabled || !webhookUrl) return;

    console.log('🚀 Initializing n8n chat with webhook:', webhookUrl);

    // Load CSS
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load and initialize chat - exactly as per official docs
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

      createChat({
        webhookUrl: '${webhookUrl}',
        mode: 'window',
        showWelcomeScreen: false,
        initialMessages: [
          'Hi there! 👋',
          'My name is Nathan. How can I assist you today?'
        ],
        i18n: {
          en: {
            title: 'Hi there! 👋',
            subtitle: 'Start a chat. We\\'re here to help you 24/7.',
            footer: '',
            getStarted: 'New Conversation',
            inputPlaceholder: 'Type your question..',
          }
        },
        chatInputKey: 'chatInput',
        chatSessionKey: 'sessionId',
        loadPreviousSession: true,
        defaultLanguage: 'en'
      });

      console.log('✅ n8n chat initialized');
    `;
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, [isEnabled, webhookUrl]);

  return null;
}
