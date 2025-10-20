# LLM Prompting Cheat Sheet

**Quick reference for optimal LLM prompting during implementation**

---

## 🚀 Quick Start Template

```
I'm implementing Task [N], Step [X.Y] from auth security plan.

LOAD:
- claudedocs/auth-security-plan/0[N]-TASK[N]-[NAME].md
- claudedocs/auth-security-plan/01-OVERVIEW.md

VERIFY YOU LOADED FILES:
- Confirm step requirements
- List CLAUDE.md standards to follow
- Show current file state (if modifying)

IMPLEMENT:
- COMPLETE file (no "... rest ..." placeholders)
- Follow plan EXACTLY
- Apply CLAUDE.md standards
- Add verification checklist

MUST INCLUDE:
✓ Code follows plan exactly
✓ CLAUDE.md compliance checked
✓ Complete file shown
✓ Verification checklist
✓ Test procedure
✓ Expected results

Start Step [X.Y] now.
```

---

## ✅ Must-Have in Every Prompt

### 1. Context Loading
```
LOAD FILES:
- [specific plan file with path]
- [reference section if needed]
```

### 2. Current State
```
CURRENT STATE:
- File exists: [Y/N]
- Current content: [relevant section]
- Dependencies: [list]
```

### 3. Exact Requirements
```
REQUIREMENTS (from plan):
1. [quote exact requirement]
2. [quote exact requirement]
3. [quote exact requirement]
```

### 4. Standards Checklist
```
CLAUDE.MD COMPLIANCE REQUIRED:
- [ ] No hardcoding
- [ ] Single source of truth
- [ ] DRY principle
- [ ] Type safety (no `any`)
- [ ] Error handling (try-catch)
- [ ] Input validation (Zod)
- [ ] Audit logging (if security op)
- [ ] No console.log
```

### 5. Verification Request
```
AFTER CODE:
- [ ] Matches plan exactly
- [ ] Standards compliant
- [ ] Complete file (no snippets)
- [ ] Test procedure
- [ ] Expected results
```

---

## 🚫 Anti-Hallucination Keywords

### Always Use These Phrases:

✅ **"COMPLETE file"** - not "code snippet"
✅ **"EXACT requirements from plan Step X.Y"** - not "implement feature"
✅ **"Show CURRENT state first"** - not "assume"
✅ **"VERIFY against plan"** - not "looks good"
✅ **"QUOTE from plan"** - not "based on understanding"
✅ **"TEST before proceeding"** - not "should work"

### Never Accept These Responses:

❌ "Here's a snippet..."
❌ "... rest of the code ..."
❌ "Similar to..."
❌ "You can add..."
❌ "Optionally..."
❌ "This should work..."

**Always demand**: Complete, verified, tested code.

---

## 🔍 Verification Prompt (After Each Step)

```
VERIFY Step [X.Y]:

1. PLAN COMPLIANCE:
   Read Step [X.Y] from plan.
   Did I do EXACTLY what it says? [Y/N]
   What's different? [list]

2. STANDARDS CHECK:
   For each file created/modified:
   - [ ] No hardcoded values
   - [ ] No code duplication
   - [ ] All types explicit
   - [ ] All async has error handling
   - [ ] No console.log

3. CODE QUALITY:
   Run: npm run build
   Result: [PASS/FAIL]

   TypeScript errors: [count]
   If errors, list and fix.

4. TESTING:
   Test procedure: [from plan]
   Expected: [result]
   Actual: [result]
   Pass: [Y/N]

RESULT: PASS or FAIL with fixes needed.
```

---

## ⚠️ When Something's Wrong

```
ISSUE WITH Step [X.Y]:

ERROR:
[paste exact error or describe issue]

DIAGNOSIS REQUIRED:
1. Load plan Step [X.Y] again
2. Compare plan requirement vs my code
3. Identify discrepancy
4. Explain the issue
5. Provide COMPLETE corrected file

VERIFICATION AFTER FIX:
- [ ] Matches plan exactly
- [ ] Error resolved
- [ ] No new errors
- [ ] Tests pass

Fix now.
```

