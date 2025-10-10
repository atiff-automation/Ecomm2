#!/usr/bin/env node

/**
 * Log Analysis Tool
 * Analyzes order flow logs and generates summary reports
 *
 * Usage: node scripts/analyze-logs.js [session-file]
 * Or: npm run logs:analyze
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs', 'order-flow');

// Get session file from argument or use latest
let sessionFile;

if (process.argv[2]) {
  sessionFile = process.argv[2];
  if (!path.isAbsolute(sessionFile)) {
    sessionFile = path.join(LOG_DIR, sessionFile);
  }
} else {
  // Get latest session log
  if (!fs.existsSync(LOG_DIR)) {
    console.log('❌ No log directory found.');
    process.exit(1);
  }

  const files = fs.readdirSync(LOG_DIR)
    .filter(f => f.startsWith('session-'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('❌ No log files found.');
    process.exit(1);
  }

  sessionFile = path.join(LOG_DIR, files[0]);
}

console.log('═'.repeat(60));
console.log('📊 LOG ANALYSIS REPORT');
console.log('═'.repeat(60));
console.log(`Analyzing: ${path.basename(sessionFile)}\n`);

// Parse logs
const logs = fs.readFileSync(sessionFile, 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  })
  .filter(Boolean);

// Analyze
const analysis = {
  totalEntries: logs.length,
  byType: {},
  byStep: {},
  errors: [],
  requests: [],
  responses: [],
  timeline: [],
  orderNumbers: new Set()
};

logs.forEach(log => {
  // Count by type
  analysis.byType[log.type] = (analysis.byType[log.type] || 0) + 1;

  // Count by step
  analysis.byStep[log.step] = (analysis.byStep[log.step] || 0) + 1;

  // Collect order numbers
  if (log.orderNumber) {
    analysis.orderNumbers.add(log.orderNumber);
  }

  // Collect errors
  if (log.type === 'ERROR') {
    analysis.errors.push({
      step: log.step,
      timestamp: log.timestamp,
      error: log.data.error
    });
  }

  // Collect requests
  if (log.type === 'REQUEST') {
    analysis.requests.push({
      step: log.step,
      timestamp: log.timestamp,
      endpoint: log.data.endpoint
    });
  }

  // Collect responses
  if (log.type === 'RESPONSE') {
    analysis.responses.push({
      step: log.step,
      timestamp: log.timestamp,
      endpoint: log.data.endpoint
    });
  }

  // Timeline
  analysis.timeline.push({
    time: log.timestamp,
    type: log.type,
    step: log.step
  });
});

// Display results
console.log('📈 STATISTICS');
console.log('─'.repeat(60));
console.log(`Total Entries: ${analysis.totalEntries}`);
console.log(`Orders Tracked: ${analysis.orderNumbers.size}`);
if (analysis.orderNumbers.size > 0) {
  console.log('Order Numbers:', Array.from(analysis.orderNumbers).join(', '));
}
console.log('');

console.log('By Type:');
Object.entries(analysis.byType).forEach(([type, count]) => {
  const icon = {
    REQUEST: '📤',
    RESPONSE: '📥',
    ERROR: '❌',
    INFO: 'ℹ️'
  }[type] || '•';
  console.log(`  ${icon} ${type}: ${count}`);
});
console.log('');

console.log('By Step:');
Object.entries(analysis.byStep)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([step, count]) => {
    console.log(`  • ${step}: ${count}`);
  });
console.log('');

// Errors
if (analysis.errors.length > 0) {
  console.log('❌ ERRORS FOUND:');
  console.log('─'.repeat(60));
  analysis.errors.forEach((err, i) => {
    console.log(`${i + 1}. [${new Date(err.timestamp).toLocaleTimeString()}] ${err.step}`);
    if (err.error.message) {
      console.log(`   Message: ${err.error.message}`);
    }
    console.log('');
  });
} else {
  console.log('✅ No errors found\n');
}

// Request/Response matching
console.log('📊 REQUEST/RESPONSE PAIRS');
console.log('─'.repeat(60));

const stepPairs = {};
analysis.requests.forEach(req => {
  const res = analysis.responses.find(r =>
    r.step === req.step && r.timestamp > req.timestamp
  );

  if (!stepPairs[req.step]) {
    stepPairs[req.step] = { requests: 0, responses: 0 };
  }
  stepPairs[req.step].requests++;
  if (res) {
    stepPairs[req.step].responses++;
  }
});

Object.entries(stepPairs).forEach(([step, counts]) => {
  const status = counts.requests === counts.responses ? '✅' : '⚠️';
  console.log(`${status} ${step}: ${counts.requests} requests, ${counts.responses} responses`);
});
console.log('');

// Timeline
console.log('📅 TIMELINE (First 10 and Last 10 events)');
console.log('─'.repeat(60));

const showTimeline = (events) => {
  events.forEach(event => {
    const time = new Date(event.time).toLocaleTimeString();
    const icon = {
      REQUEST: '📤',
      RESPONSE: '📥',
      ERROR: '❌',
      INFO: 'ℹ️'
    }[event.type] || '•';
    console.log(`${time} ${icon} ${event.step}`);
  });
};

console.log('First 10 events:');
showTimeline(analysis.timeline.slice(0, 10));

if (analysis.timeline.length > 20) {
  console.log('\n...\n');
  console.log('Last 10 events:');
  showTimeline(analysis.timeline.slice(-10));
}

console.log('');
console.log('═'.repeat(60));

// Summary
const hasErrors = analysis.errors.length > 0;
const allPairsMatched = Object.values(stepPairs).every(p => p.requests === p.responses);

if (hasErrors) {
  console.log('⚠️ ISSUES DETECTED - Review errors above');
} else if (!allPairsMatched) {
  console.log('⚠️ Some requests did not receive responses');
} else {
  console.log('✅ ALL CHECKS PASSED - No issues detected');
}

console.log('═'.repeat(60));
