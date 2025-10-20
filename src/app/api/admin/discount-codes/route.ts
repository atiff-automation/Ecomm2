/**

export const dynamic = 'force-dynamic';

 * Admin Discount Codes API - JRM E-commerce Platform
 * API for managing all discount codes and coupons
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const codes = await prisma.discountCode.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        minimumOrderValue: true,
        maximumDiscount: true,
        memberOnly: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        usageCount: true,
        usageLimit: true,
        isPublic: true,
        createdAt: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the data for the frontend
    const transformedCodes = codes.map(code => ({
      ...code,
      discountValue: Number(code.discountValue),
      minimumOrderValue: code.minimumOrderValue
        ? Number(code.minimumOrderValue)
        : null,
      maximumDiscount: code.maximumDiscount
        ? Number(code.maximumDiscount)
        : null,
      createdBy: code.createdBy
        ? {
            name: `${code.createdBy.firstName} ${code.createdBy.lastName}`.trim(),
          }
        : null,
    }));

    return NextResponse.json({ codes: transformedCodes });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { message: 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const body = await request.json();

    // Basic validation - you can expand this with Zod schema
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minimumOrderValue,
      maximumDiscount,
      memberOnly,
      usageLimit,
      startsAt,
      expiresAt,
      isPublic = true,
    } = body;

    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        discountType,
        discountValue,
        minimumOrderValue,
        maximumDiscount,
        memberOnly: memberOnly || false,
        usageLimit,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPublic,
        status: 'ACTIVE',
        createdById: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Discount code created successfully',
        code: discountCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { message: 'Failed to create discount code' },
      { status: 500 }
    );
  }
}
