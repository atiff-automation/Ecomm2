#!/usr/bin/env node

/**
 * Real-time Log Viewer
 * Watches the latest order flow log file and displays entries in real-time
 *
 * Usage: node scripts/view-logs.js
 * Or: npm run logs:watch
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LOG_DIR = path.join(process.cwd(), 'logs', 'order-flow');

// Check if log directory exists
if (!fs.existsSync(LOG_DIR)) {
  console.log('❌ No log directory found.');
  console.log('Logs will be created when you start the dev server with DEBUG=order-flow');
  process.exit(1);
}

// Get latest session log
const files = fs.readdirSync(LOG_DIR)
  .filter(f => f.startsWith('session-'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.log('❌ No log files found.');
  console.log('Start the dev server with: DEBUG=order-flow npm run dev');
  process.exit(1);
}

const latestLog = path.join(LOG_DIR, files[0]);

console.log('═'.repeat(60));
console.log('📊 ORDER FLOW LOG VIEWER');
console.log('═'.repeat(60));
console.log(`Watching: ${latestLog}`);
console.log('Press Ctrl+C to exit');
console.log('═'.repeat(60));
console.log('');

// Read existing content
try {
  const existingContent = fs.readFileSync(latestLog, 'utf-8');
  const lines = existingContent.split('\n').filter(Boolean);

  console.log(`📜 Showing ${lines.length} existing log entries:\n`);

  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      displayLogEntry(entry);
    } catch (e) {
      // Skip invalid JSON lines
    }
  });

  console.log('\n🔄 Watching for new entries...\n');
} catch (error) {
  console.log('No existing content, waiting for new logs...\n');
}

// Tail the log file for new entries
const tail = spawn('tail', ['-f', latestLog]);

tail.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(Boolean);

  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      displayLogEntry(entry);
    } catch (e) {
      // Skip invalid JSON lines
    }
  });
});

tail.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

tail.on('close', (code) => {
  console.log(`\nLog viewer stopped (code ${code})`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  tail.kill();
  process.exit(0);
});

/**
 * Display a log entry with formatting
 */
function displayLogEntry(entry) {
  const colors = {
    REQUEST: '\x1b[36m',  // Cyan
    RESPONSE: '\x1b[32m', // Green
    ERROR: '\x1b[31m',    // Red
    INFO: '\x1b[33m'      // Yellow
  };

  const icons = {
    REQUEST: '📤',
    RESPONSE: '📥',
    ERROR: '❌',
    INFO: 'ℹ️'
  };

  const color = colors[entry.type] || '\x1b[0m';
  const icon = icons[entry.type] || '•';
  const reset = '\x1b[0m';

  // Timestamp
  const time = new Date(entry.timestamp).toLocaleTimeString();

  // Header
  console.log(`${color}${icon} [${entry.type}]${reset} ${entry.step} ${color}(${time})${reset}`);

  // Data
  if (entry.data) {
    const dataStr = JSON.stringify(entry.data, null, 2)
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');
    console.log(dataStr);
  }

  console.log('─'.repeat(60));
}
