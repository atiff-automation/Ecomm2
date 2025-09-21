/**
 * Export Utilities
 * Centralized data export functionality following DRY principles
 * @CLAUDE.md - Systematic approach with consistent export formats
 */

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  filename?: string;
  title?: string;
  subtitle?: string;
  includeMetadata?: boolean;
  compress?: boolean;
  chunkSize?: number;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  downloadUrl?: string;
  error?: string;
}

export interface CSVColumn {
  key: string;
  header: string;
  format?: (value: any) => string;
  width?: number;
}

/**
 * Centralized export utility class
 * Following TimeUtils pattern for consistency
 */
export class ExportUtils {
  /**
   * Export configuration - centralized settings
   * @CLAUDE.md - No hardcoded values, configurable exports
   */
  static readonly EXPORT_CONFIG = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    DEFAULT_CHUNK_SIZE: 1000,
    MIME_TYPES: {
      json: 'application/json',
      csv: 'text/csv',
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    FILE_EXTENSIONS: {
      json: '.json',
      csv: '.csv', 
      pdf: '.pdf',
      xlsx: '.xlsx',
    },
  };

  /**
   * Generate safe filename for export
   * Sanitize and ensure unique filenames
   */
  static generateFilename(
    baseName: string,
    format: string,
    includeTimestamp: boolean = true
  ): string {
    // Sanitize base name
    const sanitized = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Add timestamp if requested
    const timestamp = includeTimestamp 
      ? `-${new Date().toISOString().split('T')[0]}-${Date.now().toString(36)}`
      : '';

    const extension = this.EXPORT_CONFIG.FILE_EXTENSIONS[format as keyof typeof this.EXPORT_CONFIG.FILE_EXTENSIONS] || '';

    return `${sanitized}${timestamp}${extension}`;
  }

  /**
   * Export data to JSON format
   * Structured JSON export with metadata
   */
  static exportToJSON(
    data: any,
    options: Partial<ExportOptions> = {}
  ): { content: string; size: number } {
    const {
      title = 'Data Export',
      includeMetadata = true,
      compress = false,
    } = options;

    const exportData = {
      ...(includeMetadata && {
        metadata: {
          title,
          exportedAt: new Date().toISOString(),
          format: 'json',
          version: '1.0',
          totalRecords: Array.isArray(data) ? data.length : 1,
        },
      }),
      data,
    };

    const content = JSON.stringify(exportData, null, compress ? 0 : 2);
    const size = Buffer.byteLength(content, 'utf8');

    return { content, size };
  }

  /**
   * Export data to CSV format
   * Tabular CSV export with proper escaping
   */
  static exportToCSV(
    data: any[],
    columns: CSVColumn[],
    options: Partial<ExportOptions> = {}
  ): { content: string; size: number } {
    const {
      title = 'Data Export',
      includeMetadata = true,
    } = options;

    const csvRows: string[] = [];

    // Add metadata header if requested
    if (includeMetadata) {
      csvRows.push(`# ${title}`);
      csvRows.push(`# Exported: ${new Date().toISOString()}`);
      csvRows.push(`# Records: ${data.length}`);
      csvRows.push('');
    }

    // Add column headers
    const headers = columns.map(col => this.escapeCsvValue(col.header));
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = columns.map(col => {
        const value = this.getNestedValue(row, col.key);
        const formatted = col.format ? col.format(value) : value;
        return this.escapeCsvValue(formatted);
      });
      csvRows.push(values.join(','));
    }

    const content = csvRows.join('\n');
    const size = Buffer.byteLength(content, 'utf8');

