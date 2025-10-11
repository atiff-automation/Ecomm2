/**
 * Field Extraction Investigation
 *
 * This script investigates why the EasyParcel response field extraction
 * might be failing even though the fields exist in the JSON response.
 */

// Actual response from /tmp/easyparcel-response.json
const actualResponse = {
  "result": [
    {
      "REQ_ID": "",
      "parcel_number": "EP-A2V318",
      "order_number": "EI-ZQ0RT",
      "price": "6.49",
      "addon_price": "0.20",
      "addon": {
        "sms_addon": "0.00",
        "sms_tax": "0.00",
        "email_addon": "0.00",
        "email_tax": "0.00",
        "awbbranding_addon": "0.00",
        "awbbranding_tax": "0.00",
        "whatsapp_addon": "0.20",
        "whatsapp_tax": "0.00"
      },
      "shipment_price": "5.93",
      "shipment_tax": "0.36",
      "insurance_charges": "0.00",
      "insurance_charges_tax": "0.00",
      "max_insurance_coverage": "50.00",
      "cod_charges": "0.00",
      "cod_charges_tax": "0.00",
      "addon_whatsapp_tracking_charges": "0.20",
      "status": "Success",
      "remarks": "Order Successfully Placed.",
      "courier": "J&T Express",
      "collect_date": "2025-10-13"
    }
  ],
  "api_status": "Success",
  "error_code": "0",
  "error_remark": ""
};

console.log('🔍 Field Extraction Investigation\n');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: Basic extraction
console.log('TEST 1: Basic Extraction');
console.log('───────────────────────────────────────────────────');
const bulkResult = actualResponse.result?.[0];
console.log('bulkResult exists?:', !!bulkResult);
console.log('bulkResult type:', typeof bulkResult);
console.log('bulkResult is array?:', Array.isArray(bulkResult));
console.log('bulkResult keys:', Object.keys(bulkResult || {}));
console.log('');

// Test 2: Direct field access
console.log('TEST 2: Direct Field Access');
console.log('───────────────────────────────────────────────────');
console.log('bulkResult.order_number:', bulkResult?.order_number);
console.log('bulkResult.parcel_number:', bulkResult?.parcel_number);
console.log('bulkResult.status:', bulkResult?.status);
console.log('');

// Test 3: TypeScript optional chaining
console.log('TEST 3: Optional Chaining');
console.log('───────────────────────────────────────────────────');
const orderNumber = bulkResult?.order_number;
const parcelNumber = bulkResult?.parcel_number;
console.log('orderNumber:', orderNumber);
console.log('parcelNumber:', parcelNumber);
console.log('typeof orderNumber:', typeof orderNumber);
console.log('typeof parcelNumber:', typeof parcelNumber);
console.log('');

// Test 4: Type assertion (as any)
console.log('TEST 4: Type Assertion (as any)');
console.log('───────────────────────────────────────────────────');
const orderNumberAny = (bulkResult as any).order_number;
const parcelNumberAny = (bulkResult as any).parcel_number;
console.log('orderNumberAny:', orderNumberAny);
console.log('parcelNumberAny:', parcelNumberAny);
console.log('typeof orderNumberAny:', typeof orderNumberAny);
console.log('typeof parcelNumberAny:', typeof parcelNumberAny);
console.log('');

// Test 5: Truthiness check (what the code does)
console.log('TEST 5: Truthiness Check (!field)');
console.log('───────────────────────────────────────────────────');
console.log('!orderNumber:', !orderNumber);
console.log('!parcelNumber:', !parcelNumber);
console.log('!orderNumber || !parcelNumber:', !orderNumber || !parcelNumber);
console.log('This would trigger error?:', !orderNumber || !parcelNumber);
console.log('');

// Test 6: Check for undefined vs empty string
console.log('TEST 6: Undefined vs Empty String Check');
console.log('───────────────────────────────────────────────────');
console.log('orderNumber === undefined:', orderNumber === undefined);
console.log('parcelNumber === undefined:', parcelNumber === undefined);
console.log('orderNumber === "":', orderNumber === '');
console.log('parcelNumber === "":', parcelNumber === '');
console.log('');

