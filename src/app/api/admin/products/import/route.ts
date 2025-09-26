/**
 * Product Import API Route - Malaysian E-commerce Platform
 * Handles bulk product import from CSV/Excel files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import * as XLSX from 'xlsx';

// Product validation schema
const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryName: z.string().min(1, 'Category name is required'),
  regularPrice: z.number().positive('Regular price must be positive'),
  memberPrice: z
    .number()
    .positive('Member price must be positive')
    .nullable()
    .optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  lowStockAlert: z
    .number()
    .int()
    .min(0, 'Low stock alert cannot be negative')
    .default(10),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  featured: z.boolean().default(false),
  isPromotional: z.boolean().default(false),
  isQualifyingForMembership: z.boolean().default(true),
  promotionalPrice: z.number().positive().optional(),
  promotionStartDate: z.string().datetime().optional(),
  promotionEndDate: z.string().datetime().optional(),
  memberOnlyUntil: z.string().datetime().optional(),
  earlyAccessStart: z.string().datetime().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ImportResult {
  success: number;
  errors: number;
  warnings: number;
  total: number;
  errorDetails: ImportError[];
  successfulProducts: Array<{
    sku: string;
    name: string;
    action: 'created' | 'updated';
  }>;
}

function parseExcelValue(value: any): any {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  // Handle Excel date values
  if (typeof value === 'number' && value > 25000 && value < 50000) {
    // Likely an Excel date serial number
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d).toISOString();
  }

  return value;
}

function convertToProduct(
  row: any,
  rowIndex: number
): { data?: any; errors: ImportError[] } {
  const errors: ImportError[] = [];

  try {
    // Ensure row object exists and has basic structure
    if (!row || typeof row !== 'object') {
      errors.push({
        row: rowIndex,
        field: 'general',
        message: 'Invalid row data',
      });
      return { errors };
    }

    // Convert boolean fields
    const booleanFields = [
      'featured',
      'isPromotional',
      'isQualifyingForMembership',
    ];
    booleanFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        try {
          const value = String(row[field] || '').toLowerCase();
          row[field] = value === 'true' || value === '1' || value === 'yes';
        } catch (e) {
          // Default to false if conversion fails
          row[field] = false;
        }
      } else {
        // Set default value for missing boolean fields
        row[field] = false;
      }
    });

    // Convert numeric fields
    const numericFields = [
      'regularPrice',
      'memberPrice',
      'stockQuantity',
      'lowStockAlert',
      'weight',
      'promotionalPrice',
    ];
    numericFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== '') {
        try {
          const stringValue = String(row[field] || '');
          const numValue = parseFloat(stringValue.replace(/[^\d.-]/g, ''));
          if (!isNaN(numValue)) {
            row[field] = numValue;
          }
        } catch (e) {
          // Keep original value if conversion fails
        }
      }
    });

    // Convert date fields
    const dateFields = [
      'promotionStartDate',
      'promotionEndDate',
      'memberOnlyUntil',
      'earlyAccessStart',
    ];
    dateFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        try {
          const parsedValue = parseExcelValue(row[field]);
          if (parsedValue) {
            const date = new Date(parsedValue);
            if (!isNaN(date.getTime())) {
              row[field] = date.toISOString();
            } else {
              delete row[field];
            }
          } else {
            delete row[field];
          }
        } catch (e) {
          // Remove invalid date fields
          delete row[field];
        }
      } else {
        delete row[field];
      }
    });

    // Remove empty fields safely
    Object.keys(row).forEach(key => {
      const value = row[key];
      if (value === '' || value === null || value === undefined) {
        delete row[key];
      }
    });

    const validatedData = productSchema.parse(row);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push({
          row: rowIndex,
          field: err.path.join('.'),
          message: err.message,
          value: row[err.path[0]]?.toString(),
        });
      });
    } else {
      errors.push({
        row: rowIndex,
        field: 'general',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return { errors };
  }
}

async function generateUniqueSlug(
  name: string,
  existingSlugs: Set<string>
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (
      !fileName.endsWith('.csv') &&
      !fileName.endsWith('.xlsx') &&
      !fileName.endsWith('.xls')
    ) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload CSV or Excel file.' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;

    let dataRows: any[] = [];

    try {
      if (fileName.endsWith('.csv')) {
        // Use simple CSV parsing for better handling of complex content
        const text = new TextDecoder().decode(buffer);
        console.log('CSV file size:', text.length, 'characters');

        // Simple CSV parsing that handles quoted fields with newlines
        const lines = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === '\n' && !inQuotes) {
            if (current.trim()) {
              lines.push(current);
            }
            current = '';
          } else {
            current += char;
          }
        }

        // Add last line if exists
        if (current.trim()) {
          lines.push(current);
        }

        console.log('Parsed', lines.length, 'lines from CSV');

        if (lines.length < 2) {
          return NextResponse.json(
            { message: 'CSV must have at least headers and one data row' },
            { status: 400 }
          );
        }

        // Parse header line
        const headerLine = lines[0];
        const headers = [];
        let currentField = '';
        let inFieldQuotes = false;

        for (let i = 0; i < headerLine.length; i++) {
          const char = headerLine[i];
          const nextChar = headerLine[i + 1];

          if (char === '"') {
            if (inFieldQuotes && nextChar === '"') {
              currentField += '"';
              i++;
            } else {
              inFieldQuotes = !inFieldQuotes;
            }
          } else if (char === ',' && !inFieldQuotes) {
            headers.push(currentField.trim());
            currentField = '';
          } else {
            currentField += char;
          }
        }
        headers.push(currentField.trim());

        console.log('Headers found:', headers.length, 'columns');

        // Parse data lines
        for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          const values = [];
          let currentValue = '';
          let inValueQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
              if (inValueQuotes && nextChar === '"') {
                currentValue += '"';
                i++;
              } else {
                inValueQuotes = !inValueQuotes;
              }
            } else if (char === ',' && !inValueQuotes) {
              values.push(currentValue);
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue);

          // Create row object
          const row: any = {};
          headers.forEach((header, i) => {
            if (header) {
              row[header] = values[i] || '';
            }
          });

          if (Object.keys(row).length > 0) {
            dataRows.push(row);
          }
        }

      } else {
        // Use XLSX for Excel files
        const workbook = XLSX.read(buffer, {
          type: 'array',
          raw: false,
          cellText: false,
          cellHTML: false
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
          blankrows: false
        });

        dataRows = rawData.filter((row: any) => Object.keys(row).length > 0);
      }
    } catch (error) {
      console.error('File parsing error:', error);
      return NextResponse.json(
        { message: 'Failed to parse file. Please check file format.' },
        { status: 400 }
      );
    }

    console.log('Final parsed data rows:', dataRows.length);
    if (dataRows.length > 0) {
      console.log('First row keys:', Object.keys(dataRows[0]));
      console.log('First row sample:', JSON.stringify(dataRows[0], null, 2).substring(0, 500));
    }

    if (dataRows.length === 0) {
      return NextResponse.json(
        { message: 'File is empty or has no valid data' },
        { status: 400 }
      );
    }

    // Validate categories exist - accept both names and slugs
    const categoryNames = [
      ...new Set(dataRows.map((row: any) => row.categoryName).filter(Boolean)),
    ];
    const existingCategories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { in: categoryNames } },
          { slug: { in: categoryNames } },
        ]
      },
      select: { id: true, name: true, slug: true },
    });
    const categoryLookup = new Map();
    existingCategories.forEach(cat => {
      categoryLookup.set(cat.name, cat.id);
      categoryLookup.set(cat.slug, cat.id);
    });

    // Get existing products for duplicate checking
    const existingProducts = await prisma.product.findMany({
      select: { id: true, sku: true, slug: true },
    });
    const existingSkus = new Set(existingProducts.map(p => p.sku));
    const existingSlugs = new Set(existingProducts.map(p => p.slug));

    const result: ImportResult = {
      success: 0,
      errors: 0,
      warnings: 0,
      total: dataRows.length,
      errorDetails: [],
      successfulProducts: [],
    };

    console.log(`Processing ${dataRows.length} data rows`);

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any;
      const rowIndex = i + 2; // +2 because Excel starts at 1 and we have headers

      try {
        console.log(`Processing row ${rowIndex}, raw row keys:`, row ? Object.keys(row) : 'row is null/undefined');

        // Skip empty rows
        if (!row || Object.keys(row).length === 0) {
          console.log(`Skipping empty row ${rowIndex}`);
          continue;
        }

        // Check for required fields first
        const requiredFields = ['sku', 'name', 'categoryName', 'regularPrice', 'stockQuantity'];
        let hasRequiredFieldError = false;

        for (const field of requiredFields) {
          const fieldValue = row[field];
          console.log(`Row ${rowIndex}, field ${field}:`, fieldValue, typeof fieldValue);

          if (!fieldValue || String(fieldValue).trim() === '') {
            result.errorDetails.push({
              row: rowIndex,
              field: field,
              message: `${field} is required and cannot be empty`,
              value: String(fieldValue || ''),
            });
            result.errors++;
            hasRequiredFieldError = true;
          }
        }

        if (hasRequiredFieldError) {
          console.log(`Row ${rowIndex} has required field errors, skipping`);
          continue;
        }

        // Validate category exists and get ID
        const categoryId = categoryLookup.get(row.categoryName);
        if (!categoryId) {
          result.errorDetails.push({
            row: rowIndex,
            field: 'categoryName',
            message: 'Category does not exist. Use exact category name or slug.',
            value: row.categoryName,
          });
          result.errors++;
          continue;
        }

        console.log(`Row ${rowIndex} about to convert to product, row data:`, JSON.stringify(row, null, 2));
        const { data: productData, errors } = convertToProduct(row, rowIndex);
        console.log(`Row ${rowIndex} conversion result - errors:`, errors, 'data:', productData ? 'exists' : 'null');

        if (errors.length > 0) {
          result.errorDetails.push(...errors);
          result.errors++;
          continue;
        }

        // Generate unique slug
        const slug = await generateUniqueSlug(productData.name, existingSlugs);

        // Check for duplicate SKU
        const isUpdate = existingSkus.has(productData.sku);

        if (isUpdate) {
          // Update existing product
          const { categoryName, ...updateData } = productData;
          await prisma.product.update({
            where: { sku: productData.sku },
            data: {
              ...updateData,
              memberPrice: updateData.memberPrice || updateData.regularPrice,
              slug,
              promotionStartDate: productData.promotionStartDate
                ? new Date(productData.promotionStartDate)
                : null,
              promotionEndDate: productData.promotionEndDate
                ? new Date(productData.promotionEndDate)
                : null,
              memberOnlyUntil: productData.memberOnlyUntil
                ? new Date(productData.memberOnlyUntil)
                : null,
              earlyAccessStart: productData.earlyAccessStart
                ? new Date(productData.earlyAccessStart)
                : null,
              updatedAt: new Date(),
              // Update categories - replace existing with new primary category
              categories: {
                deleteMany: {}, // Remove all existing category associations
                create: {
                  categoryId: categoryId,
                },
              },
            },
          });

          result.successfulProducts.push({
            sku: productData.sku,
            name: productData.name,
            action: 'updated',
          });
        } else {
          // Create new product
          const { categoryName, ...createData } = productData;
          await prisma.product.create({
            data: {
              ...createData,
              memberPrice: createData.memberPrice || createData.regularPrice,
              slug,
              promotionStartDate: productData.promotionStartDate
                ? new Date(productData.promotionStartDate)
                : null,
              promotionEndDate: productData.promotionEndDate
                ? new Date(productData.promotionEndDate)
                : null,
              memberOnlyUntil: productData.memberOnlyUntil
                ? new Date(productData.memberOnlyUntil)
                : null,
              earlyAccessStart: productData.earlyAccessStart
                ? new Date(productData.earlyAccessStart)
                : null,
              status: 'ACTIVE',
              // Create category association using the new many-to-many structure
              categories: {
                create: {
                  categoryId: categoryId,
                },
              },
            },
          });

          result.successfulProducts.push({
            sku: productData.sku,
            name: productData.name,
            action: 'created',
          });

          existingSkus.add(productData.sku);
        }

        result.success++;
      } catch (error) {
        console.error('Error processing row', rowIndex, ':', error);
        result.errorDetails.push({
          row: rowIndex,
          field: 'general',
          message:
            error instanceof Error ? error.message : 'Failed to process row',
        });
        result.errors++;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { message: 'Import failed. Please try again.' },
      { status: 500 }
    );
  }
}
