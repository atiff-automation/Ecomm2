'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  TestTube,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MessageCircle,
  Package,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { WizardData } from '../SetupWizard';
import { toast } from 'sonner';

interface ConfigurationTestStepProps {
  data: WizardData;
  onComplete: () => void;
  onNext: () => void;
  onBack: () => void;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface TestResults {
  botConnection: TestResult | null;
  ordersChannel: TestResult | null;
  inventoryChannel: TestResult | null;
  integration: TestResult | null;
}

export function ConfigurationTestStep({ 
  data, 
  onComplete, 
  onNext, 
  onBack 
}: ConfigurationTestStepProps) {
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResults>({
    botConnection: null,
    ordersChannel: null,
    inventoryChannel: null,
    integration: null,
  });

  const runAllTests = async () => {
    setTesting(true);
    setTestResults({
      botConnection: null,
      ordersChannel: null,
      inventoryChannel: null,
      integration: null,
    });

    try {
      // Test 1: Bot Connection
      setCurrentTest('Bot Connection');
      const botTest = await testBotConnection();
      setTestResults(prev => ({ ...prev, botConnection: botTest }));

      if (!botTest.success) {
        setTesting(false);
        setCurrentTest(null);
        return;
      }

      // Test 2: Orders Channel (if enabled)
      if (data.ordersEnabled && data.ordersChannelId) {
        setCurrentTest('Orders Channel');
        const ordersTest = await testChannel(data.ordersChannelId, 'orders');
        setTestResults(prev => ({ ...prev, ordersChannel: ordersTest }));
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          ordersChannel: { success: true, message: 'Skipped - Orders notifications disabled' }
        }));
      }

