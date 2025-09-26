'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';

// ==================== INTERFACES ====================

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

interface SliderPreviewProps {
  sliderConfig: SliderConfig;
  className?: string;
}

// ==================== COMPONENT ====================

export function SliderPreview({ sliderConfig, className }: SliderPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(sliderConfig.autoAdvance);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeSlides = sliderConfig.slides.filter(slide => slide.isActive);

  // ==================== AUTO-ADVANCE LOGIC ====================

  const startAutoAdvance = useCallback(() => {
    if (!sliderConfig.autoAdvance || activeSlides.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    }, sliderConfig.interval);
  }, [sliderConfig.autoAdvance, sliderConfig.interval, activeSlides.length]);

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

  // ==================== NAVIGATION HANDLERS ====================

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    if (sliderConfig.autoAdvance && isPlaying) {
      stopAutoAdvance();
      startAutoAdvance(); // Restart the timer
    }
  }, [sliderConfig.autoAdvance, isPlaying, stopAutoAdvance, startAutoAdvance]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentSlide === 0 ? activeSlides.length - 1 : currentSlide - 1;
    goToSlide(newIndex);
  }, [currentSlide, activeSlides.length, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = (currentSlide + 1) % activeSlides.length;
    goToSlide(newIndex);
  }, [currentSlide, activeSlides.length, goToSlide]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (sliderConfig.autoAdvance && isPlaying && !isPaused && activeSlides.length > 1) {
      startAutoAdvance();
    } else {
      stopAutoAdvance();
    }

    return stopAutoAdvance;
  }, [sliderConfig.autoAdvance, isPlaying, isPaused, activeSlides.length, startAutoAdvance, stopAutoAdvance]);

  useEffect(() => {
    // Reset current slide if it's beyond the active slides range
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, activeSlides.length]);

  useEffect(() => {
    setIsPlaying(sliderConfig.autoAdvance);
  }, [sliderConfig.autoAdvance]);

  // ==================== RENDER ====================

  if (!sliderConfig.enabled || activeSlides.length === 0) {
    return (
      <div className={cn(
        "relative w-full h-64 bg-muted rounded-lg flex items-center justify-center",
        className
      )}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium">Slider Preview</div>
          <div className="text-sm">
            {!sliderConfig.enabled
              ? "Enable slider mode to see preview"
              : "Add slides to see preview"
            }
          </div>
        </div>
      </div>
    );
  }

  const currentSlideData = activeSlides[currentSlide];

  return (
    <div
      className={cn("relative w-full h-64 rounded-lg overflow-hidden bg-muted group", className)}
      onMouseEnter={() => sliderConfig.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => sliderConfig.pauseOnHover && setIsPaused(false)}
    >
      {/* Slide Images */}
      <div className="relative w-full h-full">
        <div
          className="flex w-full h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {activeSlides.map((slide, index) => (
            <div key={slide.id} className="min-w-full h-full relative">
              <Image
                src={slide.imageUrl}
                alt={slide.altText || `Slide ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={index === currentSlide}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {sliderConfig.showArrows && activeSlides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Navigation Dots */}
      {sliderConfig.showDots && activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause Control */}
      {sliderConfig.autoAdvance && activeSlides.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAutoAdvance}
          className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isPlaying && !isPaused ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Slide Counter */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/20 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {currentSlide + 1} / {activeSlides.length}
      </div>

      {/* Pause Indicator */}
      {isPaused && sliderConfig.autoAdvance && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
          Paused
        </div>
      )}

      {/* Preview Mode Indicator */}
      <div className="absolute bottom-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        Preview Mode
      </div>
    </div>
  );
}