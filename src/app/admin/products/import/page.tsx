/**
 * Product Import Page - Malaysian E-commerce Platform
 * Bulk product import functionality with CSV/Excel support
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

interface ImportResult {
  success: number;
  errors: number;
  warnings: number;
  total: number;
  errorDetails: Array<{
    row: number;
    field: string;
    message: string;
    value?: string;
  }>;
  successfulProducts: Array<{
    sku: string;
    name: string;
    action: 'created' | 'updated';
  }>;
}

interface ImportProgress {
  stage:
    | 'idle'
    | 'uploading'
    | 'validating'
    | 'importing'
    | 'completed'
    | 'error';
  progress: number;
  message: string;
}

export default function ProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
        event.target.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    // Create CSV template with sample data
    const headers = [
      'sku',
      'name',
      'description',
      'shortDescription',
      'categoryId',
      'regularPrice',
      'memberPrice',
      'stockQuantity',
      'lowStockAlert',
      'weight',
      'dimensions',
      'featured',
      'isPromotional',
      'isQualifyingForMembership',
      'promotionalPrice',
      'promotionStartDate',
      'promotionEndDate',
      'memberOnlyUntil',
      'earlyAccessStart',
      'metaTitle',
      'metaDescription',
    ];

    const sampleRow = [
      'SAMPLE-001',
      'Sample Product',
      'This is a sample product description',
      'Short description',
      'category-id-here',
      '29.99',
      '24.99',
      '100',
      '10',
      '0.5',
      '10x10x5cm',
      'false',
      'false',
      'true',
      '',
      '',
      '',
      '',
      '',
      'Sample Product | Your Store',
      'Buy Sample Product online at great prices',
    ];

    const csvContent = [headers, sampleRow]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress({
      stage: 'uploading',
      progress: 10,
      message: 'Uploading file...',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      });

      setProgress({
        stage: 'validating',
        progress: 40,
        message: 'Validating product data...',
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      setProgress({
        stage: 'importing',
        progress: 70,
        message: 'Importing products...',
      });

      const importResult: ImportResult = await response.json();

      setProgress({
        stage: 'completed',
        progress: 100,
        message: 'Import completed',
      });

      setResult(importResult);
    } catch (error) {
      console.error('Import error:', error);
      setProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setProgress({
      stage: 'idle',
      progress: 0,
      message: '',
    });
    setResult(null);
    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Define contextual tabs following ADMIN_LAYOUT_STANDARD.md for Products
  const tabs: TabConfig[] = [
    { id: 'catalog', label: 'Product Catalog', href: '/admin/products' },
    { id: 'categories', label: 'Categories', href: '/admin/categories' },
    { id: 'inventory', label: 'Inventory Management', href: '/admin/products/inventory' },
    { id: 'import-export', label: 'Import/Export', href: '/admin/products/import' },
  ];

  // Extract page actions
  const pageActions = (
    <div className="flex gap-2">
      <Button 
        onClick={downloadTemplate}
        variant="outline" 
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Template
      </Button>
      {result && (
        <Button 
          onClick={resetImport} 
          variant="outline" 
          size="sm"
        >
          Start New Import
        </Button>
      )}
    </div>
  );

  return (
    <AdminPageLayout
      title="Product Import"
      subtitle="Bulk import products using CSV or Excel files"
      actions={pageActions}
      tabs={tabs}
      showBackButton={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Import Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Import Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Supported File Formats</h4>
                  <div className="flex gap-2">
                    <Badge variant="secondary">CSV</Badge>
                    <Badge variant="secondary">Excel (.xlsx)</Badge>
                    <Badge variant="secondary">Excel (.xls)</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Before You Start</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Download the template to see required columns</li>
                    <li>• Ensure SKUs are unique for new products</li>
                    <li>• Use valid category IDs from your store</li>
                    <li>• Prices should be in decimal format (e.g., 29.99)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={importing}
                  />
                  {file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {(progress.stage !== 'idle' || importing) && (
            <Card>
              <CardHeader>
                <CardTitle>Import Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{progress.message}</span>
                      <span>{progress.progress}%</span>
                    </div>
                    <Progress value={progress.progress} />
                  </div>

                  <div className="flex items-center gap-2">
                    {progress.stage === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {progress.stage === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <Badge 
                      variant={progress.stage === 'error' ? 'destructive' : 'default'}
                    >
                      {progress.stage.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Import Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {result.success}
                      </div>
                      <div className="text-sm text-green-600">Success</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {result.errors}
                      </div>
                      <div className="text-sm text-red-600">Errors</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {result.warnings}
                      </div>
                      <div className="text-sm text-yellow-600">Warnings</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.total}
                      </div>
                      <div className="text-sm text-blue-600">Total</div>
                    </div>
                  </div>

                  {result.errorDetails.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Errors Found:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {result.errorDetails.slice(0, 10).map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Row {error.row}: {error.field} - {error.message}
                              {error.value && ` (Value: "${error.value}")`}
                            </AlertDescription>
                          </Alert>
                        ))}
                        {result.errorDetails.length > 10 && (
                          <p className="text-sm text-gray-500">
                            And {result.errorDetails.length - 10} more errors...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Template Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Required Fields</span>
                  <Badge variant="outline">5</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Optional Fields</span>
                  <Badge variant="outline">17</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Max File Size</span>
                  <Badge variant="outline">10MB</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Successful Products */}
          {result && result.successfulProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.successfulProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                      </div>
                      <Badge 
                        variant={product.action === 'created' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {product.action}
                      </Badge>
                    </div>
                  ))}
                  {result.successfulProducts.length > 5 && (
                    <p className="text-xs text-center text-gray-500">
                      +{result.successfulProducts.length - 5} more products
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}