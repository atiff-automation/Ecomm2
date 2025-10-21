import { NextRequest, NextResponse } from 'next/server';
import { checkCSRF } from '@/lib/middleware/with-csrf';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { businessProfileSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';
import { BusinessProfileCache } from '@/lib/cache/business-profile';

/**
 * GET /api/admin/settings/business-profile - Get business profile
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API Business Profile GET] Request received');
    console.log(
      '[API Business Profile GET] Headers:',
      Object.fromEntries(request.headers.entries())
    );

    const session = await getServerSession(authOptions);
    console.log(
      '[API Business Profile GET] Session:',
      session ? { userId: session.user?.id, role: session.user?.role } : null
    );

    if (!session?.user?.id) {
      console.log('[API Business Profile GET] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and superadmins can access business profile
    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      console.log(
        '[API Business Profile GET] Forbidden - role:',
        session.user.role
      );
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to get from cache first
    let businessProfile = await BusinessProfileCache.get();

    if (!businessProfile) {
      // Get from database
      businessProfile = await prisma.businessProfile.findFirst();

      if (businessProfile) {
        // Cache the result
        await BusinessProfileCache.set(businessProfile);
      }
    }

    if (!businessProfile) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No business profile found',
      });
    }

    return NextResponse.json({
      success: true,
      data: businessProfile,
    });
  } catch (error) {
    console.error('Get business profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/business-profile - Update business profile
 */
export async function PUT(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    console.log('[API Business Profile PUT] Request received');
    console.log(
      '[API Business Profile PUT] Headers:',
      Object.fromEntries(request.headers.entries())
    );

    const session = await getServerSession(authOptions);
    console.log(
      '[API Business Profile PUT] Session:',
      session ? { userId: session.user?.id, role: session.user?.role } : null
    );

    if (!session?.user?.id) {
      console.log('[API Business Profile PUT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and superadmins can update business profile
    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      console.log(
        '[API Business Profile PUT] Forbidden - role:',
        session.user.role
      );
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log(
      '[API Business Profile PUT] Request body keys:',
      Object.keys(body)
    );

    // Validate request body
    const validatedData = businessProfileSchema.parse(body);

    // Get current profile for audit logging
    const currentProfile = await prisma.businessProfile.findFirst();

    // Prepare data for database
    const profileData: any = {
      legalName: validatedData.legalName,
      tradingName: validatedData.tradingName || null,
      registrationNumber: validatedData.registrationNumber,
      taxRegistrationNumber: validatedData.taxRegistrationNumber || null,
      businessType: validatedData.businessType,
      establishedDate: validatedData.establishedDate
        ? new Date(validatedData.establishedDate)
        : null,
      primaryPhone: validatedData.primaryPhone,
      secondaryPhone: validatedData.secondaryPhone || null,
      primaryEmail: validatedData.primaryEmail,
      supportEmail: validatedData.supportEmail || null,
      website: validatedData.website || null,
      registeredAddress: {
        addressLine1: validatedData.registeredAddress.addressLine1,
        addressLine2: validatedData.registeredAddress.addressLine2 || null,
        city: validatedData.registeredAddress.city,
        state: validatedData.registeredAddress.state,
        postalCode: validatedData.registeredAddress.postalCode,
        country: validatedData.registeredAddress.country,
      },
      operationalAddress: validatedData.operationalAddress?.addressLine1
        ? {
            addressLine1: validatedData.operationalAddress.addressLine1,
            addressLine2: validatedData.operationalAddress.addressLine2 || null,
            city: validatedData.operationalAddress.city,
            state: validatedData.operationalAddress.state,
            postalCode: validatedData.operationalAddress.postalCode,
            country: validatedData.operationalAddress.country,
          }
        : null,
      shippingAddress: validatedData.shippingAddress?.addressLine1
        ? {
            addressLine1: validatedData.shippingAddress.addressLine1,
            addressLine2: validatedData.shippingAddress.addressLine2 || null,
            city: validatedData.shippingAddress.city,
            state: validatedData.shippingAddress.state,
            postalCode: validatedData.shippingAddress.postalCode,
            country: validatedData.shippingAddress.country,
          }
        : null,
      updatedAt: new Date(),
    };

    // Upsert business profile (create or update)
    const updatedProfile = await prisma.businessProfile.upsert({
      where: { id: currentProfile?.id || 'non-existent' },
      create: {
        ...profileData,
        createdBy: session.user.id,
      },
      update: {
        ...profileData,
        updatedBy: session.user.id,
      },
    });

    // Log the change for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'BUSINESS_SETTINGS',
      {
        action: currentProfile
          ? 'UPDATE_BUSINESS_PROFILE'
          : 'CREATE_BUSINESS_PROFILE',
        profileId: currentProfile?.id,
        oldData: currentProfile
          ? {
              legalName: currentProfile.legalName,
              registrationNumber: currentProfile.registrationNumber,
              primaryEmail: currentProfile.primaryEmail,
            }
          : null,
      },
      {
        action: currentProfile
          ? 'UPDATE_BUSINESS_PROFILE'
          : 'CREATE_BUSINESS_PROFILE',
        profileId: updatedProfile.id,
        newData: {
          legalName: validatedData.legalName,
          registrationNumber: validatedData.registrationNumber,
          primaryEmail: validatedData.primaryEmail,
        },
      },
      request
    );

    // Create history record
    if (currentProfile) {
      await prisma.businessProfileHistory.create({
        data: {
          businessProfileId: updatedProfile.id,
          operation: 'UPDATE',
          oldValues: currentProfile,
          newValues: {
            legalName: validatedData.legalName,
            registrationNumber: validatedData.registrationNumber,
            primaryEmail: validatedData.primaryEmail,
            primaryPhone: validatedData.primaryPhone,
            registeredAddress: validatedData.registeredAddress,
          },
          changedBy: session.user.id,
          changeReason: 'Business profile updated via settings',
        },
      });
    }

    // Invalidate cache
    await BusinessProfileCache.invalidate();

    return NextResponse.json({
      success: true,
      message: 'Business profile updated successfully',
      data: {
        id: updatedProfile.id,
        legalName: updatedProfile.legalName,
        updatedAt: updatedProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update business profile error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
