/**
 * Centralized Auth Service - Malaysian E-commerce Platform
 * Single source of truth for ALL authentication and session management
 * 
 * This service consolidates all auth logic that was previously
 * scattered across 34+ frontend components into one maintainable location.
 */

import { 
  User, 
  Session, 
  AuthState, 
  AuthServiceConfig,
  SignInOptions,
  SignOutOptions,
  AuthEvent,
  AuthEventPayload,
  AuthEventListener,
  AuthEventManager
} from '@/lib/types/auth';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, getSession } from 'next-auth/react';

export class AuthService {
  private static config: AuthServiceConfig = {
    membershipThreshold: 80, // RM 80 minimum spend for membership
    sessionRefreshInterval: 5 * 60 * 1000, // 5 minutes
    autoRefresh: true,
    errorRetryCount: 3
  };

  private static eventManager: AuthEventManager = {
    listeners: new Map(),
    
    subscribe(event: AuthEvent, listener: AuthEventListener) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(listener);
      
      // Return unsubscribe function
      return () => {
        this.listeners.get(event)?.delete(listener);
      };
    },
    
    emit(event: AuthEvent, payload: Omit<AuthEventPayload, 'event' | 'timestamp'>) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const eventPayload: AuthEventPayload = {
          ...payload,
          event,
          timestamp: new Date()
        };
        listeners.forEach(listener => listener(eventPayload));
      }
    },
    
    removeAllListeners() {
      this.listeners.clear();
    }
  };

  /**
   * Get current session with enhanced user data
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const session = await getSession();
      if (!session?.user) {
        return null;
      }

      // Enhance session with additional user properties
      const enhancedSession: Session = {
        ...session,
        user: this.enhanceUserData(session.user as any)
      };

      return enhancedSession;
    } catch (error) {
      console.error('Failed to get current session:', error);
      this.eventManager.emit('AUTH_ERROR', { 
        error: 'Failed to retrieve session' 
      });
      return null;
    }
  }

  /**
   * Enhanced user data with computed properties
   */
  private static enhanceUserData(user: any): User {
    const totalSpent = user.totalSpent || 0;
    const isMember = user.isMember || totalSpent >= this.config.membershipThreshold;
    
    return {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      image: user.image,
      isMember,
      membershipDate: user.membershipDate || (isMember && !user.membershipDate ? new Date().toISOString() : undefined),
      totalSpent,
      role: user.role || 'USER',
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Sign in with enhanced error handling and events
   */
  static async signIn(options: SignInOptions = {}): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await nextAuthSignIn(options.provider || 'credentials', {
        email: options.email,
        password: options.password,
        redirect: options.redirect ?? false,
        callbackUrl: options.callbackUrl
      });

      if (result?.error) {
        const errorMessage = this.getReadableErrorMessage(result.error);
        this.eventManager.emit('AUTH_ERROR', { error: errorMessage });
        return { success: false, error: errorMessage };
      }

      // Get fresh session after sign in
      const session = await this.getCurrentSession();
      if (session) {
        this.eventManager.emit('SIGNED_IN', { 
          user: session.user, 
          session 
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Sign in failed. Please try again.';
      this.eventManager.emit('AUTH_ERROR', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out with cleanup and events
   */
  static async signOut(options: SignOutOptions = {}): Promise<void> {
    try {
      const session = await this.getCurrentSession();
      
      await nextAuthSignOut({
        redirect: options.redirect ?? false,
        callbackUrl: options.callbackUrl
      });

      if (session) {
        this.eventManager.emit('SIGNED_OUT', { 
          user: session.user 
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      this.eventManager.emit('AUTH_ERROR', { 
        error: 'Sign out failed' 
      });
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session?.user;
  }

  /**
   * Check if user has valid membership
   */
  static async isMember(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session?.user?.isMember || false;
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session?.user?.role === 'ADMIN';
  }

  /**
   * Get membership progress (0-100)
   */
  static calculateMembershipProgress(totalSpent: number): number {
    if (totalSpent >= this.config.membershipThreshold) {
      return 100;
    }
    return Math.round((totalSpent / this.config.membershipThreshold) * 100);
  }

  /**
   * Get remaining amount needed for membership
   */
  static getMembershipRemaining(totalSpent: number): number {
    const remaining = this.config.membershipThreshold - totalSpent;
    return Math.max(0, remaining);
  }

  /**
   * Check if user can access member features
   */
  static async canAccessMemberFeatures(): Promise<boolean> {
    return await this.isMember();
  }

  /**
   * Get session time remaining (minutes)
   */
  static getSessionTimeRemaining(session: Session): number {
    const expires = new Date(session.expires);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }

  /**
   * Refresh session and emit events
   */
  static async refreshSession(): Promise<Session | null> {
    try {
      const session = await this.getCurrentSession();
      if (session) {
        this.eventManager.emit('SESSION_UPDATED', { 
          session, 
          user: session.user 
        });
      }
      return session;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      this.eventManager.emit('AUTH_ERROR', { 
        error: 'Failed to refresh session' 
      });
      return null;
    }
  }

  /**
   * Subscribe to auth events
   */
  static onAuthEvent(event: AuthEvent, listener: AuthEventListener): () => void {
    return this.eventManager.subscribe(event, listener);
  }

  /**
   * Get user-friendly error messages
   */
  private static getReadableErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'CredentialsSignin': 'Invalid email or password',
      'EmailNotVerified': 'Please verify your email address',
      'AccountNotLinked': 'This email is already registered with a different provider',
      'Timeout': 'Request timed out. Please try again',
      'Default': 'Something went wrong. Please try again'
    };

    return errorMap[error] || errorMap.Default;
  }

  /**
   * Update service configuration
   */
  static updateConfig(newConfig: Partial<AuthServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  static getConfig(): AuthServiceConfig {
    return { ...this.config };
  }

  /**
   * Clear all event listeners (cleanup)
   */
  static cleanup(): void {
    this.eventManager.removeAllListeners();
  }

  /**
   * Validate session structure
   */
  static validateSession(session: any): session is Session {
    return (
      session &&
      typeof session === 'object' &&
      session.user &&
      typeof session.user.id === 'string' &&
      typeof session.user.email === 'string' &&
      typeof session.expires === 'string'
    );
  }

  /**
   * Format user display name
   */
  static getDisplayName(user: User): string {
    return user.name || user.email?.split('@')[0] || 'User';
  }

  /**
   * Check if session is about to expire (within 5 minutes)
   */
  static isSessionExpiringSoon(session: Session): boolean {
    const timeRemaining = this.getSessionTimeRemaining(session);
    return timeRemaining <= 5;
  }

  /**
   * Get user avatar URL with fallback
   */
  static getAvatarUrl(user: User): string {
    if (user.image) {
      return user.image;
    }
    
    // Generate initials-based avatar URL
    const initials = this.getDisplayName(user)
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
  }
}