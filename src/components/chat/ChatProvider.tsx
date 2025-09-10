'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { chatApi, ChatApiError } from './utils/api-client';
import { chatStorage } from './utils/storage';
import { chatValidation } from './utils/validation';
import { chatUtils } from './utils/chat-utils';
import type { 
  ChatConfig, 
  ChatMessage, 
  ChatSession, 
  QuickReply,
  CreateSessionResponse 
} from './types';
import { DEFAULT_CHAT_CONFIG } from './types';

// State Types
interface ChatState {
  // Session
  session: ChatSession | null;
  isSessionLoading: boolean;
  sessionError: string | null;

  // Messages
  messages: ChatMessage[];
  isMessagesLoading: boolean;
  messagesError: string | null;

  // UI State
  isOpen: boolean;
  isMinimized: boolean;
  hasUnreadMessages: boolean;
  
  // Connection
  isConnected: boolean;
  connectionError: string | null;
  
  // Typing indicators
  isTyping: boolean;
  isUserTyping: boolean;
  
  // Configuration
  config: ChatConfig;
}

// Action Types
type ChatAction = 
  | { type: 'SET_SESSION'; payload: ChatSession | null }
  | { type: 'SET_SESSION_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_ERROR'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_MESSAGES_LOADING'; payload: boolean }
  | { type: 'SET_MESSAGES_ERROR'; payload: string | null }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'SET_MINIMIZED'; payload: boolean }
  | { type: 'SET_UNREAD_MESSAGES'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CONNECTION_ERROR'; payload: string | null }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_USER_TYPING'; payload: boolean }
  | { type: 'UPDATE_USER_PRESENCE'; payload: { status: 'online' | 'offline' | 'away'; lastSeen?: string } }
  | { type: 'UPDATE_CONFIG'; payload: Partial<ChatConfig> }
  | { type: 'RESET_CHAT' };

// Context Types
interface ChatContextValue {
  // State
  state: ChatState;
  
  // Session actions
  createSession: (email?: string) => Promise<void>;
  loadSession: () => Promise<void>;
  clearSession: () => void;
  
  // Message actions
  sendMessage: (content: string, messageType?: ChatMessage['messageType']) => Promise<void>;
  sendQuickReply: (reply: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  
  // UI actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  markAsRead: () => void;
  
  // Configuration
  updateConfig: (config: Partial<ChatConfig>) => void;
  
  // WebSocket actions
  sendTyping: (isTyping: boolean) => void;
  sendPresenceUpdate: (status: 'online' | 'away') => void;
  markMessageAsRead: (messageId: string) => void;
  
  // Utilities
  isSessionExpired: () => boolean;
}

// Initial State
const initialState: ChatState = {
  session: null,
  isSessionLoading: false,
  sessionError: null,
  
  messages: [],
  isMessagesLoading: false,
  messagesError: null,
  
  isOpen: false,
  isMinimized: false,
  hasUnreadMessages: false,
  
  isConnected: true, // Optimistically start as connected
  connectionError: null,
  
  isTyping: false,
  isUserTyping: false,
  
  config: DEFAULT_CHAT_CONFIG
};

// Reducer
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_SESSION':
      return { 
        ...state, 
        session: action.payload,
        sessionError: null 
      };
    
    case 'SET_SESSION_LOADING':
      return { 
        ...state, 
        isSessionLoading: action.payload,
        sessionError: action.payload ? null : state.sessionError
      };
    
    case 'SET_SESSION_ERROR':
      return { 
        ...state, 
        sessionError: action.payload,
        isSessionLoading: false
      };
    
    case 'SET_MESSAGES':
      return { 
        ...state, 
        messages: action.payload,
        messagesError: null
      };
    
    case 'ADD_MESSAGE':
      // Check for duplicate messages
      const existingMessageIndex = state.messages.findIndex(m => m.id === action.payload.id);
      if (existingMessageIndex >= 0) {
        // Update existing message
        const updatedMessages = [...state.messages];
        updatedMessages[existingMessageIndex] = action.payload;
        return { ...state, messages: updatedMessages };
      }
      
