# How to Prompt LLM for Implementation

**Purpose**: Optimal prompting strategies to ensure complete, systematic, standards-compliant implementation without hallucination or code breaking.

---

## 🎯 Core Prompting Principles

### 1. **Load Context First**
Always load the relevant plan file before asking for implementation.

### 2. **Request Verification Checks**
Ask LLM to verify against standards and test after each step.

### 3. **Demand Step-by-Step**
Never ask for "complete implementation" - break into sub-steps.

### 4. **Require Testing**
Always include testing verification in the prompt.

### 5. **Reference Exact Files**
Point to specific files and line numbers to prevent hallucination.

---

## 📝 Prompt Templates

### Template 1: Starting a New Task

```
I'm implementing Task [NUMBER] from our auth security plan.

CONTEXT TO LOAD:
- Read: claudedocs/auth-security-plan/0[NUMBER]-TASK[N]-[NAME].md
- Read: claudedocs/auth-security-plan/01-OVERVIEW.md (CLAUDE.md standards section)

REQUIREMENTS:
1. Follow the plan EXACTLY as written - no deviations
2. Follow CLAUDE.md coding standards (check each requirement)
3. After EVERY step, provide a verification checklist
4. Show me the COMPLETE file content (not snippets)
5. Test each step before moving to next

VERIFICATION BEFORE STARTING:
- Confirm you've loaded both files
- List the sub-steps from the plan
- Confirm current file/database state

Let's start with Step [X.Y] only. Ready?
```

**Example**:
```
I'm implementing Task 1 (Forgot Password) from our auth security plan.

CONTEXT TO LOAD:
- Read: claudedocs/auth-security-plan/03-TASK1-FORGOT-PASSWORD.md
- Read: claudedocs/auth-security-plan/01-OVERVIEW.md (CLAUDE.md standards)

REQUIREMENTS:
1. Follow the plan EXACTLY - no deviations
2. Check CLAUDE.md standards: No hardcoding, Single source of truth, DRY, Type safety, Error handling
3. After EVERY step, provide verification checklist
4. Show COMPLETE file content (not snippets)
5. Test before moving to next step

VERIFICATION:
- Confirm files loaded
- List Steps 1.1 through 1.9
- Check current prisma/schema.prisma state

Let's start with Step 1.1 (Database Schema Update) only.
```

---

### Template 2: Implementing a Sub-Step

```
Continue with Step [X.Y]: [STEP NAME]

BEFORE YOU CODE:
1. Read the step requirements from the plan
2. List what files need to be created/modified
3. Confirm CLAUDE.md standards to follow

IMPLEMENTATION:
1. Show COMPLETE file content (not partial/snippet)
2. Highlight what follows CLAUDE.md standards
3. Add inline comments explaining critical sections

VERIFICATION CHECKLIST:
- [ ] Follows plan exactly
- [ ] No hardcoded values (uses constants/env)
- [ ] Single source of truth (no duplication)
- [ ] DRY principle (no repeated code)
- [ ] Type safety (no `any` types)
- [ ] Error handling (try-catch on async)
- [ ] Input validation (Zod schemas)
- [ ] Audit logging (if security-critical)
- [ ] No console.log in production code
- [ ] All imports resolve correctly

TESTING:
After showing the code, provide:
- Manual test steps
- Expected results
- Verification commands (SQL/bash)

Show Step [X.Y] implementation now.
```

**Example**:
```
Continue with Step 1.2: Password Reset Utilities

BEFORE YOU CODE:
1. Read Step 1.2 from 03-TASK1-FORGOT-PASSWORD.md
2. Confirm file to create: src/lib/auth/password-reset.ts
3. List CLAUDE.md standards: No hardcoding, centralized config, DRY

IMPLEMENTATION:
1. Show COMPLETE src/lib/auth/password-reset.ts file
2. Highlight PASSWORD_RESET_CONFIG (centralized)
3. Explain token generation security

VERIFICATION CHECKLIST:
- [ ] Follows plan exactly
- [ ] PASSWORD_RESET_CONFIG (no hardcoding) ✓
- [ ] Single source of truth for all reset logic ✓
- [ ] DRY - no duplication ✓
- [ ] All functions typed (no any) ✓
- [ ] Try-catch on all async functions ✓
- [ ] Audit logging in resetPasswordWithToken ✓

TESTING:
- How to test token generation?
- How to verify in database?
- SQL query to check token storage?

Implement Step 1.2 now.
```

