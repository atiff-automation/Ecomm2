# Landing Page to Click Page Migration Plan

**Date Created:** 2025-01-28
**Status:** READY FOR EXECUTION
**Complexity:** Medium
**Estimated Time:** 2-3 hours

## Executive Summary

Merge both `feature/click-pages-mvp` (which includes landing-page code) into main, then systematically remove all landing-page features, leaving only the superior ClickPage block-based builder.

## Context

- `feature/click-pages-mvp` was built on top of `feature/landing-page-cms`
- Click-pages branch contains 49 commits (18 landing-page + 31 click-page)
- Both features serve the same purpose: promotional/sales pages
- ClickPage is objectively superior: block-based, more flexible, has form submissions
- Not in production yet, so no data migration concerns

## Branch Analysis

### feature/landing-page-cms (18 commits)
- Traditional rich-text editor (TipTap)
- Fixed structure: title, excerpt, content, featured image
- Tag system for organization
- Product showcase via product ID arrays
- 50 files changed, ~7K lines added

### feature/click-pages-mvp (49 commits total)
- First 18 commits: All landing-page features (inherited)
- Last 31 commits: Click-page features
  - Interactive visual editor
  - Block system (Hero, Form, ImageGallery, Video, ProductShowcase)
  - Device preview with responsive controls
  - Form submissions management
- 172 files changed, ~30K lines added (includes landing-page code)

## Why ClickPage is Superior

1. **Block-based architecture** - More flexible than fixed HTML content
2. **Visual builder** - WYSIWYG editing vs markdown/HTML
3. **Form submissions** - Built-in form data storage (FormSubmission model)
4. **Modern UX** - Drag-drop blocks vs traditional editor
5. **Product embeds** - Blocks can embed products directly vs separate showcase
6. **Responsive controls** - Device preview with zoom controls

## Strategic Plan

### Phase 1: Create Restore Point (5 minutes)

**Objective:** Commit current state on feature/click-pages-mvp

```bash
# Already on feature/click-pages-mvp
git status
git add .
git commit -m "chore: Snapshot before merge to main - complete click-pages MVP with landing-pages foundation"
```

**Success Criteria:**
- Clean working directory
- All changes committed
- Ready for merge

---

### Phase 2: Merge to Main (10 minutes)

**Objective:** Merge both features into main branch

```bash
# Switch to main
git checkout main

# Ensure main is up to date
git pull origin main

# Merge feature branch
git merge feature/click-pages-mvp

# Resolve conflicts if any (expected in .gitignore, schema.prisma)
# Test the build
npm run build

# Commit the merge
git add .
git commit -m "feat: Merge click-pages MVP (includes landing-pages foundation)"

# Push to remote
git push origin main
```

**Expected Merge Conflicts:**
- `.gitignore` - Choose click-pages version
- `prisma/schema.prisma` - Both models should coexist for now

**Success Criteria:**
- Merge completed without errors
- Build passes: `npm run build` succeeds
- Both features accessible in UI
- No TypeScript errors

---

### Phase 3: Strategic Cleanup (1-2 hours)

**Objective:** Remove all landing-page code, leaving only ClickPage feature

#### Step 3.1: Delete Frontend Routes

```bash
# Delete landing page routes
rm -rf src/app/landing
rm -rf src/app/admin/landing-pages
rm -rf src/app/api/admin/landing-pages
rm -rf src/app/api/public/landing-pages
rm -rf src/app/api/cron/landing-page-scheduler

# Commit
git add .
git commit -m "refactor: Remove landing page routes and API endpoints"
```

**Files Deleted:**
- `src/app/landing/[slug]/page.tsx`
- `src/app/landing/page.tsx`
- `src/app/admin/landing-pages/page.tsx`
- `src/app/admin/landing-pages/create/page.tsx`
- `src/app/admin/landing-pages/[id]/edit/page.tsx`
- `src/app/api/admin/landing-pages/route.ts`
- `src/app/api/admin/landing-pages/[id]/route.ts`
- `src/app/api/admin/landing-pages/[id]/analytics/route.ts`
- `src/app/api/admin/landing-pages/reorder/route.ts`
- `src/app/api/public/landing-pages/route.ts`
- `src/app/api/public/landing-pages/[slug]/route.ts`
- `src/app/api/public/landing-pages/[slug]/track-click/route.ts`
- `src/app/api/public/landing-pages/[slug]/track-view/route.ts`
- `src/app/api/cron/landing-page-scheduler/route.ts`

---

#### Step 3.2: Delete Components

```bash
# Delete landing page components
rm -f src/components/admin/LandingPageForm.tsx
rm -rf src/components/admin/landing-pages
rm -rf src/components/landing-page
rm -rf src/components/landing-pages
rm -f src/components/seo/LandingPageSchema.tsx

# Commit
git add .
git commit -m "refactor: Remove landing page components"
```

