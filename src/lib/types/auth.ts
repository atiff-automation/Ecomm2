/**
 * Authentication Types - Malaysian E-commerce Platform
 * Centralized type definitions for authentication and user context
 * 
 * This file consolidates all auth-related types that were previously
 * scattered across multiple components.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isMember: boolean;
  membershipDate?: string;
  totalSpent?: number;
  role?: 'USER' | 'ADMIN';
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  expires: string;
}

export interface AuthContextType {
  // Session state
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isMember: boolean;
  isAdmin: boolean;
  
  // User info
  user: User | null;
  userId?: string;
  userName?: string;
  userEmail?: string;
  
  // Membership info
  membershipDate?: string;
  totalSpent?: number;
  membershipProgress?: number;
  
  // Auth status checks
  isAuthenticated: boolean;
  hasValidSession: boolean;
  
  // Actions
  signIn: (credentials?: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export interface AuthServiceConfig {
  membershipThreshold: number;
  sessionRefreshInterval: number;
  autoRefresh: boolean;
  errorRetryCount: number;
}

export interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export interface AuthActions {
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
}

// NextAuth session type extension
export interface ExtendedSession extends Session {
  user: User;
}

// Auth provider props
export interface AuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthServiceConfig>;
}

// Auth hook return type
export interface UseAuthReturn extends AuthContextType {
  // Additional utility methods
  checkMembershipStatus: () => boolean;
  getMembershipProgress: () => number;
  canAccessMemberFeatures: () => boolean;
  getSessionTimeRemaining: () => number;
}

// Sign in options
export interface SignInOptions {
  email?: string;
  password?: string;
  provider?: 'credentials' | 'google' | 'facebook';
  redirect?: boolean;
  callbackUrl?: string;
}

// Sign out options
export interface SignOutOptions {
  redirect?: boolean;
  callbackUrl?: string;
}

// Auth event types
export type AuthEvent = 
  | 'SIGNED_IN' 
  | 'SIGNED_OUT' 
  | 'SESSION_UPDATED' 
  | 'MEMBERSHIP_CHANGED' 
  | 'TOKEN_REFRESHED'
  | 'AUTH_ERROR';

export interface AuthEventPayload {
  event: AuthEvent;
  user?: User;
  session?: Session;
  error?: string;
  timestamp: Date;
}

// Auth listeners
export type AuthEventListener = (payload: AuthEventPayload) => void;

export interface AuthEventManager {
  subscribe: (event: AuthEvent, listener: AuthEventListener) => () => void;
  emit: (event: AuthEvent, payload: Omit<AuthEventPayload, 'event' | 'timestamp'>) => void;
  removeAllListeners: () => void;
}