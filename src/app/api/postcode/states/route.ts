/**
 * Malaysian States API Endpoint
 * Provides client-side access to database-driven state list
 */

import { NextResponse } from 'next/server';
import { ServerPostcodeService } from '@/lib/shipping/server-postcode-service';

export async function GET() {
  try {
    const postcodeService = ServerPostcodeService.getInstance();
    const states = await postcodeService.getAllStates();

    return NextResponse.json(states);
  } catch (error) {
    console.error('States API error:', error);
    
    // Fallback to basic states if database fails
    const fallbackStates = [
      { code: 'KUL', name: 'Wilayah Persekutuan Kuala Lumpur', zone: 'west' as const, legacyCode: 'KUL' as const },
      { code: 'SGR', name: 'Selangor', zone: 'west' as const, legacyCode: 'SEL' as const },
      { code: 'JHR', name: 'Johor', zone: 'west' as const, legacyCode: 'JOH' as const },
      { code: 'PNG', name: 'Pulau Pinang', zone: 'west' as const, legacyCode: 'PNG' as const },
      { code: 'PRK', name: 'Perak', zone: 'west' as const, legacyCode: 'PRK' as const }
    ];
    
    return NextResponse.json(fallbackStates);
  }
}