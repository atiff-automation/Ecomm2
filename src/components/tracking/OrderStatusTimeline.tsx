'use client';

import React from 'react';
import { OrderStatus } from '@prisma/client';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_TIMELINE,
  TIMELINE_STAGES,
} from '@/lib/config/tracking-simple';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

/**
 * OrderStatusTimeline Component
 *
 * Displays a 5-stage visual timeline of order progress
 * Following @CLAUDE.md: Single Responsibility, DRY, Type Safety
 *
 * @param currentStatus - Current order status from database
 */
export function OrderStatusTimeline({
  currentStatus,
  className,
}: OrderStatusTimelineProps) {
  // Get current stage number (1-5) or null
  const currentStage = ORDER_STATUS_TIMELINE[currentStatus];

  // Don't show timeline for statuses not on timeline
  if (currentStage === null) {
    return null;
  }

  return (
    <div className={cn('w-full py-6', className)}>
      {/* Timeline visualization */}
      <div className="flex items-start justify-between relative px-4 md:px-0">
        {TIMELINE_STAGES.map((stage, index) => {
          const isCompletedOrCurrent = currentStage >= stage.number;
          const isPending = currentStage < stage.number;
          const isLast = index === TIMELINE_STAGES.length - 1;

          return (
            <React.Fragment key={stage.number}>
              {/* Stage indicator */}
              <div className="flex flex-col items-center relative z-10 flex-shrink-0">
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-white',
                    {
                      'border-2 border-green-500': isCompletedOrCurrent,
                      'border-2 border-gray-300': isPending,
                    }
                  )}
                >
                  {isCompletedOrCurrent && (
                    <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
                  )}
                  {isPending && (
                    <Circle className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center mt-3 w-16 md:w-20">
                  <p
                    className={cn(
                      'text-[10px] md:text-xs font-medium leading-tight break-words',
                      {
                        'text-green-700': isCompletedOrCurrent,
                        'text-gray-500': isPending,
                      }
                    )}
                  >
                    {stage.label}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex items-center flex-1 px-1 md:px-2 pt-5">
                  <div
                    className={cn('w-full h-0.5 transition-all duration-300', {
                      'bg-green-500': currentStage > stage.number,
                      'bg-gray-300': currentStage <= stage.number,
                    })}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
