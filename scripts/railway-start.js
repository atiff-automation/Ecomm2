#!/usr/bin/env node

/**
 * Railway Startup Script
 * Enhanced error handling and logging for Railway deployment
 * Fixed: Start server FIRST, then do seeding in background to prevent health check failures
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

async function runBackgroundCommand(command, args, description) {
  console.log(`🔧 ${description} (background)`);

  const child = spawn(command, args, {
    stdio: 'pipe', // Capture output for logging
    env: process.env,
    cwd: process.cwd(),
    detached: false // Keep as child process but don't block
  });

  child.stdout.on('data', (data) => {
    console.log(`[SEEDING] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[SEEDING ERROR] ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ ${description} completed successfully`);
    } else {
      console.error(`❌ ${description} failed with code ${code}`);
    }
  });

  child.on('error', (error) => {
    console.error(`❌ ${description} error:`, error);
  });

  return child;
}

async function startApplication() {
  try {
    // Step 1: Only run database migration (fast operation)
    console.log('📦 Step 1: Database migration (fast)');
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], 'Database migration');
    console.log();

    // Step 2: Start the server FIRST (for health checks)
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

    // Step 3: Run seeding in background after server starts
    console.log('🌱 Step 3: Starting database seeding in background');
    setTimeout(() => {
      console.log('⏰ Starting delayed background seeding...');
      
      // Run essential seeding (admin users) first
      runBackgroundCommand('npm', ['run', 'db:seed:essential'], 'Essential data seeding')
        .then(() => {
          // Then run postcode seeding (can take time)
          console.log('📮 Starting postcode seeding in background...');
          runBackgroundCommand('npm', ['run', 'db:seed:postcodes:production'], 'Postcode seeding');
        });
    }, 5000); // Wait 5 seconds for server to fully start

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