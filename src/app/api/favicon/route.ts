/**
 * Dynamic Favicon API - Malaysian E-commerce Platform
 * Serves custom favicon from site customization or default
 */

import { NextRequest, NextResponse } from 'next/server';
import { siteCustomizationService } from '@/lib/services/site-customization.service';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get site customization configuration
    const config = await siteCustomizationService.getConfiguration();
    
    if (config.branding.favicon?.url) {
      // Serve custom favicon
      const faviconPath = path.join(process.cwd(), 'public', config.branding.favicon.url);
      
      try {
        const faviconBuffer = await readFile(faviconPath);
        
        // Determine content type based on file extension
        const ext = path.extname(config.branding.favicon.url).toLowerCase();
        let contentType = 'image/x-icon';
        if (ext === '.png') {
          contentType = 'image/png';
        } else if (ext === '.jpg' || ext === '.jpeg') {
          contentType = 'image/jpeg';
        }
        
        return new NextResponse(faviconBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
        });
      } catch (fileError) {
        console.error('Error reading custom favicon:', fileError);
        // Fall through to default favicon
      }
    }
    
    // Serve default favicon
    const defaultFaviconPath = path.join(process.cwd(), 'src/app', 'favicon.ico');
    const defaultFaviconBuffer = await readFile(defaultFaviconPath);
    
    return new NextResponse(defaultFaviconBuffer, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
    
  } catch (error) {
    console.error('Error serving favicon:', error);
    
    // Return 404 if everything fails
    return new NextResponse(null, { 
      status: 404,
    });
  }
}