import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notificationPreferencesSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { CSRFProtection } from '@/lib/security/csrf-protection';
import { InputSanitizer } from '@/lib/security/input-sanitizer';
import { NotificationLogger, NotificationEvents } from '@/lib/monitoring/notification-logger';