      // Add new message
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        hasUnreadMessages: !state.isOpen && chatUtils.isBotMessage(action.payload)
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id 
            ? { ...msg, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : msg
        )
      };
    
    case 'SET_MESSAGES_LOADING':
      return { 
        ...state, 
        isMessagesLoading: action.payload,
        messagesError: action.payload ? null : state.messagesError
      };
    
    case 'SET_MESSAGES_ERROR':
      return { 
        ...state, 
        messagesError: action.payload,
        isMessagesLoading: false
      };
    
    case 'TOGGLE_CHAT':
      const newIsOpen = !state.isOpen;
      return { 
        ...state, 
        isOpen: newIsOpen,
        hasUnreadMessages: newIsOpen ? false : state.hasUnreadMessages
      };
    
    case 'OPEN_CHAT':
      return { 
        ...state, 
        isOpen: true,
        hasUnreadMessages: false
      };
    
    case 'CLOSE_CHAT':
      return { 
        ...state, 
        isOpen: false
      };
    
    case 'SET_MINIMIZED':
      return { 
        ...state, 
        isMinimized: action.payload
      };
    
    case 'SET_UNREAD_MESSAGES':
      return { 
        ...state, 
        hasUnreadMessages: action.payload
      };
    
    case 'SET_CONNECTED':
      return { 
        ...state, 
        isConnected: action.payload,
        connectionError: action.payload ? null : state.connectionError
      };
    
    case 'SET_CONNECTION_ERROR':
      return { 
        ...state, 
        connectionError: action.payload,
        isConnected: !action.payload
      };
    
    case 'SET_TYPING':
      return { 
        ...state, 
        isTyping: action.payload
      };
    
    case 'SET_USER_TYPING':
      return { 
        ...state, 
        isUserTyping: action.payload
      };
    
    case 'UPDATE_USER_PRESENCE':
      // For now, we'll just log presence updates
      // In a multi-user chat, this would update user presence state
      console.log('User presence updated:', action.payload);
      return state;
    
    case 'UPDATE_CONFIG':
      const newConfig = { ...state.config, ...action.payload };
      return { 
        ...state, 
        config: chatValidation.sanitizeConfig(newConfig)
      };
    
    case 'RESET_CHAT':
      return {
        ...initialState,
        config: state.config // Preserve configuration
      };
    
    default:
      return state;
  }
};

// Context
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// Provider Props
interface ChatProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<ChatConfig>;
}

