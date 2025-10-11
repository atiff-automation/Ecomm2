#!/usr/bin/env tsx
/**
 * View ToyyibPay Webhook Logs
 * Simple script to view webhook logs from files
 */

import { getRecentWebhookLogs, getWebhookLogs } from '../src/lib/utils/webhook-logger';

const args = process.argv.slice(2);
const command = args[0];

function displayLog(log: any, index: number) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Webhook Log #${index + 1}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`⏰ Timestamp: ${log.timestamp}`);
  console.log(`🌐 Method: ${log.method}`);
  console.log(`🔗 URL: ${log.url}`);
  console.log(`📍 Client IP: ${log.clientIp || 'N/A'}`);
  console.log(`\n💳 Payment Details:`);
  console.log(`   Bill Code: ${log.body?.billcode || 'N/A'}`);
  console.log(`   Status: ${log.body?.status === '1' ? '✅ SUCCESS' : log.body?.status === '3' ? '❌ FAILED' : '⏳ PENDING'}`);
  console.log(`   Amount: ${log.body?.amount || 'N/A'} cents`);
  console.log(`   Ref No: ${log.body?.refno || 'N/A'}`);
  console.log(`   Order ID: ${log.body?.order_id || 'N/A'}`);

  if (log.result) {
    console.log(`\n📊 Processing Result:`);
    console.log(`   Success: ${log.result.success ? '✅' : '❌'}`);
    console.log(`   Order Number: ${log.result.orderNumber || 'N/A'}`);
    console.log(`   Bill Code: ${log.result.billCode || 'N/A'}`);
    if (log.result.error) {
      console.log(`   Error: ${log.result.error}`);
    }
  }

  console.log(`\n📋 Full Body:`);
  console.log(JSON.stringify(log.body, null, 2));
}

function main() {
  if (command === 'today') {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Viewing webhooks for today (${today}):\n`);
    const logs = getWebhookLogs(today);

    if (logs.length === 0) {
      console.log('❌ No webhooks logged today');
      return;
    }

    logs.forEach((log, index) => displayLog(log, index));
    console.log(`\n✅ Total webhooks today: ${logs.length}`);

  } else if (command === 'recent') {
    const days = parseInt(args[1]) || 7;
    console.log(`📅 Viewing webhooks from last ${days} days:\n`);
    const logs = getRecentWebhookLogs(days);

    if (logs.length === 0) {
      console.log(`❌ No webhooks logged in the last ${days} days`);
      return;
    }

    logs.forEach((log, index) => displayLog(log, index));
    console.log(`\n✅ Total webhooks: ${logs.length}`);

  } else if (command === 'date') {
    const date = args[1];
    if (!date) {
      console.error('❌ Please provide a date in YYYY-MM-DD format');
      process.exit(1);
    }

    console.log(`📅 Viewing webhooks for ${date}:\n`);
    const logs = getWebhookLogs(date);

    if (logs.length === 0) {
      console.log(`❌ No webhooks logged on ${date}`);
      return;
    }

    logs.forEach((log, index) => displayLog(log, index));
    console.log(`\n✅ Total webhooks: ${logs.length}`);

  } else {
    console.log('ToyyibPay Webhook Log Viewer');
    console.log('============================\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/view-webhook-logs.ts today          - View today\'s webhooks');
    console.log('  npx tsx scripts/view-webhook-logs.ts recent [days]  - View recent webhooks (default: 7 days)');
    console.log('  npx tsx scripts/view-webhook-logs.ts date YYYY-MM-DD - View webhooks for specific date');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/view-webhook-logs.ts today');
    console.log('  npx tsx scripts/view-webhook-logs.ts recent 3');
    console.log('  npx tsx scripts/view-webhook-logs.ts date 2025-10-11');
  }
}

main();
