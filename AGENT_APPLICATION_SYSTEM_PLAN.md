# Agent Application System - Comprehensive Implementation Plan

## **IMPORTANT**
Follow @CLAUDE.md principles: Systematic implementation, NO hardcode, DRY approach, single source of truth, centralized architecture, best software architecture practices.

---

## **1. SYSTEM OVERVIEW**

### **1.1 Business Requirements**
- **Primary Goal**: Enable potential agents to apply through a structured 5-step application form
- **Admin Workflow**: Review, approve/reject applications with automated email notifications
- **Integration**: Seamlessly integrate with existing ecommerce platform architecture

### **1.2 Form Analysis (From Images)**
```
Step 1: Terms & Conditions (Syarat Pengambilan Jutawan Bonda 4)
Step 2: Basic Information (Personal details, business experience)
Step 3: Social Media Information (Instagram, Facebook, TikTok profiles & expertise)
Step 4: Additional Information (JRM experience, previous agency experience)
Step 5: Final Agreement & Submission
```

---

## **2. ARCHITECTURAL PRINCIPLES**

### **2.1 Single Source of Truth**
- **Form Configuration**: One centralized config object defining all steps, fields, validation
- **Status Enums**: Centralized enum definitions for application states
- **Email Templates**: Reusable template system with centralized data interfaces
- **Validation Schemas**: Single Zod schema covering all form fields

### **2.2 DRY Implementation**
- **Reusable Components**: Generic step component, form fields, admin table components
- **Service Layer**: Centralized business logic for application processing
- **Common Utilities**: Shared validation functions, date formatters, status handlers
- **API Patterns**: Consistent error handling, response formatting, authentication

### **2.3 Centralized Architecture**
- **State Management**: Single form state with step-based persistence
- **Database Design**: Normalized schema with proper relationships and constraints
- **Email Service**: Extension of existing email infrastructure
- **Admin Integration**: Follows existing admin dashboard patterns

---

## **3. DATABASE SCHEMA DESIGN**

### **3.1 Core Models**

#### **AgentApplication Model**
```prisma
model AgentApplication {
  id                String                 @id @default(cuid())
  userId            String?
  email             String
  status            AgentApplicationStatus @default(DRAFT)

  // Step 2: Basic Information
  fullName          String
  icNumber          String
  phoneNumber       String
  address           String
  age               Int

  // Business Experience
  hasBusinessExp    Boolean
  businessLocation  String?
  hasTeamLeadExp    Boolean
  isRegistered      Boolean

  // Step 3: Social Media
  instagramHandle   String?
  facebookHandle    String?
  tiktokHandle      String?
  instagramLevel    SocialMediaLevel
  facebookLevel     SocialMediaLevel
  tiktokLevel       SocialMediaLevel

  // Step 4: Additional Information
  hasJrmExp         Boolean
  jrmProducts       String?
  reasonToJoin      String
  expectations      String

  // System Fields
  submittedAt       DateTime?
  reviewedAt        DateTime?
  reviewedBy        String?
  adminNotes        String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  user              User?    @relation(fields: [userId], references: [id])
  reviews           AgentApplicationReview[]

  @@index([email])
  @@index([status])
  @@index([submittedAt])
  @@map("agent_applications")
}

model AgentApplicationReview {
  id             String           @id @default(cuid())
  applicationId  String
  reviewerId     String
  decision       ApplicationDecision
  notes          String?
  createdAt      DateTime         @default(now())

  application    AgentApplication @relation(fields: [applicationId], references: [id])
  reviewer       User            @relation(fields: [reviewerId], references: [id])

  @@map("agent_application_reviews")
}

enum AgentApplicationStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
}

enum SocialMediaLevel {
  TIDAK_MAHIR
  MAHIR
  SANGAT_MAHIR
}

enum ApplicationDecision {
  APPROVED
  REJECTED
  NEEDS_MORE_INFO
}
```

### **3.2 User Model Extension**
```prisma
// Add to existing User model
model User {
  // ... existing fields
  agentApplications AgentApplication[]
  applicationReviews AgentApplicationReview[]
}
```

---

## **4. VALIDATION & TYPES SYSTEM**

