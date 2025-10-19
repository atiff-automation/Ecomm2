/**
 * Hero Slider Component - JRM E-commerce Platform
 * Modern hero slider with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

export interface HeroSlide {
  id: string;
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
}

export interface SliderConfig {
  enabled: boolean;
  autoAdvance: boolean;
  interval: number;
  showDots: boolean;
  showArrows: boolean;
  pauseOnHover: boolean;
  slides: HeroSlide[];
}

export interface HeroSliderProps {
  slides: HeroSlide[];
  config?: Partial<SliderConfig>;
  className?: string;
  onSlideChange?: (index: number) => void;
  children?: React.ReactNode;
}

const defaultConfig: SliderConfig = {
  enabled: true,
  autoAdvance: true,
  interval: 5000,
  showDots: true,
  showArrows: true,
  pauseOnHover: true,
  slides: [],
};

export function HeroSlider({
  slides,
  config,
  className,
  onSlideChange,
  children,
}: HeroSliderProps) {
  const sliderConfig = { ...defaultConfig, ...config, slides };
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get active slides and sort by order
  const activeSlides = slides
    .filter(slide => slide.isActive)
    .sort((a, b) => a.order - b.order);

  const hasMultipleSlides = activeSlides.length > 1;

  // Auto-advance functionality
  const startAutoAdvance = useCallback(() => {
    if (!sliderConfig.autoAdvance || !hasMultipleSlides) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    }, sliderConfig.interval);
  }, [
    sliderConfig.autoAdvance,
    sliderConfig.interval,
    activeSlides.length,
    hasMultipleSlides,
  ]);

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
  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentSlide || isTransitioning) {
        return;
      }

      setIsTransitioning(true);
      setCurrentSlide(index);
      onSlideChange?.(index);

      // Reset transition state
      setTimeout(() => setIsTransitioning(false), 300);

      // Restart auto-advance if active
      if (sliderConfig.autoAdvance && isPlaying) {
        stopAutoAdvance();
        startAutoAdvance();
      }
    },
    [
      currentSlide,
      isTransitioning,
      onSlideChange,
      sliderConfig.autoAdvance,
      isPlaying,
      stopAutoAdvance,
      startAutoAdvance,
    ]
  );

  const goToPrevious = useCallback(() => {
    if (!hasMultipleSlides) {
      return;
    }
    const newIndex =
      currentSlide === 0 ? activeSlides.length - 1 : currentSlide - 1;
    goToSlide(newIndex);
  }, [currentSlide, activeSlides.length, hasMultipleSlides, goToSlide]);

  const goToNext = useCallback(() => {
    if (!hasMultipleSlides) {
      return;
    }
    const newIndex = (currentSlide + 1) % activeSlides.length;
    goToSlide(newIndex);
  }, [currentSlide, activeSlides.length, hasMultipleSlides, goToSlide]);

  // Touch/swipe gesture handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !hasMultipleSlides) {
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!hasMultipleSlides) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          toggleAutoAdvance();
          break;
      }
    },
    [hasMultipleSlides, goToPrevious, goToNext, toggleAutoAdvance]
  );

  // Effects
  useEffect(() => {
    if (sliderConfig.autoAdvance && !isPaused && hasMultipleSlides) {
      setIsPlaying(true);
      startAutoAdvance();
    } else {
      setIsPlaying(false);
      stopAutoAdvance();
    }

    return stopAutoAdvance;
  }, [
    sliderConfig.autoAdvance,
    isPaused,
    hasMultipleSlides,
    startAutoAdvance,
    stopAutoAdvance,
  ]);

  useEffect(() => {
    // Reset current slide if it's beyond the active slides range
    if (currentSlide >= activeSlides.length && activeSlides.length > 0) {
      setCurrentSlide(0);
    }
  }, [currentSlide, activeSlides.length]);

  useEffect(() => {
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (activeSlides.length === 0) {
    return (
      <div
        className={cn(
          'relative min-h-[600px] flex items-center justify-center',
          'bg-gradient-to-br from-primary/20 to-primary/10',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <p>No slides available</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden group',
        'min-h-[600px] lg:min-h-[700px]',
        className
      )}
      onTouchStart={hasMultipleSlides ? onTouchStart : undefined}
      onTouchMove={hasMultipleSlides ? onTouchMove : undefined}
      onTouchEnd={hasMultipleSlides ? onTouchEnd : undefined}
      onMouseEnter={
        hasMultipleSlides && sliderConfig.pauseOnHover
          ? () => setIsPaused(true)
          : undefined
      }
      onMouseLeave={
        hasMultipleSlides && sliderConfig.pauseOnHover
          ? () => setIsPaused(false)
          : undefined
      }
      role="region"
      aria-label="Hero image carousel"
      aria-live="polite"
    >
      {/* Slides Container */}
      <div className="absolute inset-0">
        <div
          className={cn(
            'flex w-full h-full',
            'transition-transform duration-300 ease-out',
            isTransitioning && 'duration-300'
          )}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {activeSlides.map((slide, index) => (
            <div
              key={slide.id}
              className="min-w-full h-full relative"
              aria-hidden={index !== currentSlide}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.altText || `Hero slide ${index + 1}`}
                fill
                className="object-cover object-center"
                priority={index === 0 || index === currentSlide}
                sizes="100vw"
                quality={90}
              />
              {/* Image overlay for better text readability */}
              <div className="absolute inset-0 bg-black/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full">{children}</div>

      {/* Navigation Controls */}
      {hasMultipleSlides && (
        <>
          {/* Navigation Arrows */}
          {sliderConfig.showArrows && (
            <>
              <button
                onClick={goToPrevious}
                className={cn(
                  'absolute left-4 lg:left-6 top-1/2 -translate-y-1/2',
                  'w-12 h-12 lg:w-14 lg:h-14 rounded-full',
                  'bg-black/20 hover:bg-black/40 backdrop-blur-sm',
                  'text-white transition-all duration-200',
                  'opacity-0 group-hover:opacity-100',
                  'flex items-center justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  'hover:scale-110 active:scale-95'
                )}
                aria-label="Previous slide"
                disabled={isTransitioning}
              >
                <ChevronLeft className="h-6 w-6 lg:h-7 lg:w-7" />
              </button>

              <button
                onClick={goToNext}
                className={cn(
                  'absolute right-4 lg:right-6 top-1/2 -translate-y-1/2',
                  'w-12 h-12 lg:w-14 lg:h-14 rounded-full',
                  'bg-black/20 hover:bg-black/40 backdrop-blur-sm',
                  'text-white transition-all duration-200',
                  'opacity-0 group-hover:opacity-100',
                  'flex items-center justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  'hover:scale-110 active:scale-95'
                )}
                aria-label="Next slide"
                disabled={isTransitioning}
              >
                <ChevronRight className="h-6 w-6 lg:h-7 lg:w-7" />
              </button>
            </>
          )}

          {/* Navigation Dots */}
          {sliderConfig.showDots && (
            <div className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'w-3 h-3 lg:w-4 lg:h-4 rounded-full transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    'hover:scale-125',
                    index === currentSlide
                      ? 'bg-white scale-125 shadow-lg'
                      : 'bg-white/50 hover:bg-white/75'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                  disabled={isTransitioning}
                />
              ))}
            </div>
          )}

          {/* Play/Pause Control */}
          {sliderConfig.autoAdvance && (
            <button
              onClick={toggleAutoAdvance}
              className={cn(
                'absolute top-4 lg:top-6 right-4 lg:right-6',
                'w-10 h-10 lg:w-12 lg:h-12 rounded-full',
                'bg-black/20 hover:bg-black/40 backdrop-blur-sm',
                'text-white transition-all duration-200',
                'opacity-0 group-hover:opacity-100',
                'flex items-center justify-center',
                'focus:outline-none focus:ring-2 focus:ring-white/50',
                'hover:scale-110 active:scale-95'
              )}
              aria-label={
                isPlaying && !isPaused ? 'Pause slideshow' : 'Play slideshow'
              }
            >
              {isPlaying && !isPaused ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>
          )}

          {/* Slide Counter */}
          <div
            className={cn(
              'absolute top-4 lg:top-6 left-4 lg:left-6',
              'px-3 py-1.5 bg-black/20 backdrop-blur-sm',
              'text-white text-sm lg:text-base rounded-lg',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
            )}
          >
            {currentSlide + 1} / {activeSlides.length}
          </div>

          {/* Pause Indicator */}
          {isPaused && sliderConfig.autoAdvance && (
            <div
              className={cn(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                'bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg',
                'text-sm lg:text-base font-medium',
                'animate-in fade-in duration-200'
              )}
            >
              Paused
            </div>
          )}
        </>
      )}

      {/* Loading indicator for transitions */}
      {isTransitioning && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white animate-pulse" />
        </div>
      )}
    </div>
  );
}

export default HeroSlider;
