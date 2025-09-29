#!/usr/bin/env node

/**
 * Railway-compatible Next.js standalone server starter
 * Ensures proper PORT environment variable handling
 */

const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

// Set PORT from Railway environment or default to 3000
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

console.log(`🚀 Starting Next.js server on ${HOST}:${PORT}`);

// Import Next.js standalone server
const nextServerPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');

try {
  // Set the PORT environment variable before requiring Next.js server
  process.env.PORT = PORT;

  console.log(`📂 Loading Next.js server from: ${nextServerPath}`);

  // Require the Next.js standalone server
  require(nextServerPath);

} catch (error) {
  console.error('❌ Failed to start Next.js server:', error);
  process.exit(1);
}