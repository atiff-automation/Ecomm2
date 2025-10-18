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
      <div className="flex items-center justify-between relative">
        {TIMELINE_STAGES.map((stage, index) => {
          const isCompleted = currentStage > stage.number;
          const isCurrent = currentStage === stage.number;
          const isPending = currentStage < stage.number;
          const isLast = index === TIMELINE_STAGES.length - 1;

          return (
            <React.Fragment key={stage.number}>
              {/* Stage indicator */}
              <div className="flex flex-col items-center relative z-10">
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    {
                      'bg-green-100 border-2 border-green-500': isCompleted,
                      'bg-blue-100 border-2 border-blue-500 animate-pulse': isCurrent,
                      'bg-gray-100 border-2 border-gray-300': isPending,
                    }
                  )}
                >
                  {isCompleted && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                  {isCurrent && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  )}
                  {isPending && (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center mt-2 max-w-[80px]">
                  <p
                    className={cn('text-xs font-medium leading-tight', {
                      'text-green-700': isCompleted,
                      'text-blue-700': isCurrent,
                      'text-gray-500': isPending,
                    })}
                  >
                    {stage.label}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-all duration-300',
                    {
                      'bg-green-500': currentStage > stage.number,
                      'bg-gray-300 border-t-2 border-dashed': currentStage <= stage.number,
                    }
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
