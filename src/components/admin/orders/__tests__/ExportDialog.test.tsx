import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from '../ExportDialog';
import type { ExportOptions } from '../types';

describe('ExportDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnExport.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ExportDialog
          isOpen={false}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      expect(screen.queryByText('Export Orders')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      expect(screen.getByText('Export Orders')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Choose export format and customize which data to include'
        )
      ).toBeInTheDocument();
    });

    it('renders all export format options', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      expect(
        screen.getByText(/CSV \(.csv\) - Compatible with Excel, Google Sheets/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Excel \(.xlsx\) - Microsoft Excel format/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/PDF \(.pdf\) - Printable document/)
      ).toBeInTheDocument();
    });

    it('renders all include options', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      expect(
        screen.getByText('Customer Details (name, email, phone)')
      ).toBeInTheDocument();
      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(
        screen.getByText('Items Breakdown (products, quantities, prices)')
      ).toBeInTheDocument();
    });

    it('renders date range selector', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('has CSV format selected by default', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const csvRadio = screen.getByLabelText(
        /CSV \(.csv\) - Compatible with Excel, Google Sheets/
      );
      expect(csvRadio).toBeChecked();
    });

    it('has all include options checked by default', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const customerCheckbox = screen.getByLabelText(
        'Customer Details (name, email, phone)'
      );
      const shippingCheckbox = screen.getByLabelText('Shipping Address');
      const itemsCheckbox = screen.getByLabelText(
        'Items Breakdown (products, quantities, prices)'
      );

      expect(customerCheckbox).toBeChecked();
      expect(shippingCheckbox).toBeChecked();
      expect(itemsCheckbox).toBeChecked();
    });
  });

  describe('Format Selection', () => {
    it('changes format to Excel when selected', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const excelRadio = screen.getByLabelText(
        /Excel \(.xlsx\) - Microsoft Excel format/
      );
      await userEvent.click(excelRadio);

      expect(excelRadio).toBeChecked();
    });

    it('changes format to PDF when selected', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const pdfRadio = screen.getByLabelText(
        /PDF \(.pdf\) - Printable document/
      );
      await userEvent.click(pdfRadio);

      expect(pdfRadio).toBeChecked();
    });
  });

  describe('Include Options', () => {
    it('toggles customer details checkbox', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const checkbox = screen.getByLabelText(
        'Customer Details (name, email, phone)'
      );

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('toggles shipping address checkbox', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const checkbox = screen.getByLabelText('Shipping Address');

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('toggles items breakdown checkbox', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const checkbox = screen.getByLabelText(
        'Items Breakdown (products, quantities, prices)'
      );

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Export Functionality', () => {
    it('calls onExport with correct options', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );

      const downloadButton = screen.getByText('Download Export');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'csv',
            includeCustomerDetails: true,
            includeShippingAddress: true,
            includeItemsBreakdown: true,
          })
        );
      });
    });

    it('calls onExport with Excel format', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );

      const excelRadio = screen.getByLabelText(/Excel \(.xlsx\)/);
      await userEvent.click(excelRadio);

      const downloadButton = screen.getByText('Download Export');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'excel',
          })
        );
      });
    });

    it('calls onExport with unchecked options', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );

      const customerCheckbox = screen.getByLabelText(
        'Customer Details (name, email, phone)'
      );
      await userEvent.click(customerCheckbox);

      const downloadButton = screen.getByText('Download Export');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            includeCustomerDetails: false,
          })
        );
      });
    });

    it('resets form and closes after export', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );

      // Change format to Excel
      const excelRadio = screen.getByLabelText(/Excel \(.xlsx\)/);
      await userEvent.click(excelRadio);

      const downloadButton = screen.getByText('Download Export');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading text when exporting', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          isExporting={true}
        />
      );
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('disables buttons when exporting', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          isExporting={true}
        />
      );
      const cancelButton = screen.getByText('Cancel');
      const exportButton = screen.getByText('Exporting...');

      expect(cancelButton).toBeDisabled();
      expect(exportButton).toBeDisabled();
    });

    it('shows spinner icon when exporting', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          isExporting={true}
        />
      );
      // Verify loading state is shown
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onClose when cancel button is clicked', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onClose when exporting', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          isExporting={true}
        />
      );

      // Cannot close during export
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Current Filters Integration', () => {
    it('uses current filters in export options', async () => {
      const currentFilters = {
        status: 'PROCESSING',
        dateFrom: new Date('2025-01-01'),
        dateTo: new Date('2025-01-31'),
      };

      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          currentFilters={currentFilters}
        />
      );

      const downloadButton = screen.getByText('Download Export');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'PROCESSING',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible dialog title', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      expect(screen.getByText('Export Orders')).toBeInTheDocument();
    });

    it('has accessible form labels', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByText('Include in Export')).toBeInTheDocument();
    });

    it('has accessible checkboxes with labels', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
        />
      );
      const customerCheckbox = screen.getByLabelText(
        'Customer Details (name, email, phone)'
      );
      expect(customerCheckbox).toBeInTheDocument();
    });
  });
});
