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
      'Sample product for import',
      'category-id-here',
      '99.90',
      '89.90',
      '50.00',
      '100',
      '10',
      '0.5',
      '10x10x5',
      'false',
      'false',
      'true',
      '',
      '',
      '',
      '',
      '',
      'Sample Product - Best Quality',
      'High quality sample product for your needs',
    ];

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Uploading file...',
      });

      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      });

      setProgress({
        stage: 'validating',
        progress: 30,
        message: 'Validating data...',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      setProgress({
        stage: 'importing',
        progress: 60,
        message: 'Importing products...',
      });

      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 5, 90),
        }));
      }, 500);

      const importResult = await response.json();

      clearInterval(progressInterval);

      setProgress({
        stage: 'completed',
        progress: 100,
        message: 'Import completed successfully!',
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Product Import</h1>
            <p className="text-muted-foreground">
              Bulk import products using CSV or Excel files
            </p>
          </div>
        </div>
      </div>

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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Follow these steps to import your products:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Download the template file to see the required format</li>
                  <li>
                    Fill in your product data following the template structure
                  </li>
                  <li>Save your file as CSV or Excel format</li>
                  <li>Upload your filled and import your file</li>
                </ol>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Make sure all required fields are
                  filled and category IDs exist in your system before importing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Products File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="fileInput"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    {file ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          CSV or Excel files only
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                </label>
              </div>

              {/* Import Progress */}
              {progress.stage !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {progress.stage === 'uploading' && 'Uploading...'}
                      {progress.stage === 'validating' && 'Validating...'}
                      {progress.stage === 'importing' && 'Importing...'}
                      {progress.stage === 'completed' && 'Completed'}
                      {progress.stage === 'error' && 'Error'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {progress.progress}%
                    </span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {progress.message}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="flex-1"
                >
                  {importing ? 'Importing...' : 'Import Products'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetImport}
                  disabled={importing}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Template Download
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Download the template file to ensure your data is in the correct
                format.
              </p>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
                disabled={importing}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Import Statistics */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.success}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Successful
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.errors}
                    </div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Total Processed
                    </span>
                    <Badge variant="outline">{result.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Success Rate
                    </span>
                    <Badge variant="secondary">
                      {Math.round((result.success / result.total) * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Imports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Imports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Import history and logs will be displayed here in future
                updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Results Details */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Successful Imports */}
          {result.successfulProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">
                  Successfully Imported Products ({result.success})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.successfulProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({product.sku})
                        </span>
                      </div>
                      <Badge
                        variant={
                          product.action === 'created' ? 'default' : 'secondary'
                        }
                      >
                        {product.action === 'created' ? 'Created' : 'Updated'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {result.errorDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">
                  Import Errors ({result.errors})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.errorDetails.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-red-800">
                            Row {error.row}: {error.field}
                          </span>
                          <p className="text-sm text-red-700 mt-1">
                            {error.message}
                          </p>
                          {error.value && (
                            <p className="text-xs text-red-600 mt-1">
                              Value: &quot;{error.value}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
