'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, MapPin, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentPurchase {
  id: string;
  productName: string;
  quantity: number;
  customerLocation: string;
  purchasedAt: string;
  timeAgo?: string;
  isAnonymized: boolean;
}

interface RecentPurchasePopupProps {
  enabled?: boolean;
  productId?: string;
  interval?: number; // milliseconds between popups
  duration?: number; // how long popup stays visible
  className?: string;
}

export default function RecentPurchasePopup({
  enabled = true,
  productId,
  interval = 15000, // 15 seconds
  duration = 5000, // 5 seconds
  className,
}: RecentPurchasePopupProps) {
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [currentPurchase, setCurrentPurchase] = useState<RecentPurchase | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    fetchRecentPurchases();
  }, [enabled, productId]);

  useEffect(() => {
    if (!enabled || recentPurchases.length === 0) {
      return undefined;
    }

    const showNextPurchase = () => {
      const purchase = recentPurchases[currentIndex];
      if (purchase) {
        setCurrentPurchase(purchase);
        setIsVisible(true);

        // Hide popup after duration
        setTimeout(() => {
          setIsVisible(false);
        }, duration);

        // Move to next purchase
        setCurrentIndex(prev => (prev + 1) % recentPurchases.length);
      }
    };

    // Show first popup immediately
    showNextPurchase();

    // Set up interval for subsequent popups
    const intervalId = setInterval(showNextPurchase, interval);

    return () => clearInterval(intervalId);
  }, [enabled, recentPurchases, interval, duration, currentIndex]);

  const fetchRecentPurchases = async () => {
    try {
      const url = productId
        ? `/api/social-proof/recent-purchases?productId=${productId}`
        : '/api/social-proof/recent-purchases';

      const response = await fetch(url);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setRecentPurchases(data.recentPurchases || []);
    } catch (error) {
      console.error('Error fetching recent purchases:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!enabled || !currentPurchase || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-300',
        className
      )}
    >
      <Card className="border-l-4 border-l-green-500 bg-white shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-full">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 text-xs"
                  >
                    Recent Purchase
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {getTimeAgo(currentPurchase.purchasedAt)}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    Someone purchased{' '}
                    {currentPurchase.quantity > 1 && (
                      <span className="font-semibold">
                        {currentPurchase.quantity}x{' '}
                      </span>
                    )}
                    <span className="font-semibold">
                      {currentPurchase.productName}
                    </span>
                  </p>

                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    {currentPurchase.customerLocation}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center text-xs text-green-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                    Verified Purchase
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}