---

### Template 3: Verification After Implementation

```
I've implemented Step [X.Y]. Let's verify it's correct.

VERIFICATION REQUIRED:
1. Code Review Checklist:
   - [ ] Read the file I created/modified
   - [ ] Check against plan requirements
   - [ ] Verify CLAUDE.md compliance
   - [ ] Check for common mistakes

2. Standards Compliance:
   - [ ] No hardcoded values?
   - [ ] Single source of truth?
   - [ ] DRY principle?
   - [ ] Type safety?
   - [ ] Error handling?
   - [ ] Input validation?
   - [ ] Audit logging (if needed)?

3. Testing:
   - [ ] Provide test commands
   - [ ] Expected output
   - [ ] Verification queries

4. Common Issues Check:
   - [ ] All imports work?
   - [ ] TypeScript compiles?
   - [ ] No console.log?
   - [ ] Correct file path?

Review my implementation and tell me:
- What's correct
- What needs fixing
- What's missing
- Next step to take
```

---

### Template 4: Testing a Feature

```
Let's test Step [X.Y] implementation thoroughly.

CONTEXT:
- Feature: [NAME]
- Files modified: [LIST]
- Plan section: [REFERENCE]

TESTING CHECKLIST from plan:
[Copy checklist from plan]

ADDITIONAL VERIFICATION:
1. TypeScript Compilation:
   - Run: npm run build
   - Expected: No errors

2. Database State:
   - Verify schema changes
   - Check data integrity

3. Functionality:
   - Manual test steps
   - Expected vs actual results

4. Error Scenarios:
   - Test invalid inputs
   - Test edge cases
   - Verify error messages

Provide:
1. Exact test commands to run
2. Expected output for each
3. SQL queries to verify database
4. How to confirm it works

Begin testing now.
```

---

### Template 5: Debugging When Something's Wrong

```
Something's not working with Step [X.Y].

ERROR/ISSUE:
[Paste exact error message or describe issue]

CONTEXT:
- What I did: [describe steps]
- What I expected: [expected result]
- What happened: [actual result]
- Files modified: [list files]

DIAGNOSTIC REQUIRED:
1. Load the plan step again
2. Compare my implementation vs plan requirements
3. Check CLAUDE.md standards compliance
4. Identify the issue
5. Provide exact fix (complete file, not snippet)

VERIFICATION AFTER FIX:
- [ ] Issue resolved
- [ ] No new issues introduced
- [ ] Still follows plan
- [ ] Still follows standards
- [ ] Testing passes

Debug and fix now. Show complete corrected file.
```

---

### Template 6: Completing a Full Task

```
I've completed all sub-steps of Task [NUMBER]. Let's verify the full task.

COMPLETED SUB-STEPS:
- [X] Step [X.1]: [NAME]
- [X] Step [X.2]: [NAME]
- [X] Step [X.3]: [NAME]
[etc.]

FULL TASK VERIFICATION:

1. Plan Completion Check:
   - Load: 0[NUMBER]-TASK[N]-[NAME].md
   - Verify all sub-steps completed
   - Check all files created/modified

2. Integration Testing:
   - Test complete feature end-to-end
   - Verify all parts work together
   - Check for breaking changes

3. Standards Review:
   - Review all modified files
   - Check CLAUDE.md compliance across all code
   - Verify consistency

4. Database Verification:
   - Check schema changes applied
   - Verify data integrity
   - Test rollback procedure

5. Code Quality:
   - No console.log in code
   - No TODOs left
   - All imports resolve
   - TypeScript compiles clean

Perform full task verification and provide:
- Summary of what was implemented
- All testing results
- Any issues found
- Confirmation ready for next task
```

---

## 🚫 Anti-Hallucination Strategies

### 1. **Always Reference Exact Files**

❌ **Bad Prompt**:
```
Implement the forgot password feature
```

✅ **Good Prompt**:
```
Implement Step 1.2 from claudedocs/auth-security-plan/03-TASK1-FORGOT-PASSWORD.md
Show the COMPLETE file as written in the plan lines 50-150
```

