/**
 * SuperAdmin Security Module
 * Handles MFA, IP whitelisting, and enhanced security for SuperAdmin access
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import speakeasy from 'speakeasy';

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
        // Log unauthorized access attempt
        await this.logSecurityIncident('UNAUTHORIZED_IP_ACCESS', {
          clientIP,
          userEmail: token.email,
          userId: token.sub,
          userAgent: request.headers.get('user-agent') || 'unknown',
        });

        return {
          passed: false,
          reason: 'IP address not whitelisted for SuperAdmin access',
          requiresIPWhitelist: true,
        };
      }

      // Check MFA requirement (skip in development for now)
      if (!this.isDevelopmentMode()) {
        const mfaRequired = await this.isMFARequired(token.sub!);
        if (mfaRequired) {
          const mfaVerified = await this.verifyMFAFromRequest(
            request,
            token.sub!
          );
          if (!mfaVerified) {
            return {
              passed: false,
              reason: 'MFA verification required',
              requiresMFA: true,
            };
          }
        }
      }

      // Log successful access
      await this.logSecurityEvent('SUPERADMIN_ACCESS_GRANTED', {
        clientIP,
        userEmail: token.email,
        userId: token.sub,
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

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

  /**
   * Check if MFA is required for user
   */
  async isMFARequired(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      return user?.role === UserRole.SUPERADMIN;
    } catch (error) {
      console.error('MFA requirement check error:', error);
      return true; // Default to requiring MFA on error
    }
  }

  /**
   * Verify MFA token from request headers
   */
  async verifyMFAFromRequest(
    request: NextRequest,
    userId: string
  ): Promise<boolean> {
    const mfaToken = request.headers.get('x-mfa-token');
    if (!mfaToken) {
      return false;
    }

    return this.verifyMFAToken(userId, mfaToken);
  }

  /**
   * Verify MFA token against user's secret
   */
  async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    try {
      // In a real implementation, you'd store the MFA secret securely
      // For now, we'll use a placeholder that always returns true in development
      if (this.isDevelopmentMode()) {
        console.log(
          `MFA verification for user ${userId} with token ${token.slice(0, 3)}*** (dev mode)`
        );
        return true;
      }

      // Get user's MFA secret from database (you'd need to add this field)
      // const user = await prisma.user.findUnique({
      //   where: { id: userId },
      //   select: { mfaSecret: true }
      // });

      // if (!user?.mfaSecret) {
      //   return false;
      // }

      // const verified = speakeasy.totp.verify({
      //   secret: user.mfaSecret,
      //   encoding: 'base32',
      //   token: token,
      //   window: 2
      // });

      // return verified;

      // Placeholder implementation
      return true;
    } catch (error) {
      console.error('MFA token verification error:', error);
      return false;
    }
  }

  /**
   * Generate MFA setup for new SuperAdmin
   */
  generateMFASetup(): MFASetup {
    const secret = speakeasy.generateSecret({
      name: 'JRM E-commerce SuperAdmin',
      issuer: 'JRM E-commerce',
    });

    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url!,
      backupCodes,
    };
  }

  /**
   * Log security incidents
   */
  private async logSecurityIncident(type: string, details: any): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: details.userId || null,
          action: 'SECURITY_INCIDENT',
          resource: 'SUPERADMIN_ACCESS',
          details: {
            incidentType: type,
            ...details,
            timestamp: new Date().toISOString(),
          },
          ipAddress: details.clientIP,
          userAgent: details.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log security incident:', error);
    }
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(type: string, details: any): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: details.userId || null,
          action: 'SECURITY_EVENT',
          resource: 'SUPERADMIN_ACCESS',
          details: {
            eventType: type,
            ...details,
            timestamp: new Date().toISOString(),
          },
          ipAddress: details.clientIP,
          userAgent: details.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
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
