/**
 * Demo Mode Popup Component
 *
 * Reusable popup for blocking demo actions (checkout, signup, etc.)
 * with context-specific messaging and home redirect functionality.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Home, Clock, ShoppingBag } from 'lucide-react';
import { DEMO_CONFIG, DemoMessageType } from '@/config/demo';

interface DemoModePopupProps {
  isVisible: boolean;
  onClose: () => void;
  type: DemoMessageType;
  onHomeRedirect?: () => void;
}

export default function DemoModePopup({
  isVisible,
  onClose,
  type,
  onHomeRedirect,
}: DemoModePopupProps) {
  const router = useRouter();

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle home redirect
  const handleHomeRedirect = () => {
    if (onHomeRedirect) {
      onHomeRedirect();
    } else {
      router.push(DEMO_CONFIG.homeRedirectPath);
    }
    onClose();
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const message = DEMO_CONFIG.messages[type];
  const isCheckoutType = type === 'checkout';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-popup-title"
      aria-describedby="demo-popup-description"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <Card className="relative w-full max-w-md mx-auto shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close popup"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            {isCheckoutType ? (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            )}
          </div>
          <CardTitle
            id="demo-popup-title"
            className="text-xl font-bold text-gray-900"
          >
            {isCheckoutType ? 'Coming Soon!' : 'Feature Coming Soon!'}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <p
            id="demo-popup-description"
            className="text-gray-600 leading-relaxed"
          >
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleHomeRedirect}
              className="flex-1 flex items-center justify-center gap-2"
              size="lg"
            >
              <Home className="w-4 h-4" />
              Return to Home
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Continue Browsing
            </Button>
          </div>

          {/* Demo Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Demo Mode:</strong> You can browse products, add items to
              cart, and explore the website.
              {isCheckoutType
                ? ' Orders and payments'
                : ' Account registration'}{' '}
              will be available soon!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for easy popup management
export function useDemoModePopup() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [popupType, setPopupType] = React.useState<DemoMessageType>('checkout');

  const showPopup = (type: DemoMessageType) => {
    if (DEMO_CONFIG.enabled) {
      setPopupType(type);
      setIsVisible(true);
    }
  };

  const hidePopup = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    popupType,
    showPopup,
    hidePopup,
  };
}
