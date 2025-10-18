'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings, X } from 'lucide-react';
import Link from 'next/link';

interface ConfigStatus {
  configured: boolean;
  errors: string[];
  warnings: string[];
  configurationUrl: string;
}

interface EasyParcelConfigWarningProps {
  showDismiss?: boolean;
  className?: string;
}

export default function EasyParcelConfigWarning({
  showDismiss = false,
  className = '',
}: EasyParcelConfigWarningProps) {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkConfigurationStatus();
  }, []);

  const checkConfigurationStatus = async () => {
    try {
      const response = await fetch('/api/admin/shipping/config-status');
      const result = await response.json();

      if (result.success) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to check EasyParcel configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if loading, configured, or dismissed
  if (loading || !status || status.configured || dismissed) {
    return null;
  }

  const parseErrorMessage = (error: string) => {
    const parts = error.split(': ');
    return {
      code: parts[0] || '',
      message: parts[1] || error,
    };
  };

  return (
    <div className={`mb-6 ${className}`}>
      <Alert className="border-red-200 bg-red-50 text-red-900">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <div className="flex items-start justify-between w-full">
          <div className="flex-1">
            <AlertDescription>
              <div className="mb-2">
                <strong>EasyParcel Shipping Not Configured</strong>
              </div>
              <div className="space-y-1 text-sm">
                {status.errors.map((error, index) => {
                  const parsed = parseErrorMessage(error);
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span>{parsed.message}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={status.configurationUrl}>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    <Settings className="w-4 h-4 mr-1" />
                    Configure Business Profile
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </div>
          {showDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-100 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}
