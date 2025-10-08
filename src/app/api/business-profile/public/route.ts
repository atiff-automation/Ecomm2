import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { BusinessProfileCache } from '@/lib/cache/business-profile';

