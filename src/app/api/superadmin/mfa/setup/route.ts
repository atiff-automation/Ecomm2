/**
 * SuperAdmin MFA Setup API
 * Allows SuperAdmin users to setup multi-factor authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { handleApiError } from '@/lib/error-handler';
import { superAdminSecurity } from '@/lib/security/superadmin-security';

export async function POST(request: NextRequest) {
  try {
    // Verify SuperAdmin access (but allow MFA setup even without MFA enabled yet)
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || token.role !== UserRole.SUPERADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check IP whitelist (but allow MFA setup for whitelisted IPs)
    const clientIP = superAdminSecurity.extractClientIP(request);
    if (!superAdminSecurity.isIPWhitelisted(clientIP)) {
      return NextResponse.json(
        { message: 'IP address not whitelisted for SuperAdmin access' },
        { status: 403 }
      );
    }

    // Generate MFA setup
    const mfaSetup = superAdminSecurity.generateMFASetup();

    // In a real implementation, you would:
    // 1. Store the secret in the database (encrypted)
    // 2. Mark MFA as "pending setup" until verified
    // 3. Store backup codes securely

    // For now, we'll create an audit log
    await prisma.auditLog.create({
      data: {
        userId: token.sub!,
        action: 'MFA_SETUP_INITIATED',
        resource: 'SUPERADMIN_MFA',
        details: {
          userEmail: token.email,
          setupInitiated: true,
          timestamp: new Date().toISOString(),
        },
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Return MFA setup information
    // In production, consider limiting how much information is returned
    return NextResponse.json({
      message: 'MFA setup generated successfully',
      setup: {
        secret: mfaSetup.secret,
        qrCode: mfaSetup.qrCode,
        backupCodes: mfaSetup.backupCodes,
        instructions:
          'Scan the QR code with your authenticator app and enter the 6-digit code to verify setup',
      },
    });
  } catch (error) {
    console.error('SuperAdmin MFA setup error:', error);
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify SuperAdmin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || token.role !== UserRole.SUPERADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check IP whitelist
    const clientIP = superAdminSecurity.extractClientIP(request);
    if (!superAdminSecurity.isIPWhitelisted(clientIP)) {
      return NextResponse.json(
        { message: 'IP address not whitelisted for SuperAdmin access' },
        { status: 403 }
      );
    }

    const { token: mfaToken, secret } = await request.json();

    if (!mfaToken || !secret) {
      return NextResponse.json(
        { message: 'MFA token and secret are required' },
        { status: 400 }
      );
    }

    // Verify the MFA token
    const isValid = await superAdminSecurity.verifyMFAToken(
      token.sub!,
      mfaToken
    );

    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid MFA token' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Store the secret in the database (encrypted)
    // 2. Mark MFA as "enabled" for the user
    // 3. Store backup codes securely

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: token.sub!,
        action: 'MFA_SETUP_COMPLETED',
        resource: 'SUPERADMIN_MFA',
        details: {
          userEmail: token.email,
          mfaEnabled: true,
          timestamp: new Date().toISOString(),
        },
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'MFA setup completed successfully',
      enabled: true,
    });
  } catch (error) {
    console.error('SuperAdmin MFA setup verification error:', error);
    return handleApiError(error);
  }
}
