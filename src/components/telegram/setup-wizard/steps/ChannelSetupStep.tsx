'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Users,
  Package,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Info,
  Plus,
} from 'lucide-react';
import { WizardData } from '../SetupWizard';
import { toast } from 'sonner';

interface ChannelSetupStepProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ValidationResult {
  valid: boolean;
  chatName?: string;
  error?: string;
}

export function ChannelSetupStep({ data, onUpdate, onNext, onBack }: ChannelSetupStepProps) {
  const [validatingOrders, setValidatingOrders] = useState(false);
  const [validatingInventory, setValidatingInventory] = useState(false);
  const [ordersValidation, setOrdersValidation] = useState<ValidationResult | null>(null);
  const [inventoryValidation, setInventoryValidation] = useState<ValidationResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const validateChatId = async (chatId: string, channelType: 'orders' | 'inventory') => {
    if (!chatId || !chatId.match(/^-?\d+$/)) {
      const result = {
        valid: false,
        error: 'Chat ID must be a number (e.g., -1001234567890 for channels, 123456789 for private chats)',
      };
      
      if (channelType === 'orders') {
        setOrdersValidation(result);
      } else {
        setInventoryValidation(result);
      }
      return;
    }

    const setValidating = channelType === 'orders' ? setValidatingOrders : setValidatingInventory;
    const setValidation = channelType === 'orders' ? setOrdersValidation : setInventoryValidation;

    setValidating(true);
    try {
      const response = await fetch('/api/admin/telegram/validate/chat-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chatId,
          botToken: data.botToken 
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setValidation({
          valid: true,
          chatName: result.chatName,
        });
        
        const updateKey = channelType === 'orders' ? 'ordersChannelName' : 'inventoryChannelName';
        onUpdate({
          [channelType === 'orders' ? 'ordersChannelId' : 'inventoryChannelId']: chatId,
          [updateKey]: result.chatName || `${channelType} Channel`,
        });
        
        toast.success(`${channelType} channel validated successfully!`);
      } else {
        setValidation({
          valid: false,
          error: result.error || `Failed to validate ${channelType} channel`,
        });
      }
    } catch (error) {
      setValidation({
        valid: false,
        error: 'Failed to connect to validation service',
      });
    } finally {
      setValidating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const generateBotInviteLink = () => {
    if (data.botUsername) {
      return `https://t.me/${data.botUsername}`;
    }
    return 'https://t.me/your_bot_username';
  };

  const canProceed = () => {
    const ordersValid = !data.ordersEnabled || (data.ordersChannelId && ordersValidation?.valid);
    const inventoryValid = !data.inventoryEnabled || (data.inventoryChannelId && inventoryValidation?.valid);
    return ordersValid && inventoryValid;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-primary" />
            Configure Notification Channels
          </CardTitle>
          <p className="text-muted-foreground">
            Set up the Telegram channels where your bot will send notifications for orders and inventory alerts.
          </p>
        </CardHeader>
      </Card>

      {/* Quick Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            How to Get Chat IDs
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? 'Hide' : 'Show'} Instructions
            </Button>
          </CardTitle>
        </CardHeader>
        {showInstructions && (
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You need the Chat ID for each channel or group where you want to receive notifications.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  For Telegram Channels/Groups:
                </h4>
                
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex items-start space-x-3">
                    <span className="font-medium">1.</span>
                    <div>
                      <p>Add your bot (@{data.botUsername || 'your_bot'}) to the channel/group</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(generateBotInviteLink(), '_blank')}
                      >
                        Open Bot Profile
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="font-medium">2.</span>
                    <div>
                      <p>Make your bot an admin (required for sending messages)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="font-medium">3.</span>
                    <div>
                      <p>Forward any message from the channel to @RawDataBot</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open('https://t.me/RawDataBot', '_blank')}
                      >
                        Open @RawDataBot
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="font-medium">4.</span>
                    <div>
                      <p>Copy the "id" number from the bot's response (e.g., -1001234567890)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">For Private Chats:</h4>
                <p className="text-sm pl-6">
                  Send a message to @RawDataBot and copy your user ID (positive number like 123456789)
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Orders Channel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ShoppingCart className="w-5 h-5 mr-2 text-blue-500" />
            Orders Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="orders-enabled"
              checked={data.ordersEnabled}
              onCheckedChange={(enabled) => onUpdate({ ordersEnabled: enabled })}
            />
            <Label htmlFor="orders-enabled">Enable order notifications</Label>
          </div>

          {data.ordersEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orders-chat-id">Orders Channel/Chat ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="orders-chat-id"
                    placeholder="-1001234567890"
                    value={data.ordersChannelId}
                    onChange={(e) => {
                      onUpdate({ ordersChannelId: e.target.value });
                      setOrdersValidation(null);
                    }}
                  />
                  <Button
                    onClick={() => validateChatId(data.ordersChannelId, 'orders')}
                    disabled={!data.ordersChannelId || validatingOrders}
                    variant="outline"
                  >
                    {validatingOrders ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {ordersValidation && (
                <Alert className={ordersValidation.valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  {ordersValidation.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {ordersValidation.valid ? (
                      <div>
                        <p className="font-medium text-green-700">Orders channel is accessible!</p>
                        {ordersValidation.chatName && (
                          <Badge variant="outline" className="mt-2">
                            {ordersValidation.chatName}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-red-700">Validation failed</p>
                        <p className="text-sm text-red-600 mt-1">{ordersValidation.error}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <p><strong>What you'll receive:</strong></p>
                <ul className="mt-2 space-y-1 ml-4 list-disc">
                  <li>New order notifications</li>
                  <li>Payment confirmations</li>
                  <li>Order status updates</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Channel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-2 text-orange-500" />
            Inventory Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="inventory-enabled"
              checked={data.inventoryEnabled}
              onCheckedChange={(enabled) => onUpdate({ inventoryEnabled: enabled })}
            />
            <Label htmlFor="inventory-enabled">Enable inventory alerts</Label>
          </div>

          {data.inventoryEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inventory-chat-id">Inventory Channel/Chat ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="inventory-chat-id"
                    placeholder="-1001234567890"
                    value={data.inventoryChannelId}
                    onChange={(e) => {
                      onUpdate({ inventoryChannelId: e.target.value });
                      setInventoryValidation(null);
                    }}
                  />
                  <Button
                    onClick={() => validateChatId(data.inventoryChannelId, 'inventory')}
                    disabled={!data.inventoryChannelId || validatingInventory}
                    variant="outline"
                  >
                    {validatingInventory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {inventoryValidation && (
                <Alert className={inventoryValidation.valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  {inventoryValidation.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {inventoryValidation.valid ? (
                      <div>
                        <p className="font-medium text-green-700">Inventory channel is accessible!</p>
                        {inventoryValidation.chatName && (
                          <Badge variant="outline" className="mt-2">
                            {inventoryValidation.chatName}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-red-700">Validation failed</p>
                        <p className="text-sm text-red-600 mt-1">{inventoryValidation.error}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <p><strong>What you'll receive:</strong></p>
                <ul className="mt-2 space-y-1 ml-4 list-disc">
                  <li>Low stock alerts</li>
                  <li>Out of stock notifications</li>
                  <li>Inventory update summaries</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={onNext} disabled={!canProceed()}>
              Continue to Testing
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}