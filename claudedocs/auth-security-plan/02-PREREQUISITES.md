# Prerequisites & Environment Setup

**Navigation**: [← Overview](./01-OVERVIEW.md) | [Index](./00-INDEX.md) | [Next: Task 1 →](./03-TASK1-FORGOT-PASSWORD.md)

---

## Before You Start Checklist

### 🔍 Review Requirements

- [ ] Read [01-OVERVIEW.md](./01-OVERVIEW.md) completely
- [ ] Understand scope and time estimates
- [ ] Review CLAUDE.md coding standards
- [ ] Understand risk assessment
- [ ] Have backup and rollback plan ready

### 🛠 Development Environment

- [ ] Node.js v18+ installed
- [ ] PostgreSQL database accessible
- [ ] Git version control configured
- [ ] Code editor with TypeScript support (VSCode recommended)
- [ ] Terminal/command line access

### 📦 Project Setup

- [ ] Project repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Development server runs (`npm run dev`)

### 🗄️ Database

- [ ] PostgreSQL database accessible
- [ ] Database backup completed
- [ ] Prisma CLI working (`npx prisma --version`)
- [ ] Can run migrations (`npx prisma migrate dev`)
- [ ] Can query database (`npx prisma studio`)

### 📧 Email Service

- [ ] Resend API key obtained
- [ ] `RESEND_API_KEY` environment variable set
- [ ] `FROM_EMAIL` verified in Resend dashboard
- [ ] Test email can be sent
- [ ] Email templates render correctly

---

## Required Knowledge

### Essential Skills (Must Have)

**TypeScript/JavaScript**:
- Async/await and Promises
- Error handling (try-catch)
- Modern ES6+ syntax
- Type annotations

**Next.js 14**:
- App Router structure
- Server Components vs Client Components
- API Routes
- Environment variables

**React**:
- Functional components
- Hooks (useState, useEffect)
- Form handling
- Client-side routing

**Prisma ORM**:
- Schema definition
- Migrations
- Queries and mutations
- Relations

**Authentication**:
- JWT tokens
- Session management
- Password hashing
- NextAuth.js basics

### Nice to Have

**Security**:
- CSRF protection concepts
- Rate limiting
- Password security best practices

**Email**:
- Transactional email concepts
- Email template design
- Delivery troubleshooting

---

## Environment Variables

### Verify Existing Variables

**File**: `.env`

**Check these exist**:
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Service
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"
```

### Add New Variables

**Add to `.env`**:
```bash
# Admin Security Notifications (Phase 2)
ADMIN_NOTIFICATION_EMAIL="owner@yourbusiness.com"
```

### Production Environment

**For Railway/Vercel deployment, ensure**:
- [ ] All environment variables set in dashboard
- [ ] `NEXT_PUBLIC_APP_URL` uses HTTPS
- [ ] `NEXTAUTH_URL` matches deployment URL
- [ ] `FROM_EMAIL` is verified domain

---

## Test Environment Setup

### 1. Database Connection Test

```bash
# Test Prisma connection
npx prisma db pull

# Expected: Schema synced successfully
```

### 2. Email Service Test

Create temporary test file: `test-email.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: 'your-test-email@example.com',
      subject: 'Test Email',
      text: 'This is a test email from JRM E-commerce',
    });

    console.log('✅ Email sent:', result);
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testEmail();
```

Run test:
```bash
npx ts-node test-email.ts

# Expected: ✅ Email sent: { id: '...' }
# Check inbox for test email
```

### 3. Development Server Test

```bash
# Start development server
npm run dev

# Expected: Server running on http://localhost:3000
```

Visit: http://localhost:3000/auth/signin
- [ ] Page loads without errors
- [ ] Can navigate to signup
- [ ] Forms are functional

---

## Tools & Extensions

### Recommended VSCode Extensions

**Essential**:
- Prisma (Prisma language support)
- ESLint (Code linting)
- Prettier (Code formatting)
- TypeScript and JavaScript Language Features

**Helpful**:
- Error Lens (Inline error display)
- Thunder Client (API testing)
- GitLens (Git history)

### Command Line Tools

**Install if needed**:
```bash
# TypeScript compiler
npm install -g typescript

# Prisma CLI (or use npx)
npm install -g prisma

# Node version manager (optional)
# nvm install 18
```

---

## Git Setup

### Branch Strategy

**Recommended flow**:
```bash
# Create feature branch
git checkout -b feature/auth-security-improvements

# Work on tasks
git add .
git commit -m "feat: implement forgot password flow"

# Keep updated with main
git fetch origin
git merge origin/main

# Push when ready
git push origin feature/auth-security-improvements
```

### Commit Message Format

**Follow conventional commits**:
```bash
# Features
git commit -m "feat: add forgot password email template"
git commit -m "feat: implement CSRF protection middleware"

# Fixes
git commit -m "fix: allow admin users to change password"
git commit -m "fix: CSRF token validation in auth routes"

