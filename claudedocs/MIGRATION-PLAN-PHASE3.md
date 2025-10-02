# Phase 3 & 4 Migration Plan

## Phase 3.1: Consolidate Rate Limiting

### Current State Analysis

**Multiple Rate Limiting Implementations Found:**
1. ✅ `src/lib/security/rate-limiter.ts` - NEW centralized Upstash-based (KEEP)
2. ❌ `src/lib/rate-limit.ts` - OLD in-memory Map-based (REMOVE)
3. ❌ `src/lib/utils/rate-limit.ts` - OLD in-memory (REMOVE)
4. ⚠️ `src/lib/middleware/rate-limit.ts` - Chat-specific using security module (KEEP - but migrate to centralized)

**Files Using OLD Implementations:**
- Monitoring APIs: `/api/monitoring/errors`, `/api/monitoring/events`, `/api/monitoring/performance`
- Chat APIs: `/api/chat/webhook`, `/api/chat/messages`, `/api/chat/send`, `/api/chat/session`
- Order APIs: `/api/orders/lookup`, `/api/orders/receipt`
- Agent API: `/api/agent-application`

### Migration Strategy

**Step 1:** Create compatibility wrapper for gradual migration
**Step 2:** Migrate all API routes to use centralized rate limiter
**Step 3:** Remove old implementations
**Step 4:** Update documentation

---

## Phase 3.2: Optimize Static Assets

**Current Issue:** Assets copied during build AND runtime (duplicate work)

**Solution:**
1. Ensure build-time copy is complete
2. Remove runtime copy from railway-start.js
3. Verify standalone build includes all assets

---

## Phase 4.1: TypeScript/ESLint Errors

**Current Status:** Errors ignored in production builds

**Approach:**
1. Run `npm run typecheck` to identify errors
2. Run `npm run lint` to identify warnings
3. Fix systematically (critical first, then warnings)
4. Remove ignoreBuildErrors flags

---

## Phase 4.2: Database Query Optimization

**Tasks:**
1. Review API routes for N+1 queries
2. Identify missing indexes
3. Implement query result caching where appropriate
4. Add query performance logging

---

## Phase 4.3: Comprehensive Testing

**Tasks:**
1. Create test utilities
2. Add critical path integration tests
3. Test Railway deployment process
4. Load test with connection pool limits
