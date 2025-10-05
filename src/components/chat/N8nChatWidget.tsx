'use client';

import { createChat } from '@n8n/chat';
import { useEffect, useRef, useState } from 'react';
import { ChatBubble } from './ChatBubble';

interface ChatConfig {
  webhookUrl: string;
  isEnabled: boolean;
  position: string;
  primaryColor: string;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  inputPlaceholder: string;
}

interface N8nChatWidgetProps {
  config?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    primaryColor?: string;
    enableSound?: boolean;
    enableTypingIndicator?: boolean;
  };
}

export function N8nChatWidget({ config: propConfig }: N8nChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<any>(null);

  // Load chat configuration from database
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/chat-config/public');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Failed to load chat config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current || chatInstanceRef.current || !config?.webhookUrl) return;

    // Split welcome message by \n for initial messages
    const initialMessages = config.welcomeMessage.split('\\n').filter(Boolean);

    // Initialize n8n chat with database configuration
    chatInstanceRef.current = createChat({
      webhookUrl: config.webhookUrl,
      mode: 'window',
      chatInputKey: 'chatInput',
      chatSessionKey: 'sessionId',
      defaultLanguage: 'en',
      initialMessages,
      i18n: {
        en: {
          title: config.title,
          subtitle: config.subtitle,
          footer: '',
          getStarted: 'New Conversation',
          inputPlaceholder: config.inputPlaceholder,
        },
      },
    });

    chatInstanceRef.current.mount(chatContainerRef.current);

    // Cleanup on unmount
    return () => {
      if (chatInstanceRef.current) {
        chatInstanceRef.current.unmount();
        chatInstanceRef.current = null;
      }
    };
  }, [isOpen, config]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Don't render if chat is disabled, still loading, or no webhook URL configured
  if (isLoading || !config?.isEnabled || !config?.webhookUrl) {
    return null;
  }

  const position = (propConfig?.position || config.position || 'bottom-right') as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  const primaryColor = propConfig?.primaryColor || config.primaryColor || '#2563eb';

  return (
    <>
      {/* Reuse existing ChatBubble as toggle button */}
      <ChatBubble
        isExpanded={isOpen}
        isConnected={true}
        hasUnreadMessages={false}
        config={{
          position,
          primaryColor,
          theme: 'light',
          maxMessageLength: 1000,
          enableFileUpload: false,
          enableTypingIndicator: propConfig?.enableTypingIndicator ?? true,
          enableSound: propConfig?.enableSound ?? false,
          autoExpand: false,
          showTimestamp: true,
          placeholder: config.inputPlaceholder,
        }}
        onClick={handleToggle}
      />

      {/* n8n Chat Container */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="n8n-chat-container"
          style={{
            position: 'fixed',
            [position.includes('right') ? 'right' : 'left']: '24px',
            [position.includes('bottom') ? 'bottom' : 'top']: '90px',
            width: '400px',
            height: '600px',
            zIndex: 1000,
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        />
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .n8n-chat-container {
            width: calc(100vw - 32px) !important;
            height: calc(100vh - 120px) !important;
            max-width: 380px;
            max-height: 600px;
          }
        }

        @media (max-width: 480px) {
          .n8n-chat-container {
            width: calc(100vw - 16px) !important;
            height: calc(100vh - 100px) !important;
            right: 8px !important;
            left: 8px !important;
            bottom: 70px !important;
          }
        }
      `}</style>
    </>
  );
}
