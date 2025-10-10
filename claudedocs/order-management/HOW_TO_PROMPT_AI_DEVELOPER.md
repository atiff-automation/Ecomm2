# How to Prompt AI Developer for Order Management Implementation

**This guide shows you how to instruct an AI developer (like Claude Code) to implement the Order Management system following the complete reading strategy in README.md.**

---

## 📋 Recommended Approach: Phase-by-Phase Prompts

**Why this approach?**
- ✅ Lower risk of incomplete work
- ✅ Checkpoint verification at each milestone
- ✅ Easier to catch and fix issues early
- ✅ AI maintains better context per phase
- ✅ You stay in control of progress

### Phase 0: Pre-Implementation Context

**Copy-paste this prompt:**

```
I need you to implement the Order Management system following the AI Developer Guide in @claudedocs/order-management/README.md

MANDATORY REQUIREMENTS:
1. Follow the "AI Developer Guide (Complete Read Strategy - 100% Coverage)" section exactly
2. Start with Phase 0: Pre-Implementation Context
3. Read ALL specified documentation (607 lines total for Phase 0)
4. Use TodoWrite to track your reading and understanding
5. After reading, provide the checkpoint confirmation

Phase 0 Requirements:
- Read README.md (215 lines) - Complete file
- Read REDESIGN_PLAN.md (392 lines) - Complete file
- Total: 607 lines

After reading, confirm you understand by answering:
"What are we building and why? What are the 2 pages we're creating?"

DO NOT start coding yet. This is a reading and understanding phase only.
```

**Expected AI Response:**
- AI reads both files completely
- AI creates todo list with Phase 0 reading tasks
- AI confirms understanding: "We're building a WooCommerce-inspired order management system with 2 pages (Order List + Order Details), replacing 4 old pages."

**Verification Questions:**
- Did AI read all 607 lines? (Check its responses for content from both files)
- Did AI create a todo list?
- Can AI explain the WooCommerce inspiration?

---

### Phase 1: Foundation Layer

**Copy-paste this prompt:**

```
Good. Now proceed to Phase 1: Foundation Layer.

MANDATORY REQUIREMENTS:
1. Read ALL specified documentation for Phase 1 (3,572 lines total)
2. Use TodoWrite to track reading and implementation tasks
3. Implement COMPLETE foundation layer (no TODOs, no placeholders)
4. Run tests and typecheck before marking complete
5. Provide checkpoint confirmation

Phase 1 Reading Requirements:
- INTEGRATION_PLAN.md (1,630 lines) - Complete file
- DEV_GUIDE.md (942 lines) - Complete file
- IMPLEMENTATION_PATTERNS.md lines 1-500 - Foundation code
- TECHNICAL_SPEC.md lines 1-500 - Base types
- Total: 3,572 lines

Phase 1 Implementation Requirements:
- Create src/lib/constants/order.ts (complete, no TODOs)
- Create src/lib/utils/order.ts (complete, no TODOs)
- Write unit tests for both files
- Run: npm test && npm run typecheck

After completion, confirm by answering:
"What constants did you create? What utility functions did you implement? Did all tests pass?"

RULES:
- NO placeholders or TODO comments
- NO partial implementations
- EVERY function must work completely
- ALL tests must pass before claiming completion
```

**Expected AI Response:**
- AI reads all 3,572 lines
- AI creates complete foundation files with working code
- AI writes and runs tests
- AI confirms: "Created ORDER_STATUS, ORDER_PAYMENT_STATUS constants. Implemented formatOrderNumber(), getOrderStatusColor(), etc. All tests pass."

**Verification Checklist:**
- [ ] Did AI read all 3,572 lines?
- [ ] Do files exist at correct paths?
- [ ] Is there any "TODO" or "Not implemented" in the code?
- [ ] Did AI actually run tests? (Check for test output)
- [ ] Can you see test files created?

**Red Flags:**
- ❌ AI says "I've created the files" without showing code
- ❌ Code contains `throw new Error("Not implemented")`
- ❌ Code has `// TODO: implement this`
- ❌ AI skips testing "to save time"

---

### Phase 2: Core Components

**Copy-paste this prompt:**