**Files Deleted:**
- `src/components/admin/LandingPageForm.tsx`
- `src/components/admin/landing-pages/AdvancedSEOForm.tsx`
- `src/components/admin/landing-pages/LandingPageAnalytics.tsx`
- `src/components/admin/landing-pages/LandingPageStatusBadge.tsx`
- `src/components/admin/landing-pages/ProductShowcaseSelector.tsx`
- `src/components/admin/landing-pages/ScheduleCountdown.tsx`
- `src/components/landing-page/LandingPageCard.tsx`
- `src/components/landing-page/embeds/LandingPageContent.tsx`
- `src/components/landing-pages/CustomBodyScripts.tsx`
- `src/components/landing-pages/LandingPageHead.tsx`
- `src/components/landing-pages/ProductShowcase.tsx`
- `src/components/seo/LandingPageSchema.tsx`

---

#### Step 3.3: Delete Services & Utilities

```bash
# Delete landing page services
rm -f src/lib/services/landing-page-conversion.service.ts
rm -f src/lib/services/landing-page-scheduler.ts
rm -f src/lib/validations/landing-page-validation.ts
rm -f src/lib/constants/landing-page-constants.ts
rm -f src/lib/cron/landing-page-scheduler.ts
rm -f src/types/landing-page.types.ts

# Commit
git add .
git commit -m "refactor: Remove landing page services and utilities"
```

---

#### Step 3.4: Update Configuration Files

**File: `src/config/admin-navigation.ts`**
- Remove landing-pages navigation entry

**File: `src/components/layout/Header.tsx`**
- Remove landing-pages link from header

**File: `src/lib/cron/index.ts`**
- Remove landing-page scheduler import and registration

**File: `src/app/admin/content/articles/page.tsx`**
- Remove any shared landing-page code if present

```bash
# After manual edits
git add .
git commit -m "refactor: Remove landing page references from config and navigation"
```

---

#### Step 3.5: Database Schema Cleanup

**Edit: `prisma/schema.prisma`**

Remove these models and references:

```prisma
// REMOVE from User model (lines 58-60):
- landingPages              LandingPage[]            @relation("LandingPageAuthor")
- landingPagesCreated       LandingPage[]            @relation("LandingPageCreatedBy")
- landingPagesUpdated       LandingPage[]            @relation("LandingPageUpdatedBy")

// REMOVE from Order model (line 308):
- landingPageConversion    LandingPageConversion?

// REMOVE entire models (lines 1461-1642):
- enum LandingPageStatus
- model LandingPageTag
- model LandingPageToTag
- model LandingPage
- model LandingPageClick
- model LandingPageConversion

// REMOVE enum (lines 1474-1479):
- enum ClickType (if only used by LandingPage)
```

**Create Migration:**

```bash
# Create migration
npx prisma migrate dev --name remove_landing_pages

# Commit
git add .
git commit -m "refactor: Remove landing page database models and migrations"
```

---

#### Step 3.6: Final Verification

```bash
# Generate Prisma client
npx prisma generate

# Type check
npx tsc --noEmit

# Build application
npm run build

# Test locally
npm run dev
```

**Manual Testing Checklist:**
- [ ] Click pages admin UI loads: `/admin/click-pages`
- [ ] Can create new click page
- [ ] Can edit existing click page
- [ ] Public click page renders: `/click/[slug]`
- [ ] Form submissions work
- [ ] Analytics tracking works
- [ ] No console errors
- [ ] No TypeScript errors

```bash
# Final commit
git add .
git commit -m "chore: Verify removal of landing pages complete - click-pages only"

# Push to remote
git push origin main
```

---

## Files to Remove - Complete List

### Routes (9 files)
```
src/app/landing/[slug]/page.tsx
src/app/landing/page.tsx
src/app/admin/landing-pages/page.tsx
src/app/admin/landing-pages/create/page.tsx
src/app/admin/landing-pages/[id]/edit/page.tsx
src/app/api/admin/landing-pages/route.ts
src/app/api/admin/landing-pages/[id]/route.ts
src/app/api/admin/landing-pages/[id]/analytics/route.ts
src/app/api/admin/landing-pages/reorder/route.ts
```

### API Routes (4 files)
```
src/app/api/public/landing-pages/route.ts
src/app/api/public/landing-pages/[slug]/route.ts
src/app/api/public/landing-pages/[slug]/track-click/route.ts
src/app/api/public/landing-pages/[slug]/track-view/route.ts
src/app/api/cron/landing-page-scheduler/route.ts
```

