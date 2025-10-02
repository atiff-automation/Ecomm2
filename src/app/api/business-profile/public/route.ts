import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { BusinessProfileCache } from '@/lib/cache/business-profile';

/**
 * GET /api/business-profile/public - Get public business profile information
 * This endpoint returns only public-safe business profile data for use in footer, contact pages, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    let businessProfile = await BusinessProfileCache.get();

    if (!businessProfile) {
      // Get from database
      businessProfile = await prisma.businessProfile.findFirst({
        where: {
          isActive: true
        },
        select: {
          // Only select public-safe fields
          tradingName: true,
          primaryEmail: true,
          supportEmail: true,
          primaryPhone: true,
          secondaryPhone: true,
          website: true,
          operationalAddress: true,
          // Exclude sensitive fields like bank details, registration numbers, etc.
        }
      });

      if (businessProfile) {
        // Cache the result for 5 minutes
        await BusinessProfileCache.set(businessProfile, 300);
      }
    }

    // Return default values if no profile found
    if (!businessProfile) {
      return NextResponse.json({
        success: true,
        data: {
          tradingName: 'JRM E-commerce',
          primaryEmail: 'support@jrm-ecommerce.com',
          supportEmail: 'support@jrm-ecommerce.com',
          primaryPhone: '+60 12-345 6789',
          secondaryPhone: null,
          website: 'https://jrm-ecommerce.com',
          operationalAddress: 'Kuala Lumpur, Malaysia'
        },
        message: 'Using default business profile'
      });
    }

    // Filter out any sensitive data and ensure we only return public info
    const publicProfile = {
      tradingName: businessProfile.tradingName || 'JRM E-commerce',
      primaryEmail: businessProfile.primaryEmail || 'support@jrm-ecommerce.com',
      supportEmail: businessProfile.supportEmail || businessProfile.primaryEmail || 'support@jrm-ecommerce.com',
      primaryPhone: businessProfile.primaryPhone || '+60 12-345 6789',
      secondaryPhone: businessProfile.secondaryPhone,
      website: businessProfile.website || 'https://jrm-ecommerce.com',
      operationalAddress: businessProfile.operationalAddress || 'Kuala Lumpur, Malaysia'
    };

    return NextResponse.json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    console.error('Error fetching public business profile:', error);

    // Return fallback data on error
    return NextResponse.json({
      success: true,
      data: {
        tradingName: 'JRM E-commerce',
        primaryEmail: 'support@jrm-ecommerce.com',
        supportEmail: 'support@jrm-ecommerce.com',
        primaryPhone: '+60 12-345 6789',
        secondaryPhone: null,
        website: 'https://jrm-ecommerce.com',
        operationalAddress: 'Kuala Lumpur, Malaysia'
      },
      message: 'Using fallback business profile due to error'
    });
  }
}

// Cache headers for public endpoint
export const runtime = 'nodejs';
export const revalidate = 300; // Revalidate every 5 minutes