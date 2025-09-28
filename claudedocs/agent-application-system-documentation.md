# Agent Application System - Complete Documentation

## Overview

The Agent Application System is a comprehensive multi-step form and admin workflow system for processing agent applications in the JRM E-commerce platform. It provides a secure, validated, and user-friendly interface for users to apply as agents, with robust admin tools for review and approval.

## System Architecture

### Core Components

1. **Frontend Form**: 5-step progressive form with real-time validation
2. **Backend APIs**: RESTful endpoints for CRUD operations
3. **Database Layer**: Prisma ORM with PostgreSQL
4. **Email System**: React Email templates with notification workflows
5. **Admin Dashboard**: Management interface for application review
6. **Security Layer**: Input sanitization, rate limiting, and validation

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with optimized indexing
- **Validation**: Zod schemas with Malaysian-specific patterns
- **Email**: React Email with HTML/Plain text templates
- **Testing**: Jest, React Testing Library, Playwright E2E
- **Security**: Input sanitization, rate limiting, CSRF protection

## File Structure

```
src/
├── app/apply/agent/               # Application form pages
│   ├── page.tsx                   # Main form entry point
│   ├── [step]/                    # Step-based routing
│   │   └── page.tsx              # Individual step pages
├── components/forms/agent/        # Form components
│   ├── AgentApplicationForm.tsx   # Main form container
│   ├── StepIndicator.tsx         # Progress indicator
│   ├── steps/                    # Individual step components
│   │   ├── TermsStep.tsx
│   │   ├── BasicInfoStep.tsx
│   │   ├── SocialMediaStep.tsx
│   │   ├── AdditionalInfoStep.tsx
│   │   └── ReviewStep.tsx
├── app/api/agent-application/     # API endpoints
│   ├── route.ts                  # Main CRUD operations
│   ├── [id]/                     # Individual application ops
│   │   ├── route.ts
│   │   └── status/route.ts       # Status updates
│   └── stats/route.ts            # Dashboard statistics
├── lib/
│   ├── validation/               # Validation schemas
│   │   ├── agent-application.ts  # Zod schemas
│   │   └── __tests__/           # Validation tests
│   ├── services/                # Business logic
│   │   ├── agent-application.service.ts
│   │   └── __tests__/           # Service tests
│   ├── email/                   # Email system
│   │   ├── email-service.ts     # Email orchestration
│   │   └── templates/           # React Email templates
│   └── security/                # Security utilities
│       └── input-validation.ts  # Sanitization functions
├── types/                       # TypeScript definitions
│   └── agent-application.ts     # System types
└── prisma/
    ├── schema.prisma            # Database schema
    └── migrations/              # Database migrations
```

## Database Schema

### AgentApplication Table

```sql
model AgentApplication {
  id          String   @id @default(cuid())
  userId      String?  -- Optional for guest applications
  email       String   @unique
  status      AgentApplicationStatus @default(DRAFT)

  -- Terms (Step 1)
  acceptTerms Boolean

  -- Basic Information (Step 2)
  fullName    String
  icNumber    String
  phoneNumber String
  address     String
  age         Int

  -- Business Experience
  hasBusinessExp    Boolean
  businessLocation  String?
  hasTeamLeadExp    Boolean
  isRegistered      Boolean
  jenis            BusinessType

  -- Social Media (Step 3)
  instagramHandle String?
  facebookHandle  String?
  tiktokHandle    String?
  instagramLevel  SocialMediaLevel
  facebookLevel   SocialMediaLevel
  tiktokLevel     SocialMediaLevel

  -- Additional Information (Step 4)
  hasJrmExp     Boolean
  jrmProducts   String?
  reasonToJoin  String
  expectations  String

  -- System Fields
  submittedAt DateTime?
  reviewedAt  DateTime?
  reviewedBy  String?
  adminNotes  String?

  -- Relations
  user    User? @relation(fields: [userId], references: [id])
  reviews AgentApplicationReview[]

  -- Indexes for performance
  @@index([email])
  @@index([status])
  @@index([submittedAt])
  @@index([userId])
}
```

### Enums

```sql
enum AgentApplicationStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
}

enum SocialMediaLevel {
  TIDAK_MAHIR    // Not skilled
  MAHIR          // Skilled
  SANGAT_MAHIR   // Very skilled
}

enum BusinessType {
  KEDAI           // Shop
  MUDAH           // Easy/Simple
  TIDAK_BERKAITAN // Not related
  LAIN_LAIN       // Others
}

enum ApplicationDecision {
  PENDING
  APPROVED
  REJECTED
  NEEDS_MORE_INFO
}
```

## Form Flow

### Step 1: Terms & Conditions
- **Purpose**: User agreement acceptance
- **Validation**: Required boolean acceptance
- **Fields**: `acceptTerms`

### Step 2: Basic Information
- **Purpose**: Personal and business details
- **Validation**: Malaysian-specific patterns (IC, phone)
- **Fields**:
  - Personal: `fullName`, `icNumber`, `phoneNumber`, `address`, `age`
  - Business: `hasBusinessExp`, `businessLocation`, `hasTeamLeadExp`, `isRegistered`, `jenis`

