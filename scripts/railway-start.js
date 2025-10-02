#!/usr/bin/env node

/**
 * Railway Startup Script - Optimized
 * With environment validation and proper error handling
 * NO DATABASE_URL fallbacks - fail fast if misconfigured
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Railway Startup Script Starting');
console.log('==================================\n');

/**
 * Wait for DATABASE_URL to be available (Railway timing issue)
 */
async function waitForDatabaseURL(maxAttempts = 10, delayMs = 1000) {
  console.log('⏳ Waiting for DATABASE_URL to be available...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL is available\n');

      // Validate it's not localhost in production
      if (process.env.NODE_ENV === 'production' &&
          process.env.DATABASE_URL.includes('localhost')) {
        console.error('❌ DATABASE_URL points to localhost in production!');
        console.error(`   Current value: ${process.env.DATABASE_URL.substring(0, 50)}...`);
        console.error('🚫 Application startup ABORTED\n');
        process.exit(1);
      }

      return true;
    }

    console.log(`⏳ Attempt ${attempt}/${maxAttempts}: DATABASE_URL not yet available, waiting ${delayMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  console.error('❌ DATABASE_URL not available after maximum attempts');
  console.error('💡 Check Railway environment variables configuration');
  console.error('🚫 Application startup ABORTED\n');
  process.exit(1);
}

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
    // Step 1: Wait for DATABASE_URL (CRITICAL)
    await waitForDatabaseURL();

    // Step 2: Basic environment validation (critical vars only)
    console.log('🔍 Validating critical environment variables...');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(varName => console.error(`   ✗ ${varName}`));
      console.error('🚫 Application startup ABORTED\n');
      process.exit(1);
    }

    console.log('✅ Critical environment variables validated');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`);
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✓ Set (' + process.env.NEXTAUTH_SECRET.length + ' chars)' : '✗ Missing'}`);
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '✗ Missing'}`);
    console.log(`   UPSTASH_REDIS: ${process.env.UPSTASH_REDIS_REST_URL ? '✓ Configured' : '➖ Using in-memory rate limiting'}`);
    console.log();

    // Step 3: Run database migration
    console.log('📦 Step 3: Database migration');
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], 'Database migration');
    console.log();

    // Step 4: Copy static assets (fix for Railway standalone build)
    console.log('📁 Step 4: Setting up static assets for standalone build');

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

    // Step 5: Start the server
    console.log('🚀 Step 5: Starting Next.js standalone server');
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

    // Step 6: Run seeding in background after server starts
    console.log('🌱 Step 6: Starting database seeding in background');
    setTimeout(() => {
      console.log('⏰ Starting delayed background seeding...');

      // Run essential seeding (admin users) only
      runBackgroundCommand('npm', ['run', 'db:seed:essential'], 'Essential data seeding');
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