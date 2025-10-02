/**

export const dynamic = 'force-dynamic';

 * EasyParcel Credit Balance API
 * Provides account balance with smart caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';
import { UserRole } from '@prisma/client';
import { handleApiError } from '@/lib/error-handler';

// Cache configuration
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY = 'easyparcel_balance';

// In-memory cache (in production, use Redis)
let balanceCache: {
  data: any;
  timestamp: number;
} | null = null;

interface BalanceInfo {
  current: number;
  currency: string;
  lastUpdated: string;
  status: 'sufficient' | 'low' | 'critical';
  threshold: {
    low: number;
    critical: number;
  };
  cacheInfo: {
    cached: boolean;
    age: number; // seconds since last refresh
  };
}

function determineBalanceStatus(
  balance: number
): 'sufficient' | 'low' | 'critical' {
  const lowThreshold = parseFloat(process.env.BALANCE_LOW_THRESHOLD || '100');
  const criticalThreshold = parseFloat(
    process.env.BALANCE_CRITICAL_THRESHOLD || '20'
  );

  if (balance <= criticalThreshold) {
    return 'critical';
  }
  if (balance <= lowThreshold) {
    return 'low';
  }
  return 'sufficient';
}

function isCacheValid(): boolean {
  if (!balanceCache) {
    return false;
  }
  const age = Date.now() - balanceCache.timestamp;
  return age < CACHE_DURATION_MS;
}

async function getBalanceFromAPI(): Promise<any> {
  try {
    console.log('💳 Fetching EasyParcel balance from API...');

    // CRITICAL FIX: First get actual credentials for validation
    const credentials = await easyParcelCredentialsService.getCredentialsForService();

    if (!credentials) {
      console.log('🚫 No credentials configured - clearing balance cache');
      balanceCache = null; // Clear cache
      return {
        balance: 0,
        currency: 'MYR',
        wallets: [],
        noCredentials: true,
      };
    }

    // CRITICAL FIX: Validate credentials by making actual API test
    const validation = await easyParcelCredentialsService.validateCredentials(
      credentials.apiKey,
      credentials.endpoint
    );

    if (!validation.isValid) {
      console.log('🚫 Invalid credentials detected - clearing balance cache');
      balanceCache = null; // Clear cache
      return {
        balance: 0,
        currency: 'MYR',
        wallets: [],
        invalidCredentials: true,
        error: validation.error || 'Invalid API credentials',
      };
    }

    // CRITICAL FIX: Refresh EasyParcel service credentials to ensure it uses latest credentials
    console.log('🔄 Refreshing EasyParcel service credentials before balance check');
    await easyParcelService.refreshCredentials();

    const result = await easyParcelService.checkCreditBalance();

    // Cache the result only if credentials are valid
    balanceCache = {
      data: result,
      timestamp: Date.now(),
    };

    console.log(`✅ Balance retrieved: RM ${result.balance}`);
    return result;
  } catch (error) {
    console.error('❌ Error fetching balance from API:', error);

    // CRITICAL FIX: Clear cache on any error to prevent stale data
    balanceCache = null;

    // Check if error is due to missing or invalid credentials
    if (error instanceof Error) {
      if (error.message.includes('credentials not configured')) {
        console.log('🚫 No credentials configured');
        return {
          balance: 0,
          currency: 'MYR',
          wallets: [],
          noCredentials: true,
        };
      }

      if (error.message.includes('Credit balance check failed') ||
          error.message.includes('authentication failed') ||
          error.message.includes('Invalid API')) {
        console.log('🚫 Invalid credentials or API failure');
        return {
          balance: 0,
          currency: 'MYR',
          wallets: [],
          invalidCredentials: true,
          error: error.message,
        };
      }
    }

    throw error;
  }
}

/**
 * GET - Retrieve current account balance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    let balanceData;
    let fromCache = false;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      balanceData = balanceCache!.data;
      fromCache = true;
      console.log('📦 Using cached balance data');
    } else {
      balanceData = await getBalanceFromAPI();
      fromCache = false;
    }

    // Calculate cache age
    const cacheAge = balanceCache
      ? Math.floor((Date.now() - balanceCache.timestamp) / 1000)
      : 0;

    // CRITICAL FIX: Handle "no credentials" or "invalid credentials" state
    if (balanceData.noCredentials) {
      return NextResponse.json({
        success: false,
        error: 'No EasyParcel API credentials configured',
        message: 'Please configure API credentials in System Settings to check balance',
        balance: null,
        wallets: [],
        requiresConfiguration: true,
      });
    }

    if (balanceData.invalidCredentials) {
      return NextResponse.json({
        success: false,
        error: 'Invalid EasyParcel API credentials',
        message: balanceData.error || 'The provided API credentials are invalid. Please check your API key and endpoint URL.',
        balance: null,
        wallets: [],
        requiresConfiguration: true,
      });
    }

    // Build response
    const balanceInfo: BalanceInfo = {
      current: balanceData.balance,
      currency: balanceData.currency || 'MYR',
      lastUpdated: new Date(
        balanceCache?.timestamp || Date.now()
      ).toISOString(),
      status: determineBalanceStatus(balanceData.balance),
      threshold: {
        low: parseFloat(process.env.BALANCE_LOW_THRESHOLD || '100'),
        critical: parseFloat(process.env.BALANCE_CRITICAL_THRESHOLD || '20'),
      },
      cacheInfo: {
        cached: fromCache,
        age: cacheAge,
      },
    };

    return NextResponse.json({
      success: true,
      balance: balanceInfo,
      wallets: balanceData.wallets || [],
    });
  } catch (error) {
    console.error('Balance API error:', error);
    return handleApiError(error);
  }
}

/**
 * POST - Force balance refresh and update cache
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, estimatedDeduction } = body;

    switch (action) {
      case 'refresh':
        // Force refresh balance from API
        const balanceData = await getBalanceFromAPI();

        const balanceInfo: BalanceInfo = {
          current: balanceData.balance,
          currency: balanceData.currency || 'MYR',
          lastUpdated: new Date().toISOString(),
          status: determineBalanceStatus(balanceData.balance),
          threshold: {
            low: parseFloat(process.env.BALANCE_LOW_THRESHOLD || '100'),
            critical: parseFloat(
              process.env.BALANCE_CRITICAL_THRESHOLD || '20'
            ),
          },
          cacheInfo: {
            cached: false,
            age: 0,
          },
        };

        return NextResponse.json({
          success: true,
          balance: balanceInfo,
          message: 'Balance refreshed successfully',
        });

      case 'deduct_estimate':
        // Update cache with estimated balance after shipping action
        if (balanceCache && typeof estimatedDeduction === 'number') {
          const newBalance = Math.max(
            0,
            balanceCache.data.balance - estimatedDeduction
          );
          balanceCache.data.balance = newBalance;

          console.log(
            `💸 Estimated deduction: RM ${estimatedDeduction}, new balance: RM ${newBalance}`
          );

          const updatedInfo: BalanceInfo = {
            current: newBalance,
            currency: 'MYR',
            lastUpdated: new Date().toISOString(),
            status: determineBalanceStatus(newBalance),
            threshold: {
              low: parseFloat(process.env.BALANCE_LOW_THRESHOLD || '100'),
              critical: parseFloat(
                process.env.BALANCE_CRITICAL_THRESHOLD || '20'
              ),
            },
            cacheInfo: {
              cached: true,
              age: Math.floor((Date.now() - balanceCache.timestamp) / 1000),
            },
          };

          return NextResponse.json({
            success: true,
            balance: updatedInfo,
            message: 'Balance updated with estimated deduction',
          });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Balance action error:', error);
    return handleApiError(error);
  }
}