---

### 2. **Request Complete Files, Not Snippets**

❌ **Bad Prompt**:
```
Add the forgot password function
```

✅ **Good Prompt**:
```
Show the COMPLETE src/lib/auth/password-reset.ts file
Include ALL imports, ALL functions, ALL exports
No "... rest of code ..." placeholders
```

---

### 3. **Demand Verification Checklists**

❌ **Bad Prompt**:
```
Is this correct?
```

✅ **Good Prompt**:
```
Verify this against the checklist:
- [ ] Follows plan Step 1.2 exactly
- [ ] Has PASSWORD_RESET_CONFIG constant
- [ ] All 3 functions: generate, verify, reset
- [ ] Error handling in each function
- [ ] Audit logging in reset function
- [ ] Exports config and types
Check each item and report status.
```

---

### 4. **Reference Current State**

❌ **Bad Prompt**:
```
Add CSRF protection
```

✅ **Good Prompt**:
```
Current state: src/lib/security/csrf-protection.ts EXISTS
Current state: It's used in 1 route only

Task: Apply to ALL routes as per plan Step 2.3-2.6
List EXACT files to modify first, then do them one by one
```

---

### 5. **Ask for Diffs When Modifying**

❌ **Bad Prompt**:
```
Update the auth config file
```

✅ **Good Prompt**:
```
Modify: src/lib/auth/config.ts
Show:
1. Current relevant section (lines to change)
2. New code to add
3. Complete updated function (not entire file)
4. Explanation of what changed

Format:
BEFORE (lines X-Y):
[code]

AFTER (lines X-Y):
[code]

CHANGES:
- Added: [what]
- Modified: [what]
- Reason: [why per plan]
```

---

## ✅ Verification Prompts

### After Each Sub-Step

```
MANDATORY VERIFICATION for Step [X.Y]:

1. PLAN COMPLIANCE:
   - [ ] Read Step [X.Y] requirements from plan
   - [ ] Check I did exactly what plan says
   - [ ] No extra features added
   - [ ] No steps skipped

2. CLAUDE.MD STANDARDS:
   - [ ] No hardcoded values (checked: [Y/N])
   - [ ] Single source of truth (checked: [Y/N])
   - [ ] DRY principle (checked: [Y/N])
   - [ ] Type safety - no `any` (checked: [Y/N])
   - [ ] Error handling on async (checked: [Y/N])
   - [ ] Input validation (checked: [Y/N])
   - [ ] Audit logging if needed (checked: [Y/N])

3. CODE QUALITY:
   - [ ] TypeScript compiles: npm run build
   - [ ] No console.log in code
   - [ ] All imports resolve
   - [ ] File at correct path
   - [ ] Proper exports

4. TESTING:
   - [ ] Manual test performed
   - [ ] Expected result achieved
   - [ ] No errors in console
   - [ ] Database state verified (if applicable)

Report: For each checkbox, state PASS or FAIL with explanation.
If any FAIL, provide fix before proceeding.
```

---

### Before Committing Code

```
PRE-COMMIT VERIFICATION:

Files modified in this session:
[List all files]

For EACH file:
1. Show first 10 lines (verify imports)
2. Confirm no console.log
3. Confirm no TODOs left
4. Confirm TypeScript types (no any)
5. Verify follows CLAUDE.md standards

Then run:
```bash
npm run build
npm run lint
```

Expected: No errors

Database:
- Schema changes applied? [Y/N]
- Migrations successful? [Y/N]
- Can rollback? [Y/N]

Git:
- Propose commit message following format:
  feat: [what was implemented]

  - [bullet points of changes]
  - [reference to plan task]

Ready to commit? [Y/N with explanation]
```

---

## 🔄 Systematic Implementation Flow

### Complete Flow for One Task

