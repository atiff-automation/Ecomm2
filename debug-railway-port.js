#!/usr/bin/env node

/**
 * Railway PORT Debug Script
 * Check environment variables and port configuration
 */

console.log('🔍 Railway Environment Debug');
console.log('==========================');
console.log();

console.log('📊 Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`PORT: ${process.env.PORT || 'undefined'}`);
console.log(`HOST: ${process.env.HOST || 'undefined'}`);
console.log(`HOSTNAME: ${process.env.HOSTNAME || 'undefined'}`);
console.log();

console.log('🌐 Network Configuration:');
console.log(`Process Platform: ${process.platform}`);
console.log(`Process Architecture: ${process.arch}`);
console.log(`Node Version: ${process.version}`);
console.log();

console.log('🚀 Railway Detection:');
console.log(`RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'undefined'}`);
console.log(`RAILWAY_PROJECT_ID: ${process.env.RAILWAY_PROJECT_ID || 'undefined'}`);
console.log(`RAILWAY_SERVICE_ID: ${process.env.RAILWAY_SERVICE_ID || 'undefined'}`);
console.log();

console.log('🔧 Next.js Configuration Check:');
const fs = require('fs');
const path = require('path');

// Check if standalone server exists
const standaloneServerPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
const standaloneExists = fs.existsSync(standaloneServerPath);
console.log(`Standalone server exists: ${standaloneExists}`);
console.log(`Standalone path: ${standaloneServerPath}`);

if (standaloneExists) {
  try {
    const stats = fs.statSync(standaloneServerPath);
    console.log(`Standalone server size: ${stats.size} bytes`);
    console.log(`Standalone modified: ${stats.mtime}`);
  } catch (error) {
    console.log(`Error reading standalone server: ${error.message}`);
  }
}

console.log();
console.log('🐛 Recommended Fix:');
console.log('The issue is that Next.js standalone is not using Railway\'s PORT.');
console.log('Railway expects the app to listen on the PORT environment variable.');
console.log();
console.log('Solution: Modify package.json start script to:');
console.log('"start": "npm run db:deploy:production && PORT=${PORT:-8080} node .next/standalone/server.js"');
console.log();
console.log('Or create a wrapper script that sets PORT before starting Next.js.');