```
Excellent. Now proceed to Phase 2: Core Components.

MANDATORY REQUIREMENTS:
1. Read ALL specified documentation for Phase 2 (1,710 lines total)
2. Implement ALL 6 components completely (no partial implementations)
3. Each component must be production-ready, no placeholders
4. Write unit tests for each component
5. Run tests and typecheck before completion

Phase 2 Reading Requirements:
- IMPLEMENTATION_PATTERNS.md lines 501-1211 (all 6 components)
- TECHNICAL_SPEC.md lines 501-1000 (component interfaces)
- QA_SPEC.md lines 1-500 (testing patterns)
- Total: 1,710 lines

Phase 2 Implementation Requirements:
Create these 6 components (copy-paste from IMPLEMENTATION_PATTERNS):
1. OrderStatusBadge.tsx (175 lines)
2. OrderTable.tsx (346 lines)
3. OrderFilters.tsx (220 lines)
4. ExportDialog.tsx (181 lines)
5. TrackingCard.tsx (199 lines)
6. OrderInlineActions.tsx (226 lines)

Each component must:
- Be complete and working (no TODOs)
- Have proper TypeScript types (no 'any')
- Include accessibility features (ARIA labels, etc.)
- Have unit tests
- Pass lint and typecheck

After completion, confirm:
"Which 6 components did you create? Are they all tested? Any TypeScript errors?"

RULES:
- Copy-paste complete component code from IMPLEMENTATION_PATTERNS.md
- Do NOT write your own versions - use the documented patterns
- ALL components must be completed before moving to Phase 3
```

**Expected AI Response:**
- AI reads all 1,710 lines
- AI creates all 6 component files
- AI writes tests for components
- AI runs lint/typecheck
- AI confirms all 6 components working

**Verification Checklist:**
- [ ] All 6 component files exist?
- [ ] Did AI copy-paste from IMPLEMENTATION_PATTERNS (not write custom code)?
- [ ] Each component has tests?
- [ ] No TypeScript errors?
- [ ] No accessibility warnings?

**Red Flags:**
- ❌ AI creates only 3-4 components and says "I'll finish the rest later"
- ❌ AI writes custom component code instead of using documented patterns
- ❌ AI says "tests are optional for now"
- ❌ Components have TypeScript 'any' types

---

### Phase 3: Order List Page

**Copy-paste this prompt:**

```
Perfect. Now proceed to Phase 3: Order List Page.

MANDATORY REQUIREMENTS:
1. Read ALL specified documentation for Phase 3 (1,241 lines total)
2. Implement complete Order List page (no partial features)
3. All functionality must work: filters, pagination, bulk actions
4. Write E2E tests with Playwright
5. Verify page loads and works in browser

Phase 3 Reading Requirements:
- IMPLEMENTATION_PATTERNS.md lines 1212-1590 (complete List page)
- TECHNICAL_SPEC.md lines 1001-1400 (page specifications)
- QA_SPEC.md lines 501-963 (E2E tests)
- Total: 1,241 lines

Phase 3 Implementation Requirements:
- Create src/app/admin/orders/page.tsx (375 lines complete code)
- Copy-paste from IMPLEMENTATION_PATTERNS.md lines 1212-1590
- Implement ALL features:
  * Order table with sorting
  * Filters (status, date range, search)
  * Pagination (20 items per page)
  * Bulk selection and actions
  * Export functionality
- Write E2E tests
- Test in browser: npm run dev → http://localhost:3000/admin/orders

After completion, confirm:
"Does the Order List page load? Do filters work? Does pagination work? Any errors in console?"

RULES:
- Page must be 100% functional, not a skeleton
- All state management must work (useState, useCallback, useEffect)
- All API calls must work (fetch to /api/orders)
- Browser must show working page, not blank screen
```

**Expected AI Response:**
- AI reads all 1,241 lines
- AI creates complete page file
- AI confirms page works in browser
- AI shows E2E test results

**Verification Checklist:**
- [ ] Page file exists at correct path?
- [ ] Did AI actually test in browser? (Should mention running npm run dev)
- [ ] Are filters, pagination, bulk actions all implemented?
- [ ] Any console errors when loading page?

**Red Flags:**
- ❌ Page only shows static table without filters
- ❌ AI says "pagination will be added later"
- ❌ AI doesn't test in actual browser
- ❌ State management is incomplete

---

### Phase 4: Order Details Page

**Copy-paste this prompt:**

