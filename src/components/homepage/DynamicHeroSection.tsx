'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface SiteTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

interface HeroSlide {
  id: string;
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
}

interface SliderConfig {
  enabled: boolean;
  autoAdvance: boolean;
  interval: number;
  showDots: boolean;
  showArrows: boolean;
  pauseOnHover: boolean;
  slides: HeroSlide[];
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
  sliderConfig?: SliderConfig | null;
  isLoggedIn: boolean;
  isMember: boolean;
}

export const DynamicHeroSection: React.FC<DynamicHeroSectionProps> = ({
  heroSection,
  siteTheme,
  sliderConfig,
  isLoggedIn,
  isMember,
}) => {
  // Slider state management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if slider mode is enabled and get active slides
  const isSliderMode = sliderConfig?.enabled && sliderConfig.slides.length > 0;
  const activeSlides = isSliderMode
    ? sliderConfig.slides.filter(slide => slide.isActive).sort((a, b) => a.order - b.order)
    : [];

  // Auto-advance functionality
  const startAutoAdvance = useCallback(() => {
    if (!sliderConfig?.autoAdvance || activeSlides.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    }, sliderConfig.interval);
  }, [sliderConfig?.autoAdvance, sliderConfig?.interval, activeSlides.length]);

  const stopAutoAdvance = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleAutoAdvance = useCallback(() => {
    if (isPlaying) {
      stopAutoAdvance();
      setIsPlaying(false);
    } else {
      startAutoAdvance();
      setIsPlaying(true);
    }
  }, [isPlaying, startAutoAdvance, stopAutoAdvance]);

  // Navigation handlers
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    if (sliderConfig?.autoAdvance && isPlaying) {
      stopAutoAdvance();
      startAutoAdvance(); // Restart the timer
    }
  }, [sliderConfig?.autoAdvance, isPlaying, stopAutoAdvance, startAutoAdvance]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentSlide === 0 ? activeSlides.length - 1 : currentSlide - 1;
    goToSlide(newIndex);
  }, [currentSlide, activeSlides.length, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = (currentSlide + 1) % activeSlides.length;
    goToSlide(newIndex);
  }, [currentSlide, activeSlides.length, goToSlide]);

  // Touch/swipe gesture handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeSlides.length > 1) {
      goToNext();
    }
    if (isRightSwipe && activeSlides.length > 1) {
      goToPrevious();
    }
  };

  // Effects
  useEffect(() => {
    if (sliderConfig?.autoAdvance && !isPaused && activeSlides.length > 1) {
      setIsPlaying(true);
      startAutoAdvance();
    } else {
      setIsPlaying(false);
      stopAutoAdvance();
    }

    return stopAutoAdvance;
  }, [sliderConfig?.autoAdvance, isPaused, activeSlides.length, startAutoAdvance, stopAutoAdvance]);

  useEffect(() => {
    // Reset current slide if it's beyond the active slides range
    if (currentSlide >= activeSlides.length && activeSlides.length > 0) {
      setCurrentSlide(0);
    }
  }, [currentSlide, activeSlides.length]);

  // Debug logging
  React.useEffect(() => {
    if (heroSection) {
      console.log('🎭 DynamicHeroSection - heroSection prop:', heroSection);
      console.log('🖼️ DynamicHeroSection - backgroundImage:', heroSection.backgroundImage);
      console.log('🎬 DynamicHeroSection - backgroundType:', heroSection.backgroundType);
      console.log('✅ DynamicHeroSection - Condition check:', {
        hasBackgroundImage: !!heroSection.backgroundImage,
        isImageType: heroSection.backgroundType === 'IMAGE',
        bothTrue: !!heroSection.backgroundImage && heroSection.backgroundType === 'IMAGE',
      });
    } else {
      console.log('⚠️ DynamicHeroSection - heroSection is null/undefined');
    }
  }, [heroSection]);

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
      className="relative text-white min-h-[700px] flex items-center group"
      style={backgroundStyle}
      onTouchStart={isSliderMode ? onTouchStart : undefined}
      onTouchMove={isSliderMode ? onTouchMove : undefined}
      onTouchEnd={isSliderMode ? onTouchEnd : undefined}
      onMouseEnter={isSliderMode && sliderConfig?.pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={isSliderMode && sliderConfig?.pauseOnHover ? () => setIsPaused(false) : undefined}
    >
      {/* Background Media */}
      {isSliderMode && activeSlides.length > 0 ? (
        /* Slider Mode - Carousel Background */
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="flex w-full h-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {activeSlides.map((slide, index) => (
              <div key={slide.id} className="min-w-full h-full relative">
                <Image
                  src={slide.imageUrl}
                  alt={slide.altText || `Hero slide ${index + 1}`}
                  fill
                  className="object-cover object-center"
                  priority={index === currentSlide}
                  sizes="100vw"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Traditional Mode - Single Background */
        <>
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
        </>
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

      {/* Slider Navigation Controls */}
      {isSliderMode && activeSlides.length > 1 && (
        <>
          {/* Navigation Arrows */}
          {sliderConfig?.showArrows && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Navigation Dots */}
          {sliderConfig?.showDots && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    index === currentSlide
                      ? "bg-white scale-125"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Play/Pause Control */}
          {sliderConfig?.autoAdvance && (
            <button
              onClick={toggleAutoAdvance}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label={isPlaying && !isPaused ? "Pause slideshow" : "Play slideshow"}
            >
              {isPlaying && !isPaused ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Slide Counter */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/20 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {currentSlide + 1} / {activeSlides.length}
          </div>

          {/* Pause Indicator */}
          {isPaused && sliderConfig?.autoAdvance && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
              Paused
            </div>
          )}
        </>
      )}
    </section>
  );
};
