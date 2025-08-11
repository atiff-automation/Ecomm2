/**
 * Admin Site Branding API - Malaysian E-commerce Platform
 * Handles logo and favicon uploads for site branding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;

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
    const allowedTypes = type === 'logo' 
      ? ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
      : ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: `Invalid file type for ${type}. Allowed: ${allowedTypes.join(', ')}` },
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

    // Get or create active theme to update
    let activeTheme = await prisma.siteTheme.findFirst({
      where: { isActive: true },
    });

    if (!activeTheme) {
      // Create default theme if none exists
      activeTheme = await prisma.siteTheme.create({
        data: {
          name: 'Default Theme',
          primaryColor: '#3B82F6',
          secondaryColor: '#FDE047',
          backgroundColor: '#F8FAFC',
          textColor: '#1E293B',
          isActive: true,
          createdBy: null,
        },
      });
    }

    // Update theme with new logo/favicon
    const updateData: any = {};
    if (type === 'logo') {
      updateData.logoUrl = fileUrl;
      if (width) updateData.logoWidth = width;
      if (height) updateData.logoHeight = height;
    } else {
      updateData.faviconUrl = fileUrl;
    }

    const updatedTheme = await prisma.siteTheme.update({
      where: { id: activeTheme.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create media upload record (optional, skip on error)
    try {
      await prisma.mediaUpload.create({
        data: {
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: fileUrl,
          mediaType: 'IMAGE',
          usage: type === 'logo' ? 'site_logo' : 'site_favicon',
          uploadedBy: session.user.id,
        },
      });
    } catch (error) {
      console.log('Media upload record creation failed, but file upload succeeded');
    }

    // Create audit log (optional, skip on error)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: type === 'logo' ? 'LOGO_UPLOADED' : 'FAVICON_UPLOADED',
          resource: 'SITE_CUSTOMIZATION',
          details: {
            filename,
            originalName: file.name,
            fileUrl,
            themeId: updatedTheme.id,
            ...(type === 'logo' && { dimensions: { width, height } }),
            performedBy: session.user.email,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (error) {
      console.log('Audit log creation failed, but file upload succeeded');
    }

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

    // Get active theme
    const activeTheme = await prisma.siteTheme.findFirst({
      where: { isActive: true },
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
      updateData.logoWidth = null;
      updateData.logoHeight = null;
    } else {
      updateData.faviconUrl = null;
    }

    const updatedTheme = await prisma.siteTheme.update({
      where: { id: activeTheme.id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: type === 'logo' ? 'LOGO_REMOVED' : 'FAVICON_REMOVED',
        resource: 'SITE_CUSTOMIZATION',
        details: {
          themeId: updatedTheme.id,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
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