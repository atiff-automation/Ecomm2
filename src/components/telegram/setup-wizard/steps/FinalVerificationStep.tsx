'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MessageCircle,
  Package,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  Eye,
  Save,
  Settings,
} from 'lucide-react';
import { WizardData } from '../SetupWizard';
import { toast } from 'sonner';

interface FinalVerificationStepProps {
  data: WizardData;
  onComplete: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function FinalVerificationStep({ 
  data, 
  onComplete, 
  onNext, 
  onBack 
}: FinalVerificationStepProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/telegram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botToken: data.botToken,
          botUsername: data.botUsername,
          botName: data.botName,
          ordersChannelId: data.ordersEnabled ? data.ordersChannelId : null,
          ordersChannelName: data.ordersEnabled ? data.ordersChannelName : null,
          inventoryChannelId: data.inventoryEnabled ? data.inventoryChannelId : null,
          inventoryChannelName: data.inventoryEnabled ? data.inventoryChannelName : null,
          ordersEnabled: data.ordersEnabled,
          inventoryEnabled: data.inventoryEnabled,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSaved(true);
        onComplete();
        toast.success('Configuration saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const configurationItems = [
    {
      icon: MessageCircle,
      label: 'Telegram Bot',
      value: `@${data.botUsername}`,
      description: data.botName,
      status: 'configured',
    },
    {
      icon: ShoppingCart,
      label: 'Orders Notifications',
      value: data.ordersEnabled ? 'Enabled' : 'Disabled',
      description: data.ordersEnabled 
        ? `Channel: ${data.ordersChannelName || data.ordersChannelId}`
        : 'Order notifications will not be sent',
      status: data.ordersEnabled ? 'configured' : 'disabled',
    },
    {
      icon: Package,
      label: 'Inventory Notifications',
      value: data.inventoryEnabled ? 'Enabled' : 'Disabled',
      description: data.inventoryEnabled 
        ? `Channel: ${data.inventoryChannelName || data.inventoryChannelId}`
        : 'Inventory notifications will not be sent',
      status: data.inventoryEnabled ? 'configured' : 'disabled',
    },
  ];

  const securityFeatures = [
    'Bot token encrypted with AES-256-GCM',
    'Secure token storage in database',
    'Admin-only configuration access',
    'Session-based authentication',
    'Configuration change auditing',
  ];

  const nextSteps = [
    'Start receiving real-time order notifications',
    'Monitor inventory levels with automated alerts',
    'Customize notification settings as needed',
    'Review notification history in admin panel',
    'Add more channels or modify settings anytime',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Final Verification
          </CardTitle>
          <p className="text-muted-foreground">
            Review your configuration one last time before we save and activate your Telegram notifications.
          </p>
        </CardHeader>
      </Card>

      {/* Configuration Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Configuration Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configurationItems.map((item, index) => (
            <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start space-x-3">
                <item.icon className={`w-5 h-5 mt-0.5 ${
                  item.status === 'configured' ? 'text-green-500' : 
                  item.status === 'disabled' ? 'text-gray-400' : 'text-primary'
                }`} />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Badge 
                variant={item.status === 'configured' ? 'default' : 'secondary'}
                className={item.status === 'configured' ? 'bg-green-100 text-green-700 border-green-300' : ''}
              >
                {item.value}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-500" />
            Security Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Happens Next</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mt-0.5">
                  {index + 1}
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> You can modify these settings anytime from the Admin → Notifications panel. 
          Your bot token will be encrypted and securely stored. You can also disable notifications 
          temporarily without losing your configuration.
        </AlertDescription>
      </Alert>

      {/* Save Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Save className="w-5 h-5 mr-2 text-primary" />
            Save Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saved ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <p className="font-medium text-green-700">Configuration saved successfully!</p>
                <p className="text-sm text-green-600 mt-1">
                  Your Telegram notification system is now active and ready to use.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to save your configuration and activate Telegram notifications. 
                This will securely store your settings and start the notification service.
              </p>
              <Button
                onClick={saveConfiguration}
                disabled={saving}
                size="lg"
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Activate Notifications
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack} disabled={saving}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={onNext} 
              disabled={!saved}
            >
              Complete Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}