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
  categoryId: z.string().min(1, 'Category ID is required'),
  regularPrice: z.number().positive('Regular price must be positive'),
  memberPrice: z.number().positive('Member price must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  lowStockAlert: z.number().int().min(0, 'Low stock alert cannot be negative').default(10),
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

function convertToProduct(row: any, rowIndex: number): { data?: any; errors: ImportError[] } {
  const errors: ImportError[] = [];
  
  try {
    // Convert boolean fields
    const booleanFields = ['featured', 'isPromotional', 'isQualifyingForMembership'];
    booleanFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== '') {
        const value = String(row[field]).toLowerCase();
        row[field] = value === 'true' || value === '1' || value === 'yes';
      }
    });
    
    // Convert numeric fields
    const numericFields = ['regularPrice', 'memberPrice', 'costPrice', 'stockQuantity', 'lowStockAlert', 'weight', 'promotionalPrice'];
    numericFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== '') {
        const numValue = parseFloat(String(row[field]).replace(/[^\d.-]/g, ''));
        if (!isNaN(numValue)) {
          row[field] = numValue;
        }
      }
    });
    
    // Convert date fields
    const dateFields = ['promotionStartDate', 'promotionEndDate', 'memberOnlyUntil', 'earlyAccessStart'];
    dateFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== '') {
        const parsedValue = parseExcelValue(row[field]);
        if (parsedValue) {
          try {
            const date = new Date(parsedValue);
            if (!isNaN(date.getTime())) {
              row[field] = date.toISOString();
            }
          } catch (e) {
            // Keep original value, let validation handle it
          }
        }
      }
    });
    
    // Remove empty fields
    Object.keys(row).forEach(key => {
      if (row[key] === '' || row[key] === null || row[key] === undefined) {
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

async function generateUniqueSlug(name: string, existingSlugs: Set<string>): Promise<string> {
  let baseSlug = name
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
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
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
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload CSV or Excel file.' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;
    
    try {
      if (fileName.endsWith('.csv')) {
        const text = new TextDecoder().decode(buffer);
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        workbook = XLSX.read(buffer, { type: 'array' });
      }
    } catch (error) {
      return NextResponse.json(
        { message: 'Failed to parse file. Please check file format.' },
        { status: 400 }
      );
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (rawData.length === 0) {
      return NextResponse.json(
        { message: 'File is empty or has no valid data' },
        { status: 400 }
      );
    }

    // Validate categories exist
    const categoryIds = [...new Set(rawData.map((row: any) => row.categoryId).filter(Boolean))];
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    const validCategoryIds = new Set(existingCategories.map(cat => cat.id));

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
      total: rawData.length,
      errorDetails: [],
      successfulProducts: [],
    };

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any;
      const rowIndex = i + 2; // +2 because Excel starts at 1 and we have headers
      
      try {
        // Validate category exists
        if (!validCategoryIds.has(row.categoryId)) {
          result.errorDetails.push({
            row: rowIndex,
            field: 'categoryId',
            message: 'Category does not exist',
            value: row.categoryId,
          });
          result.errors++;
          continue;
        }

        const { data: productData, errors } = convertToProduct(row, rowIndex);

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
          await prisma.product.update({
            where: { sku: productData.sku },
            data: {
              ...productData,
              slug,
              promotionStartDate: productData.promotionStartDate ? new Date(productData.promotionStartDate) : null,
              promotionEndDate: productData.promotionEndDate ? new Date(productData.promotionEndDate) : null,
              memberOnlyUntil: productData.memberOnlyUntil ? new Date(productData.memberOnlyUntil) : null,
              earlyAccessStart: productData.earlyAccessStart ? new Date(productData.earlyAccessStart) : null,
              updatedAt: new Date(),
            },
          });

          result.successfulProducts.push({
            sku: productData.sku,
            name: productData.name,
            action: 'updated',
          });
        } else {
          // Create new product
          await prisma.product.create({
            data: {
              ...productData,
              slug,
              promotionStartDate: productData.promotionStartDate ? new Date(productData.promotionStartDate) : null,
              promotionEndDate: productData.promotionEndDate ? new Date(productData.promotionEndDate) : null,
              memberOnlyUntil: productData.memberOnlyUntil ? new Date(productData.memberOnlyUntil) : null,
              earlyAccessStart: productData.earlyAccessStart ? new Date(productData.earlyAccessStart) : null,
              status: 'ACTIVE',
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
          message: error instanceof Error ? error.message : 'Failed to process row',
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