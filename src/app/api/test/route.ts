import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Server is running without middleware issues',
    timestamp: new Date().toISOString(),
  });
}
