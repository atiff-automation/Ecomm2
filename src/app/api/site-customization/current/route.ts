/**
 * Public Site Customization API - Malaysian E-commerce Platform
 * Provides current active theme and hero section for frontend
 * Updated to use unified site customization system
 */

import { NextResponse } from 'next/server';
import { siteCustomizationService } from '@/lib/services/site-customization.service';

/**
 * GET /api/site-customization/current - Get current active theme and hero section
 */
export async function GET() {
  try {
    // Get current configuration from unified system
    const config = await siteCustomizationService.getConfiguration();

    // Extract theme configuration from branding
    const theme = {
      id: 'default',
      name: 'Default Theme',
      primaryColor: config.branding.colors?.primary || '#3B82F6',
      secondaryColor: config.branding.colors?.secondary || '#FDE047',
      backgroundColor: config.branding.colors?.background || '#F8FAFC',
      textColor: config.branding.colors?.text || '#1E293B',
      isActive: true,
    };

    // Transform unified config to legacy format for frontend compatibility
    const heroSection = {
      id: 'default',
      title: config.hero.title,
      subtitle: config.hero.subtitle,
      description: config.hero.description,
      ctaPrimaryText: config.hero.ctaPrimary.text,
      ctaPrimaryLink: config.hero.ctaPrimary.link,
      ctaSecondaryText: config.hero.ctaSecondary.text,
      ctaSecondaryLink: config.hero.ctaSecondary.link,
      backgroundType: config.hero.background.type,
      backgroundImage: config.hero.background.url,
      backgroundVideo: config.hero.background.type === 'VIDEO' ? config.hero.background.url : null,
      overlayOpacity: config.hero.background.overlayOpacity,
      textAlignment: config.hero.layout.textAlignment,
      showTitle: config.hero.layout.showTitle,
      showCTA: config.hero.layout.showCTA,
      isActive: true,
    };

    // Extract branding configuration
    const branding = {
      logo: config.branding.logo || null,
      favicon: config.branding.favicon || null,
    };

    // Return without caching for immediate updates
    return NextResponse.json({
      theme,
      heroSection,
      branding,
      message: 'Site customization retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching site customization:', error);

    // Return defaults in case of error
    return NextResponse.json({
      theme: {
        id: 'default',
        name: 'Default Theme',
        primaryColor: '#3B82F6',
        secondaryColor: '#FDE047',
        backgroundColor: '#F8FAFC',
        textColor: '#1E293B',
        isActive: true,
      },
      heroSection: {
        id: 'default',
        title: 'Welcome to JRM E-commerce',
        subtitle: "Malaysia's premier online marketplace",
        description:
          'Intelligent membership benefits, dual pricing, and local payment integration.',
        ctaPrimaryText: 'Join as Member',
        ctaPrimaryLink: '/auth/signup',
        ctaSecondaryText: 'Browse Products',
        ctaSecondaryLink: '/products',
        backgroundType: 'IMAGE' as const,
        backgroundImage: null,
        backgroundVideo: null,
        overlayOpacity: 0.1,
        textAlignment: 'left' as const,
        isActive: true,
      },
      branding: {
        logo: null,
        favicon: null,
      },
      message: 'Using default site customization',
    });
  }
}
