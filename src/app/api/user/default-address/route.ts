/**
 * User Default Address API - Malaysian E-commerce Platform  
 * Get user's default address for checkout auto-fill
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's default address
    const defaultAddress = await prisma.address.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
    });

    if (!defaultAddress) {
      // If no default address, try to get the most recent one
      const recentAddress = await prisma.address.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentAddress) {
        return NextResponse.json({
          address: {
            firstName: recentAddress.firstName,
            lastName: recentAddress.lastName,
            email: session.user.email,
            phone: recentAddress.phone || '',
            address: recentAddress.addressLine1,
            address2: recentAddress.addressLine2 || '',
            city: recentAddress.city,
            state: recentAddress.state,
            postcode: recentAddress.postalCode,
            country: recentAddress.country,
          },
        });
      }

      return NextResponse.json({ address: null });
    }

    // Format address for checkout form
    const formattedAddress = {
      firstName: defaultAddress.firstName,
      lastName: defaultAddress.lastName,
      email: session.user.email, // Always use current session email
      phone: defaultAddress.phone || '',
      address: defaultAddress.addressLine1,
      address2: defaultAddress.addressLine2 || '',
      city: defaultAddress.city,
      state: defaultAddress.state,
      postcode: defaultAddress.postalCode,
      country: defaultAddress.country,
    };

    return NextResponse.json({ address: formattedAddress });
  } catch (error) {
    console.error('Error fetching default address:', error);
    return NextResponse.json(
      { message: 'Failed to fetch default address' },
      { status: 500 }
    );
  }
}