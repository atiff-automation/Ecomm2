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
import Papa from 'papaparse';

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
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  lowStockAlert: z
    .number()
    .int()
    .min(0, 'Low stock alert cannot be negative')
    .default(10),
  weight: z.number().positive('Weight must be a positive number for shipping calculations'),
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

// Helper function to create user-friendly error messages
function getUserFriendlyErrorMessage(field: string, issue: string, value?: string): string {
  const fieldNames: Record<string, string> = {
    sku: 'Product SKU',
    name: 'Product Name',
    categoryName: 'Category Name',
    regularPrice: 'Regular Price',
    memberPrice: 'Member Price',
    stockQuantity: 'Stock Quantity',
    description: 'Description',
    shortDescription: 'Short Description',
    weight: 'Product Weight',
    dimensions: 'Product Dimensions',
    featured: 'Featured Status',
    isPromotional: 'Promotional Status',
    isQualifyingForMembership: 'Membership Qualification',
    promotionalPrice: 'Promotional Price',
    lowStockAlert: 'Low Stock Alert Level',
  };

  const friendlyFieldName = fieldNames[field] || field;

  if (issue.includes('required') || issue.includes('cannot be empty')) {
    return `${friendlyFieldName} is required. Please provide a value in this column.`;
  }

  if (issue.includes('positive')) {
    return `${friendlyFieldName} must be a positive number greater than 0. Current value: "${value || 'empty'}"`;
  }

  if (issue.includes('number')) {
    return `${friendlyFieldName} must be a valid number. Current value: "${value || 'empty'}" is not a valid number.`;
  }

  if (issue.includes('boolean')) {
    return `${friendlyFieldName} must be TRUE or FALSE. Current value: "${value || 'empty'}" is not valid. Use "TRUE" or "FALSE".`;
  }

  if (field === 'categoryName') {
    return `Category "${value || 'empty'}" does not exist. Please check the category list or use an exact category name.`;
  }

  if (field === 'sku') {
    return `Product SKU "${value || 'empty'}" is not valid. SKU must be unique and contain only letters, numbers, and dashes.`;
  }

  if (issue.includes('min')) {
    return `${friendlyFieldName} is too short. Please provide more information.`;
  }

  return `${friendlyFieldName}: ${issue}. Current value: "${value || 'empty'}"`;
}