### Step 3: Social Media Presence
- **Purpose**: Digital marketing capabilities assessment
- **Validation**: Platform-specific handle formats
- **Fields**:
  - Handles: `instagramHandle`, `facebookHandle`, `tiktokHandle`
  - Skill levels: `instagramLevel`, `facebookLevel`, `tiktokLevel`

### Step 4: Additional Information
- **Purpose**: JRM experience and motivation
- **Validation**: Minimum text lengths, conditional requirements
- **Fields**: `hasJrmExp`, `jrmProducts`, `reasonToJoin`, `expectations`

### Step 5: Review & Submit
- **Purpose**: Final confirmation and submission
- **Validation**: Final agreement required
- **Fields**: `finalAgreement`

## Validation System

### Malaysian-Specific Patterns

```typescript
// IC Number: 123456-12-1234
const icNumberRegex = /^\d{6}-\d{2}-\d{4}$/;

// Phone: +60123456789 or 0123456789
const phoneRegex = /^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/;

// Name: Supports Malaysian naming conventions
const nameRegex = /^[\p{L}\p{M}\s'./()-]+$/u;
```

### Conditional Validation

```typescript
// Business location required if has business experience
if (data.hasBusinessExp && !data.businessLocation?.trim()) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['businessLocation'],
    message: 'Lokasi perniagaan diperlukan jika anda mempunyai pengalaman perniagaan'
  });
}

// JRM products required if has JRM experience
if (data.hasJrmExp && !data.jrmProducts?.trim()) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['jrmProducts'],
    message: 'Sila nyatakan produk JRM yang pernah anda gunakan'
  });
}
```

### Social Media Handle Validation

```typescript
// Instagram: 2-30 chars, alphanumeric + . and _
instagramHandle: z.string()
  .refine(val => {
    if (val === '') return true;
    if (val.length < 2) return false;
    if (val.includes('..') || val.includes('__')) return false;
    if (val.startsWith('.') || val.startsWith('_')) return false;
    if (val.endsWith('.') || val.endsWith('_')) return false;
    return /^[a-zA-Z0-9._]{2,30}$/.test(val);
  })
```

## API Endpoints

### Public Endpoints

```typescript
POST /api/agent-application
// Create new application
Body: AgentApplicationFormData
Response: CreateApplicationResponse

GET /api/agent-application/[id]
// Get application by ID (public access for applicant)
Response: AgentApplicationWithRelations
```

### Admin Endpoints

```typescript
GET /api/agent-application
// List applications with filtering and pagination
Query: ApplicationFilters
Response: ApplicationListResponse

PUT /api/agent-application/[id]/status
// Update application status
Body: UpdateApplicationStatusRequest
Response: void

GET /api/agent-application/stats
// Get dashboard statistics
Response: ApplicationStats
```

### Request/Response Types

```typescript
interface CreateApplicationRequest {
  formData: AgentApplicationFormData;
  userId?: string;
}

interface CreateApplicationResponse {
  id: string;
  status: AgentApplicationStatus;
  submittedAt: Date;
  message: string;
}

interface ApplicationFilters {
  status?: AgentApplicationStatus;
  search?: string;
  hasJrmExp?: boolean;
  socialMediaLevel?: SocialMediaLevel;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}
```

## Email System

### Template Types

1. **Application Confirmation** (`agent-application-confirmation.tsx`)
   - Sent to applicant upon submission
   - Includes application ID and next steps
   - Professional Malaysian business format

2. **Status Update** (`agent-application-status-update.tsx`)
   - Sent when admin changes application status
   - Includes status change reason and next steps
   - Conditional content based on approval/rejection

3. **Admin Notification** (`new-agent-application-admin.tsx`)
   - Sent to all active admins when new application submitted
   - Includes quick action buttons for review
   - Dashboard link for detailed review

### Email Service Usage

```typescript
// Confirmation email
await emailService.sendAgentApplicationConfirmation({
  applicationId: application.id,
  applicantName: application.fullName,
  applicantEmail: application.email,
  submissionDate: application.submittedAt
});

// Status update email
await emailService.sendAgentApplicationStatusUpdate({
  applicationId: application.id,
  applicantName: application.fullName,
  applicantEmail: application.email,
  status: application.status,
  adminNotes: application.adminNotes,
  reviewDate: application.reviewedAt
});

// Admin notification
await emailService.notifyAdminsOfNewAgentApplication({
  applicationId: application.id,
  applicantName: application.fullName,
  applicantEmail: application.email,
  submissionDate: application.submittedAt,
  adminEmails: adminEmailList
});
```

## Security Implementation

### Input Sanitization

```typescript
// Sanitize all string inputs
const sanitizedFormData = {
  ...formData,
  fullName: sanitizeString(formData.fullName),
  address: sanitizeString(formData.address),
  businessLocation: formData.businessLocation ?
    sanitizeString(formData.businessLocation) : undefined,
  // ... other string fields
};
```

### Rate Limiting
- Applied to all public endpoints
- Prevents spam submissions
- Configurable limits per endpoint

