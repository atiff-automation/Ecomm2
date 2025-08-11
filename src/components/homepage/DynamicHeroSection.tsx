'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Award } from 'lucide-react';
import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
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
  // Use defaults if no data
  const hero = heroSection || {
    id: 'default',
    title: 'Welcome to JRM E-commerce',
    subtitle: "Malaysia's premier online marketplace",
    description: 'Intelligent membership benefits, dual pricing, and local payment integration.',
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
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const primaryRgb = hexToRgb(theme.primaryColor);
  const secondaryRgb = hexToRgb(theme.secondaryColor);

  const gradientStyle = primaryRgb
    ? `linear-gradient(to bottom right, rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}), rgb(${Math.max(primaryRgb.r - 30, 0)}, ${Math.max(primaryRgb.g - 30, 0)}, ${Math.max(primaryRgb.b - 30, 0)}))`
    : 'linear-gradient(to bottom right, #3B82F6, #1E40AF)';

  const backgroundStyle: React.CSSProperties = {
    background: hero.backgroundImage || hero.backgroundVideo ? 'transparent' : gradientStyle,
  };

  return (
    <section className="relative text-white min-h-[600px] flex items-center" style={backgroundStyle}>
      {/* Background Media */}
      {hero.backgroundImage && hero.backgroundType === 'IMAGE' && (
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={hero.backgroundImage}
            alt="Hero background"
            fill
            className="object-cover"
            style={{ width: 'auto', height: 'auto' }}
            priority
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

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div 
            className={`space-y-6 ${
              hero.textAlignment === 'center' 
                ? 'text-center mx-auto max-w-2xl' 
                : hero.textAlignment === 'right' 
                ? 'text-right ml-auto' 
                : 'text-left'
            }`}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {hero.title}
            </h1>
            
            {hero.subtitle && (
              <h2 className="text-xl text-blue-100 max-w-lg">
                {hero.subtitle}
              </h2>
            )}

            <p className="text-xl text-blue-100 max-w-lg">
              {hero.description}
            </p>

            {/* Dynamic CTAs based on login status */}
            {!isLoggedIn ? (
              <div className={`flex flex-col sm:flex-row gap-4 ${
                hero.textAlignment === 'center' ? 'justify-center' : 
                hero.textAlignment === 'right' ? 'justify-end' : 'justify-start'
              }`}>
                <Link href={hero.ctaPrimaryLink}>
                  <Button
                    size="lg"
                    style={{
                      backgroundColor: theme.secondaryColor,
                      color: theme.textColor,
                    }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    {hero.ctaPrimaryText}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href={hero.ctaSecondaryLink}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-white border-white hover:bg-white hover:text-blue-800"
                  >
                    {hero.ctaSecondaryText}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className={`flex flex-col sm:flex-row gap-4 ${
                hero.textAlignment === 'center' ? 'justify-center' : 
                hero.textAlignment === 'right' ? 'justify-end' : 'justify-start'
              }`}>
                <Link href="/products">
                  <Button
                    size="lg"
                    style={{
                      backgroundColor: theme.secondaryColor,
                      color: theme.textColor,
                    }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    Shop Now
                    <ShoppingBag className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                {isMember && (
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">
                      Member Benefits Active
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Search Bar */}
            <div className={`max-w-lg mt-6 ${
              hero.textAlignment === 'center' ? 'mx-auto' : 
              hero.textAlignment === 'right' ? 'ml-auto' : 'mx-auto lg:mx-0'
            }`}>
              <SearchBar
                placeholder="Search products, brands, categories..."
                className="w-full"
              />
            </div>
          </div>

          {/* Stats Panel */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: theme.secondaryColor }}
                  >
                    10K+
                  </div>
                  <div className="text-sm text-blue-100">
                    Happy Customers
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: theme.secondaryColor }}
                  >
                    5K+
                  </div>
                  <div className="text-sm text-blue-100">
                    Products
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: theme.secondaryColor }}
                  >
                    50+
                  </div>
                  <div className="text-sm text-blue-100">
                    Categories
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: theme.secondaryColor }}
                  >
                    24/7
                  </div>
                  <div className="text-sm text-blue-100">
                    Support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};