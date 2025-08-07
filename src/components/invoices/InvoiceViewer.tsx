'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceViewerProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  canDownload?: boolean;
  variant?: 'button' | 'card' | 'inline';
  className?: string;
}

export default function InvoiceViewer({
  orderId,
  orderNumber,
  paymentStatus,
  total,
  canDownload = true,
  variant = 'button',
  className = '',
}: InvoiceViewerProps) {
  const [loading, setLoading] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Check if invoice can be generated (order must be paid)
  const canGenerateInvoice = paymentStatus === 'PAID';

  const fetchInvoiceHTML = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/orders/${orderId}/invoice?format=html`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate invoice');
      }

      const htmlContent = await response.text();
      setInvoiceHtml(htmlContent);
      return htmlContent;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to generate invoice');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!canGenerateInvoice) {
      toast.error('Invoice can only be generated for paid orders');
      return;
    }

    try {
      await fetchInvoiceHTML();
      setIsPreviewOpen(true);
    } catch {
      // Error already handled in fetchInvoiceHTML
    }
  };

  const handleDownload = async () => {
    if (!canGenerateInvoice) {
      toast.error('Invoice can only be generated for paid orders');
      return;
    }

    try {
      const htmlContent = invoiceHtml || (await fetchInvoiceHTML());

      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${orderNumber}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch {
      // Error already handled in fetchInvoiceHTML
    }
  };

  const handlePrint = async () => {
    if (!canGenerateInvoice) {
      toast.error('Invoice can only be generated for paid orders');
      return;
    }

    try {
      const htmlContent = invoiceHtml || (await fetchInvoiceHTML());

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch {
      // Error already handled in fetchInvoiceHTML
    }
  };

  const getStatusBadgeVariant = () => {
    switch (paymentStatus) {
      case 'PAID':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Order: {orderNumber}</p>
              <p className="text-lg font-semibold">RM {total.toFixed(2)}</p>
            </div>
            <Badge variant={getStatusBadgeVariant()}>{paymentStatus}</Badge>
          </div>

          {canGenerateInvoice ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              {canDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={loading}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Invoice will be available once payment is completed
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {canGenerateInvoice ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={loading}
            >
              <FileText className="h-4 w-4 mr-1" />
              Invoice
            </Button>
            {canDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-gray-400"
          >
            <FileText className="h-4 w-4 mr-1" />
            Invoice Pending
          </Button>
        )}
      </div>
    );
  }

  // Default button variant
  return (
    <>
      <Button
        variant="outline"
        onClick={handlePreview}
        disabled={loading || !canGenerateInvoice}
        className={className}
      >
        <FileText className="h-4 w-4 mr-2" />
        {loading ? 'Generating...' : 'View Invoice'}
      </Button>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice Preview - {orderNumber}</span>
              <div className="flex gap-2">
                {canDownload && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={loading}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] border rounded-lg">
            {invoiceHtml && (
              <iframe
                srcDoc={invoiceHtml}
                className="w-full h-[70vh] border-0"
                title="Invoice Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
