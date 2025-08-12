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

interface ReceiptViewerProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  canDownload?: boolean;
  variant?: 'button' | 'card' | 'inline';
  className?: string;
}

export default function ReceiptViewer({
  orderId,
  orderNumber,
  paymentStatus,
  total,
  canDownload = true,
  variant = 'button',
  className = '',
}: ReceiptViewerProps) {
  const [loading, setLoading] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Check if receipt can be generated (order must be paid)
  const canGenerateReceipt = paymentStatus === 'PAID';

  const fetchReceiptHTML = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/orders/${orderId}/invoice?format=html`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate receipt');
      }

      const htmlContent = await response.text();
      setReceiptHtml(htmlContent);
      return htmlContent;
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Failed to generate receipt');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!canGenerateReceipt) {
      toast.error('Receipt can only be generated for paid orders');
      return;
    }

    try {
      await fetchReceiptHTML();
      setIsPreviewOpen(true);
    } catch {
      // Error already handled in fetchReceiptHTML
    }
  };

  const handleDownload = async () => {
    if (!canGenerateReceipt) {
      toast.error('Receipt can only be generated for paid orders');
      return;
    }

    try {
      const htmlContent = receiptHtml || (await fetchReceiptHTML());

      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_${orderNumber}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully');
    } catch {
      // Error already handled in fetchReceiptHTML
    }
  };

  const handlePrint = async () => {
    if (!canGenerateReceipt) {
      toast.error('Receipt can only be generated for paid orders');
      return;
    }

    try {
      const htmlContent = receiptHtml || (await fetchReceiptHTML());

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch {
      // Error already handled in fetchReceiptHTML
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
            Receipt
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

          {canGenerateReceipt ? (
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
              Receipt will be available once payment is completed
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {canGenerateReceipt ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={loading}
            >
              <FileText className="h-4 w-4 mr-1" />
              Receipt
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
            Receipt Pending
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
        disabled={loading || !canGenerateReceipt}
        className={className}
      >
        <FileText className="h-4 w-4 mr-2" />
        {loading ? 'Generating...' : 'View Receipt'}
      </Button>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Receipt Preview - {orderNumber}</span>
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
            {receiptHtml && (
              <iframe
                srcDoc={receiptHtml}
                className="w-full h-[70vh] border-0"
                title="Receipt Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
