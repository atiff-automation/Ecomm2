/**

export const dynamic = 'force-dynamic';

 * Receipt Template Logo Upload API - Malaysian E-commerce Platform
 * Handles logo uploads specifically for receipt templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/admin/receipt-templates/logo - Upload logo for receipts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const width = formData.get('width')
      ? parseInt(formData.get('width') as string)
      : 120;
    const height = formData.get('height')
      ? parseInt(formData.get('height') as string)
      : 40;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/svg+xml',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate dimensions
    if (width < 20 || height < 20 || width > 400 || height > 200) {
      return NextResponse.json(
        { 
          message: 'Invalid dimensions. Width must be 20-400px, height must be 20-200px' 
        },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueId = uuidv4();
    const filename = `receipt-logo-${uniqueId}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/receipts/${filename}`;

    // Get or create business profile in database
    let businessProfile = await prisma.businessProfile.findFirst();

    if (!businessProfile) {
      // Create default business profile if none exists
      businessProfile = await prisma.businessProfile.create({
        data: {
          legalName: process.env.BUSINESS_NAME || 'EcomJRM Store',
          registrationNumber: process.env.BUSINESS_REGISTRATION_NUMBER || 'REG-DEFAULT-001',
          registeredAddress: {
            addressLine1: process.env.BUSINESS_ADDRESS_LINE1 || 'No. 123, Jalan Technology',
            addressLine2: process.env.BUSINESS_ADDRESS_LINE2,
            city: process.env.BUSINESS_CITY || 'Kuala Terengganu',
            state: process.env.BUSINESS_STATE || 'TRG',
            postalCode: process.env.BUSINESS_POSTAL_CODE || '20000',
            country: 'Malaysia'
          },
          primaryPhone: process.env.BUSINESS_PHONE || '+60123456789',
          primaryEmail: process.env.BUSINESS_EMAIL || 'store@ecomjrm.com',
          logoUrl: fileUrl,
          logoWidth: width,
          logoHeight: height,
          createdBy: session.user.id,
        },
      });
    } else {
      // Update existing business profile with logo
      businessProfile = await prisma.businessProfile.update({
        where: { id: businessProfile.id },
        data: {
          logoUrl: fileUrl,
          logoWidth: width,
          logoHeight: height,
        },
      });
    }

    return NextResponse.json({
      message: 'Receipt logo uploaded successfully!',
      fileUrl,
      width,
      height,
      businessProfile,
    });
  } catch (error) {
    console.error('Error uploading receipt logo:', error);
    return NextResponse.json(
      { message: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/receipt-templates/logo - Remove logo from receipts
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get business profile from database
    const businessProfile = await prisma.businessProfile.findFirst();

    if (!businessProfile || !businessProfile.logoUrl) {
      return NextResponse.json(
        { message: 'No logo found to remove' },
        { status: 404 }
      );
    }

    // Update business profile to remove logo
    const updatedProfile = await prisma.businessProfile.update({
      where: { id: businessProfile.id },
      data: {
        logoUrl: null,
        logoWidth: 120, // Reset to default
        logoHeight: 40, // Reset to default
      },
    });

    return NextResponse.json({
      message: 'Receipt logo removed successfully!',
      businessProfile: updatedProfile,
    });
  } catch (error) {
    console.error('Error removing receipt logo:', error);
    return NextResponse.json(
      { message: 'Failed to remove logo' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/receipt-templates/logo - Update logo dimensions
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { width, height } = body;

    if (!width || !height || width < 20 || height < 20 || width > 400 || height > 200) {
      return NextResponse.json(
        { 
          message: 'Invalid dimensions. Width must be 20-400px, height must be 20-200px' 
        },
        { status: 400 }
      );
    }

    // Get business profile from database
    const businessProfile = await prisma.businessProfile.findFirst();

    if (!businessProfile || !businessProfile.logoUrl) {
      return NextResponse.json(
        { message: 'No logo found to resize' },
        { status: 404 }
      );
    }

    // Update logo dimensions in database
    const updatedProfile = await prisma.businessProfile.update({
      where: { id: businessProfile.id },
      data: {
        logoWidth: width,
        logoHeight: height,
      },
    });

    return NextResponse.json({
      message: 'Logo dimensions updated successfully!',
      businessProfile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating logo dimensions:', error);
    return NextResponse.json(
      { message: 'Failed to update logo dimensions' },
      { status: 500 }
    );
  }
}