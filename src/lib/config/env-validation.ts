/**
 * Environment Variable Validation
 * FAIL FAST - Don't start application with missing critical configuration
 * SINGLE SOURCE OF TRUTH for environment validation
 */

interface RequiredEnvVars {
  // Database
  DATABASE_URL: string;

  // Authentication
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
}

interface OptionalEnvVars {
  // Email
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;

  // Payment
  TOYYIBPAY_SECRET_KEY?: string;
  TOYYIBPAY_CATEGORY_CODE?: string;
  TOYYIBPAY_SANDBOX?: string;

  // Telegram
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ORDERS_CHAT_ID?: string;
  TELEGRAM_INVENTORY_CHAT_ID?: string;
  TELEGRAM_CONFIG_ENCRYPTION_KEY?: string;
}

export class EnvValidator {
  private static requiredVars: (keyof RequiredEnvVars)[] = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  /**
   * Validate all required environment variables
   * Exits with code 1 if validation fails
   */
  static validate(): void {
    const missing: string[] = [];

    console.log('🔍 Validating environment configuration...\n');

    // Check required variables
    for (const varName of this.requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    // Fail fast if critical variables missing
    if (missing.length > 0) {
      console.error('❌ CRITICAL: Missing required environment variables:\n');
      missing.forEach(varName => {
        console.error(`   ✗ ${varName}`);
      });
      console.error('\n📚 See .env.example for required configuration');
      console.error('📝 Required variables documentation:');
      console.error(
        '   DATABASE_URL: PostgreSQL connection string from Railway'
      );
      console.error(
        '   NEXTAUTH_SECRET: Minimum 32-character secret for session encryption'
      );
      console.error('   NEXTAUTH_URL: Your application URL (Railway domain)');
      console.error('\n🚫 Application startup ABORTED\n');

      process.exit(1);
    }

    // Validate format of critical variables
    this.validateDatabaseURL();
    this.validateNextAuthConfig();

    console.log('✅ Environment variable validation passed\n');
  }

  /**
   * Validate DATABASE_URL format and environment
   */
  private static validateDatabaseURL(): void {
    const dbUrl = process.env.DATABASE_URL!;

    // Check for localhost in production
    if (dbUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.error(
        '❌ DATABASE_URL ERROR: Points to localhost in production!'
      );
      console.error(`   Current value: ${dbUrl.substring(0, 50)}...`);
      console.error('   Expected: PostgreSQL connection from Railway');
      process.exit(1);
    }

    // Validate PostgreSQL protocol
    if (
      !dbUrl.startsWith('postgresql://') &&
      !dbUrl.startsWith('postgres://')
    ) {
      console.error(
        '❌ DATABASE_URL ERROR: Must be a PostgreSQL connection string'
      );
      console.error(
        `   Current value starts with: ${dbUrl.substring(0, 20)}...`
      );
      console.error('   Expected format: postgresql://user:pass@host:port/db');
      process.exit(1);
    }

    // Warn about connection pooling parameters
    if (
      process.env.NODE_ENV === 'production' &&
      !dbUrl.includes('connection_limit')
    ) {
      console.warn('⚠️  DATABASE_URL: No connection_limit parameter found');
      console.warn(
        '   Consider adding connection pooling parameters for better performance'
      );
    }
  }

  /**
   * Validate NextAuth configuration
   */
  private static validateNextAuthConfig(): void {
    const authUrl = process.env.NEXTAUTH_URL!;
    const authSecret = process.env.NEXTAUTH_SECRET!;

    // Validate secret length
    if (authSecret.length < 32) {
      console.error('❌ NEXTAUTH_SECRET ERROR: Must be at least 32 characters');
      console.error(`   Current length: ${authSecret.length} characters`);
      console.error('   Generate with: openssl rand -base64 32');
      process.exit(1);
    }

    // Warn about localhost in production
    if (
      authUrl.includes('localhost') &&
      process.env.NODE_ENV === 'production'
    ) {
      console.warn('⚠️  NEXTAUTH_URL: Points to localhost in production');
      console.warn(`   Current value: ${authUrl}`);
      console.warn('   Update to your Railway domain');
    }

    // Validate URL format
    try {
      new URL(authUrl);
    } catch {
      console.error('❌ NEXTAUTH_URL ERROR: Invalid URL format');
      console.error(`   Current value: ${authUrl}`);
      console.error('   Expected format: https://your-app.railway.app');
      process.exit(1);
    }
  }

  /**
   * Print current configuration status
   */
  static printConfig(): void {
    console.log('📊 Environment Configuration Summary:');
    console.log('────────────────────────────────────────');
    console.log(
      `   Node Environment: ${process.env.NODE_ENV || 'development'}`
    );
    console.log(
      `   Database: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`
    );
    console.log(`   NextAuth URL: ${process.env.NEXTAUTH_URL || '❌ Missing'}`);
    console.log(
      `   NextAuth Secret: ${process.env.NEXTAUTH_SECRET ? '✅ Configured' : '❌ Missing'}`
    );

    // Optional services
    console.log('\n   Optional Services:');
    console.log(`   Rate Limiting: ➖ In-memory only`);
    console.log(
      `   Email (Resend): ${process.env.RESEND_API_KEY ? '✅ Configured' : '➖ Not configured'}`
    );
    console.log(
      `   Payment (ToyyibPay): ${process.env.TOYYIBPAY_SECRET_KEY ? '✅ Configured' : '➖ Not configured'}`
    );
    console.log(
      `   Telegram Notifications: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '➖ Not configured'}`
    );
    console.log('────────────────────────────────────────\n');
  }

  /**
   * Validate specific variable exists (runtime check)
   */
  static validateVar(varName: string, friendlyName?: string): string {
    const value = process.env[varName];

    if (!value) {
      throw new Error(
        `Environment variable ${varName}${friendlyName ? ` (${friendlyName})` : ''} is required but not set`
      );
    }

    return value;
  }

  /**
   * Get optional variable with default
   */
  static getOptionalVar(varName: string, defaultValue: string = ''): string {
    return process.env[varName] || defaultValue;
  }
}

// Export for use in other modules
export default EnvValidator;
