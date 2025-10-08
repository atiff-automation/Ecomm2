import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { businessProfileSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';
import { BusinessProfileCache } from '@/lib/cache/business-profile';

