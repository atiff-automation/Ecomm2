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
      createChat({
        webhookUrl: config.webhookUrl,
        mode: 'window',
        showWelcomeScreen: false,
        initialMessages: [
          'Hi there! 👋',
          'My name is Nathan. How can I assist you today?'
        ],
        i18n: {
          en: {
            title: 'Hi there! 👋',
            subtitle: 'Start a chat. We\'re here to help you 24/7.',
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
    }).catch(err => {
      console.error('❌ Failed to load @n8n/chat:', err);
    });
  }, [config]);

  return null;
}