function convertToProduct(
  row: any,
  rowIndex: number
): { data?: any; errors: ImportError[] } {
  const errors: ImportError[] = [];

  try {
    console.log(`[Row ${rowIndex}] Processing row:`, JSON.stringify(row, null, 2));

    // Ensure row object exists and has basic structure
    if (!row || typeof row !== 'object') {
      console.log(`[Row ${rowIndex}] Row is not an object:`, typeof row, row);
      errors.push({
        row: rowIndex,
        field: 'general',
        message: 'This row appears to be empty or corrupted. Please check that all required columns have values.',
      });
      return { errors };
    }

    // Safely check Object.values to avoid undefined error
    let rowValues;
    try {
      rowValues = Object.values(row);
    } catch (e) {
      console.log(`[Row ${rowIndex}] Error getting Object.values:`, e);
      errors.push({
        row: rowIndex,
        field: 'general',
        message: 'Error processing row structure. Please check the CSV format.',
      });
      return { errors };
    }

    // Check if row is completely empty using the safely obtained rowValues
    const hasAnyData = rowValues.some(value =>
      value !== null && value !== undefined && value !== ''
    );

    if (!hasAnyData) {
      console.log(`[Row ${rowIndex}] Row is completely empty`);
      errors.push({
        row: rowIndex,
        field: 'general',
        message: 'This row is empty. Please provide product information or remove this row.',
      });
      return { errors };
    }

    // Create a safe copy and normalize all string fields
    const safeRow: any = {};
    let rowKeys;
    try {
      rowKeys = Object.keys(row);
    } catch (e) {
      console.log(`[Row ${rowIndex}] Error getting Object.keys:`, e);
      errors.push({
        row: rowIndex,
        field: 'general',
        message: 'Error processing row keys. Please check the CSV format.',
      });
      return { errors };
    }

    rowKeys.forEach(key => {
      const value = row[key];

      // Safely handle all field values
      if (value === null || value === undefined) {
        safeRow[key] = '';
      } else if (typeof value === 'string') {
        safeRow[key] = value.trim();
      } else {
        safeRow[key] = String(value).trim();
      }
    });

    // Pre-validate critical fields before processing
    const requiredFields = {
      sku: 'Product SKU',
      name: 'Product Name',
      categoryName: 'Category Name',
      regularPrice: 'Regular Price',
      stockQuantity: 'Stock Quantity',
      weight: 'Product Weight'
    };

    for (const [field, friendlyName] of Object.entries(requiredFields)) {
      const value = safeRow[field];
      if (!value || value === '') {
        errors.push({
          row: rowIndex,
          field: field,
          message: `${friendlyName} is required but is missing or empty. Please provide a value for this field.`,
          value: value || 'empty',
        });
      }
    }

    // If we have critical field errors, return early
    if (errors.length > 0) {
      return { errors };
    }

    // Convert boolean fields with user-friendly error handling
    const booleanFields = ['featured', 'isPromotional', 'isQualifyingForMembership'];
    booleanFields.forEach(field => {
      try {
        const value = safeRow[field];

        // Check for null, undefined, or empty values first
        if (value === null || value === undefined || value === '') {
          safeRow[field] = false; // Default for empty boolean fields
          return;
        }

        // Convert to string and check if it's a valid string
        const stringValue = String(value);
        if (stringValue && stringValue.length > 0) {
          const lowerValue = stringValue.toLowerCase().trim();
          if (['true', '1', 'yes', 'y'].includes(lowerValue)) {
            safeRow[field] = true;
          } else if (['false', '0', 'no', 'n'].includes(lowerValue)) {
            safeRow[field] = false;
          } else {
            errors.push({
              row: rowIndex,
              field: field,
              message: getUserFriendlyErrorMessage(field, 'boolean', value),
              value: value,
            });
          }
        } else {
          safeRow[field] = false; // Default for empty boolean fields
        }
      } catch (e) {
        console.log(`[Row ${rowIndex}] Error processing boolean field ${field}:`, e);
        safeRow[field] = false;
      }
    });

    // Convert numeric fields with better error messages
    const numericFields = ['regularPrice', 'memberPrice', 'stockQuantity', 'lowStockAlert', 'weight', 'promotionalPrice'];
    const requiredNumericFields = ['regularPrice', 'stockQuantity', 'weight'];

    numericFields.forEach(field => {
      const value = safeRow[field];
      const isRequired = requiredNumericFields.includes(field);

      if (value && value !== '') {
        // Remove currency symbols and spaces
        const cleanValue = String(value).replace(/[RM$\s,]/g, '').replace(/[^\d.-]/g, '');
        const numValue = parseFloat(cleanValue);

        if (isNaN(numValue)) {
          errors.push({
            row: rowIndex,
            field: field,
            message: getUserFriendlyErrorMessage(field, 'number', value),
            value: value,
          });
        } else if (numValue <= 0 && ['regularPrice', 'memberPrice', 'stockQuantity', 'weight'].includes(field)) {
          errors.push({
            row: rowIndex,
            field: field,
            message: getUserFriendlyErrorMessage(field, 'positive', value),
            value: value,
          });
        } else {
          safeRow[field] = numValue;
        }
      } else if (isRequired) {
        errors.push({
          row: rowIndex,
          field: field,
          message: getUserFriendlyErrorMessage(field, 'required'),
          value: value || 'empty',
        });
      }
    });

    // Convert date fields (optional)
    const dateFields = ['promotionStartDate', 'promotionEndDate', 'memberOnlyUntil', 'earlyAccessStart'];
    dateFields.forEach(field => {
      const value = safeRow[field];
      if (value && value !== '') {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            safeRow[field] = date.toISOString();
          } else {
            errors.push({
              row: rowIndex,
              field: field,
              message: `${field} must be a valid date format (e.g., YYYY-MM-DD or MM/DD/YYYY). Current value: "${value}"`,
              value: value,
            });
            delete safeRow[field];
          }
        } catch (e) {
          delete safeRow[field];
        }
      } else {
        delete safeRow[field];
      }
    });

    // Remove truly empty fields
    Object.keys(safeRow).forEach(key => {
      const value = safeRow[key];
      if (value === '' || value === null || value === undefined) {
        delete safeRow[key];
      }
    });

    // If we have validation errors, return them before schema validation
    if (errors.length > 0) {
      return { data: undefined, errors };
    }

    const validatedData = productSchema.parse(safeRow);
    return { data: validatedData, errors: [] };
  } catch (error) {
    console.error(`[Row ${rowIndex}] Validation error:`, error);

    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        const field = err.path.join('.');
        const value = row[err.path[0]]?.toString();

        errors.push({
          row: rowIndex,
          field: field,
          message: getUserFriendlyErrorMessage(field, err.message, value),
          value: value || '',
        });
      });
    } else {
      errors.push({
        row: rowIndex,
        field: 'general',
        message: 'There was an unexpected error processing this row. Please check that all fields contain valid data and try again.',
      });
    }
    return { data: undefined, errors };
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
        // Use PapaParse for robust CSV parsing
        const text = new TextDecoder().decode(buffer);
        console.log('CSV file size:', text.length, 'characters');

        const parseResult = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (name) => name.trim(),
          transform: (value) => {
            // Handle empty values consistently
            if (value === null || value === undefined || value === '') {
              return '';
            }
            return String(value).trim();
          },
        });

        if (parseResult.errors.length > 0) {
          console.error('CSV parsing errors:', parseResult.errors);
          return NextResponse.json(
            { message: 'CSV file has parsing errors. Please check the file format.' },
            { status: 400 }
          );
        }

        dataRows = parseResult.data.filter((row: any) => {
          // Filter out completely empty rows
          return Object.values(row).some(value => value !== '');
        });

        console.log('PapaParse results:', dataRows.length, 'rows');
        if (dataRows.length > 0) {
          console.log('First row keys:', Object.keys(dataRows[0]));
          console.log('First row sample:', JSON.stringify(dataRows[0], null, 2));
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
        if (!row.categoryName || typeof row.categoryName !== 'string') {
          // Safety check for result.errorDetails
          if (!result || !result.errorDetails) {
            console.error(`Row ${rowIndex}: result or result.errorDetails is undefined`, { result });
            return NextResponse.json(
              { message: `Internal error at row ${rowIndex}: result structure is invalid` },
              { status: 500 }
            );
          }

          result.errorDetails.push({
            row: rowIndex,
            field: 'categoryName',
            message: `Category name is required but is missing or empty. Please provide a valid category name.`,
            value: row.categoryName || 'empty',
          });
          result.errors++;
          continue;
        }

        const categoryId = categoryLookup.get(row.categoryName);
        if (!categoryId) {
          const availableCategories = Array.from(categoryLookup.keys()).slice(0, 5).join(', ');
          result.errorDetails.push({
            row: rowIndex,
            field: 'categoryName',
            message: `Category "${row.categoryName}" does not exist. Please use an exact category name from your store. Available categories include: ${availableCategories}${categoryLookup.size > 5 ? '...' : ''}. Download the category list for all available categories.`,
            value: row.categoryName,
          });
          result.errors++;
          continue;
        }

        console.log(`Row ${rowIndex} about to convert to product, row data:`, JSON.stringify(row, null, 2));
        const { data: productData, errors } = convertToProduct(row, rowIndex);
        console.log(`Row ${rowIndex} conversion result - errors:`, errors, 'data:', productData ? 'exists' : 'null');

        // Safety check for errors array
        if (!Array.isArray(errors)) {
          console.error(`Row ${rowIndex}: convertToProduct returned invalid errors:`, errors);
          result.errorDetails.push({
            row: rowIndex,
            field: 'general',
            message: 'Failed to process row due to internal error',
          });
          result.errors++;
          continue;
        }

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