// Provider Component
export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children, 
  initialConfig 
}) => {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    config: chatValidation.sanitizeConfig({ 
      ...DEFAULT_CHAT_CONFIG, 
      ...initialConfig 
    })
  });

  // WebSocket will be initialized in useChat hook to avoid circular dependency

  // Initialize from storage on mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Load saved session
        const savedSession = chatStorage.getSession();
        if (savedSession && !chatUtils.isSessionExpired(savedSession.expiresAt)) {
          dispatch({ type: 'SET_SESSION', payload: savedSession });
          
          // Load saved messages
          const savedMessages = chatStorage.getMessages(savedSession.id);
          dispatch({ type: 'SET_MESSAGES', payload: savedMessages });
        }

        // Load saved config
        const savedConfig = chatStorage.getConfig();
        if (savedConfig) {
          dispatch({ type: 'UPDATE_CONFIG', payload: savedConfig });
        }

        // Check connection health
        await checkConnection();
      } catch (error) {
        console.warn('Failed to initialize chat:', error);
      }
    };

    initializeChat();
  }, []);

  // Auto-save session and messages
  useEffect(() => {
    if (state.session) {
      chatStorage.saveSession(state.session);
      chatStorage.saveMessages(state.session.id, state.messages);
    }
  }, [state.session, state.messages]);

  // Auto-save config
  useEffect(() => {
    chatStorage.saveConfig(state.config);
  }, [state.config]);

  // Connection health check
  const checkConnection = useCallback(async () => {
    try {
      const response = await chatApi.getHealthStatus();
      if (response.success) {
        dispatch({ type: 'SET_CONNECTED', payload: true });
      } else {
        dispatch({ type: 'SET_CONNECTION_ERROR', payload: 'Service unavailable' });
      }
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: 'Connection failed' });
    }
  }, []);

  // Session management
  const createSession = useCallback(async (guestEmail?: string) => {
    dispatch({ type: 'SET_SESSION_LOADING', payload: true });
    
    try {
      const response = await chatApi.createSession({
        guestEmail,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });

      if (response.success && response.data) {
        const session: ChatSession = {
          id: response.data.sessionId,
          status: 'active' as ChatSession['status'],
          expiresAt: response.data.expiresAt,
          createdAt: new Date().toISOString(),
          metadata: {}
        };
        
        dispatch({ type: 'SET_SESSION', payload: session });
        
        // Clear any existing messages when creating new session
        dispatch({ type: 'SET_MESSAGES', payload: [] });
        
        return;
      }

      throw new Error(response.error?.message || 'Failed to create session');
    } catch (error) {
      const errorMessage = error instanceof ChatApiError 
        ? error.message 
        : 'Failed to create session';
      dispatch({ type: 'SET_SESSION_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    }
  }, []);

  const loadSession = useCallback(async () => {
    if (!state.session?.id) return;
    
    dispatch({ type: 'SET_SESSION_LOADING', payload: true });
    
    try {
      const response = await chatApi.getSession({ sessionId: state.session.id });
      
      if (response.success && response.data) {
        const session: ChatSession = {
          id: response.data.sessionId,
          status: 'active' as ChatSession['status'],
          expiresAt: response.data.expiresAt,
          createdAt: new Date().toISOString(),
          metadata: {}
        };
        
        dispatch({ type: 'SET_SESSION', payload: session });
        
        // Load messages if available
        if (response.data.messages) {
          dispatch({ type: 'SET_MESSAGES', payload: response.data.messages });
        }
        
        return;
      }

      throw new Error(response.error?.message || 'Failed to load session');
    } catch (error) {
      const errorMessage = error instanceof ChatApiError 
        ? error.message 
        : 'Failed to load session';
      dispatch({ type: 'SET_SESSION_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    }
  }, [state.session?.id]);

  const clearSession = useCallback(() => {
    chatStorage.clearSession();
    dispatch({ type: 'RESET_CHAT' });
  }, []);

  // Message management
  const sendMessage = useCallback(async (
    content: string, 
    messageType: 'text' | 'quick_reply' = 'text'
  ) => {
    if (!state.session?.id) {
      throw new Error('No active session');
    }

    // Validate message
    const validation = chatValidation.validateMessage(content, {
      maxLength: state.config.maxMessageLength,
      allowEmpty: false,
      sanitize: true
    });

    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid message');
    }

    // Create optimistic message
    const optimisticMessage = chatUtils.createOptimisticMessage(
      state.session.id,
      content,
      messageType
    );

    // Add optimistic message to UI
    dispatch({ type: 'ADD_MESSAGE', payload: optimisticMessage });

    // Stop typing indicator if WebSocket is connected
    // WebSocket typing will be handled in useChat hook

    try {
      const response = await chatApi.sendMessage({
        sessionId: state.session.id,
        content: chatValidation.sanitizeMessage(content),
        messageType,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

      if (response.success && response.data) {
        // Update optimistic message with server response
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { 
            id: optimisticMessage.id,
            updates: {
              id: response.data.messageId,
              status: 'sent' as const,
              createdAt: response.data.createdAt
            }
          }
        });

        // Handle bot response if included
        if (response.data.botMessage) {
          dispatch({ type: 'ADD_MESSAGE', payload: response.data.botMessage });
          
          // Play notification sound
          if (state.config.enableSound) {
            chatUtils.playNotificationSound(state.config);
          }
        }

        return;
      }

      throw new Error(response.error?.message || 'Failed to send message');
    } catch (error) {
      // Mark optimistic message as failed
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: optimisticMessage.id,
          updates: { status: 'failed' as const }
        }
      });
      
      const errorMessage = error instanceof ChatApiError 
        ? error.message 
        : 'Failed to send message';
      dispatch({ type: 'SET_MESSAGES_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  }, [state.session?.id, state.config]);

  const sendQuickReply = useCallback(async (reply: string) => {
    return sendMessage(reply, 'quick_reply');
  }, [sendMessage]);

  const loadMessages = useCallback(async () => {
    if (!state.session?.id) return;
    
    dispatch({ type: 'SET_MESSAGES_LOADING', payload: true });
    
    try {
      const response = await chatApi.getMessages({
        sessionId: state.session.id,
        limit: 50
      });

      if (response.success && response.data) {
        dispatch({ type: 'SET_MESSAGES', payload: response.data.messages });
        return;
      }

      throw new Error(response.error?.message || 'Failed to load messages');
    } catch (error) {
      const errorMessage = error instanceof ChatApiError 
        ? error.message 
        : 'Failed to load messages';
      dispatch({ type: 'SET_MESSAGES_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: false });
    }
  }, [state.session?.id]);

  // UI actions
  const openChat = useCallback(() => {
    dispatch({ type: 'OPEN_CHAT' });
  }, []);

  const closeChat = useCallback(() => {
    dispatch({ type: 'CLOSE_CHAT' });
  }, []);

  const toggleChat = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAT' });
  }, []);

  const markAsRead = useCallback(() => {
    dispatch({ type: 'SET_UNREAD_MESSAGES', payload: false });
  }, []);

  // Configuration
  const updateConfig = useCallback((config: Partial<ChatConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: config });
  }, []);

  // WebSocket actions
  const sendTyping = useCallback((isTyping: boolean) => {
    // WebSocket typing will be handled in useChat hook
    dispatch({ type: 'SET_USER_TYPING', payload: isTyping });
  }, []);

  const sendPresenceUpdate = useCallback((status: 'online' | 'away') => {
    // WebSocket presence will be handled in useChat hook
    console.log('Presence update:', status);
  }, []);

  const markMessageAsRead = useCallback((messageId: string) => {
    // WebSocket read receipts will be handled in useChat hook
    console.log('Mark message as read:', messageId);
  }, []);

  // Utilities
  const isSessionExpired = useCallback(() => {
    return chatUtils.isSessionExpired(state.session?.expiresAt);
  }, [state.session?.expiresAt]);

  // Context value
  const contextValue: ChatContextValue = {
    state,
    createSession,
    loadSession,
    clearSession,
    sendMessage,
    sendQuickReply,
    loadMessages,
    openChat,
    closeChat,
    toggleChat,
    markAsRead,
    updateConfig,
    sendTyping,
    sendPresenceUpdate,
    markMessageAsRead,
    isSessionExpired
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};