```
# Phase 1: Load Context
I'm starting Task [N]: [NAME]

Load files:
- claudedocs/auth-security-plan/0[N]-TASK[N]-[NAME].md
- claudedocs/auth-security-plan/01-OVERVIEW.md

Confirm:
1. Number of sub-steps in this task
2. Estimated time
3. Files to create/modify
4. CLAUDE.md standards to follow

[WAIT FOR CONFIRMATION]

---

# Phase 2: Plan Each Sub-Step
For Step [X.1]:
- What needs to be created/modified?
- What are the requirements?
- What are the verification checks?

[WAIT FOR RESPONSE]

---

# Phase 3: Implement Sub-Step
Implement Step [X.1] now.

Requirements:
- COMPLETE file (no snippets)
- Follow plan exactly
- Show CLAUDE.md compliance
- Add inline comments

[WAIT FOR IMPLEMENTATION]

---

# Phase 4: Verify Sub-Step
Verify Step [X.1] against:
- Plan requirements checklist
- CLAUDE.md standards checklist
- Testing checklist

[WAIT FOR VERIFICATION]

---

# Phase 5: Test Sub-Step
Test Step [X.1]:
- Provide test commands
- Show expected output
- Verify results

[WAIT FOR TEST RESULTS]

---

# Phase 6: Repeat for Next Sub-Step
[Repeat Phase 2-5 for each sub-step]

---

# Phase 7: Full Task Verification
All sub-steps complete.

Verify entire Task [N]:
- Integration testing
- End-to-end testing
- Standards review
- Code quality check

[WAIT FOR FULL VERIFICATION]

---

# Phase 8: Pre-Commit Check
Run pre-commit verification.
Propose commit message.
Confirm ready for next task.
```

---

## 🎓 Example: Complete Task 1 Implementation

### Session 1: Database Schema (Step 1.1)

```
TASK 1 - STEP 1.1: Database Schema Update

LOAD CONTEXT:
- File: claudedocs/auth-security-plan/03-TASK1-FORGOT-PASSWORD.md
- Section: Step 1.1

CURRENT STATE CHECK:
1. Read current prisma/schema.prisma User model
2. List current fields (last 5 fields)
3. Confirm no password reset fields exist

IMPLEMENTATION:
Add these exact fields to User model:
```prisma
passwordResetToken       String?   @unique
passwordResetTokenExpiry DateTime?
```

Show:
1. Where in User model to add (after which field?)
2. Complete fields with proper formatting
3. Updated User model section (last 10 fields)

VERIFICATION CHECKLIST:
- [ ] Added passwordResetToken (String?, unique)
- [ ] Added passwordResetTokenExpiry (DateTime?)
- [ ] Proper Prisma syntax
- [ ] Correct indentation
- [ ] In User model (not different model)

MIGRATION:
Provide exact commands:
```bash
npx prisma migrate dev --name add_password_reset_fields
npx prisma generate
```

Expected output for each command?

TESTING:
How to verify fields added?
- Prisma Studio check?
- SQL query?

Complete Step 1.1 now.
```

---

### Session 2: Password Reset Utilities (Step 1.2)

```
TASK 1 - STEP 1.2: Password Reset Utilities

PREREQUISITE CHECK:
- [ ] Step 1.1 completed (schema updated)
- [ ] Migration successful
- [ ] Prisma client regenerated

LOAD PLAN:
- File: claudedocs/auth-security-plan/03-TASK1-FORGOT-PASSWORD.md
- Section: Step 1.2
- Reference: Main plan lines 200-400 for complete code

CREATE FILE: src/lib/auth/password-reset.ts

REQUIREMENTS FROM PLAN:
1. PASSWORD_RESET_CONFIG constant (no hardcoding)
2. Three functions: generate, verify, reset
3. Error handling on all async
4. Audit logging in reset function
5. Export config and types

SHOW COMPLETE FILE:
- ALL imports (crypto, prisma, etc)
- PASSWORD_RESET_CONFIG constant
- generatePasswordResetToken function (complete)
- verifyPasswordResetToken function (complete)
- resetPasswordWithToken function (complete)
- All exports

NO "... rest of code ..." - COMPLETE FILE ONLY

CLAUDE.MD COMPLIANCE CHECK:
- [ ] No hardcoding (using PASSWORD_RESET_CONFIG) ✓
- [ ] Single source of truth (centralized logic) ✓
- [ ] DRY (no repeated code) ✓
- [ ] Type safety (all returns typed) ✓
- [ ] Error handling (try-catch everywhere) ✓
- [ ] Security (don't reveal email existence) ✓
- [ ] Audit logging (in reset function) ✓

VERIFICATION:
After showing file:
1. Verify TypeScript compiles
2. Check imports resolve
3. Verify function signatures match plan
4. Confirm exports correct

TEST PLAN:
How to test each function?
- generatePasswordResetToken with test email
- verifyPasswordResetToken with fake token
- Database queries to verify

Implement Step 1.2 now - COMPLETE FILE.
```

