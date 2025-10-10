# Quick Start: Immediate Improvements

**Get started TODAY** - Fix critical issues in less than 3 hours

---

## 🚀 Step 1: Fix Failing Tests (30 minutes)

### Fix #1: Add TextDecoder Polyfill

**File:** `jest.setup.js`

Add this code after the Response polyfill (around line 39):

```javascript
// Add after Response polyfill
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
  global.TextEncoder = require('util').TextEncoder;
}
```

**Test it:**
```bash
npm test
```

**Expected Result:** 4 more tests will pass ✅

---

### Fix #2: Wrap React Updates in act()

**Files to update:**
- Any test file with "act() warnings"

**Find and replace:**
```javascript
// BEFORE:
await user.click(submitButton);
fireEvent.click(button);

// AFTER:
import { act } from '@testing-library/react';

await act(async () => {
  await user.click(submitButton);
});

act(() => {
  fireEvent.click(button);
});
```

**Expected Result:** 2 more tests will pass ✅

---

## 📊 Step 2: Setup Coverage Enforcement (30 minutes)

### Update Jest Config

**File:** `jest.config.js`

Replace the coverageThreshold section:

```javascript
module.exports = {
  // ... existing config

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/**/types/**',
  ],

  coverageThreshold: {
    global: {
      statements: 20,
      branches: 15,
      functions: 20,
      lines: 20,
    },
  },
};
```

**Test it:**
```bash
npm test -- --coverage
```

**Expected:** Build will fail if coverage drops below 20%

---

## 🎯 Step 3: Write Your First Unit Tests (1 hour)

### Test Example #1: Currency Utility

**Create:** `src/lib/utils/__tests__/currency.test.ts`

```typescript
import { formatCurrency, calculateDiscount } from '../currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format MYR currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('RM 1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('RM 0.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('RM 11.00');
    });
  });

  describe('calculateDiscount', () => {
    it('should apply percentage discount', () => {
      const result = calculateDiscount(100, 10);
      expect(result).toBe(90);
    });

    it('should handle 0% discount', () => {
      const result = calculateDiscount(100, 0);
      expect(result).toBe(100);
    });

    it('should throw on invalid discount', () => {
      expect(() => calculateDiscount(100, -10)).toThrow();
      expect(() => calculateDiscount(100, 101)).toThrow();
    });
  });
});
```

**Run tests:**
```bash
npm test -- currency.test.ts
```

**Expected:** 6 new tests passing, coverage increased by ~2%

---

### Test Example #2: Date Utility

**Create:** `src/lib/utils/__tests__/date.test.ts`

```typescript
import { formatDate, isExpired, addDays } from '../date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date in Malaysian format', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('15/01/2025');
    });

    it('should handle invalid date', () => {
      expect(() => formatDate(null)).toThrow('Invalid date');
    });
  });

  describe('isExpired', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isExpired(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isExpired(futureDate)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2025-01-01');
      const result = addDays(date, 7);
      expect(result.getDate()).toBe(8);
    });
  });
});
```

**Run tests:**
```bash
npm test -- date.test.ts
```

**Expected:** 5 new tests passing, coverage increased by ~2%

---

### Test Example #3: Order Utility (Already has 100% coverage!)

**File:** `src/lib/utils/__tests__/order.test.ts`

✅ This file already exists with excellent coverage!

Review it to understand good test patterns:
```bash
cat src/lib/utils/__tests__/order.test.ts
```

---

## 🔧 Step 4: Setup Pre-commit Hook (15 minutes)

### Install Husky

```bash
npm install husky --save-dev
npx husky install
```

### Create Pre-commit Hook

```bash
npx husky add .husky/pre-commit "npm run lint && npm test -- --passWithNoTests"
```

### Make it executable

```bash
chmod +x .husky/pre-commit
```

### Test it

```bash
git add .
git commit -m "test: pre-commit hook"
```

**Expected:** Tests run automatically before commit ✅

---

## 📋 Step 5: Create Testing Standards Doc (30 minutes)

**Create:** `claudedocs/TESTING_STANDARDS.md`

