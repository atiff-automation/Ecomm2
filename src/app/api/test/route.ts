import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Environment guard - block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Development test endpoint',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
