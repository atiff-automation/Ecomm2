/**
 * Customer Notification Preferences Service
 * Manages customer notification settings and preferences
 */

import { prisma } from '@/lib/db/prisma';

export type NotificationType =
  | 'ORDER_CONFIRMATION'
  | 'ORDER_STATUS_UPDATE'
  | 'SHIPPING_UPDATE'
  | 'DELIVERY_UPDATE'
  | 'PAYMENT_CONFIRMATION'
  | 'PROMOTIONAL_OFFERS'
  | 'MEMBER_BENEFITS'
  | 'STOCK_ALERTS'
  | 'PRICE_DROP_ALERTS'
  | 'NEW_ARRIVALS'
  | 'NEWSLETTER'
  | 'SYSTEM_UPDATES';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: NotificationType;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  frequency?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  orderUpdates: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  marketing: {
    email: boolean;
    sms: boolean;
    push: boolean;
    frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  };
  stockAlerts: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  memberBenefits: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  newsletter: {
    email: boolean;
    frequency: 'WEEKLY' | 'MONTHLY';
  };
}

export class NotificationService {
  /**
   * Get user's notification preferences
   */
  async getUserNotificationPreferences(
    userId: string
  ): Promise<NotificationSettings> {
    try {
      // Get user preferences from database
      const preferences = await prisma.notificationPreference.findMany({
        where: { userId },
      });

      // Convert database preferences to structured settings
      const settings: NotificationSettings = {
        orderUpdates: {
          email: this.getPreferenceValue(
            preferences,
            [
              'ORDER_CONFIRMATION',
              'ORDER_STATUS_UPDATE',
              'SHIPPING_UPDATE',
              'DELIVERY_UPDATE',
            ],
            'EMAIL'
          ),
          sms: this.getPreferenceValue(
            preferences,
            [
              'ORDER_CONFIRMATION',
              'ORDER_STATUS_UPDATE',
              'SHIPPING_UPDATE',
              'DELIVERY_UPDATE',
            ],
            'SMS'
          ),
          push: this.getPreferenceValue(
            preferences,
            [
              'ORDER_CONFIRMATION',
              'ORDER_STATUS_UPDATE',
              'SHIPPING_UPDATE',
              'DELIVERY_UPDATE',
            ],
            'PUSH'
          ),
          inApp: this.getPreferenceValue(
            preferences,
            [
              'ORDER_CONFIRMATION',
              'ORDER_STATUS_UPDATE',
              'SHIPPING_UPDATE',
              'DELIVERY_UPDATE',
            ],
            'IN_APP'
          ),
        },
        marketing: {
          email: this.getPreferenceValue(
            preferences,
            ['PROMOTIONAL_OFFERS', 'NEW_ARRIVALS'],
            'EMAIL'
          ),
          sms: this.getPreferenceValue(
            preferences,
            ['PROMOTIONAL_OFFERS'],
            'SMS'
          ),
          push: this.getPreferenceValue(
            preferences,
            ['PROMOTIONAL_OFFERS', 'NEW_ARRIVALS'],
            'PUSH'
          ),
          frequency: this.getPreferenceFrequency(preferences, [
            'PROMOTIONAL_OFFERS',
          ]),
        },
        stockAlerts: {
          email: this.getPreferenceValue(
            preferences,
            ['STOCK_ALERTS', 'PRICE_DROP_ALERTS'],
            'EMAIL'
          ),
          push: this.getPreferenceValue(
            preferences,
            ['STOCK_ALERTS', 'PRICE_DROP_ALERTS'],
            'PUSH'
          ),
          inApp: this.getPreferenceValue(
            preferences,
            ['STOCK_ALERTS', 'PRICE_DROP_ALERTS'],
            'IN_APP'
          ),
        },
        memberBenefits: {
          email: this.getPreferenceValue(
            preferences,
            ['MEMBER_BENEFITS'],
            'EMAIL'
          ),
          push: this.getPreferenceValue(
            preferences,
            ['MEMBER_BENEFITS'],
            'PUSH'
          ),
          inApp: this.getPreferenceValue(
            preferences,
            ['MEMBER_BENEFITS'],
            'IN_APP'
          ),
        },
        newsletter: {
          email: this.getPreferenceValue(preferences, ['NEWSLETTER'], 'EMAIL'),
          frequency:
            this.getPreferenceFrequency(preferences, ['NEWSLETTER']) ===
            'MONTHLY'
              ? 'MONTHLY'
              : 'WEEKLY',
        },
      };

      return settings;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Return default settings
      return this.getDefaultNotificationSettings();
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateUserNotificationPreferences(
    userId: string,
    settings: NotificationSettings
  ): Promise<boolean> {
    try {
      // Delete existing preferences
      await prisma.notificationPreference.deleteMany({
        where: { userId },
      });

      // Create new preferences based on settings
      const preferencesToCreate = this.convertSettingsToPreferences(
        userId,
        settings
      );

      // Batch create new preferences
      await prisma.notificationPreference.createMany({
        data: preferencesToCreate,
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Check if user should receive a specific notification
   */
  async shouldSendNotification(
    userId: string,
    notificationType: NotificationType,
    channel: NotificationChannel
  ): Promise<boolean> {
    try {
      const preference = await prisma.notificationPreference.findFirst({
        where: {
          userId,
          notificationType,
        },
      });

      if (!preference) {
        // Use default settings if no preference found
        const defaultSettings = this.getDefaultNotificationSettings();
        return this.getDefaultChannelSetting(
          notificationType,
          channel,
          defaultSettings
        );
      }

      switch (channel) {
        case 'EMAIL':
          return preference.emailEnabled;
        case 'SMS':
          return preference.smsEnabled;
        case 'PUSH':
          return preference.pushEnabled;
        case 'IN_APP':
          return preference.inAppEnabled;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking notification preference:', error);
      return false;
    }
  }

  /**
   * Get notification frequency for a user and notification type
   */
  async getNotificationFrequency(
    userId: string,
    notificationType: NotificationType
  ): Promise<string> {
    try {
      const preference = await prisma.notificationPreference.findFirst({
        where: {
          userId,
          notificationType,
        },
      });

      return preference?.frequency || 'IMMEDIATE';
    } catch (error) {
      console.error('Error getting notification frequency:', error);
      return 'IMMEDIATE';
    }
  }

  /**
   * Initialize default notification preferences for a new user
   */
  async initializeUserNotificationPreferences(
    userId: string
  ): Promise<boolean> {
    try {
      const defaultSettings = this.getDefaultNotificationSettings();
      return await this.updateUserNotificationPreferences(
        userId,
        defaultSettings
      );
    } catch (error) {
      console.error('Error initializing notification preferences:', error);
      return false;
    }
  }

  /**
   * Helper method to get preference value for specific notification types and channel
   */
  private getPreferenceValue(
    preferences: any[],
    notificationTypes: NotificationType[],
    channel: NotificationChannel
  ): boolean {
    const relevantPrefs = preferences.filter(p =>
      notificationTypes.includes(p.notificationType)
    );
    if (relevantPrefs.length === 0) {
      return true;
    } // Default to enabled

    // Return true if any relevant preference has the channel enabled
    return relevantPrefs.some(pref => {
      switch (channel) {
        case 'EMAIL':
          return pref.emailEnabled;
        case 'SMS':
          return pref.smsEnabled;
        case 'PUSH':
          return pref.pushEnabled;
        case 'IN_APP':
          return pref.inAppEnabled;
        default:
          return false;
      }
    });
  }

  /**
   * Helper method to get frequency for specific notification types
   */
  private getPreferenceFrequency(
    preferences: any[],
    notificationTypes: NotificationType[]
  ): 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' {
    const relevantPrefs = preferences.filter(p =>
      notificationTypes.includes(p.notificationType)
    );
    if (relevantPrefs.length === 0) {
      return 'IMMEDIATE';
    }

    // Return the first found frequency
    return relevantPrefs[0].frequency || 'IMMEDIATE';
  }

  /**
   * Convert structured settings to database preferences format
   */
  private convertSettingsToPreferences(
    userId: string,
    settings: NotificationSettings
  ): any[] {
    const preferences: any[] = [];

    // Order updates
    const orderTypes: NotificationType[] = [
      'ORDER_CONFIRMATION',
      'ORDER_STATUS_UPDATE',
      'SHIPPING_UPDATE',
      'DELIVERY_UPDATE',
    ];
    orderTypes.forEach(type => {
      preferences.push({
        userId,
        notificationType: type,
        emailEnabled: settings.orderUpdates.email,
        smsEnabled: settings.orderUpdates.sms,
        pushEnabled: settings.orderUpdates.push,
        inAppEnabled: settings.orderUpdates.inApp,
        frequency: 'IMMEDIATE',
      });
    });

    // Marketing
    const marketingTypes: NotificationType[] = [
      'PROMOTIONAL_OFFERS',
      'NEW_ARRIVALS',
    ];
    marketingTypes.forEach(type => {
      preferences.push({
        userId,
        notificationType: type,
        emailEnabled: settings.marketing.email,
        smsEnabled: settings.marketing.sms,
        pushEnabled: settings.marketing.push,
        inAppEnabled: false,
        frequency: settings.marketing.frequency,
      });
    });

    // Stock alerts
    const stockTypes: NotificationType[] = [
      'STOCK_ALERTS',
      'PRICE_DROP_ALERTS',
    ];
    stockTypes.forEach(type => {
      preferences.push({
        userId,
        notificationType: type,
        emailEnabled: settings.stockAlerts.email,
        smsEnabled: false,
        pushEnabled: settings.stockAlerts.push,
        inAppEnabled: settings.stockAlerts.inApp,
        frequency: 'IMMEDIATE',
      });
    });

    // Member benefits
    preferences.push({
      userId,
      notificationType: 'MEMBER_BENEFITS',
      emailEnabled: settings.memberBenefits.email,
      smsEnabled: false,
      pushEnabled: settings.memberBenefits.push,
      inAppEnabled: settings.memberBenefits.inApp,
      frequency: 'WEEKLY',
    });

    // Newsletter
    preferences.push({
      userId,
      notificationType: 'NEWSLETTER',
      emailEnabled: settings.newsletter.email,
      smsEnabled: false,
      pushEnabled: false,
      inAppEnabled: false,
      frequency: settings.newsletter.frequency,
    });

    return preferences;
  }

  /**
   * Get default notification settings
   */
  private getDefaultNotificationSettings(): NotificationSettings {
    return {
      orderUpdates: {
        email: true,
        sms: false,
        push: true,
        inApp: true,
      },
      marketing: {
        email: false,
        sms: false,
        push: false,
        frequency: 'WEEKLY',
      },
      stockAlerts: {
        email: false,
        push: true,
        inApp: true,
      },
      memberBenefits: {
        email: true,
        push: true,
        inApp: true,
      },
      newsletter: {
        email: false,
        frequency: 'MONTHLY',
      },
    };
  }

  /**
   * Get default channel setting for notification type
   */
  private getDefaultChannelSetting(
    notificationType: NotificationType,
    channel: NotificationChannel,
    defaultSettings: NotificationSettings
  ): boolean {
    // This is a simplified mapping - in a real implementation,
    // you'd have more complex logic based on notification type
    switch (notificationType) {
      case 'ORDER_CONFIRMATION':
      case 'ORDER_STATUS_UPDATE':
      case 'SHIPPING_UPDATE':
      case 'DELIVERY_UPDATE':
        return defaultSettings.orderUpdates[
          channel.toLowerCase() as keyof typeof defaultSettings.orderUpdates
        ] as boolean;
      case 'PROMOTIONAL_OFFERS':
      case 'NEW_ARRIVALS':
        return (
          channel !== 'IN_APP' &&
          (defaultSettings.marketing[
            channel.toLowerCase() as keyof Omit<
              typeof defaultSettings.marketing,
              'frequency'
            >
          ] as boolean)
        );
      case 'MEMBER_BENEFITS':
        return defaultSettings.memberBenefits[
          channel.toLowerCase() as keyof typeof defaultSettings.memberBenefits
        ] as boolean;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