```
Great progress. Now proceed to Phase 4: Order Details Page.

MANDATORY REQUIREMENTS:
1. Read ALL specified documentation for Phase 4 (1,679 lines total)
2. Implement complete Order Details page with all features
3. Handle all 8 edge cases documented in QA_SPEC
4. Write comprehensive E2E tests
5. Test in browser with real order data

Phase 4 Reading Requirements:
- IMPLEMENTATION_PATTERNS.md lines 1591-2362 (Details page + components)
- TECHNICAL_SPEC.md lines 1401-1846 (page specifications)
- QA_SPEC.md lines 964-1426 (E2E tests + edge cases)
- Total: 1,679 lines

Phase 4 Implementation Requirements:
- Create src/app/admin/orders/[id]/page.tsx (479 lines)
- Copy-paste from IMPLEMENTATION_PATTERNS.md lines 1596-2079
- Implement ALL features:
  * Order details display (items, customer, pricing)
  * Status update functionality
  * Shipment tracking (EasyParcel integration)
  * Payment information (ToyyibPay)
  * Customer notes editing
  * Order timeline
- Handle all 8 edge cases:
  1. Guest orders (no user account)
  2. Deleted products
  3. Orders without shipment
  4. Failed shipment booking
  5. Concurrent status updates
  6. Very long order numbers
  7. Large order item count (>20 items)
  8. Timezone handling
- Write E2E tests covering edge cases
- Test in browser: http://localhost:3000/admin/orders/[test-order-id]

After completion, confirm:
"Does Details page load? Can you update order status? How did you handle the 8 edge cases?"

RULES:
- All edge cases must be handled in code, not left as TODOs
- Page must work with real API data
- Error handling must be complete (try-catch blocks)
- No "will handle edge cases later"
```

**Expected AI Response:**
- AI reads all 1,679 lines
- AI creates complete Details page
- AI explicitly mentions handling each of 8 edge cases
- AI tests page in browser with real data

**Verification Checklist:**
- [ ] Details page file exists?
- [ ] Did AI explicitly handle all 8 edge cases?
- [ ] Can you see error handling for each edge case in code?
- [ ] Did AI test with actual order data?

**Red Flags:**
- ❌ AI only implements basic details display, skips editing
- ❌ AI says "edge cases can be added incrementally"
- ❌ No try-catch blocks for API calls
- ❌ Missing shipment or payment integration code

---

### Phase 5: Quality Assurance & Deployment

**Copy-paste this prompt:**

```
Final phase! Now proceed to Phase 5: Quality Assurance & Deployment.

MANDATORY REQUIREMENTS:
1. Read ALL remaining documentation (500 lines)
2. Run complete test suite (unit + integration + E2E)
3. Verify performance targets (LCP < 2.5s, FID < 100ms)
4. Test in all browsers (Chrome, Safari, Firefox, Edge)
5. Run production build and verify no errors

Phase 5 Reading Requirements:
- QA_SPEC.md lines 1-1426 (complete file if not fully read)
- DEV_GUIDE.md (complete file if not fully read)
- Focus on: Performance, browser compatibility, deployment

Phase 5 Implementation Requirements:
- Run full test suite:
  * npm test (all unit tests)
  * npm run test:e2e (all E2E tests)
  * npm run lint
  * npm run typecheck
  * npm run build
- Verify all tests pass (show me the results)
- Check performance:
  * Run Lighthouse audit
  * Verify LCP < 2.5s, FID < 100ms
- Test in browsers:
  * Chrome, Safari, Firefox, Edge
  * Report any compatibility issues
- Create deployment checklist
- Verify rollback plan exists

After completion, confirm:
"What is the test coverage? Did the build succeed? Any performance issues? Is deployment ready?"

RULES:
- ALL tests must pass, no exceptions
- Build must succeed with 0 errors
- If tests fail, FIX them, don't skip
- Performance must meet targets or explain why not
```

**Expected AI Response:**
- AI reads remaining documentation
- AI runs all test commands and shows results
- AI confirms test coverage meets targets (80% unit, 60% integration)
- AI shows successful build output
- AI provides deployment readiness confirmation

**Verification Checklist:**
- [ ] Did AI run all test commands?
- [ ] Are test results shown (not just "tests passed")?
- [ ] Did build complete successfully?
- [ ] Any remaining TODOs or placeholders in codebase?

---

## 🚀 Alternative: All-in-One Prompt (Advanced)

**Use this only if you trust the AI to complete everything without supervision.**

**Copy-paste this prompt:**

