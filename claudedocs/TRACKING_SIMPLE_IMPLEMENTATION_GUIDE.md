# Track Order Feature - Simple Implementation Guide

**Project**: JRM E-commerce Platform
**Date**: 2025-01-18
**Approach**: KISS Principle (Keep It Simple, Stupid)
**Adherence**: `@CLAUDE.md` Coding Standards & Best Practices
**Status**: Implementation Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Requirements](#core-requirements)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Implementation Specifications](#implementation-specifications)
6. [File Structure](#file-structure)
7. [Component Specifications](#component-specifications)
8. [API Specification](#api-specification)
9. [Page Specification](#page-specification)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Vision
Single-page order tracking that works for everyone (guest or logged-in) with minimal complexity.

### Principles Applied
- ✅ **KISS**: Simple 5-stage timeline, no over-engineering
- ✅ **DRY**: Reusable components, single source of truth
- ✅ **SOLID**: Single responsibility for each component
- ✅ **No Hardcoding**: Constants in config files
- ✅ **Type Safety**: Explicit TypeScript types, no `any`
- ✅ **Database-First**: Prisma only, no raw SQL

### What Users Get
```
Input: Order number or tracking number
Output: 5-stage timeline + Courier name + EasyParcel link
```

### Complexity Reduction
```
Before: 33+ files, ~7,800 LOC, 3 database tables, 2 pages, background jobs
After:  5 files, ~500 LOC, 1 database table, 1 page, direct queries
```

---

## Core Requirements

### Functional Requirements

**FR-1: Single Input Field**
- Accepts order number: `ORD-20250821-A1B2`
- Accepts tracking number: `EP1234567890`
- Case-insensitive
- Works with or without dashes

**FR-2: 5-Stage Timeline Display**
```
Stage 1: PAID
Stage 2: READY_TO_SHIP
Stage 3: IN_TRANSIT
Stage 4: OUT_FOR_DELIVERY
Stage 5: DELIVERED
```

**FR-3: Display Information**
- Order number
- Current status (visual timeline)
- Courier name (if available)
- Tracking number (if available)
- EasyParcel tracking link button (if available)

**FR-4: Special Cases**
- `PENDING`: Show "Order pending payment" message
- `CANCELLED`: Show red badge, no timeline
- `REFUNDED`: Show orange badge, no timeline
- No `trackingUrl`: Show "Preparing your order for shipment..." message

**FR-5: Rate Limiting**
- 10 requests per hour per IP address
- Show "Try again in X minutes" message when limited

### Non-Functional Requirements

**NFR-1: Performance**
- Direct database query (no caching)
- Response time < 100ms typical
- Zero background jobs

**NFR-2: Security**
- No authentication required (public tracking)
- Rate limiting prevents abuse
- Input sanitization and validation

**NFR-3: Maintainability**
- Simple codebase (~500 LOC total)
- Clear separation of concerns
- No complex state management
- No external dependencies (beyond existing)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────┐
│           User Browser                      │
│  ┌────────────────────────────────────┐    │
│  │  /track-order Page                  │    │
│  │  - Single input field               │    │
│  │  - Submit button                    │    │
│  │  - <TrackingDisplay /> component   │    │
│  └────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ POST /api/track
                   ▼
┌─────────────────────────────────────────────┐
│           Next.js API Route                 │
│  ┌────────────────────────────────────┐    │
│  │  /api/track/route.ts                │    │
│  │  1. Rate limit check                │    │
│  │  2. Input normalization             │    │
│  │  3. Database query                  │    │
│  │  4. Return JSON                     │    │
│  └────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ Prisma Query
                   ▼
┌─────────────────────────────────────────────┐
│        PostgreSQL Database                  │
│  ┌────────────────────────────────────┐    │
│  │  Order Table                        │    │
│  │  - orderNumber (query field)        │    │
│  │  - trackingNumber (query field)     │    │
│  │  - status (OrderStatus enum)        │    │
│  │  - courierName                      │    │
│  │  - trackingUrl (EasyParcel link)    │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Data Flow

```
User Input
   │
   ├─→ "ORD-20250821-A1B2"  → Normalize → Query: WHERE orderNumber = ...
   │
   └─→ "EP1234567890"       → Query: WHERE trackingNumber = ...
                                              │
                                              ▼
                                        Order Record Found
                                              │
                                              ▼
                                   ┌──────────┴──────────┐
                                   │  Order.status        │
                                   │  Order.courierName   │
                                   │  Order.trackingUrl   │
                                   │  Order.trackingNumber│
                                   └──────────┬──────────┘
                                              │
                                              ▼
                                        Render UI
                                              │
                                   ┌──────────┴──────────┐
                                   │                     │
                           Timeline Component    EasyParcel Button
```

---

## Database Schema

### Order Table Fields Used

```prisma
model Order {
  id                String       @id @default(cuid())
  orderNumber       String       @unique           // ✅ Query field
  trackingNumber    String?                        // ✅ Query field (alternative)
  status            OrderStatus  @default(PENDING) // ✅ Timeline position
  courierName       String?                        // ✅ Display field
  trackingUrl       String?                        // ✅ EasyParcel link

  // ... other fields not used in tracking display
}
```

### OrderStatus Enum (Cleaned)

```prisma
enum OrderStatus {
  PENDING           // Before payment - Show "pending payment" message
  PAID              // ✅ Timeline Stage 1
  READY_TO_SHIP     // ✅ Timeline Stage 2
  IN_TRANSIT        // ✅ Timeline Stage 3
  OUT_FOR_DELIVERY  // ✅ Timeline Stage 4
  DELIVERED         // ✅ Timeline Stage 5
  CANCELLED         // Show red badge, no timeline
  REFUNDED          // Show orange badge, no timeline
}
```

### Index Requirements

**Existing indexes** (verify in schema):
```prisma
@@index([orderNumber])      // ✅ Required for fast lookup
@@index([trackingNumber])   // ✅ Required for alternative lookup
@@index([status])           // ✅ Helpful for admin filtering
```

If missing, add to schema:
```prisma
model Order {
  // ... fields

  @@index([orderNumber])
  @@index([trackingNumber])
}
```

---

## Implementation Specifications

### Coding Standards Compliance

Per `@CLAUDE.md` requirements:

**1. Single Source of Truth**
- ✅ OrderStatus enum in Prisma schema only
- ✅ Timeline stages derived from enum, not hardcoded
- ✅ Rate limit config in single constants file

**2. No Hardcoding**
```typescript
// ❌ BAD
const stages = ["Paid", "Ready to Ship", "In Transit", ...];

// ✅ GOOD
import { ORDER_STATUS_TIMELINE } from '@/lib/config/tracking-simple';
```

**3. Type Safety**
```typescript
// ❌ BAD
function getStage(status: any) { ... }

// ✅ GOOD
import { OrderStatus } from '@prisma/client';
function getStage(status: OrderStatus): number { ... }
```

**4. Error Handling**
```typescript
// All async operations wrapped in try-catch
try {
  const order = await prisma.order.findFirst(...);
} catch (error) {
  console.error('Database query failed:', error);
  throw new Error('Failed to fetch order');
}
```

**5. Validation**
```typescript
// Zod schema for API input validation
import { z } from 'zod';

const trackingInputSchema = z.object({
  trackingInput: z.string().min(1).max(50),
});
```

---

## File Structure

### New Files to Create

```
src/
├── app/
│   ├── track-order/
│   │   └── page.tsx                        # ✨ Main tracking page
│   └── api/
│       └── track/
│           └── route.ts                     # ✨ Single API endpoint
│
├── components/
│   └── tracking/
│       ├── OrderStatusTimeline.tsx          # ✨ 5-stage visual timeline
│       └── TrackingDisplay.tsx              # ✨ Display wrapper component
│
└── lib/
    └── config/
        └── tracking-simple.ts               # ✨ Configuration constants
```

**Total**: 5 new files (~500 LOC)

### File Size Estimates

| File | Estimated LOC | Purpose |
|------|--------------|---------|
| `page.tsx` | ~150 | Main tracking page with form |
| `route.ts` | ~180 | API endpoint with rate limiting |
| `OrderStatusTimeline.tsx` | ~100 | Timeline visualization |
| `TrackingDisplay.tsx` | ~50 | Display wrapper |
| `tracking-simple.ts` | ~20 | Constants and config |
| **Total** | **~500** | Complete implementation |

---

## Component Specifications

### 1. Configuration File

**File**: `src/lib/config/tracking-simple.ts`

**Purpose**: Single source of truth for tracking constants

```typescript
/**
 * Simple Tracking Configuration
 * Following @CLAUDE.md: Single Source of Truth, No Hardcoding
 */

import { OrderStatus } from '@prisma/client';

/**
 * Timeline stages mapping
 * Each status maps to a timeline stage number (1-5)
 */
export const ORDER_STATUS_TIMELINE: Record<OrderStatus, number | null> = {
  PENDING: null,           // Not on timeline - show "pending payment"
  PAID: 1,                 // Stage 1
  READY_TO_SHIP: 2,        // Stage 2
  IN_TRANSIT: 3,           // Stage 3
  OUT_FOR_DELIVERY: 4,     // Stage 4
  DELIVERED: 5,            // Stage 5
  CANCELLED: null,         // Not on timeline - show cancelled badge
  REFUNDED: null,          // Not on timeline - show refunded badge
};

/**
 * Timeline stage labels for display
 */
export const TIMELINE_STAGES = [
  { number: 1, label: 'Paid', description: 'Payment received' },
  { number: 2, label: 'Ready to Ship', description: 'Preparing for shipment' },
  { number: 3, label: 'In Transit', description: 'On the way' },
  { number: 4, label: 'Out for Delivery', description: 'Out for final delivery' },
  { number: 5, label: 'Delivered', description: 'Successfully delivered' },
] as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 10,
  WINDOW_MS: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Order number regex pattern
 * Format: ORD-YYYYMMDD-XXXX
 */
export const ORDER_NUMBER_PATTERN = /^ORD-\d{8}-[A-Z0-9]{4}$/i;

/**
 * Input validation
 */
export const TRACKING_INPUT_VALIDATION = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
} as const;

/**
 * UI Messages
 */
export const TRACKING_MESSAGES = {
  PENDING_PAYMENT: 'Order is pending payment confirmation',
  PREPARING_SHIPMENT: 'Preparing your order for shipment...',
  ORDER_NOT_FOUND: 'Order not found. Please check your order number and try again.',
  RATE_LIMITED: 'Too many tracking attempts. Please try again in {minutes} minutes.',
  CANCELLED: 'Order Cancelled',
  REFUNDED: 'Order Refunded',
} as const;
```

**Validation**:
- ✅ All constants in one place
- ✅ TypeScript strict typing
- ✅ JSDoc comments for clarity
- ✅ Exported for reuse across components

---

### 2. OrderStatusTimeline Component

**File**: `src/components/tracking/OrderStatusTimeline.tsx`

**Purpose**: Visual 5-stage timeline showing order progress

**Props Interface**:
```typescript
interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}
```

**Visual Design**:
```
Completed stages: ● (green filled circle with checkmark)
Current stage:    ◉ (blue pulsing circle)
Pending stages:   ○ (gray outlined circle)

● ━━━ ● ━━━ ◉ ┈┈┈ ○ ┈┈┈ ○
PAID  READY  IN    OUT   DELIVERED
      TO     TRANSIT FOR
      SHIP          DELIVERY
```

**Implementation**:
```typescript
'use client';

import React from 'react';
import { OrderStatus } from '@prisma/client';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_TIMELINE,
  TIMELINE_STAGES,
} from '@/lib/config/tracking-simple';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

/**
 * OrderStatusTimeline Component
 *
 * Displays a 5-stage visual timeline of order progress
 * Following @CLAUDE.md: Single Responsibility, DRY, Type Safety
 *
 * @param currentStatus - Current order status from database
 */
export function OrderStatusTimeline({
  currentStatus,
  className,
}: OrderStatusTimelineProps) {
  // Get current stage number (1-5) or null
  const currentStage = ORDER_STATUS_TIMELINE[currentStatus];

  // Don't show timeline for statuses not on timeline
  if (currentStage === null) {
    return null;
  }

  return (
    <div className={cn('w-full py-6', className)}>
      {/* Timeline visualization */}
      <div className="flex items-center justify-between relative">
        {TIMELINE_STAGES.map((stage, index) => {
          const isCompleted = currentStage > stage.number;
          const isCurrent = currentStage === stage.number;
          const isPending = currentStage < stage.number;
          const isLast = index === TIMELINE_STAGES.length - 1;

          return (
            <React.Fragment key={stage.number}>
              {/* Stage indicator */}
              <div className="flex flex-col items-center relative z-10">
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    {
                      'bg-green-100 border-2 border-green-500': isCompleted,
                      'bg-blue-100 border-2 border-blue-500 animate-pulse': isCurrent,
                      'bg-gray-100 border-2 border-gray-300': isPending,
                    }
                  )}
                >
                  {isCompleted && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  )}
                  {isPending && (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center mt-2 max-w-[80px]">
                  <p
                    className={cn('text-xs font-medium leading-tight', {
                      'text-green-700': isCompleted,
                      'text-blue-700': isCurrent,
                      'text-gray-500': isPending,
                    })}
                  >
                    {stage.label}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-all duration-300',
                    {
                      'bg-green-500': currentStage > stage.number,
                      'bg-gray-300 border-t-2 border-dashed': currentStage <= stage.number,
                    }
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
```

**Validation**:
- ✅ No hardcoded values (uses config)
- ✅ Type-safe with OrderStatus
- ✅ Responsive design
- ✅ Accessible with ARIA labels (can add)
- ✅ Single responsibility (timeline display only)

---

### 3. TrackingDisplay Component

**File**: `src/components/tracking/TrackingDisplay.tsx`

**Purpose**: Wrapper component displaying order information and timeline

**Props Interface**:
```typescript
interface TrackingDisplayProps {
  order: {
    orderNumber: string;
    status: OrderStatus;
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
  };
}
```

**Implementation**:
```typescript
'use client';

import React from 'react';
import { OrderStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, ExternalLink, AlertCircle } from 'lucide-react';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { TRACKING_MESSAGES } from '@/lib/config/tracking-simple';

interface TrackingDisplayProps {
  order: {
    orderNumber: string;
    status: OrderStatus;
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
  };
}

/**
 * TrackingDisplay Component
 *
 * Displays order tracking information with timeline
 * Following @CLAUDE.md: Type Safety, Single Responsibility
 *
 * @param order - Order data from API
 */
export function TrackingDisplay({ order }: TrackingDisplayProps) {
  const { orderNumber, status, courierName, trackingNumber, trackingUrl } = order;

  // Handle special statuses
  if (status === 'PENDING') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Order #{orderNumber}</h3>
          <p className="text-gray-600">{TRACKING_MESSAGES.PENDING_PAYMENT}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Badge variant="destructive" className="mb-4 text-base px-4 py-2">
            {TRACKING_MESSAGES.CANCELLED}
          </Badge>
          <h3 className="text-lg font-semibold">Order #{orderNumber}</h3>
        </CardContent>
      </Card>
    );
  }

  if (status === 'REFUNDED') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Badge variant="outline" className="mb-4 text-base px-4 py-2 border-orange-500 text-orange-700">
            {TRACKING_MESSAGES.REFUNDED}
          </Badge>
          <h3 className="text-lg font-semibold">Order #{orderNumber}</h3>
        </CardContent>
      </Card>
    );
  }

  // Normal timeline display
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Order #{orderNumber}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timeline */}
        <OrderStatusTimeline currentStatus={status} />

        {/* Divider */}
        <div className="border-t pt-4" />

        {/* Shipping Information */}
        <div className="space-y-3">
          {/* Courier Name */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Courier:</span>
            <span className="font-medium">
              {courierName || '—'}
            </span>
          </div>

          {/* Tracking Number */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tracking Number:</span>
            <span className="font-medium font-mono text-sm">
              {trackingNumber || '—'}
            </span>
          </div>
        </div>

        {/* EasyParcel Tracking Button or Preparing Message */}
        {trackingUrl ? (
          <Button
            className="w-full"
            onClick={() => window.open(trackingUrl, '_blank', 'noopener,noreferrer')}
          >
            <Truck className="w-4 h-4 mr-2" />
            Track with EasyParcel
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              {TRACKING_MESSAGES.PREPARING_SHIPMENT}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Validation**:
- ✅ Handles all special cases (PENDING, CANCELLED, REFUNDED)
- ✅ Shows "Preparing..." message when no trackingUrl
- ✅ Type-safe props
- ✅ Uses constants from config (no hardcoding)
- ✅ Accessible button with external link indicators

---

## API Specification

### Endpoint: POST /api/track

**File**: `src/app/api/track/route.ts`

**Purpose**: Single endpoint for order tracking lookup with rate limiting

**Request**:
```typescript
POST /api/track
Content-Type: application/json

{
  "trackingInput": "ORD-20250821-A1B2" | "EP1234567890"
}
```

**Response Success**:
```typescript
HTTP 200 OK
{
  "success": true,
  "order": {
    "orderNumber": "ORD-20250821-A1B2",
    "status": "IN_TRANSIT",
    "courierName": "J&T Express",
    "trackingNumber": "EP1234567890",
    "trackingUrl": "https://track.easyparcel.my/..."
  }
}
```

**Response Error - Not Found**:
```typescript
HTTP 404 Not Found
{
  "success": false,
  "error": "Order not found. Please check your order number and try again."
}
```

**Response Error - Rate Limited**:
```typescript
HTTP 429 Too Many Requests
{
  "success": false,
  "error": "Too many tracking attempts. Please try again in 45 minutes.",
  "retryAfter": 2700  // seconds
}
```

**Implementation**:
```typescript
/**
 * Track Order API Endpoint
 *
 * Single endpoint for order tracking lookup
 * Following @CLAUDE.md: Type Safety, Error Handling, No Raw SQL
 *
 * POST /api/track
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import {
  RATE_LIMIT_CONFIG,
  ORDER_NUMBER_PATTERN,
  TRACKING_MESSAGES,
  TRACKING_INPUT_VALIDATION,
} from '@/lib/config/tracking-simple';

// In-memory rate limiting store
// TODO: Replace with Redis for production multi-instance deployment
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Input validation schema
 */
const trackingInputSchema = z.object({
  trackingInput: z
    .string()
    .min(TRACKING_INPUT_VALIDATION.MIN_LENGTH)
    .max(TRACKING_INPUT_VALIDATION.MAX_LENGTH),
});

/**
 * Get client IP address for rate limiting
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
} {
  const now = Date.now();

  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(ip);

  if (!current) {
    // First request
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - 1,
    };
  }

  if (now > current.resetTime) {
    // Reset window
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - 1,
    };
  }

  if (current.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS) {
    // Rate limited
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  // Increment count
  current.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - current.count,
  };
}

/**
 * Normalize order number input
 * Handles: ORD-20250821-A1B2, ord-20250821-a1b2, ORD20250821A1B2, ord20250821a1b2
 */
function normalizeOrderNumber(input: string): string | null {
  // Remove all non-alphanumeric characters and uppercase
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Check if it matches order number pattern (ORD + 8 digits + 4 chars)
  if (cleaned.startsWith('ORD') && cleaned.length === 16) {
    // Format: ORD-YYYYMMDD-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 11)}-${cleaned.slice(11)}`;
  }

  return null;
}

/**
 * POST /api/track
 * Track order by order number or tracking number
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = getClientIP(request);

    // Check rate limit
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.retryAfter || 0) / 60);
      return NextResponse.json(
        {
          success: false,
          error: TRACKING_MESSAGES.RATE_LIMITED.replace('{minutes}', minutes.toString()),
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validation = trackingInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
        },
        { status: 400 }
      );
    }

    const { trackingInput } = validation.data;

    // Try to normalize as order number
    const normalizedOrderNumber = normalizeOrderNumber(trackingInput);

    // Query database
    // If normalized order number exists, search by that
    // Otherwise, search by tracking number (case-insensitive)
    const order = await prisma.order.findFirst({
      where: normalizedOrderNumber
        ? { orderNumber: normalizedOrderNumber }
        : {
            trackingNumber: {
              equals: trackingInput,
              mode: 'insensitive',
            },
          },
      select: {
        orderNumber: true,
        status: true,
        courierName: true,
        trackingNumber: true,
        trackingUrl: true,
      },
    });

    // Order not found
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: TRACKING_MESSAGES.ORDER_NOT_FOUND,
        },
        { status: 404 }
      );
    }

    // Return order data
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
      },
    });

  } catch (error) {
    console.error('Track API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while tracking your order. Please try again.',
      },
      { status: 500 }
    );
  }
}
```

**Validation**:
- ✅ Rate limiting (10/hour per IP)
- ✅ Input validation with Zod
- ✅ Type-safe database query (Prisma)
- ✅ Proper error handling with try-catch
- ✅ Case-insensitive tracking number search
- ✅ Order number normalization (with/without dashes)
- ✅ No raw SQL (Prisma only)
- ✅ Uses constants from config

---

## Page Specification

### Page: /track-order

**File**: `src/app/track-order/page.tsx`

**Purpose**: Single tracking page with input form and results display

**Implementation**:
```typescript
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Search, Loader2, AlertCircle } from 'lucide-react';
import { TrackingDisplay } from '@/components/tracking/TrackingDisplay';
import { OrderStatus } from '@prisma/client';

/**
 * Track Order Page
 *
 * Single page for order tracking (guest and logged-in users)
 * Following @CLAUDE.md: Type Safety, Error Handling, KISS
 */

interface TrackingResult {
  orderNumber: string;
  status: OrderStatus;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export default function TrackOrderPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    retryAfter?: number;
  }>({});

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Please enter an order number or tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setRateLimitInfo({});

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingInput: input.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.order);
      } else if (response.status === 429) {
        // Rate limited
        setError(data.error);
        if (data.retryAfter) {
          setRateLimitInfo({ retryAfter: data.retryAfter });
        }
      } else {
        setError(data.error || 'Failed to track order');
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Unable to connect to tracking service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle new search
   */
  const handleNewSearch = () => {
    setInput('');
    setResult(null);
    setError('');
    setRateLimitInfo({});
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Track Your Order</h1>
        </div>
        <p className="text-gray-600">
          Enter your order number or tracking number to get real-time updates
        </p>
      </div>

      {/* Search Form */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Track Shipment
            </CardTitle>
            <CardDescription>
              Enter your order number (e.g., ORD-20250821-A1B2) or tracking number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input Field */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter order number or tracking number"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Help Text */}
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Accepted formats:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Order number: ORD-20250821-A1B2 (with or without dashes)</li>
                  <li>Tracking number: EP1234567890</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tracking Results */}
      {result && (
        <div className="space-y-4">
          <TrackingDisplay order={result} />

          {/* New Search Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleNewSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Track Another Order
          </Button>
        </div>
      )}

      {/* Instructions (shown when no result) */}
      {!result && !loading && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Track Your Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• You can find your order number in the confirmation email</p>
              <p>• Tracking numbers are provided when your order ships</p>
              <p>• Enter either one to track your shipment status</p>
              <p>• Rate limit: 10 tracking requests per hour</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Validation**:
- ✅ Single input field (flexible)
- ✅ Loading states
- ✅ Error handling
- ✅ Rate limit display
- ✅ Type-safe state management
- ✅ Accessible form
- ✅ Clear user guidance

---

## Testing Strategy

### Manual Testing Checklist

**Input Handling**:
- [ ] Enter order number with dashes: `ORD-20250821-A1B2`
- [ ] Enter order number without dashes: `ORD20250821A1B2`
- [ ] Enter lowercase order number: `ord-20250821-a1b2`
- [ ] Enter tracking number: `EP1234567890`
- [ ] Enter invalid format: `INVALID123`

**Timeline Display**:
- [ ] PAID status shows Stage 1 active
- [ ] READY_TO_SHIP shows Stage 2 active
- [ ] IN_TRANSIT shows Stage 3 active
- [ ] OUT_FOR_DELIVERY shows Stage 4 active
- [ ] DELIVERED shows Stage 5 active (all green)

**Special Cases**:
- [ ] PENDING status shows "pending payment" message
- [ ] CANCELLED shows red badge, no timeline
- [ ] REFUNDED shows orange badge, no timeline
- [ ] No trackingUrl shows "Preparing..." message
- [ ] With trackingUrl shows EasyParcel button

**Rate Limiting**:
- [ ] Make 10 requests successfully
- [ ] 11th request shows rate limit error
- [ ] Error shows retry time in minutes
- [ ] Wait 1 hour, can track again

**Error Handling**:
- [ ] Non-existent order shows "not found" error
- [ ] Empty input shows validation error
- [ ] Network error shows friendly message

**Responsive Design**:
- [ ] Mobile view (< 640px)
- [ ] Tablet view (640px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Timeline scales appropriately

### Unit Testing (Optional)

**Test File**: `src/components/tracking/__tests__/OrderStatusTimeline.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { OrderStatusTimeline } from '../OrderStatusTimeline';
import { OrderStatus } from '@prisma/client';

describe('OrderStatusTimeline', () => {
  it('should render 5 stages', () => {
    render(<OrderStatusTimeline currentStatus="IN_TRANSIT" />);
    expect(screen.getAllByRole('img')).toHaveLength(5);
  });

  it('should highlight completed stages for IN_TRANSIT', () => {
    render(<OrderStatusTimeline currentStatus="IN_TRANSIT" />);
    // PAID and READY_TO_SHIP should be completed (green)
    // IN_TRANSIT should be current (blue)
    // OUT_FOR_DELIVERY and DELIVERED should be pending (gray)
  });

  it('should not render for CANCELLED status', () => {
    const { container } = render(<OrderStatusTimeline currentStatus="CANCELLED" />);
    expect(container.firstChild).toBeNull();
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

**Code Quality**:
- [ ] All files follow `@CLAUDE.md` standards
- [ ] No `any` types used
- [ ] All async operations have try-catch
- [ ] Constants in config file (no hardcoding)
- [ ] TypeScript compilation successful

**Database**:
- [ ] Migration applied (removed unused OrderStatus values)
- [ ] TrackingCache marked as deprecated
- [ ] Indexes verified on orderNumber and trackingNumber

**Testing**:
- [ ] Manual testing completed
- [ ] All test cases passed
- [ ] Rate limiting verified
- [ ] Mobile responsive verified

**Code Review**:
- [ ] Single source of truth maintained
- [ ] DRY principle applied
- [ ] SOLID principles followed
- [ ] KISS principle adhered to

### Deployment to Railway

**Environment Variables** (verify exist):
```bash
DATABASE_URL=postgresql://...
```

**Build Commands**:
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build Next.js
npm run build

# Run database migrations
npx prisma migrate deploy
```

**Post-Deployment Verification**:
- [ ] `/track-order` page loads successfully
- [ ] Can track by order number
- [ ] Can track by tracking number
- [ ] EasyParcel link works (opens in new tab)
- [ ] Rate limiting functional
- [ ] Error messages display correctly

---

## Maintenance & Future Enhancements

### Maintenance Tasks

**Monthly**:
- Review rate limit effectiveness
- Check for abuse patterns
- Monitor API response times

**As Needed**:
- Update courier-specific handling
- Add new statuses if business requires
- Update UI based on user feedback

### Potential Future Enhancements

**Phase 2** (if needed):
- Email notifications on status changes
- SMS tracking updates
- Admin tracking analytics dashboard
- Estimated delivery date display (if EasyParcel provides)

**Do NOT implement unless explicitly requested**:
- Background tracking jobs
- Complex caching
- Privacy filtering
- Authentication requirements
- Multiple tracking pages

---

## Summary

### Implementation Checklist

**Files to Create** (5 files):
- [ ] `src/lib/config/tracking-simple.ts` (constants)
- [ ] `src/components/tracking/OrderStatusTimeline.tsx` (timeline visual)
- [ ] `src/components/tracking/TrackingDisplay.tsx` (display wrapper)
- [ ] `src/app/api/track/route.ts` (API endpoint)
- [ ] `src/app/track-order/page.tsx` (main page)

**Validation** (@CLAUDE.md compliance):
- [ ] Single source of truth (constants in config)
- [ ] No hardcoding (all values in config)
- [ ] Type safety (no `any` types)
- [ ] Error handling (all async with try-catch)
- [ ] DRY principle (reusable components)
- [ ] SOLID principles (single responsibility)
- [ ] KISS principle (simple, maintainable)

**Estimated Effort**: 3-4 hours for complete implementation and testing

---

**Document Status**: Implementation Ready
**Next Action**: Begin implementation with `tracking-simple.ts` config file
**Success Criteria**: All test cases pass, deploys to Railway successfully