---

## 📝 Daily Session Prompts

### Session Start
```
Starting implementation session.

LOAD: claudedocs/auth-security-plan/00-INDEX.md

STATUS:
- Completed: [list checked steps]
- Current: Task [N] Step [X.Y]
- Goal today: Complete Steps [X.Y] to [X.Z]

ENVIRONMENT CHECK:
```bash
git status
npm run dev
npx prisma studio
```

All clear? Begin Step [X.Y].
```

### Session End
```
Ending session.

COMPLETED:
- [X] Step [X.Y]: [name]
- [X] Step [X.Z]: [name]

VERIFICATION:
```bash
git status
npm run build
npm run lint
```

All clean?

COMMIT:
```bash
git add .
git commit -m "feat: [what was done]"
```

NEXT SESSION:
Start with: Task [N] Step [X.next]
```

---

## 🎯 Task-Specific Quick Prompts

### Task 1: Forgot Password

**Step 1.1 (Schema)**:
```
Task 1, Step 1.1: Database Schema

Load: 03-TASK1-FORGOT-PASSWORD.md Step 1.1

Show current User model (last 5 fields).
Add passwordResetToken and passwordResetTokenExpiry.
Show updated User model.
Provide migration command.
Verify fields added in Prisma Studio.
```

**Step 1.2 (Utilities)**:
```
Task 1, Step 1.2: Reset Utilities

Load: 03-TASK1-FORGOT-PASSWORD.md Step 1.2
Reference: Main plan lines 200-400

Create: src/lib/auth/password-reset.ts
Show COMPLETE file (all imports, all functions, all exports)
NO snippets or "... rest" placeholders.

Verify:
- PASSWORD_RESET_CONFIG constant
- 3 functions: generate, verify, reset
- Error handling in all
- Audit logging in reset
- Proper TypeScript types
```

### Task 2: CSRF Protection

**Step 2.2 (Middleware)**:
```
Task 2, Step 2.2: CSRF Middleware

Load: Plan Task 2, Step 2.2

Create: src/lib/middleware/with-csrf.ts
Show COMPLETE file.

Must have:
- checkCSRF function
- withCSRF wrapper
- Skip safe methods (GET, HEAD, OPTIONS)

Verify:
- Imports CSRFProtection from security
- Proper error handling
- Returns Response | null
```

**Step 2.3-2.6 (Apply to Routes)**:
```
Task 2, Step 2.3: Apply CSRF to Auth Routes

Files to modify:
- src/app/api/auth/register/route.ts

For EACH file:
1. Show current POST function (first 10 lines)
2. Show where to add CSRF check (after line X)
3. Show updated POST function
4. Verify import added at top

Pattern to apply:
```typescript
import { checkCSRF } from '@/lib/middleware/with-csrf';

export async function POST(request: NextRequest) {
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;
  // ... rest of code
}
```

Do ONE file at a time.
```

### Task 3: Admin Password

