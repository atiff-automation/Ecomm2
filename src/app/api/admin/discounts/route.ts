/**

export const dynamic = 'force-dynamic';

 * Admin Discount Codes Management API
 * Create, read, update, delete discount codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { discountService } from '@/lib/discounts/discount-service';
import { UserRole, DiscountType, DiscountStatus } from '@prisma/client';
import { z } from 'zod';

const createDiscountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().min(0),
  minimumOrderValue: z.number().min(0).optional(),
  maximumDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  perUserLimit: z.number().min(1).optional(),
  memberOnly: z.boolean().default(false),
  applicableToCategories: z.array(z.string()).default([]),
  applicableToProducts: z.array(z.string()).default([]),
  excludeCategories: z.array(z.string()).default([]),
  excludeProducts: z.array(z.string()).default([]),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  isPublic: z.boolean().default(true),
  generateCode: z.boolean().default(false),
  customCode: z.string().optional(),
});

// GET - List all discount codes
export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as DiscountStatus) || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const whereClause = status ? { status } : {};
    const discountCodes = await prisma.discountCode.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            usageHistory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.discountCode.count({
      where: whereClause,
    });

    return NextResponse.json({
      discountCodes: discountCodes.map(code => ({
        ...code,
        discountValue: Number(code.discountValue),
        minimumOrderValue: code.minimumOrderValue
          ? Number(code.minimumOrderValue)
          : null,
        maximumDiscount: code.maximumDiscount
          ? Number(code.maximumDiscount)
          : null,
        usageCount: code._count.usageHistory,
      })),
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new discount code
export async function POST(request: NextRequest) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const body = await request.json();
    const validatedData = createDiscountSchema.parse(body);

    // Generate or use custom code
    let discountCode: string;
    if (validatedData.generateCode) {
      discountCode = discountService.generateDiscountCode();
    } else if (validatedData.customCode) {
      discountCode = validatedData.customCode.toUpperCase();

      // Check if code already exists
      const existingCode = await prisma.discountCode.findUnique({
        where: { code: discountCode },
      });

      if (existingCode) {
        return NextResponse.json(
          { message: 'Discount code already exists' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          message:
            'Either generateCode must be true or customCode must be provided',
        },
        { status: 400 }
      );
    }

    const newDiscountCode = await prisma.discountCode.create({
      data: {
        code: discountCode,
        name: validatedData.name,
        description: validatedData.description || null,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        minimumOrderValue: validatedData.minimumOrderValue || null,
        maximumDiscount: validatedData.maximumDiscount || null,
        usageLimit: validatedData.usageLimit || null,
        perUserLimit: validatedData.perUserLimit || null,
        memberOnly: validatedData.memberOnly,
        applicableToCategories: validatedData.applicableToCategories,
        applicableToProducts: validatedData.applicableToProducts,
        excludeCategories: validatedData.excludeCategories,
        excludeProducts: validatedData.excludeProducts,
        startsAt: new Date(validatedData.startsAt),
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        isPublic: validatedData.isPublic,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Discount code created successfully',
      discountCode: {
        ...newDiscountCode,
        discountValue: Number(newDiscountCode.discountValue),
        minimumOrderValue: newDiscountCode.minimumOrderValue
          ? Number(newDiscountCode.minimumOrderValue)
          : null,
        maximumDiscount: newDiscountCode.maximumDiscount
          ? Number(newDiscountCode.maximumDiscount)
          : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
