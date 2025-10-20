/**
 * Stepper Component - JRM E-commerce Platform
 * Reusable stepper with arrow navigation following @CLAUDE.md principles
 * - No hardcoding - fully configurable
 * - DRY approach - single source of truth
 * - Centralized design - consistent across application
 */

'use client';

import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'vertical';
  showArrows?: boolean;
  showStatus?: boolean;
  allowClickNavigation?: boolean;
}

/**
 * Reusable Stepper Component
 * Supports multiple variants and configurations
 */
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
  variant = 'default',
  showArrows = true,
  showStatus = true,
  allowClickNavigation = true,
}: StepperProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  const getStepStatusColor = (step: StepperStep, index: number): string => {
    const baseClasses = 'transition-colors duration-200';

    switch (step.status) {
      case 'completed':
        return `${baseClasses} bg-green-600 text-white border-green-600`;
      case 'active':
        return `${baseClasses} bg-blue-600 text-white border-blue-600`;
      case 'error':
        return `${baseClasses} bg-red-600 text-white border-red-600`;
      case 'pending':
      default:
        return `${baseClasses} bg-gray-100 text-gray-600 border-gray-300`;
    }
  };

  const getStepContent = (step: StepperStep, index: number) => {
    if (step.status === 'completed' && showStatus) {
      return <Check className="w-4 h-4" />;
    }
    if (step.icon) {
      return step.icon;
    }
    return index + 1;
  };

  const handleStepClick = (step: StepperStep) => {
    if (allowClickNavigation && !step.disabled && onStepClick) {
      onStepClick(step.id);
    }
  };

  const getStepClickableClass = (step: StepperStep): string => {
    if (allowClickNavigation && !step.disabled && onStepClick) {
      return 'cursor-pointer hover:bg-opacity-80';
    }
    return step.disabled ? 'cursor-not-allowed opacity-50' : '';
  };

  // Vertical variant
  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col space-y-4', className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                getStepStatusColor(step, index),
                getStepClickableClass(step)
              )}
              onClick={() => handleStepClick(step)}
            >
              {getStepContent(step, index)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'active'
                    ? 'text-blue-600'
                    : step.status === 'completed'
                      ? 'text-green-600'
                      : step.status === 'error'
                        ? 'text-red-600'
                        : 'text-gray-700'
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full border text-xs font-medium',
                getStepStatusColor(step, index),
                getStepClickableClass(step)
              )}
              onClick={() => handleStepClick(step)}
              title={step.label}
            >
              {getStepContent(step, index)}
            </div>
            {index < steps.length - 1 && showArrows && (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step Item */}
          <div className="flex flex-col items-center space-y-2 relative">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium z-10 bg-white',
                getStepStatusColor(step, index),
                getStepClickableClass(step)
              )}
              onClick={() => handleStepClick(step)}
            >
              {getStepContent(step, index)}
            </div>
            <div className="text-center">
              <p
                className={cn(
                  'text-sm font-medium whitespace-nowrap',
                  step.status === 'active'
                    ? 'text-blue-600'
                    : step.status === 'completed'
                      ? 'text-green-600'
                      : step.status === 'error'
                        ? 'text-red-600'
                        : 'text-gray-700'
                )}
              >
                {step.label}
              </p>
            </div>
          </div>

          {/* Arrow Connector - positioned between steps at icon level */}
          {index < steps.length - 1 && showArrows && (
            <div
              className="flex-1 flex items-center justify-center px-4"
              style={{ marginTop: '-24px' }}
            >
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    index < currentIndex ? 'bg-green-600' : 'bg-gray-300'
                  )}
                />
                <ChevronRight
                  className={cn(
                    'w-4 h-4 mx-2 flex-shrink-0',
                    index < currentIndex ? 'text-green-600' : 'text-gray-400'
                  )}
                />
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    index < currentIndex ? 'bg-green-600' : 'bg-gray-300'
                  )}
                />
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Hook for managing stepper state
 * Provides centralized state management for stepper components
 */
export function useStepperState(initialSteps: Omit<StepperStep, 'status'>[]) {
  const [steps, setSteps] = React.useState<StepperStep[]>(() =>
    initialSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending',
    }))
  );

  const [currentStep, setCurrentStep] = React.useState(
    initialSteps[0]?.id || ''
  );

  const goToStep = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      return;
    }

    setCurrentStep(stepId);
    setSteps(prev =>
      prev.map((step, index) => ({
        ...step,
        status:
          index < stepIndex
            ? 'completed'
            : index === stepIndex
              ? 'active'
              : 'pending',
      }))
    );
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1].id);
    }
  };

  const markStepAsError = (stepId: string) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status: 'error' } : step
      )
    );
  };

  const markStepAsCompleted = (stepId: string) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status: 'completed' } : step
      )
    );
  };

  return {
    steps,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    markStepAsError,
    markStepAsCompleted,
    currentIndex: steps.findIndex(step => step.id === currentStep),
    isFirstStep: steps.findIndex(step => step.id === currentStep) === 0,
    isLastStep:
      steps.findIndex(step => step.id === currentStep) === steps.length - 1,
  };
}

export default Stepper;
