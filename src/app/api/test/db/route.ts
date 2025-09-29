import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test basic database connectivity
    console.log('Testing database connection...');
    console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);

    // Simple query to test connection
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: 'success',
      database: 'connected',
      userCount,
      databaseUrl: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);

    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}