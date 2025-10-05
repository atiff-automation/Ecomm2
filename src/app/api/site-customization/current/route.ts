/**
 * Public Site Customization API - Malaysian E-commerce Platform
 * Provides current active theme and hero section for frontend
 * Updated to use unified site customization system
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { siteCustomizationService } from '@/lib/services/site-customization.service';

/**
 * GET /api/site-customization/current - Get current active theme and hero section
 */
export async function GET() {
  try {
    console.error('🔍 GET /api/site-customization/current - Starting...');

    // Get current configuration from unified system
    const config = await siteCustomizationService.getConfiguration();

    console.error('✅ Configuration retrieved:', JSON.stringify({
      hasHero: !!config.hero,
      heroTitle: config.hero?.title,
      heroBackground: config.hero?.background,
      fullHero: config.hero
    }, null, 2));

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

    // Debug logging (using console.error so it appears in Railway logs)
    console.error('🔍 API - config.hero.background:', JSON.stringify(config.hero.background));
    console.error('🔍 API - Transformed heroSection:', JSON.stringify({
      backgroundType: heroSection.backgroundType,
      backgroundImage: heroSection.backgroundImage,
      backgroundVideo: heroSection.backgroundVideo,
      title: heroSection.title,
      subtitle: heroSection.subtitle
    }));

    // Extract branding configuration
    const branding = {
      logo: config.branding.logo || null,
      favicon: config.branding.favicon || null,
    };

    // Extract slider configuration from hero.slider
    const sliderConfig = config.hero?.slider || null;

    // Return without caching for immediate updates
    return NextResponse.json({
      theme,
      heroSection,
      branding,
      sliderConfig,
      message: 'Site customization retrieved successfully',
    });
  } catch (error) {
    console.error('❌ ERROR in /api/site-customization/current:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return defaults in case of error WITH ERROR INFO
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
        title: '',
        subtitle: '',
        description: '',
        ctaPrimaryText: '',
        ctaPrimaryLink: '',
        ctaSecondaryText: '',
        ctaSecondaryLink: '',
        backgroundType: 'IMAGE' as const,
        backgroundImage: null,
        backgroundVideo: null,
        overlayOpacity: 0.1,
        textAlignment: 'left' as const,
        showTitle: true,
        showCTA: true,
        isActive: true,
      },
      branding: {
        logo: null,
        favicon: null,
      },
      sliderConfig: null,
      message: 'Using default site customization',
      _error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      }
    });
  }
}
