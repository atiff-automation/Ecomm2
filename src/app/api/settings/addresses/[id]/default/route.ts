import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/security';
import { z } from 'zod';

const setDefaultSchema = z.object({
  type: z.enum(['billing', 'shipping'])
});