```
Implement the complete Order Management system following the AI Developer Guide in @claudedocs/order-management/README.md

CRITICAL REQUIREMENTS:
1. Follow the "AI Developer Guide (Complete Read Strategy - 100% Coverage)" EXACTLY
2. Read ALL 8,813 lines of documentation across all 5 phases
3. Complete ALL 5 implementation phases
4. Use TodoWrite to track progress (must show all phases)
5. NO partial implementations, NO TODOs, NO placeholders

Phase-by-Phase Execution:
✅ Phase 0: Read README + REDESIGN_PLAN (607 lines)
✅ Phase 1: Read 3,572 lines → Implement foundation layer
✅ Phase 2: Read 1,710 lines → Implement all 6 components
✅ Phase 3: Read 1,241 lines → Implement Order List page
✅ Phase 4: Read 1,679 lines → Implement Order Details page
✅ Phase 5: Read 500 lines → Complete testing & QA

Success Criteria (ALL must be met):
- ✅ All 8,813 lines of documentation read (show coverage table)
- ✅ Foundation layer complete (constants + utilities)
- ✅ All 6 components implemented and tested
- ✅ Order List page fully functional (filters, pagination, bulk actions)
- ✅ Order Details page fully functional (editing, edge cases handled)
- ✅ All tests passing (unit + integration + E2E)
- ✅ npm run build succeeds with 0 errors
- ✅ No TODOs or placeholders anywhere in code
- ✅ All 8 edge cases handled

Verification Requirements:
After each phase, provide checkpoint confirmation as specified in README.md
At the end, provide:
1. Coverage verification table (did you read all 8,813 lines?)
2. Test results (unit, integration, E2E)
3. Build output
4. List of all files created
5. Confirmation that no TODOs exist

RULES:
- Do NOT skip documentation reading to "save time"
- Do NOT implement partial features and say "will complete later"
- Do NOT use placeholders or stub implementations
- Do NOT skip testing phases
- If you hit issues, STOP and report them, don't work around

Start with Phase 0 and proceed through all phases systematically.
```

**Warning:** This approach requires careful monitoring. The AI might:
- Skip documentation reading
- Do partial implementations
- Not test thoroughly
- Leave TODOs for "later"

**Use Phase-by-Phase prompts for safer, controlled implementation.**

---

## 🚨 Red Flags: Signs AI is Cutting Corners

**Watch for these warning signs:**

### Documentation Reading
- ❌ "I've reviewed the documentation" (vague - did they READ all lines?)
- ❌ "Based on the patterns..." (without mentioning specific line numbers)
- ❌ Skips mentioning total lines read
- ✅ "I've read 1,630 lines from INTEGRATION_PLAN.md (complete file)"

### Implementation
- ❌ "I've created the foundation files" (no code shown)
- ❌ Code contains `// TODO: implement this`
- ❌ Code has `throw new Error("Not implemented")`
- ❌ Functions return empty objects or mock data
- ✅ Complete, working code with all logic implemented

