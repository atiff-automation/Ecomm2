/**
 * Diagnostic endpoint to verify which version of easyparcel-service.ts is deployed
 *
 * This endpoint returns a version identifier to help debug deployment issues.
 * If Railway is showing old behavior, this will confirm if it's using old code.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Read the actual source code to verify validation logic
  const fs = require('fs');
  const path = require('path');

  try {
    // Check if the validation code exists in the deployed file
    const serviceFilePath = path.join(process.cwd(), 'src/lib/shipping/easyparcel-service.ts');
    const serviceCode = fs.readFileSync(serviceFilePath, 'utf-8');

    // Check for the new validation pattern
    const hasNewValidation = serviceCode.includes('Validating payment via parcel array');
    const hasOldValidation = serviceCode.includes('messagenow === "Fully Paid"') || serviceCode.includes('check messagenow text');

    // Get commit info if available
    let commitHash = 'unknown';
    try {
      const gitHeadPath = path.join(process.cwd(), '.git/HEAD');
      if (fs.existsSync(gitHeadPath)) {
        const headContent = fs.readFileSync(gitHeadPath, 'utf-8').trim();
        if (headContent.startsWith('ref:')) {
          const refPath = path.join(process.cwd(), '.git', headContent.slice(5));
          commitHash = fs.readFileSync(refPath, 'utf-8').trim().substring(0, 7);
        } else {
          commitHash = headContent.substring(0, 7);
        }
      }
    } catch (e) {
      console.log('Could not read git commit:', e);
    }

    return NextResponse.json({
      success: true,
      version: {
        commitHash,
        deployedAt: new Date().toISOString(),
        validationVersion: hasNewValidation ? 'v2_parcel_array_only' : (hasOldValidation ? 'v1_messagenow_check' : 'unknown'),
        hasNewValidation,
        hasOldValidation,
        codeSnippet: serviceCode.includes('Validating payment via parcel array')
          ? serviceCode.match(/Validating payment via parcel array[\s\S]{0,200}/)?.[0]
          : 'NEW VALIDATION CODE NOT FOUND',
      },
      note: 'This endpoint helps verify which version of validation logic is deployed',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Failed to read source file - might be compiled/bundled differently in production',
    }, { status: 500 });
  }
}
