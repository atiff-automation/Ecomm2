/**
 * Chat System Component Exports
 * Centralized export file for all chat components
 */

// Main components
export { ChatWidget } from './ChatWidget';
export { ChatBubble } from './ChatBubble';
export { ChatWindow } from './ChatWindow';
export { MessageList } from './MessageList';
export { MessageItem } from './MessageItem';
export { MessageInput } from './MessageInput';
export { TypingIndicator } from './TypingIndicator';
export { ConnectionStatus } from './ConnectionStatus';
export { QuickReply } from './QuickReply';
export { RichContent } from './RichContent';
export { MediaUpload } from './MediaUpload';

// Context and providers
export { ChatProvider } from './ChatProvider';
export { useChatContext } from './ChatProvider';

// Hooks
export { useChat } from './hooks/useChat';
export { useWebSocket } from './hooks/useWebSocket';
export { useChatHistory } from './hooks/useChatHistory';
export { usePolling } from './hooks/usePolling';

// Types and constants
export * from './types';

// Utilities
export { chatApi } from './utils/api-client';
export { chatUtils } from './utils/chat-utils';
export { chatStorage } from './utils/storage';
export { chatValidation } from './utils/validation';