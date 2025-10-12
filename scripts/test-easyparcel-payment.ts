/**
 * EasyParcel Payment Response Test Script
 *
 * PURPOSE: Test payment validation logic with captured API responses
 * NO COST: This script does NOT call EasyParcel API
 *
 * Usage:
 * 1. Copy exact response from Railway logs
 * 2. Paste into mockResponse below
 * 3. Run: npx ts-node scripts/test-easyparcel-payment.ts
 */

// Mock response structure based on EasyParcel API
interface EasyParcelPaymentResponse {
  api_status: string;
  error_code: string;
  error_remark: string;
  result: Array<{
    status: string;
    remarks: string;
    orderno?: string;
    messagenow?: string;
    parcel?: Array<{
      parcelno: string;
      awb: string;
      awb_id_link: string;
      tracking_url: string;
    }>;
  }>;
}

// ============================================================================
// PASTE YOUR CAPTURED RESPONSE HERE
// ============================================================================
// REAL RESPONSE FROM PRODUCTION (2025-10-12)
// Order: ORD-20251012-NJCX
// EasyParcel Order: EI-ZQ932
const mockResponse: EasyParcelPaymentResponse = {
  api_status: 'Success',
  error_code: '0',
  error_remark: '',
  result: [
    {
      status: 'Success',
      orderno: 'EI-ZQ932',
      messagenow: 'Payment Done',  // ⚠️ NOT "Fully Paid" - this caused the failure!
      remarks: '',
      parcel: [
        {
          parcelno: 'EP-A2V7KE',
          awb: '631875892940',
          awb_id_link: 'https://connect.easyparcel.my/?ac=AWBLabel&id=RVAtMTBGcWlpNVpQIzI2OTY0ODA1OA%3D%3D',
          tracking_url: 'https://app.easyparcel.com/my/en/track/details/?courier=JnT-Express&awb=631875892940',
        },
      ],
    },
  ],
};

// ============================================================================
// VALIDATION LOGIC (same as in easyparcel-service.ts)
// ============================================================================

function validatePaymentResponse(response: EasyParcelPaymentResponse): {
  success: boolean;
  error?: string;
  data?: any;
} {
  console.log('\n========== TESTING PAYMENT VALIDATION ==========\n');
  console.log('Input Response:');
  console.log(JSON.stringify(response, null, 2));
  console.log('\n');

  // Step 1: Check API status
  console.log('Step 1: Checking API status...');
  if (response.api_status !== 'Success' || response.error_code !== '0') {
    console.log('❌ FAILED: API returned error');
    console.log(`   api_status: ${response.api_status}`);
    console.log(`   error_code: ${response.error_code}`);
    console.log(`   error_remark: ${response.error_remark}`);
    return {
      success: false,
      error: response.error_remark || 'Failed to process order payment',
    };
  }
  console.log('✅ PASSED: API status is Success\n');

  // Step 2: Extract bulk result
  console.log('Step 2: Extracting bulk result...');
  const bulkResult = response.result?.[0];
  if (!bulkResult || bulkResult.status !== 'Success') {
    console.log('❌ FAILED: Bulk result missing or failed');
    console.log(`   bulkResult exists: ${!!bulkResult}`);
    console.log(`   bulkResult.status: ${bulkResult?.status}`);
    return {
      success: false,
      error: bulkResult?.remarks || 'Failed to process order payment',
    };
  }
  console.log('✅ PASSED: Bulk result status is Success\n');

  // Step 3: Check for parcels (CRITICAL CHECK)
  console.log('Step 3: Checking for parcel data...');
  const parcels = bulkResult.parcel || [];
  console.log(`   parcel array length: ${parcels.length}`);
  if (parcels.length === 0) {
    console.log('❌ FAILED: No parcel details returned');
    return {
      success: false,
      error: 'No parcel details returned after payment',
    };
  }
  console.log('✅ PASSED: Parcel data exists\n');

  // Step 4: Check messagenow for actual failures only
  console.log('Step 4: Checking messagenow for failures...');
  console.log(`   messagenow: "${bulkResult.messagenow}"`);
  if (bulkResult.messagenow) {
    const message = bulkResult.messagenow.toLowerCase();
    if (message.includes('insufficient') || message.includes('not enough credit')) {
      console.log('❌ FAILED: Insufficient balance detected');
      return {
        success: false,
        error: bulkResult.messagenow,
      };
    }
  }
  console.log('✅ PASSED: No failure indicators in messagenow\n');

  // Step 5: Success!
  console.log('Step 5: Extracting AWB details...');
  const firstParcel = parcels[0];
  console.log(`   parcelno: ${firstParcel.parcelno}`);
  console.log(`   awb: ${firstParcel.awb}`);
  console.log(`   awb_id_link: ${firstParcel.awb_id_link}`);
  console.log(`   tracking_url: ${firstParcel.tracking_url}`);
  console.log('\n✅ VALIDATION SUCCESSFUL!\n');

  return {
    success: true,
    data: {
      order_number: bulkResult.orderno,
      payment_status: bulkResult.messagenow,
      parcels: parcels.map((p) => ({
        parcelno: p.parcelno,
        awb: p.awb,
        awb_id_link: p.awb_id_link,
        tracking_url: p.tracking_url,
      })),
    },
  };
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

console.log('\n\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  EasyParcel Payment Response Validator (NO COST TESTING)  ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// Run validation
const result = validatePaymentResponse(mockResponse);

console.log('\n========== VALIDATION RESULT ==========\n');
if (result.success) {
  console.log('✅ PAYMENT WOULD SUCCEED');
  console.log('\nExtracted Data:');
  console.log(JSON.stringify(result.data, null, 2));
} else {
  console.log('❌ PAYMENT WOULD FAIL');
  console.log(`\nError: ${result.error}`);
}

// ============================================================================
// ADDITIONAL TEST SCENARIOS
// ============================================================================

console.log('\n\n========== TESTING EDGE CASES ==========\n');

// Test Case 1: messagenow variations
console.log('Test Case 1: Different messagenow values');
const testCases = [
  { messagenow: 'Fully Paid', expected: 'SUCCESS' },
  { messagenow: 'paid', expected: 'SUCCESS' },
  { messagenow: 'PAID', expected: 'SUCCESS' },
  { messagenow: 'Payment Successful', expected: 'SUCCESS' },
  { messagenow: 'Insufficient Balance', expected: 'FAIL' },
  { messagenow: 'Not enough credit', expected: 'FAIL' },
  { messagenow: '', expected: 'SUCCESS (empty is OK if parcels exist)' },
];

testCases.forEach((testCase) => {
  const testResponse: EasyParcelPaymentResponse = {
    ...mockResponse,
    result: [
      {
        ...mockResponse.result[0],
        messagenow: testCase.messagenow,
      },
    ],
  };

  const testResult = validatePaymentResponse(testResponse);
  const actualResult = testResult.success ? 'SUCCESS' : 'FAIL';

  console.log(`\n  messagenow: "${testCase.messagenow}"`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Actual: ${actualResult}`);

  if (testCase.expected.includes(actualResult)) {
    console.log('  ✅ PASSED');
  } else {
    console.log('  ❌ FAILED - Behavior mismatch!');
  }
});

console.log('\n\n========== TEST COMPLETE ==========\n');
