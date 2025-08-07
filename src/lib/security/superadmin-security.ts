/**
 * SuperAdmin Security Module
 * Handles MFA, IP whitelisting, and enhanced security for SuperAdmin access
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

export interface SecurityCheck {
  passed: boolean;
  reason?: string;
  requiresMFA?: boolean;
  requiresIPWhitelist?: boolean;
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class SuperAdminSecurity {
  private static instance: SuperAdminSecurity;

  private constructor() {}

  public static getInstance(): SuperAdminSecurity {
    if (!SuperAdminSecurity.instance) {
      SuperAdminSecurity.instance = new SuperAdminSecurity();
    }
    return SuperAdminSecurity.instance;
  }

  /**
   * Check if IP is whitelisted for SuperAdmin access
   */
  isIPWhitelisted(ipAddress: string): boolean {
    const whitelistedIPs = this.getWhitelistedIPs();
    return whitelistedIPs.includes(ipAddress) || this.isDevelopmentMode();
  }

  /**
   * Get whitelisted IP addresses from environment or database
   */
  private getWhitelistedIPs(): string[] {
    // In production, you'd want to store this in database or secure config
    const envIPs = process.env.SUPERADMIN_WHITELIST_IPS || '';
    const ips = envIPs
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);

    // Default development IPs
    if (this.isDevelopmentMode()) {
      return [...ips, '127.0.0.1', '::1', 'localhost'];
    }

    return ips;
  }

  /**
   * Check if we're in development mode
   */
  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Verify SuperAdmin access with all security checks
   */
  async verifySuperAdminAccess(request: NextRequest): Promise<SecurityCheck> {
    try {
      // Get token
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET!,
      });

      if (!token || token.role !== UserRole.SUPERADMIN) {
        return {
          passed: false,
          reason: 'Invalid or missing SuperAdmin token',
        };
      }

      // Get client IP
      const clientIP = this.extractClientIP(request);

      // Check IP whitelist
      if (!this.isIPWhitelisted(clientIP)) {
        return {
          passed: false,
          reason: 'IP address not whitelisted for SuperAdmin access',
          requiresIPWhitelist: true,
        };
      }

      // MFA and logging will be handled in API routes, not middleware
      // This middleware only handles basic auth and IP checks

      return { passed: true };
    } catch (error) {
      console.error('SuperAdmin security check error:', error);
      return {
        passed: false,
        reason: 'Security check failed',
      };
    }
  }

  /**
   * Extract client IP from request
   */
  extractClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    // Fallback to localhost for development
    return '127.0.0.1';
  }

  // Note: MFA verification and logging methods are moved to API routes
  // as they require Node.js runtime features not available in Edge Runtime
}

// Export singleton instance
export const superAdminSecurity = SuperAdminSecurity.getInstance();

/**
 * Middleware function for protecting SuperAdmin routes
 */
export async function requireSuperAdminAccess(request: NextRequest) {
  const securityCheck =
    await superAdminSecurity.verifySuperAdminAccess(request);

  if (!securityCheck.passed) {
    const status = securityCheck.requiresMFA
      ? 423
      : securityCheck.requiresIPWhitelist
        ? 403
        : 401;

    return new Response(
      JSON.stringify({
        error: securityCheck.reason,
        requiresMFA: securityCheck.requiresMFA,
        requiresIPWhitelist: securityCheck.requiresIPWhitelist,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null; // Access granted
}
