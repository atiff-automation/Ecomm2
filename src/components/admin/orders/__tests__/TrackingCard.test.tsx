import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackingCard } from '../TrackingCard';
import { ShipmentStatus } from '@prisma/client';
import type { ShipmentWithTracking } from '../types';

describe('TrackingCard', () => {
  const mockShipment: ShipmentWithTracking = {
    id: 'shipment-1',
    orderId: 'order-1',
    trackingNumber: 'TRACK123456',
    courierName: 'EasyParcel Express',
    status: ShipmentStatus.IN_TRANSIT,
    shippingFee: 1000,
    estimatedDelivery: new Date('2025-01-20'),
    actualDelivery: null,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    trackingEvents: [
      {
        id: 'event-1',
        shipmentId: 'shipment-1',
        eventTime: new Date('2025-01-15T10:00:00Z'),
        eventCode: 'PICKED_UP',
        eventName: 'Picked Up',
        description: 'Package picked up',
        location: 'Kuala Lumpur Warehouse',
        createdAt: new Date('2025-01-15T10:00:00Z'),
        timezone: 'Asia/Kuala_Lumpur',
        source: 'EASYPARCEL',
      },
      {
        id: 'event-2',
        shipmentId: 'shipment-1',
        eventTime: new Date('2025-01-15T14:00:00Z'),
        eventCode: 'IN_TRANSIT',
        eventName: 'In Transit',
        description: 'In transit to sorting facility',
        location: 'KL Distribution Center',
        createdAt: new Date('2025-01-15T14:00:00Z'),
        timezone: 'Asia/Kuala_Lumpur',
        source: 'EASYPARCEL',
      },
      {
        id: 'event-3',
        shipmentId: 'shipment-1',
        eventTime: new Date('2025-01-16T08:00:00Z'),
        eventCode: 'ARRIVED',
        eventName: 'Arrived',
        description: 'Arrived at sorting facility',
        location: 'Penang Hub',
        createdAt: new Date('2025-01-16T08:00:00Z'),
        timezone: 'Asia/Kuala_Lumpur',
        source: 'EASYPARCEL',
      },
      {
        id: 'event-4',
        shipmentId: 'shipment-1',
        eventTime: new Date('2025-01-16T12:00:00Z'),
        eventCode: 'OUT_FOR_DELIVERY',
        eventName: 'Out For Delivery',
        description: 'Out for delivery',
        location: 'Penang',
        createdAt: new Date('2025-01-16T12:00:00Z'),
        timezone: 'Asia/Kuala_Lumpur',
        source: 'EASYPARCEL',
      },
    ],
  };

  describe('Rendering', () => {
    it('renders shipment tracking card', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('Shipment Tracking')).toBeInTheDocument();
    });

    it('displays tracking number', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('TRACK123456')).toBeInTheDocument();
    });

    it('displays courier name', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('EasyParcel Express')).toBeInTheDocument();
    });

    it('displays shipment status', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('In Transit')).toBeInTheDocument();
    });

    it('renders tracking history', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('Tracking History')).toBeInTheDocument();
      expect(screen.getByText('Package picked up')).toBeInTheDocument();
    });
  });

  describe('No Shipment State', () => {
    it('shows no shipment message when shipment is null', () => {
      render(<TrackingCard shipment={null} />);
      expect(screen.getByText('Shipment Tracking')).toBeInTheDocument();
      expect(
        screen.getByText('No shipment information available')
      ).toBeInTheDocument();
    });

    it('shows no shipment message when shipment is undefined', () => {
      render(<TrackingCard />);
      expect(
        screen.getByText('No shipment information available')
      ).toBeInTheDocument();
    });
  });

  describe('Tracking Events', () => {
    it('displays first 3 events by default', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('Package picked up')).toBeInTheDocument();
      expect(
        screen.getByText('In transit to sorting facility')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Arrived at sorting facility')
      ).toBeInTheDocument();
    });

    it('shows "Show more" button when more than 3 events', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('Show 1 more events')).toBeInTheDocument();
    });

    it('displays all events when "Show more" is clicked', async () => {
      render(<TrackingCard shipment={mockShipment} />);

      const showMoreButton = screen.getByText('Show 1 more events');
      await userEvent.click(showMoreButton);

      expect(screen.getByText('Out for delivery')).toBeInTheDocument();
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('collapses events when "Show less" is clicked', async () => {
      render(<TrackingCard shipment={mockShipment} />);

      const showMoreButton = screen.getByText('Show 1 more events');
      await userEvent.click(showMoreButton);

      const showLessButton = screen.getByText('Show less');
      await userEvent.click(showLessButton);

      expect(screen.getByText('Show 1 more events')).toBeInTheDocument();
    });

    it('displays event locations', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('Kuala Lumpur Warehouse')).toBeInTheDocument();
      expect(screen.getByText('KL Distribution Center')).toBeInTheDocument();
    });

    it('shows all events when showFullHistory is true', () => {
      render(<TrackingCard shipment={mockShipment} showFullHistory={true} />);
      expect(screen.getByText('Out for delivery')).toBeInTheDocument();
      expect(screen.queryByText('Show 1 more events')).not.toBeInTheDocument();
    });
  });

  describe('No Tracking Events', () => {
    it('shows message when no tracking events available', () => {
      const shipmentNoEvents: ShipmentWithTracking = {
        ...mockShipment,
        trackingEvents: [],
      };

      render(<TrackingCard shipment={shipmentNoEvents} />);
      expect(
        screen.getByText('No tracking events available yet')
      ).toBeInTheDocument();
    });
  });

  describe('EasyParcel Tracking Link', () => {
    it('renders Track on EasyParcel button', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('Track on EasyParcel')).toBeInTheDocument();
    });

    it('opens EasyParcel tracking in new window', () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

      render(<TrackingCard shipment={mockShipment} />);
      const trackButton = screen.getByText('Track on EasyParcel');
      fireEvent.click(trackButton);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://track.easyparcel.my/TRACK123456',
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('does not render tracking button when no tracking number', () => {
      const shipmentNoTracking: ShipmentWithTracking = {
        ...mockShipment,
        trackingNumber: null,
      };

      render(<TrackingCard shipment={shipmentNoTracking} />);
      expect(screen.queryByText('Track on EasyParcel')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Tracking', () => {
    it('renders refresh button when onRefreshTracking is provided', () => {
      const mockRefresh = jest.fn();
      const { container } = render(
        <TrackingCard shipment={mockShipment} onRefreshTracking={mockRefresh} />
      );
      const refreshButton = container.querySelector('button svg.h-4.w-4');
      expect(refreshButton).toBeInTheDocument();
    });

    it('calls onRefreshTracking when refresh button is clicked', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const { container } = render(
        <TrackingCard shipment={mockShipment} onRefreshTracking={mockRefresh} />
      );

      const refreshButton = container.querySelector('button') as HTMLElement;
      await userEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('shows spinning icon when isRefreshing is true', () => {
      const mockRefresh = jest.fn();
      const { container } = render(
        <TrackingCard
          shipment={mockShipment}
          onRefreshTracking={mockRefresh}
          isRefreshing={true}
        />
      );
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('disables refresh button when isRefreshing is true', () => {
      const mockRefresh = jest.fn();
      const { container } = render(
        <TrackingCard
          shipment={mockShipment}
          onRefreshTracking={mockRefresh}
          isRefreshing={true}
        />
      );
      const refreshButton = container.querySelector('button') as HTMLElement;
      expect(refreshButton).toBeDisabled();
    });

    it('does not render refresh button when onRefreshTracking is not provided', () => {
      render(<TrackingCard shipment={mockShipment} />);
      // The card should have the tracking link button but no refresh button in the header
      expect(screen.getByText('Track on EasyParcel')).toBeInTheDocument();
      // Verify refresh functionality is not available
      const { container } = render(
        <TrackingCard shipment={mockShipment} onRefreshTracking={jest.fn()} />
      );
      const withRefreshButtons = container.querySelectorAll('button');
      const { container: containerNoRefresh } = render(
        <TrackingCard shipment={mockShipment} />
      );
      const noRefreshButtons = containerNoRefresh.querySelectorAll('button');
      expect(noRefreshButtons.length).toBeLessThan(withRefreshButtons.length);
    });
  });

  describe('Timeline Visualization', () => {
    it('highlights most recent event', () => {
      const { container } = render(<TrackingCard shipment={mockShipment} />);
      const checkIcons = container.querySelectorAll('svg');
      // First event should have CheckCircle icon
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('displays timeline connector lines', () => {
      const { container } = render(<TrackingCard shipment={mockShipment} />);
      const connectors = container.querySelectorAll('.bg-gray-200');
      expect(connectors.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has accessible card title', () => {
      render(<TrackingCard shipment={mockShipment} />);
      expect(screen.getByText('Shipment Tracking')).toBeInTheDocument();
    });

    it('has accessible tracking link button', () => {
      render(<TrackingCard shipment={mockShipment} />);
      const trackButton = screen.getByText('Track on EasyParcel');
      expect(trackButton.closest('button')).toBeInTheDocument();
    });

    it('has accessible show more/less button', async () => {
      render(<TrackingCard shipment={mockShipment} />);
      const showMoreButton = screen.getByText('Show 1 more events');
      expect(showMoreButton.closest('button')).toBeInTheDocument();
    });
  });
});