### **4.1 Centralized Form Configuration**
**File**: `src/lib/config/agent-application-form.ts`
```typescript
export const FORM_STEPS = [
  {
    id: 'terms',
    title: 'Syarat Pengambilan',
    fields: ['acceptTerms']
  },
  {
    id: 'basic-info',
    title: 'Maklumat Asas',
    fields: ['fullName', 'icNumber', 'phoneNumber', 'address', 'age', ...]
  },
  // ... all 5 steps
] as const;

export const SOCIAL_MEDIA_LEVELS = {
  TIDAK_MAHIR: 'Tidak mahir',
  MAHIR: 'Mahir',
  SANGAT_MAHIR: 'Sangat mahir'
} as const;
```

### **4.2 Validation Schemas**
**File**: `src/lib/validation/agent-application.ts`
```typescript
export const agentApplicationSchema = z.object({
  // Step 1
  acceptTerms: z.boolean().refine(val => val === true),

  // Step 2
  fullName: z.string().min(2).max(100),
  icNumber: z.string().regex(/^\d{6}-\d{2}-\d{4}$/),
  phoneNumber: z.string().regex(/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/),

  // Step 3
  instagramHandle: z.string().optional(),
  instagramLevel: z.nativeEnum(SocialMediaLevel),

  // ... all fields with proper validation
});

// Separate schemas for each step
export const stepSchemas = {
  terms: agentApplicationSchema.pick({ acceptTerms: true }),
  basicInfo: agentApplicationSchema.pick({ fullName: true, icNumber: true, ... }),
  // ... other steps
};
```

---

## **5. API ARCHITECTURE**

### **5.1 Service Layer**
**File**: `src/lib/services/agent-application.service.ts`
```typescript
export class AgentApplicationService {
  // Create/Update operations
  static async createApplication(data: CreateApplicationData): Promise<AgentApplication>
  static async updateApplication(id: string, data: UpdateApplicationData): Promise<AgentApplication>

  // Admin operations
  static async getApplications(filters: ApplicationFilters): Promise<PaginatedApplications>
  static async getApplicationById(id: string): Promise<AgentApplication | null>
  static async updateApplicationStatus(id: string, status: Status, adminId: string, notes?: string): Promise<void>

  // Email triggers
  static async sendConfirmationEmail(application: AgentApplication): Promise<void>
  static async sendStatusUpdateEmail(application: AgentApplication): Promise<void>
  static async notifyAdminsOfNewApplication(application: AgentApplication): Promise<void>
}
```

### **5.2 API Routes**

#### **Public API**
- `POST /api/agent-application` - Submit application
- `GET /api/agent-application/[id]` - Get application status (public token-based)

#### **Admin API**
- `GET /api/admin/agent-applications` - List applications with filters/pagination
- `GET /api/admin/agent-applications/[id]` - Get specific application
- `PUT /api/admin/agent-applications/[id]/status` - Update application status
- `POST /api/admin/agent-applications/[id]/email` - Send custom email

---

## **6. FRONTEND ARCHITECTURE**

### **6.1 Component Structure**
```
src/components/forms/agent-application/
├── AgentApplicationForm.tsx          # Main form container
├── FormStepIndicator.tsx            # Progress indicator
├── FormStepContainer.tsx            # Generic step wrapper
├── hooks/
│   ├── useFormPersistence.ts        # Local storage
│   ├── useStepValidation.ts         # Step-by-step validation
│   └── useFormSubmission.ts         # Submission logic
├── steps/
│   ├── TermsStep.tsx
│   ├── BasicInfoStep.tsx
│   ├── SocialMediaStep.tsx
│   ├── AdditionalInfoStep.tsx
│   └── ReviewStep.tsx
└── fields/
    ├── SocialMediaLevelSelect.tsx
    ├── ICNumberInput.tsx
    └── MalaysianPhoneInput.tsx
```

### **6.2 Admin Interface Structure**
```
src/components/admin/agent-applications/
├── ApplicationsList.tsx              # Main listing
├── ApplicationCard.tsx              # List item component
├── ApplicationDetail.tsx            # Detailed view
├── StatusUpdateDialog.tsx           # Admin actions
├── ApplicationFilters.tsx           # Search/filter
└── ApplicationStats.tsx             # Dashboard stats
```

