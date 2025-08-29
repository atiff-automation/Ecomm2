/**
 * TrackingTimeline Component
 * Displays tracking events in a visual timeline
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

'use client';

import React from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  MapPin,
  Package,
  Truck,
  AlertCircle,
} from 'lucide-react';
import TrackingStatus from './TrackingStatus';
import {
  formatTrackingDate,
  sortTrackingEventsByDate,
} from '@/lib/utils/date-formatter';
import { TrackingEvent, TrackingTimelineProps } from '@/lib/types/tracking';

interface TrackingEvent {
  eventName: string;
  description: string;
  timestamp: string;
  location?: string;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: string;
  estimatedDelivery?: string;
  className?: string;
}

/**
 * Get icon for tracking event
 */
const getEventIcon = (
  eventName: string,
  isCompleted: boolean,
  isCurrent: boolean
) => {
  const iconClass = `h-4 w-4 ${
    isCompleted
      ? 'text-green-600'
      : isCurrent
        ? 'text-blue-600'
        : 'text-gray-400'
  }`;

  const eventType = eventName.toLowerCase();

  if (eventType.includes('delivered')) {
    return <CheckCircle className={iconClass} />;
  } else if (
    eventType.includes('out_for_delivery') ||
    eventType.includes('delivery')
  ) {
    return <Truck className={iconClass} />;
  } else if (eventType.includes('transit') || eventType.includes('shipped')) {
    return <Truck className={iconClass} />;
  } else if (eventType.includes('picked') || eventType.includes('collected')) {
    return <Package className={iconClass} />;
  } else if (eventType.includes('exception') || eventType.includes('failed')) {
    return <AlertCircle className={iconClass} />;
  } else if (
    eventType.includes('depot') ||
    eventType.includes('hub') ||
    eventType.includes('location')
  ) {
    return <MapPin className={iconClass} />;
  } else if (isCompleted) {
    return <CheckCircle className={iconClass} />;
  } else {
    return <Circle className={iconClass} />;
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);

  return {
    date: date.toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    relative: getRelativeTime(date),
  };
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-MY');
  }
};

/**
 * Determine if event is completed, current, or pending
 */
const getEventState = (
  event: TrackingEvent,
  index: number,
  currentStatus: string,
  allEvents: TrackingEvent[]
) => {
  const eventStatus = event.eventName.toLowerCase();
  const normalizedCurrentStatus = currentStatus.toLowerCase();

  // Latest event is typically current
  const isLatest = index === 0;

  // If this event matches current status
  const isCurrentStatus =
    eventStatus.includes(normalizedCurrentStatus) ||
    normalizedCurrentStatus.includes(eventStatus);

  return {
    isCompleted: !isLatest && !isCurrentStatus,
    isCurrent: isLatest || isCurrentStatus,
    isPending: false,
  };
};

export default function TrackingTimeline({
  events,
  currentStatus,
  estimatedDelivery,
  className = '',
}: TrackingTimelineProps) {
  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Add estimated delivery as a future event if not delivered
  const isDelivered = currentStatus.toLowerCase() === 'delivered';
  const timelineEvents = [...sortedEvents];

  if (!isDelivered && estimatedDelivery) {
    timelineEvents.push({
      eventName: 'Estimated Delivery',
      description: 'Expected delivery date',
      timestamp: estimatedDelivery,
      location: undefined,
    });
  }

  if (timelineEvents.length === 0) {
    return (
      <div className={`tracking-timeline-empty ${className}`}>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Clock className="h-6 w-6 mr-2" />
          <span>No tracking events available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`tracking-timeline ${className}`}>
      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <h3 className="text-lg font-semibold">Tracking Status</h3>
          <TrackingStatus status={currentStatus} size="md" />
        </div>
        {estimatedDelivery && !isDelivered && (
          <p className="text-sm text-gray-600">
            Estimated delivery: {formatTimestamp(estimatedDelivery).date}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline events */}
        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const eventState = getEventState(
              event,
              index,
              currentStatus,
              sortedEvents
            );
            const timestamp = formatTimestamp(event.timestamp);
            const isEstimated = event.eventName === 'Estimated Delivery';
            const isPast = new Date(event.timestamp) < new Date();

            return (
              <div
                key={`${event.timestamp}-${index}`}
                className="relative flex items-start gap-4"
              >
                {/* Timeline dot */}
                <div
                  className={`
                  relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${
                    eventState.isCompleted
                      ? 'bg-green-100 border-green-300'
                      : eventState.isCurrent
                        ? 'bg-blue-100 border-blue-300'
                        : isEstimated && !isPast
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-gray-100 border-gray-200'
                  }
                `}
                >
                  {getEventIcon(
                    event.eventName,
                    eventState.isCompleted,
                    eventState.isCurrent
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          eventState.isCurrent
                            ? 'text-blue-900'
                            : eventState.isCompleted
                              ? 'text-green-900'
                              : isEstimated && !isPast
                                ? 'text-gray-600'
                                : 'text-gray-700'
                        }`}
                      >
                        {event.eventName}
                      </h4>

                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}

                      {event.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {event.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-right ml-2 sm:ml-4 flex-shrink-0 min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          isEstimated && !isPast
                            ? 'text-gray-500'
                            : eventState.isCurrent
                              ? 'text-blue-700'
                              : 'text-gray-700'
                        }`}
                      >
                        {timestamp.date}
                      </div>
                      {!isEstimated && (
                        <>
                          <div className="text-xs text-gray-500">
                            {timestamp.time}
                          </div>
                          <div className="text-xs text-gray-400">
                            {timestamp.relative}
                          </div>
                        </>
                      )}
                      {isEstimated && !isPast && (
                        <div className="text-xs text-gray-400">Expected</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline footer */}
      {sortedEvents.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Showing {sortedEvents.length} tracking event
            {sortedEvents.length > 1 ? 's' : ''}
            {estimatedDelivery && !isDelivered && ' + estimated delivery'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * TrackingTimelineCard Component
 * Wrapper component with card styling
 */
interface TrackingTimelineCardProps extends TrackingTimelineProps {
  title?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function TrackingTimelineCard({
  title = 'Shipping Timeline',
  onRefresh,
  refreshing = false,
  ...timelineProps
}: TrackingTimelineCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Timeline content */}
      <TrackingTimeline {...timelineProps} />
    </div>
  );
}
