#!/usr/bin/env node

/**
 * Railway Startup Script
 * Enhanced error handling and logging for Railway deployment
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Railway Startup Script Starting');
console.log('==================================');
console.log();

console.log('📊 Environment Check:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`PORT: ${process.env.PORT || 'undefined'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '[CONFIGURED]' : 'undefined'}`);
console.log(`REDIS_URL: ${process.env.REDIS_URL ? '[CONFIGURED]' : 'undefined'}`);
console.log();

// Set required environment variables
process.env.PORT = process.env.PORT || '8080';
process.env.HOSTNAME = '0.0.0.0';

async function runCommand(command, args, description) {
  console.log(`🔧 ${description}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ ${description} error:`, error);
      reject(error);
    });
  });
}

async function startApplication() {
  try {
    // Step 1: Deploy database and seed
    console.log('📦 Step 1: Database deployment and seeding');
    await runCommand('npm', ['run', 'db:deploy:production'], 'Database deployment and seeding');
    console.log();

    // Step 2: Start the server
    console.log('🚀 Step 2: Starting Next.js standalone server');
    console.log(`Listening on PORT: ${process.env.PORT}`);
    console.log(`Binding to HOSTNAME: ${process.env.HOSTNAME}`);
    console.log();

    const serverPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
    console.log(`Server path: ${serverPath}`);

    // Start server with proper error handling
    const server = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd()
    });

    server.on('error', (error) => {
      console.error('❌ Server startup error:', error);
      process.exit(1);
    });

    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      process.exit(code);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📴 Received SIGTERM, shutting down gracefully');
      server.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('📴 Received SIGINT, shutting down gracefully');
      server.kill('SIGINT');
    });

  } catch (error) {
    console.error('💥 Application startup failed:', error);
    process.exit(1);
  }
}

startApplication();