---

## **7. EMAIL SYSTEM INTEGRATION**

### **7.1 Email Templates**
```
src/components/emails/agent-application/
├── ApplicationConfirmation.tsx       # To applicant
├── AdminNotification.tsx            # To admin team
├── ApplicationApproved.tsx          # Approval notification
├── ApplicationRejected.tsx          # Rejection with feedback
└── ApplicationUpdate.tsx            # Generic status update
```

### **7.2 Email Service Extension**
```typescript
// Addition to existing email-service.ts
export interface AgentApplicationEmailData {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  submissionDate: Date;
  // ... other common fields
}

export async function sendAgentApplicationConfirmation(data: AgentApplicationEmailData)
export async function sendAgentApplicationStatusUpdate(data: AgentApplicationEmailData & { status: string, notes?: string })
export async function notifyAdminsOfNewAgentApplication(data: AgentApplicationEmailData)
```

---

## **8. IMPLEMENTATION PHASES**

### **Phase 1: Foundation (Database & Validation)**
#### **Database Setup**
- [ ] Add AgentApplication model to Prisma schema
- [ ] Add AgentApplicationReview model
- [ ] Add enums (AgentApplicationStatus, SocialMediaLevel, ApplicationDecision)
- [ ] Extend User model with relations
- [ ] Create and run database migration
- [ ] Add appropriate indexes for performance

#### **Validation & Types**
- [ ] Create agent-application-form.ts configuration
- [ ] Create agent-application.ts validation schemas
- [ ] Create TypeScript interfaces for all data types
- [ ] Create utility functions for IC validation, phone formatting
- [ ] Create test data factories for development

### **Phase 2: Backend Services & APIs**

#### **Service Layer**
- [ ] Create AgentApplicationService class
- [ ] Implement CRUD operations with proper error handling
- [ ] Implement status change workflows with audit logging
- [ ] Implement email notification triggers
- [ ] Add rate limiting and security measures

#### **API Routes**
- [ ] Create POST /api/agent-application (public submission)
- [ ] Create GET /api/admin/agent-applications (admin list)
- [ ] Create GET /api/admin/agent-applications/[id] (admin detail)
- [ ] Create PUT /api/admin/agent-applications/[id]/status (admin status update)
- [ ] Add proper authentication, validation, and error handling to all routes
- [ ] Implement API rate limiting

#### **Email Integration**
- [ ] Create email template components
- [ ] Extend email service with agent application methods
- [ ] Test email delivery in development environment
- [ ] Configure email templates with proper styling

### **Phase 3: Frontend Implementation**

#### **Application Form**
- [ ] Create multi-step form container with state management
- [ ] Create step indicator component
- [ ] Create individual step components following form images
- [ ] Implement form persistence with local storage
- [ ] Add form validation with real-time feedback
- [ ] Create responsive design for mobile/desktop
- [ ] Add loading states and error handling

#### **Admin Interface**
- [ ] Create applications listing page with pagination
- [ ] Create application detail/review page
- [ ] Create status update dialogs with notes
- [ ] Add filtering and search functionality
- [ ] Create dashboard statistics widgets
- [ ] Integrate with existing admin navigation

#### **Page Routes**
- [ ] Create /apply/agent page with form
- [ ] Create /admin/agents/applications page
- [ ] Create /admin/agents/applications/[id] page
- [ ] Add proper authentication guards
- [ ] Add breadcrumb navigation

### **Phase 4: Testing & Integration**

#### **Testing**
- [ ] Write unit tests for validation schemas
- [ ] Write unit tests for service methods
- [ ] Write integration tests for API endpoints
- [ ] Write E2E tests for form submission flow
- [ ] Write E2E tests for admin workflow
- [ ] Test email delivery and templates

#### **Performance & Security**
- [ ] Add database query optimization and indexing
- [ ] Implement proper error monitoring and logging
- [ ] Add CSRF protection and input sanitization
- [ ] Test rate limiting and security measures
- [ ] Performance testing with large datasets

