'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  PartyPopper,
  CheckCircle,
  MessageCircle,
  Settings,
  BookOpen,
  Monitor,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { WizardData } from '../SetupWizard';

interface CompletionStepProps {
  data: WizardData;
  onComplete: () => void;
  onBack: () => void;
}

export function CompletionStep({ data, onComplete, onBack }: CompletionStepProps) {
  const achievedFeatures = [
    {
      icon: MessageCircle,
      title: 'Real-time Notifications',
      description: 'Your bot will now send instant notifications for business events',
      active: true,
    },
    {
      icon: CheckCircle,
      title: 'Order Notifications',
      description: 'Receive alerts for new orders, payments, and status updates',
      active: data.ordersEnabled,
    },
    {
      icon: CheckCircle,
      title: 'Inventory Alerts',
      description: 'Get notified about low stock and inventory changes',
      active: data.inventoryEnabled,
    },
    {
      icon: CheckCircle,
      title: 'Secure Configuration',
      description: 'Your bot token is encrypted and safely stored',
      active: true,
    },
  ];

  const quickActions = [
    {
      icon: Monitor,
      title: 'Monitor Notifications',
      description: 'View notification history and system status',
      action: 'Go to Admin Panel',
      href: '/admin/notifications',
    },
    {
      icon: Settings,
      title: 'Manage Settings',
      description: 'Modify channels, enable/disable notifications',
      action: 'Notification Settings',
      href: '/admin/notifications',
    },
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Learn about advanced features and troubleshooting',
      action: 'View Documentation',
      href: '#', // Would link to actual documentation
    },
  ];

  const usageStats = [
    { label: 'Configured Channels', value: [data.ordersEnabled, data.inventoryEnabled].filter(Boolean).length },
    { label: 'Notification Types', value: [data.ordersEnabled, data.inventoryEnabled].filter(Boolean).length + 1 }, // +1 for system notifications
    { label: 'Security Level', value: 'Enterprise' },
  ];

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <PartyPopper className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            🎉 Congratulations!
          </CardTitle>
          <p className="text-green-700">
            Your Telegram notification system is now fully configured and active. 
            You'll start receiving notifications immediately for your e-commerce platform.
          </p>
        </CardHeader>
      </Card>

      {/* Setup Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setup Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {usageStats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Configured Bot & Channels:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">Telegram Bot</span>
                <Badge variant="outline">@{data.botUsername}</Badge>
              </div>
              {data.ordersEnabled && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">Orders Channel</span>
                  <Badge variant="outline">{data.ordersChannelName || 'Orders'}</Badge>
                </div>
              )}
              {data.inventoryEnabled && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm">Inventory Channel</span>
                  <Badge variant="outline">{data.inventoryChannelName || 'Inventory'}</Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Achieved */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Features Activated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievedFeatures.map((feature, index) => (
              <div 
                key={index} 
                className={`flex items-start space-x-3 p-3 rounded-lg ${
                  feature.active ? 'bg-green-50 border border-green-200' : 'bg-muted/30'
                }`}
              >
                <feature.icon className={`w-5 h-5 mt-0.5 ${
                  feature.active ? 'text-green-600' : 'text-muted-foreground'
                }`} />
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    feature.active ? 'text-green-800' : 'text-muted-foreground'
                  }`}>
                    {feature.title}
                    {feature.active && <Badge variant="outline" className="ml-2 text-xs">Active</Badge>}
                    {!feature.active && <Badge variant="secondary" className="ml-2 text-xs">Disabled</Badge>}
                  </h4>
                  <p className={`text-sm ${
                    feature.active ? 'text-green-700' : 'text-muted-foreground'
                  }`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <action.icon className="w-6 h-6 text-primary mb-2" />
                <h4 className="font-medium mb-1">{action.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {action.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (action.href.startsWith('/')) {
                      window.location.href = action.href;
                    } else {
                      window.open(action.href, '_blank');
                    }
                  }}
                >
                  {action.action}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <MessageCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>What's Next:</strong> Your bot is now monitoring your e-commerce platform. 
          You should receive a welcome message in your configured channels shortly. 
          You can modify settings, add more channels, or disable notifications anytime from the admin panel.
        </AlertDescription>
      </Alert>

      {/* Final Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={onComplete}
              size="lg"
              className="w-full"
            >
              Go to Notifications Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Need help? Check out our{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => window.open('#', '_blank')}
                >
                  documentation
                </Button>
                {' '}or contact support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto" />
            <h3 className="font-semibold text-blue-800">Setup Complete!</h3>
            <p className="text-sm text-blue-700">
              Your Telegram notification system is now live and monitoring your e-commerce platform. 
              Welcome to automated business notifications!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}