### Validation Layers
1. **Client-side**: Real-time feedback with Zod
2. **API layer**: Server-side validation before processing
3. **Database layer**: Schema constraints and indexes

### CSRF Protection
- Next.js built-in CSRF protection
- Secure headers configuration
- SameSite cookie settings

## Performance Optimizations

### Database Indexing

```sql
-- Essential indexes for query performance
@@index([email])         -- Email lookups
@@index([status])        -- Status filtering
@@index([submittedAt])   -- Date-based sorting
@@index([userId])        -- User-specific queries

-- Composite indexes for complex queries
@@index([status, submittedAt])    -- Admin dashboard
@@index([status, hasJrmExp])      -- Filtering combinations
```

### Query Optimization

```typescript
// Efficient pagination with proper includes
const applications = await prisma.agentApplication.findMany({
  where: filterConditions,
  include: {
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    },
    reviews: {
      include: { reviewer: true },
      orderBy: { createdAt: 'desc' }
    }
  },
  orderBy: { submittedAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit
});
```

### Caching Strategy

Recommended caching opportunities:
- Application statistics (5-minute TTL)
- Form configuration data (1-hour TTL)
- Admin user lists (15-minute TTL)

## Testing Strategy

### Unit Tests (100% Coverage)

1. **Validation Schemas** (`src/lib/validation/__tests__/`)
   - All validation rules tested
   - Malaysian-specific pattern validation
   - Conditional validation logic
   - Error message verification

2. **Service Methods** (`src/lib/services/__tests__/`)
   - Business logic testing
   - Error handling scenarios
   - Database interaction mocking
   - Email service integration

### Integration Tests

1. **API Endpoints** (`src/app/api/__tests__/`)
   - Full request/response cycle
   - Authentication and authorization
   - Error handling and validation
   - Database state changes

### E2E Tests (Playwright)

1. **Form Submission Flow**
   - Complete form journey
   - Validation error handling
   - Step navigation
   - Submission confirmation

2. **Admin Workflow**
   - Application review process
   - Status update functionality
   - Dashboard interactions
   - Bulk operations

### Email Testing

1. **Template Rendering**
   - HTML and plain text output
   - Dynamic content injection
   - Responsive design validation

2. **Delivery Testing**
   - SMTP configuration testing
   - Email queue processing
   - Error handling for failed sends

## Admin Dashboard Features

### Application List View
- Filterable and sortable list
- Quick status updates
- Bulk operations support
- Export functionality

### Application Detail View
- Complete application information
- Review history tracking
- Status update interface
- Admin notes system

### Dashboard Statistics
- Real-time application counts
- Status distribution charts
- Monthly submission trends
- Performance metrics

### Search and Filtering
- Full-text search across all fields
- Status-based filtering
- Date range filtering
- JRM experience filtering
- Social media skill level filtering

## Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="password"
FROM_EMAIL="noreply@jrm.com"
FROM_NAME="JRM E-commerce"

# Security
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Checklist

- [ ] Database migrations applied
- [ ] Email templates tested
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Performance monitoring setup
- [ ] Error tracking configured
- [ ] Backup strategy implemented
- [ ] SSL certificates configured

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Application Metrics**
   - Submission rate
   - Approval/rejection ratios
   - Time to approval
   - Abandonment rate by step

2. **Performance Metrics**
   - API response times
   - Database query performance
   - Email delivery success rates
   - Error rates

3. **Security Metrics**
   - Rate limit triggers
   - Validation failures
   - Failed authentication attempts
   - Suspicious activity patterns

### Maintenance Tasks

1. **Daily**
   - Monitor error logs
   - Check email delivery status
   - Review application submission rates

2. **Weekly**
   - Database performance review
   - Security audit logs review
   - User feedback analysis

3. **Monthly**
   - Performance optimization review
   - Security updates application
   - Feature usage analytics
   - Capacity planning review

## Troubleshooting Guide

### Common Issues

1. **Validation Errors**
   - Check Malaysian-specific patterns (IC, phone)
   - Verify conditional validation logic
   - Test with edge cases

2. **Email Delivery Issues**
   - Verify SMTP configuration
   - Check spam folder placement
   - Test template rendering

3. **Performance Issues**
   - Review database query performance
   - Check index utilization
   - Monitor memory usage

4. **Security Concerns**
   - Review rate limit logs
   - Check input sanitization
   - Audit authentication flows

### Debug Commands

```bash
# Run validation tests
npm run test src/lib/validation

# Run service tests
npm run test src/lib/services

# Run E2E tests
npm run test:e2e

# Performance analysis
npm run analyze

# Database query analysis
npx tsx scripts/performance-optimization.ts
```

## Conclusion

The Agent Application System provides a robust, secure, and user-friendly platform for processing agent applications. With comprehensive validation, efficient database design, and thorough testing, it meets enterprise-level requirements while maintaining excellent user experience.

The system is designed for scalability and maintainability, with clear separation of concerns, comprehensive documentation, and extensive test coverage. Regular monitoring and maintenance will ensure continued optimal performance.