#### **Documentation**
- [ ] API documentation for all endpoints
- [ ] Admin user guide for application review process
- [ ] Developer documentation for extending the system
- [ ] Update deployment documentation

---

## **9. SECURITY CONSIDERATIONS**

### **9.1 Data Protection**
- **IC Number Encryption**: Sensitive personal data encrypted at rest
- **Input Sanitization**: All user inputs sanitized to prevent XSS/injection attacks
- **Rate Limiting**: Prevent spam applications and brute force attempts
- **CSRF Protection**: All form submissions protected against CSRF attacks

### **9.2 Access Control**
- **Authentication**: Admin functions require proper authentication
- **Authorization**: Role-based access control for different admin levels
- **Audit Logging**: All administrative actions logged with user details
- **Session Security**: Secure session management following existing patterns

---

## **10. PERFORMANCE CONSIDERATIONS**

### **10.1 Database Optimization**
- **Indexes**: Proper indexing on frequently queried fields
- **Pagination**: Implement cursor-based pagination for large datasets
- **Query Optimization**: Efficient queries with proper joins and selections
- **Connection Pooling**: Use existing database connection pooling

### **10.2 Frontend Performance**
- **Code Splitting**: Lazy load admin components and form steps
- **Caching**: Cache form configuration and validation schemas
- **Optimistic Updates**: Immediate UI feedback for better user experience
- **Image Optimization**: Optimize any uploaded documents or images

---

## **11. MONITORING & ANALYTICS**

### **11.1 Application Metrics**
- **Submission Success Rate**: Track form completion rates
- **Step Abandonment**: Monitor where users drop off in the form
- **Admin Processing Time**: Track time from submission to decision
- **Email Delivery**: Monitor email success/failure rates

### **11.2 Business Intelligence**
- **Application Volume**: Track applications over time
- **Approval Rates**: Monitor approval/rejection ratios
- **Regional Distribution**: Analyze applications by location
- **Social Media Trends**: Track social media expertise levels

---

## **12. DEPLOYMENT CHECKLIST**

### **12.1 Pre-deployment**
- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migration tested in staging
- [ ] Email templates tested with real data
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Admin training documentation prepared

### **12.2 Deployment Steps**
- [ ] Deploy database migrations
- [ ] Deploy backend API changes
- [ ] Deploy frontend changes
- [ ] Configure email templates in production
- [ ] Test full workflow in production
- [ ] Monitor error rates and performance
- [ ] Train admin staff on new workflow

### **12.3 Post-deployment**
- [ ] Monitor application submissions
- [ ] Monitor admin workflow efficiency
- [ ] Track email delivery success
- [ ] Monitor system performance
- [ ] Gather user feedback for improvements
- [ ] Document lessons learned

---

## **13. FUTURE ENHANCEMENTS**

### **13.1 Phase 2 Features**
- **Document Upload**: Allow IC copies and business registration uploads
- **Application Dashboard**: Applicant portal to track status
- **Advanced Analytics**: Detailed reporting and analytics dashboard
- **Automated Screening**: AI-powered initial screening based on criteria
- **Integration**: CRM integration for approved agents

### **13.2 Technical Improvements**
- **Real-time Updates**: WebSocket integration for live admin updates
- **Mobile App**: Dedicated mobile application for agents
- **API Versioning**: Support for multiple API versions
- **Advanced Caching**: Redis caching for improved performance
- **Microservices**: Extract agent system into separate service

---

## **IMPLEMENTATION SUCCESS CRITERIA**

1. **Functionality**: All 5 form steps working with proper validation
2. **Admin Workflow**: Complete review and approval process functional
3. **Email System**: All automated emails delivering successfully
4. **Security**: All security measures implemented and tested
5. **Performance**: Form loads in <2s, admin dashboard in <3s
6. **Testing**: 90%+ code coverage, all E2E tests passing
7. **Documentation**: Complete API and user documentation
8. **Monitoring**: All metrics tracking and error monitoring active

---

**Note**: This implementation follows the established patterns in the JRM E-commerce codebase, maintains consistency with existing architecture, and adheres to all software engineering best practices outlined in @CLAUDE.md.