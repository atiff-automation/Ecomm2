# 🚀 START HERE - Implementation Guide

**You're about to implement critical authentication security improvements.**

---

## 📚 Documentation Structure

### For Quick Start (Read These First)

1. **[README.md](./README.md)** - Overview of all files
2. **[00-INDEX.md](./00-INDEX.md)** - Master navigation and progress tracking
3. **[01-OVERVIEW.md](./01-OVERVIEW.md)** - What we're fixing and why
4. **[02-PREREQUISITES.md](./02-PREREQUISITES.md)** - Setup checklist

### For Implementation

5. **[03-TASK1-FORGOT-PASSWORD.md](./03-TASK1-FORGOT-PASSWORD.md)** - First task (4 hours)
6. **[IMPLEMENTATION-TASKS-SUMMARY.md](./IMPLEMENTATION-TASKS-SUMMARY.md)** - Quick reference for all tasks

### For LLM Prompting (IMPORTANT!)

7. **[HOW-TO-PROMPT-LLM.md](./HOW-TO-PROMPT-LLM.md)** - Complete guide on prompting LLMs
8. **[PROMPT-CHEATSHEET.md](./PROMPT-CHEATSHEET.md)** - Quick reference templates

### Complete Detailed Guide

9. **[../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md](../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md)** - Full 50+ page guide with all code

---

## 🎯 Your Implementation Journey

### Step 1: Understand the Scope (15 min)
```bash
cd claudedocs/auth-security-plan
cat 01-OVERVIEW.md
```

**What you'll learn**:
- 3 critical issues we're fixing
- Time estimates (12-16 hours total)
- Coding standards (CLAUDE.md)
- Success criteria

### Step 2: Verify Prerequisites (30 min)
```bash
cat 02-PREREQUISITES.md
```

**Checklist**:
- [ ] Development environment ready
- [ ] Database backup created
- [ ] Email service tested
- [ ] Git branch created
- [ ] All tools installed

### Step 3: Learn How to Prompt LLMs (15 min)
```bash
cat PROMPT-CHEATSHEET.md
```

**Critical for success**:
- Templates for every scenario
- Anti-hallucination strategies
- Verification checklists
- Example prompts

### Step 4: Start Implementation (12-16 hours)

**Week 1 - Critical Fixes**:
- [ ] Task 1: Forgot Password (4 hours)
- [ ] Task 2: CSRF Protection (3 hours)
- [ ] Task 3: Admin Password (2 hours)

**Week 2-3 - Important Improvements**:
- [ ] Task 4: Failed Login Tracking (3 hours)
- [ ] Task 5: Admin Notifications (2 hours)

---

## 💡 How to Work With LLMs

### The Golden Rule

**ALWAYS load the plan file first, then ask for implementation.**

### Example Session

```
# Session Start
Me: "Load claudedocs/auth-security-plan/03-TASK1-FORGOT-PASSWORD.md and confirm you understand Step 1.1 requirements"

LLM: [confirms understanding]

Me: "Show current prisma/schema.prisma User model (last 5 fields)"

LLM: [shows current state]

Me: "Implement Step 1.1 exactly as per plan. Show COMPLETE updated User model section. Include verification checklist."

LLM: [provides implementation]

Me: "Verify this matches plan requirements and CLAUDE.md standards"

LLM: [verifies]

Me: "Provide test procedure for Step 1.1"

LLM: [provides tests]

# Test, verify, then move to Step 1.2
```

---

## 🚫 Common Mistakes to Avoid

### 1. Skipping Context Loading
❌ "Implement forgot password"
✅ "Load 03-TASK1-FORGOT-PASSWORD.md, then implement Step 1.1 only"

### 2. Accepting Incomplete Code
❌ Accepting "... rest of the code ..."
✅ Demanding "Show COMPLETE file, all imports, all functions"

### 3. Not Verifying Each Step
❌ Moving to next step without testing
✅ Running verification checklist after each sub-step

### 4. Bundling Multiple Steps
❌ "Implement entire Task 1"
✅ "Implement Task 1, Step 1.2 only, then verify"

### 5. Skipping Standards Check
❌ Not checking CLAUDE.md compliance
✅ Verifying each requirement: no hardcoding, DRY, types, etc.

---

## 📊 What Success Looks Like

### After Phase 1 (Week 1):
✅ Users can reset forgotten passwords
✅ CSRF protection on all mutation routes
✅ Admins can change own passwords
✅ All code follows CLAUDE.md standards
✅ All tests passing
✅ No breaking changes

### After Phase 2 (Week 2-3):
✅ Brute force prevention working
✅ Admin login notifications sent
✅ Full audit trail
✅ Production deployed
✅ Monitoring active

---

## 🆘 When You Need Help

### Having Issues?

1. **Check troubleshooting**: See main plan "Troubleshooting Guide"
2. **Verify prerequisites**: Re-read 02-PREREQUISITES.md
3. **Review prompt guide**: Check HOW-TO-PROMPT-LLM.md
4. **Load plan again**: Ensure context is fresh

### LLM Hallucinating?

1. **Stop immediately**
2. **Reload plan file** in new prompt
3. **Quote exact requirements** from plan
4. **Ask for verification** against plan
5. **Demand complete files** (no snippets)

### Code Not Working?

1. **Load plan step** you're implementing
2. **Compare your code** vs plan requirements
3. **Check CLAUDE.md standards** compliance
4. **Run verification checklist**
5. **Test systematically** using plan test procedures

---

## 🎓 Pro Tips

### For Efficient Implementation:

1. **Work in focused blocks** (2-3 hours per session)
2. **Complete one sub-step at a time** (don't rush)
3. **Verify immediately** (catch issues early)
4. **Commit frequently** (after each working sub-step)
5. **Test thoroughly** (follow plan test procedures)

### For Working with LLMs:

1. **Be specific** (reference exact files and step numbers)
2. **Load context** (always load plan files first)
3. **Demand completeness** (reject snippets and placeholders)
4. **Verify constantly** (use checklists after each response)
5. **Test before proceeding** (never skip testing)

---

## 📝 Quick Reference

**Most Important Files**:
- Implementation: [03-TASK1-FORGOT-PASSWORD.md](./03-TASK1-FORGOT-PASSWORD.md)
- Prompting: [PROMPT-CHEATSHEET.md](./PROMPT-CHEATSHEET.md)
- Full code: [../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md](../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md)

**Key Commands**:
```bash
# Database
npx prisma migrate dev --name [name]
npx prisma generate
npx prisma studio

# Development
npm run dev
npm run build
npm run lint

# Git
git status
git add .
git commit -m "feat: [description]"

# Testing
# (manual tests as per plan)
```

---

## ✅ Ready to Start?

**You're ready when**:
- [ ] Read 01-OVERVIEW.md (understand scope)
- [ ] Completed 02-PREREQUISITES.md (environment ready)
- [ ] Read PROMPT-CHEATSHEET.md (know how to prompt)
- [ ] Have 2-3 hours for first task
- [ ] Git branch created
- [ ] Database backed up

**If all checked**, proceed to:

👉 **[03-TASK1-FORGOT-PASSWORD.md](./03-TASK1-FORGOT-PASSWORD.md)**

Start with Step 1.1 and follow the guide systematically!

---

## 🎯 Remember

**Success = Planning + Verification + Testing**

- Plan: Load and understand each step before coding
- Verification: Check against plan and standards after each step
- Testing: Test thoroughly using plan procedures

**Good luck! You've got this! 💪**

---

**Need full details?** See [../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md](../AUTHENTICATION_SECURITY_IMPLEMENTATION_PLAN.md)

**Last Updated**: January 2025
