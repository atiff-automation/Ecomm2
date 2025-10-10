# Improvement Roadmap - JRM E-commerce Platform

**Generated:** 2025-10-10
**Based on:** Phase 5 QA Assessment
**Status:** 🎯 ACTION PLAN

---

## Executive Summary

This roadmap addresses the **critical gaps** identified in Phase 5 QA:
1. **Unit Test Coverage:** 1.6% → Target: 80%
2. **Technical Debt:** 15 TODOs
3. **Test Infrastructure:** 10 failing tests
4. **Code Quality:** Missing documentation files

**Timeline:** 4 sprints (8 weeks)
**Priority:** HIGH - Technical debt reduction

---

## 🔴 SPRINT 1: Quick Wins (Week 1-2)

**Goal:** Fix immediate issues and establish testing foundation
**Success Metrics:** All tests passing, coverage at 20%

### Task 1.1: Fix Failing Tests (Priority: CRITICAL)
**Time:** 1 day | **Complexity:** Low | **Impact:** HIGH

#### Fix TextDecoder Polyfill
```bash
# File: jest.setup.js
# Add after Response polyfill:

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
  global.TextEncoder = require('util').TextEncoder;
}
```

**Expected Result:** 4 react-email tests will pass

---

#### Fix Service Mocks
```bash
# Create: src/lib/__mocks__/services.ts

export const mockEmailService = {
  sendAgentApplicationConfirmation: jest.fn(),
  sendAgentApplicationStatusUpdate: jest.fn(),
  notifyAdminsOfNewAgentApplication: jest.fn(),
};

export const mockPaymentService = {
  createBill: jest.fn(),
  verifyPayment: jest.fn(),
};
```

**Files to Update:**
- `src/lib/services/__tests__/agent-application.service.test.ts`
- `src/lib/services/__tests__/payment-gateway.service.test.ts`

**Expected Result:** 4 service mock tests will pass

---

#### Fix React act() Warnings
```bash
# Wrap state updates in act():

import { act } from '@testing-library/react';

// Before:
await user.click(submitButton);

// After:
await act(async () => {
  await user.click(submitButton);
});
```

**Expected Result:** 2 React tests will pass

**Total Impact:** 10 failing tests → 0 failing tests ✅

---

### Task 1.2: Establish Unit Testing Foundation (Priority: HIGH)
**Time:** 3 days | **Complexity:** Medium | **Impact:** HIGH

#### Create Testing Standards Document
```markdown
# File: claudedocs/TESTING_STANDARDS.md

## Unit Testing Requirements
- Every service must have 80%+ coverage
- Every utility function must have 100% coverage
- Test file naming: `*.test.ts` or `*.spec.ts`
- Place tests in `__tests__` directory next to source

## Test Structure
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle success case', () => {});
    it('should handle error case', () => {});
    it('should validate input', () => {});
  });
});
```

---

#### Add Unit Tests for High-Priority Services
**Target Coverage:** 20% overall

**Priority 1: Critical Business Logic**
1. `src/lib/services/pricing-service.ts` (0% → 80%)
   - Test member pricing calculation
   - Test promotional pricing logic
   - Test tax calculations

2. `src/lib/utils/currency.ts` (15% → 100%)
   - Test currency formatting
   - Test price conversions
   - Test rounding logic

3. `src/lib/utils/date.ts` (12% → 100%)
   - Test date formatting
   - Test timezone handling
   - Test date calculations

**Test Template:**
```typescript
// src/lib/services/__tests__/pricing-service.test.ts
import { PricingService } from '../pricing-service';

describe('PricingService', () => {
  describe('calculateMemberPrice', () => {
    it('should apply member discount correctly', () => {
      const result = PricingService.calculateMemberPrice({
        regularPrice: 100,
        memberDiscount: 10,
      });
      expect(result).toBe(90);
    });

    it('should handle promotional pricing', () => {
      const result = PricingService.calculateMemberPrice({
        regularPrice: 100,
        memberDiscount: 10,
        promotionalPrice: 80,
      });
      expect(result).toBe(80); // Promotional takes precedence
    });

    it('should validate input prices', () => {
      expect(() => {
        PricingService.calculateMemberPrice({
          regularPrice: -100,
        });
      }).toThrow('Price must be positive');
    });
  });
});
```

**Sprint 1 Target:** 1.6% → 20% coverage (+18.4%)

---

