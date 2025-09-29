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

// Enhanced DATABASE_URL diagnostics
if (!process.env.DATABASE_URL) {
  console.log('🚨 DATABASE_URL DIAGNOSTICS:');
  console.log('- DATABASE_URL is not set in environment');
  console.log('- This might be a Railway variable resolution issue');
  console.log('- All environment variables:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')));

  // Check if we can find any postgres-related variables
  const postgresVars = Object.keys(process.env).filter(k =>
    k.toLowerCase().includes('postgres') ||
    k.toLowerCase().includes('database') ||
    k.toLowerCase().includes('pg')
  );

  if (postgresVars.length > 0) {
    console.log('- Found postgres-related vars:', postgresVars);
  }
} else {
  console.log('✅ DATABASE_URL is properly configured');
}
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
    // Step 1: Only run database migration (fast operation) - but check DATABASE_URL first
    console.log('📦 Step 1: Database migration (fast)');

    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Skipping database migration - DATABASE_URL not available');
      console.log('💡 This might be a Railway variable resolution timing issue');
      console.log('🔄 The app will start anyway and may retry later');
    } else {
      await runCommand('npx', ['prisma', 'migrate', 'deploy'], 'Database migration');
    }
    console.log();

    // Step 2: Copy static assets (fix for Railway standalone build)
    console.log('📁 Step 2: Setting up static assets for standalone build');

    const publicPath = path.join(process.cwd(), 'public');
    const staticPath = path.join(process.cwd(), '.next', 'static');
    const standalonePublicPath = path.join(process.cwd(), '.next', 'standalone', 'public');
    const standaloneStaticPath = path.join(process.cwd(), '.next', 'standalone', '.next', 'static');

    try {
      // Copy public assets to standalone directory
      if (require('fs').existsSync(publicPath)) {
        await runCommand('cp', ['-r', publicPath, path.join(process.cwd(), '.next', 'standalone')], 'Copy public assets');
      }

      // Copy static assets to standalone directory
      if (require('fs').existsSync(staticPath)) {
        await runCommand('mkdir', ['-p', path.dirname(standaloneStaticPath)], 'Create static directory');
        await runCommand('cp', ['-r', staticPath, path.dirname(standaloneStaticPath)], 'Copy static assets');
      }

      console.log('✅ Static assets copied successfully');
    } catch (error) {
      console.warn('⚠️ Static asset copy failed, continuing anyway:', error.message);
    }
    console.log();

    // Step 3: Start the server FIRST (for health checks)
    console.log('🚀 Step 3: Starting Next.js standalone server');
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

    // Step 4: Run seeding in background after server starts (only if DATABASE_URL is available)
    if (process.env.DATABASE_URL) {
      console.log('🌱 Step 4: Starting database seeding in background');
      setTimeout(() => {
        console.log('⏰ Starting delayed background seeding...');

        // Run essential seeding (admin users) only
        runBackgroundCommand('npm', ['run', 'db:seed:essential'], 'Essential data seeding');
      }, 5000); // Wait 5 seconds for server to fully start
    } else {
      console.log('⏭️ Step 4: Skipping database seeding - DATABASE_URL not available');
    }

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