/**
 * Chat Storage Utility
 * Centralized storage management for chat data
 */

import type { ChatSession, ChatMessage, ChatConfig } from '../types';

interface StorageItem<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

class ChatStorage {
  private readonly prefix = 'chat_';
  private readonly keys = {
    SESSION: `${this.prefix}session`,
    MESSAGES: `${this.prefix}messages`,
    CONFIG: `${this.prefix}config`,
    DRAFT: `${this.prefix}draft`,
    SETTINGS: `${this.prefix}settings`
  } as const;

  /**
   * Check if storage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set item in storage with optional expiration
   */
  private setItem<T>(key: string, value: T, expirationMs?: number): void {
    if (!this.isStorageAvailable()) return;

    try {
      const item: StorageItem<T> = {
        data: value,
        timestamp: Date.now(),
        expiresAt: expirationMs ? Date.now() + expirationMs : undefined
      };

      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get item from storage
   */
  private getItem<T>(key: string): T | null {
    if (!this.isStorageAvailable()) return null;

    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item: StorageItem<T> = JSON.parse(itemStr);

      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  private removeItem(key: string): void {
    if (!this.isStorageAvailable()) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Save chat session
   */
  saveSession(session: ChatSession): void {
    // Calculate expiration based on session expiresAt
    const expirationMs = session.expiresAt 
      ? new Date(session.expiresAt).getTime() - Date.now()
      : 24 * 60 * 60 * 1000; // 24 hours default

    this.setItem(this.keys.SESSION, session, Math.max(0, expirationMs));
  }

  /**
   * Get saved chat session
   */
  getSession(): ChatSession | null {
    return this.getItem<ChatSession>(this.keys.SESSION);
  }

  /**
   * Remove saved session
   */
  clearSession(): void {
    this.removeItem(this.keys.SESSION);
    this.clearMessages(); // Also clear associated messages
  }

  /**
   * Save messages for a session
   */
  saveMessages(sessionId: string, messages: ChatMessage[]): void {
    const key = `${this.keys.MESSAGES}_${sessionId}`;
    // Messages expire in 24 hours
    this.setItem(key, messages, 24 * 60 * 60 * 1000);
  }

  /**
   * Get saved messages for a session
   */
  getMessages(sessionId: string): ChatMessage[] {
    const key = `${this.keys.MESSAGES}_${sessionId}`;
    return this.getItem<ChatMessage[]>(key) || [];
  }

  /**
   * Add a single message to saved messages
   */
  addMessage(sessionId: string, message: ChatMessage): void {
    const messages = this.getMessages(sessionId);
    
    // Check if message already exists (prevent duplicates)
    const existingIndex = messages.findIndex(m => m.id === message.id);
    
    if (existingIndex >= 0) {
      // Update existing message
      messages[existingIndex] = message;
    } else {
      // Add new message
      messages.push(message);
    }

    // Keep only the last 100 messages to prevent storage bloat
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }

    this.saveMessages(sessionId, messages);
  }

  /**
   * Update message status
   */
  updateMessageStatus(sessionId: string, messageId: string, status: ChatMessage['status']): void {
    const messages = this.getMessages(sessionId);
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex >= 0) {
      messages[messageIndex].status = status;
      messages[messageIndex].updatedAt = new Date().toISOString();
      this.saveMessages(sessionId, messages);
    }
  }

  /**
   * Clear messages for a session
   */
  clearMessages(sessionId?: string): void {
    if (sessionId) {
      const key = `${this.keys.MESSAGES}_${sessionId}`;
      this.removeItem(key);
    } else {
      // Clear all message keys
      if (!this.isStorageAvailable()) return;
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.keys.MESSAGES)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Save chat configuration
   */
  saveConfig(config: ChatConfig): void {
    // Config never expires
    this.setItem(this.keys.CONFIG, config);
  }

  /**
   * Get saved chat configuration
   */
  getConfig(): ChatConfig | null {
    return this.getItem<ChatConfig>(this.keys.CONFIG);
  }

  /**
   * Save draft message
   */
  saveDraft(sessionId: string, content: string): void {
    if (!content.trim()) {
      this.clearDraft(sessionId);
      return;
    }

    const key = `${this.keys.DRAFT}_${sessionId}`;
    // Draft expires in 1 hour
    this.setItem(key, content, 60 * 60 * 1000);
  }

  /**
   * Get saved draft message
   */
  getDraft(sessionId: string): string {
    const key = `${this.keys.DRAFT}_${sessionId}`;
    return this.getItem<string>(key) || '';
  }

  /**
   * Clear draft message
   */
  clearDraft(sessionId: string): void {
    const key = `${this.keys.DRAFT}_${sessionId}`;
    this.removeItem(key);
  }

  /**
   * Save user settings/preferences
   */
  saveSettings(settings: Record<string, any>): void {
    this.setItem(this.keys.SETTINGS, settings);
  }

  /**
   * Get user settings/preferences
   */
  getSettings(): Record<string, any> {
    return this.getItem<Record<string, any>>(this.keys.SETTINGS) || {};
  }

  /**
   * Update specific setting
   */
  updateSetting(key: string, value: any): void {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    isAvailable: boolean;
    totalSize: number;
    chatDataSize: number;
    itemCount: number;
  } {
    if (!this.isStorageAvailable()) {
      return {
        isAvailable: false,
        totalSize: 0,
        chatDataSize: 0,
        itemCount: 0
      };
    }

    let totalSize = 0;
    let chatDataSize = 0;
    let itemCount = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          const size = key.length + value.length;
          totalSize += size;
          
          if (key.startsWith(this.prefix)) {
            chatDataSize += size;
            itemCount++;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate storage size:', error);
    }

    return {
      isAvailable: true,
      totalSize,
      chatDataSize,
      itemCount
    };
  }

  /**
   * Clear all chat data from storage
   */
  clearAll(): void {
    if (!this.isStorageAvailable()) return;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear chat storage:', error);
    }
  }

  /**
   * Clean up expired items
   */
  cleanup(): void {
    if (!this.isStorageAvailable()) return;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            try {
              const item: StorageItem<any> = JSON.parse(itemStr);
              if (item.expiresAt && Date.now() > item.expiresAt) {
                keysToRemove.push(key);
              }
            } catch {
              // If item can't be parsed, it's corrupted - remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired chat storage items`);
      }
    } catch (error) {
      console.warn('Failed to cleanup chat storage:', error);
    }
  }

  /**
   * Export chat data for backup
   */
  exportData(): {
    session: ChatSession | null;
    messages: Record<string, ChatMessage[]>;
    config: ChatConfig | null;
    settings: Record<string, any>;
    exportedAt: string;
  } {
    const session = this.getSession();
    const config = this.getConfig();
    const settings = this.getSettings();
    
    // Get all message data
    const messages: Record<string, ChatMessage[]> = {};
    
    if (this.isStorageAvailable()) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${this.keys.MESSAGES}_`)) {
          const sessionId = key.replace(`${this.keys.MESSAGES}_`, '');
          messages[sessionId] = this.getMessages(sessionId);
        }
      }
    }

    return {
      session,
      messages,
      config,
      settings,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import chat data from backup
   */
  importData(data: ReturnType<typeof this.exportData>): void {
    try {
      if (data.session) {
        this.saveSession(data.session);
      }
      
      if (data.config) {
        this.saveConfig(data.config);
      }
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      // Import messages
      Object.entries(data.messages).forEach(([sessionId, messages]) => {
        this.saveMessages(sessionId, messages);
      });
      
      console.log('Chat data imported successfully');
    } catch (error) {
      console.error('Failed to import chat data:', error);
      throw new Error('Failed to import chat data');
    }
  }
}

// Export singleton instance
export const chatStorage = new ChatStorage();

// Cleanup expired items on initialization
if (typeof window !== 'undefined') {
  // Run cleanup after a short delay to not block initial page load
  setTimeout(() => {
    chatStorage.cleanup();
  }, 1000);
}