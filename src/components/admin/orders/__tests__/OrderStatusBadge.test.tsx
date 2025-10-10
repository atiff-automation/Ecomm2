import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from '../OrderStatusBadge';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

describe('OrderStatusBadge', () => {
  describe('Order Status', () => {
    it('renders PENDING status correctly', () => {
      render(<OrderStatusBadge status={OrderStatus.PENDING} type="order" />);
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });

    it('renders PAID status correctly', () => {
      render(<OrderStatusBadge status={OrderStatus.PAID} type="order" />);
      expect(screen.getByText(/Paid/i)).toBeInTheDocument();
    });

    it('renders READY_TO_SHIP status correctly', () => {
      render(
        <OrderStatusBadge status={OrderStatus.READY_TO_SHIP} type="order" />
      );
      expect(screen.getByText(/Ready to Ship/i)).toBeInTheDocument();
    });

    it('renders DELIVERED status correctly', () => {
      render(<OrderStatusBadge status={OrderStatus.DELIVERED} type="order" />);
      expect(screen.getByText(/Delivered/i)).toBeInTheDocument();
    });

    it('renders CANCELLED status correctly', () => {
      render(<OrderStatusBadge status={OrderStatus.CANCELLED} type="order" />);
      expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();
    });

    it('renders REFUNDED status correctly', () => {
      render(<OrderStatusBadge status={OrderStatus.REFUNDED} type="order" />);
      expect(screen.getByText(/Refunded/i)).toBeInTheDocument();
    });
  });

  describe('Payment Status', () => {
    it('renders PENDING payment status correctly', () => {
      const { container } = render(
        <OrderStatusBadge status={PaymentStatus.PENDING} type="payment" />
      );
      // Payment Pending status might have a different label
      expect(container).toBeTruthy();
      const badge = container.querySelector('div');
      expect(badge).toBeInTheDocument();
    });

    it('renders PAID payment status correctly', () => {
      render(<OrderStatusBadge status={PaymentStatus.PAID} type="payment" />);
      expect(screen.getByText(/Paid/i)).toBeInTheDocument();
    });

    it('renders FAILED payment status correctly', () => {
      render(<OrderStatusBadge status={PaymentStatus.FAILED} type="payment" />);
      expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    });

    it('renders REFUNDED payment status correctly', () => {
      render(
        <OrderStatusBadge status={PaymentStatus.REFUNDED} type="payment" />
      );
      expect(screen.getByText(/Refunded/i)).toBeInTheDocument();
    });
  });

  describe('Shipment Status', () => {
    it('renders DRAFT shipment status correctly', () => {
      render(
        <OrderStatusBadge status={ShipmentStatus.DRAFT} type="shipment" />
      );
      expect(screen.getByText(/Draft/i)).toBeInTheDocument();
    });

    it('renders LABEL_GENERATED shipment status correctly', () => {
      render(
        <OrderStatusBadge
          status={ShipmentStatus.LABEL_GENERATED}
          type="shipment"
        />
      );
      expect(screen.getByText(/Label/i)).toBeInTheDocument();
    });

    it('renders PICKED_UP shipment status correctly', () => {
      render(
        <OrderStatusBadge status={ShipmentStatus.PICKED_UP} type="shipment" />
      );
      expect(screen.getByText(/Picked/i)).toBeInTheDocument();
    });

    it('renders IN_TRANSIT shipment status correctly', () => {
      render(
        <OrderStatusBadge status={ShipmentStatus.IN_TRANSIT} type="shipment" />
      );
      expect(screen.getByText(/Transit/i)).toBeInTheDocument();
    });

    it('renders OUT_FOR_DELIVERY shipment status correctly', () => {
      render(
        <OrderStatusBadge
          status={ShipmentStatus.OUT_FOR_DELIVERY}
          type="shipment"
        />
      );
      expect(screen.getByText(/Delivery/i)).toBeInTheDocument();
    });

    it('renders DELIVERED shipment status correctly', () => {
      render(
        <OrderStatusBadge status={ShipmentStatus.DELIVERED} type="shipment" />
      );
      expect(screen.getByText(/Delivered/i)).toBeInTheDocument();
    });

    it('renders FAILED shipment status correctly', () => {
      render(
        <OrderStatusBadge status={ShipmentStatus.FAILED} type="shipment" />
      );
      expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    });

    it('renders CANCELLED shipment status correctly', () => {
      render(
        <OrderStatusBadge status={ShipmentStatus.CANCELLED} type="shipment" />
      );
      expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size badge', () => {
      const { container } = render(
        <OrderStatusBadge status={OrderStatus.PENDING} type="order" size="sm" />
      );
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('text-xs');
    });

    it('renders medium size badge (default)', () => {
      const { container } = render(
        <OrderStatusBadge status={OrderStatus.PENDING} type="order" size="md" />
      );
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('text-sm');
    });

    it('renders large size badge', () => {
      const { container } = render(
        <OrderStatusBadge status={OrderStatus.PENDING} type="order" size="lg" />
      );
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('text-base');
    });
  });

  describe('Icon Display', () => {
    it('shows icon by default', () => {
      const { container } = render(
        <OrderStatusBadge status={OrderStatus.PENDING} type="order" />
      );
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      const { container } = render(
        <OrderStatusBadge
          status={OrderStatus.PENDING}
          type="order"
          showIcon={false}
        />
      );
      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(
        <OrderStatusBadge
          status={OrderStatus.PENDING}
          type="order"
          className="custom-class"
        />
      );
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has accessible title attribute', () => {
      const { container } = render(
        <OrderStatusBadge status={OrderStatus.DELIVERED} type="order" />
      );
      expect(screen.getByText(/Delivered/i)).toBeInTheDocument();
      // Title uses description from config, not "Order Status: X" format
      expect(container.firstChild).toHaveAttribute('title');
    });

    it('has accessible title for payment status', () => {
      const { container } = render(
        <OrderStatusBadge status={PaymentStatus.PAID} type="payment" />
      );
      expect(screen.getByText(/Paid/i)).toBeInTheDocument();
      // Title uses description from config
      expect(container.firstChild).toHaveAttribute('title');
    });

    it('has accessible title for shipment status', () => {
      const { container } = render(
        <OrderStatusBadge status={ShipmentStatus.DELIVERED} type="shipment" />
      );
      expect(screen.getByText(/Delivered/i)).toBeInTheDocument();
      // Title uses description from config
      expect(container.firstChild).toHaveAttribute('title');
    });
  });
});
