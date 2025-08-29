/**
 * Delivery Timeline Visualization Component
 * Enhanced tracking visualization with progress timeline
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.2
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Navigation,
  Building,
} from 'lucide-react';

interface TrackingEvent {
  id?: string;
  eventCode: string;
  eventName: string;
  description: string;
  location?: string;
  eventTime: string;
  source: string;
  category?: string;
  isImportant?: boolean;
  courierRemarks?: string;
}

interface DeliveryTimelineProps {
  trackingNumber: string;
  currentStatus: string;
  statusDescription: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingEvents: TrackingEvent[];
  courierName?: string;
  serviceName?: string;
  progress?: number;
  isDelivered?: boolean;
  inTransit?: boolean;
  className?: string;
}

// Timeline stages for visualization
const DELIVERY_STAGES = [
  {
    key: 'BOOKED',
    label: 'Order Confirmed',
    description: 'Your order has been placed and confirmed',
    icon: Package,
    color: 'blue',
  },
  {
    key: 'LABEL_GENERATED',
    label: 'Label Created',
    description: 'Shipping label has been generated',
    icon: Package,
    color: 'blue',
  },
  {
    key: 'PICKUP_SCHEDULED',
    label: 'Pickup Scheduled',
    description: 'Courier pickup has been arranged',
    icon: Calendar,
    color: 'orange',
  },
  {
    key: 'PICKED_UP',
    label: 'Picked Up',
    description: 'Package collected by courier',
    icon: Truck,
    color: 'orange',
  },
  {
    key: 'IN_TRANSIT',
    label: 'In Transit',
    description: 'Package is on its way to you',
    icon: Navigation,
    color: 'blue',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    description: 'Package is out for final delivery',
    icon: Truck,
    color: 'green',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    description: 'Package has been successfully delivered',
    icon: CheckCircle2,
    color: 'green',
  },
];

export default function DeliveryTimelineVisualization({
  trackingNumber,
  currentStatus,
  statusDescription,
  estimatedDelivery,
  actualDelivery,
  trackingEvents,
  courierName,
  serviceName,
  progress = 0,
  isDelivered = false,
  inTransit = false,
  className = '',
}: DeliveryTimelineProps) {
  // Calculate progress and current stage
  const timelineData = useMemo(() => {
    const currentStageIndex = DELIVERY_STAGES.findIndex(
      stage =>
        stage.key === currentStatus ||
        (currentStatus === 'COMPLETED' && stage.key === 'DELIVERED')
    );

    const progressPercentage =
      progress ||
      (currentStageIndex >= 0
        ? ((currentStageIndex + 1) / DELIVERY_STAGES.length) * 100
        : 0);

    return {
      currentStageIndex,
      progressPercentage: Math.min(progressPercentage, 100),
      stages: DELIVERY_STAGES.map((stage, index) => ({
        ...stage,
        isCompleted: index <= currentStageIndex,
        isCurrent: index === currentStageIndex,
        hasEvent: trackingEvents.some(
          event =>
            event.eventCode === stage.key ||
            (stage.key === 'IN_TRANSIT' &&
              ['IN_TRANSIT', 'ARRIVED_AT_HUB', 'DEPARTED_FROM_HUB'].includes(
                event.eventCode
              ))
        ),
      })),
    };
  }, [currentStatus, progress, trackingEvents]);

  // Get status color
  const getStatusColor = (status: string) => {
    if (isDelivered) {
      return 'green';
    }
    if (inTransit) {
      return 'blue';
    }
    if (['CANCELLED', 'FAILED'].includes(status)) {
      return 'red';
    }
    return 'orange';
  };

  // Format date for Malaysian timezone
  const formatDate = (dateString: string, includeTime = false) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }),
    };
    return date.toLocaleDateString('en-MY', options);
  };

  // Categorize events by type
  const categorizedEvents = useMemo(() => {
    const categories = {
      preparation: [] as TrackingEvent[],
      pickup: [] as TrackingEvent[],
      transit: [] as TrackingEvent[],
      delivery: [] as TrackingEvent[],
      completed: [] as TrackingEvent[],
      exception: [] as TrackingEvent[],
      other: [] as TrackingEvent[],
    };

    trackingEvents.forEach(event => {
      const category = event.category || 'other';
      if (category in categories) {
        categories[category as keyof typeof categories].push(event);
      } else {
        categories.other.push(event);
      }
    });

    return categories;
  }, [trackingEvents]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Delivery Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{statusDescription}</h3>
                <p className="text-sm text-muted-foreground">
                  Tracking #{trackingNumber}
                </p>
                {courierName && (
                  <p className="text-sm text-muted-foreground">
                    via {courierName} {serviceName && `- ${serviceName}`}
                  </p>
                )}
              </div>
              <Badge
                variant="secondary"
                className={`${
                  getStatusColor(currentStatus) === 'green'
                    ? 'bg-green-100 text-green-800'
                    : getStatusColor(currentStatus) === 'blue'
                      ? 'bg-blue-100 text-blue-800'
                      : getStatusColor(currentStatus) === 'red'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                }`}
              >
                {currentStatus.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(timelineData.progressPercentage)}%</span>
              </div>
              <Progress
                value={timelineData.progressPercentage}
                className="h-2"
              />
            </div>

            {/* Delivery Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {estimatedDelivery && !actualDelivery && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-muted-foreground">
                    Estimated delivery:
                  </span>
                  <span className="font-medium">
                    {formatDate(estimatedDelivery)}
                  </span>
                </div>
              )}

              {actualDelivery && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">Delivered:</span>
                  <span className="font-medium">
                    {formatDate(actualDelivery, true)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineData.stages.map((stage, index) => {
              const Icon = stage.icon;
              const stageEvents = trackingEvents.filter(
                event =>
                  event.eventCode === stage.key ||
                  (stage.key === 'IN_TRANSIT' &&
                    [
                      'IN_TRANSIT',
                      'ARRIVED_AT_HUB',
                      'DEPARTED_FROM_HUB',
                    ].includes(event.eventCode))
              );

              return (
                <div key={stage.key} className="flex gap-4">
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        stage.isCompleted
                          ? stage.color === 'green'
                            ? 'bg-green-500 text-white'
                            : stage.color === 'blue'
                              ? 'bg-blue-500 text-white'
                              : 'bg-orange-500 text-white'
                          : stage.isCurrent
                            ? 'bg-white border-2 border-blue-500 text-blue-500'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < timelineData.stages.length - 1 && (
                      <div
                        className={`w-px h-12 ${
                          stage.isCompleted ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Timeline Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-medium ${
                          stage.isCompleted || stage.isCurrent
                            ? 'text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {stage.label}
                      </h4>
                      {stage.isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700"
                        >
                          Current
                        </Badge>
                      )}
                      {stage.isCompleted && !stage.isCurrent && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>

                    <p
                      className={`text-sm ${
                        stage.isCompleted || stage.isCurrent
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {stage.description}
                    </p>

                    {/* Stage Events */}
                    {stageEvents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {stageEvents.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className="text-xs text-gray-500 ml-2 border-l-2 border-gray-200 pl-2"
                          >
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {event.eventName}
                              </span>
                              {event.isImportant && (
                                <Badge variant="outline" className="text-xs">
                                  Important
                                </Badge>
                              )}
                            </div>
                            {event.location && (
                              <p className="text-gray-400">{event.location}</p>
                            )}
                            <p className="text-gray-400">
                              {formatDate(event.eventTime, true)}
                            </p>
                            {event.courierRemarks && (
                              <p className="text-gray-600 italic">
                                "{event.courierRemarks}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Categories */}
      {Object.entries(categorizedEvents).some(
        ([_, events]) => events.length > 0
      ) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Detailed Tracking Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categorizedEvents).map(([category, events]) => {
                if (events.length === 0) {
                  return null;
                }

                return (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()} Events
                    </h4>
                    <div className="space-y-2">
                      {events.map((event, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {event.eventName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {event.source}
                              </Badge>
                              {event.isImportant && (
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {event.description}
                            </p>
                            {event.location && (
                              <p className="text-xs text-gray-500 mt-1">
                                📍 {event.location}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(event.eventTime, true)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
