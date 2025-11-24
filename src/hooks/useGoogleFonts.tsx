'use client';

/**
 * Google Fonts Loading Hook
 * Dynamically loads Google Fonts based on theme settings
 */

import React, { useEffect, useRef } from 'react';
import { getGoogleFont, GOOGLE_FONTS } from '@/lib/constants/click-page-style-constants';

/**
 * Generates a Google Fonts API URL for the specified font families
 * @param fontFamilies Array of font family names to load
 * @returns Google Fonts URL string
 */
export function generateGoogleFontsUrl(fontFamilies: string[]): string {
  if (!fontFamilies || fontFamilies.length === 0) return '';

  // Filter to only valid Google fonts
  const validFonts = fontFamilies
    .filter((family) => getGoogleFont(family))
    .map((family) => {
      const font = getGoogleFont(family);
      if (!font) return null;

      // Generate weight string (e.g., "300;400;500;600;700")
      const weights = font.variants.join(';');
      // Encode family name and add weights
      return `family=${encodeURIComponent(family)}:wght@${weights}`;
    })
    .filter(Boolean);

  if (validFonts.length === 0) return '';

  // Build the Google Fonts URL
  return `https://fonts.googleapis.com/css2?${validFonts.join('&')}&display=swap`;
}

/**
 * Hook to load Google Fonts dynamically
 * @param fontFamilies Array of font family names to load
 */
export function useGoogleFonts(fontFamilies: string[]): void {
  const loadedFontsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!fontFamilies || fontFamilies.length === 0) return;

    // Filter out already loaded fonts and non-Google fonts
    const fontsToLoad = fontFamilies.filter(
      (family) => !loadedFontsRef.current.has(family) && getGoogleFont(family)
    );

    if (fontsToLoad.length === 0) return;

    // Generate URL for new fonts
    const url = generateGoogleFontsUrl(fontsToLoad);
    if (!url) return;

    // Check if link already exists
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (existingLink) return;

    // Create and append link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.crossOrigin = 'anonymous';

    // Add fonts to loaded set
    fontsToLoad.forEach((font) => loadedFontsRef.current.add(font));

    document.head.appendChild(link);

    // Cleanup on unmount is optional since fonts should persist
  }, [fontFamilies]);
}

/**
 * Component to load Google Fonts (for use in Server Components)
 * Renders a link tag for the specified fonts
 */
export function GoogleFontsLink({
  fontFamilies,
}: {
  fontFamilies: string[];
}): React.ReactElement | null {
  const url = generateGoogleFontsUrl(fontFamilies);

  if (!url) return null;

  return (
    <link
      rel="stylesheet"
      href={url}
      crossOrigin=""
    />
  );
}

/**
 * Get all unique fonts from theme settings
 * @param themeSettings Theme settings object
 * @returns Array of unique font family names
 */
export function getThemeFonts(themeSettings: {
  fonts?: { heading?: string; body?: string; monospace?: string };
}): string[] {
  if (!themeSettings?.fonts) return [];

  const fonts: string[] = [];

  if (themeSettings.fonts.heading) {
    fonts.push(themeSettings.fonts.heading);
  }
  if (themeSettings.fonts.body) {
    fonts.push(themeSettings.fonts.body);
  }
  if (themeSettings.fonts.monospace) {
    fonts.push(themeSettings.fonts.monospace);
  }

  // Return unique fonts only
  return [...new Set(fonts)];
}

/**
 * Get all fonts used across all blocks in a page
 * @param blocks Array of blocks with potential typography settings
 * @returns Array of unique font family names
 */
export function getBlockFonts(
  blocks: Array<{ settings?: { styles?: { typography?: { fontFamily?: string } } } }>
): string[] {
  if (!blocks || blocks.length === 0) return [];

  const fonts = blocks
    .map((block) => block.settings?.styles?.typography?.fontFamily)
    .filter((font): font is string => Boolean(font));

  return [...new Set(fonts)];
}

/**
 * Preload Google Fonts link tag for better performance
 * Use in document head for critical fonts
 */
export function GoogleFontsPreload({
  fontFamilies,
}: {
  fontFamilies: string[];
}): React.ReactElement | null {
  const url = generateGoogleFontsUrl(fontFamilies);

  if (!url) return null;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="preload"
        as="style"
        href={url}
        crossOrigin=""
      />
      <link
        rel="stylesheet"
        href={url}
        crossOrigin=""
      />
    </>
  );
}