```markdown
# Testing Standards - JRM E-commerce Platform

## Required Coverage
- **New Code:** 80% minimum coverage
- **Utilities:** 100% coverage
- **Services:** 80% coverage
- **Components:** 70% coverage

## Test Structure
```typescript
describe('ComponentName', () => {
  describe('functionName', () => {
    it('should handle success case', () => {
      // Test implementation
    });

    it('should handle error case', () => {
      // Test implementation
    });

    it('should validate input', () => {
      // Test implementation
    });
  });
});
```

## Naming Convention
- Test files: `*.test.ts` or `*.spec.ts`
- Location: `__tests__` directory next to source
- Example: `src/lib/utils/__tests__/currency.test.ts`

## AAA Pattern (Arrange, Act, Assert)
```typescript
it('should calculate total price correctly', () => {
  // Arrange
  const items = [{ price: 10, quantity: 2 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(20);
});
```

## What to Test
- ✅ Happy path (normal flow)
- ✅ Error cases (invalid input, API failures)
- ✅ Edge cases (null, undefined, empty)
- ✅ Boundary conditions (min/max values)

## What NOT to Test
- ❌ External libraries (trust them)
- ❌ Framework code (trust Next.js, React)
- ❌ Type definitions
- ❌ Configuration files

## Mock External Dependencies
```typescript
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));
```

## Run Tests Before Commit
```bash
npm test -- --passWithNoTests
```
```

---

## ✅ Verification Checklist

After completing all steps, verify:

```bash
# 1. All tests pass
npm test
# Expected: 236-240 passing tests

# 2. Coverage is tracking
npm test -- --coverage
# Expected: ~5-10% coverage (up from 1.6%)

# 3. Lint passes
npm run lint
# Expected: No errors

# 4. Type check passes
npm run typecheck
# Expected: Build succeeds

# 5. Pre-commit hook works
git add .
git commit -m "test: verify hooks"
# Expected: Tests run automatically
```

---

## 📊 Expected Impact

### Before Quick Start:
- ❌ 10 failing tests
- ❌ 1.6% coverage
- ❌ No coverage enforcement
- ❌ No testing standards

### After Quick Start:
- ✅ 6-8 failing tests (60-80% reduction)
- ✅ 5-10% coverage (3-6x improvement)
- ✅ Coverage enforcement enabled
- ✅ Testing standards documented
- ✅ Pre-commit hooks active
- ✅ 11+ new unit tests written

**Total Time:** 2.5-3 hours
**Difficulty:** Beginner-friendly
**Impact:** IMMEDIATE

---

## 🎯 Next Steps

Once you complete the Quick Start, continue with:

### Week 1 Priorities:
1. Write tests for `pricing-service.ts` (80% coverage)
2. Write tests for `auth-service.ts` (80% coverage)
3. Write tests for all security modules (100% coverage)

### Week 2 Priorities:
1. Fix remaining 4-6 failing tests
2. Reach 20% overall coverage
3. Setup CI/CD pipeline

**Full roadmap:** See `IMPROVEMENT_ROADMAP.md`

---

## 💡 Pro Tips

### Tip #1: Test One File at a Time
```bash
# Run tests for specific file
npm test -- currency.test.ts

# Watch mode for active development
npm test -- --watch currency.test.ts
```

### Tip #2: Use Coverage to Find Gaps
```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Tip #3: Start with Pure Functions
- Utilities are easiest to test
- Services require mocking
- Components are most complex

**Recommended order:**
1. Utilities (currency, date, format)
2. Services (auth, payment, pricing)
3. Components (forms, cards, modals)

### Tip #4: Copy Good Examples
Look at existing test files:
- `src/lib/utils/__tests__/order.test.ts` (100% coverage!)
- `src/lib/validation/__tests__/agent-application.test.ts` (65% coverage)

---

## 🆘 Troubleshooting

### Issue: "Cannot find module '@testing-library/jest-dom'"
**Solution:**
```bash
npm install --save-dev @testing-library/jest-dom@latest
```

### Issue: "ReferenceError: TextDecoder is not defined"
**Solution:** Add polyfill to `jest.setup.js` (Step 1, Fix #1)

### Issue: "Coverage threshold not met"
**Solution:** This is expected! Write more tests or lower threshold temporarily:
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 10, // Lower threshold temporarily
  },
},
```

### Issue: "Tests are slow"
**Solution:** Run specific test files instead of full suite:
```bash
npm test -- currency.test.ts --no-coverage
```

---

## 📚 Resources

### Documentation
- [Jest Docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Coverage Reporting](https://jestjs.io/docs/configuration#coveragethreshold-object)

### Examples in Codebase
- Good: `src/lib/utils/__tests__/order.test.ts`
- Good: `src/lib/validation/__tests__/agent-application.test.ts`
- Pattern: All files ending in `.test.ts`

---

**Start now!** Pick Step 1 and complete it in the next 30 minutes.

**Questions?** Review the full `IMPROVEMENT_ROADMAP.md` for detailed guidance.
