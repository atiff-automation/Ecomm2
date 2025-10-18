/**

export const dynamic = 'force-dynamic';

 * Unified Site Customization API - Malaysian E-commerce Platform
 * Single endpoint for all site customization operations (hero + branding)
 * Following CLAUDE.md principles: No hardcoding, DRY, centralized approach
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { siteCustomizationService } from '@/lib/services/site-customization.service';
import {
  uploadHeroImage,
  deleteHeroImage,
} from '@/lib/upload/hero-image-upload';

// ==================== CONFIGURATION ENDPOINTS ====================

/**
 * GET /api/admin/site-customization - Get current site customization configuration
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('🔍 Admin requesting site customization configuration');

    // Get complete configuration from service
    const config = await siteCustomizationService.getConfiguration();
    const status = await siteCustomizationService.getConfigurationStatus();

    return NextResponse.json({
      success: true,
      config,
      status,
      message: 'Site customization configuration retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching site customization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch site customization configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/site-customization - Update complete site customization configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('🔄 Admin updating site customization configuration');

    if (!body.config) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration data is required',
          details: 'Request body must contain a "config" field',
        },
        { status: 400 }
      );
    }

    // Update configuration through service
    const result = await siteCustomizationService.updateConfiguration(
      body.config,
      session.user.id
    );

    if (!result.validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration validation failed',
          validation: result.validation,
          config: result.config,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      config: result.config,
      validation: result.validation,
      preview: result.preview,
      message: 'Site customization updated successfully',
    });
  } catch (error) {
    console.error('Error updating site customization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update site customization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/site-customization - Update specific sections (hero or branding)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section'); // 'hero' or 'branding'

    console.log(`🔄 Admin updating ${section || 'multiple'} section(s)`);

    if (!section) {
      // Update multiple sections or entire config
      const result = await siteCustomizationService.updateConfiguration(
        body,
        session.user.id
      );

      return NextResponse.json(
        {
          success: result.validation.isValid,
          config: result.config,
          validation: result.validation,
          preview: result.preview,
          message: result.validation.isValid
            ? 'Configuration updated successfully'
            : 'Configuration validation failed',
        },
        {
          status: result.validation.isValid ? 200 : 400,
        }
      );
    }

    // Update specific section
    if (section !== 'hero' && section !== 'branding') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid section',
          details: 'Section must be either "hero" or "branding"',
        },
        { status: 400 }
      );
    }

    const sectionConfig = { [section]: body };
    const result = await siteCustomizationService.updateConfiguration(
      sectionConfig,
      session.user.id
    );

    return NextResponse.json(
      {
        success: result.validation.isValid,
        config: result.config,
        validation: result.validation,
        preview: result.preview,
        message: result.validation.isValid
          ? `${section} section updated successfully`
          : `${section} section validation failed`,
      },
      {
        status: result.validation.isValid ? 200 : 400,
      }
    );
  } catch (error) {
    console.error('Error updating site customization section:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update site customization section',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/site-customization - Reset to default configuration
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    console.log('🚀 POST /api/admin/site-customization - action:', action);

    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      console.log('❌ POST - Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log(
      '✅ POST - Authenticated as:',
      session.user.email,
      'role:',
      session.user.role
    );

    if (action === 'reset') {
      console.log('🔄 Admin resetting site customization to defaults');

      const result = await siteCustomizationService.resetToDefault(
        session.user.id
      );

      return NextResponse.json({
        success: true,
        config: result.config,
        validation: result.validation,
        preview: result.preview,
        message: 'Site customization reset to default values successfully',
      });
    }

    // Handle media uploads
    if (action === 'upload') {
      return await handleMediaUpload(request, session.user.id);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
        details: 'Action must be either "reset" or "upload"',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing site customization action:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ==================== FILE UPLOAD HANDLING ====================

async function handleMediaUpload(request: NextRequest, userId: string) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'hero_background', 'logo', 'favicon'
    const section = formData.get('section') as string; // 'hero' or 'branding'

    console.log('📤 Upload Handler - Starting upload:', {
      type,
      section,
      filename: file?.name,
      size: file?.size,
      mimeType: file?.type,
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !section) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          details: 'Both "type" and "section" are required',
        },
        { status: 400 }
      );
    }

    // Upload file using centralized utility (follows product image pattern)
    const uploadResult = await uploadHeroImage(
      file,
      type as 'hero_background' | 'logo' | 'favicon'
    );

    if (!uploadResult.success) {
      console.error('❌ Upload failed:', uploadResult.error);
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || 'Upload failed',
        },
        { status: 400 }
      );
    }

    const { url: fileUrl, filename } = uploadResult;

    console.log('✅ File uploaded successfully:', {
      filename,
      url: fileUrl,
    });

    // Build configuration update
    const updateConfig = buildUpdateConfigForUpload(
      type,
      section,
      fileUrl!,
      formData
    );

    console.log(
      '🔧 Updating configuration:',
      JSON.stringify(updateConfig, null, 2)
    );

    // Update configuration through service
    const result = await siteCustomizationService.updateConfiguration(
      updateConfig,
      userId
    );

    console.log('✅ Configuration updated:', {
      heroBackground: result.config.hero?.background,
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      filename,
      config: result.config,
      validation: result.validation,
      preview: result.preview,
      message: `${type.replace('_', ' ')} uploaded and configuration updated successfully`,
    });
  } catch (error) {
    console.error('❌ Media upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload media file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function buildUpdateConfigForUpload(
  type: string,
  section: string,
  fileUrl: string,
  formData: FormData
): any {
  const config: any = {};

  if (section === 'hero' && type === 'hero_background') {
    config.hero = {
      background: {
        url: fileUrl,
        type:
          fileUrl.includes('.mp4') || fileUrl.includes('.webm')
            ? 'VIDEO'
            : 'IMAGE',
      },
    };
  } else if (section === 'branding') {
    if (type === 'logo') {
      const width = formData.get('width')
        ? parseInt(formData.get('width') as string)
        : 120;
      const height = formData.get('height')
        ? parseInt(formData.get('height') as string)
        : 40;

      config.branding = {
        logo: {
          url: fileUrl,
          width,
          height,
        },
      };
    } else if (type === 'favicon') {
      config.branding = {
        favicon: {
          url: fileUrl,
        },
      };
    }
  }

  return config;
}

// ==================== FILE DELETION ====================

/**
 * DELETE /api/admin/site-customization - Delete uploaded media file from volume
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        {
          success: false,
          error: 'Filename is required',
          details: 'Provide filename query parameter',
        },
        { status: 400 }
      );
    }

    console.log('🗑️ Admin deleting site customization file:', filename);

    // Delete file from volume
    const success = await deleteHeroImage(filename);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found or already deleted',
          details: `File ${filename} does not exist in volume`,
        },
        { status: 404 }
      );
    }

    console.log('✅ File deleted successfully from volume:', filename);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully from volume',
      filename,
    });
  } catch (error) {
    console.error('❌ Error deleting site customization file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