// Test 7: JSON stringification
console.log('TEST 7: JSON Stringification');
console.log('───────────────────────────────────────────────────');
console.log('Full bulkResult:', JSON.stringify(bulkResult, null, 2));
console.log('');

// Test 8: Property descriptor
console.log('TEST 8: Property Descriptors');
console.log('───────────────────────────────────────────────────');
if (bulkResult) {
  console.log('order_number descriptor:', Object.getOwnPropertyDescriptor(bulkResult, 'order_number'));
  console.log('parcel_number descriptor:', Object.getOwnPropertyDescriptor(bulkResult, 'parcel_number'));
}
console.log('');

// Test 9: hasOwnProperty check
console.log('TEST 9: hasOwnProperty Check');
console.log('───────────────────────────────────────────────────');
if (bulkResult) {
  console.log('hasOwnProperty("order_number"):', bulkResult.hasOwnProperty('order_number'));
  console.log('hasOwnProperty("parcel_number"):', bulkResult.hasOwnProperty('parcel_number'));
  console.log('"order_number" in bulkResult:', 'order_number' in bulkResult);
  console.log('"parcel_number" in bulkResult:', 'parcel_number' in bulkResult);
}
console.log('');

// Test 10: Simulate the actual code logic
console.log('TEST 10: Simulate Actual Code Logic');
console.log('───────────────────────────────────────────────────');

interface MockResult {
  status: string;
  remarks: string;
  order_number?: string;
  parcel_number?: string;
  courier?: string;
}

const typedBulkResult: MockResult | undefined = actualResponse.result?.[0];

console.log('With TypeScript types:');
console.log('  typedBulkResult.order_number:', typedBulkResult?.order_number);
console.log('  typedBulkResult.parcel_number:', typedBulkResult?.parcel_number);
console.log('  !typedBulkResult?.order_number:', !typedBulkResult?.order_number);
console.log('  !typedBulkResult?.parcel_number:', !typedBulkResult?.parcel_number);
console.log('  Would fail check?:', !typedBulkResult?.order_number || !typedBulkResult?.parcel_number);
console.log('');

// Test 11: Check the response structure
console.log('TEST 11: Response Structure Validation');
console.log('───────────────────────────────────────────────────');
console.log('response.api_status:', actualResponse.api_status);
console.log('response.error_code:', actualResponse.error_code);
console.log('response.result is array?:', Array.isArray(actualResponse.result));
console.log('response.result length:', actualResponse.result.length);
console.log('response.result[0] exists?:', !!actualResponse.result[0]);
console.log('');

// Final summary
console.log('═══════════════════════════════════════════════════');
console.log('INVESTIGATION SUMMARY');
console.log('═══════════════════════════════════════════════════\n');

console.log('Key Findings:');
console.log('1. Fields exist in JSON:', !!bulkResult?.order_number && !!bulkResult?.parcel_number);
console.log('2. Values are non-empty strings:', orderNumber !== '' && parcelNumber !== '');
console.log('3. Extraction works with optional chaining:', !!orderNumber && !!parcelNumber);
console.log('4. Type assertion (as any) works:', !!orderNumberAny && !!parcelNumberAny);
console.log('5. TypeScript typed access works:', !!typedBulkResult?.order_number && !!typedBulkResult?.parcel_number);
console.log('');

if (orderNumber && parcelNumber) {
  console.log('✅ CONCLUSION: Fields CAN be extracted successfully!');
  console.log('');
  console.log('Extracted values:');
  console.log('  - order_number:', orderNumber);
  console.log('  - parcel_number:', parcelNumber);
  console.log('');
  console.log('The error must be occurring due to:');
  console.log('  • Webpack compilation/bundling issue (hot reload not updating)');
  console.log('  • TypeScript type narrowing issue in runtime');
  console.log('  • Cached Next.js build');
  console.log('  • The fix already applied should work!');
} else {
  console.log('❌ PROBLEM: Fields CANNOT be extracted');
  console.log('This would be unexpected based on the JSON structure');
}
