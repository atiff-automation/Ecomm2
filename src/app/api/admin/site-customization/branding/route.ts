/**
 * Admin Site Branding API - Malaysian E-commerce Platform
 * Handles logo and favicon uploads for site branding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/admin/site-customization/branding - Upload logo or favicon
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'favicon'
    const width = formData.get('width')
      ? parseInt(formData.get('width') as string)
      : undefined;
    const height = formData.get('height')
      ? parseInt(formData.get('height') as string)
      : undefined;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['logo', 'favicon'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid type. Must be "logo" or "favicon"' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes =
      type === 'logo'
        ? [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/svg+xml',
            'image/webp',
          ]
        : ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Invalid file type for ${type}. Allowed: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max for logos, 1MB max for favicons)
    const maxSize = type === 'logo' ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'branding');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueId = uuidv4();
    const filename = `${type}-${uniqueId}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/branding/${filename}`;

    // Get or create active theme in database
    let activeTheme = await prisma.siteTheme.findFirst({
      where: { isActive: true }
    });

    if (!activeTheme) {
      // Create default theme if none exists
      activeTheme = await prisma.siteTheme.create({
        data: {
          name: 'Default Theme',
          isActive: true,
          createdBy: session.user.id,
        },
      });
    }

    // Update theme with uploaded file
    const updateData: any = {};
    if (type === 'logo') {
      updateData.logoUrl = fileUrl;
      if (width) updateData.logoWidth = width;
      if (height) updateData.logoHeight = height;
    } else {
      updateData.faviconUrl = fileUrl;
    }

    // Update the theme in database
    const updatedTheme = await prisma.siteTheme.update({
      where: { id: activeTheme.id },
      data: updateData,
    });

    return NextResponse.json({
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`,
      fileUrl,
      theme: updatedTheme,
    });
  } catch (error) {
    console.error('Error uploading branding asset:', error);
    return NextResponse.json(
      { message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/site-customization/branding - Remove logo or favicon
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'logo' or 'favicon'

    if (!type || !['logo', 'favicon'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid type. Must be "logo" or "favicon"' },
        { status: 400 }
      );
    }

    // Get active theme from database
    const activeTheme = await prisma.siteTheme.findFirst({
      where: { isActive: true }
    });

    if (!activeTheme) {
      return NextResponse.json(
        { message: 'No active theme found' },
        { status: 404 }
      );
    }

    // Update theme to remove logo/favicon
    const updateData: any = {};
    if (type === 'logo') {
      updateData.logoUrl = null;
      updateData.logoWidth = 120; // Reset to default
      updateData.logoHeight = 40; // Reset to default
    } else {
      updateData.faviconUrl = null;
    }

    const updatedTheme = await prisma.siteTheme.update({
      where: { id: activeTheme.id },
      data: updateData,
    });

    return NextResponse.json({
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} removed successfully!`,
      theme: updatedTheme,
    });
  } catch (error) {
    console.error('Error removing branding asset:', error);
    return NextResponse.json(
      { message: 'Failed to remove asset' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/site-customization/branding - Update logo dimensions
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, width, height } = body;

    if (!type || type !== 'logo') {
      return NextResponse.json(
        { message: 'Invalid type. Currently only "logo" is supported for dimension updates' },
        { status: 400 }
      );
    }

    if (!width || !height || width < 20 || height < 20 || width > 400 || height > 200) {
      return NextResponse.json(
        { 
          message: 'Invalid dimensions. Width must be 20-400px, height must be 20-200px' 
        },
        { status: 400 }
      );
    }

    // Get active theme from database
    const activeTheme = await prisma.siteTheme.findFirst({
      where: { isActive: true }
    });

    if (!activeTheme || !activeTheme.logoUrl) {
      return NextResponse.json(
        { message: 'No logo found to resize' },
        { status: 404 }
      );
    }

    // Update logo dimensions in database
    const updatedTheme = await prisma.siteTheme.update({
      where: { id: activeTheme.id },
      data: {
        logoWidth: width,
        logoHeight: height,
      },
    });

    return NextResponse.json(updatedTheme);
  } catch (error) {
    console.error('Error updating logo dimensions:', error);
    return NextResponse.json(
      { message: 'Failed to update logo dimensions' },
      { status: 500 }
    );
  }
}