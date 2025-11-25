'use client';

/**
 * Countdown Timer Block Component
 * Urgency timer for promotions
 * Inherits color from parent wrapper for style customization
 */

import { useState, useEffect } from 'react';
import type { CountdownTimerBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface CountdownTimerBlockComponentProps {
  block: CountdownTimerBlock;
  onCtaClick?: (targetUrl?: string) => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(endDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isExpired: false,
  };
}

export function CountdownTimerBlockComponent({
  block,
}: CountdownTimerBlockComponentProps) {
  const { settings } = block;
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(settings.endDate)
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(settings.endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.endDate]);

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  return (
    <div style={{ color: 'inherit' }}>
      <div className={cn('text-center', getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.COUNTDOWN_TIMER))}>
        {settings.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: 'inherit' }}>
            {settings.title}
          </h2>
        )}

        {settings.message && (
          <p className="mb-6 opacity-80" style={{ color: 'inherit' }}>{settings.message}</p>
        )}

        {!mounted ? (
          <div className="flex justify-center gap-4">
            {settings.showDays && (
              <TimeUnit value={0} label="Days" />
            )}
            {settings.showHours && (
              <TimeUnit value={0} label="Hours" />
            )}
            {settings.showMinutes && (
              <TimeUnit value={0} label="Minutes" />
            )}
            {settings.showSeconds && (
              <TimeUnit value={0} label="Seconds" />
            )}
          </div>
        ) : timeRemaining.isExpired ? (
          <p className="text-xl font-semibold opacity-70" style={{ color: 'inherit' }}>
            {settings.expiredMessage || 'Offer has ended'}
          </p>
        ) : (
          <div className="flex justify-center gap-4">
            {settings.showDays && (
              <TimeUnit value={timeRemaining.days} label="Days" />
            )}
            {settings.showHours && (
              <TimeUnit value={timeRemaining.hours} label="Hours" />
            )}
            {settings.showMinutes && (
              <TimeUnit value={timeRemaining.minutes} label="Minutes" />
            )}
            {settings.showSeconds && (
              <TimeUnit value={timeRemaining.seconds} label="Seconds" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimeUnitProps {
  value: number;
  label: string;
}

function TimeUnit({ value, label }: TimeUnitProps) {
  return (
    <div className="flex flex-col items-center" style={{ color: 'inherit' }}>
      <div
        className={cn(
          'bg-white/10 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center',
          'w-20 h-20'
        )}
      >
        <span className="font-bold text-3xl" style={{ color: 'inherit' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-sm opacity-70" style={{ color: 'inherit' }}>{label}</span>
    </div>
  );
}

export default CountdownTimerBlockComponent;
