/**
 * Password Reset Utilities
 * SINGLE SOURCE OF TRUTH for password reset operations
 *
 * Following CLAUDE.md standards:
 * - No hardcoding (centralized config)
 * - DRY principle (reusable functions)
 * - Type safety (explicit types, no any)
 * - Error handling (try-catch on all async)
 * - Security first (crypto tokens, audit logging)
 */

import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from './utils';

// CENTRALIZED CONFIGURATION - Single Source of Truth
export const PASSWORD_RESET_CONFIG = {
  TOKEN_LENGTH: 32,
  TOKEN_EXPIRY_HOURS: 1,
  MAX_RESET_ATTEMPTS_PER_DAY: 3,
} as const;

export interface PasswordResetResult {
  success: boolean;
  message: string;
  token?: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  message?: string;
}

/**
 * Generate secure password reset token
 * Security: Uses crypto.randomBytes for cryptographically secure tokens
 * Security: Don't reveal if email exists (generic success message)
 */
export async function generatePasswordResetToken(
  email: string
): Promise<PasswordResetResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user) {
      // SECURITY: Don't reveal if email exists
      return {
        success: true,
        message: 'If email exists, reset link will be sent',
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Account is not active',
      };
    }

    // Generate secure random token using crypto
    const token = crypto
      .randomBytes(PASSWORD_RESET_CONFIG.TOKEN_LENGTH)
      .toString('hex');

    // Calculate expiry time
    const expiryDate = new Date();
    expiryDate.setHours(
      expiryDate.getHours() + PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_HOURS
    );

    // Store token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetTokenExpiry: expiryDate,
      },
    });

    return {
      success: true,
      message: 'Password reset token generated',
      token,
    };
  } catch (error) {
    console.error('Generate reset token error:', error);
    return {
      success: false,
      message: 'Failed to generate reset token',
    };
  }
}

/**
 * Verify password reset token
 * Validates token exists, not expired, and user is active
 * Automatically clears expired tokens
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<TokenVerificationResult> {
  try {
    if (!token) {
      return { valid: false, message: 'Token is required' };
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
      select: {
        id: true,
        email: true,
        status: true,
        passwordResetTokenExpiry: true,
      },
    });

    if (!user) {
      return { valid: false, message: 'Invalid or expired token' };
    }

    // Check token expiry
    if (!user.passwordResetTokenExpiry || new Date() > user.passwordResetTokenExpiry) {
      // Clear expired token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        },
      });
      return { valid: false, message: 'Token has expired' };
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      return { valid: false, message: 'Account is not active' };
    }

    return {
      valid: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('Verify reset token error:', error);
    return { valid: false, message: 'Token verification failed' };
  }
}

/**
 * Reset password with token
 * Validates token, updates password, clears token, creates audit log
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    // Verify token first
    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        message: verification.message || 'Invalid token',
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear token in single transaction
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        updatedAt: new Date(),
      },
    });

    // Create audit log for security tracking
    await prisma.auditLog.create({
      data: {
        userId: verification.userId,
        action: 'PASSWORD_RESET',
        resource: 'USER',
        resourceId: verification.userId,
        details: {
          method: 'forgot_password_flow',
          email: verification.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: 'Password reset successful',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      message: 'Failed to reset password',
    };
  }
}
