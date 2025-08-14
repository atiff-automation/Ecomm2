/**
 * Storage Utilities - Malaysian E-commerce Platform
 * Local storage, session storage, and cookie utilities
 */

import config from '@/lib/config/app-config';

/**
 * Safe localStorage wrapper with error handling
 */
export class SafeLocalStorage {
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getItem<T>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable()) return defaultValue || null;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;
      
      return JSON.parse(item);
    } catch {
      return defaultValue || null;
    }
  }

  static setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  static removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  static clear(): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }

  static getAllKeys(): string[] {
    if (!this.isAvailable()) return [];

    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  }

  static getSize(): number {
    if (!this.isAvailable()) return 0;

    try {
      return new Blob(Object.values(localStorage)).size;
    } catch {
      return 0;
    }
  }
}

/**
 * Safe sessionStorage wrapper
 */
export class SafeSessionStorage {
  static isAvailable(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getItem<T>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable()) return defaultValue || null;

    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return defaultValue || null;
      
      return JSON.parse(item);
    } catch {
      return defaultValue || null;
    }
  }

  static setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;

    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  static removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;

    try {
      sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  static clear(): boolean {
    if (!this.isAvailable()) return false;

    try {
      sessionStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Cookie utilities
 */
export class CookieManager {
  static set(
    name: string,
    value: string,
    options: {
      days?: number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    } = {}
  ): void {
    const {
      days = 7,
      path = '/',
      domain,
      secure = config.security.session.cookieSecure,
      sameSite = config.security.session.cookieSameSite,
    } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${expires.toUTCString()}`;
    }

    cookieString += `; path=${path}`;

    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    if (secure) {
      cookieString += '; secure';
    }

    cookieString += `; samesite=${sameSite}`;

    document.cookie = cookieString;
  }

  static get(name: string): string | null {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  static remove(
    name: string,
    options: {
      path?: string;
      domain?: string;
    } = {}
  ): void {
    this.set(name, '', { ...options, days: -1 });
  }

  static exists(name: string): boolean {
    return this.get(name) !== null;
  }

  static getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    });

    return cookies;
  }
}

/**
 * Storage with expiration
 */
export class ExpiringStorage {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  setItem<T>(key: string, value: T, expirationMs: number): void {
    const expirationTime = Date.now() + expirationMs;
    const item = {
      value,
      expiration: expirationTime,
    };

    this.storage.setItem(key, JSON.stringify(item));
  }

  getItem<T>(key: string): T | null {
    const itemStr = this.storage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      
      if (Date.now() > item.expiration) {
        this.storage.removeItem(key);
        return null;
      }

      return item.value;
    } catch {
      this.storage.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  cleanExpired(): void {
    const keys = Object.keys(this.storage);
    
    keys.forEach(key => {
      const itemStr = this.storage.getItem(key);
      if (!itemStr) return;

      try {
        const item = JSON.parse(itemStr);
        if (item.expiration && Date.now() > item.expiration) {
          this.storage.removeItem(key);
        }
      } catch {
        // Invalid format, remove it
        this.storage.removeItem(key);
      }
    });
  }
}

/**
 * Compressed storage for large data
 */
export class CompressedStorage {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      
      // Simple compression: just store as-is for now
      // In a real implementation, you might use compression algorithms
      this.storage.setItem(key, jsonString);
    } catch (error) {
      console.error('Failed to store compressed data:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;

      return JSON.parse(item);
    } catch (error) {
      console.error('Failed to retrieve compressed data:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }
}

/**
 * Storage quota manager
 */
export class StorageQuotaManager {
  static async getQuota(): Promise<{
    quota: number;
    usage: number;
    available: number;
    percentage: number;
  } | null> {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { quota, usage, available, percentage };
    } catch (error) {
      console.error('Failed to estimate storage quota:', error);
      return null;
    }
  }

  static async isStorageAvailable(requiredBytes: number): Promise<boolean> {
    const quota = await this.getQuota();
    return quota ? quota.available >= requiredBytes : false;
  }

  static getLocalStorageSize(): number {
    if (!SafeLocalStorage.isAvailable()) return 0;

    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }

    return total;
  }

  static cleanupStorage(maxSizeBytes: number): void {
    const currentSize = this.getLocalStorageSize();
    
    if (currentSize <= maxSizeBytes) return;

    // Get all items with timestamps (if available)
    const items: Array<{ key: string; timestamp: number; size: number }> = [];
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage[key];
        const size = value.length + key.length;
        
        // Try to extract timestamp from stored data
        let timestamp = 0;
        try {
          const parsed = JSON.parse(value);
          timestamp = parsed.timestamp || parsed.createdAt || 0;
        } catch {
          // If not JSON or no timestamp, use 0 (will be removed first)
        }
        
        items.push({ key, timestamp, size });
      }
    }

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp);

    // Remove items until we're under the limit
    let totalSize = currentSize;
    for (const item of items) {
      if (totalSize <= maxSizeBytes) break;
      
      localStorage.removeItem(item.key);
      totalSize -= item.size;
    }
  }
}

/**
 * Cross-tab storage synchronization
 */
export class CrossTabStorage {
  private listeners = new Map<string, Set<(value: any) => void>>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (!event.key || !event.newValue) return;

    const listeners = this.listeners.get(event.key);
    if (!listeners) return;

    try {
      const value = JSON.parse(event.newValue);
      listeners.forEach(callback => callback(value));
    } catch {
      // Invalid JSON, ignore
    }
  }

  setItem<T>(key: string, value: T): void {
    SafeLocalStorage.setItem(key, value);
  }

  getItem<T>(key: string, defaultValue?: T): T | null {
    return SafeLocalStorage.getItem(key, defaultValue);
  }

  subscribe<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  removeItem(key: string): void {
    SafeLocalStorage.removeItem(key);
  }
}

// Create instances for easy use
export const safeLocalStorage = SafeLocalStorage;
export const safeSessionStorage = SafeSessionStorage;
export const cookies = new CookieManager();
export const expiringStorage = new ExpiringStorage();
export const compressedStorage = new CompressedStorage();
export const quotaManager = new StorageQuotaManager();
export const crossTabStorage = new CrossTabStorage();