    return { content, size };
  }

  /**
   * Escape CSV values properly
   * Handle quotes, commas, and newlines in CSV data
   */
  private static escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * Get nested object value by dot notation
   * Helper for accessing nested properties in data
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Export large datasets in chunks
   * Handle large exports without memory issues
   */
  static async exportLargeDataset<T>(
    dataSource: () => Promise<T[]> | T[],
    processChunk: (chunk: T[], chunkIndex: number) => string,
    options: Partial<ExportOptions> = {}
  ): Promise<{ content: string; totalChunks: number; totalRecords: number }> {
    const { chunkSize = this.EXPORT_CONFIG.DEFAULT_CHUNK_SIZE } = options;
    
    const data = await dataSource();
    const chunks: string[] = [];
    let totalRecords = 0;

    // Process data in chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkContent = processChunk(chunk, Math.floor(i / chunkSize));
      chunks.push(chunkContent);
      totalRecords += chunk.length;
    }

    return {
      content: chunks.join('\n'),
      totalChunks: chunks.length,
      totalRecords,
    };
  }

  /**
   * Create browser download
   * Trigger file download in browser
   */
  static downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Validate export data
   * Pre-export validation to prevent errors
   */
  static validateExportData(
    data: any,
    format: string,
    options: Partial<ExportOptions> = {}
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if data exists
    if (!data) {
      errors.push('No data provided for export');
      return { valid: false, errors, warnings };
    }

    // Check format support
    if (!Object.keys(this.EXPORT_CONFIG.MIME_TYPES).includes(format)) {
      errors.push(`Unsupported export format: ${format}`);
    }

    // Format-specific validation
    switch (format) {
      case 'csv':
        if (!Array.isArray(data)) {
          errors.push('CSV export requires array data');
        } else if (data.length === 0) {
          warnings.push('CSV export has no data rows');
        }
        break;

      case 'json':
        try {
          JSON.stringify(data);
        } catch (error) {
          errors.push('Data is not JSON serializable');
        }
        break;
    }

    // Size validation
    if (format === 'json') {
      const testContent = JSON.stringify(data);
      const size = Buffer.byteLength(testContent, 'utf8');
      
      if (size > this.EXPORT_CONFIG.MAX_FILE_SIZE) {
        errors.push(`Export size (${this.formatBytes(size)}) exceeds maximum (${this.formatBytes(this.EXPORT_CONFIG.MAX_FILE_SIZE)})`);
      } else if (size > this.EXPORT_CONFIG.MAX_FILE_SIZE * 0.8) {
        warnings.push(`Export size (${this.formatBytes(size)}) is approaching maximum limit`);
      }
    }

    // Array size validation
    if (Array.isArray(data) && data.length > 100000) {
      warnings.push(`Large dataset (${data.length.toLocaleString()} records) may take time to process`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format bytes to human-readable size
   * Helper for size display
   */
  private static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Create export preview
   * Generate preview of export content for user confirmation
   */
  static createExportPreview(
    data: any,
    format: string,
    maxRows: number = 5
  ): { preview: string; totalRows: number; truncated: boolean } {
    let preview = '';
    let totalRows = 0;
    let truncated = false;

    switch (format) {
      case 'json':
        const jsonData = Array.isArray(data) ? data.slice(0, maxRows) : data;
        preview = JSON.stringify(jsonData, null, 2);
        totalRows = Array.isArray(data) ? data.length : 1;
        truncated = Array.isArray(data) && data.length > maxRows;
        break;

      case 'csv':
        if (Array.isArray(data) && data.length > 0) {
          // Generate CSV preview with first few rows
          const headers = Object.keys(data[0]);
          const previewData = data.slice(0, maxRows);
          
          preview = [
            headers.join(','),
            ...previewData.map(row => 
              headers.map(header => this.escapeCsvValue(row[header])).join(',')
            )
          ].join('\n');
          
          totalRows = data.length;
          truncated = data.length > maxRows;
        }
        break;
    }

    if (truncated) {
      preview += `\n... and ${totalRows - maxRows} more rows`;
    }

    return { preview, totalRows, truncated };
  }

  /**
   * Calculate estimated export time
   * Provide time estimates for large exports
   */
  static estimateExportTime(
    recordCount: number,
    format: string,
    avgRecordSize: number = 1024
  ): { estimatedSeconds: number; size: string } {
    // Base processing rates (records per second)
    const processingRates = {
      json: 5000,
      csv: 3000,
      pdf: 100,
      xlsx: 1000,
    };

    const rate = processingRates[format as keyof typeof processingRates] || 1000;
    const estimatedSeconds = Math.ceil(recordCount / rate);
    const estimatedSize = recordCount * avgRecordSize;

    return {
      estimatedSeconds: Math.max(1, estimatedSeconds),
      size: this.formatBytes(estimatedSize),
    };
  }

  /**
   * Get export progress callback
   * Progress tracking for long-running exports
   */
  static createProgressTracker(
    total: number,
    onProgress?: (progress: number, processed: number, total: number) => void
  ) {
    let processed = 0;

    return {
      update: (increment: number = 1) => {
        processed += increment;
        const progress = Math.min(100, (processed / total) * 100);
        
        if (onProgress) {
          onProgress(progress, processed, total);
        }
        
        return { progress, processed, total };
      },
      complete: () => {
        processed = total;
        if (onProgress) {
          onProgress(100, total, total);
        }
      },
    };
  }

  /**
   * Compress export content
   * Optional compression for large exports
   */
  static async compressContent(content: string): Promise<{ compressed: Uint8Array; ratio: number }> {
    // Note: In a full implementation, you would use a compression library like pako
    // For now, return a placeholder implementation
    
    const originalSize = Buffer.byteLength(content, 'utf8');
    const compressed = new TextEncoder().encode(content); // Placeholder - not actually compressed
    const compressedSize = compressed.length;
    const ratio = originalSize > 0 ? compressedSize / originalSize : 1;

    return {
      compressed,
      ratio,
    };
  }

  /**
   * Create export manifest
   * Metadata file for complex exports
   */
  static createExportManifest(exports: Array<{
    filename: string;
    format: string;
    recordCount: number;
    size: number;
    checksum?: string;
  }>): string {
    const manifest = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      totalFiles: exports.length,
      totalRecords: exports.reduce((sum, exp) => sum + exp.recordCount, 0),
      totalSize: exports.reduce((sum, exp) => sum + exp.size, 0),
      files: exports.map(exp => ({
        ...exp,
        sizeFormatted: this.formatBytes(exp.size),
      })),
    };

    return JSON.stringify(manifest, null, 2);
  }
}