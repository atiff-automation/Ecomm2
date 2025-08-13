/**
 * Public Site Customization API - Malaysian E-commerce Platform
 * Provides current active theme and hero section for frontend
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/site-customization/current - Get current active theme and hero section
 */
export async function GET() {
  try {
    // Get active theme and hero section in parallel
    const [activeTheme, activeHeroSection] = await Promise.all([
      prisma.siteTheme.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          primaryColor: true,
          secondaryColor: true,
          backgroundColor: true,
          textColor: true,
          isActive: true,
        },
      }),
      prisma.heroSection.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true,
          ctaPrimaryText: true,
          ctaPrimaryLink: true,
          ctaSecondaryText: true,
          ctaSecondaryLink: true,
          backgroundType: true,
          backgroundImage: true,
          backgroundVideo: true,
          overlayOpacity: true,
          textAlignment: true,
          isActive: true,
        },
      }),
    ]);

    // Return default values if none found
    const theme = activeTheme || {
      id: 'default',
      name: 'Default Theme',
      primaryColor: '#3B82F6',
      secondaryColor: '#FDE047',
      backgroundColor: '#F8FAFC',
      textColor: '#1E293B',
      isActive: true,
    };

    const heroSection = activeHeroSection || {
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
    };

    // Return without caching for immediate updates
    return NextResponse.json({
      theme,
      heroSection,
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
      message: 'Using default site customization',
    });
  }
}