```
Task 3, Step 3.1: Fix Password API

Load: Plan Task 3, Step 3.1

File: src/app/api/settings/password/route.ts

SHOW:
1. Current role check (around line 26)
2. Code to remove
3. Replacement code
4. Explanation of change

REMOVE:
```typescript
if (session.user.role !== 'CUSTOMER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

REPLACE WITH:
```typescript
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Verify change allows all authenticated users.
```

---

## 🔧 Testing Prompts

### Manual Test
```
TEST Step [X.Y]:

CHECKLIST (from plan):
[copy test checklist from plan]

For each test:
1. Steps to perform
2. Expected result
3. Actual result
4. PASS/FAIL

If FAIL:
- Error message
- Diagnosis
- Fix needed
```

### Database Verification
```
VERIFY DATABASE:

Schema changes:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name LIKE '%password%';
```

Data integrity:
```sql
[provide relevant query from plan]
```

Expected vs Actual results.
```

---

## 💡 Pro Tips

### 1. One Sub-Step Per Prompt
❌ "Implement Task 1"
✅ "Implement Task 1, Step 1.2 only"

### 2. Always Load Plan First
❌ "Add forgot password"
✅ "Load 03-TASK1-FORGOT-PASSWORD.md, then implement Step 1.1"

### 3. Demand Complete Files
❌ Accept "... rest of code ..."
✅ "Show COMPLETE file, all imports, all functions, all exports"

### 4. Verify After Each Step
❌ Skip verification, move to next
✅ Run verification checklist before proceeding

### 5. Test Before Committing
❌ Commit without testing
✅ Test, verify, then commit with proper message

---

## 🎓 Example Perfect Prompt

```
TASK 1 - STEP 1.2: Password Reset Utilities

CONTEXT LOAD:
- File: claudedocs/auth-security-plan/03-TASK1-FORGOT-PASSWORD.md
- Section: Step 1.2
- Reference: Main plan lines 200-400 for complete code

PREREQUISITES VERIFIED:
- [X] Step 1.1 complete (schema updated)
- [X] Migration successful (passwordResetToken fields exist)
- [X] Prisma client regenerated

CURRENT STATE:
- File exists: NO (will create new)
- Directory exists: src/lib/auth/ (YES)

REQUIREMENTS FROM PLAN:
1. Create file: src/lib/auth/password-reset.ts
2. PASSWORD_RESET_CONFIG constant (centralized, no hardcode)
3. Function: generatePasswordResetToken(email)
4. Function: verifyPasswordResetToken(token)
5. Function: resetPasswordWithToken(token, newPassword)
6. Export: PASSWORD_RESET_CONFIG, functions, types

CLAUDE.MD STANDARDS TO APPLY:
- [ ] No hardcoding (use PASSWORD_RESET_CONFIG)
- [ ] Single source of truth (all reset logic here)
- [ ] DRY (no repeated code)
- [ ] Type safety (explicit types, no `any`)
- [ ] Error handling (try-catch on all async)
- [ ] Security (don't reveal email existence in generatePasswordResetToken)
- [ ] Audit logging (in resetPasswordWithToken)
- [ ] No console.log (use console.error for errors only)

IMPLEMENTATION REQUEST:
Create the COMPLETE file src/lib/auth/password-reset.ts

Show:
1. ALL imports (crypto, prisma, etc.)
2. PASSWORD_RESET_CONFIG constant with all properties
3. PasswordResetResult interface
4. generatePasswordResetToken function (COMPLETE)
5. verifyPasswordResetToken function (COMPLETE)
6. resetPasswordWithToken function (COMPLETE)
7. ALL exports

NO SNIPPETS - COMPLETE FILE ONLY
NO "... rest of code ..." PLACEHOLDERS

AFTER CODE:
Provide verification checklist:
- [ ] All 3 functions present
- [ ] Password hashing using hashPassword from ./utils
- [ ] Prisma queries correct
- [ ] Error handling in each function
- [ ] Audit log in resetPasswordWithToken
- [ ] Exports correct
- [ ] TypeScript types explicit
- [ ] No console.log in code

TESTING:
How to test:
1. Import functions in test file
2. Call generatePasswordResetToken with test email
3. Check database for token
4. SQL query to verify

Implement Step 1.2 now.
```

---

## 🎯 Success Criteria

**You're prompting well when**:
- ✅ LLM loads plan before answering
- ✅ LLM shows complete files (no snippets)
- ✅ LLM verifies against standards
- ✅ LLM provides test procedures
- ✅ LLM catches own mistakes
- ✅ Code follows plan exactly
- ✅ No hallucinated features
- ✅ All steps tested before proceeding

---

## 📚 Full Documentation

For complete guide: [HOW-TO-PROMPT-LLM.md](./HOW-TO-PROMPT-LLM.md)

For implementation plan: [00-INDEX.md](./00-INDEX.md)

For coding standards: [01-OVERVIEW.md](./01-OVERVIEW.md) (CLAUDE.md section)

---

**Remember**:
- Load context first
- One step at a time
- Complete files only
- Verify always
- Test before proceeding

**Last Updated**: January 2025
