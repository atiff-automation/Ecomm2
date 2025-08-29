/**
 * Component tests for TrackingAnalyticsDashboard
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import TrackingAnalyticsDashboard from '@/components/admin/TrackingAnalyticsDashboard';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'admin-1', role: 'ADMIN' } },
    status: 'authenticated',
  }),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={`card ${className}`}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={`card-content ${className}`}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={`card-header ${className}`}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div className={`card-title ${className}`}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variant} ${className}`}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={e => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select Value</span>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div className="alert">{children}</div>,
  AlertDescription: ({ children }: any) => (
    <div className="alert-description">{children}</div>
  ),
}));

const mockAnalyticsData = {
  success: true,
  stats: {
    totalShipments: 150,
    inTransit: 25,
    delivered: 120,
    exceptions: 5,
    averageDeliveryTime: 3.2,
    onTimeDeliveryRate: 92.5,
    courierPerformance: [
      {
        courierName: 'Pos Laju',
        shipmentCount: 75,
        deliveryRate: 96.0,
        averageTime: 2.8,
      },
      {
        courierName: 'GDex',
        shipmentCount: 50,
        deliveryRate: 88.0,
        averageTime: 3.5,
      },
      {
        courierName: 'City-Link',
        shipmentCount: 25,
        deliveryRate: 92.0,
        averageTime: 3.0,
      },
    ],
  },
};

describe('TrackingAnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsData,
      blob: async () => new Blob(['csv content'], { type: 'text/csv' }),
    } as Response);
  });

  test('renders loading state initially', () => {
    render(<TrackingAnalyticsDashboard />);
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  test('displays analytics data after loading', async () => {
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tracking Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('150')).toBeInTheDocument(); // Total shipments
    expect(screen.getByText('25')).toBeInTheDocument(); // In transit
    expect(screen.getByText('120')).toBeInTheDocument(); // Delivered
    expect(screen.getByText('5')).toBeInTheDocument(); // Exceptions
  });

  test('displays courier performance data', async () => {
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Courier Performance')).toBeInTheDocument();
    });

    expect(screen.getByText('Pos Laju')).toBeInTheDocument();
    expect(screen.getByText('GDex')).toBeInTheDocument();
    expect(screen.getByText('City-Link')).toBeInTheDocument();
    expect(screen.getByText('96.0%')).toBeInTheDocument();
    expect(screen.getByText('2.8 days avg')).toBeInTheDocument();
  });

  test('handles date range selection', async () => {
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tracking Analytics')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '7' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/tracking/analytics?days=7'
      );
    });
  });

  test('handles batch refresh functionality', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
      url => {
        if (url === '/api/admin/orders/batch-tracking-refresh') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: 'Refresh completed' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockAnalyticsData,
        } as Response);
      }
    );

    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Refresh All')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh All');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/orders/batch-tracking-refresh',
        {
          method: 'POST',
        }
      );
    });
  });

  test('handles export functionality', async () => {
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      },
      writable: true,
    });

    // Mock document.createElement and appendChild
    const mockClick = jest.fn();
    const mockElement = {
      href: '',
      download: '',
      click: mockClick,
    };
    const mockCreateElement = jest.fn().mockReturnValue(mockElement);
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
      writable: true,
    });
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
      writable: true,
    });
    Object.defineProperty(document.body, 'removeChild', {
      value: mockRemoveChild,
      writable: true,
    });

    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/tracking/export?days=30'
      );
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });

  test('displays error state when fetch fails', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
      new Error('Network error')
    );

    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load tracking analytics')
      ).toBeInTheDocument();
    });
  });

  test('displays empty state when no courier data available', async () => {
    const emptyData = {
      ...mockAnalyticsData,
      stats: {
        ...mockAnalyticsData.stats,
        courierPerformance: [],
      },
    };

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => emptyData,
    } as Response);

    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No courier data available')).toBeInTheDocument();
    });
  });

  test('calculates percentages correctly', async () => {
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tracking Analytics')).toBeInTheDocument();
    });

    // Check delivery rate calculation (120/150 * 100 = 80.0%)
    expect(screen.getByText('80.0% delivery rate')).toBeInTheDocument();

    // Check in-transit percentage (25/150 * 100 = 16.7%)
    expect(screen.getByText('16.7% of total')).toBeInTheDocument();

    // Check exception rate (5/150 * 100 = 3.3%)
    expect(screen.getByText('3.3% exception rate')).toBeInTheDocument();
  });

  test('handles refresh button disabled state', async () => {
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Refresh All')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh All');
    fireEvent.click(refreshButton);

    // Button should be disabled while refreshing
    expect(refreshButton).toBeDisabled();
  });

  test('applies custom className prop', () => {
    const { container } = render(
      <TrackingAnalyticsDashboard className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('displays performance metrics with correct formatting', async () => {
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Delivery Performance')).toBeInTheDocument();
    });

    expect(screen.getByText('3.2 days')).toBeInTheDocument(); // Average delivery time
    expect(screen.getByText('92.5%')).toBeInTheDocument(); // On-time delivery rate
  });
});

describe('TrackingAnalyticsDashboard Performance', () => {
  test('handles large datasets efficiently', async () => {
    const largeDataset = {
      ...mockAnalyticsData,
      stats: {
        ...mockAnalyticsData.stats,
        totalShipments: 10000,
        courierPerformance: Array.from({ length: 50 }, (_, i) => ({
          courierName: `Courier ${i + 1}`,
          shipmentCount: Math.floor(Math.random() * 1000),
          deliveryRate: Math.random() * 100,
          averageTime: Math.random() * 10,
        })),
      },
    };

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => largeDataset,
    } as Response);

    const startTime = performance.now();
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tracking Analytics')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Rendering should complete within reasonable time
    expect(renderTime).toBeLessThan(1000); // 1 second
  });

  test('debounces multiple rapid date range changes', async () => {
    render(<TrackingAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');

    // Rapid changes
    fireEvent.change(select, { target: { value: '7' } });
    fireEvent.change(select, { target: { value: '30' } });
    fireEvent.change(select, { target: { value: '90' } });

    await waitFor(() => {
      // Should only make the final API call
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/tracking/analytics?days=90'
      );
    });
  });
});
