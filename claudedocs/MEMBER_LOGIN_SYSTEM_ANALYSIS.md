# Member Login & Panel System - Complete Analysis

**Project:** JRM E-Commerce Platform
**Analysis Date:** 2025-10-29
**Focus:** Authentication, Member Panel, User Management

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Member Panel Structure](#member-panel-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Security Implementation](#security-implementation)
7. [Member Features](#member-features)
8. [User Flows](#user-flows)
9. [File Structure](#file-structure)
10. [Configuration](#configuration)
11. [Key Components](#key-components)
12. [Potential Improvements](#potential-improvements)

---

## System Overview

The JRM E-Commerce platform uses a **NextAuth.js-based authentication system** with JWT tokens and a comprehensive member panel featuring 8 dedicated pages for user management, orders, profiles, and member-exclusive benefits.

### Technology Stack

- **Authentication:** NextAuth.js v4.24.11 (JWT strategy)
- **Password Security:** bcryptjs with salt hashing
- **Database:** Prisma ORM with PostgreSQL
- **Validation:** Zod schemas (client + server)
- **Session Management:** JWT tokens with 30-day expiry
- **UI Framework:** Next.js 14 App Router with React Server Components

---

## Authentication Architecture

### NextAuth Configuration

**File:** `/src/lib/auth/auth-options.ts`

```typescript
Key Configuration:
- Provider: CredentialsProvider (email/password)
- Session Strategy: JWT (stateless)
- Session Duration: 30 days
- Automatic Session Refresh: Enabled
- Session Caching: Optimized for performance
```

### Authentication Flow

```mermaid
User Login Request
    ↓
Email/Password Validation
    ↓
Check User Status (must be ACTIVE)
    ↓
Password Verification (bcryptjs)
    ↓
Generate JWT Token (role + member data)
    ↓
Role-Based Redirect:
  - ADMIN/STAFF/SUPERADMIN → /admin
  - CUSTOMER → /member
```

### Session Structure

```typescript
session: {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: "CUSTOMER" | "ADMIN" | "STAFF" | "SUPERADMIN"
    isMember: boolean
    memberSince: Date | null
  }
  expires: string
}
```

### Password Security

**File:** `/src/lib/auth/password.ts`

**Hashing:**
- Algorithm: bcryptjs
- Salt rounds: 10
- One-way encryption (cannot be decrypted)

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Reset Flow:**
1. User requests reset at `/auth/forgot-password`
2. Token generated and stored in database with expiry
3. Email sent with reset link
4. User resets password at `/auth/reset-password?token=xxx`
5. Token validated (must be unexpired and match database)
6. New password set, token cleared from database

---

## Member Panel Structure

### 8 Core Member Pages

| Page | Route | Purpose | Key Features |
|------|-------|---------|--------------|
| **Dashboard** | `/member/dashboard` | Overview & quick actions | Stats cards, recent orders, quick links |
| **Profile** | `/member/profile` | Personal information | Edit details, view member benefits |
| **Orders** | `/member/orders` | Order history | Status filtering, order details, export |
| **Addresses** | `/member/addresses` | Address management | Add/edit/delete, set default |
| **Wishlist** | `/member/wishlist` | Saved products | Add to cart, remove items |
| **Notifications** | `/member/notifications` | Alerts & updates | Order updates, system notifications |
| **Referrals** | `/member/referrals` | Referral program | Track referrals, view rewards |
| **Benefits** | `/member/benefits` | Member perks | View all member benefits |

### Page Implementations

#### 1. Dashboard (`/src/app/member/dashboard/page.tsx`)

**Features:**
- Welcome message with member name
- 4 stat cards: Total Orders, Total Spent, Member Savings, Wishlist Items
- Recent orders table (last 5)
- Quick action buttons
- Member benefits summary

**Stats Calculation:**
```typescript
const stats = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: {
    _count: { select: { orders: true } },
    membershipTotal: true,
    memberSavings: true,
    wishlist: { select: { productId: true } }
  }
})
```

#### 2. Profile (`/src/app/member/profile/page.tsx`)

**Sections:**
- Personal Information (editable)
- Member Details (read-only)
- Member Benefits Display

**Editable Fields:**
- First Name, Last Name
- Email (with verification)
- Phone Number (Malaysian format validation)
- Date of Birth
- NRIC

**Member Information Display:**
- Member Since date
- Total Lifetime Spending
- Member Savings to Date
- Current Member Status

#### 3. Orders (`/src/app/member/orders/page.tsx`)

**Features:**
- Order history table with pagination
- Status filtering (All, Pending, Processing, Shipped, Delivered, Cancelled)
- Order details modal
- Export to CSV functionality
- Search by order number

**Order Display:**
- Order Number
- Date
- Items Count
- Total Amount
- Member Discount Applied
- Status Badge
- Actions (View Details, Track)

#### 4. Addresses (`/src/app/member/addresses/page.tsx`)

**Features:**
- Address cards (shipping + billing)
- Add new address modal
- Edit/Delete existing addresses
- Set default address
- Address type badges (Home, Office, Other)

**Address Fields:**
- Full Name
- Phone Number
- Address Line 1 & 2
- City, State (Malaysian states dropdown)
- Postal Code
- Country (defaulted to Malaysia)
- Address Type

#### 5. Wishlist (`/src/app/member/wishlist/page.tsx`)

**Features:**
- Product grid with images
- Add to cart button
- Remove from wishlist
- Product details (name, price, member price)
- Stock status indicator
- Empty state with product browsing link

#### 6. Notifications (`/src/app/member/notifications/page.tsx`)

**Notification Types:**
- Order status updates
- Member benefit announcements
- System notifications
- Promotional alerts

**Features:**
- Read/Unread status
- Mark as read functionality
- Delete notifications
- Notification timestamp
- Icon based on notification type

#### 7. Referrals (`/src/app/member/referrals/page.tsx`)

**Features:**
- Personal referral code display
- Share buttons (WhatsApp, Email, Copy)
- Referral statistics (total referrals, successful conversions)
- Referral history table
- Rewards tracking

**Referral Rewards:**
- Referrer gets discount on next purchase
- Referee gets welcome discount
- Both tracked in database

#### 8. Benefits (`/src/app/member/benefits/page.tsx`)

**Member Benefits Display:**
- ✅ Exclusive member pricing (10-15% off)
- ✅ Free shipping on orders over RM80
- ✅ Early access to sales
- ✅ Member-only promotions
- ✅ Referral rewards
- ✅ Birthday month special offer
- ✅ Priority customer support

---

## Database Schema

### User Model

**File:** `/prisma/schema.prisma`

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  password              String
  firstName             String?
  lastName              String?
  phone                 String?
  dateOfBirth           DateTime?
  nric                  String?

  // Membership
  isMember              Boolean   @default(false)
  memberSince           DateTime?
  membershipTotal       Decimal   @default(0) @db.Decimal(10, 2)
  memberSavings         Decimal   @default(0) @db.Decimal(10, 2)

  // Access Control
  role                  Role      @default(CUSTOMER)
  status                UserStatus @default(PENDING)

  // Security
  passwordResetToken    String?
  passwordResetExpiry   DateTime?
  lastLoginAt           DateTime?

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  orders                Order[]
  addresses             Address[]
  wishlist              Wishlist[]
  notifications         Notification[]
  referrals             Referral[]  @relation("Referrer")
  referredBy            Referral?   @relation("Referred")
  pendingMembership     PendingMembership?
  auditLogs             AuditLog[]
}

enum Role {
  CUSTOMER
  ADMIN
  STAFF
  SUPERADMIN
}

enum UserStatus {
  ACTIVE
  PENDING
  INACTIVE
}
```

### Supporting Models

#### PendingMembership
```prisma
model PendingMembership {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  paymentMethod   String   // "bank_transfer" | "online_banking"
  amount          Decimal  @db.Decimal(10, 2)
  status          String   @default("pending") // "pending" | "approved" | "rejected"
  proofUrl        String?  // Receipt upload URL
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Address
```prisma
model Address {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  fullName    String
  phone       String
  addressLine1 String
  addressLine2 String?
  city        String
  state       String
  postalCode  String
  country     String   @default("Malaysia")

  type        String   // "home" | "office" | "other"
  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Wishlist
```prisma
model Wishlist {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}
```

#### Notification
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  type      String   // "order" | "system" | "promotion"
  title     String
  message   String
  link      String?

  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

#### Referral
```prisma
model Referral {
  id           String   @id @default(cuid())
  referrerId   String
  referrer     User     @relation("Referrer", fields: [referrerId], references: [id])
  referredId   String   @unique
  referred     User     @relation("Referred", fields: [referredId], references: [id])

  code         String   @unique
  status       String   @default("pending") // "pending" | "completed"
  rewardClaimed Boolean @default(false)

  createdAt    DateTime @default(now())
}
```

---

## API Endpoints

### Member APIs (Protected Routes)

All member APIs require authentication via NextAuth session.

#### Profile Management

**GET `/api/member/profile`**
- Returns user profile data
- Includes member statistics

**PUT `/api/member/profile`**
- Updates user profile
- Validates with Zod schema
- Fields: firstName, lastName, phone, dateOfBirth, nric

**Response:**
```typescript
{
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string
  nric: string
  isMember: boolean
  memberSince: string
  membershipTotal: number
  memberSavings: number
}
```

#### Statistics

**GET `/api/member/stats`**
- Returns member statistics
- Includes: order count, total spent, savings, wishlist count

**Response:**
```typescript
{
  totalOrders: number
  totalSpent: number
  memberSavings: number
  wishlistCount: number
}
```

#### Orders

**GET `/api/member/orders`**
- Query params: `status`, `page`, `limit`
- Returns paginated order list with member discounts

**Response:**
```typescript
{
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}
```

#### Addresses

**GET `/api/member/addresses`**
- Returns all user addresses

**POST `/api/member/addresses`**
- Creates new address
- Validates with Zod schema

**PUT `/api/member/addresses/:id`**
- Updates existing address

**DELETE `/api/member/addresses/:id`**
- Deletes address
- Prevents deletion of default address

#### Wishlist

**GET `/api/member/wishlist`**
- Returns user wishlist with product details

**POST `/api/member/wishlist`**
- Adds product to wishlist
- Body: `{ productId: string }`

**DELETE `/api/member/wishlist/:productId`**
- Removes product from wishlist

#### Notifications

**GET `/api/member/notifications`**
- Returns user notifications
- Query param: `unreadOnly` (boolean)

**PUT `/api/member/notifications/:id/read`**
- Marks notification as read

**DELETE `/api/member/notifications/:id`**
- Deletes notification

#### Referrals

**GET `/api/member/referrals`**
- Returns referral statistics and history
- Includes referral code

**Response:**
```typescript
{
  referralCode: string
  totalReferrals: number
  successfulReferrals: number
  referrals: Referral[]
}
```

### Authentication APIs (Public Routes)

#### Registration

**POST `/api/auth/register`**
- Creates new user account
- Validates email uniqueness
- Hashes password with bcryptjs
- Sets status to PENDING

**Request Body:**
```typescript
{
  email: string
  password: string
  firstName: string
  lastName: string
}
```

#### Forgot Password

**POST `/api/auth/forgot-password`**
- Generates password reset token
- Sets expiry (1 hour)
- Sends reset email

**Request Body:**
```typescript
{
  email: string
}
```

#### Reset Password

**POST `/api/auth/reset-password`**
- Validates reset token
- Checks token expiry
- Updates password
- Clears reset token

**Request Body:**
```typescript
{
  token: string
  password: string
}
```

---

## Security Implementation

### Authentication Security

**Password Hashing:**
- Algorithm: bcryptjs
- Salt rounds: 10
- One-way encryption (irreversible)

**Password Validation:**
```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[^A-Za-z0-9]/, "Must contain special character")
```

**Session Security:**
- JWT tokens (stateless)
- 30-day expiry with auto-refresh
- Secure HTTP-only cookies
- CSRF token protection

### Input Validation

**Zod Schemas on All Forms:**
- Client-side validation (immediate feedback)
- Server-side validation (security enforcement)
- Type-safe parsing

**Example Profile Schema:**
```typescript
const profileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().regex(/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/),
  dateOfBirth: z.string().optional(),
  nric: z.string().regex(/^\d{6}-\d{2}-\d{4}$/).optional()
})
```

### CSRF Protection

**Implementation:**
- Token generation on form load
- Token validation on form submit
- Token stored in hidden input field
- Server-side verification

**File:** `/src/lib/csrf.ts`

### Security Headers

**File:** `/src/middleware.ts`

```typescript
Headers Applied:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: (restrictive)
```

### Audit Logging

**File:** `/src/lib/audit.ts`

**Logged Actions:**
- User login/logout
- Profile updates
- Password changes
- Order placement
- Address modifications

**Audit Log Fields:**
```typescript
{
  id: string
  userId: string
  action: string // "LOGIN" | "PROFILE_UPDATE" | etc.
  details: JSON
  ipAddress: string
  userAgent: string
  timestamp: DateTime
}
```

### Rate Limiting

**Basic Implementation:**
- Request throttling on auth endpoints
- Prevents brute force attacks
- IP-based tracking

---

## Member Features

### Member Pricing System

**Implementation in Product Model:**
```typescript
{
  price: Decimal          // Regular price
  memberPrice: Decimal    // Member-exclusive price
  memberDiscount: Decimal // Discount percentage (10-15%)
}
```

**Price Calculation:**
```typescript
const finalPrice = user.isMember && product.memberPrice
  ? product.memberPrice
  : product.price
```

**Member Savings Tracking:**
```typescript
// On order completion
const savings = (regularPrice - memberPrice) * quantity
await prisma.user.update({
  where: { id: userId },
  data: {
    memberSavings: { increment: savings }
  }
})
```

### Free Shipping

**Rule:** Orders over RM80 get free shipping (members only)

**Implementation:**
```typescript
const shippingCost = user.isMember && orderTotal >= 80
  ? 0
  : calculateShipping(orderTotal, destination)
```

### Member Benefits

1. **Exclusive Pricing:** 10-15% discount on all products
2. **Free Shipping:** Orders over RM80
3. **Early Access:** Sales start 24 hours early for members
4. **Member Promotions:** Exclusive deals and bundles
5. **Referral Rewards:** Earn discounts by referring friends
6. **Birthday Special:** Extra discount during birthday month
7. **Priority Support:** Faster response times

### Referral Program

**Referral Code Generation:**
```typescript
const code = `${firstName.toUpperCase()}${randomString(6)}`
// Example: JOHN-ABC123
```

**Referral Rewards:**
- Referrer: RM10 discount on next purchase
- Referee: RM5 welcome discount
- Tracked in Referral model

**Share Options:**
- WhatsApp
- Email
- Copy link

---

## User Flows

### Registration Flow

```
1. User visits /auth/register
2. Fills registration form (email, password, name)
3. Client-side Zod validation
4. Form submission → POST /api/auth/register
5. Server validates:
   - Email uniqueness
   - Password strength
   - Required fields
6. Password hashed with bcryptjs
7. User created with status: PENDING
8. Welcome email sent
9. Redirect to /auth/signin
10. User signs in with credentials
11. Status checked (PENDING allows login but shows verification notice)
```

### Login Flow

```
1. User visits /auth/signin
2. Enters email + password
3. NextAuth CredentialsProvider validates:
   - User exists
   - Status is ACTIVE
   - Password matches (bcrypt.compare)
4. JWT token generated with:
   - User ID
   - Email
   - Name
   - Role
   - Member status
5. Session stored in HTTP-only cookie
6. Role-based redirect:
   - ADMIN/STAFF/SUPERADMIN → /admin
   - CUSTOMER → /member
```

### Password Reset Flow

```
1. User clicks "Forgot Password" on /auth/signin
2. Redirected to /auth/forgot-password
3. Enters email address
4. POST /api/auth/forgot-password:
   - Generates reset token (crypto.randomBytes)
   - Sets expiry (1 hour from now)
   - Saves token to user record
   - Sends email with reset link
5. User clicks email link → /auth/reset-password?token=xxx
6. Enters new password
7. POST /api/auth/reset-password:
   - Validates token exists
   - Checks token not expired
   - Validates new password strength
   - Hashes new password
   - Updates user record
   - Clears reset token
8. Redirect to /auth/signin with success message
```

### Member Order Flow

```
1. Member browses products (sees member pricing)
2. Adds items to cart
3. Proceeds to checkout
4. Member discount automatically applied
5. Free shipping applied if total > RM80
6. Order created with memberDiscount field
7. Member savings incremented
8. Notification created for order confirmation
9. Order appears in /member/orders
10. Member can track order status
```

### Profile Update Flow

```
1. Member visits /member/profile
2. Clicks "Edit Profile"
3. Form pre-filled with current data
4. Updates fields (firstName, phone, etc.)
5. Client-side Zod validation
6. PUT /api/member/profile:
   - Validates session
   - Validates input with Zod
   - Updates user record
   - Creates audit log entry
7. Success message shown
8. Profile display updated
```

---

## File Structure

### Authentication Files

```
/src/app/auth/
├── signin/
│   └── page.tsx              # Login page
├── register/
│   └── page.tsx              # Registration page
├── forgot-password/
│   └── page.tsx              # Password reset request
└── reset-password/
    └── page.tsx              # Password reset form

/src/lib/auth/
├── auth-options.ts           # NextAuth configuration
├── password.ts               # Password utilities (hash, verify)
└── session.ts                # Session helpers

/src/components/auth/
├── LoginForm.tsx             # Login form component
├── RegisterForm.tsx          # Registration form
├── ForgotPasswordForm.tsx    # Password reset request form
└── ResetPasswordForm.tsx     # Password reset form
```

### Member Panel Files

```
/src/app/member/
├── layout.tsx                # Member panel layout (sidebar, header)
├── dashboard/
│   └── page.tsx              # Dashboard overview
├── profile/
│   └── page.tsx              # Profile management
├── orders/
│   └── page.tsx              # Order history
├── addresses/
│   └── page.tsx              # Address management
├── wishlist/
│   └── page.tsx              # Saved products
├── notifications/
│   └── page.tsx              # Notification center
├── referrals/
│   └── page.tsx              # Referral program
└── benefits/
    └── page.tsx              # Member benefits info

/src/app/api/member/
├── profile/
│   └── route.ts              # GET/PUT profile
├── stats/
│   └── route.ts              # GET statistics
├── orders/
│   └── route.ts              # GET orders
├── addresses/
│   ├── route.ts              # GET/POST addresses
│   └── [id]/
│       └── route.ts          # PUT/DELETE address
├── wishlist/
│   ├── route.ts              # GET/POST wishlist
│   └── [productId]/
│       └── route.ts          # DELETE wishlist item
├── notifications/
│   ├── route.ts              # GET notifications
│   └── [id]/
│       ├── read/
│       │   └── route.ts      # PUT mark as read
│       └── route.ts          # DELETE notification
└── referrals/
    └── route.ts              # GET referral data
```

### Component Files

```
/src/components/member/
├── MemberSidebar.tsx         # Navigation sidebar
├── StatsCard.tsx             # Dashboard stat cards
├── OrderTable.tsx            # Order history table
├── AddressCard.tsx           # Address display card
├── AddressForm.tsx           # Address add/edit form
├── WishlistGrid.tsx          # Wishlist product grid
├── NotificationList.tsx      # Notification list
├── ReferralCard.tsx          # Referral code display
└── BenefitsList.tsx          # Member benefits display
```

### Utility Files

```
/src/lib/
├── auth/
│   ├── auth-options.ts       # NextAuth config
│   ├── password.ts           # Password utilities
│   └── session.ts            # Session helpers
├── validators/
│   ├── auth.ts               # Auth Zod schemas
│   ├── profile.ts            # Profile Zod schemas
│   └── address.ts            # Address Zod schemas
├── csrf.ts                   # CSRF protection
├── audit.ts                  # Audit logging
└── email.ts                  # Email sending utilities
```

---

## Configuration

### Environment Variables

**Required for Authentication:**
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecom

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@jrmecom.com
```

### NextAuth Configuration

**File:** `/src/lib/auth/auth-options.ts`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation logic
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to token
    },
    async session({ session, token }) {
      // Add custom fields to session
    }
  }
}
```

### Malaysian Localization

**Phone Number Validation:**
```typescript
// Accepts: 012-3456789, +6012-3456789, 01123456789
const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/
```

**State Dropdown:**
```typescript
const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur",
  "Labuan", "Melaka", "Negeri Sembilan", "Pahang",
  "Penang", "Perak", "Perlis", "Putrajaya",
  "Sabah", "Sarawak", "Selangor", "Terengganu"
]
```

**NRIC Validation:**
```typescript
// Format: 123456-12-1234
const nricRegex = /^\d{6}-\d{2}-\d{4}$/
```

---

## Key Components

### MemberSidebar Component

**File:** `/src/components/member/MemberSidebar.tsx`

**Navigation Items:**
- Dashboard (Home icon)
- Profile (User icon)
- Orders (Shopping bag icon)
- Addresses (Map pin icon)
- Wishlist (Heart icon)
- Notifications (Bell icon, with unread badge)
- Referrals (Users icon)
- Benefits (Star icon)
- Logout (Sign out icon)

**Features:**
- Active state highlighting
- Unread notification badge
- Mobile responsive (collapsible)
- Role-based menu items

### StatsCard Component

**File:** `/src/components/member/StatsCard.tsx`

**Props:**
```typescript
{
  title: string        // "Total Orders"
  value: string        // "12"
  icon: ReactNode      // Icon component
  trend?: {
    value: string      // "+15%"
    isPositive: boolean
  }
}
```

**Used in Dashboard for:**
- Total Orders count
- Total Spent amount
- Member Savings total
- Wishlist Items count

### OrderTable Component

**File:** `/src/components/member/OrderTable.tsx`

**Features:**
- Sortable columns
- Status filtering
- Pagination
- Order details modal
- Mobile responsive

**Columns:**
- Order Number
- Date
- Items
- Total
- Discount
- Status
- Actions

### AddressForm Component

**File:** `/src/components/member/AddressForm.tsx`

**Form Fields:**
- Full Name
- Phone Number (with Malaysian validation)
- Address Line 1 & 2
- City
- State (dropdown)
- Postal Code
- Country (defaulted)
- Address Type (radio: Home/Office/Other)
- Set as Default (checkbox)

**Validation:**
- Real-time Zod validation
- Error messages below fields
- Disabled submit until valid

---

## Potential Improvements

### Security Enhancements

1. **Two-Factor Authentication (2FA)**
   - SMS or authenticator app
   - Optional for users, required for admins
   - Implementation: TOTP library (speakeasy)

2. **Email Verification**
   - Verify email on registration
   - Re-verify on email change
   - Prevent login until verified

3. **Advanced Rate Limiting**
   - Per-user rate limits
   - Progressive delays on failed logins
   - IP blocking after threshold

4. **Session Management**
   - View active sessions
   - Remote logout capability
   - Device fingerprinting

5. **Security Audit Trail**
   - Enhanced logging of sensitive actions
   - Export audit logs
   - Real-time alerts on suspicious activity

### UX/UI Improvements

1. **Member Dashboard**
   - Add charts for spending trends
   - Show personalized product recommendations
   - Display upcoming sales/events

2. **Profile Page**
   - Avatar upload
   - Email change with verification
   - Account deletion option
   - Export personal data (GDPR compliance)

3. **Order History**
   - Advanced filtering (date range, price range)
   - Reorder functionality
   - Order tracking with timeline
   - Invoice download

4. **Wishlist**
   - Price drop notifications
   - Share wishlist feature
   - Add notes to wishlist items
   - Move to cart in bulk

5. **Notifications**
   - Browser push notifications
   - Email notification preferences
   - Notification categories
   - Batch actions (mark all read, delete all)

### Performance Optimizations

1. **Caching**
   - Redis for session storage
   - Cache user stats
   - Cache product data in wishlist

2. **Database Optimization**
   - Add indexes on frequently queried fields
   - Optimize joins in order queries
   - Pagination for all lists

3. **Image Optimization**
   - Next.js Image component
   - Lazy loading
   - WebP format with fallbacks

4. **Code Splitting**
   - Route-based code splitting
   - Component lazy loading
   - Dynamic imports for modals

### Feature Additions

1. **Social Login**
   - Google OAuth
   - Facebook Login
   - Apple Sign-In

2. **Member Tiers**
   - Bronze, Silver, Gold levels
   - Tier-based benefits
   - Automatic tier upgrades

3. **Gamification**
   - Points system
   - Badges/achievements
   - Leaderboard

4. **Advanced Referrals**
   - Multi-level referrals
   - Custom referral campaigns
   - Referral analytics dashboard

5. **Communication**
   - In-app messaging
   - Live chat support
   - Order updates via WhatsApp

### Accessibility Improvements

1. **ARIA Labels**
   - Add comprehensive ARIA labels
   - Screen reader optimization
   - Keyboard navigation

2. **Color Contrast**
   - WCAG AAA compliance
   - High contrast mode
   - Color-blind friendly palettes

3. **Form Accessibility**
   - Clear error announcements
   - Field descriptions
   - Required field indicators

### Mobile Experience

1. **Progressive Web App (PWA)**
   - Offline support
   - Install prompt
   - Push notifications

2. **Mobile-First Design**
   - Touch-friendly buttons
   - Swipe gestures
   - Bottom navigation

3. **Performance**
   - Reduce bundle size
   - Optimize images for mobile
   - Lazy load below-the-fold content

### Testing & Quality

1. **Unit Tests**
   - Jest for component testing
   - API route testing
   - Utility function testing

2. **Integration Tests**
   - Playwright for E2E
   - User flow testing
   - Cross-browser testing

3. **Performance Testing**
   - Lighthouse CI
   - Core Web Vitals monitoring
   - Load testing

### Analytics & Monitoring

1. **User Analytics**
   - Page view tracking
   - User journey analysis
   - Conversion funnel

2. **Error Monitoring**
   - Sentry integration
   - Error reporting
   - Performance monitoring

3. **Business Metrics**
   - Member conversion rate
   - Average order value
   - Member retention rate

---

## Summary

The JRM E-Commerce platform has a **solid foundation** for authentication and member management with:

✅ **Strengths:**
- Secure NextAuth.js implementation
- Comprehensive member panel (8 pages)
- Member-exclusive pricing and benefits
- Good security practices (password hashing, CSRF, validation)
- Malaysian localization (phone, NRIC, states)
- Audit logging
- Referral system

⚠️ **Areas for Enhancement:**
- Add email verification
- Implement 2FA for enhanced security
- Improve mobile responsiveness
- Add more analytics and insights
- Enhance notification system
- Implement member tiers
- Add social login options
- Improve accessibility (ARIA labels, keyboard nav)

**Overall Assessment:** The system is production-ready with room for enhancements to improve security, UX, and engagement.

---

*Document generated: 2025-10-29*
*Last updated: 2025-10-29*
