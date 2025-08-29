import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface ImportResult {
  success: boolean;
  statesImported: number;
  postcodesImported: number;
  errors: string[];
  duplicatesSkipped: number;
}

export class PostcodeImportService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Import states from CSV file
   * Following CLAUDE.md: NO hardcoding, systematic approach
   */
  async importStatesFromCSV(filePath: string): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`States CSV file not found: ${filePath}`);
      }

      // Read and parse CSV
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      // Skip header if present
      const dataLines = lines.filter(line => !line.startsWith('"') || !line.includes('State'));

      for (const line of dataLines) {
        if (!line.trim()) continue;

        try {
          // Parse CSV line: "PLS","Perlis"
          const matches = line.match(/^"([^"]+)","([^"]+)"$/);
          if (!matches) {
            errors.push(`Invalid state line format: ${line}`);
            continue;
          }

          const [, stateCode, stateName] = matches;

          // Validate data
          if (!stateCode || !stateName || stateCode.length !== 3) {
            errors.push(`Invalid state data: ${line}`);
            continue;
          }

          // Upsert state (centralized approach - single source of truth)
          await this.prisma.malaysianState.upsert({
            where: { id: stateCode },
            update: { name: stateName },
            create: { id: stateCode, name: stateName }
          });

          count++;
        } catch (error) {
          errors.push(`Error processing state line "${line}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success: errors.length === 0, count, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to import states: ${errorMessage}`);
      return { success: false, count: 0, errors };
    }
  }

  /**
   * Import postcodes from cleaned CSV file
   * Following CLAUDE.md: Systematic, no hardcoding, centralized
   */
  async importPostcodesFromCSV(filePath: string): Promise<{ success: boolean; count: number; errors: string[]; duplicatesSkipped: number }> {
    const errors: string[] = [];
    let count = 0;
    let duplicatesSkipped = 0;

    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Postcodes CSV file not found: ${filePath}`);
      }

      // Read and parse CSV
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          // Parse CSV line: 01000,Kangar,PLS
          const parts = line.split(',');
          if (parts.length !== 3) {
            errors.push(`Invalid postcode line format (expected 3 columns): ${line}`);
            continue;
          }

          const [postcode, district, stateCode] = parts.map(p => p.trim());

          // Validate data
          if (!postcode || !district || !stateCode) {
            errors.push(`Missing data in line: ${line}`);
            continue;
          }

          if (postcode.length !== 5 || !/^\d{5}$/.test(postcode)) {
            errors.push(`Invalid postcode format: ${postcode}`);
            continue;
          }

          if (stateCode.length !== 3) {
            errors.push(`Invalid state code format: ${stateCode}`);
            continue;
          }

          // Check if state exists (referential integrity)
          const stateExists = await this.prisma.malaysianState.findUnique({
            where: { id: stateCode }
          });

          if (!stateExists) {
            errors.push(`State code not found: ${stateCode} for postcode ${postcode}`);
            continue;
          }

          // Check for existing postcode-district combination
          const existing = await this.prisma.malaysianPostcode.findUnique({
            where: { postcode_district: { postcode, district } }
          });

          if (existing) {
            duplicatesSkipped++;
            continue;
          }

          // Create postcode entry
          await this.prisma.malaysianPostcode.create({
            data: {
              postcode,
              district,
              stateCode
            }
          });

          count++;
        } catch (error) {
          errors.push(`Error processing postcode line "${line}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success: errors.length === 0, count, errors, duplicatesSkipped };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to import postcodes: ${errorMessage}`);
      return { success: false, count: 0, errors, duplicatesSkipped: 0 };
    }
  }

  /**
   * Validate import results
   * Following CLAUDE.md: Systematic validation approach
   */
  async validateImport(): Promise<ImportResult> {
    const errors: string[] = [];
    let statesImported = 0;
    let postcodesImported = 0;

    try {
      // Count imported states
      statesImported = await this.prisma.malaysianState.count();
      
      // Count imported postcodes
      postcodesImported = await this.prisma.malaysianPostcode.count();

      // Validate referential integrity using raw query for better control
      const orphanedCount = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM malaysian_postcodes mp
        LEFT JOIN malaysian_states ms ON mp."stateCode" = ms.id
        WHERE ms.id IS NULL
      ` as Array<{ count: bigint }>;

      const orphanedPostcodes = Number(orphanedCount[0].count);

      if (orphanedPostcodes > 0) {
        errors.push(`Found ${orphanedPostcodes} postcodes with invalid state codes`);
      }

      // Validate data quality
      const duplicatePostcodes = await this.prisma.$queryRaw`
        SELECT postcode, district, COUNT(*) as count 
        FROM malaysian_postcodes 
        GROUP BY postcode, district 
        HAVING COUNT(*) > 1
      ` as Array<{ postcode: string; district: string; count: bigint }>;

      if (duplicatePostcodes.length > 0) {
        errors.push(`Found ${duplicatePostcodes.length} duplicate postcode-district combinations`);
      }

      // Expected Malaysian states validation
      const expectedStates = 16; // As per plan
      if (statesImported < expectedStates) {
        errors.push(`Expected ${expectedStates} states, but found ${statesImported}`);
      }

      return {
        success: errors.length === 0,
        statesImported,
        postcodesImported,
        errors,
        duplicatesSkipped: 0 // Will be updated during import
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        statesImported: 0,
        postcodesImported: 0,
        errors: [`Validation failed: ${errorMessage}`],
        duplicatesSkipped: 0
      };
    }
  }

  /**
   * Complete import process
   * Following CLAUDE.md: Centralized, systematic approach
   */
  async importAll(statesFilePath: string, postcodesFilePath: string): Promise<ImportResult> {
    console.log('🚀 Starting Malaysian Postcode System Import...');
    console.log('Following CLAUDE.md principles: NO hardcoding, centralized approach');

    // Import states first (foreign key dependency)
    console.log('📍 Phase 1: Importing Malaysian states...');
    const stateResult = await this.importStatesFromCSV(statesFilePath);
    
    if (!stateResult.success) {
      return {
        success: false,
        statesImported: stateResult.count,
        postcodesImported: 0,
        errors: stateResult.errors,
        duplicatesSkipped: 0
      };
    }

    console.log(`✅ States imported: ${stateResult.count}`);

    // Import postcodes
    console.log('📮 Phase 2: Importing Malaysian postcodes...');
    const postcodeResult = await this.importPostcodesFromCSV(postcodesFilePath);
    
    if (!postcodeResult.success && postcodeResult.errors.length > 0) {
      console.log(`⚠️  Postcode import completed with warnings: ${postcodeResult.errors.length} errors`);
    }

    console.log(`✅ Postcodes imported: ${postcodeResult.count}`);
    console.log(`⏭️  Duplicates skipped: ${postcodeResult.duplicatesSkipped}`);

    // Validate final results
    console.log('🔍 Phase 3: Validating import results...');
    const validation = await this.validateImport();

    const finalResult: ImportResult = {
      success: stateResult.success && postcodeResult.success && validation.success,
      statesImported: stateResult.count,
      postcodesImported: postcodeResult.count,
      errors: [...stateResult.errors, ...postcodeResult.errors, ...validation.errors],
      duplicatesSkipped: postcodeResult.duplicatesSkipped
    };

    if (finalResult.success) {
      console.log('🎉 Import completed successfully!');
      console.log(`📊 Final Stats: ${finalResult.statesImported} states, ${finalResult.postcodesImported} postcodes`);
    } else {
      console.log('❌ Import completed with errors:');
      finalResult.errors.forEach(error => console.log(`   - ${error}`));
    }

    return finalResult;
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}