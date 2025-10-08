import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { systemHealthMonitor } from '@/lib/monitoring/system-health';
import { handleApiError } from '@/lib/error-handler';

