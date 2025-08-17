/**
 * Delivery Notifications Component
 * Real-time delivery notifications and alerts
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.2
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Package,
  Settings,
  X,
} from 'lucide-react';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  important: boolean;
  allUpdates: boolean;
}

interface DeliveryNotification {
  id: string;
  type: 'pickup' | 'transit' | 'delivery' | 'delivered' | 'exception' | 'important';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  trackingNumber?: string;
  actionRequired?: boolean;
}

interface DeliveryNotificationsProps {
  trackingNumber: string;
  currentStatus: string;
  customerEmail?: string;
  customerPhone?: string;
  className?: string;
}

export default function DeliveryNotifications({
  trackingNumber,
  currentStatus,
  customerEmail,
  customerPhone,
  className = '',
}: DeliveryNotificationsProps) {
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    push: true,
    important: true,
    allUpdates: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications/delivery/${trackingNumber}`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    if (trackingNumber) {
      fetchNotifications();
    }
  }, [trackingNumber]);

  // Load notification preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem(`notification-preferences-${trackingNumber}`);
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, [trackingNumber]);

  // Save notification preferences
  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setLoading(true);
    try {
      localStorage.setItem(
        `notification-preferences-${trackingNumber}`,
        JSON.stringify(newPreferences)
      );
      
      // Optionally save to server for authenticated users
      if (customerEmail) {
        await fetch('/api/notifications/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackingNumber,
            preferences: newPreferences,
            email: customerEmail,
            phone: customerPhone,
          }),
        });
      }
      
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return <Package className="w-4 h-4 text-orange-500" />;
      case 'transit':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'delivery':
        return <Truck className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'exception':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'important':
        return <Bell className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get notification type badge
  const getNotificationTypeBadge = (type: string) => {
    const colors = {
      pickup: 'bg-orange-100 text-orange-800',
      transit: 'bg-blue-100 text-blue-800',
      delivery: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      exception: 'bg-red-100 text-red-800',
      important: 'bg-amber-100 text-amber-800',
    };
    
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Generate status-based notifications
  const getStatusNotifications = (): DeliveryNotification[] => {
    const statusNotifications: DeliveryNotification[] = [];
    const now = new Date().toISOString();

    // Generate notifications based on current status
    switch (currentStatus) {
      case 'PICKED_UP':
        statusNotifications.push({
          id: 'pickup-notification',
          type: 'pickup',
          title: 'Package Picked Up',
          message: 'Your package has been collected by the courier and is now in transit.',
          timestamp: now,
          read: false,
          trackingNumber,
        });
        break;

      case 'IN_TRANSIT':
        statusNotifications.push({
          id: 'transit-notification',
          type: 'transit',
          title: 'Package In Transit',
          message: 'Your package is on its way to the destination.',
          timestamp: now,
          read: false,
          trackingNumber,
        });
        break;

      case 'OUT_FOR_DELIVERY':
        statusNotifications.push({
          id: 'delivery-notification',
          type: 'delivery',
          title: 'Out for Delivery',
          message: 'Your package is out for delivery and will arrive soon!',
          timestamp: now,
          read: false,
          trackingNumber,
          actionRequired: false,
        });
        break;

      case 'DELIVERED':
        statusNotifications.push({
          id: 'delivered-notification',
          type: 'delivered',
          title: 'Package Delivered',
          message: 'Your package has been successfully delivered. Thank you for your order!',
          timestamp: now,
          read: false,
          trackingNumber,
        });
        break;

      case 'FAILED':
      case 'CANCELLED':
        statusNotifications.push({
          id: 'exception-notification',
          type: 'exception',
          title: 'Delivery Issue',
          message: 'There was an issue with your delivery. Please contact support for assistance.',
          timestamp: now,
          read: false,
          trackingNumber,
          actionRequired: true,
        });
        break;
    }

    return statusNotifications;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    } else {
      return date.toLocaleDateString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  // Combine server notifications with status notifications
  const allNotifications = [
    ...getStatusNotifications(),
    ...notifications,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Notification Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span>Delivery Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        {/* Notification Settings */}
        {showSettings && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Notification Preferences</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email-notifications"
                      checked={preferences.email}
                      onCheckedChange={(checked) =>
                        savePreferences({ ...preferences, email: checked })
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="email-notifications" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email notifications
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sms-notifications"
                      checked={preferences.sms}
                      onCheckedChange={(checked) =>
                        savePreferences({ ...preferences, sms: checked })
                      }
                      disabled={loading || !customerPhone}
                    />
                    <Label htmlFor="sms-notifications" className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      SMS notifications
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="important-only"
                      checked={preferences.important}
                      onCheckedChange={(checked) =>
                        savePreferences({ ...preferences, important: checked })
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="important-only">Important updates only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="all-updates"
                      checked={preferences.allUpdates}
                      onCheckedChange={(checked) =>
                        savePreferences({ ...preferences, allUpdates: checked })
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="all-updates">All tracking updates</Label>
                  </div>
                </div>
              </div>

              {customerEmail && (
                <Alert>
                  <AlertDescription>
                    Notifications will be sent to: {customerEmail}
                    {customerPhone && ` and ${customerPhone}`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {allNotifications.length > 0 ? (
          allNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all ${
                !notification.read 
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/30' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getNotificationTypeBadge(notification.type)}`}
                          >
                            {notification.type}
                          </Badge>
                          {notification.actionRequired && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.trackingNumber && (
                            <span>#{notification.trackingNumber}</span>
                          )}
                        </div>
                      </div>

                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-sm text-gray-600">
                You'll receive updates here as your package moves through the delivery process.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notification Methods Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Stay informed</p>
              <p>
                Get real-time updates about your delivery via email, SMS, or push notifications.
                Important delivery updates will always be sent regardless of your preferences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}