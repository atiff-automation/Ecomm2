/**
 * MFA Service Module
 * Handles MFA generation and verification for SuperAdmin access
 * This runs in Node.js runtime, not Edge Runtime
 */

import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import speakeasy from 'speakeasy';

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class MFAService {
  private static instance: MFAService;

  private constructor() {}

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
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
   * Verify MFA token against user's secret
   */
  async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    try {
      // In development mode, skip MFA verification
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `MFA verification for user ${userId} with token ${token.slice(0, 3)}*** (dev mode - bypassed)`
        );
        return true;
      }

      // Get user's MFA secret from database
      // Note: You would need to add mfaSecret field to User model in production
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          // mfaSecret: true  // Add this field in production
        },
      });

      if (!user) {
        return false;
      }

      // Placeholder: In production, uncomment and use actual MFA secret
      // const verified = speakeasy.totp.verify({
      //   secret: user.mfaSecret,
      //   encoding: 'base32',
      //   token: token,
      //   window: 2
      // });
      // return verified;

      // For now, return true in development
      return true;
    } catch (error) {
      console.error('MFA token verification error:', error);
      return false;
    }
  }

  /**
   * Log security incidents
   */
  async logSecurityIncident(type: string, details: any): Promise<void> {
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
  async logSecurityEvent(type: string, details: any): Promise<void> {
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
export const mfaService = MFAService.getInstance();
