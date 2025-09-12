#!/usr/bin/env node

const fetch = require('node-fetch');

async function testHealthCheck() {
  try {
    console.log('🏥 TESTING HEALTH CHECK ENDPOINT\n');

    const response = await fetch('http://localhost:3000/api/chat/webhook', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Health check successful!`);
      console.log(`Response:`, JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log(`❌ Health check failed: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
}

testHealthCheck();
