/**
 * Agent Application Form - Main Container
 * Multi-step form with persistence and validation
 * Following CLAUDE.md principles: Centralized state management, systematic implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AgentApplicationFormData } from '@/types/agent-application';
import { agentApplicationSchema, stepSchemas } from '@/lib/validation/agent-application';
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
  initialData
}: Omit<AgentApplicationFormProps, 'onSuccess' | 'onError'>) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form persistence hooks
  const { saveFormData, loadFormData, clearFormData, hasSavedData, useAutoSave } = useFormPersistence();

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
      ...initialData
    },
    mode: 'onChange'
  });

  const { watch, trigger, reset, getValues, formState: { errors } } = form;
  const formData = watch();

  // Auto-save form data
  useAutoSave(formData, currentStep);

  // Load saved data on mount
  useEffect(() => {
    if (!initialData && hasSavedData()) {
      const saved = loadFormData();
      if (saved) {
        reset(saved.data);
        setCurrentStep(saved.currentStep);
        toast.success('Data tersimpan telah dipulihkan');
      }
    }
  }, [initialData, hasSavedData, loadFormData, reset]);

  // Get current step configuration
  const currentStepConfig = FORM_STEPS[currentStep];

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepId = currentStepConfig.id as keyof typeof stepSchemas;
    const stepSchema = stepSchemas[stepId];

    if (!stepSchema) return true;

    try {
      stepSchema.parse(getValues());
      return true;
    } catch (error) {
      // Trigger validation to show errors - only if fields exist
      if (currentStepConfig.fields && currentStepConfig.fields.length > 0) {
        await trigger(currentStepConfig.fields);
      }
      return false;
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error('Sila lengkapkan semua medan yang diperlukan');
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
        toast.error('Sila lengkapkan semua medan yang diperlukan');
        return;
      }

      // Submit to API
      const response = await fetch('/api/agent-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: getValues(),
          userId: userId || null
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ralat semasa menghantar permohonan');
      }

      // Success
      clearFormData();
      toast.success(result.message || 'Permohonan berjaya dihantar!');
      router.push(`/apply-agent/success?id=${result.id}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ralat tidak dijangka berlaku';
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
    const stepId = currentStepConfig.id as keyof typeof stepSchemas;
    const stepSchema = stepSchemas[stepId];

    if (!stepSchema) return true;

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
                <p className="font-medium">Ralat Penghantaran</p>
              </div>
              <p className="text-sm text-red-600 mt-1">{submitError}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Form Container */}
        <FormStepContainer
          title={currentStepConfig.title}
          subtitle={currentStepConfig.subtitle}
          onNext={currentStep === FORM_STEPS.length - 1 ? handleSubmit : handleNext}
          onPrevious={currentStep > 0 ? handlePrevious : undefined}
          nextLabel={currentStep === FORM_STEPS.length - 1 ? 'Hantar Permohonan' : 'Seterusnya'}
          previousLabel="Kembali"
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
              <span>Data disimpan secara automatik</span>
            </div>
            <div className="flex items-center space-x-1">
              <Loader2 className="w-4 h-4" />
              <span>SSL Selamat</span>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center text-sm text-blue-800">
            <p className="font-medium mb-1">Perlukan Bantuan?</p>
            <p>
              Hubungi pasukan sokongan kami di{' '}
              <span className="font-medium">support@jrm.com.my</span> atau{' '}
              <span className="font-medium">03-1234-5678</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}