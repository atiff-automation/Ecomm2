/**
 * Agent Application Form - Main Container
 * Multi-step form with persistence and validation
 * Following CLAUDE.md principles: Centralized state management, systematic implementation
 */

'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AgentApplicationFormData } from '@/types/agent-application';
import {
  agentApplicationSchema,
  stepSchemas,
} from '@/lib/validation/agent-application';
import { FORM_STEPS } from '@/lib/config/agent-application-form';
import { useFormPersistence } from './hooks/useFormPersistence';
import { FormStepIndicator } from './FormStepIndicator';
import { FormStepContainer } from './FormStepContainer';
import { TermsStep } from './steps/TermsStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { SocialMediaStep } from './steps/SocialMediaStep';
import { AdditionalInfoStep } from './steps/AdditionalInfoStep';
import { ReviewStep } from './steps/ReviewStep';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface AgentApplicationFormProps {
  userId?: string;
  initialData?: Partial<AgentApplicationFormData>;
  onSuccess?: (applicationId: string) => void;
  onError?: (error: string) => void;
}

export function AgentApplicationForm({
  userId,
  initialData,
}: Omit<AgentApplicationFormProps, 'onSuccess' | 'onError'>) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form persistence hooks
  const {
    saveFormData,
    loadFormData,
    clearFormData,
    hasSavedData,
    useAutoSave,
  } = useFormPersistence();

  // React Hook Form setup
  const form = useForm<AgentApplicationFormData>({
    resolver: zodResolver(agentApplicationSchema),
    defaultValues: {
      acceptTerms: false,
      fullName: '',
      icNumber: '',
      phoneNumber: '',
      email: '',
      address: '',
      age: undefined,
      hasBusinessExp: false,
      businessLocation: '',
      hasTeamLeadExp: false,
      isRegistered: false,
      jenis: undefined,
      instagramHandle: '',
      facebookHandle: '',
      tiktokHandle: '',
      instagramLevel: undefined,
      facebookLevel: undefined,
      tiktokLevel: undefined,
      hasJrmExp: false,
      jrmProducts: '',
      reasonToJoin: '',
      expectations: '',
      finalAgreement: false,
      ...initialData,
    },
    mode: 'onChange',
  });

  const {
    watch,
    trigger,
    reset,
    getValues,
    formState: { errors },
  } = form;
  const formData = watch();

  // Auto-save form data
  useAutoSave(formData, currentStep);

  // Load saved data on mount (only once)
  useEffect(() => {
    if (!initialData && hasSavedData()) {
      const saved = loadFormData();
      if (saved) {
        reset(saved.data);
        setCurrentStep(saved.currentStep);
        toast.success('Saved data has been restored');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]); // Only depend on initialData to run once

  // Get current step configuration
  const currentStepConfig = FORM_STEPS[currentStep];

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    if (!currentStepConfig) {
      return true;
    }

    const stepId = currentStepConfig.id as keyof typeof stepSchemas;
    const stepSchema = stepSchemas[stepId];

    if (!stepSchema) {
      return true;
    }

    // Get only the current step's field values
    const allValues = getValues();
    const stepFields = currentStepConfig.fields || [];
    const stepValues: any = {};

    // Extract only the fields relevant to the current step
    stepFields.forEach(field => {
      if (field && typeof field === 'string') {
        stepValues[field] = allValues[field as keyof typeof allValues];
      }
    });

    try {
      stepSchema.parse(stepValues);
      return true;
    } catch (error) {
      console.warn(
        'Validation failed for step:',
        stepId,
        'with values:',
        stepValues,
        'error:',
        error
      );

      // Trigger validation to show errors - only if fields exist
      try {
        if (
          currentStepConfig?.fields &&
          Array.isArray(currentStepConfig.fields) &&
          currentStepConfig.fields.length > 0
        ) {
          const validFields = currentStepConfig.fields.filter(
            field => field && typeof field === 'string'
          );
          if (validFields.length > 0) {
            for (const field of validFields) {
              try {
                await trigger(field as any);
              } catch (fieldError) {
                console.warn(
                  `Failed to trigger validation for field: ${field}`,
                  fieldError
                );
              }
            }
          }
        }
      } catch (triggerError) {
        console.warn('Failed to trigger form validation:', triggerError);
      }
      return false;
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error('Please complete all required fields');
      return;
    }

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    // Move to next step
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      saveFormData(getValues(), currentStep + 1);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      saveFormData(getValues(), currentStep - 1);
    }
  };

  // Navigate to specific step
  const handleStepClick = async (step: number) => {
    // Only allow navigation to completed steps or current step
    if (step <= currentStep || completedSteps.has(step)) {
      setCurrentStep(step);
      saveFormData(getValues(), step);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Final validation
      const isValid = await trigger();
      if (!isValid) {
        toast.error('Please complete all required fields');
        return;
      }

      // Submit to API
      const response = await fetchWithCSRF('/api/agent-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: getValues(),
          userId: userId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Error occurred while submitting application'
        );
      }

      // Success
      clearFormData();
      toast.success(result.message || 'Application submitted successfully!');
      router.push(`/apply-agent/success?id=${result.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <TermsStep form={form} />;
      case 1:
        return <BasicInfoStep form={form} />;
      case 2:
        return <SocialMediaStep form={form} />;
      case 3:
        return <AdditionalInfoStep form={form} />;
      case 4:
        return <ReviewStep form={form} />;
      default:
        return null;
    }
  };

  // Check if current step is valid
  const isCurrentStepValid = async () => {
    if (!currentStepConfig) {
      return true;
    }

    const stepId = currentStepConfig.id as keyof typeof stepSchemas;
    const stepSchema = stepSchemas[stepId];

    if (!stepSchema) {
      return true;
    }

    try {
      stepSchema.parse(getValues());
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Permohonan Ejen JRM
          </h1>
          <p className="text-gray-600">
            Sertai program Jutawan Bonda 4 dan mulakan perjalanan kejayaan anda
          </p>
        </div>

        {/* Step Indicator */}
        <FormStepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          className="mb-8"
        />

        {/* Error Display */}
        {submitError && (
          <Card className="border-red-300 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-medium">Submission Error</p>
              </div>
              <p className="text-sm text-red-600 mt-1">{submitError}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Form Container */}
        <FormStepContainer
          title={currentStepConfig?.title || 'Loading...'}
          subtitle={currentStepConfig?.subtitle || ''}
          onNext={
            currentStep === FORM_STEPS.length - 1 ? handleSubmit : handleNext
          }
          onPrevious={currentStep > 0 ? handlePrevious : undefined}
          nextLabel={
            currentStep === FORM_STEPS.length - 1
              ? 'Submit Application'
              : 'Next'
          }
          previousLabel="Back"
          isFirst={currentStep === 0}
          isLast={currentStep === FORM_STEPS.length - 1}
          isLoading={isSubmitting}
          isValid={Object.keys(errors).length === 0}
        >
          {renderCurrentStep()}
        </FormStepContainer>

        {/* Progress Information */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Data saved automatically</span>
            </div>
            <div className="flex items-center space-x-1">
              <Loader2 className="w-4 h-4" />
              <span>SSL Secure</span>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center text-sm text-blue-800">
            <p className="font-medium mb-1">Need Help?</p>
            <p>
              Contact our support team at{' '}
              <span className="font-medium">support@jrm.com.my</span> atau{' '}
              <span className="font-medium">03-1234-5678</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
