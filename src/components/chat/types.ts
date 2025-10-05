/**
 * Chat System Type Definitions - Minimal for n8n Integration
 * Only types needed for ChatBubble component compatibility
 */

export interface ChatConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  maxMessageLength: number;
  enableFileUpload: boolean;
  enableTypingIndicator: boolean;
  enableSound: boolean;
  autoExpand: boolean;
  showTimestamp: boolean;
  placeholder: string;
  welcomeMessage?: string;
}
