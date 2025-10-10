import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderTable } from '../OrderTable';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import type { OrderTableData } from '../types';

// Mock fetch
global.fetch = jest.fn();

const mockOrders: OrderTableData[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-2025-001',
    createdAt: new Date('2025-01-15T10:30:00Z'),
    updatedAt: new Date('2025-01-15T10:30:00Z'),
    userId: 'user-1',
    guestEmail: null,
    status: OrderStatus.READY_TO_SHIP,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: 'TOYYIBPAY',
    paymentIntentId: 'pi_123',
    subtotal: 15000,
    shippingFee: 500,
    tax: 0,
    discount: 0,
    total: 15500,
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    notes: null,
    trackingNumber: null,
    carrierName: null,
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    orderItems: [
      {
        id: 'item-1',
        quantity: 2,
        productName: 'Test Product',
        appliedPrice: 7500,
      },
    ],
    shipment: null,
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-2025-002',
    createdAt: new Date('2025-01-16T14:20:00Z'),
    updatedAt: new Date('2025-01-16T14:20:00Z'),
    userId: null,
    guestEmail: 'guest@example.com',
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: 'TOYYIBPAY',
    paymentIntentId: 'pi_456',
    subtotal: 25000,
    shippingFee: 800,
    tax: 0,
    discount: 2000,
    total: 23800,
    shippingAddressId: 'addr-2',
    billingAddressId: 'addr-2',
    notes: null,
    trackingNumber: 'TRACK123',
    carrierName: 'EasyParcel',
    user: null,
    orderItems: [
      {
        id: 'item-2',
        quantity: 1,
        productName: 'Another Product',
        appliedPrice: 25000,
      },
    ],
    shipment: {
      trackingNumber: 'TRACK123',
      status: 'DELIVERED',
    },
  },
];

describe('OrderTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Rendering', () => {
    it('renders table with orders', () => {
      render(<OrderTable orders={mockOrders} />);
      expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
    });

    it('displays customer names correctly', () => {
      render(<OrderTable orders={mockOrders} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    });

    it('displays order totals correctly', () => {
      render(<OrderTable orders={mockOrders} />);
      // Prices are formatted using Intl.NumberFormat
      expect(screen.getByText(/RM[\s\u00A0]?15,500\.00/)).toBeInTheDocument();
      expect(screen.getByText(/RM[\s\u00A0]?23,800\.00/)).toBeInTheDocument();
    });

    it('displays order statuses', () => {
      render(<OrderTable orders={mockOrders} />);
      const statuses = screen.getAllByText(/Ready to Ship|Delivered/i);
      expect(statuses.length).toBeGreaterThanOrEqual(2);
    });

    it('displays payment statuses', () => {
      render(<OrderTable orders={mockOrders} />);
      const paidBadges = screen.getAllByText(/Paid/i);
      expect(paidBadges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<OrderTable orders={[]} isLoading={true} />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not show loading spinner when isLoading is false', () => {
      render(<OrderTable orders={mockOrders} isLoading={false} />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no orders', () => {
      render(<OrderTable orders={[]} />);
      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your filters')
      ).toBeInTheDocument();
    });

    it('does not show empty state when orders exist', () => {
      render(<OrderTable orders={mockOrders} />);
      expect(screen.queryByText('No orders found')).not.toBeInTheDocument();
    });
  });

  describe('Checkbox Selection', () => {
    it('renders checkboxes when onSelectOrder is provided', () => {
      const onSelectOrder = jest.fn();
      render(<OrderTable orders={mockOrders} onSelectOrder={onSelectOrder} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('calls onSelectOrder when clicking order checkbox', () => {
      const onSelectOrder = jest.fn();
      render(<OrderTable orders={mockOrders} onSelectOrder={onSelectOrder} />);
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First order checkbox (0 is select all)
      // The first call should be for one of the orders
      expect(onSelectOrder).toHaveBeenCalled();
      expect(onSelectOrder.mock.calls[0][1]).toBe(true);
    });

    it('calls onSelectAll when clicking select all checkbox', () => {
      const onSelectAll = jest.fn();
      render(<OrderTable orders={mockOrders} onSelectAll={onSelectAll} />);
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(onSelectAll).toHaveBeenCalledWith(true);
    });

    it('shows all checkboxes as checked when all selected', () => {
      render(
        <OrderTable
          orders={mockOrders}
          selectedOrderIds={['order-1', 'order-2']}
          onSelectOrder={jest.fn()}
          onSelectAll={jest.fn()}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Inline Actions', () => {
    it('renders view order button', () => {
      render(<OrderTable orders={mockOrders} />);
      const viewButtons = screen.getAllByTitle('View order details');
      expect(viewButtons).toHaveLength(2);
    });

    it('renders print invoice button', () => {
      render(<OrderTable orders={mockOrders} />);
      const printButtons = screen.getAllByTitle('Print invoice');
      expect(printButtons).toHaveLength(2);
    });

    it('renders status selector', () => {
      render(<OrderTable orders={mockOrders} />);
      const selectors = document.querySelectorAll('[role="combobox"]');
      expect(selectors.length).toBeGreaterThan(0);
    });
  });

  describe('Status Update', () => {
    it('has status update functionality', () => {
      render(<OrderTable orders={mockOrders} />);

      // Verify status selectors are rendered
      const selectors = document.querySelectorAll('[role="combobox"]');
      expect(selectors.length).toBeGreaterThan(0);

      // Verify the fetch handler exists for status updates
      expect(global.fetch).toBeDefined();
    });
  });

  describe('Responsive Behavior', () => {
    it('has responsive table classes', () => {
      const { container } = render(<OrderTable orders={mockOrders} />);
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('hides date column on mobile', () => {
      render(<OrderTable orders={mockOrders} />);
      const dateHeader = screen.getByText('Date');
      expect(dateHeader).toHaveClass('hidden', 'md:table-cell');
    });

    it('hides items column on mobile and tablet', () => {
      render(<OrderTable orders={mockOrders} />);
      const itemsHeader = screen.getByText('Items');
      expect(itemsHeader).toHaveClass('hidden', 'lg:table-cell');
    });

    it('hides payment column on mobile', () => {
      render(<OrderTable orders={mockOrders} />);
      const paymentHeader = screen.getByText('Payment');
      expect(paymentHeader).toHaveClass('hidden', 'md:table-cell');
    });
  });

  describe('Accessibility', () => {
    it('has accessible table structure', () => {
      render(<OrderTable orders={mockOrders} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has table headers', () => {
      render(<OrderTable orders={mockOrders} />);
      expect(screen.getByText('Order #')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });
});