### Components (13 files)
```
src/components/admin/LandingPageForm.tsx
src/components/admin/landing-pages/AdvancedSEOForm.tsx
src/components/admin/landing-pages/LandingPageAnalytics.tsx
src/components/admin/landing-pages/LandingPageStatusBadge.tsx
src/components/admin/landing-pages/ProductShowcaseSelector.tsx
src/components/admin/landing-pages/ScheduleCountdown.tsx
src/components/landing-page/LandingPageCard.tsx
src/components/landing-page/embeds/LandingPageContent.tsx
src/components/landing-pages/CustomBodyScripts.tsx
src/components/landing-pages/LandingPageHead.tsx
src/components/landing-pages/ProductShowcase.tsx
src/components/seo/LandingPageSchema.tsx
```

### Services & Types (6 files)
```
src/lib/services/landing-page-conversion.service.ts
src/lib/services/landing-page-scheduler.ts
src/lib/validations/landing-page-validation.ts
src/lib/constants/landing-page-constants.ts
src/lib/cron/landing-page-scheduler.ts
src/types/landing-page.types.ts
```

### Files to Modify (4 files)
```
src/config/admin-navigation.ts
src/components/layout/Header.tsx
src/lib/cron/index.ts
src/app/admin/content/articles/page.tsx (if applicable)
prisma/schema.prisma
```

**Total:** ~36 files to delete, 5 files to modify

---

## Database Models to Remove

### Models (6 models)
```prisma
model LandingPage
model LandingPageTag
model LandingPageToTag
model LandingPageClick
model LandingPageConversion
enum LandingPageStatus
enum ClickType (if only used by LandingPage)
```

### Relations to Remove
```prisma
// From User model:
landingPages              LandingPage[]
landingPagesCreated       LandingPage[]
landingPagesUpdated       LandingPage[]

// From Order model:
landingPageConversion    LandingPageConversion?
```

---

## Risk Assessment

### 🟢 LOW RISK
- No production data to migrate
- Separate route structures
- Independent admin interfaces
- Isolated type definitions
- No code dependencies between features

### 🟡 MEDIUM RISK
- Schema migration (Prisma handles well)
- Multiple file deletions (git tracks everything)
- Configuration updates (clear in navigation files)

### 🔴 ELIMINATED RISKS
- ~~Data loss~~ - Not in production
- ~~SEO impact~~ - No indexed pages yet
- ~~Analytics continuity~~ - No historical data

---

## Rollback Procedures

### If Issues During Phase 1-2 (Merge)
```bash
# Reset to pre-merge state
git reset --hard HEAD~1

# Or checkout specific commit
git checkout <commit-hash-before-merge>
```

### If Issues During Phase 3 (Cleanup)
```bash
# Check commit history
git log --oneline

# Reset to specific commit
git reset --hard <commit-hash-of-safe-state>

# Or revert specific commits
git revert <commit-hash>
```

### Nuclear Option
```bash
# Return to feature branch
git checkout feature/click-pages-mvp

# Delete and recreate main
git branch -D main
git checkout -b main origin/main
```

---

## Success Metrics

### Phase 1 Success
- [ ] Clean commit on feature/click-pages-mvp
- [ ] No uncommitted changes

### Phase 2 Success
- [ ] Merge completed
- [ ] `npm run build` passes
- [ ] Both features visible in UI
- [ ] Pushed to remote

### Phase 3 Success
- [ ] All landing-page files deleted
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Click-pages UI fully functional
- [ ] Database migration successful
- [ ] Clean commit history

---

## Timeline

| Phase | Task | Duration | Commits |
|-------|------|----------|---------|
| 1 | Create restore point | 5 min | 1 |
| 2 | Merge to main | 10 min | 1 |
| 3.1 | Delete routes | 15 min | 1 |
| 3.2 | Delete components | 15 min | 1 |
| 3.3 | Delete services | 10 min | 1 |
| 3.4 | Update configs | 20 min | 1 |
| 3.5 | Database cleanup | 20 min | 1 |
| 3.6 | Final verification | 30 min | 1 |
| **TOTAL** | | **2 hours** | **8 commits** |

---

## Post-Migration Checklist

- [ ] All landing-page files removed
- [ ] Database schema clean (only ClickPage models)
- [ ] Admin navigation updated
- [ ] Header navigation updated
- [ ] Build passes without errors
- [ ] TypeScript compilation clean
- [ ] Click-pages create/edit works
- [ ] Click-pages public view works
- [ ] Form submissions work
- [ ] Analytics tracking works
- [ ] Cron jobs updated
- [ ] Git history clean
- [ ] Documentation updated

---

## Notes

- Keep `.playwright-mcp/` screenshots for reference
- Preserve `claudedocs/` planning documents
- Landing-page branch can be deleted after successful merge
- Consider creating a `backup/landing-page-cms` branch before deletion for historical reference

---

## Next Steps After Completion

1. Delete feature branches:
   ```bash
   git branch -d feature/landing-page-cms
   git branch -d feature/click-pages-mvp
   ```

2. Update project documentation
3. Inform team of route changes
4. Update any deployment scripts
5. Archive this migration plan for future reference

---

**END OF MIGRATION PLAN**
