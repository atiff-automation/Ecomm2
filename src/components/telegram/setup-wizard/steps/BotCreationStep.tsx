'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Info,
} from 'lucide-react';
import { WizardData } from '../SetupWizard';
import { toast } from 'sonner';

interface BotCreationStepProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BotCreationStep({ data, onUpdate, onNext, onBack }: BotCreationStepProps) {
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    username?: string;
    name?: string;
    error?: string;
  } | null>(null);

  const validateBotToken = async (token: string) => {
    if (!token || !token.match(/^\d+:[A-Za-z0-9_-]{35}$/)) {
      setValidationResult({
        valid: false,
        error: 'Invalid bot token format. Should be like: 123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
      });
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/admin/telegram/validate/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.valid) {
        setValidationResult({
          valid: true,
          username: result.username,
          name: result.firstName || result.username,
        });
        onUpdate({
          botToken: token,
          botUsername: result.username,
          botName: result.firstName || result.username,
        });
        toast.success('Bot token validated successfully!');
      } else {
        setValidationResult({
          valid: false,
          error: result.error || 'Failed to validate bot token',
        });
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Failed to connect to validation service',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleTokenChange = (token: string) => {
    onUpdate({ botToken: token });
    setValidationResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const canProceed = data.botToken && validationResult?.valid && data.botUsername;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2 text-primary" />
            Create Your Telegram Bot
          </CardTitle>
          <p className="text-muted-foreground">
            First, we need to create a Telegram bot that will send notifications. Don't worry - we'll guide you through every step.
          </p>
        </CardHeader>
      </Card>

      {/* BotFather Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Create Bot with @BotFather</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              BotFather is Telegram's official bot for creating and managing bots. Follow these exact steps:
            </AlertDescription>
          </Alert>

          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                1
              </div>
              <div>
                <p className="text-sm"><strong>Open Telegram</strong> and search for <code className="bg-muted px-1 rounded">@BotFather</code></p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('https://t.me/botfather', '_blank')}
                >
                  Open @BotFather
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <div>
                <p className="text-sm">Send the command: <code className="bg-muted px-1 rounded">/newbot</code></p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard('/newbot')}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Command
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                3
              </div>
              <div>
                <p className="text-sm">Choose a name for your bot (e.g., "My Store Notifications")</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                4
              </div>
              <div>
                <p className="text-sm">Choose a username ending in "bot" (e.g., "mystorenotifications_bot")</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                5
              </div>
              <div>
                <p className="text-sm">
                  <strong>Copy the bot token</strong> that BotFather gives you. It looks like: 
                  <code className="bg-muted px-1 rounded text-xs ml-1">123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</code>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 2: Enter Your Bot Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-token">Bot Token</Label>
            <div className="relative">
              <Input
                id="bot-token"
                type={showToken ? 'text' : 'password'}
                placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                value={data.botToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-2 top-2 flex space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {data.botToken && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => validateBotToken(data.botToken)}
                    disabled={validating}
                  >
                    {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <Alert className={validationResult.valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              {validationResult.valid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                {validationResult.valid ? (
                  <div>
                    <p className="font-medium text-green-700">Bot token is valid!</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">@{validationResult.username}</Badge>
                        <span className="text-sm text-green-600">{validationResult.name}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-red-700">Validation failed</p>
                    <p className="text-sm text-red-600 mt-1">{validationResult.error}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-validate button */}
          {data.botToken && !validationResult && (
            <Button
              onClick={() => validateBotToken(data.botToken)}
              disabled={validating}
              variant="outline"
              className="w-full"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating Token...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate Bot Token
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Security:</strong> Your bot token will be encrypted and securely stored. 
          It will never be displayed in plain text again after this setup.
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={onNext} disabled={!canProceed}>
              Continue to Channel Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}