### Task 1.3: Setup Test Coverage Enforcement (Priority: HIGH)
**Time:** 2 hours | **Complexity:** Low | **Impact:** MEDIUM

#### Update Jest Configuration
```javascript
// jest.config.js
module.exports = {
  // Existing config...

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/**/types/**',
  ],

  coverageThreshold: {
    global: {
      statements: 20, // Start at 20%, increase incrementally
      branches: 15,
      functions: 20,
      lines: 20,
    },
    // Critical services require higher coverage
    './src/lib/services/pricing-service.ts': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/lib/utils/currency.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
```

#### Add Pre-commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run typecheck
npm test -- --coverage --passWithNoTests
```

---

## 🟡 SPRINT 2: Service Layer Coverage (Week 3-4)

**Goal:** Achieve 40% overall coverage by testing service layer
**Success Metrics:** Coverage at 40%, all services tested

### Task 2.1: Test Authentication & Authorization (Priority: HIGH)
**Time:** 2 days | **Impact:** HIGH

**Files to Test:**
1. `src/lib/services/auth-service.ts` (0% → 80%)
   - Login validation
   - Password hashing
   - Session management
   - JWT token generation

2. `src/lib/auth/authorization.ts` (0% → 80%)
   - Role checking
   - Permission validation
   - Admin verification

**Test Example:**
```typescript
// src/lib/services/__tests__/auth-service.test.ts
describe('AuthService', () => {
  describe('validateLogin', () => {
    it('should validate correct credentials', async () => {
      const result = await AuthService.validateLogin({
        email: 'test@example.com',
        password: 'validPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid password', async () => {
      const result = await AuthService.validateLogin({
        email: 'test@example.com',
        password: 'wrongPassword',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle non-existent user', async () => {
      const result = await AuthService.validateLogin({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });
});
```

---

### Task 2.2: Test Payment & Order Services (Priority: HIGH)
**Time:** 3 days | **Impact:** HIGH

**Files to Test:**
1. `src/lib/services/payment-gateway.service.ts` (0% → 80%)
   - Bill creation
   - Payment verification
   - Webhook handling

2. `src/lib/payment/toyyibpay-service.ts` (0% → 80%)
   - ToyyibPay integration
   - Payment status polling
   - Error handling

3. `src/lib/services/pricing-service.ts` (0% → 80%)
   - Price calculations
   - Tax computation
   - Discount application

**Test Coverage Priority:**
- ✅ Happy path (normal flow)
- ✅ Error cases (API failures)
- ✅ Edge cases (null values, invalid input)
- ✅ Boundary conditions (min/max values)

---

### Task 2.3: Test Shipping & Tracking (Priority: MEDIUM)
**Time:** 2 days | **Impact:** MEDIUM

**Files to Test:**
1. `src/lib/shipping/easyparcel-service.ts` (0% → 70%)
   - Rate calculation
   - Booking creation
   - Tracking updates

2. `src/lib/services/tracking-cache.ts` (0% → 80%)
   - Cache operations
   - Cache invalidation
   - Performance optimization

**Sprint 2 Target:** 20% → 40% coverage (+20%)

---

## 🟢 SPRINT 3: Utility & Security Coverage (Week 5-6)

**Goal:** Achieve 60% overall coverage
**Success Metrics:** All utilities tested, security modules verified

### Task 3.1: Test Security Modules (Priority: CRITICAL)
**Time:** 3 days | **Impact:** CRITICAL

**Files to Test:**
1. `src/lib/security/input-validation.ts` (0% → 100%)
   - SQL injection prevention
   - XSS protection
   - Input sanitization

2. `src/lib/security/encryption.ts` (0% → 100%)
   - Data encryption
   - Decryption
   - Key management

3. `src/lib/security/rate-limiter.ts` (0% → 80%)
   - Rate limit enforcement
   - Redis integration
   - Bypass rules

**Security Test Template:**
```typescript
describe('Input Validation', () => {
  describe('SQL Injection Prevention', () => {
    it('should block SQL injection attempts', () => {
      const malicious = "'; DROP TABLE users; --";
      expect(() => {
        validateInput(malicious);
      }).toThrow('Invalid input detected');
    });

    it('should allow safe input', () => {
      const safe = "John O'Brien";
      expect(() => {
        validateInput(safe);
      }).not.toThrow();
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize script tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
    });
  });
});
```

---

### Task 3.2: Test Utility Functions (Priority: HIGH)
**Time:** 2 days | **Impact:** MEDIUM

**Files to Test:**
1. `src/lib/utils/format.ts` (0% → 100%)
2. `src/lib/utils/validation.ts` (0% → 100%)
3. `src/lib/utils/string.ts` (0% → 100%)
4. `src/lib/utils/array.ts` (0% → 100%)

**Utilities are easiest to test - aim for 100% coverage**

---

### Task 3.3: Test Error Handling (Priority: HIGH)
**Time:** 1 day | **Impact:** MEDIUM

**Files to Test:**
1. `src/lib/utils/error-handling.ts` (0% → 80%)
2. `src/lib/monitoring/error-logger.ts` (0% → 80%)

**Sprint 3 Target:** 40% → 60% coverage (+20%)

---

## 🔵 SPRINT 4: Comprehensive Coverage (Week 7-8)

**Goal:** Achieve 80% overall coverage
**Success Metrics:** Production-ready test suite

### Task 4.1: Test Remaining Services (Priority: MEDIUM)
**Time:** 3 days | **Impact:** MEDIUM

**Files to Test:**
1. `src/lib/services/membership-service.ts` (0% → 80%)
2. `src/lib/services/cart-service.ts` (0% → 80%)
3. `src/lib/services/product-service.ts` (0% → 80%)
4. `src/lib/services/category-service.ts` (0% → 80%)

---

### Task 4.2: Test Integration Points (Priority: MEDIUM)
**Time:** 2 days | **Impact:** MEDIUM

**Areas to Test:**
1. Database operations (Prisma queries)
2. External API integrations
3. Email service integration
4. Cache layer (Redis)

---

### Task 4.3: Performance & Load Testing (Priority: LOW)
**Time:** 2 days | **Impact:** LOW

**Setup:**
1. Artillery.io for load testing
2. Performance benchmarks
3. Memory leak detection

**Sprint 4 Target:** 60% → 80% coverage (+20%)

---

## 📋 Technical Debt Resolution

### Category A: Feature Enhancements (Sprint 2-3)

#### 1. Notification System Enhancements
**Priority:** MEDIUM | **Time:** 1 week

```typescript
// Add to User model
model User {
  // ... existing fields
  languagePreference String @default("en")
  pushNotificationsEnabled Boolean @default(false)
  inAppNotificationsEnabled Boolean @default(false)
}

// Implement NotificationService
export class NotificationService {
  async sendPushNotification(userId: string, notification: Notification) {
    // Implement with Firebase Cloud Messaging or similar
  }

  async sendInAppNotification(userId: string, notification: Notification) {
    // Implement with real-time updates
  }
}
```

---

#### 2. Custom Receipt Template Data
**Priority:** LOW | **Time:** 2 days

```typescript
// File: src/lib/services/receipt-templates/custom-data.ts
export interface CustomReceiptData {
  companyLogo?: string;
  customFields?: Record<string, string>;
  additionalNotes?: string;
}

export function generateCustomReceipt(
  order: Order,
  customData: CustomReceiptData
): ReceiptData {
  // Implementation
}
```

---

### Category B: Integration Improvements (Sprint 2)

#### 3. Admin Session Invalidation
**Priority:** HIGH | **Time:** 1 day

```typescript
// File: src/app/api/superadmin/settings/admins/[id]/deactivate/route.ts

export async function POST(req: Request) {
  // ... existing code

  // Invalidate all sessions for this admin
  await prisma.session.deleteMany({
    where: { userId: adminId },
  });

  // Clear Redis cache
  await redis.del(`user:${adminId}:*`);

  return NextResponse.json({ success: true });
}
```

---

#### 4. Sentry Error Tracking Integration
**Priority:** HIGH | **Time:** 1 day

```typescript
// File: src/lib/monitoring/error-logger.ts

import * as Sentry from '@sentry/nextjs';

export class ErrorLogger {
  static logError(error: Error, context?: Record<string, any>) {
    // Log to console (already implemented)
    console.error(error);

    // Send to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  }
}
```

---

#### 5. Email Service for Password Reset
**Priority:** MEDIUM | **Time:** 2 days

```typescript
// File: src/lib/email/templates/password-reset.tsx

export const PasswordResetEmail = ({ resetLink, userName }) => (
  <Html>
    <Body>
      <h1>Password Reset Request</h1>
      <p>Hi {userName},</p>
      <p>Click the link below to reset your password:</p>
      <a href={resetLink}>Reset Password</a>
      <p>This link expires in 1 hour.</p>
    </Body>
  </Html>
);

// Update API route
export async function POST(req: Request) {
  // ... generate reset token

  // Send email
  await emailService.sendPasswordResetEmail({
    to: user.email,
    resetToken,
    userName: user.firstName,
  });
}
```

---

### Category C: Configuration Restoration (Sprint 3)

#### 6. Restore Shipping Configuration
**Priority:** LOW | **Time:** 1 day

```bash
# Create migration to restore shipping config
npx prisma migrate dev --name restore_shipping_config

# Update orders API
# File: src/app/api/orders/route.ts
import { shippingConfig } from '@/lib/shipping/config';

export async function POST(req: Request) {
  // Restore shipping config logic
}
```

---

## 📚 Documentation Improvements

### Create Missing Documentation

#### 1. QA_SPEC.md (Priority: MEDIUM | Time: 4 hours)
```markdown
# Quality Assurance Specification

## Testing Standards
- Unit test coverage: 80% minimum
- Integration test coverage: 95% minimum
- E2E test coverage: All critical paths

## Test Execution Requirements
- All tests must pass before deployment
- Performance benchmarks must be met
- Security scans must show no critical issues

## Continuous Integration
- Tests run on every PR
- Coverage reports generated automatically
- Performance regression detection
```

---

#### 2. DEV_GUIDE.md (Priority: HIGH | Time: 1 day)
```markdown
# Developer Guide - JRM E-commerce Platform

## Getting Started
1. Clone repository
2. Install dependencies: `npm install`
3. Setup database: `npm run db:migrate`
4. Seed data: `npm run db:seed`
5. Start dev server: `npm run dev`

## Project Structure
- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/lib` - Business logic and utilities
- `/tests` - Test suites

## Testing Guidelines
- Write tests for all new features
- Follow testing standards in TESTING_STANDARDS.md
- Run tests before committing: `npm test`

## Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting

## Git Workflow
- Create feature branches
- Write descriptive commit messages
- Submit PRs with tests
```

---

## 🎯 Quick Wins (Can Start Today)

### Immediate Actions (Day 1)

#### 1. Fix TextDecoder Polyfill (30 minutes)
```bash
# Edit jest.setup.js
# Add TextDecoder/TextEncoder polyfills
# Run: npm test
# Expected: 4 more tests passing
```

#### 2. Setup Coverage Thresholds (30 minutes)
```bash
# Edit jest.config.js
# Set initial threshold to 20%
# Add coverage enforcement
# Run: npm test -- --coverage
```

#### 3. Create Testing Standards Doc (1 hour)
```bash
# Create claudedocs/TESTING_STANDARDS.md
# Document unit testing requirements
# Share with team
```

#### 4. Add Pre-commit Hook (30 minutes)
```bash
# Install husky
npm install husky --save-dev
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm test"
```

**Total Time:** 2.5 hours
**Impact:** Immediate improvement in code quality

---

## 📊 Coverage Progression Plan

### Incremental Targets

| Sprint | Week | Target | Focus Area | Expected Tests |
|--------|------|--------|------------|----------------|
| 1 | 1-2 | 20% | Fix failures + Critical utils | +50 tests |
| 2 | 3-4 | 40% | Service layer (auth, payment, shipping) | +150 tests |
| 3 | 5-6 | 60% | Security + Utilities | +100 tests |
| 4 | 7-8 | 80% | Remaining services + Integration | +200 tests |

**Total New Tests:** ~500 unit tests
**Timeline:** 8 weeks
**Final Coverage:** 80%+

---

## 🔧 Tools & Infrastructure

### Install Testing Tools

```bash
# Testing utilities
npm install --save-dev @testing-library/react@latest
npm install --save-dev @testing-library/user-event@latest
npm install --save-dev @testing-library/jest-dom@latest

# Coverage reporting
npm install --save-dev jest-coverage-badges

# Mock utilities
npm install --save-dev jest-mock-extended
npm install --save-dev msw # Mock Service Worker for API mocking

# Performance testing
npm install --save-dev artillery
npm install --save-dev autocannon

# Security scanning
npm install --save-dev @snyk/cli
```

---

### Setup CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - run: npm run test:e2e

      # Upload coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      # Fail if coverage drops
      - name: Coverage check
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage is below 80%: $COVERAGE%"
            exit 1
          fi
```

---

## 💡 Best Practices to Adopt

### 1. Test-Driven Development (TDD)
```typescript
// Write test FIRST
describe('calculateDiscount', () => {
  it('should apply 10% member discount', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });
});

// THEN implement
export function calculateDiscount(price: number, discount: number): number {
  return price * (1 - discount / 100);
}
```

### 2. Test Naming Convention
```typescript
// Good ✅
it('should return 404 when product not found', () => {});
it('should apply member discount to regular price', () => {});

// Bad ❌
it('test product', () => {});
it('discount works', () => {});
```

### 3. AAA Pattern (Arrange, Act, Assert)
```typescript
it('should create order successfully', async () => {
  // Arrange
  const orderData = { items: [...], userId: '123' };

  // Act
  const result = await createOrder(orderData);

  // Assert
  expect(result.status).toBe('PENDING');
  expect(result.items).toHaveLength(2);
});
```

### 4. Mock External Dependencies
```typescript
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock API calls
jest.mock('axios');
```

---

## 📈 Success Metrics

### Weekly KPIs

| Metric | Current | Week 2 | Week 4 | Week 6 | Week 8 |
|--------|---------|--------|--------|--------|--------|
| Unit Coverage | 1.6% | 20% | 40% | 60% | 80% |
| Passing Tests | 95.9% | 100% | 100% | 100% | 100% |
| TODOs | 15 | 10 | 5 | 2 | 0 |
| Build Time | 3.5min | 3.5min | 4min | 4.5min | 5min |
| Test Runtime | 2.7min | 3min | 4min | 5min | 6min |

### Quality Gates

**Before Merging PR:**
- ✅ All tests pass
- ✅ Coverage doesn't decrease
- ✅ No new linting errors
- ✅ Type check passes
- ✅ Build succeeds

**Before Deploying:**
- ✅ E2E tests pass
- ✅ Performance benchmarks met
- ✅ Security scan passes
- ✅ Manual QA approval

---

## 🎓 Training & Resources

### Team Training (Week 1)

#### Workshop 1: Testing Fundamentals (2 hours)
- Unit vs Integration vs E2E tests
- AAA pattern
- Mock vs Stub vs Spy
- Coverage metrics

#### Workshop 2: Test Writing Session (3 hours)
- Live coding: Write tests together
- Review existing tests
- Q&A session

### Resources
- [Testing Library Docs](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

## 🚀 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Fix 10 failing tests
- [ ] Add TextDecoder polyfill
- [ ] Fix service mocks
- [ ] Fix React act() warnings
- [ ] Setup coverage thresholds
- [ ] Add pre-commit hooks
- [ ] Create TESTING_STANDARDS.md
- [ ] Test 3 critical utilities

### Phase 2: Service Layer (Week 3-4)
- [ ] Test auth service (80% coverage)
- [ ] Test payment service (80% coverage)
- [ ] Test pricing service (80% coverage)
- [ ] Test shipping service (70% coverage)
- [ ] Test tracking cache (80% coverage)
- [ ] Reach 40% overall coverage

### Phase 3: Security & Utils (Week 5-6)
- [ ] Test all security modules (100% coverage)
- [ ] Test all utility functions (100% coverage)
- [ ] Test error handling (80% coverage)
- [ ] Reach 60% overall coverage

### Phase 4: Comprehensive (Week 7-8)
- [ ] Test remaining services
- [ ] Test integration points
- [ ] Setup load testing
- [ ] Reach 80% overall coverage
- [ ] Address all TODOs
- [ ] Create missing documentation

---

## 💰 Resource Allocation

### Team Requirements
- 1 Senior Developer (Testing Lead) - Full-time
- 2 Mid-level Developers - 50% time
- 1 QA Engineer - 25% time

### Budget Estimate
- Developer time: 8 weeks × 2.5 FTE = 20 person-weeks
- Tools & infrastructure: $500/month
- Training: $1,000 (one-time)
- **Total:** ~20 person-weeks + $1,500

---

## 📞 Support & Questions

### Who to Ask
- **Testing Strategy:** Tech Lead
- **Coverage Issues:** Senior Developer
- **Tool Setup:** DevOps Team
- **Best Practices:** QA Engineer

### Regular Check-ins
- Daily: Quick coverage review
- Weekly: Sprint retrospective
- Bi-weekly: Coverage deep dive
- Monthly: Strategy adjustment

---

**Roadmap Version:** 1.0
**Last Updated:** 2025-10-10
**Next Review:** End of Sprint 1
