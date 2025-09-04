'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { WelcomeStep } from './steps/WelcomeStep';
import { BotCreationStep } from './steps/BotCreationStep';
import { ChannelSetupStep } from './steps/ChannelSetupStep';
import { ConfigurationTestStep } from './steps/ConfigurationTestStep';
import { FinalVerificationStep } from './steps/FinalVerificationStep';
import { CompletionStep } from './steps/CompletionStep';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

export interface WizardData {
  botToken: string;
  botUsername: string;
  botName: string;
  ordersChannelId: string;
  ordersChannelName: string;
  inventoryChannelId: string;
  inventoryChannelName: string;
  ordersEnabled: boolean;
  inventoryEnabled: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome & Overview',
    description: 'Introduction to Telegram notifications setup',
    completed: false,
  },
  {
    id: 'bot-creation',
    title: 'Bot Creation',
    description: 'Create and configure your Telegram bot',
    completed: false,
  },
  {
    id: 'channel-setup',
    title: 'Channel Setup',
    description: 'Configure notification channels',
    completed: false,
  },
  {
    id: 'testing',
    title: 'Configuration Testing',
    description: 'Test your configuration',
    completed: false,
  },
  {
    id: 'verification',
    title: 'Final Verification',
    description: 'Verify all settings are working',
    completed: false,
  },
  {
    id: 'completion',
    title: 'Setup Complete',
    description: 'Congratulations! Your setup is complete',
    completed: false,
  },
];

interface SetupWizardProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
  initialData?: Partial<WizardData>;
}

export function SetupWizard({ onComplete, onCancel, initialData }: SetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wizardSteps, setWizardSteps] = useState<WizardStep[]>(WIZARD_STEPS);
  const [wizardData, setWizardData] = useState<WizardData>({
    botToken: '',
    botUsername: '',
    botName: '',
    ordersChannelId: '',
    ordersChannelName: '',
    inventoryChannelId: '',
    inventoryChannelName: '',
    ordersEnabled: true,
    inventoryEnabled: true,
    ...initialData,
  });

  const currentStep = wizardSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / wizardSteps.length) * 100;

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const markStepCompleted = (stepId: string) => {
    setWizardSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

  const nextStep = () => {
    if (currentStepIndex < wizardSteps.length - 1) {
      markStepCompleted(currentStep.id);
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const canGoNext = () => {
    switch (currentStep.id) {
      case 'welcome':
        return true;
      case 'bot-creation':
        return wizardData.botToken && wizardData.botUsername;
      case 'channel-setup':
        return (wizardData.ordersEnabled ? wizardData.ordersChannelId : true) &&
               (wizardData.inventoryEnabled ? wizardData.inventoryChannelId : true);
      case 'testing':
      case 'verification':
        return currentStep.completed;
      default:
        return true;
    }
  };

  const handleComplete = () => {
    markStepCompleted(currentStep.id);
    onComplete(wizardData);
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return (
          <WelcomeStep
            onNext={nextStep}
            onCancel={onCancel}
          />
        );
      
      case 'bot-creation':
        return (
          <BotCreationStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      
      case 'channel-setup':
        return (
          <ChannelSetupStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      
      case 'testing':
        return (
          <ConfigurationTestStep
            data={wizardData}
            onComplete={() => markStepCompleted('testing')}
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      
      case 'verification':
        return (
          <FinalVerificationStep
            data={wizardData}
            onComplete={() => markStepCompleted('verification')}
            onNext={nextStep}
            onBack={previousStep}
          />
        );
      
      case 'completion':
        return (
          <CompletionStep
            data={wizardData}
            onComplete={handleComplete}
            onBack={previousStep}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                Telegram Notifications Setup
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStepIndex + 1} of {wizardSteps.length}: {currentStep.title}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}% Complete
              </div>
              <Progress value={progress} className="w-32 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {wizardSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 whitespace-nowrap ${
                  index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : index === currentStepIndex ? (
                  <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{step.title}</span>
                {index < wizardSteps.length - 1 && (
                  <ArrowRight className="w-3 h-3 ml-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Footer (for non-step-specific navigation) */}
      {currentStep.id !== 'welcome' && currentStep.id !== 'completion' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel Setup
                </Button>
                {currentStep.id !== 'completion' && (
                  <Button
                    onClick={nextStep}
                    disabled={!canGoNext()}
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}