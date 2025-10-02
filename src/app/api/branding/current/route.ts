/**

export const dynamic = 'force-dynamic';

 * Current Branding API - Serves current logo/favicon information from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get the active theme from database
    const activeTheme = await prisma.siteTheme.findFirst({
      where: {
        isActive: true
      },
      select: {
        logoUrl: true,
        faviconUrl: true,
        logoWidth: true,
        logoHeight: true,
        primaryColor: true,
        secondaryColor: true,
        backgroundColor: true,
        textColor: true,
      }
    });

    if (activeTheme) {
      return NextResponse.json({
        logoUrl: activeTheme.logoUrl,
        faviconUrl: activeTheme.faviconUrl,
        logoWidth: activeTheme.logoWidth,
        logoHeight: activeTheme.logoHeight,
        primaryColor: activeTheme.primaryColor,
        secondaryColor: activeTheme.secondaryColor,
        backgroundColor: activeTheme.backgroundColor,
        textColor: activeTheme.textColor,
      });
    }

    // If no active theme exists, create a default one
    const defaultTheme = await prisma.siteTheme.create({
      data: {
        name: 'Default Theme',
        isActive: true,
      },
    });

    return NextResponse.json({
      logoUrl: defaultTheme.logoUrl,
      faviconUrl: defaultTheme.faviconUrl,
      logoWidth: defaultTheme.logoWidth,
      logoHeight: defaultTheme.logoHeight,
      primaryColor: defaultTheme.primaryColor,
      secondaryColor: defaultTheme.secondaryColor,
      backgroundColor: defaultTheme.backgroundColor,
      textColor: defaultTheme.textColor,
    });
  } catch (error) {
    console.error('Error getting current branding:', error);
    return NextResponse.json(
      { 
        logoUrl: null, 
        faviconUrl: null, 
        logoWidth: 120, 
        logoHeight: 40,
        primaryColor: '#3B82F6',
        secondaryColor: '#FDE047',
        backgroundColor: '#F8FAFC',
        textColor: '#1E293B',
      },
      { status: 500 }
    );
  }
}