### Testing
- ❌ "Tests will be added in Phase 5" (no, tests are per-phase)
- ❌ "I'll skip tests for now to focus on features"
- ❌ "Testing is optional" (no, it's mandatory)
- ✅ "All unit tests pass: 15/15" (with actual output)

### Completion Claims
- ❌ "Phase 1 is mostly complete" (no, it's either complete or not)
- ❌ "I've implemented the core features" (what about non-core?)
- ❌ "The foundation is done except for..." (then it's NOT done)
- ✅ "Phase 1 complete: All tests pass, typecheck succeeds, no TODOs"

---

## 🔧 Recovery Prompts

**Use these if AI goes off track:**

### If AI Skips Documentation Reading:

```
STOP. You must read ALL specified documentation before implementing.

Go back and read these files COMPLETELY:
[List the specific files and line numbers from README.md]

After reading, confirm:
"I have read [X] lines total. Here's what I learned: ..."

Do NOT proceed to implementation until reading is complete.
```

### If AI Does Partial Implementation:

```
STOP. This is a partial implementation, not acceptable.

You have created [file] but it contains:
- TODOs at lines [X, Y, Z]
- Placeholder functions that throw "Not implemented"
- Missing functionality: [list what's missing]

Go back and COMPLETE this file:
1. Remove all TODOs
2. Implement all functions fully
3. Add proper error handling
4. Write and run tests

Show me the complete code when done.
```

### If AI Skips Testing:

```
STOP. Testing is mandatory, not optional.

For Phase [N], you must:
1. Write unit tests for all components/functions
2. Run: npm test
3. Show me the test output (not just "tests pass")
4. Verify coverage meets targets (80% for unit tests)

Do NOT mark this phase complete until all tests pass.
```

### If AI Uses Placeholders:

```
STOP. I found placeholders/stubs in your code:

[Show the specific placeholder code]

This is not acceptable. Per CLAUDE.md coding standards:
- NO placeholders or mock objects
- NO "TODO" comments for core functionality
- NO stub implementations
- Every function must work as specified

Replace all placeholders with working implementations now.
```

---

## ✅ Success Criteria Per Phase

**Use this checklist to verify each phase is truly complete:**

### Phase 0: Pre-Implementation ✅
- [ ] AI read README.md (215 lines)
- [ ] AI read REDESIGN_PLAN.md (392 lines)
- [ ] AI can explain: "What we're building and why"
- [ ] AI knows the 2 pages we're creating
- [ ] No implementation yet (reading only)

### Phase 1: Foundation Layer ✅
- [ ] AI read 3,572 lines total
- [ ] Files exist: `src/lib/constants/order.ts`, `src/lib/utils/order.ts`
- [ ] NO TODOs or placeholders in code
- [ ] Test files created and passing
- [ ] `npm run typecheck` succeeds
- [ ] AI can list all constants and utilities created

### Phase 2: Core Components ✅
- [ ] AI read 1,710 lines total
- [ ] All 6 component files exist in `src/components/admin/orders/`
- [ ] Each component is complete (no partial implementations)
- [ ] All components have TypeScript interfaces (no 'any')
- [ ] Unit tests exist for all components
- [ ] `npm test` shows all tests passing
- [ ] No accessibility warnings

### Phase 3: Order List Page ✅
- [ ] AI read 1,241 lines total
- [ ] File exists: `src/app/admin/orders/page.tsx`
- [ ] Page loads in browser without errors
- [ ] Filters work (status, date range, search)
- [ ] Pagination works (20 items per page)
- [ ] Bulk selection and actions work
- [ ] E2E tests written and passing
- [ ] No console errors

### Phase 4: Order Details Page ✅
- [ ] AI read 1,679 lines total
- [ ] File exists: `src/app/admin/orders/[id]/page.tsx`
- [ ] Page loads with real order data
- [ ] Status updates work
- [ ] All 8 edge cases explicitly handled in code
- [ ] Shipment tracking integration complete
- [ ] Payment integration complete
- [ ] E2E tests cover edge cases

### Phase 5: QA & Deployment ✅
- [ ] AI read all remaining documentation
- [ ] `npm test` - all unit tests pass
- [ ] `npm run test:e2e` - all E2E tests pass
- [ ] `npm run lint` - no errors
- [ ] `npm run typecheck` - no errors
- [ ] `npm run build` - succeeds with 0 errors
- [ ] Test coverage meets targets (80% unit, 60% integration)
- [ ] Performance targets met (LCP < 2.5s, FID < 100ms)
- [ ] No TODOs anywhere in codebase

### Overall Completion ✅
- [ ] All 8,813 lines of documentation read (100% coverage)
- [ ] All 5 phases completed
- [ ] All files created as specified
- [ ] All tests passing
- [ ] Build succeeds
- [ ] No placeholders, TODOs, or "Not implemented" anywhere
- [ ] Ready for deployment

---

## 📊 Final Verification Command

**Run this after AI claims completion:**

```bash
# Check for TODOs
grep -r "TODO\|FIXME\|XXX\|HACK\|Not implemented" src/ --exclude-dir=node_modules

# Should return: No matches

# Run all tests
npm test && npm run test:e2e && npm run lint && npm run typecheck && npm run build

# Should succeed with 0 errors

# Check coverage
npm test -- --coverage

# Should show: 80%+ unit coverage
```

If any of these fail, Phase 5 is NOT complete.

---

## 🎯 Summary: The Perfect Prompt Pattern

```
1. Be explicit: "Read ALL [X] lines from [file]"
2. Require confirmation: "After reading, confirm by answering..."
3. Enforce completion: "NO TODOs, NO placeholders, COMPLETE implementation only"
4. Demand verification: "Run tests and show me the output"
5. Use checkpoints: "Do NOT proceed until Phase [N] is verified complete"
```

**Key Phrases to Include:**
- "Read ALL specified documentation"
- "COMPLETE implementation, no partial work"
- "NO TODOs or placeholders"
- "Run tests and show results"
- "Confirm by answering: ..."

**Key Phrases to Avoid:**
- "Review the documentation" (too vague)
- "Implement the main features" (what about non-main?)
- "Create the foundation" (without "complete")
- "Tests can come later" (no, tests are per-phase)

---

**Use Phase-by-Phase prompts for best results. Monitor closely. Verify at every checkpoint.**
