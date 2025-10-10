# Order Management System Documentation

Complete documentation for the Order Management System redesign based on WooCommerce/Shopify patterns.

---

## 🤖 AI DEVELOPER GUIDE (Complete Read Strategy - 100% Coverage)

**This guide ensures you read ALL 8,813 lines of documentation while respecting token limits.**

### Strategy Overview

Read documentation in **5 phases**, aligned with implementation phases. Each phase reads complete sections (no partial reads) to maintain context coherence. Total: **8,813 lines across all phases**.

**Token Budget Per Phase**: ~8,000-15,000 tokens per phase
**Total Token Cost**: ~60,000-70,000 tokens for complete documentation
**Available Budget**: 200,000 tokens (well within limits)

---

### Phase 0: Pre-Implementation Context (607 lines)

**Read BEFORE starting any implementation. This gives you the WHY and WHAT.**

```bash
# Read these files COMPLETELY:
Read README.md                              # 215 lines - Navigation guide
Read REDESIGN_PLAN.md                       # 392 lines - Design vision, architecture
```

**Total: 607 lines**

**What You Learn**:
- ✅ Why we're redesigning (WooCommerce/Shopify patterns)
- ✅ What we're building (2 pages instead of 4)
- ✅ High-level architecture and phases
- ✅ How to navigate all documentation

**Checkpoint**: After reading, you should understand: "We're building a WooCommerce-inspired order management system with 2 pages (List + Details), replacing 4 old pages."

---

### Phase 1: Foundation Layer (3,572 lines)

**Read these COMPLETELY before coding foundation:**

```bash
# Read COMPLETE files:
Read INTEGRATION_PLAN.md                    # 1,630 lines - Complete integration mapping
Read DEV_GUIDE.md                           # 942 lines - Complete workflow guide

# Read specific sections:
Read IMPLEMENTATION_PATTERNS.md lines 1-500 # Foundation code examples
Read TECHNICAL_SPEC.md lines 1-500          # Constants, utilities, base types
```

**Total: 3,572 lines**

**What You Learn**:
- ✅ How new code integrates with existing codebase (database, APIs, utilities)
- ✅ Complete development workflow for all phases
- ✅ Foundation layer code: constants (`ORDER_STATUS`, etc.)
- ✅ Utility functions: `formatOrderNumber()`, `getOrderStatusColor()`, etc.
- ✅ Base TypeScript interfaces

**Files to Create in Phase 1**:
- `src/lib/constants/order.ts`
- `src/lib/utils/order.ts`

**Checkpoint**: After reading, you should be able to: "Create the complete foundation layer without referencing any docs."

---

### Phase 2: Core Components (1,710 lines)

**Read these COMPLETELY before building components:**

```bash
# Read specific sections:
Read IMPLEMENTATION_PATTERNS.md lines 501-1211   # All 6 component implementations
Read TECHNICAL_SPEC.md lines 501-1000            # Component TypeScript interfaces
Read QA_SPEC.md lines 1-500                      # Component testing patterns
```

**Total: 1,710 lines**

**What You Learn**:
- ✅ Complete code for 6 components:
  - OrderStatusBadge (175 lines)
  - OrderTable (346 lines)
  - OrderFilters (220 lines)
  - ExportDialog (181 lines)
  - TrackingCard (199 lines)
  - OrderInlineActions (226 lines)
- ✅ TypeScript interfaces for all props
- ✅ Unit test patterns with React Testing Library
- ✅ Accessibility requirements (WCAG 2.1 Level AA)

**Files to Create in Phase 2**:
- `src/components/admin/orders/OrderStatusBadge.tsx`
- `src/components/admin/orders/OrderTable.tsx`
- `src/components/admin/orders/OrderFilters.tsx`
- `src/components/admin/orders/ExportDialog.tsx`
- `src/components/admin/orders/TrackingCard.tsx`
- `src/components/admin/orders/OrderInlineActions.tsx`

**Checkpoint**: After reading, you should be able to: "Copy-paste all 6 components and understand how they work together."

---

### Phase 3: Order List Page (1,241 lines)

**Read these COMPLETELY before building Order List page:**

```bash
# Read specific sections:
Read IMPLEMENTATION_PATTERNS.md lines 1212-1590  # Complete Order List page
Read TECHNICAL_SPEC.md lines 1001-1400           # List page specifications
Read QA_SPEC.md lines 501-963                    # E2E tests for List page
```

**Total: 1,241 lines**

**What You Learn**:
- ✅ Complete Order List page code (375 lines)
- ✅ State management patterns (`useState`, `useCallback`, `useEffect`)
- ✅ Data fetching with pagination
- ✅ Bulk selection logic
- ✅ Filter integration
- ✅ E2E test scenarios with Playwright

**Files to Create in Phase 3**:
- `src/app/admin/orders/page.tsx`

**Checkpoint**: After reading, you should be able to: "Implement the complete Order List page with filters, pagination, and bulk actions."

---

### Phase 4: Order Details Page (1,679 lines)

**Read these COMPLETELY before building Order Details page:**

```bash
# Read specific sections:
Read IMPLEMENTATION_PATTERNS.md lines 1591-2362  # Complete Order Details page + components
Read TECHNICAL_SPEC.md lines 1401-1846           # Details page specifications
Read QA_SPEC.md lines 964-1426                   # E2E tests + edge cases
```

**Total: 1,679 lines**

**What You Learn**:
- ✅ Complete Order Details page code (479 lines)
- ✅ Supporting components integration
- ✅ Order editing patterns (status updates, notes)
- ✅ Shipment tracking integration (EasyParcel API)
- ✅ Payment handling (ToyyibPay)
- ✅ 8 edge case scenarios:
  1. Guest orders (no user account)
  2. Deleted products
  3. Orders without shipment
  4. Failed shipment booking
  5. Concurrent status updates
  6. Very long order numbers
  7. Large order item count (>20 items)
  8. Timezone handling

**Files to Create in Phase 4**:
- `src/app/admin/orders/[id]/page.tsx`

**Checkpoint**: After reading, you should be able to: "Implement the complete Order Details page with all edge cases handled."

---

### Phase 5: Quality Assurance & Deployment (500 lines)

**Read these COMPLETELY before testing and deployment:**

```bash
# Read remaining sections:
Read QA_SPEC.md lines 1-1426 (complete file)     # If not fully read in phases 2-4
Read DEV_GUIDE.md (complete file)                # If not fully read in phase 1
```

**Total: ~500 lines (remaining sections)**

**What You Learn**:
- ✅ Performance testing strategy (LCP < 2.5s, FID < 100ms)
- ✅ Browser compatibility matrix (Chrome 90+, Safari 14+, Firefox 88+, Edge 90+)
- ✅ Debugging tips for TypeScript errors, API failures, database issues
- ✅ Deployment checklist with rollback procedures
- ✅ Code review checklist (30+ items)

**Checkpoint**: After reading, you should be able to: "Run complete test suite, deploy to production, and rollback if needed."

---

## 📊 Complete Coverage Verification

**By the end of all 5 phases, you will have read:**

| File | Total Lines | Lines Read | Coverage |
|------|-------------|------------|----------|
| README.md | 215 | 215 | 100% ✅ |
| REDESIGN_PLAN.md | 392 | 392 | 100% ✅ |
| INTEGRATION_PLAN.md | 1,630 | 1,630 | 100% ✅ |
| TECHNICAL_SPEC.md | 1,846 | 1,846 | 100% ✅ |
| IMPLEMENTATION_PATTERNS.md | 2,362 | 2,362 | 100% ✅ |
| QA_SPEC.md | 1,426 | 1,426 | 100% ✅ |
| DEV_GUIDE.md | 942 | 942 | 100% ✅ |
| **TOTAL** | **8,813** | **8,813** | **100% ✅** |

---

## 🎯 Quick Reference: What to Read When

**Use this table for just-in-time lookups during implementation:**

| I Need... | File | Lines | Phase |
|-----------|------|-------|-------|
| Order constants | IMPLEMENTATION_PATTERNS.md | 100-150 | 1 |
| Utility functions | IMPLEMENTATION_PATTERNS.md | 150-250 | 1 |
| Database schema info | INTEGRATION_PLAN.md | 1-400 | 1 |
| Existing API endpoints | INTEGRATION_PLAN.md | 400-800 | 1 |
| OrderStatusBadge code | IMPLEMENTATION_PATTERNS.md | 260-435 | 2 |
| OrderTable code | IMPLEMENTATION_PATTERNS.md | 440-790 | 2 |
| OrderFilters code | IMPLEMENTATION_PATTERNS.md | 795-1015 | 2 |
| Order List page | IMPLEMENTATION_PATTERNS.md | 1212-1590 | 3 |
| Order Details page | IMPLEMENTATION_PATTERNS.md | 1596-2079 | 4 |
| Edge case scenarios | QA_SPEC.md | 1100-1300 | 4 |
| Deployment checklist | DEV_GUIDE.md | 900-942 | 5 |

---

## ⚡ Token Efficiency Tips for AI Agents

1. **Read in Phases**: Don't read all 8,813 lines upfront. Read per phase (607 → 3,572 → 1,710 → 1,241 → 1,679 → 500)
2. **Use offset/limit**: When using Read tool, specify line ranges exactly as shown above
3. **Avoid Re-reading**: Once you've read a section, take notes or save context. Don't re-read unless necessary
4. **Checkpoint Between Phases**: After each phase, summarize what you learned before moving to next
5. **Use Quick Reference Table**: For small lookups, use the table above instead of reading entire files

**Estimated Token Budget**:
- Phase 0: ~5,000 tokens
- Phase 1: ~25,000 tokens
- Phase 2: ~12,000 tokens
- Phase 3: ~9,000 tokens
- Phase 4: ~12,000 tokens
- Phase 5: ~4,000 tokens
- **Total: ~67,000 tokens** (well within 200k limit)

---

## 📚 Documentation Index

Read the documents in this order for complete understanding:

### 1. **ORDER_MANAGEMENT_REDESIGN_PLAN.md** (Start Here)
**Purpose**: High-level design vision and architecture
**Who**: Product managers, architects, all developers
**Contains**:
- Research findings (WooCommerce/Shopify patterns)
- Proposed architecture (2 pages instead of 4)
- Page layouts and wireframes
- Implementation phases overview
- Component breakdown

**Read this first** to understand the "why" and "what" of the redesign.

---

### 2. **ORDER_MANAGEMENT_INTEGRATION_PLAN.md**
**Purpose**: How the redesign connects to existing codebase
**Who**: Developers, technical leads
**Contains**:
- Current state assessment (what exists vs. what's missing)
- Database schema verification (Prisma models)
- API endpoints inventory (existing routes)
- Phase-by-phase integration mapping
- Migration strategy with rollback plan
- Dependencies and prerequisites

**Read this second** to understand how new design integrates with current code.

---

### 3. **ORDER_MANAGEMENT_TECHNICAL_SPEC.md**
**Purpose**: Complete technical implementation guide
**Who**: Frontend/backend developers
**Contains**:
- Complete TypeScript interfaces for all components
- Full code examples (copy-paste ready)
- Exact API request/response JSON formats
- UI design system (colors, typography, spacing)
- Error handling patterns with examples
- Loading & empty state specifications
- Responsive design breakpoints

**Use this as your primary reference** during implementation.

---

### 4. **ORDER_MANAGEMENT_IMPLEMENTATION_PATTERNS.md** ⭐ NEW
**Purpose**: Complete, copy-paste ready component and page implementations
**Who**: All developers starting implementation
**Contains**:
- Complete code for all 6 shared components (OrderTable, OrderFilters, etc.)
- Complete code for both pages (Order List + Order Details)
- Existing codebase patterns reference (from products/page.tsx)
- Authentication & authorization patterns
- State management patterns (useState, useCallback, useEffect)
- Form handling patterns (controlled components)
- Data fetching patterns (fetch API)
- Bulk selection patterns (useBulkSelection hook)
- Real-time updates strategy

**Read this BEFORE coding** - Provides 100% working examples following existing codebase patterns.

---

### 5. **ORDER_MANAGEMENT_QA_SPEC.md**
**Purpose**: Testing and quality assurance requirements
**Who**: QA engineers, developers writing tests
**Contains**:
- Testing pyramid strategy (unit, integration, E2E)
- Complete test examples with Jest/Playwright
- WCAG 2.1 Level AA accessibility requirements
- Performance targets (LCP, FID, CLS)
- Browser compatibility matrix
- Edge case scenarios (8 different cases)
- Test data fixtures

**Use this** when writing tests and validating implementation.

---

### 6. **ORDER_MANAGEMENT_DEV_GUIDE.md**
**Purpose**: Practical development workflow
**Who**: All developers
**Contains**:
- Local development setup instructions
- Environment configuration (.env.local)
- Git workflow with conventional commits
- Phase-by-phase development workflow with bash commands
- Storybook setup for component development
- Debugging tips (TypeScript, API, database)
- Code review checklist
- Deployment checklist with rollback plan

**Use this** for day-to-day development workflow.

---

## 🚀 Quick Start for Developers

### First Time Setup
```bash
# 1. Read the redesign plan
open ORDER_MANAGEMENT_REDESIGN_PLAN.md

# 2. Read the integration plan
open ORDER_MANAGEMENT_INTEGRATION_PLAN.md

# 3. Set up local environment (follow DEV_GUIDE.md)
# 4. Start with Phase 1: Foundation layer
```

### During Development
```bash
# Reference implementation patterns for working code examples
open ORDER_MANAGEMENT_IMPLEMENTATION_PATTERNS.md

# Reference technical spec for implementation details
open ORDER_MANAGEMENT_TECHNICAL_SPEC.md

# Reference QA spec when writing tests
open ORDER_MANAGEMENT_QA_SPEC.md

# Follow workflow in dev guide
open ORDER_MANAGEMENT_DEV_GUIDE.md
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (2-3 hours)
- Create constants layer (`lib/constants/order.ts`)
- Create utilities layer (`lib/utils/order.ts`)
- Write unit tests
- **Files**: 2 source files + 2 test files

### Phase 2: Shared Components (4-6 hours)
- OrderTable
- OrderFilters
- OrderStatusBadge
- ExportDialog
- TrackingCard
- OrderInlineActions
- **Files**: 6 components + 6 test files

### Phase 3: Main Order List Page (6-8 hours)
- Build `/admin/orders` with tabs, filters, bulk actions
- **Files**: 1 page + tests

### Phase 4: Order Details Page (4-6 hours)
- Build `/admin/orders/[orderId]` with sidebar
- **Files**: 1 page + tests

### Phase 5: Clean Up (2-3 hours)
- Delete old pages
- Update navigation
- Integration testing

**Total Estimate**: 18-26 hours

---

## 🎯 Key Principles (from CLAUDE.md)

All implementation MUST follow these standards:

✅ **Single Source of Truth** - Prisma enums → constants → components
✅ **No Hardcoding** - All values in constants/environment variables
✅ **DRY Principle** - Reusable utilities and components
✅ **Type Safety** - Complete TypeScript interfaces, no `any` types
✅ **Evidence-Based** - All claims verifiable through testing

---

## 🔗 Related Files in Codebase

### Database Schema
- `prisma/schema.prisma` (lines 239-306: Order model)
- `prisma/schema.prisma` (lines 1124-1155: Enums)

### API Routes
- `src/app/api/orders/route.ts` (Order creation, listing)
- `src/app/api/orders/[orderId]/status/route.ts` (Status updates)
- `src/app/api/orders/[orderId]/invoice/route.ts` (Invoice generation)

### Existing Utilities
- `src/lib/utils/currency.ts` (formatPrice)
- `src/lib/utils/date.ts` (formatDate, formatDateTime)

### Notification System
- `src/lib/notifications/order-status-handler.ts` (OrderStatusHandler)

---

## 📞 Questions?

If anything is unclear:
1. Check the **Implementation Patterns** for complete working code examples
2. Check the **Technical Spec** for TypeScript interfaces and API specs
3. Check the **Integration Plan** for existing code references
4. Check the **Dev Guide** for workflow instructions
5. Check the **QA Spec** for testing examples

---

**Last Updated**: October 9, 2025
**Status**: Ready for Phase 1 implementation
**Next Step**: Review all documentation, then start Phase 1 foundation layer