      // Test 3: Inventory Channel (if enabled)
      if (data.inventoryEnabled && data.inventoryChannelId) {
        setCurrentTest('Inventory Channel');
        const inventoryTest = await testChannel(data.inventoryChannelId, 'inventory');
        setTestResults(prev => ({ ...prev, inventoryChannel: inventoryTest }));
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          inventoryChannel: { success: true, message: 'Skipped - Inventory notifications disabled' }
        }));
      }

      // Test 4: Integration Test
      setCurrentTest('Integration Test');
      const integrationTest = await testIntegration();
      setTestResults(prev => ({ ...prev, integration: integrationTest }));

      // Check if all tests passed
      const allTestsPassed = [
        botTest.success,
        !data.ordersEnabled || (data.ordersChannelId && testResults.ordersChannel?.success !== false),
        !data.inventoryEnabled || (data.inventoryChannelId && testResults.inventoryChannel?.success !== false),
        integrationTest.success
      ].every(Boolean);

      if (allTestsPassed) {
        onComplete();
        toast.success('All tests passed! Configuration is ready.');
      }

    } catch (error) {
      toast.error('Testing failed unexpectedly');
    } finally {
      setTesting(false);
      setCurrentTest(null);
    }
  };

  const testBotConnection = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/admin/telegram/test/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botToken: data.botToken,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: 'Bot connection successful',
          details: `Connected as @${data.botUsername}`,
        };
      } else {
        return {
          success: false,
          message: 'Bot connection failed',
          details: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        details: 'Unable to reach validation service',
      };
    }
  };

  const testChannel = async (chatId: string, channelType: string): Promise<TestResult> => {
    try {
      const response = await fetch('/api/admin/telegram/test/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botToken: data.botToken,
          chatId,
          channelType,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: `${channelType} channel test successful`,
          details: `Test message sent successfully`,
        };
      } else {
        return {
          success: false,
          message: `${channelType} channel test failed`,
          details: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `${channelType} channel test failed`,
        details: 'Unable to send test message',
      };
    }
  };

  const testIntegration = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/admin/telegram/test/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: {
            botToken: data.botToken,
            ordersChannelId: data.ordersEnabled ? data.ordersChannelId : null,
            inventoryChannelId: data.inventoryEnabled ? data.inventoryChannelId : null,
            ordersEnabled: data.ordersEnabled,
            inventoryEnabled: data.inventoryEnabled,
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: 'Integration test passed',
          details: 'All components working together correctly',
        };
      } else {
        return {
          success: false,
          message: 'Integration test failed',
          details: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Integration test failed',
        details: 'Unable to complete integration test',
      };
    }
  };

  const getTestIcon = (result: TestResult | null) => {
    if (!result) return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />;
    return result.success ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const getTestStatus = (result: TestResult | null) => {
    if (!result) return 'pending';
    return result.success ? 'success' : 'failed';
  };

  const allTestsCompleted = Object.values(testResults).every(result => result !== null);
  const allTestsPassed = Object.values(testResults).every(result => result?.success !== false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="w-5 h-5 mr-2 text-primary" />
            Test Your Configuration
          </CardTitle>
          <p className="text-muted-foreground">
            Let's test your Telegram bot configuration to make sure everything is working correctly.
          </p>
        </CardHeader>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="font-medium">Bot</span>
            </div>
            <Badge variant="outline">@{data.botUsername}</Badge>
          </div>

          {data.ordersEnabled && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Orders Channel</span>
              </div>
              <Badge variant="outline">{data.ordersChannelName || data.ordersChannelId}</Badge>
            </div>
          )}

          {data.inventoryEnabled && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Inventory Channel</span>
              </div>
              <Badge variant="outline">{data.inventoryChannelName || data.inventoryChannelId}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Test Results
            <Button
              onClick={runAllTests}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bot Connection Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-3">
              {getTestIcon(testResults.botConnection)}
              <div>
                <p className="font-medium">Bot Connection Test</p>
                <p className="text-sm text-muted-foreground">
                  {currentTest === 'Bot Connection' 
                    ? 'Testing bot connection...' 
                    : testResults.botConnection?.message || 'Verify bot token and connection'
                  }
                </p>
              </div>
            </div>
            {currentTest === 'Bot Connection' && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>

          {/* Orders Channel Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-3">
              {getTestIcon(testResults.ordersChannel)}
              <div>
                <p className="font-medium">Orders Channel Test</p>
                <p className="text-sm text-muted-foreground">
                  {currentTest === 'Orders Channel' 
                    ? 'Testing orders channel...' 
                    : testResults.ordersChannel?.message || (data.ordersEnabled ? 'Test message to orders channel' : 'Orders notifications disabled')
                  }
                </p>
              </div>
            </div>
            {currentTest === 'Orders Channel' && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>

          {/* Inventory Channel Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-3">
              {getTestIcon(testResults.inventoryChannel)}
              <div>
                <p className="font-medium">Inventory Channel Test</p>
                <p className="text-sm text-muted-foreground">
                  {currentTest === 'Inventory Channel' 
                    ? 'Testing inventory channel...' 
                    : testResults.inventoryChannel?.message || (data.inventoryEnabled ? 'Test message to inventory channel' : 'Inventory notifications disabled')
                  }
                </p>
              </div>
            </div>
            {currentTest === 'Inventory Channel' && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>

          {/* Integration Test */}
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-3">
              {getTestIcon(testResults.integration)}
              <div>
                <p className="font-medium">Integration Test</p>
                <p className="text-sm text-muted-foreground">
                  {currentTest === 'Integration Test' 
                    ? 'Running integration test...' 
                    : testResults.integration?.message || 'Test complete configuration'
                  }
                </p>
              </div>
            </div>
            {currentTest === 'Integration Test' && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      {allTestsCompleted && (
        <Alert className={allTestsPassed ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
          {allTestsPassed ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          <AlertDescription>
            {allTestsPassed ? (
              <div>
                <p className="font-medium text-green-700">All tests passed!</p>
                <p className="text-sm text-green-600 mt-1">
                  Your Telegram notification system is configured correctly and ready to use.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-yellow-700">Some tests failed</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Please review the failed tests and fix any issues before proceeding.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={onNext} 
              disabled={!allTestsCompleted || !allTestsPassed}
            >
              Continue to Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}