# Documentation
git commit -m "docs: update authentication flow documentation"

# Refactor
git commit -m "refactor: extract password validation to schema"

# Tests
git commit -m "test: add forgot password flow integration tests"
```

---

## Database Backup

### Before Making Schema Changes

**Create backup**:
```bash
# For PostgreSQL
pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql

# Or using Prisma Studio export
npx prisma studio
# File → Export → Save JSON
```

**Verify backup**:
```bash
# Check file exists and has content
ls -lh backup_*.sql
```

**Test restore** (optional, on test database):
```bash
psql -U username -d test_database < backup_20250120.sql
```

---

## Code Editor Setup

### VSCode Settings

**File**: `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

### Prettier Configuration

**File**: `.prettierrc` (if not exists, create it)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

---

## Testing Tools Setup

### Manual Testing Checklist

**Browser**:
- [ ] Chrome/Edge (primary testing)
- [ ] Firefox (secondary)
- [ ] Safari (if on Mac)
- [ ] Mobile browser (responsive testing)

**Browser DevTools**:
- [ ] Network tab monitoring
- [ ] Console for errors
- [ ] Application tab for cookies/storage
- [ ] Responsive design mode

### API Testing

**Using Thunder Client or Postman**:

1. Create collection: "Auth Security Tests"
2. Add requests for each endpoint
3. Save environment variables
4. Test all scenarios

**Example requests**:
```
POST /api/auth/forgot-password
Body: { "email": "test@example.com" }

POST /api/auth/reset-password
Body: {
  "token": "abc123...",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

---

## Documentation Access

### Internal Documentation

**Files to have open**:
- [ ] `CLAUDE.md` - Coding standards
- [ ] `claudedocs/CODING_STANDARDS.md` - Detailed standards
- [ ] `prisma/schema.prisma` - Database schema
- [ ] This implementation plan (00-INDEX.md)

### External Documentation

**Bookmark these**:
- NextAuth.js: https://next-auth.js.org/
- Prisma: https://www.prisma.io/docs
- Zod: https://zod.dev/
- Resend: https://resend.com/docs
- React Email: https://react.email/docs
- shadcn/ui: https://ui.shadcn.com/

---

## Project Structure Understanding

### Key Directories

```
project-root/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── api/               # API routes
│   │   └── admin/             # Admin pages
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   └── lib/                   # Utilities
│       ├── auth/             # Auth utilities
│       ├── email/            # Email templates
│       ├── security/         # Security utilities
│       └── validation/       # Zod schemas
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration files
├── claudedocs/               # Documentation
└── scripts/                  # Utility scripts
```

---

## Troubleshooting Setup Issues

### Database Connection Fails

**Issue**: `Can't reach database server`

**Solutions**:
1. Check PostgreSQL is running
2. Verify DATABASE_URL format
3. Check firewall/network access
4. Test connection: `psql $DATABASE_URL`

### Email Sending Fails

**Issue**: `Invalid API key` or `Authentication failed`

**Solutions**:
1. Verify RESEND_API_KEY is correct
2. Check FROM_EMAIL is verified domain
3. Test API key directly:
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json"
   ```

### TypeScript Errors

**Issue**: `Cannot find module` or type errors

**Solutions**:
1. Regenerate types: `npx prisma generate`
2. Restart TypeScript server in VSCode
3. Delete node_modules and reinstall
4. Check tsconfig.json includes all paths

### Development Server Won't Start

**Issue**: `Port already in use` or build errors

**Solutions**:
1. Kill process on port: `lsof -ti:3000 | xargs kill`
2. Clear Next.js cache: `rm -rf .next`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Check for syntax errors in code

---

## Pre-Implementation Verification

### Final Checklist Before Starting

- [ ] All prerequisites completed
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] Email service tested
- [ ] Development server running
- [ ] Git branch created
- [ ] Documentation accessible
- [ ] Tools and extensions installed
- [ ] Understand CLAUDE.md standards
- [ ] Ready to commit time (12-16 hours)

### Confirm Understanding

**Answer these questions**:
1. What are the 3 critical issues we're fixing?
2. What is the estimated time for Phase 1?
3. Where should new auth utilities be placed?
4. How do we test email sending?
5. What's the rollback procedure?

**If you can't answer these, review [01-OVERVIEW.md](./01-OVERVIEW.md) again.**

---

## Ready to Start?

**You're ready when**:
✅ All checkboxes above are checked
✅ Environment is working
✅ Backup is created
✅ You understand the scope
✅ You have allocated time

**Next Steps**:
1. Move to [03-TASK1-FORGOT-PASSWORD.md](./03-TASK1-FORGOT-PASSWORD.md)
2. Follow steps sequentially
3. Test after each sub-task
4. Commit frequently with good messages

---

**Navigation**: [← Overview](./01-OVERVIEW.md) | [Index](./00-INDEX.md) | [Next: Task 1 →](./03-TASK1-FORGOT-PASSWORD.md)
