/**
 * User Addresses API - Malaysian E-commerce Platform
 * Manage user's address book with deduplication and default setting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().default('Malaysia'),
  phone: z.string().optional(),
  type: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
  isDefault: z.boolean().default(false),
});

/**
 * GET /api/user/addresses - Get user's address book
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: session.user.id,
        type: { in: ['HOME', 'WORK', 'OTHER'] }, // Exclude order-specific addresses
      },
      orderBy: [
        { isDefault: 'desc' }, // Default address first
        { updatedAt: 'desc' }, // Most recently used next
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/addresses - Add new address to user's address book
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const addressData = addressSchema.parse(body);

    const result = await prisma.$transaction(async tx => {
      // Check for duplicate address (best practice: prevent duplicates)
      const existingAddress = await tx.address.findFirst({
        where: {
          userId: session.user.id,
          firstName: addressData.firstName,
          lastName: addressData.lastName,
          addressLine1: addressData.addressLine1,
          addressLine2: addressData.addressLine2 || null,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
          country: addressData.country,
        },
      });

      if (existingAddress) {
        // Update existing address instead of creating duplicate
        const updatedAddress = await tx.address.update({
          where: { id: existingAddress.id },
          data: {
            phone: addressData.phone,
            type: addressData.type,
            company: addressData.company,
            isDefault: addressData.isDefault,
          },
        });

        // Handle default address logic
        if (addressData.isDefault) {
          // Remove default from other addresses
          await tx.address.updateMany({
            where: {
              userId: session.user.id,
              id: { not: updatedAddress.id },
            },
            data: { isDefault: false },
          });
        }

        return updatedAddress;
      }

      // Create new address
      const newAddress = await tx.address.create({
        data: {
          userId: session.user.id,
          ...addressData,
        },
      });

      // Handle default address logic
      if (addressData.isDefault) {
        // Remove default from other addresses
        await tx.address.updateMany({
          where: {
            userId: session.user.id,
            id: { not: newAddress.id },
          },
          data: { isDefault: false },
        });
      } else {
        // If no default address exists, make this one default
        const hasDefault = await tx.address.findFirst({
          where: {
            userId: session.user.id,
            isDefault: true,
          },
        });

        if (!hasDefault) {
          await tx.address.update({
            where: { id: newAddress.id },
            data: { isDefault: true },
          });
        }
      }

      return newAddress;
    });

    return NextResponse.json(
      {
        message: 'Address saved successfully',
        address: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving address:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid address data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to save address' },
      { status: 500 }
    );
  }
}
