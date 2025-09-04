'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bot,
  Shield,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Zap,
  Key,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface BotInfo {
  username?: string;
  firstName?: string;
  canReadAllGroupMessages?: boolean;
  supportsInlineQueries?: boolean;
}

interface ValidationResult {
  valid: boolean;
  botInfo?: BotInfo;
  error?: string;
}

export function BotConfigurationForm() {
  const [botToken, setBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    loadCurrentConfiguration();
  }, []);

  const loadCurrentConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/telegram/config');
      if (response.ok) {
        const data = await response.json();
        if (data.botUsername) {
          setBotInfo({
            username: data.botUsername,
            firstName: data.botName
          });
          setHasExistingToken(true);
          setIsConfigured(true);
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const validateToken = async (token: string): Promise<ValidationResult> => {
    try {
      const response = await fetch('/api/admin/telegram/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bot_token',
          token: token
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.valid) {
        return {
          valid: true,
          botInfo: result.botInfo
        };
      } else {
        return {
          valid: false,
          error: result.error || 'Invalid bot token'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate token'
      };
    }
  };

  const handleTokenValidation = async () => {
    if (!botToken.trim()) {
      setValidationResult({ valid: false, error: 'Please enter a bot token' });
      return;
    }

    if (!botToken.match(/^\d+:[A-Za-z0-9_-]{35}$/)) {
      setValidationResult({ 
        valid: false, 
        error: 'Invalid token format. Should be like: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' 
      });
      return;
    }

    setValidating(true);
    try {
      const result = await validateToken(botToken);
      setValidationResult(result);
      if (result.valid && result.botInfo) {
        setBotInfo(result.botInfo);
      }
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!validationResult?.valid) {
      toast.error('Please validate the bot token first');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/telegram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botToken: botToken,
          botUsername: botInfo?.username,
          botName: botInfo?.firstName
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('✅ Bot configuration saved successfully!');
        setHasExistingToken(true);
        setIsConfigured(true);
        setBotToken(''); // Clear the input for security
        setShowToken(false);
        setValidationResult(null);
        // Reload the page to update all components
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTokenChange = (value: string) => {
    setBotToken(value);
    setValidationResult(null);
    setBotInfo(null);
  };

  const resetConfiguration = () => {
    setBotToken('');
    setShowToken(false);
    setValidationResult(null);
    setBotInfo(null);
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-900">
          <Bot className="w-5 h-5 mr-2" />
          Bot Configuration
        </CardTitle>
        <p className="text-blue-700 text-sm">
          Configure your Telegram bot token to enable notifications
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Bot Status */}
        {isConfigured && botInfo && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-green-900">
                    @{botInfo.username}
                  </div>
                  <div className="text-sm text-green-700">
                    {botInfo.firstName}
                  </div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        )}

        {/* Bot Token Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-token" className="text-sm font-medium">
              Bot Token
            </Label>
            <div className="relative">
              <Input
                id="bot-token"
                type={showToken ? "text" : "password"}
                value={botToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                placeholder={hasExistingToken ? "Enter new token to update..." : "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"}
                className="pr-24"
                disabled={saving || validating}
              />
              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleTokenValidation}
                  disabled={!botToken.trim() || validating}
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* How to get bot token */}
          <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
            <div className="flex items-start space-x-2">
              <Key className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>How to get a bot token:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Message <code>@BotFather</code> on Telegram</li>
                  <li>Send <code>/newbot</code> command</li>
                  <li>Follow the prompts to create your bot</li>
                  <li>Copy the token provided by BotFather</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <Alert className={validationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {validationResult.valid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={validationResult.valid ? 'text-green-800' : 'text-red-800'}>
              {validationResult.valid ? (
                <div>
                  <strong>✅ Valid bot token!</strong>
                  {validationResult.botInfo && (
                    <div className="mt-2 space-y-1 text-sm">
                      <div>Bot: @{validationResult.botInfo.username}</div>
                      <div>Name: {validationResult.botInfo.firstName}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <strong>❌ Invalid token:</strong> {validationResult.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={resetConfiguration}
            disabled={saving || validating}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTokenValidation}
              disabled={!botToken.trim() || validating || saving}
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Validate
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!validationResult?.valid || saving || validating}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Security Notice:</strong> Your bot token is encrypted and stored securely. 
            It's never transmitted in plain text or logged in server logs.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}