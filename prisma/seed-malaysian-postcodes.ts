/**
 * Malaysian Postcode Database Seeding Script
 * Seeds postcode data from CSV files following CLAUDE.md principles
 * Single source of truth approach - no hardcoding, centralized data management
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StateRecord {
  stateCode: string;
  stateName: string;
}

interface PostcodeRecord {
  postcode: string;
  city: string;
  stateCode: string;
}

/**
 * Parse CSV content into structured data
 * Following DRY principles with reusable parser
 */
function parseCSV<T>(
  csvContent: string, 
  parser: (line: string) => T | null
): T[] {
  const lines = csvContent.trim().split('\n');
  const records: T[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const record = parser(line);
      if (record) {
        records.push(record);
      }
    } catch (error) {
      console.warn(`Warning: Failed to parse line ${i + 1}: "${line}", Error: ${error}`);
    }
  }
  
  return records;
}

/**
 * Parse state CSV line: "JHR","Johor"
 */
function parseStateLine(line: string): StateRecord | null {
  const match = line.match(/^"([^"]+)","([^"]+)"$/);
  if (!match) return null;
  
  const [, stateCode, stateName] = match;
  if (!stateCode || !stateName) return null;
  
  return {
    stateCode: stateCode.trim(),
    stateName: stateName.trim()
  };
}

/**
 * Parse postcode CSV line: 50200,Kuala Lumpur,KUL
 */
function parsePostcodeLine(line: string): PostcodeRecord | null {
  const parts = line.split(',').map(part => part.trim());
  if (parts.length !== 3) return null;
  
  const [postcode, city, stateCode] = parts;
  if (!postcode || !city || !stateCode) return null;
  
  // Validate postcode format (5 digits)
  if (!/^\d{5}$/.test(postcode)) return null;
  
  return {
    postcode,
    city,
    stateCode
  };
}

/**
 * Read and validate CSV files
 */
async function readCSVFiles(): Promise<{
  states: StateRecord[];
  postcodes: PostcodeRecord[];
}> {
  const projectRoot = path.resolve(__dirname, '..');
  
  // Read state mapping CSV
  const statesPath = path.join(projectRoot, 'Malaysia_Postcode-states.csv');
  if (!fs.existsSync(statesPath)) {
    throw new Error(`States CSV file not found at: ${statesPath}`);
  }
  
  // Read postcode data CSV  
  const postcodesPath = path.join(projectRoot, 'Malaysia_Postcode-postcodes - Malaysia_Postcode-postcodes_clean.csv');
  if (!fs.existsSync(postcodesPath)) {
    throw new Error(`Postcodes CSV file not found at: ${postcodesPath}`);
  }
  
  console.log('📁 Reading CSV files...');
  const statesContent = fs.readFileSync(statesPath, 'utf-8');
  const postcodesContent = fs.readFileSync(postcodesPath, 'utf-8');
  
  console.log('🔍 Parsing CSV data...');
  const states = parseCSV(statesContent, parseStateLine);
  const postcodes = parseCSV(postcodesContent, parsePostcodeLine);
  
  console.log(`✅ Parsed ${states.length} states and ${postcodes.length} postcodes`);
  
  // Validate data integrity
  const stateCodesInStates = new Set(states.map(s => s.stateCode));
  const stateCodesInPostcodes = new Set(postcodes.map(p => p.stateCode));
  const missingStates = [...stateCodesInPostcodes].filter(code => !stateCodesInStates.has(code));
  
  if (missingStates.length > 0) {
    throw new Error(`Data integrity error: Missing state definitions for codes: ${missingStates.join(', ')}`);
  }
  
  return { states, postcodes };
}

/**
 * Seed Malaysian states into database
 */
async function seedStates(states: StateRecord[]): Promise<void> {
  console.log('🌱 Seeding Malaysian states...');
  
  // Clear existing states first (CASCADE will clear postcodes too)
  await prisma.malaysianState.deleteMany({});
  
  // Insert states with batch processing
  const batchSize = 50;
  for (let i = 0; i < states.length; i += batchSize) {
    const batch = states.slice(i, i + batchSize);
    await prisma.malaysianState.createMany({
      data: batch.map(state => ({
        id: state.stateCode,
        name: state.stateName
      })),
      skipDuplicates: true
    });
  }
  
  console.log(`✅ Seeded ${states.length} Malaysian states`);
}

/**
 * Seed Malaysian postcodes into database
 */
async function seedPostcodes(postcodes: PostcodeRecord[]): Promise<void> {
  console.log('🌱 Seeding Malaysian postcodes...');
  
  // Clear existing postcodes
  await prisma.malaysianPostcode.deleteMany({});
  
  // Insert postcodes with batch processing for performance
  const batchSize = 1000; // Larger batches for postcodes
  let processedCount = 0;
  
  for (let i = 0; i < postcodes.length; i += batchSize) {
    const batch = postcodes.slice(i, i + batchSize);
    
    await prisma.malaysianPostcode.createMany({
      data: batch.map(postcode => ({
        postcode: postcode.postcode,
        district: postcode.city,
        stateCode: postcode.stateCode
      })),
      skipDuplicates: true
    });
    
    processedCount += batch.length;
    console.log(`📦 Processed ${processedCount}/${postcodes.length} postcodes`);
  }
  
  console.log(`✅ Seeded ${postcodes.length} Malaysian postcodes`);
}

/**
 * Validate seeded data
 */
async function validateSeedData(): Promise<void> {
  console.log('🔍 Validating seeded data...');
  
  const stateCount = await prisma.malaysianState.count();
  const postcodeCount = await prisma.malaysianPostcode.count();
  
  console.log(`📊 Database contains ${stateCount} states and ${postcodeCount} postcodes`);
  
  // Test a few sample postcodes
  const testPostcodes = ['50200', '40000', '10200', '80100'];
  console.log('🧪 Testing sample postcodes:');
  
  for (const testCode of testPostcodes) {
    const result = await prisma.malaysianPostcode.findFirst({
      where: { postcode: testCode },
      include: { state: true }
    });
    
    if (result) {
      console.log(`  ✅ ${testCode} → ${result.district}, ${result.state.name}`);
    } else {
      console.log(`  ❌ ${testCode} → Not found`);
    }
  }
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🚀 Starting Malaysian postcode seeding...');
  console.log('📋 Following CLAUDE.md principles: DRY, centralized, no hardcoding');
  
  try {
    // Read and validate CSV data
    const { states, postcodes } = await readCSVFiles();
    
    // Seed states first (required for foreign key references)
    await seedStates(states);
    
    // Seed postcodes with state references
    await seedPostcodes(postcodes);
    
    // Validate the seeded data
    await validateSeedData();
    
    console.log('🎉 Malaysian postcode seeding completed successfully!');
    console.log('💡 Auto-fill functionality should now work correctly');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Execute seeding
main()
  .catch((e) => {
    console.error('💥 Critical seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });