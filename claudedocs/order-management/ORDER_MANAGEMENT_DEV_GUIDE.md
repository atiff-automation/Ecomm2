# Order Management Development Guide
**Developer Workflow & Setup Instructions**

## Document Purpose

This document provides **practical development workflow instructions** for implementing the Order Management Redesign. It includes:
- Local development setup
- Environment configuration
- Development workflow & Git strategy
- Component development with Storybook
- Debugging tips and tools
- PR checklist and code review guidelines
- Deployment checklist

**Related Documents:**
- `ORDER_MANAGEMENT_REDESIGN_PLAN.md` - High-level design
- `ORDER_MANAGEMENT_INTEGRATION_PLAN.md` - Integration strategy
- `ORDER_MANAGEMENT_TECHNICAL_SPEC.md` - Technical implementation details
- `ORDER_MANAGEMENT_QA_SPEC.md` - Testing and QA requirements

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Configuration](#environment-configuration)
3. [Git Workflow & Branching Strategy](#git-workflow--branching-strategy)
4. [Development Workflow](#development-workflow)
5. [Component Development with Storybook](#component-development-with-storybook)
6. [Debugging Tips](#debugging-tips)
7. [Code Review Guidelines](#code-review-guidelines)
8. [Deployment Checklist](#deployment-checklist)

---

## Local Development Setup

### Prerequisites

Ensure you have the following installed:
- **Node.js:** v18.17.0 or higher
- **npm:** v9.0.0 or higher (comes with Node.js)
- **PostgreSQL:** v14 or higher (for local database)
- **Git:** v2.30 or higher

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd /Users/atiffriduan/Desktop/EcomJRM

# Install dependencies
npm install

# Verify installation
npm run dev -- --help
```

### Step 2: Database Setup

```bash
# Start PostgreSQL (if using Homebrew on macOS)
brew services start postgresql@14

# Create database (if not exists)
createdb ecomjrm

# Run Prisma migrations
npx prisma migrate dev

# Seed database with test data (if seed script exists)
npm run db:seed
```

### Step 3: Start Development Server

```bash
# Start Next.js development server
npm run dev

# Server will start at http://localhost:3000
# Admin panel: http://localhost:3000/admin
```

### Step 4: Verify Setup

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test
```

**Expected Output:**
```
✓ TypeScript: No errors
✓ ESLint: No errors
✓ Tests: All passing
```

---

## Environment Configuration

### Environment Variables

Create or verify `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecomjrm"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Payment Gateway (ToyyibPay)
TOYYIBPAY_SECRET_KEY="your-toyyibpay-secret"
TOYYIBPAY_CATEGORY_CODE="your-category-code"

# Email Service
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# Telegram (optional)
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# Order Management (optional)
ORDER_WEBHOOK_SECRET="your-webhook-secret"

# EasyParcel (Shipping)
EASYPARCEL_API_KEY="your-easyparcel-api-key"
EASYPARCEL_API_URL="https://connect.easyparcel.my/api/v1"
```

### Environment Validation

```typescript
// lib/env.ts (verify this file exists)
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  // ... other env vars
});

export const env = envSchema.parse(process.env);
```

---

## Git Workflow & Branching Strategy

### Branch Naming Convention

```
feature/order-management-redesign     # Main feature branch
├── feature/order-constants           # Sub-feature: Constants layer
├── feature/order-utils               # Sub-feature: Utilities
├── feature/order-components          # Sub-feature: Components
│   ├── feature/order-table           # Individual component
│   ├── feature/order-filters         # Individual component
│   └── feature/order-badge           # Individual component
└── feature/order-pages               # Sub-feature: Pages
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     New feature
fix:      Bug fix
refactor: Code restructuring
test:     Adding tests
docs:     Documentation
style:    Code formatting
perf:     Performance improvement
chore:    Build process or auxiliary tool changes

# Examples
feat(orders): add OrderStatusBadge component
fix(orders): correct status color mapping
refactor(orders): extract status utilities
test(orders): add OrderTable unit tests
docs(orders): update integration plan
style(orders): format code with prettier
perf(orders): optimize order list query
chore(orders): update dependencies
```

### Git Workflow Steps

#### Starting a New Feature

```bash
# 1. Ensure main branch is up to date
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/order-constants

# 3. Verify you're on the correct branch
git branch --show-current
# Output: feature/order-constants
```

#### During Development

```bash
# 1. Check status frequently
git status

# 2. Stage changes
git add src/lib/constants/order.ts
git add src/lib/constants/__tests__/order.test.ts

# 3. Commit with conventional message
git commit -m "feat(orders): add ORDER_STATUSES constants

- Define all order status configurations
- Add payment and shipment status constants
- Include status tab configurations
- Add comprehensive unit tests"

# 4. Push to remote
git push origin feature/order-constants
```

#### Creating Pull Request

```bash
# 1. Push final changes
git push origin feature/order-constants

# 2. Create PR via GitHub CLI (if installed)
gh pr create \
  --title "feat(orders): Add order constants layer" \
  --body "$(cat <<'EOF'
## Summary
Implements Phase 1 of order management redesign: Constants layer

## Changes
- ✅ Created `src/lib/constants/order.ts`
- ✅ Defined ORDER_STATUSES with colors, icons, labels
- ✅ Defined PAYMENT_STATUSES and SHIPMENT_STATUSES
- ✅ Added ORDER_STATUS_TABS configuration
- ✅ Added ORDER_DATE_FILTERS presets
- ✅ Included comprehensive unit tests

## Testing
- Unit tests: 15/15 passing
- Type checking: No errors
- Linting: No errors

## References
- ORDER_MANAGEMENT_REDESIGN_PLAN.md (Phase 1: Lines 188-199)
- ORDER_MANAGEMENT_TECHNICAL_SPEC.md (Constants section)

## Checklist
- [x] Code follows CLAUDE.md principles
- [x] No hardcoded values
- [x] Single source of truth maintained
- [x] TypeScript strict mode passing
- [x] Unit tests added and passing
- [x] Documentation updated
EOF
)" \
  --base main

# 3. OR create PR manually on GitHub
# Go to: https://github.com/yourusername/EcomJRM/pull/new/feature/order-constants
```

---

## Development Workflow

### Phase-by-Phase Development

#### Phase 1: Foundation (2-3 hours)

**Tasks:**
1. Create constants file
2. Create utilities file
3. Write unit tests
4. Verify integration

**Workflow:**
```bash
# 1. Create branch
git checkout -b feature/order-foundation

# 2. Create constants file
touch src/lib/constants/order.ts
# Implement according to ORDER_MANAGEMENT_TECHNICAL_SPEC.md

# 3. Create utils file
touch src/lib/utils/order.ts
# Implement according to ORDER_MANAGEMENT_TECHNICAL_SPEC.md

# 4. Create test files
touch src/lib/constants/__tests__/order.test.ts
touch src/lib/utils/__tests__/order.test.ts
# Write tests according to ORDER_MANAGEMENT_QA_SPEC.md

# 5. Run tests locally
npm test -- --watch

# 6. Verify type checking
npm run typecheck

# 7. Commit and push
git add .
git commit -m "feat(orders): add foundation layer (constants + utils)"
git push origin feature/order-foundation

# 8. Create PR
gh pr create --title "feat(orders): Foundation layer" --base main
```

---

#### Phase 2: Components (8-10 hours)

**Recommended Order:**
1. OrderStatusBadge (1 hour) - Simplest, no dependencies
2. OrderFilters (1.5 hours) - Moderate complexity
3. ExportDialog (1.5 hours) - Modal component
4. TrackingCard (1.5 hours) - Read-only display
5. OrderInlineActions (2 hours) - Complex interactions
6. OrderTable (2-3 hours) - Most complex

**Workflow for Each Component:**
```bash
# Example: OrderStatusBadge

# 1. Create component branch
git checkout -b feature/order-status-badge

# 2. Create component files
mkdir -p src/components/admin/orders
touch src/components/admin/orders/OrderStatusBadge.tsx
touch src/components/admin/orders/__tests__/OrderStatusBadge.test.tsx
touch src/components/admin/orders/types.ts

# 3. Implement component
# Follow ORDER_MANAGEMENT_TECHNICAL_SPEC.md example

# 4. Write tests
# Follow ORDER_MANAGEMENT_QA_SPEC.md examples

# 5. Create Storybook story (optional but recommended)
touch src/components/admin/orders/OrderStatusBadge.stories.tsx

# 6. Run tests
npm test -- OrderStatusBadge

# 7. Run Storybook
npm run storybook
# Verify component visually

# 8. Commit and push
git add .
git commit -m "feat(orders): add OrderStatusBadge component

- Implement badge with icon and color coding
- Support all status types (order, payment, shipment)
- Add size variants (sm, md, lg)
- Include comprehensive unit tests
- Add Storybook story for visual testing"

git push origin feature/order-status-badge

# 9. Create PR
gh pr create

# 10. After PR is merged, move to next component
git checkout main
git pull origin main
git checkout -b feature/order-filters
# Repeat process...
```

---

#### Phase 3: Main Order List Page (4-5 hours)

```bash
# 1. Create branch
git checkout -b feature/order-list-page

# 2. Backup old page (if not already done)
mv src/app/admin/orders/page.tsx src/app/admin/orders/page.tsx.OLD

# 3. Create new page
touch src/app/admin/orders/page.tsx
# Implement according to ORDER_MANAGEMENT_TECHNICAL_SPEC.md

# 4. Test locally
# Navigate to http://localhost:3000/admin/orders
# Test all features:
# - Status tabs
# - Search functionality
# - Filters
# - Bulk actions
# - Inline actions
# - Pagination

# 5. Write integration tests
touch src/app/admin/orders/__tests__/page.integration.test.tsx

# 6. Commit and push
git add .
git commit -m "feat(orders): rebuild main order list page

- Implement WooCommerce-style order list
- Add status tabs for filtering
- Integrate OrderFilters component
- Integrate OrderTable with inline actions
- Add bulk action support
- Implement pagination
- Add loading and empty states"

git push origin feature/order-list-page

# 7. Create PR
gh pr create
```

---

#### Phase 4: Order Details Page (3-4 hours)

```bash
# 1. Create branch
git checkout -b feature/order-details-page

# 2. Backup old page
mv src/app/admin/orders/[orderId]/page.tsx src/app/admin/orders/[orderId]/page.tsx.OLD

# 3. Create new page
touch src/app/admin/orders/[orderId]/page.tsx
# Implement according to ORDER_MANAGEMENT_TECHNICAL_SPEC.md

# 4. Test locally
# Navigate to http://localhost:3000/admin/orders/[orderId]
# Test all features:
# - Order details display
# - Status updates
# - Quick actions (invoice, fulfill)
# - Tracking card (if shipment exists)

# 5. Write integration tests
touch src/app/admin/orders/[orderId]/__tests__/page.integration.test.tsx

# 6. Commit and push
git add .
git commit -m "feat(orders): rebuild order details page

- Implement simple two-column layout
- Display order items with pricing breakdown
- Show customer and address information
- Add status update functionality
- Integrate TrackingCard for shipments
- Add quick action buttons
- Handle edge cases (guest orders, deleted products)"

git push origin feature/order-details-page

# 7. Create PR
gh pr create
```

---

#### Phase 5: Cleanup (1 hour)

```bash
# 1. Create branch
git checkout -b chore/order-management-cleanup

# 2. Update navigation
# Edit src/components/admin/layout/Sidebar.tsx
# Remove old fulfillment and export page links

# 3. Delete old files (after 1-2 weeks of production validation)
rm src/app/admin/orders/page.tsx.OLD
rm src/app/admin/orders/[orderId]/page.tsx.OLD
rm -rf src/app/admin/orders/fulfillment/ # If exists
rm -rf src/app/admin/orders/export/ # If exists

# 4. Commit
git add .
git commit -m "chore(orders): remove legacy order management code

- Remove old order list and details pages
- Delete fulfillment and export pages
- Update navigation to remove legacy links
- Clean up unused imports"

git push origin chore/order-management-cleanup

# 5. Create PR
gh pr create
```

---

## Component Development with Storybook

### Setup Storybook (if not already installed)

```bash
# Install Storybook
npx storybook@latest init

# Start Storybook
npm run storybook
# Opens at http://localhost:6006
```

### Creating Stories

#### Example: OrderStatusBadge Story

```typescript
// src/components/admin/orders/OrderStatusBadge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ORDER_STATUSES, PAYMENT_STATUSES, SHIPMENT_STATUSES } from '@/lib/constants/order';

const meta: Meta<typeof OrderStatusBadge> = {
  title: 'Admin/Orders/OrderStatusBadge',
  component: OrderStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['order', 'payment', 'shipment'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showIcon: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrderStatusBadge>;

// All order statuses
export const AllOrderStatuses: Story = {
  render: () => (
    <div className="space-y-2">
      {Object.values(ORDER_STATUSES).map((status) => (
        <OrderStatusBadge
          key={status.value}
          status={status.value}
          type="order"
        />
      ))}
    </div>
  ),
};

// All payment statuses
export const AllPaymentStatuses: Story = {
  render: () => (
    <div className="space-y-2">
      {Object.values(PAYMENT_STATUSES).map((status) => (
        <OrderStatusBadge
          key={status.value}
          status={status.value}
          type="payment"
        />
      ))}
    </div>
  ),
};

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <div className="space-y-2">
      <OrderStatusBadge status="PAID" type="order" size="sm" />
      <OrderStatusBadge status="PAID" type="order" size="md" />
      <OrderStatusBadge status="PAID" type="order" size="lg" />
    </div>
  ),
};

// With and without icon
export const WithIcon: Story = {
  args: {
    status: 'PAID',
    type: 'order',
    showIcon: true,
  },
};

export const WithoutIcon: Story = {
  args: {
    status: 'PAID',
    type: 'order',
    showIcon: false,
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    status: 'PAID',
    type: 'order',
    size: 'md',
    showIcon: true,
  },
};
```

### Benefits of Storybook

1. **Visual Testing** - See component in isolation
2. **Documentation** - Auto-generated docs from props
3. **Faster Development** - No need to navigate through app
4. **Component Catalog** - All components in one place
5. **Accessibility Testing** - Use axe addon to test a11y

---

## Debugging Tips

### TypeScript Errors

```bash
# Check for type errors
npm run typecheck

# Watch mode for continuous checking
npx tsc --watch --noEmit
```

**Common Issues:**
- Missing type definitions: `npm install @types/[package-name]`
- Prisma types not generated: `npx prisma generate`
- Import path errors: Use `@/` alias for absolute imports

---

### API Debugging

#### Enable API Logging

```typescript
// lib/logger.ts
export const logger = {
  api: (method: string, url: string, status: number, duration: number) => {
    console.log(`[API] ${method} ${url} - ${status} (${duration}ms)`);
  },
  error: (context: string, error: any) => {
    console.error(`[ERROR] ${context}:`, error);
  },
};

// Use in API routes
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    // ... API logic
    logger.api('GET', '/api/orders', 200, Date.now() - start);
  } catch (error) {
    logger.error('GET /api/orders', error);
  }
}
```

#### Test API with curl

```bash
# Get orders
curl -X GET http://localhost:3000/api/orders \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Update order status
curl -X PATCH http://localhost:3000/api/orders/ord_123/status \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"status":"PAID","paymentStatus":"PAID"}'
```

---

### Database Debugging

#### View Prisma Queries

```typescript
// Enable query logging in prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

#### Inspect Database

```bash
# Open Prisma Studio
npx prisma studio
# Opens at http://localhost:5555

# Or use psql
psql ecomjrm

# View orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

# Check order counts by status
SELECT status, COUNT(*) FROM orders GROUP BY status;
```

---

### React DevTools

Install React DevTools browser extension:
- Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

**Usage:**
1. Open browser DevTools (F12)
2. Navigate to "Components" tab
3. Inspect component props, state, hooks
4. Use "Profiler" tab to identify performance issues

---

## Code Review Guidelines

### PR Review Checklist

#### Code Quality
- [ ] Code follows CLAUDE.md principles
- [ ] No `any` types used
- [ ] All functions have JSDoc comments
- [ ] No `console.log` statements (use proper logger)
- [ ] No hardcoded values (use constants or env vars)
- [ ] Single source of truth maintained
- [ ] DRY principle applied

#### TypeScript
- [ ] TypeScript strict mode passing (`npm run typecheck`)
- [ ] Proper type definitions for all props and functions
- [ ] No type assertions (`as any`) unless absolutely necessary
- [ ] Enums used correctly (from Prisma schema)

#### Testing
- [ ] Unit tests added for new functions/utilities
- [ ] Component tests added for new components
- [ ] Integration tests for API routes
- [ ] All tests passing (`npm test`)
- [ ] Test coverage meets minimum requirements (80%+)

#### Accessibility
- [ ] ARIA labels added where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader tested (if possible)

#### Performance
- [ ] No unnecessary re-renders
- [ ] Expensive computations memoized
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Bundle size impact acceptable

#### Standards Compliance
- [ ] Follows ORDER_MANAGEMENT_REDESIGN_PLAN.md
- [ ] Implements ORDER_MANAGEMENT_TECHNICAL_SPEC.md correctly
- [ ] Passes ORDER_MANAGEMENT_QA_SPEC.md requirements
- [ ] No deviations from approved design without discussion

#### Documentation
- [ ] Code comments added for complex logic
- [ ] JSDoc comments for exported functions
- [ ] README updated if needed
- [ ] Storybook stories added for components

---

### Giving Good Feedback

**✅ Good Feedback:**
> "The `getStatusBadge` function works well, but it returns a default for unknown statuses. Consider adding a type guard to ensure only valid statuses are passed, or log a warning when an unknown status is encountered for debugging. Reference: ORDER_MANAGEMENT_TECHNICAL_SPEC.md line 245."

**❌ Poor Feedback:**
> "This doesn't look right."

**Feedback Guidelines:**
- Be specific (reference line numbers, function names)
- Explain the "why" (not just the "what")
- Provide references (docs, best practices)
- Suggest solutions (not just problems)
- Be constructive and respectful

---

## Deployment Checklist

### Pre-Deployment

- [ ] All PRs merged to `main` branch
- [ ] All tests passing in CI/CD
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Bundle size acceptable (check Next.js build output)
- [ ] Environment variables configured on production server
- [ ] Database migrations ready (`npx prisma migrate deploy`)

### Deployment Steps

```bash
# 1. Ensure main branch is up to date
git checkout main
git pull origin main

# 2. Build production bundle locally (test)
npm run build

# 3. Test production build locally
npm start
# Verify at http://localhost:3000

# 4. Deploy to production (example with Vercel)
vercel --prod

# OR deploy via CI/CD pipeline
git push origin main
# CI/CD will automatically deploy
```

### Post-Deployment Validation

- [ ] Verify order list page loads (`/admin/orders`)
- [ ] Test status filtering (all tabs)
- [ ] Test search functionality
- [ ] Test order details page
- [ ] Test status updates
- [ ] Test invoice generation
- [ ] Test fulfillment workflow
- [ ] Check for JavaScript errors in browser console
- [ ] Verify Sentry (or error tracking) is working
- [ ] Monitor performance metrics (Core Web Vitals)
- [ ] Check database query performance
- [ ] Verify API response times

### Rollback Plan

If issues are detected:

```bash
# 1. Rollback to previous deployment (Vercel example)
vercel rollback

# 2. OR revert Git commit
git revert HEAD
git push origin main

# 3. Restore old pages from .OLD backups (emergency)
mv src/app/admin/orders/page.tsx src/app/admin/orders/page.tsx.NEW
mv src/app/admin/orders/page.tsx.OLD src/app/admin/orders/page.tsx
git add .
git commit -m "hotfix: rollback to old order management"
git push origin main
```

---

### Monitoring After Deployment

**First 24 Hours:**
- Check error logs every 2 hours
- Monitor user feedback
- Watch performance metrics
- Verify all order operations work

**First Week:**
- Daily error log review
- Collect admin user feedback
- Monitor API response times
- Check database query performance

**After 1-2 Weeks:**
- If all stable, proceed with Phase 5 cleanup
- Delete old `.OLD` backup files
- Remove old fulfillment/export pages

---

## Summary

This development guide provides:

✅ **Local setup** - Step-by-step environment configuration
✅ **Git workflow** - Branching strategy and commit conventions
✅ **Development workflow** - Phase-by-phase implementation steps
✅ **Storybook** - Component development and visual testing
✅ **Debugging tips** - TypeScript, API, database, React DevTools
✅ **Code review** - Comprehensive checklist and feedback guidelines
✅ **Deployment** - Pre/post deployment checklists and rollback plan

**Quick Links:**
- Technical Spec: `ORDER_MANAGEMENT_TECHNICAL_SPEC.md`
- QA Spec: `ORDER_MANAGEMENT_QA_SPEC.md`
- Integration Plan: `ORDER_MANAGEMENT_INTEGRATION_PLAN.md`
- Design Plan: `ORDER_MANAGEMENT_REDESIGN_PLAN.md`

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Status:** Complete ✅
