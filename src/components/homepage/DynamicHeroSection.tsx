'use client';

import React from 'react';
import Image from 'next/image';

interface SiteTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

interface HeroSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  backgroundType: 'IMAGE' | 'VIDEO';
  backgroundImage?: string | null;
  backgroundVideo?: string | null;
  overlayOpacity: number;
  textAlignment: 'left' | 'center' | 'right';
  showTitle: boolean;
  showCTA: boolean;
  isActive: boolean;
}

interface DynamicHeroSectionProps {
  heroSection: HeroSection | null;
  siteTheme: SiteTheme | null;
  isLoggedIn: boolean;
  isMember: boolean;
}

export const DynamicHeroSection: React.FC<DynamicHeroSectionProps> = ({
  heroSection,
  siteTheme,
  isLoggedIn,
  isMember,
}) => {
  // Use defaults if no data, but preserve backgroundImage if provided
  const hero = heroSection
    ? {
        ...heroSection,
      }
    : {
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
      };

  const theme = siteTheme || {
    id: 'default',
    name: 'Default Theme',
    primaryColor: '#3B82F6',
    secondaryColor: '#FDE047',
    backgroundColor: '#F8FAFC',
    textColor: '#1E293B',
    isActive: true,
  };

  // Convert hex to RGB for opacity calculations
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const primaryRgb = hexToRgb(theme.primaryColor);
  const secondaryRgb = hexToRgb(theme.secondaryColor);

  const gradientStyle = primaryRgb
    ? `linear-gradient(to bottom right, rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}), rgb(${Math.max(primaryRgb.r - 30, 0)}, ${Math.max(primaryRgb.g - 30, 0)}, ${Math.max(primaryRgb.b - 30, 0)}))`
    : 'linear-gradient(to bottom right, #3B82F6, #1E40AF)';

  const backgroundStyle: React.CSSProperties = {
    background:
      hero.backgroundImage || hero.backgroundVideo
        ? 'transparent'
        : gradientStyle,
  };

  return (
    <section
      className="relative text-white min-h-[700px] flex items-center"
      style={backgroundStyle}
    >
      {/* Background Media */}
      {hero.backgroundImage && hero.backgroundType === 'IMAGE' && (
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={hero.backgroundImage}
            alt="Hero background"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
      )}

      {hero.backgroundVideo && hero.backgroundType === 'VIDEO' && (
        <div className="absolute inset-0 overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={hero.backgroundVideo} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: hero.overlayOpacity }}
      />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div
          className={`max-w-4xl ${
            hero.textAlignment === 'center'
              ? 'mx-auto text-center'
              : hero.textAlignment === 'right'
              ? 'ml-auto text-right'
              : ''
          }`}
        >
          {/* Title Section - Only show if enabled */}
          {hero.showTitle && (
            <>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                {hero.title}
              </h1>

              <p className="text-xl md:text-2xl mb-6 text-blue-100">
                {hero.subtitle}
              </p>

              <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl">
                {hero.description}
              </p>
            </>
          )}

          {/* CTA Buttons - Only show if enabled */}
          {hero.showCTA && (
            <div
              className={`flex flex-col sm:flex-row gap-4 ${
                hero.textAlignment === 'center'
                  ? 'justify-center'
                  : hero.textAlignment === 'right'
                  ? 'justify-end'
                  : ''
              }`}
            >
              {hero.ctaPrimaryText && (
                <a
                  href={hero.ctaPrimaryLink}
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold rounded-lg transition-colors"
                  style={{
                    backgroundColor: theme.secondaryColor,
                    color: theme.textColor,
                  }}
                  onMouseEnter={(e) => {
                    if (secondaryRgb) {
                      e.currentTarget.style.backgroundColor = `rgb(${Math.max(
                        secondaryRgb.r - 20,
                        0
                      )}, ${Math.max(secondaryRgb.g - 20, 0)}, ${Math.max(
                        secondaryRgb.b - 20,
                        0
                      )})`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.secondaryColor;
                  }}
                >
                  {hero.ctaPrimaryText}
                </a>
              )}

              {hero.ctaSecondaryText && (
                <a
                  href={hero.ctaSecondaryLink}
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold rounded-lg border-2 border-white text-white hover:bg-white hover:text-blue-900 transition-colors"
                >
                  {hero.ctaSecondaryText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
