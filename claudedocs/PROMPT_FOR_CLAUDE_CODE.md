# Prompt for Claude Code: Execute Customer & Membership Simplification

**Instructions**: Copy this entire prompt and paste it to Claude Code to begin implementation.

---

## Task Request

Please implement the customer and membership admin simplification as detailed in `@claudedocs/CUSTOMER_MEMBERSHIP_SIMPLIFICATION_PLAN.md`.

## Context

This is a refactoring task for a Next.js e-commerce platform. The goal is to simplify customer and membership admin pages by removing unnecessary enterprise features while maintaining ALL core business functionality, especially the payment-to-membership activation flow.

## Critical Requirements

🔴 **ABSOLUTE CONSTRAINTS**:
1. **NEVER modify these protected files**:
   - `src/app/api/webhooks/toyyibpay/route.ts`
   - `src/app/api/webhooks/payment-success/route.ts`
   - `src/lib/services/membership-service.ts`
   - `src/lib/membership.ts`
   - Any file containing `activateUserMembership()`

2. **Run `npm run typecheck && npm run build` after EVERY phase** - If tests fail, STOP and fix

3. **Read files before editing** - Always use Read tool first

4. **Follow CLAUDE.md standards** - DRY principle, no hardcoding, TypeScript strict

5. **Zero breaking changes** - Payment-to-membership flow must work identically

## Implementation Steps

Please follow the plan in `@claudedocs/CUSTOMER_MEMBERSHIP_SIMPLIFICATION_PLAN.md` exactly, implementing these phases in order:

### Phase 1: Preparation & Safety
- Create git branch: `feature/simplify-customer-membership-admin`
- Create backup directory: `claudedocs/backups/2025-10-19/`
- Backup critical files
- Run initial tests (typecheck, build, lint)

### Phase 2: Delete Unused Pages
- Delete `src/app/admin/membership/analytics/page.tsx`
- Delete `src/app/admin/member-promotions/page.tsx`
- Delete `src/app/api/admin/member-promotions/route.ts`
- Delete `src/app/api/admin/membership/export/route.ts`
- Verify with grep and typecheck

### Phase 3: Update Navigation
- Update `src/components/admin/layout/Breadcrumb.tsx` (remove referrals, update membership)
- Update `src/app/admin/customers/page.tsx` (remove export, update tabs, breadcrumbs)
- Update `src/app/admin/membership/page.tsx` (remove analytics links, update tabs)
- Update `src/app/admin/dashboard/page.tsx` (change analytics link to membership)

### Phase 4: Simplify Configuration
- Update `src/app/admin/membership/config/page.tsx` (remove text editors, keep 3 settings)
- Update `src/app/api/admin/membership/config/route.ts` (make text fields optional)

### Phase 5: Centralize Navigation (DRY)
- Create `src/lib/constants/admin-navigation.ts` (centralized tab config)
- Update customers and membership pages to use centralized tabs

### Phase 6: Final Testing
- Run full test suite (typecheck, build, lint)
- Verify deleted files are gone
- Verify protected files unchanged
- Confirm no references to deleted pages

## Expected Outcomes

After completion, report:
- ✅ Files Deleted: 4 (analytics, promotions, 2 API routes)
- ✅ Files Modified: 6 (customers, membership, dashboard, breadcrumb, config, config API)
- ✅ Files Created: 1 (navigation constants)
- ✅ TypeScript Errors: 0
- ✅ Build Status: Success
- ✅ Lint Status: Pass
- ✅ Protected Files: Unchanged

## Success Criteria

Before marking complete:
- [ ] TypeScript: 0 errors
- [ ] Build: Success
- [ ] Lint: Pass
- [ ] All tabs use centralized constant (DRY principle)
- [ ] No references to deleted pages
- [ ] Protected payment files unchanged
- [ ] All changes committed to feature branch

## Implementation Style

- **Use TodoWrite tool** for tracking progress (create todos for all phases)
- **Use Read tool first** before editing any file
- **Run tests after each phase** - Don't skip checkpoints
- **Use Edit tool** for precise changes (not Write for existing files)
- **Report issues immediately** if tests fail
- **Verify each change** with grep/typecheck before proceeding

## Notes

- Follow the exact code changes specified in the plan
- The plan includes line numbers for reference
- Use exact code blocks from the plan (BEFORE/AFTER examples)
- Text editors are removed from UI but fields stay in database with defaults
- This is a code reduction refactor: ~2,300 lines deleted, 66% reduction

---

**Ready to begin?** Start with Phase 1 (Preparation & Safety) and work through each phase systematically. Report completion after each phase with test results.
