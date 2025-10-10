#!/usr/bin/env node

/**
 * Check EasyParcel Balance
 * Quick script to check your EasyParcel account balance
 *
 * Usage: node scripts/check-easyparcel-balance.js
 * Or: npm run easyparcel:balance
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.EASYPARCEL_API_KEY;
const ENVIRONMENT = process.env.EASYPARCEL_ENVIRONMENT || 'sandbox';

if (!API_KEY) {
  console.log('❌ EASYPARCEL_API_KEY not found in environment variables');
  console.log('Please add it to your .env.local file');
  process.exit(1);
}

const BASE_URL = ENVIRONMENT === 'production'
  ? 'connect.easyparcel.my'
  : 'sandbox.connect.easyparcel.my';

console.log('═'.repeat(60));
console.log('💰 EASYPARCEL BALANCE CHECK');
console.log('═'.repeat(60));
console.log(`Environment: ${ENVIRONMENT.toUpperCase()}`);
console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
console.log('─'.repeat(60));

// Build request
const params = new URLSearchParams({
  api: API_KEY
});

const options = {
  hostname: BASE_URL,
  path: `/?ac=EPCheckCreditBalance`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(params.toString())
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.api_status === 'Success' && response.error_code === '0') {
        const balance = parseFloat(response.result);

        console.log('');
        console.log('✅ Balance Retrieved Successfully');
        console.log('─'.repeat(60));
        console.log(`Current Balance: RM ${balance.toFixed(2)}`);
        console.log('');

        // Warnings
        if (balance < 10) {
          console.log('⚠️ WARNING: Balance is very low (< RM 10)');
          console.log('Please top up before running paid tests');
        } else if (balance < 20) {
          console.log('⚠️ CAUTION: Balance is low (< RM 20)');
          console.log('Consider topping up soon');
        } else {
          console.log('✅ Balance is sufficient for testing');
        }

        console.log('');
        console.log('Estimated test costs:');
        console.log('  • Rate checking: RM 0.00 (FREE)');
        console.log('  • Shipment booking: RM 5.00 - RM 15.00 per shipment');
        console.log('  • Recommended minimum: RM 20.00');
      } else {
        console.log('❌ API Error:');
        console.log(`Status: ${response.api_status}`);
        console.log(`Error Code: ${response.error_code}`);
        console.log(`Message: ${response.error_remark || 'Unknown error'}`);
      }

      console.log('═'.repeat(60));
    } catch (error) {
      console.log('❌ Failed to parse response');
      console.log('Raw response:', data);
      console.log('═'.repeat(60));
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed');
  console.log('Error:', error.message);
  console.log('═'.repeat(60));
});

req.write(params.toString());
req.end();