---

## 🛡️ Safety Checks

### Before Each File Modification

```
SAFETY CHECK before modifying [FILE_PATH]:

1. BACKUP CHECK:
   - [ ] Git status shows clean or committed work
   - [ ] Can rollback if needed
   - [ ] Database backup exists (if schema change)

2. FILE STATE:
   - Read current [FILE_PATH]
   - Show relevant section (20 lines before/after change point)
   - Confirm understanding of current code

3. CHANGE SCOPE:
   - Lines to modify: [X-Y]
   - What will change: [description]
   - What stays same: [description]
   - Risk level: [LOW/MEDIUM/HIGH]

4. RELATED FILES:
   - Files that import this: [list]
   - Files this imports: [list]
   - Potential breaking changes: [list]

5. PLAN ALIGNMENT:
   - Plan step: [X.Y]
   - Plan requirement: [quote from plan]
   - My change matches requirement: [Y/N]

Proceed with modification? [Y/N]
If Y, show COMPLETE updated file.
```

---

## 📊 Progress Tracking Prompts

### Daily Start

```
DAILY IMPLEMENTATION START

SESSION INFO:
- Date: [date]
- Time allocated: [hours]
- Starting task: Task [N] Step [X.Y]

CONTEXT RELOAD:
- Load: claudedocs/auth-security-plan/00-INDEX.md (progress section)
- Load: 0[N]-TASK[N]-[NAME].md (current task)

STATUS CHECK:
- Completed steps: [list]
- Current step: [X.Y]
- Remaining steps: [list]

ENVIRONMENT CHECK:
- [ ] Git status clean
- [ ] npm run dev works
- [ ] Database connected
- [ ] Last commit: [message]

GOAL FOR SESSION:
Complete Steps: [X.Y through X.Z]

Ready to start Step [X.Y]?
```

---

### Daily End

```
DAILY IMPLEMENTATION END

COMPLETED TODAY:
- Steps finished: [list with checkboxes]
- Files created: [list]
- Files modified: [list]
- Tests passed: [list]

VERIFICATION:
- [ ] All code committed
- [ ] All tests passing
- [ ] No console.log left
- [ ] TypeScript compiles
- [ ] Documentation updated

READY FOR NEXT SESSION:
- Next step: [X.Y]
- Prerequisites: [list]
- Estimated time: [hours]

GIT STATUS:
```bash
git log --oneline -5
git status
```

TOMORROW'S PLAN:
Start with: [step description]
Expected completion: [steps list]

Session complete. Summary saved.
```

---

## 🎯 Key Success Factors

1. **Load Context Every Time**: Never rely on memory, always reload plan files
2. **One Sub-Step at a Time**: Never skip ahead or bundle steps
3. **Complete Files Only**: Never accept "... rest of code ..." responses
4. **Verify After Each Step**: Use checklists religiously
5. **Test Before Proceeding**: Never move forward with broken code
6. **Reference Plan Constantly**: Quote plan requirements in prompts
7. **Check CLAUDE.md Standards**: Every file, every time
8. **Commit Frequently**: After each working sub-step

---

## 📚 Quick Reference

**Best Prompt Structure**:
```
1. Context: What I'm doing + load plan files
2. Current State: What exists now
3. Requirements: What plan says to do
4. Standards: CLAUDE.md checklist
5. Request: Specific action
6. Verification: How to check it's correct
7. Testing: How to test it works
```

**After Every LLM Response**:
- [ ] Matches plan requirements?
- [ ] Follows CLAUDE.md standards?
- [ ] Complete (not partial) file?
- [ ] Includes verification checklist?
- [ ] Provides test procedure?

**If LLM Hallucinating**:
- Stop immediately
- Reload plan file
- Quote exact requirements
- Ask for comparison: plan vs response
- Request correction with reference

---

**Last Updated**: January 2025

**Remember**: LLMs work best with:
- Clear, specific instructions
- Loaded context (plan files)
- Verification checklists
- One step at a time
- Complete outputs (no snippets)
