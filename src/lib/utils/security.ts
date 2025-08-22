/**
 * Security Utilities - Malaysian E-commerce Platform
 * Security helper functions for API endpoints and data protection
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Extract client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  // Handle X-Forwarded-For which can contain multiple IPs
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0]; // First IP is usually the original client
  }
  
  if (realIP) return realIP;
  if (clientIP) return clientIP;
  
  // Fallback to connection remote address
  return request.ip || '127.0.0.1';
}

/**
 * Generate cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data with salt
 */
export function hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
  
  return { hash, salt: actualSalt };
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptData(data: string, key?: string): { encrypted: string; key: string; iv: string; tag: string } {
  const actualKey = key || crypto.randomBytes(32).toString('hex');
  const iv = crypto.randomBytes(16);
  
  try {
    // Use AES-256-GCM for authenticated encryption
    const cipher = crypto.createCipher('aes-256-gcm', Buffer.from(actualKey, 'hex'));
    cipher.setIV(iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      key: actualKey,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(encrypted: string, key: string, iv: string, tag: string): string {
  try {
    // Use AES-256-GCM for authenticated decryption
    const decipher = crypto.createDecipher('aes-256-gcm', Buffer.from(key, 'hex'));
    decipher.setIV(Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key is incorrect');
  }
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  );
}

/**
 * Check if request is from a trusted origin
 */
export function isTrustedOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // For same-origin requests (no origin header), check if it's from the same host
  if (!origin && !referer) {
    // Allow same-origin requests (common for API calls from the same domain)
    if (host) {
      const sameOriginUrls = [
        `http://${host}`,
        `https://${host}`,
      ];
      return allowedOrigins.some(allowed => 
        sameOriginUrls.includes(allowed) || allowed === '*'
      );
    }
    return false; // No origin information and no host
  }
  
  const requestOrigin = origin || (referer ? new URL(referer).origin : '');
  
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return requestOrigin.endsWith(domain);
    }
    return requestOrigin === allowed;
  });
}

/**
 * Verify webhook signature using HMAC-SHA256
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Generate webhook signature for outgoing requests
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Detect suspicious user agent patterns
 */
export function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /java/i,
    /^$/,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Generate order number with security considerations
 */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${date}-${random}`;
}

/**
 * Mask sensitive information for logging
 */
export function maskSensitiveData(data: any): any {
  const sensitiveFields = [
    'password', 'email', 'phone', 'address', 'creditCard', 
    'bankAccount', 'socialSecurity', 'nric', 'ic'
  ];
  
  if (typeof data === 'string') {
    // Mask email addresses
    if (data.includes('@')) {
      const [local, domain] = data.split('@');
      return `${local.slice(0, 2)}***@${domain}`;
    }
    
    // Mask phone numbers
    if (/^\+?[\d\s-()]{8,}$/.test(data)) {
      return data.slice(0, 3) + '***' + data.slice(-2);
    }
    
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }
  
  if (typeof data === 'object' && data !== null) {
    const masked: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }
    return masked;
  }
  
  return data;
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

/**
 * CORS headers for API responses
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);
  
  const isAllowed = !origin || allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Audit log entry for security events
 */
export interface SecurityAuditLog {
  timestamp: string;
  event: string;
  clientIP: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  details?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Log security event (in production, this would go to a security monitoring system)
 */
export function logSecurityEvent(event: Omit<SecurityAuditLog, 'timestamp'>): void {
  const logEntry: SecurityAuditLog = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Security Event:', logEntry);
  }
  
  // In production, you would send this to your security monitoring system
  // Example: sendToSecurityMonitoring(logEntry);
}