import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderFilters } from '../OrderFilters';
import type { OrderFilterValues } from '../types';

describe('OrderFilters', () => {
  const mockOnFilterChange = jest.fn();
  const mockOnExport = jest.fn();
  const defaultFilters: OrderFilterValues = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search input', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );
      const searchInput = screen.getByPlaceholderText(
        /Search by order #, customer name, or email.../i
      );
      expect(searchInput).toBeInTheDocument();
    });

    it('renders date range selector', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );
      expect(screen.getByText('Date range')).toBeInTheDocument();
    });

    it('renders export button when onExport is provided', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onExport={mockOnExport}
        />
      );
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('does not render export button when onExport is not provided', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );
      expect(screen.queryByText('Export')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('updates search input on user typing', async () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );
      const searchInput = screen.getByPlaceholderText(
        /Search by order #, customer name, or email.../i
      );

      await userEvent.type(searchInput, 'ORD-2025-001');
      expect(searchInput).toHaveValue('ORD-2025-001');
    });

    it('debounces search filter change', async () => {
      jest.useFakeTimers();
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );
      const searchInput = screen.getByPlaceholderText(
        /Search by order #, customer name, or email.../i
      );

      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should not call immediately
      expect(mockOnFilterChange).not.toHaveBeenCalled();

      // Fast-forward time by 500ms (debounce delay)
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          search: 'test',
        });
      });

      jest.useRealTimers();
    });

    it('displays current search value from filters', () => {
      render(
        <OrderFilters
          currentFilters={{ search: 'ORD-123' }}
          onFilterChange={mockOnFilterChange}
        />
      );
      const searchInput = screen.getByPlaceholderText(
        /Search by order #, customer name, or email.../i
      );
      expect(searchInput).toHaveValue('ORD-123');
    });
  });

  describe('Date Filter', () => {
    it('opens date picker popover', async () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );
      const dateButton = screen.getByText('Pick a date range');
      await userEvent.click(dateButton);

      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
    });

    it('displays selected date range', () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-01-31');

      render(
        <OrderFilters
          currentFilters={{ dateFrom, dateTo }}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/Jan 01 - Jan 31/)).toBeInTheDocument();
    });

    it('clears date filter', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-01-31');

      render(
        <OrderFilters
          currentFilters={{ dateFrom, dateTo }}
          onFilterChange={mockOnFilterChange}
        />
      );

      const dateButton = screen.getByText(/Jan 01 - Jan 31/);
      await userEvent.click(dateButton);

      const clearButton = screen.getByText('Clear dates');
      await userEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        dateFrom: undefined,
        dateTo: undefined,
      });
    });
  });

  describe('Active Filters Indicator', () => {
    it('shows active filters when search is set', () => {
      render(
        <OrderFilters
          currentFilters={{ search: 'ORD-123' }}
          onFilterChange={mockOnFilterChange}
          orderCount={5}
        />
      );
      expect(screen.getByText('5 orders')).toBeInTheDocument();
      expect(screen.getByText(/matching "ORD-123"/)).toBeInTheDocument();
    });

    it('shows active filters when status is set', () => {
      render(
        <OrderFilters
          currentFilters={{ status: 'PROCESSING' }}
          onFilterChange={mockOnFilterChange}
          orderCount={10}
        />
      );
      expect(screen.getByText('10 orders')).toBeInTheDocument();
    });

    it('shows active filters when date range is set', () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-01-31');

      render(
        <OrderFilters
          currentFilters={{ dateFrom, dateTo }}
          onFilterChange={mockOnFilterChange}
          orderCount={15}
        />
      );
      expect(screen.getByText('15 orders')).toBeInTheDocument();
    });

    it('does not show indicator when no filters are active', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          orderCount={20}
        />
      );
      expect(screen.queryByText('20 orders')).not.toBeInTheDocument();
    });

    it('clears all filters when clicking Clear all', async () => {
      render(
        <OrderFilters
          currentFilters={{ search: 'test', status: 'PENDING' }}
          onFilterChange={mockOnFilterChange}
          orderCount={5}
        />
      );

      const clearButton = screen.getByText('Clear all');
      await userEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    });
  });

  describe('Export Functionality', () => {
    it('calls onExport when export button is clicked', async () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onExport={mockOnExport}
          orderCount={10}
        />
      );

      const exportButton = screen.getByText('Export');
      await userEvent.click(exportButton);

      expect(mockOnExport).toHaveBeenCalled();
    });

    it('disables export button when orderCount is 0', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onExport={mockOnExport}
          orderCount={0}
        />
      );

      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeDisabled();
    });

    it('disables export button when isLoading is true', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onExport={mockOnExport}
          isLoading={true}
          orderCount={10}
        />
      );

      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('disables search input when loading', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={true}
        />
      );

      const searchInput = screen.getByPlaceholderText(
        /Search by order #, customer name, or email.../i
      );
      expect(searchInput).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has accessible search input', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(
        /Search by order #, customer name, or email.../i
      );
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName).toBe('INPUT');
    });

    it('has accessible buttons', () => {
      render(
        <OrderFilters
          currentFilters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton.closest('button')).toBeInTheDocument();
    });
  });
});
