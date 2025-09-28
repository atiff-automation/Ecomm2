# User Management System Implementation Plan
**JRM E-commerce Platform - Technical Admin Separation**

## Table of Contents
- [1. Architecture Overview](#1-architecture-overview)
- [2. Database Design](#2-database-design)
- [3. API Architecture](#3-api-architecture)
- [4. Frontend Components](#4-frontend-components)
- [5. Security Implementation](#5-security-implementation)
- [6. Website Control System](#6-website-control-system)
- [7. Implementation Phases](#7-implementation-phases)
- [8. Task Checklist](#8-task-checklist)
- [9. Testing Strategy](#9-testing-strategy)
- [10. Best Practices](#10-best-practices)

---

## 1. Architecture Overview

### 1.1 Role Hierarchy Design

```
SUPERADMIN (Technical Support)
├── Technical user management
├── Website activation control
├── System maintenance
└── NO business data access

ADMIN (Business Owner)
├── Full business operations
├── Staff user creation
├── Business settings
└── All business features

STAFF (Business Employee)
├── Day-to-day operations
├── Limited business access
└── Cannot create users
```

### 1.2 Core Principles

**Separation of Concerns:**
- **Technical Layer**: SUPERADMIN manages platform infrastructure
- **Business Layer**: ADMIN/STAFF manage business operations
- **Data Isolation**: Complete separation between technical and business data

**Security First:**
- Role-based access control (RBAC)
- API-level permission enforcement
- UI-level feature hiding
- Session-based role validation

**Maintainable Architecture:**
- Single responsibility principle
- DRY implementation
- Centralized access control
- Consistent patterns

---

## 2. Database Design

### 2.1 Existing Schema (No Changes Required)

```sql
-- User table already supports this architecture
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  firstName    String
  lastName     String
  phone        String?
  role         UserRole @default(CUSTOMER)
  status       UserStatus @default(PENDING_VERIFICATION)
  // ... existing fields
}

enum UserRole {
  CUSTOMER    // Not used in admin
  STAFF       // Business employee
  ADMIN       // Business owner
  SUPERADMIN  // Technical support
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}
```

### 2.2 New Schema Requirements

```sql
-- Website control table
model SiteSettings {
  id             String   @id @default(cuid())
  isActive       Boolean  @default(true)
  maintenanceMode Boolean @default(false)
  lastChangedBy  String
  lastChangedAt  DateTime @default(now())
  message        String?  // Maintenance message
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("site_settings")
}
```

### 2.3 Database Indexes

```sql
-- Optimize user queries by role
@@index([role, status])
@@index([email, role])
```

---

## 3. API Architecture

### 3.1 Business User Management API

**File: `/src/app/api/admin/users/route.ts`**

```typescript
// GET: List business users (ADMIN/STAFF only)
// - Accessible by: ADMIN, SUPERADMIN (limited view)
// - Returns: ADMIN and STAFF users only
// - Excludes: SUPERADMIN users, customer data

// POST: Create staff users
// - Accessible by: ADMIN only
// - Can create: STAFF role only
// - Validation: Email uniqueness, password strength
```

**File: `/src/app/api/admin/users/[userId]/route.ts`**

```typescript
// GET: User details
// PUT: Update user (role changes within limits)
// DELETE: Deactivate user (soft delete)
```

### 3.2 SuperAdmin API Extensions

**File: `/src/app/api/superadmin/users/route.ts`**

```typescript
// Enhanced existing endpoint
// GET: List admin/staff users (no business data)
// POST: Create ADMIN users (SUPERADMIN only)
```

**File: `/src/app/api/superadmin/site-control/route.ts`**

```typescript
// GET: Current site status
// POST: Toggle website active/inactive
// PUT: Update maintenance mode and message
```

### 3.3 Middleware Implementation

**File: `/src/middleware/roleGuard.ts`**

```typescript
// Role-based API protection
export function createRoleGuard(allowedRoles: UserRole[]) {
  return async (request: NextRequest) => {
    const token = await getToken({ req: request });

    // Validate user role
    if (!token || !allowedRoles.includes(token.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Business API protection (exclude SUPERADMIN)
    if (isBusinessAPI(request.url) && token.role === 'SUPERADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }
  };
}
```

### 3.4 API Security Matrix

| Endpoint | STAFF | ADMIN | SUPERADMIN |
|----------|-------|-------|------------|
| `/api/admin/users` | ❌ | ✅ | ❌ |
| `/api/admin/products` | ✅ | ✅ | ❌ |
| `/api/admin/orders` | ✅ | ✅ | ❌ |
| `/api/admin/customers` | ✅ | ✅ | ❌ |
| `/api/admin/reports` | ❌ | ✅ | ❌ |
| `/api/superadmin/users` | ❌ | ❌ | ✅ |
| `/api/superadmin/site-control` | ❌ | ❌ | ✅ |

---

## 4. Frontend Components

### 4.1 Business User Management Pages

**File: `/src/app/admin/users/page.tsx`**
- User listing with role filtering
- Create user button (ADMIN only)
- User status management
- Role-based column visibility

**File: `/src/app/admin/users/create/page.tsx`**
- User creation form
- Role selection (STAFF only for ADMIN)
- Password generation
- Email validation

**File: `/src/app/admin/users/[userId]/edit/page.tsx`**
- User editing form
- Status updates
- Role changes (within hierarchy)

### 4.2 SuperAdmin Enhancements

**File: `/src/app/superadmin/page.tsx`** (Enhanced)
- Add ADMIN user creation section
- Website control panel
- Maintenance mode toggle
- Enhanced user management table

### 4.3 Navigation Updates

**File: `/src/app/admin/layout.tsx`**

```typescript
// Updated navigation items
const navigationItems = [
  // ... existing items
  {
    label: 'Staff Management',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN], // Only ADMIN can see
    description: 'Manage staff accounts',
  },
];

// Role-based filtering logic
const filteredNavigationItems = navigationItems.filter(item => {
  // Hide business sections from SUPERADMIN
  if (session.user.role === UserRole.SUPERADMIN) {
    return false; // SUPERADMIN uses separate interface
  }

  return item.roles.includes(session.user.role);
});
```

### 4.4 Component Architecture

```
components/
├── admin/
│   ├── users/
│   │   ├── UserList.tsx
│   │   ├── UserCreateForm.tsx
│   │   ├── UserEditForm.tsx
│   │   └── UserStatusBadge.tsx
│   └── layout/
│       └── RoleBasedNavigation.tsx
├── superadmin/
│   ├── AdminUserManager.tsx
│   ├── SiteControlPanel.tsx
│   └── SystemStatus.tsx
└── auth/
    ├── RoleGuard.tsx
    └── ProtectedRoute.tsx
```

---

## 5. Security Implementation

### 5.1 Role-Based Access Control (RBAC)

**Permission Matrix:**

```typescript
const PERMISSIONS = {
  // Business Operations
  MANAGE_PRODUCTS: [UserRole.STAFF, UserRole.ADMIN],
  MANAGE_ORDERS: [UserRole.STAFF, UserRole.ADMIN],
  VIEW_CUSTOMERS: [UserRole.STAFF, UserRole.ADMIN],
  MANAGE_REPORTS: [UserRole.ADMIN],
  MANAGE_SETTINGS: [UserRole.ADMIN],

  // User Management
  CREATE_STAFF: [UserRole.ADMIN],
  CREATE_ADMIN: [UserRole.SUPERADMIN],

  // System Control
  CONTROL_WEBSITE: [UserRole.SUPERADMIN],
  SYSTEM_MAINTENANCE: [UserRole.SUPERADMIN],
};
```

### 5.2 API Security Middleware

**File: `/src/lib/auth/permissions.ts`**

```typescript
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles?.includes(userRole) ?? false;
}

export function requirePermission(permission: string) {
  return async (request: NextRequest) => {
    const token = await getToken({ req: request });

    if (!token || !hasPermission(token.role, permission)) {
      throw new Error('Insufficient permissions');
    }
  };
}
```

### 5.3 Frontend Security Guards

**File: `/src/components/auth/RoleGuard.tsx`**

```typescript
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { data: session } = useSession();

  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return fallback || null;
  }

  return <>{children}</>;
}
```

### 5.4 Data Isolation

**Business API Protection:**

```typescript
// Middleware to block SUPERADMIN from business APIs
export function businessAPIGuard(request: NextRequest) {
  const token = await getToken({ req: request });

  if (token?.role === UserRole.SUPERADMIN) {
    return new NextResponse('Business data access denied', { status: 403 });
  }
}
```

---

## 6. Website Control System

### 6.1 Site Status Management

**Database Model:**
```sql
model SiteSettings {
  id               String   @id @default(cuid())
  isActive         Boolean  @default(true)
  maintenanceMode  Boolean  @default(false)
  maintenanceMessage String?
  lastChangedBy    String
  lastChangedAt    DateTime @default(now())
}
```

### 6.2 Frontend Implementation

**SuperAdmin Control Panel:**

```typescript
// Site control component
export function SiteControlPanel() {
  const [siteStatus, setSiteStatus] = useState<SiteSettings>();

  const toggleWebsite = async () => {
    const response = await fetch('/api/superadmin/site-control', {
      method: 'POST',
      body: JSON.stringify({
        isActive: !siteStatus.isActive
      }),
    });

    if (response.ok) {
      fetchSiteStatus(); // Refresh status
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🌐 Website Control</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Status: {siteStatus.isActive ? '✅ LIVE' : '❌ OFFLINE'}
            </p>
            <p className="text-sm text-gray-500">
              Last changed: {formatDate(siteStatus.lastChangedAt)}
            </p>
          </div>
          <Button
            onClick={toggleWebsite}
            variant={siteStatus.isActive ? 'destructive' : 'default'}
          >
            {siteStatus.isActive ? 'Take Offline' : 'Bring Online'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 6.3 Middleware Implementation

**File: `/src/middleware.ts`**

```typescript
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if site is active for public routes
  if (isPublicRoute(pathname)) {
    const siteSettings = await getSiteSettings();

    if (!siteSettings.isActive && !isAdminRoute(pathname)) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // Continue with auth and role checks
  return authMiddleware(request);
}
```

### 6.4 Maintenance Page

**File: `/src/app/maintenance/page.tsx`**

```typescript
export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">🚧 Site Under Maintenance</h1>
        <p className="text-gray-600 mb-4">
          We're currently performing scheduled maintenance.
          Please check back soon.
        </p>
        <p className="text-sm text-gray-500">
          For urgent matters, please contact support.
        </p>
      </div>
    </div>
  );
}
```

---

## 7. Implementation Phases

### Phase 1: Backend Foundation (Week 1)

**Priority: High - Core Infrastructure**

1. **Database Setup**
   - [ ] Create SiteSettings table
   - [ ] Add database indexes for performance
   - [ ] Update Prisma schema and migrate

2. **API Development**
   - [ ] Create `/api/admin/users` endpoints
   - [ ] Enhance `/api/superadmin/users` with POST
   - [ ] Create `/api/superadmin/site-control`
   - [ ] Implement role-based middleware

3. **Security Foundation**
   - [ ] Create permission system
   - [ ] Implement API guards
   - [ ] Add data isolation logic

### Phase 2: SuperAdmin Interface (Week 2)

**Priority: High - Technical Admin Capabilities**

1. **SuperAdmin Enhancements**
   - [ ] Add ADMIN user creation functionality
   - [ ] Implement website control panel
   - [ ] Add maintenance mode toggle
   - [ ] Create system status dashboard

2. **Website Control**
   - [ ] Implement site activation/deactivation
   - [ ] Create maintenance page
   - [ ] Add middleware for site status checks
   - [ ] Test public site blocking

### Phase 3: Business User Management (Week 3)

**Priority: Medium - Business Admin Features**

1. **Admin User Management**
   - [ ] Create `/admin/users` listing page
   - [ ] Build staff creation form
   - [ ] Implement user editing capabilities
   - [ ] Add user status management

2. **Navigation & UI**
   - [ ] Update admin navigation
   - [ ] Add role-based menu filtering
   - [ ] Create user management components
   - [ ] Implement permission-based UI hiding

### Phase 4: Security & Testing (Week 4)

**Priority: High - Quality Assurance**

1. **Security Hardening**
   - [ ] Comprehensive role testing
   - [ ] API security validation
   - [ ] Data isolation verification
   - [ ] Session security review

2. **Testing & Documentation**
   - [ ] Unit tests for all components
   - [ ] Integration tests for workflows
   - [ ] Security penetration testing
   - [ ] User acceptance testing

---

## 8. Task Checklist

### 8.1 Backend Tasks

#### Database & Schema
- [ ] Create `SiteSettings` model in Prisma schema
- [ ] Add database indexes for `User` table by role
- [ ] Run database migration
- [ ] Seed initial site settings

#### API Endpoints
- [ ] **POST** `/api/admin/users` - Create staff users
- [ ] **GET** `/api/admin/users` - List business users
- [ ] **PUT** `/api/admin/users/[id]` - Update user
- [ ] **DELETE** `/api/admin/users/[id]` - Deactivate user
- [ ] **POST** `/api/superadmin/users` - Create admin users
- [ ] **GET** `/api/superadmin/site-control` - Get site status
- [ ] **POST** `/api/superadmin/site-control` - Toggle site status
- [ ] **PUT** `/api/superadmin/site-control` - Update maintenance mode

#### Security & Middleware
- [ ] Create role-based permission system
- [ ] Implement API route protection middleware
- [ ] Add business data isolation guards
- [ ] Create session validation utilities
- [ ] Implement site status middleware

### 8.2 Frontend Tasks

#### SuperAdmin Interface
- [ ] Enhanced `/superadmin/page.tsx` with admin creation
- [ ] Create `SiteControlPanel` component
- [ ] Add `AdminUserManager` component
- [ ] Implement maintenance mode toggle
- [ ] Create system status dashboard

#### Business Admin Interface
- [ ] Create `/admin/users/page.tsx` - User listing
- [ ] Create `/admin/users/create/page.tsx` - User creation
- [ ] Create `/admin/users/[id]/edit/page.tsx` - User editing
- [ ] Update admin navigation with staff management

#### Reusable Components
- [ ] Create `RoleGuard` component
- [ ] Build `UserCreateForm` component
- [ ] Create `UserStatusBadge` component
- [ ] Implement `PermissionWrapper` component

#### Pages & Routing
- [ ] Create `/maintenance/page.tsx`
- [ ] Update middleware for site status checks
- [ ] Add proper error pages for unauthorized access
- [ ] Implement role-based redirects

### 8.3 Security Tasks

#### Access Control
- [ ] Test SUPERADMIN cannot access business data
- [ ] Verify ADMIN can create STAFF but not ADMIN
- [ ] Confirm STAFF cannot create users
- [ ] Validate API endpoint permissions

#### Data Protection
- [ ] Ensure customer data isolation
- [ ] Test business data protection from technical admins
- [ ] Verify role-based query filtering
- [ ] Test session security and role persistence

#### UI Security
- [ ] Hide unauthorized navigation items
- [ ] Disable unauthorized buttons/forms
- [ ] Show appropriate error messages
- [ ] Test role-based component rendering

### 8.4 Testing Tasks

#### Unit Tests
- [ ] Test all API endpoints with different roles
- [ ] Test permission system functions
- [ ] Test component role-based rendering
- [ ] Test middleware security logic

#### Integration Tests
- [ ] Test complete user creation workflows
- [ ] Test site activation/deactivation flow
- [ ] Test role hierarchy enforcement
- [ ] Test data isolation between roles

#### User Acceptance Testing
- [ ] SUPERADMIN workflow testing
- [ ] ADMIN user management testing
- [ ] STAFF limited access testing
- [ ] Site control functionality testing

---

## 9. Testing Strategy

### 9.1 Unit Testing

**API Testing:**
```typescript
// Test role-based API access
describe('User Management API', () => {
  test('ADMIN can create STAFF users', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(staffUserData);

    expect(response.status).toBe(201);
  });

  test('STAFF cannot create users', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(staffUserData);

    expect(response.status).toBe(403);
  });

  test('SUPERADMIN cannot access business APIs', async () => {
    const response = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${superadminToken}`);

    expect(response.status).toBe(403);
  });
});
```

**Component Testing:**
```typescript
// Test role-based component rendering
describe('RoleGuard Component', () => {
  test('shows content for allowed roles', () => {
    const { getByText } = render(
      <RoleGuard allowedRoles={[UserRole.ADMIN]}>
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(getByText('Admin Content')).toBeInTheDocument();
  });

  test('hides content for forbidden roles', () => {
    const { queryByText } = render(
      <RoleGuard allowedRoles={[UserRole.ADMIN]}>
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
```

### 9.2 Integration Testing

**User Creation Workflow:**
```typescript
describe('User Management Workflow', () => {
  test('Complete ADMIN creates STAFF workflow', async () => {
    // 1. Login as ADMIN
    // 2. Navigate to user creation
    // 3. Fill and submit form
    // 4. Verify user created
    // 5. Test new user can login
    // 6. Verify STAFF permissions
  });

  test('Site control workflow', async () => {
    // 1. Login as SUPERADMIN
    // 2. Deactivate site
    // 3. Verify public site shows maintenance
    // 4. Verify admin still accessible
    // 5. Reactivate site
    // 6. Verify public site accessible
  });
});
```

### 9.3 Security Testing

**Permission Boundary Testing:**
- Test each role accessing forbidden endpoints
- Verify data isolation between roles
- Test privilege escalation attempts
- Validate session security

**Penetration Testing Checklist:**
- [ ] Direct API access attempts
- [ ] JWT token manipulation
- [ ] Role switching attempts
- [ ] Business data access from technical roles
- [ ] SQL injection in user creation forms
- [ ] XSS in user input fields

---

## 10. Best Practices

### 10.1 Software Architecture Principles

**SOLID Principles:**
- **S**ingle Responsibility: Each component has one clear purpose
- **O**pen/Closed: Extensible role system without modifying core
- **L**iskov Substitution: Role interfaces are substitutable
- **I**nterface Segregation: Separate interfaces for different role capabilities
- **D**ependency Inversion: Depend on role abstractions, not implementations

**DRY (Don't Repeat Yourself):**
- Centralized permission definitions
- Reusable role-based components
- Shared validation logic
- Common API patterns

**Security First:**
- Principle of least privilege
- Defense in depth
- Fail securely
- Input validation everywhere

### 10.2 Code Organization

**File Structure:**
```
src/
├── app/
│   ├── admin/
│   │   ├── users/          # Business user management
│   │   └── layout.tsx      # Business admin layout
│   ├── superadmin/         # Technical admin interface
│   ├── api/
│   │   ├── admin/          # Business APIs
│   │   └── superadmin/     # Technical APIs
│   └── maintenance/        # Site offline page
├── components/
│   ├── admin/              # Business admin components
│   ├── superadmin/         # Technical admin components
│   └── auth/               # Role-based guards
├── lib/
│   ├── auth/               # Authentication & permissions
│   ├── db/                 # Database utilities
│   └── utils/              # Shared utilities
└── types/                  # TypeScript definitions
```

### 10.3 Error Handling

**Consistent Error Responses:**
```typescript
// Standardized API error format
interface ApiError {
  error: string;
  message: string;
  code: number;
  details?: any;
}

// Role-based error messages
const ERROR_MESSAGES = {
  INSUFFICIENT_ROLE: 'Your role does not have permission for this action',
  BUSINESS_DATA_ACCESS_DENIED: 'Technical admins cannot access business data',
  USER_CREATION_FORBIDDEN: 'You cannot create users with this role level',
};
```

**Frontend Error Boundaries:**
```typescript
export function RoleErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="text-center p-8">
          <h2>Access Denied</h2>
          <p>{error.message}</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 10.4 Performance Considerations

**Database Optimization:**
- Proper indexing on `role` and `status` fields
- Efficient queries with role-based filtering
- Connection pooling for concurrent users

**Frontend Optimization:**
- Lazy load role-specific components
- Memoize permission checks
- Optimize role-based navigation rendering

**Caching Strategy:**
- Cache user permissions
- Cache site settings
- Invalidate caches on role changes

### 10.5 Monitoring & Logging

**Security Audit Logging:**
```typescript
// Log all sensitive operations
export function auditLog(action: string, userId: string, details: any) {
  console.log({
    timestamp: new Date().toISOString(),
    action,
    userId,
    userRole: details.userRole,
    targetUser: details.targetUser,
    success: details.success,
    ip: details.ip,
  });
}

// Example usage
auditLog('USER_CREATED', adminId, {
  userRole: 'ADMIN',
  targetUser: newUserId,
  targetRole: 'STAFF',
  success: true,
  ip: request.ip,
});
```

**Performance Monitoring:**
- Track API response times by role
- Monitor database query performance
- Alert on unusual access patterns

### 10.6 Documentation Standards

**API Documentation:**
- Clear role requirements for each endpoint
- Example requests/responses
- Error codes and messages
- Rate limiting information

**Code Documentation:**
- Document permission logic
- Explain role hierarchy decisions
- Comment complex security checks
- Maintain architecture decision records (ADRs)

---

## Implementation Success Criteria

### ✅ **Functional Requirements Met:**
- [ ] SUPERADMIN can create ADMIN users
- [ ] SUPERADMIN can control website activation
- [ ] SUPERADMIN cannot access business data
- [ ] ADMIN can create STAFF users
- [ ] ADMIN has full business access
- [ ] STAFF has limited business access
- [ ] All roles properly isolated

### ✅ **Security Requirements Met:**
- [ ] Role-based access control enforced
- [ ] API endpoints properly protected
- [ ] UI elements role-appropriate
- [ ] Data isolation verified
- [ ] Session security validated

### ✅ **Quality Standards Met:**
- [ ] Comprehensive test coverage
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Code review approved
- [ ] Documentation complete

---

## Conclusion

This implementation plan provides a comprehensive, secure, and maintainable user management system with clear role separation. The architecture follows software engineering best practices while maintaining simplicity for a small team.

**Key Benefits:**
- ✅ **Security**: Complete data isolation between technical and business roles
- ✅ **Scalability**: Clean architecture that can grow with the business
- ✅ **Maintainability**: Well-structured code following SOLID principles
- ✅ **Usability**: Intuitive interfaces for each role type
- ✅ **Reliability**: Comprehensive testing and error handling

**Timeline**: 4 weeks for complete implementation with testing and documentation.

**Risk Mitigation**: Phased rollout allows for testing and validation at each stage.

---

*Last Updated: 2024-12-28*
*Author: Claude (AI Assistant)*
*Review Status: Ready for Implementation*