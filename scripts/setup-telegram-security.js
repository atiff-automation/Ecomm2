#!/usr/bin/env node
/**
 * Telegram Security Setup Script
 * Generates encryption keys and provides setup instructions
 * Run with: node scripts/setup-telegram-security.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Telegram Configuration Security Setup\n');

// Generate encryption key
function generateEncryptionKey() {
  const key = crypto.randomBytes(32);
  return key.toString('base64');
}

// Validate existing .env file
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  let envFile = null;
  if (fs.existsSync(envLocalPath)) {
    envFile = envLocalPath;
  } else if (fs.existsSync(envPath)) {
    envFile = envPath;
  }
  
  return envFile;
}

// Check if encryption key already exists
function hasEncryptionKey(envFile) {
  if (!envFile) return false;
  
  const content = fs.readFileSync(envFile, 'utf8');
  return content.includes('TELEGRAM_CONFIG_ENCRYPTION_KEY');
}

// Add encryption key to .env file
function addEncryptionKey(envFile, key) {
  let content = '';
  
  if (envFile && fs.existsSync(envFile)) {
    content = fs.readFileSync(envFile, 'utf8');
    if (!content.endsWith('\n')) {
      content += '\n';
    }
  }
  
  content += `\n# Telegram Configuration Security\nTELEGRAM_CONFIG_ENCRYPTION_KEY="${key}"\n`;
  
  const targetFile = envFile || path.join(process.cwd(), '.env.local');
  fs.writeFileSync(targetFile, content);
  
  return targetFile;
}

try {
  console.log('Step 1: Checking existing configuration...');
  
  const envFile = checkEnvFile();
  const hasKey = hasEncryptionKey(envFile);
  
  if (hasKey) {
    console.log('✅ Encryption key already configured in:', envFile);
    console.log('\n📝 Security checklist:');
    console.log('[ ] Verify .env* files are in .gitignore');
    console.log('[ ] Use different keys for dev/staging/production');
    console.log('[ ] Store production keys in secure environment services');
    console.log('[ ] Never commit encryption keys to version control');
    console.log('\n🎉 Security setup complete!');
    return;
  }
  
  console.log('Step 2: Generating new encryption key...');
  const newKey = generateEncryptionKey();
  console.log('✅ Generated 256-bit encryption key');
  
  console.log('Step 3: Adding to environment configuration...');
  const targetFile = addEncryptionKey(envFile, newKey);
  console.log('✅ Added encryption key to:', targetFile);
  
  console.log('\n🔑 Generated Configuration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`TELEGRAM_CONFIG_ENCRYPTION_KEY="${newKey}"`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n📝 Security checklist:');
  console.log('✅ Encryption key generated and configured');
  console.log('[ ] Verify .env* files are in .gitignore');
  console.log('[ ] Create separate keys for staging/production');
  console.log('[ ] Store production keys in secure environment services');
  console.log('[ ] Test configuration with admin panel');
  
  console.log('\n🚨 IMPORTANT SECURITY NOTES:');
  console.log('• This key encrypts all Telegram bot tokens and sensitive data');
  console.log('• If lost, all encrypted configuration will be unrecoverable');
  console.log('• Use different keys for different environments');
  console.log('• Never commit this key to version control');
  console.log('• Store production keys in secure services (AWS Secrets Manager, etc.)');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Go to /admin/notifications in your browser');
  console.log('3. Configure your Telegram bot token and channels');
  console.log('4. Test the configuration using the admin panel');
  
  console.log('\n🎉 Security setup complete!');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('\n🔧 Manual setup instructions:');
  console.log('1. Generate encryption key: node -p "require(\'crypto\').randomBytes(32).toString(\'base64\')"');
  console.log('2. Add to .env.local: TELEGRAM_CONFIG_ENCRYPTION_KEY="your-generated-key"');
  console.log('3. Restart your development server');
  process.exit(1);
}