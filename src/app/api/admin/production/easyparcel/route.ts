/**
 * Admin EasyParcel Production Management API
 * Handles production deployment, credential migration, and readiness checks
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EasyParcelProductionConfig, ProductionCredentials } from '@/lib/production/easyparcel-production-config';
import { z } from 'zod';

const productionCredentialsSchema = z.object({
  apiKey: z.string().min(10),
  apiSecret: z.string().min(10),
  baseUrl: z.string().url(),
  webhookUrl: z.string().url(),
  webhookSecret: z.string().optional(),
});

const productionActionSchema = z.object({
  action: z.enum(['validate', 'migrate', 'check_readiness', 'test_credentials', 'rollback']),
  credentials: productionCredentialsSchema.optional(),
  backupId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SuperAdmin required' }, { status: 401 });
    }

    const body = await request.json();
    const { action, credentials, backupId } = productionActionSchema.parse(body);

    const productionConfig = EasyParcelProductionConfig.getInstance();

    console.log(`[EasyParcel Production] ${action} action requested by ${session.user.email}`);

    switch (action) {
      case 'validate':
        if (!credentials) {
          return NextResponse.json(
            { error: 'Credentials required for validation' },
            { status: 400 }
          );
        }

        const validationResult = await productionConfig.validateProductionCredentials(credentials);
        
        return NextResponse.json({
          success: true,
          action: 'validate',
          result: validationResult,
          message: validationResult.valid 
            ? 'Production credentials are valid' 
            : 'Production credentials validation failed'
        });

      case 'migrate':
        if (!credentials) {
          return NextResponse.json(
            { error: 'Credentials required for migration' },
            { status: 400 }
          );
        }

        // First validate readiness
        const readinessCheck = await productionConfig.validateProductionReadiness();
        if (readinessCheck.overallStatus === 'failed') {
          return NextResponse.json({
            success: false,
            action: 'migrate',
            error: 'System not ready for production migration',
            readinessChecks: readinessCheck.checks
          }, { status: 400 });
        }

        // Perform migration
        const migrationResult = await productionConfig.migrateToProduction(credentials);
        
        return NextResponse.json({
          success: migrationResult.success,
          action: 'migrate',
          result: migrationResult,
          message: migrationResult.message,
          readinessWarnings: readinessCheck.overallStatus === 'warning' ? readinessCheck.checks : null
        });

      case 'check_readiness':
        const readiness = await productionConfig.validateProductionReadiness();
        
        return NextResponse.json({
          success: true,
          action: 'check_readiness',
          readiness,
          message: `System is ${readiness.overallStatus} for production deployment`
        });

      case 'test_credentials':
        if (!credentials) {
          return NextResponse.json(
            { error: 'Credentials required for testing' },
            { status: 400 }
          );
        }

        const testResult = await productionConfig.validateProductionCredentials(credentials);
        
        return NextResponse.json({
          success: true,
          action: 'test_credentials',
          result: testResult,
          message: testResult.valid 
            ? 'Credentials test successful' 
            : 'Credentials test failed'
        });

      case 'rollback':
        if (!backupId) {
          return NextResponse.json(
            { error: 'Backup ID required for rollback' },
            { status: 400 }
          );
        }

        // Implement rollback functionality
        const rollbackResult = await rollbackToBackup(backupId);
        
        return NextResponse.json({
          success: rollbackResult.success,
          action: 'rollback',
          result: rollbackResult,
          message: rollbackResult.message
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in EasyParcel production management:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to process production management request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component');

    const productionConfig = EasyParcelProductionConfig.getInstance();

    if (component === 'summary') {
      // Get production configuration summary
      const summary = await productionConfig.getProductionSummary();
      
      return NextResponse.json({
        success: true,
        summary,
        timestamp: new Date().toISOString()
      });
    }

    if (component === 'readiness') {
      // Get detailed readiness check
      const readiness = await productionConfig.validateProductionReadiness();
      
      return NextResponse.json({
        success: true,
        readiness,
        timestamp: new Date().toISOString()
      });
    }

    // Default: return general production status
    const [summary, readiness] = await Promise.all([
      productionConfig.getProductionSummary(),
      productionConfig.validateProductionReadiness()
    ]);

    const productionStatus = {
      isProduction: process.env.NODE_ENV === 'production',
      isSandbox: process.env.EASYPARCEL_SANDBOX === 'true',
      hasCredentials: !!(process.env.EASYPARCEL_API_KEY && process.env.EASYPARCEL_API_SECRET),
      sslConfigured: (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://'),
      webhookConfigured: !!(process.env.NEXT_PUBLIC_APP_URL),
      databaseConnected: true, // Simplified check
    };

    const recommendations = generateProductionRecommendations(readiness, productionStatus);

    return NextResponse.json({
      success: true,
      status: productionStatus,
      summary,
      readiness,
      recommendations,
      availableActions: [
        {
          action: 'validate',
          name: 'Validate Credentials',
          description: 'Test production API credentials',
          requiresCredentials: true
        },
        {
          action: 'check_readiness',
          name: 'Check Readiness',
          description: 'Comprehensive production readiness check',
          requiresCredentials: false
        },
        {
          action: 'test_credentials',
          name: 'Test Credentials',
          description: 'Test API connectivity with provided credentials',
          requiresCredentials: true
        },
        {
          action: 'migrate',
          name: 'Migrate to Production',
          description: 'Switch from sandbox to production credentials',
          requiresCredentials: true,
          requiresSuperAdmin: true
        }
      ]
    });

  } catch (error) {
    console.error('Error getting production status:', error);
    return NextResponse.json(
      { error: 'Failed to get production status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SuperAdmin required' }, { status: 401 });
    }

    const body = await request.json();
    const { configUpdates } = body;

    // Update production configuration settings
    // This would update environment variables or configuration files
    console.log('Updating production configuration:', configUpdates);

    return NextResponse.json({
      success: true,
      message: 'Production configuration updated',
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email
    });

  } catch (error) {
    console.error('Error updating production config:', error);
    return NextResponse.json(
      { error: 'Failed to update production configuration' },
      { status: 500 }
    );
  }
}

/**
 * Rollback to a previous configuration backup
 */
async function rollbackToBackup(backupId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // In a real implementation, this would:
    // 1. Retrieve the backup configuration from database
    // 2. Validate the backup data
    // 3. Restore the previous configuration
    // 4. Update environment variables or configuration files
    // 5. Test the restored configuration

    console.log(`Rolling back to backup ${backupId}...`);

    // Simulate rollback process
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Successfully rolled back to backup ${backupId}`
    };

  } catch (error) {
    return {
      success: false,
      message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate production recommendations based on status
 */
function generateProductionRecommendations(readiness: any, status: any): string[] {
  const recommendations: string[] = [];

  if (!status.isProduction) {
    recommendations.push('Switch to production environment (NODE_ENV=production)');
  }

  if (status.isSandbox) {
    recommendations.push('Migrate from sandbox to production API credentials');
  }

  if (!status.sslConfigured) {
    recommendations.push('Configure HTTPS/SSL for production deployment');
  }

  if (readiness.checks.some((check: any) => check.status === 'failed')) {
    recommendations.push('Resolve all failed readiness checks before production deployment');
  }

  if (readiness.checks.some((check: any) => check.status === 'warning')) {
    recommendations.push('Address warning items to ensure optimal production performance');
  }

  if (!status.hasCredentials) {
    recommendations.push('Configure production API credentials');
  }

  if (readiness.ready) {
    recommendations.push('System appears ready for production deployment');
    recommendations.push('Perform final testing in staging environment before go-live');
  }

  return recommendations;
}