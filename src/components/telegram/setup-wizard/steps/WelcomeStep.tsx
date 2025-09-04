'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  Bot,
  Bell,
  Shield,
  CheckCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
  onCancel: () => void;
}

export function WelcomeStep({ onNext, onCancel }: WelcomeStepProps) {
  const features = [
    {
      icon: MessageCircle,
      title: 'Real-time Notifications',
      description: 'Get instant updates for orders, inventory, and system events',
    },
    {
      icon: Bot,
      title: 'Automated Bot Management',
      description: 'Easy-to-configure Telegram bot for your business',
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Customizable notifications for different business events',
    },
    {
      icon: Shield,
      title: 'Secure Configuration',
      description: 'Encrypted token storage and secure channel management',
    },
  ];

  const requirements = [
    'Admin access to your e-commerce system',
    'Telegram account with ability to create bots',
    'Access to Telegram channels for notifications',
    'About 5-10 minutes for complete setup',
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Welcome to Telegram Notifications Setup
          </CardTitle>
          <p className="text-muted-foreground">
            Configure automated notifications for your e-commerce platform in just a few simple steps.
            This wizard will guide you through creating a Telegram bot, setting up channels, and testing your configuration.
          </p>
        </CardHeader>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            What You'll Get
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <feature.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-500" />
            Before We Begin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please ensure you have the following ready:
          </p>
          <ul className="space-y-2">
            {requirements.map((requirement, index) => (
              <li key={index} className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                {requirement}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Setup Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Process Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-3">
                1
              </div>
              <span><strong>Create Telegram Bot:</strong> We'll guide you through creating a new bot with @BotFather</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-3">
                2
              </div>
              <span><strong>Setup Channels:</strong> Configure your notification channels for orders and inventory</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-3">
                3
              </div>
              <span><strong>Test Configuration:</strong> Verify everything works with test messages</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-3">
                4
              </div>
              <span><strong>Final Verification:</strong> Complete setup and start receiving notifications</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Note */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Your bot tokens and chat IDs will be securely encrypted and stored. 
          Only administrators can access and modify these settings. You can cancel this setup at any time 
          without affecting your current configuration.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancel Setup
            </Button>
            <Button onClick={onNext} className="pl-6 pr-4">
              Start Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}