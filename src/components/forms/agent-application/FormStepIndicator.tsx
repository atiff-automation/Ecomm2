/**
 * Form Step Indicator Component
 * Visual progress indicator for multi-step form
 * Following CLAUDE.md principles: Reusable, responsive design
 */

import React from 'react';
import { FORM_STEPS, STEP_LABELS } from '@/lib/config/agent-application-form';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface FormStepIndicatorProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function FormStepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
  className
}: FormStepIndicatorProps) {
  return (
    <div className={cn('w-full mb-8', className)}>
      {/* Mobile View - Compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-gray-600">Langkah</span>
          <span className="font-semibold text-green-600">
            {currentStep + 1}
          </span>
          <span className="text-sm text-gray-600">daripada</span>
          <span className="font-semibold">{FORM_STEPS.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Current Step Title */}
        <div className="text-center mt-4">
          <h3 className="font-semibold text-lg text-gray-900">
            {FORM_STEPS[currentStep]?.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {FORM_STEPS[currentStep]?.description}
          </p>
        </div>
      </div>

      {/* Desktop View - Full Steps */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {FORM_STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isClickable = isCompleted || index <= currentStep;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isClickable && onStepClick?.(index)}
                    disabled={!isClickable}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                      {
                        'bg-green-600 border-green-600 text-white': isCompleted,
                        'bg-blue-600 border-blue-600 text-white': isCurrent && !isCompleted,
                        'border-gray-300 text-gray-400': !isCurrent && !isCompleted,
                        'cursor-pointer hover:border-blue-400': isClickable && !isCurrent,
                        'cursor-not-allowed': !isClickable
                      }
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <span className="font-semibold">{index + 1}</span>
                    )}
                  </button>

                  {/* Step Label */}
                  <div className="mt-3 text-center max-w-[120px]">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        {
                          'text-green-600': isCompleted,
                          'text-blue-600': isCurrent && !isCompleted,
                          'text-gray-600': !isCurrent && !isCompleted
                        }
                      )}
                    >
                      {STEP_LABELS[step.id as keyof typeof STEP_LABELS]}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < FORM_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-all',
                      {
                        'bg-green-600': completedSteps.has(index),
                        'bg-gray-300': !completedSteps.has(index)
                      }
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Description */}
        <div className="mt-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {FORM_STEPS[currentStep]?.title}
          </h3>
          <p className="text-gray-600">
            {FORM_STEPS[currentStep]?.description}
          </p>
        </div>
      </div>
    </div>
  );
}