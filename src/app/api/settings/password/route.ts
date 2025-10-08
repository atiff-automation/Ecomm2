import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { passwordChangeSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';
import bcrypt from 'bcryptjs';

