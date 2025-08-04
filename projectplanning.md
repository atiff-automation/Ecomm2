# JRM E-commerce Project Planning Document

## Project Overview

**Project Name:** JRM E-commerce with Membership System  
**Timeline:** 20 weeks (5 months)  
**Target Market:** B2C E-commerce in Malaysia  
**Primary Goal:** Build a complete e-commerce platform with intelligent membership qualification system

## Business Requirements

### Core Business Logic

#### Membership System

- **Qualification Threshold:** RM80 (configurable in admin)
- **Qualifying Categories:** Admin-configurable product categories
- **Exclusions:** Products tagged as "promotional" are excluded from membership calculation
- **Member Benefits:** Access to member-specific pricing on all products
- **Registration Flow:** Automatic membership offer during checkout for qualifying purchases

#### Pricing Structure

- **Dual Pricing:** Regular price and member price for each product
- **Price Visibility:** Both prices visible to all customers to encourage membership
- **Member Access:** Login required for subsequent purchases to access member pricing

#### Purchase Flow

1. Customer browses products (sees both regular and member prices)
2. Adds items to cart
3. Real-time calculation of membership eligibility
4. At checkout, if qualified (RM80+ in non-promotional qualifying categories):
   - Registration form appears for membership signup
   - If not qualified, customer can complete purchase without membership
5. Subsequent purchases require login for member pricing

## UI/UX Specifications

### Design System & Visual Guidelines

#### Responsive Design Strategy

- **Mobile-First Approach:** Design and develop for mobile devices first, then enhance for larger screens
- **Breakpoints:**
  - Mobile: 320px - 767px (primary focus - 70% of traffic expected)
  - Tablet: 768px - 1023px
  - Desktop: 1024px+ (includes large desktop displays)
- **Touch-Friendly Design:** Minimum 44px touch targets, optimized gesture navigation
- **Performance Budget:** < 2 seconds load time on mobile, < 100KB initial CSS/JS

#### Malaysian Market Design Considerations

- **Color Psychology:** Trust-building colors (blue, green) with Malaysian cultural preferences
- **Typography:** Support for Bahasa Malaysia, clear hierarchy for dual-language content
- **Currency Display:** Clear RM formatting with proper positioning and readability
- **Trust Signals:** Security badges, Malaysian payment method logos, local testimonials
- **Cultural Elements:** Malaysian flag colors, local imagery, familiar UI patterns

#### Component Library (Extended shadcn/ui)

**Core E-commerce Components:**
- Product cards with dual pricing display (regular/member)
- Shopping cart components with membership eligibility indicators
- Checkout flow components with progress indicators
- Membership badges and savings calculators
- Price comparison displays with clear member benefits
- Trust signal components (security badges, guarantees)

**Admin Dashboard Components:**
- Analytics widgets with Malaysian business metrics
- Order management interfaces
- Product management forms with local requirements
- Customer service dashboard components
- Report generation interfaces

#### Accessibility Compliance (WCAG 2.1 AA)

- **Keyboard Navigation:** Full site navigation without mouse
- **Screen Reader Support:** Proper ARIA labels and semantic HTML
- **Color Contrast:** 4.5:1 minimum ratio for normal text, 3:1 for large text
- **Font Sizes:** Minimum 16px for body text, scalable up to 200%
- **Focus Indicators:** Clear visual focus states for all interactive elements
- **Alt Text:** Comprehensive image descriptions for product photos

### User Experience (UX) Strategy

#### Customer Journey Mapping

**Guest User Journey:**
1. **Landing Page** → Trust signals, featured products, membership benefits preview
2. **Product Discovery** → Search, categories, filters with member pricing visibility
3. **Product Detail** → Comprehensive info, reviews, add to cart with membership calculation
4. **Shopping Cart** → Real-time membership eligibility, savings preview
5. **Checkout** → Membership signup offer, guest checkout option, payment selection
6. **Post-Purchase** → Order confirmation, membership activation, follow-up sequence

**Member User Journey:**
1. **Login** → Personalized dashboard, member-only offers, purchase history
2. **Member Shopping** → Exclusive pricing, early access, personalized recommendations
3. **Member Dashboard** → Savings tracking, order history, profile management
4. **Loyalty Engagement** → Member-only content, special promotions, referral rewards

#### Conversion Optimization Strategy

**Membership Conversion Elements:**
- **Savings Calculator:** Real-time display of potential savings during browsing
- **Member Price Preview:** Clear visual distinction between regular and member pricing
- **Urgency Indicators:** Limited-time member offers, stock availability
- **Social Proof:** Member testimonials, recent member activities
- **Trust Building:** Security badges, money-back guarantees, customer reviews

**Cart Abandonment Prevention:**
- **Progress Indicators:** Clear checkout steps and progress visualization
- **Exit-Intent Popups:** Last-chance offers or membership signup prompts
- **Persistent Cart:** Cart contents saved across sessions and devices
- **Security Assurance:** Payment security badges, SSL indicators
- **Guest Checkout:** Streamlined process without forced registration

#### Mobile Optimization Strategy

**Mobile-Specific Features:**
- **One-Thumb Navigation:** Bottom navigation, thumb-friendly button placement
- **Swipe Gestures:** Product image galleries, category navigation
- **Mobile Payment Integration:** Ready for Touch 'n Go, Boost, GrabPay integration
- **Reduced Cognitive Load:** Simplified layouts, minimal form fields
- **Fast Loading:** Optimized images, lazy loading, critical CSS inlining

**Mobile User Flow Optimization:**
- **Quick Product Search:** Voice search ready, predictive search
- **Streamlined Checkout:** Single-page checkout, auto-fill capabilities
- **Mobile-Friendly Forms:** Large input fields, clear labels, validation feedback
- **Touch Optimization:** Appropriate spacing, hover state alternatives

## Technical Specifications

### Technology Stack

#### Frontend

- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Context + Zustand for complex state
- **Forms:** React Hook Form with Zod validation

#### Backend

- **Runtime:** Node.js with Next.js API Routes
- **ORM:** Prisma for type-safe database operations with optimized queries
- **Authentication:** NextAuth.js with JWT tokens and role-based session management
- **Caching:** Redis for session, cart data, and API response caching
- **Background Jobs:** Bull.js with Redis for email processing, image optimization, and analytics
- **File Management:** Local storage with organized structure and security validation
- **Email Service:** Integration with SendGrid/Mailgun for transactional and marketing emails
- **Performance:** Early performance monitoring integration with real-time metrics
- **Error Recovery:** Comprehensive error handling with automated fallback mechanisms

#### Database

- **Primary:** PostgreSQL with optimized connection pooling and query indexing
- **Performance:** Advanced indexing strategy for membership calculations and order processing
- **Monitoring:** Real-time database performance tracking and optimization
- **Justification:** ACID compliance for financial transactions, JSON support for flexible product attributes, superior performance under load

#### Payment & Shipping

- **Payment Gateway:** Billplz (Malaysian payment processor)
- **Shipping Integration:** EasyParcel API
- **Tax Calculation:** GST/SST compliance for Malaysia

#### Infrastructure

- **Development:** Local development environment with comprehensive debugging tools
- **Production:** Hostinger shared hosting with performance optimization
- **Monitoring:** Sentry for error tracking, advanced system health monitoring
- **Analytics:** Google Analytics 4, Facebook Pixel, custom business intelligence dashboard
- **Performance:** Early Redis caching integration and automated performance baselines
- **Quality Assurance:** Continuous integration with automated testing and code quality checks

### Enhanced Technical Architecture

#### File Storage & Management

**Local Storage Structure:**
```
/public/uploads/
├── products/           # Product images and documents
│   ├── images/         # Product photos (original, thumbnails, webp)
│   └── documents/      # Product manuals, certificates
├── users/              # User-generated content
│   ├── avatars/        # Profile pictures
│   └── reviews/        # Review photos
├── system/             # System-generated files
│   ├── invoices/       # PDF invoices
│   ├── reports/        # Analytics reports
│   └── backups/        # Database exports
└── temp/               # Temporary file processing
    ├── uploads/        # Processing queue
    └── cache/          # Image optimization cache
```

**File Processing Pipeline:**
- **Upload Validation:** File type, size, virus scanning with ClamAV
- **Image Optimization:** Sharp.js for resize, compress, WebP conversion
- **Security:** Sanitized filenames, restricted access, secure URLs
- **Backup Strategy:** Automated file backup with version control

#### Background Job Processing

**Queue Architecture (Bull.js + Redis):**
```javascript
// Job Types and Priorities
- Email Processing: High priority (order confirmations, password resets)
- Image Optimization: Medium priority (product image processing)
- Analytics Calculation: Low priority (daily/weekly reports)
- Abandoned Cart Recovery: Medium priority (24h, 3d, 7d sequences)
- Inventory Updates: High priority (stock level changes)
```

**Job Processing Features:**
- **Retry Logic:** Exponential backoff for failed jobs
- **Rate Limiting:** Prevent email service overload
- **Job Scheduling:** Cron-based recurring tasks
- **Monitoring:** Job success/failure tracking and alerting

#### Performance Optimization Strategy

**Caching Layers:**
```
Level 1: Browser Cache (static assets, images)
Level 2: CDN Cache (future: CloudFlare for global distribution)
Level 3: Application Cache (Redis: API responses, user sessions)
Level 4: Database Cache (Query result caching)
Level 5: Computed Cache (membership calculations, pricing)
```

**Image Optimization:**
- **Responsive Images:** Multiple sizes for different breakpoints
- **Modern Formats:** WebP with fallback to JPEG/PNG
- **Lazy Loading:** Intersection Observer API implementation
- **Critical Path:** Above-the-fold image preloading

#### Security Framework Implementation

**Input Validation & Sanitization:**
- **Zod Schemas:** Type-safe API input validation
- **SQL Injection Prevention:** Parameterized queries with Prisma
- **XSS Protection:** Input sanitization and output encoding
- **File Upload Security:** Type validation, size limits, virus scanning
- **Rate Limiting:** IP-based and user-based request throttling

**Authentication & Authorization:**
- **JWT Security:** Short-lived access tokens, refresh token rotation
- **Session Management:** Secure cookie handling, session fixation prevention
- **Password Security:** bcrypt hashing, strength requirements
- **Role-Based Access:** Granular permission checking middleware

#### Email Marketing Infrastructure

**Email Service Integration:**
- **Transactional Emails:** Order confirmations, password resets (SendGrid)
- **Marketing Campaigns:** Newsletter, promotions (Mailgun for bulk)
- **Template System:** Responsive HTML templates with variables
- **Tracking:** Open rates, click tracking, unsubscribe handling
- **Compliance:** GDPR consent, Malaysian PDPA requirements

**Automated Email Sequences:**
```
Abandoned Cart Recovery:
- 24 hours: Gentle reminder with cart contents
- 3 days: Special discount offer
- 7 days: Last chance with member signup incentive

Membership Onboarding:
- Immediate: Welcome email with benefits
- 1 week: Usage tips and exclusive offers
- 1 month: Member satisfaction survey

Post-Purchase:
- Immediate: Order confirmation with tracking
- Shipping: Dispatch notification
- Delivery: Review request and related products
```

### Database Schema

#### Core Tables

```sql
-- Users table
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE NOT NULL,
  password_hash: VARCHAR,
  first_name: VARCHAR,
  last_name: VARCHAR,
  phone: VARCHAR,
  is_member: BOOLEAN DEFAULT false,
  member_since: TIMESTAMP,
  role: ENUM('customer', 'staff', 'admin', 'superadmin'),
  permissions: JSONB, -- Dynamic permissions for granular access control
  last_login: TIMESTAMP,
  login_attempts: INTEGER DEFAULT 0,
  is_locked: BOOLEAN DEFAULT false,
  locked_until: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Categories table
categories (
  id: UUID PRIMARY KEY,
  name: VARCHAR NOT NULL,
  slug: VARCHAR UNIQUE,
  description: TEXT,
  qualifies_for_membership: BOOLEAN DEFAULT false,
  parent_id: UUID REFERENCES categories(id),
  sort_order: INTEGER,
  is_active: BOOLEAN DEFAULT true,
  created_at: TIMESTAMP
)

-- Products table
products (
  id: UUID PRIMARY KEY,
  name: VARCHAR NOT NULL,
  slug: VARCHAR UNIQUE,
  description: TEXT,
  sku: VARCHAR UNIQUE,
  regular_price: DECIMAL(10,2) NOT NULL,
  member_price: DECIMAL(10,2),
  cost_price: DECIMAL(10,2),
  weight: DECIMAL(8,2),
  stock_quantity: INTEGER DEFAULT 0,
  low_stock_threshold: INTEGER DEFAULT 5,
  is_promotional: BOOLEAN DEFAULT false,
  is_active: BOOLEAN DEFAULT true,
  category_id: UUID REFERENCES categories(id),
  images: JSONB,
  metadata: JSONB,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Orders table
orders (
  id: UUID PRIMARY KEY,
  order_number: VARCHAR UNIQUE NOT NULL,
  user_id: UUID REFERENCES users(id),
  status: ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'),
  subtotal: DECIMAL(10,2),
  tax_amount: DECIMAL(10,2),
  shipping_amount: DECIMAL(10,2),
  total_amount: DECIMAL(10,2),
  payment_method: VARCHAR,
  payment_id: VARCHAR,
  payment_status: VARCHAR,
  shipping_address: JSONB,
  billing_address: JSONB,
  notes: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Order Items table
order_items (
  id: UUID PRIMARY KEY,
  order_id: UUID REFERENCES orders(id),
  product_id: UUID REFERENCES products(id),
  quantity: INTEGER NOT NULL,
  unit_price: DECIMAL(10,2),
  total_price: DECIMAL(10,2),
  is_member_price: BOOLEAN DEFAULT false
)

-- Membership Settings table
membership_settings (
  id: UUID PRIMARY KEY,
  threshold_amount: DECIMAL(10,2) DEFAULT 80.00,
  currency: VARCHAR DEFAULT 'MYR',
  is_active: BOOLEAN DEFAULT true,
  updated_by: UUID REFERENCES users(id),
  updated_at: TIMESTAMP
)

-- Audit Logs table
audit_logs (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  action: VARCHAR NOT NULL,
  table_name: VARCHAR,
  record_id: UUID,
  old_values: JSONB,
  new_values: JSONB,
  ip_address: INET,
  user_agent: TEXT,
  created_at: TIMESTAMP
)

-- Roles table (for granular permission management)
roles (
  id: UUID PRIMARY KEY,
  name: VARCHAR UNIQUE NOT NULL,
  description: TEXT,
  level: INTEGER NOT NULL, -- 1=customer, 2=staff, 3=admin, 4=superadmin
  is_system_role: BOOLEAN DEFAULT false,
  created_at: TIMESTAMP
)

-- Permissions table
permissions (
  id: UUID PRIMARY KEY,
  name: VARCHAR UNIQUE NOT NULL,
  resource: VARCHAR NOT NULL, -- e.g., 'products', 'orders', 'users'
  action: VARCHAR NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
  description: TEXT,
  is_system_permission: BOOLEAN DEFAULT false
)

-- Role Permissions mapping
role_permissions (
  id: UUID PRIMARY KEY,
  role_id: UUID REFERENCES roles(id),
  permission_id: UUID REFERENCES permissions(id),
  granted_by: UUID REFERENCES users(id),
  created_at: TIMESTAMP,
  UNIQUE(role_id, permission_id)
)

-- User Role assignments (for multiple roles)
user_roles (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  role_id: UUID REFERENCES roles(id),
  assigned_by: UUID REFERENCES users(id),
  expires_at: TIMESTAMP NULL,
  created_at: TIMESTAMP,
  UNIQUE(user_id, role_id)
)

-- Note: System configuration and API key management moved to Admin level
-- These tables will be managed through Admin interface, not SuperAdmin

-- SuperAdmin Activity Logs (security audit for superadmin actions only)
superadmin_activity_logs (
  id: UUID PRIMARY KEY,
  superadmin_id: UUID REFERENCES users(id),
  action_type: VARCHAR NOT NULL, -- e.g., 'admin_password_reset', 'admin_account_toggle', 'maintenance_mode'
  target_admin_id: UUID REFERENCES users(id), -- which admin account was affected
  details: JSONB, -- action details
  ip_address: INET,
  user_agent: TEXT,
  session_id: VARCHAR,
  created_at: TIMESTAMP
)

-- Note: System health monitoring and backup management moved to Admin level
-- These features will be available in Admin dashboard, not SuperAdmin

-- Security Incidents (admin and superadmin related only)
security_incidents (
  id: UUID PRIMARY KEY,
  incident_type: VARCHAR NOT NULL, -- e.g., 'admin_failed_login', 'superadmin_access_attempt'
  severity: ENUM('low', 'medium', 'high', 'critical'),
  admin_id: UUID REFERENCES users(id) NULL, -- admin or superadmin user involved
  ip_address: INET,
  user_agent: TEXT,
  details: JSONB,
  status: ENUM('open', 'investigating', 'resolved', 'false_positive'),
  created_at: TIMESTAMP
)

-- Product Reviews and Ratings
product_reviews (
  id: UUID PRIMARY KEY,
  product_id: UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id: UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id: UUID REFERENCES orders(id), -- verify purchase
  rating: INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_title: VARCHAR(255),
  review_text: TEXT,
  is_verified_purchase: BOOLEAN DEFAULT false,
  is_approved: BOOLEAN DEFAULT false,
  helpful_votes: INTEGER DEFAULT 0,
  unhelpful_votes: INTEGER DEFAULT 0,
  admin_response: TEXT,
  responded_at: TIMESTAMP,
  responded_by: UUID REFERENCES users(id),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Wishlist
wishlists (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id: UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at: TIMESTAMP,
  UNIQUE(user_id, product_id)
)

-- Recently Viewed Products
recently_viewed (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id: UUID REFERENCES products(id) ON DELETE CASCADE,
  viewed_at: TIMESTAMP,
  UNIQUE(user_id, product_id)
)

-- Discount Codes and Promotions
discount_codes (
  id: UUID PRIMARY KEY,
  code: VARCHAR(50) UNIQUE NOT NULL,
  name: VARCHAR(255) NOT NULL,
  description: TEXT,
  type: ENUM('percentage', 'fixed_amount', 'free_shipping'),
  value: DECIMAL(10,2) NOT NULL,
  min_order_amount: DECIMAL(10,2),
  max_discount_amount: DECIMAL(10,2), -- cap for percentage discounts
  usage_limit: INTEGER, -- total usage limit
  usage_limit_per_customer: INTEGER DEFAULT 1,
  used_count: INTEGER DEFAULT 0,
  member_only: BOOLEAN DEFAULT false,
  first_purchase_only: BOOLEAN DEFAULT false,
  applicable_categories: JSONB, -- array of category IDs
  excluded_products: JSONB, -- array of product IDs
  valid_from: TIMESTAMP,
  valid_to: TIMESTAMP,
  is_active: BOOLEAN DEFAULT true,
  created_by: UUID REFERENCES users(id),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Abandoned Carts
abandoned_carts (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id: VARCHAR(255), -- for guest users
  email: VARCHAR(255),
  phone: VARCHAR(20),
  cart_data: JSONB NOT NULL, -- complete cart contents
  total_amount: DECIMAL(10,2),
  membership_eligible: BOOLEAN DEFAULT false,
  email_sent_count: INTEGER DEFAULT 0,
  last_email_sent: TIMESTAMP,
  recovery_token: VARCHAR(255) UNIQUE,
  recovered_at: TIMESTAMP,
  recovery_order_id: UUID REFERENCES orders(id),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Customer Support Tickets
support_tickets (
  id: UUID PRIMARY KEY,
  ticket_number: VARCHAR(20) UNIQUE NOT NULL,
  user_id: UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email: VARCHAR(255),
  guest_name: VARCHAR(255),
  order_id: UUID REFERENCES orders(id) ON DELETE SET NULL,
  category: ENUM('order_inquiry', 'product_question', 'technical_issue', 'billing', 'membership', 'complaint', 'suggestion', 'other'),
  priority: ENUM('low', 'medium', 'high', 'urgent'),
  subject: VARCHAR(255) NOT NULL,
  description: TEXT NOT NULL,
  status: ENUM('open', 'pending', 'in_progress', 'resolved', 'closed'),
  assigned_to: UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution: TEXT,
  customer_satisfaction: INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  internal_notes: TEXT,
  first_response_at: TIMESTAMP,
  resolved_at: TIMESTAMP,
  closed_at: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Return and Refund Requests
return_requests (
  id: UUID PRIMARY KEY,
  return_number: VARCHAR(20) UNIQUE NOT NULL,
  order_id: UUID REFERENCES orders(id) NOT NULL,
  user_id: UUID REFERENCES users(id) NOT NULL,
  items: JSONB NOT NULL, -- returned items with quantities
  reason: ENUM('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping', 'other'),
  detailed_reason: TEXT,
  return_type: ENUM('refund', 'exchange', 'store_credit'),
  status: ENUM('requested', 'approved', 'rejected', 'items_received', 'processing', 'completed'),
  refund_amount: DECIMAL(10,2),
  return_shipping_cost: DECIMAL(10,2),
  photos: JSONB, -- evidence photos
  admin_notes: TEXT,
  processed_by: UUID REFERENCES users(id),
  requested_at: TIMESTAMP,
  approved_at: TIMESTAMP,
  completed_at: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Inventory Management
stock_movements (
  id: UUID PRIMARY KEY,
  product_id: UUID REFERENCES products(id) NOT NULL,
  movement_type: ENUM('purchase', 'sale', 'adjustment', 'return', 'damage', 'transfer'),
  quantity_change: INTEGER NOT NULL, -- positive for increase, negative for decrease
  quantity_after: INTEGER NOT NULL,
  reference_type: ENUM('order', 'return', 'adjustment', 'supplier'),
  reference_id: UUID, -- order_id, return_id, etc.
  cost_per_unit: DECIMAL(10,2),
  total_cost: DECIMAL(10,2),
  reason: TEXT,
  created_by: UUID REFERENCES users(id),
  created_at: TIMESTAMP
)

-- Email Marketing and Campaigns
email_campaigns (
  id: UUID PRIMARY KEY,
  name: VARCHAR(255) NOT NULL,
  type: ENUM('newsletter', 'promotional', 'abandoned_cart', 'membership', 'order_followup'),
  subject: VARCHAR(255) NOT NULL,
  template_name: VARCHAR(100),
  content: TEXT,
  target_audience: ENUM('all', 'members', 'non_members', 'specific_segment'),
  audience_criteria: JSONB, -- filtering criteria
  status: ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled'),
  recipient_count: INTEGER DEFAULT 0,
  delivered_count: INTEGER DEFAULT 0,
  opened_count: INTEGER DEFAULT 0,
  clicked_count: INTEGER DEFAULT 0,
  created_by: UUID REFERENCES users(id),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- File Uploads Management
file_uploads (
  id: UUID PRIMARY KEY,
  filename: VARCHAR(255) NOT NULL,
  original_filename: VARCHAR(255) NOT NULL,
  file_path: VARCHAR(500) NOT NULL,
  file_size: BIGINT NOT NULL,
  mime_type: VARCHAR(100) NOT NULL,
  file_type: ENUM('product_image', 'user_avatar', 'document', 'invoice', 'import_file', 'export_file', 'other'),
  uploaded_by: UUID REFERENCES users(id),
  related_entity_type: VARCHAR(50), -- 'product', 'user', 'order', etc.
  related_entity_id: UUID,
  is_active: BOOLEAN DEFAULT true,
  created_at: TIMESTAMP
)

-- Import/Export Job Tracking
import_export_jobs (
  id: UUID PRIMARY KEY,
  job_number: VARCHAR(20) UNIQUE NOT NULL,
  type: ENUM('product_import', 'product_export', 'order_export', 'customer_export', 'inventory_import', 'inventory_export', 'tax_report', 'fulfillment_export'),
  operation: ENUM('import', 'export'),
  filename: VARCHAR(255),
  original_filename: VARCHAR(255),
  file_path: VARCHAR(500),
  status: ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
  progress_percentage: INTEGER DEFAULT 0,
  total_records: INTEGER DEFAULT 0,
  processed_records: INTEGER DEFAULT 0,
  success_count: INTEGER DEFAULT 0,
  error_count: INTEGER DEFAULT 0,
  warning_count: INTEGER DEFAULT 0,
  configuration: JSONB, -- import/export settings, filters, mappings
  error_log: JSONB, -- detailed error information
  preview_data: JSONB, -- preview results for validation
  started_by: UUID REFERENCES users(id),
  started_at: TIMESTAMP,
  completed_at: TIMESTAMP,
  expires_at: TIMESTAMP, -- for export files
  downloaded_by: UUID REFERENCES users(id),
  downloaded_at: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Import/Export Templates
import_export_templates (
  id: UUID PRIMARY KEY,
  name: VARCHAR(255) NOT NULL,
  description: TEXT,
  type: ENUM('product_import', 'product_export', 'order_export', 'customer_export', 'inventory_import', 'tax_report'),
  operation: ENUM('import', 'export'),
  format: ENUM('csv', 'excel', 'json', 'pdf'),
  column_mapping: JSONB NOT NULL, -- field mappings and transformations
  validation_rules: JSONB, -- data validation requirements
  export_filters: JSONB, -- default filters for exports
  is_system_template: BOOLEAN DEFAULT false,
  is_active: BOOLEAN DEFAULT true,
  usage_count: INTEGER DEFAULT 0,
  created_by: UUID REFERENCES users(id),
  last_used_by: UUID REFERENCES users(id),
  last_used_at: TIMESTAMP,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Data Export Logs (PDPA Compliance)
data_export_requests (
  id: UUID PRIMARY KEY,
  request_number: VARCHAR(20) UNIQUE NOT NULL,
  user_id: UUID REFERENCES users(id), -- customer whose data is being exported
  export_type: ENUM('personal_data', 'purchase_history', 'marketing_data', 'full_profile'),
  request_reason: ENUM('customer_request', 'legal_compliance', 'data_portability', 'account_closure'),
  requested_by: UUID REFERENCES users(id), -- admin who processed the request
  customer_email: VARCHAR(255),
  data_scope: JSONB, -- what data is included
  file_path: VARCHAR(500),
  file_format: ENUM('json', 'csv', 'pdf'),
  status: ENUM('requested', 'processing', 'ready', 'downloaded', 'expired'),
  expires_at: TIMESTAMP NOT NULL, -- PDPA compliance - auto-delete after period
  download_link: VARCHAR(500),
  downloaded_at: TIMESTAMP,
  auto_deleted_at: TIMESTAMP,
  compliance_notes: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Bulk Operation Audit Trail
bulk_operation_logs (
  id: UUID PRIMARY KEY,
  operation_type: ENUM('product_import', 'product_update', 'inventory_update', 'customer_update', 'order_export'),
  job_id: UUID REFERENCES import_export_jobs(id),
  entity_type: VARCHAR(50), -- 'product', 'order', 'customer', etc.
  entity_id: UUID,
  action: ENUM('created', 'updated', 'deleted', 'exported'),
  old_values: JSONB,
  new_values: JSONB,
  change_summary: TEXT,
  performed_by: UUID REFERENCES users(id),
  batch_identifier: VARCHAR(100), -- group related operations
  created_at: TIMESTAMP
)

-- Malaysian Tax Reporting
tax_reports (
  id: UUID PRIMARY KEY,
  report_number: VARCHAR(20) UNIQUE NOT NULL,
  report_type: ENUM('gst_monthly', 'sst_quarterly', 'sales_summary', 'tax_audit'),
  period_start: DATE NOT NULL,
  period_end: DATE NOT NULL,
  total_sales: DECIMAL(15,2),
  total_tax_collected: DECIMAL(15,2),
  total_tax_exempt: DECIMAL(15,2),
  member_sales: DECIMAL(15,2),
  non_member_sales: DECIMAL(15,2),
  report_data: JSONB, -- detailed breakdown
  file_path: VARCHAR(500),
  generated_by: UUID REFERENCES users(id),
  status: ENUM('generating', 'completed', 'submitted', 'archived'),
  submitted_to_authority: BOOLEAN DEFAULT false,
  submission_date: TIMESTAMP,
  submission_reference: VARCHAR(100),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

#### Performance Optimization Indexes

```sql
-- User performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_member ON users(is_member);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Product performance indexes
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_price_range ON products(regular_price, member_price);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_promotional ON products(is_promotional);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Order performance indexes
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Category performance indexes
CREATE INDEX idx_categories_parent_active ON categories(parent_id, is_active);
CREATE INDEX idx_categories_membership_qual ON categories(qualifies_for_membership);

-- Audit and monitoring indexes
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_superadmin_activity_admin_type ON superadmin_activity_logs(superadmin_id, action_type);
CREATE INDEX idx_superadmin_activity_created_at ON superadmin_activity_logs(created_at);
CREATE INDEX idx_superadmin_activity_target ON superadmin_activity_logs(target_admin_id);

-- Role and permission indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- Note: API key management indexes moved to Admin level

-- Product review indexes
CREATE INDEX idx_product_reviews_product_rating ON product_reviews(product_id, rating);
CREATE INDEX idx_product_reviews_user_approved ON product_reviews(user_id, is_approved);
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at);

-- Wishlist and recently viewed indexes
CREATE INDEX idx_wishlists_user_product ON wishlists(user_id, product_id);
CREATE INDEX idx_recently_viewed_user_time ON recently_viewed(user_id, viewed_at);

-- Discount and promotional indexes
CREATE INDEX idx_discount_codes_active_dates ON discount_codes(is_active, valid_from, valid_to);
CREATE INDEX idx_discount_codes_member_only ON discount_codes(member_only, is_active);
CREATE INDEX idx_discount_usage_user_code ON discount_usage(user_id, discount_code_id);

-- Abandoned cart indexes
CREATE INDEX idx_abandoned_carts_user_created ON abandoned_carts(user_id, created_at);
CREATE INDEX idx_abandoned_carts_email_recovered ON abandoned_carts(email, recovered_at);
CREATE INDEX idx_abandoned_carts_recovery_token ON abandoned_carts(recovery_token);

-- Support ticket indexes
CREATE INDEX idx_support_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX idx_support_tickets_user_created ON support_tickets(user_id, created_at);
CREATE INDEX idx_support_tickets_assigned_status ON support_tickets(assigned_to, status);

-- Return request indexes
CREATE INDEX idx_return_requests_order_status ON return_requests(order_id, status);
CREATE INDEX idx_return_requests_user_created ON return_requests(user_id, created_at);

-- Inventory management indexes
CREATE INDEX idx_stock_movements_product_created ON stock_movements(product_id, created_at);
CREATE INDEX idx_stock_movements_type_created ON stock_movements(movement_type, created_at);

-- Email campaign indexes
CREATE INDEX idx_email_campaigns_type_status ON email_campaigns(type, status);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at);

-- File upload indexes
CREATE INDEX idx_file_uploads_entity_type ON file_uploads(related_entity_type, related_entity_id);
CREATE INDEX idx_file_uploads_file_type_active ON file_uploads(file_type, is_active);

-- Import/Export job indexes
CREATE INDEX idx_import_export_jobs_type_status ON import_export_jobs(type, status);
CREATE INDEX idx_import_export_jobs_started_by ON import_export_jobs(started_by, created_at);
CREATE INDEX idx_import_export_jobs_status_progress ON import_export_jobs(status, progress_percentage);
CREATE INDEX idx_import_export_jobs_expires_at ON import_export_jobs(expires_at);

-- Import/Export template indexes
CREATE INDEX idx_import_export_templates_type_active ON import_export_templates(type, is_active);
CREATE INDEX idx_import_export_templates_system ON import_export_templates(is_system_template, is_active);
CREATE INDEX idx_import_export_templates_usage ON import_export_templates(usage_count DESC);

-- Data export request indexes (PDPA compliance)
CREATE INDEX idx_data_export_requests_user_status ON data_export_requests(user_id, status);
CREATE INDEX idx_data_export_requests_expires_at ON data_export_requests(expires_at);
CREATE INDEX idx_data_export_requests_type_status ON data_export_requests(export_type, status);

-- Bulk operation audit indexes
CREATE INDEX idx_bulk_operation_logs_job_id ON bulk_operation_logs(job_id, created_at);
CREATE INDEX idx_bulk_operation_logs_entity ON bulk_operation_logs(entity_type, entity_id);
CREATE INDEX idx_bulk_operation_logs_batch ON bulk_operation_logs(batch_identifier, created_at);
CREATE INDEX idx_bulk_operation_logs_performed_by ON bulk_operation_logs(performed_by, created_at);

-- Tax report indexes
CREATE INDEX idx_tax_reports_period ON tax_reports(period_start, period_end);
CREATE INDEX idx_tax_reports_type_status ON tax_reports(report_type, status);
CREATE INDEX idx_tax_reports_generated_by ON tax_reports(generated_by, created_at);
```

### API Design

#### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (during checkout)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Product Endpoints

- `GET /api/products` - List products with filtering
- `GET /api/products/[slug]` - Get single product
- `GET /api/categories` - List categories
- `GET /api/search` - Product search

#### Cart Endpoints

- `GET /api/cart` - Get cart contents
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove cart item
- `GET /api/cart/membership-check` - Check membership eligibility

#### Order Endpoints

- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `GET /api/orders` - List user orders
- `POST /api/orders/[id]/payment` - Process payment

#### Enhanced Customer API Endpoints

**Product & Catalog:**
- `GET /api/products` - List products with filtering, pagination, search
- `GET /api/products/[slug]` - Get single product with reviews and recommendations
- `GET /api/products/[id]/reviews` - Get product reviews with pagination
- `POST /api/products/[id]/reviews` - Submit product review (authenticated)
- `PUT /api/reviews/[id]/helpful` - Vote review as helpful
- `GET /api/categories` - List categories with hierarchy
- `GET /api/search` - Advanced product search with faceted filters
- `GET /api/search/suggestions` - Search autocomplete suggestions

**Shopping & Cart:**
- `GET /api/cart` - Get cart contents with membership eligibility
- `POST /api/cart/add` - Add item to cart with real-time pricing
- `PUT /api/cart/update` - Update cart item quantities
- `DELETE /api/cart/remove` - Remove cart item
- `GET /api/cart/membership-check` - Check membership qualification status
- `POST /api/cart/apply-discount` - Apply discount code to cart
- `DELETE /api/cart/remove-discount` - Remove applied discount

**Wishlist & Personalization:**
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist/add` - Add product to wishlist
- `DELETE /api/wishlist/remove/[id]` - Remove from wishlist
- `GET /api/recently-viewed` - Get recently viewed products
- `POST /api/recently-viewed` - Track product view
- `GET /api/recommendations` - Get personalized product recommendations

**Promotions & Discounts:**
- `GET /api/promotions/active` - Get active promotions and discounts
- `GET /api/promotions/member-only` - Get member-exclusive offers
- `POST /api/promotions/validate` - Validate discount code
- `GET /api/promotions/[code]` - Get discount code details

**Customer Support:**
- `GET /api/support/tickets` - Get user support tickets
- `POST /api/support/tickets` - Create support ticket
- `PUT /api/support/tickets/[id]` - Update ticket (customer responses)
- `GET /api/support/faqs` - Get FAQ list with search
- `POST /api/support/contact` - Submit contact form

**Order Management:**
- `POST /api/orders` - Create order with payment processing
- `GET /api/orders/[id]` - Get order details with tracking
- `GET /api/orders` - List user orders with filtering
- `POST /api/orders/[id]/payment` - Process payment for pending order
- `GET /api/orders/[id]/invoice` - Download order invoice PDF
- `POST /api/orders/[id]/return` - Request order return/refund

#### Comprehensive Admin API Endpoints

**Dashboard & Analytics:**
- `GET /api/admin/dashboard` - Business overview with key metrics
- `GET /api/admin/analytics/sales` - Sales analytics with date ranges
- `GET /api/admin/analytics/customers` - Customer analytics and segmentation
- `GET /api/admin/analytics/products` - Product performance analytics
- `GET /api/admin/analytics/membership` - Membership conversion analytics
- `GET /api/admin/reports/export` - Export analytics reports (CSV, PDF)

**Product Management:**
- `GET /api/admin/products` - List all products with advanced filtering
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/[id]` - Update product details
- `DELETE /api/admin/products/[id]` - Soft delete product
- `POST /api/admin/products/bulk-import` - Bulk product import (CSV)
- `GET /api/admin/products/export` - Export products to CSV
- `POST /api/admin/products/[id]/images` - Upload product images
- `PUT /api/admin/products/[id]/status` - Update product status (active/inactive)

**Order Management:**
- `GET /api/admin/orders` - List all orders with filtering and pagination
- `PUT /api/admin/orders/[id]` - Update order status and details
- `POST /api/admin/orders/[id]/fulfill` - Mark order as fulfilled
- `POST /api/admin/orders/[id]/ship` - Generate shipping label
- `GET /api/admin/orders/[id]/timeline` - Get order status timeline
- `POST /api/admin/orders/bulk-update` - Bulk order status updates
- `GET /api/admin/orders/export` - Export orders for fulfillment

**Customer & Member Management:**
- `GET /api/admin/customers` - List all customers with analytics
- `GET /api/admin/customers/[id]` - Get customer details and history
- `PUT /api/admin/customers/[id]` - Update customer information
- `POST /api/admin/customers/[id]/notes` - Add internal customer notes
- `GET /api/admin/members` - Member analytics and management
- `PUT /api/admin/members/[id]/status` - Update membership status
- `GET /api/admin/members/analytics` - Member conversion and retention stats

**Inventory Management:**
- `GET /api/admin/inventory` - Inventory overview with low stock alerts
- `PUT /api/admin/inventory/[id]` - Update stock quantities
- `GET /api/admin/inventory/movements` - Stock movement history
- `POST /api/admin/inventory/adjustment` - Manual stock adjustments
- `GET /api/admin/inventory/low-stock` - Low stock alerts and notifications
- `POST /api/admin/inventory/reorder` - Create reorder notifications

**Review & Content Moderation:**
- `GET /api/admin/reviews` - List all reviews for moderation
- `PUT /api/admin/reviews/[id]/approve` - Approve/reject reviews
- `POST /api/admin/reviews/[id]/respond` - Admin response to reviews
- `DELETE /api/admin/reviews/[id]` - Delete inappropriate reviews
- `GET /api/admin/reviews/analytics` - Review analytics and sentiment

**Customer Support Management:**
- `GET /api/admin/support/tickets` - List all support tickets
- `PUT /api/admin/support/tickets/[id]` - Update ticket status and assign
- `POST /api/admin/support/tickets/[id]/respond` - Admin response to tickets
- `GET /api/admin/support/analytics` - Support metrics and performance
- `PUT /api/admin/support/faqs` - Manage FAQ content

**Marketing & Promotions:**
- `GET /api/admin/promotions` - List all promotional campaigns
- `POST /api/admin/promotions` - Create new promotion/discount
- `PUT /api/admin/promotions/[id]` - Update promotion details
- `DELETE /api/admin/promotions/[id]` - Deactivate promotion
- `GET /api/admin/promotions/[id]/analytics` - Promotion performance metrics
- `POST /api/admin/email-campaigns` - Create email marketing campaigns
- `GET /api/admin/email-campaigns` - List email campaigns with metrics

**System Configuration:**
- `GET /api/admin/settings` - Get system configuration
- `PUT /api/admin/settings/general` - Update general settings
- `PUT /api/admin/settings/payment` - Configure payment gateways
- `PUT /api/admin/settings/shipping` - Configure shipping methods
- `PUT /api/admin/settings/email` - Configure email services
- `PUT /api/admin/settings/tax` - Configure tax settings (GST/SST)
- `GET /api/admin/api-keys` - Manage service API keys
- `PUT /api/admin/api-keys/[service]` - Update service API keys

**Return & Refund Management:**
- `GET /api/admin/returns` - List all return requests
- `PUT /api/admin/returns/[id]/approve` - Approve/reject return requests
- `POST /api/admin/returns/[id]/process` - Process approved returns
- `GET /api/admin/returns/analytics` - Return analytics and trends
- `POST /api/admin/refunds` - Process refunds manually

**File & Media Management:**
- `POST /api/admin/files/upload` - Upload files (images, documents)
- `GET /api/admin/files` - List uploaded files with filtering
- `DELETE /api/admin/files/[id]` - Delete uploaded files
- `POST /api/admin/files/bulk-optimize` - Bulk image optimization

**Bulk Import/Export Operations:**

**Product Bulk Operations:**
- `POST /api/admin/products/import` - Upload and process product import file (CSV/Excel)
- `GET /api/admin/products/import/[jobId]/status` - Check import job progress and errors
- `GET /api/admin/products/import/[jobId]/preview` - Preview import data before processing
- `POST /api/admin/products/import/[jobId]/confirm` - Confirm and execute previewed import
- `GET /api/admin/products/export` - Export products with filtering (all, active, low-stock, etc.)
- `POST /api/admin/products/bulk-update` - Bulk update product prices, stock, or status
- `GET /api/admin/products/templates/import` - Download product import templates
- `GET /api/admin/products/templates/export` - Get export template configurations

**Order Bulk Operations:**
- `GET /api/admin/orders/export/fulfillment` - Daily fulfillment export (EasyParcel compatible)
- `GET /api/admin/orders/export/accounting` - Accounting system export with tax breakdown
- `GET /api/admin/orders/export/shipping-labels` - Bulk shipping label generation
- `POST /api/admin/orders/import/tracking` - Bulk import tracking numbers and status updates
- `GET /api/admin/orders/export/analytics` - Order analytics export for business intelligence
- `POST /api/admin/orders/bulk-update-status` - Bulk order status updates

**Customer/Member Bulk Operations:**
- `GET /api/admin/customers/export/segments` - Customer segmentation export for marketing
- `GET /api/admin/customers/export/analytics` - Customer analytics and behavior export
- `POST /api/admin/customers/import/updates` - Bulk customer information updates
- `GET /api/admin/members/export/analytics` - Member conversion and retention analytics
- `POST /api/admin/members/bulk-status-update` - Bulk membership status changes

**Inventory Bulk Operations:**
- `POST /api/admin/inventory/import/stock-update` - Bulk stock level updates
- `POST /api/admin/inventory/import/cost-update` - Bulk product cost price updates
- `GET /api/admin/inventory/export/audit` - Complete inventory audit report
- `GET /api/admin/inventory/export/reorder` - Reorder suggestions with supplier information
- `GET /api/admin/inventory/export/movements` - Stock movement history export
- `POST /api/admin/inventory/bulk-adjustment` - Bulk inventory adjustments with reasons

**Malaysian Tax & Compliance:**
- `GET /api/admin/tax/export/gst-report` - GST monthly/quarterly reports
- `GET /api/admin/tax/export/sst-report` - SST quarterly reports  
- `GET /api/admin/tax/export/sales-summary` - Sales summary for tax authorities
- `POST /api/admin/tax/generate-report` - Generate custom tax report for specific period
- `GET /api/admin/compliance/export/audit-trail` - Complete audit trail export

**PDPA Compliance Operations:**
- `POST /api/admin/customers/[id]/export-data` - Export individual customer data (PDPA right)
- `GET /api/admin/pdpa/export-requests` - List all customer data export requests
- `PUT /api/admin/pdpa/export-requests/[id]/approve` - Approve customer data export request
- `GET /api/admin/pdpa/export-requests/[id]/download` - Download approved customer data export

**Import/Export Job Management:**
- `GET /api/admin/import-export/jobs` - List all import/export jobs with status
- `GET /api/admin/import-export/jobs/[id]` - Get detailed job status and logs
- `DELETE /api/admin/import-export/jobs/[id]` - Cancel running job or delete completed job
- `POST /api/admin/import-export/jobs/[id]/retry` - Retry failed import/export job
- `GET /api/admin/import-export/jobs/[id]/download` - Download export file or error report
- `POST /api/admin/import-export/jobs/[id]/schedule` - Schedule recurring export jobs

**Template Management:**
- `GET /api/admin/templates` - List all import/export templates
- `POST /api/admin/templates` - Create custom import/export template
- `PUT /api/admin/templates/[id]` - Update template configuration
- `DELETE /api/admin/templates/[id]` - Delete custom template
- `GET /api/admin/templates/[id]/download` - Download template file
- `POST /api/admin/templates/[id]/clone` - Clone existing template

#### SuperAdmin Endpoints (Simplified)

- `GET /api/superadmin/admin-accounts` - View admin account status
- `PUT /api/superadmin/admin-accounts/[id]/password` - Reset admin password
- `PUT /api/superadmin/admin-accounts/[id]/status` - Activate/deactivate admin account
- `GET /api/superadmin/system-status` - Basic system uptime status
- `POST /api/superadmin/maintenance-mode` - Emergency maintenance mode toggle
- `GET /api/superadmin/admin-activity` - SuperAdmin action audit logs

## Feature Specifications

### 1. Product Catalog

- **Product Grid:** Responsive grid layout with lazy loading
- **Product Cards:** Image, name, regular price, member price, rating
- **Product Details:** Full description, specifications, image gallery
- **Category Navigation:** Hierarchical category menu
- **Search & Filters:** Advanced search with price, category, brand filters
- **Related Products:** AI-driven product recommendations

### 2. Shopping Cart

- **Add to Cart:** AJAX-based cart updates
- **Cart Sidebar:** Quick cart view with item count
- **Cart Page:** Full cart management with quantity updates
- **Membership Checker:** Real-time calculation of qualification status
- **Price Display:** Clear breakdown of regular vs member pricing
- **Save for Later:** Wishlist integration

### 3. Membership System

- **Eligibility Calculation:** Real-time cart analysis for qualification
- **Registration Modal:** Streamlined signup during checkout
- **Member Dashboard:** Purchase history, savings tracker, profile management
- **Member Benefits:** Clear display of savings and exclusive access
- **Admin Configuration:** Flexible threshold and category settings

### 4. Checkout Process

- **Guest Checkout:** Option for non-members
- **Address Management:** Multiple saved addresses
- **Shipping Calculator:** Integration with EasyParcel for real rates
- **Payment Processing:** Billplz integration with multiple payment methods
- **Order Confirmation:** Email with invoice and tracking information

### 5. Order Management

- **Order Tracking:** Real-time status updates
- **Shipping Integration:** Automatic tracking number updates
- **Admin Dashboard:** Bulk order processing and fulfillment
- **Customer Notifications:** Email and SMS updates
- **Return Processing:** Streamlined return/exchange workflow

### 6. Admin Panel

- **Product Management:** Bulk import/export, inventory tracking
- **Order Management:** Processing queue, status updates, analytics
- **Member Management:** Customer insights, communication tools
- **Settings Configuration:** System-wide settings and preferences
- **Analytics Dashboard:** Sales reports, member conversion tracking

### 7. SuperAdmin System

- **Admin Account Management:** Password reset and account activation/deactivation for admin users
- **Emergency Access:** Emergency maintenance mode toggle for system issues
- **Security Monitoring:** Admin activity audit trails and security incident logging
- **System Status:** Basic system uptime monitoring (no business data access)

#### SuperAdmin Dashboard Features:

- **Admin Account Control:**
  - Reset admin passwords (with verification)
  - Activate/deactivate admin accounts
  - View admin login activity (security audit only)
- **Emergency System Control:**
  - Basic system status (up/down, error count)
  - Emergency maintenance mode toggle
  - Admin activity security logs
- **Security Monitoring:**
  - Admin-related security incidents only
  - Failed admin login attempts
  - SuperAdmin action audit trail

## Security & Compliance

### Security Measures

- **Authentication:** Secure JWT tokens with refresh rotation
- **Authorization:** Enhanced Role-based access control (RBAC) with granular permissions
- **Role Hierarchy:** Customer < Staff < Admin < SuperAdmin with clear permission boundaries
- **Permission Matrix:** Granular permissions for resources (products, orders, users, system)
- **Data Protection:** Input validation, SQL injection prevention
- **Payment Security:** PCI DSS compliance guidelines
- **Session Security:** Secure cookie handling, CSRF protection
- **Rate Limiting:** API endpoint protection with role-based limits
- **SuperAdmin Security:** Multi-factor authentication, IP whitelisting, emergency access only
- **Audit Trails:** Logging of SuperAdmin actions (password resets, account changes)
- **Admin Security:** Admin-level security monitoring and business data protection
- **Separation of Concerns:** SuperAdmin cannot access business data or customer information
- **Code Quality:** Continuous integration with automated security scanning
- **Evidence-Based Security:** Data-driven security decisions with role-appropriate access

### Malaysian Market Compliance & Localization

#### PDPA (Personal Data Protection Act) Compliance

**Data Collection & Consent:**
- **Explicit Consent:** Clear opt-in for marketing communications
- **Purpose Limitation:** Data collection limited to stated business purposes
- **Consent Management:** User dashboard for managing data preferences
- **Cookie Consent:** GDPR-style cookie banner with granular controls
- **Child Protection:** Age verification for users under 13

**Data Processing & Storage:**
- **Data Minimization:** Collect only necessary information
- **Retention Policies:** Automated data deletion after specified periods
- **Access Rights:** User portal for viewing/downloading personal data
- **Rectification Rights:** Self-service profile editing capabilities
- **Portability Rights:** Data export in structured format (JSON/CSV)

**Malaysian Regulatory Requirements:**
- **GST/SST Integration:** Automated tax calculation based on product categories
- **Malaysian Address Validation:** Postal code and state validation
- **Consumer Protection Act:** Clear pricing, return policies, terms of service
- **Business Registration:** Display of business registration numbers
- **Dispute Resolution:** Clear escalation procedures for customer complaints

#### Enhanced Security Framework

**OWASP Top 10 Mitigation:**
```
1. Injection Prevention: Parameterized queries, input validation
2. Broken Authentication: Strong password policies, MFA, session management
3. Sensitive Data Exposure: Encryption at rest/transit, secure key management
4. XML External Entities: Disable XML external entity processing
5. Broken Access Control: Role-based permissions, principle of least privilege
6. Security Misconfiguration: Secure defaults, regular security reviews
7. Cross-Site Scripting: Input sanitization, Content Security Policy
8. Insecure Deserialization: Secure serialization practices
9. Known Vulnerabilities: Dependency scanning, regular updates
10. Insufficient Logging: Comprehensive audit trails, security monitoring
```

**Malaysian-Specific Security Measures:**
- **Payment Security:** PCI DSS compliance for Billplz integration
- **Local Data Residency:** All personal data stored within Malaysian jurisdiction
- **Government Compliance:** Ready for future Malaysian cybersecurity frameworks
- **Banking Integration:** Secure handling of Malaysian banking details
- **Multi-language Security:** Security measures for Bahasa Malaysia content

#### Localization Features

**Malaysian User Experience:**
- **Currency Display:** Proper RM formatting (RM 99.90 vs RM99.90)
- **Date Formats:** DD/MM/YYYY format preferred in Malaysia
- **Phone Numbers:** Malaysian mobile (+60) format validation
- **Address System:** Malaysian address format with postcode validation
- **Payment Methods:** Local payment method prioritization (Billplz, Banking)

**Cultural Adaptations:**
- **Color Psychology:** Use of trust-building colors (blue, green) avoiding taboo colors
- **Festival Integration:** Malaysian holiday awareness (Hari Raya, Chinese New Year, Deepavali)
- **Language Support:** Bahasa Malaysia translation framework ready
- **Local Business Hours:** Malaysian timezone (UTC+8) for all operations
- **Halal Certification:** Product certification display capabilities

### PCI DSS Guidelines

- **Payment Isolation:** No card data storage on servers
- **Secure Transmission:** TLS encryption for all payment data
- **Access Control:** Restricted access to payment processing
- **Monitoring:** Payment transaction logging and monitoring

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2) - Enhanced with SuperClaude Methodology

- Project setup and configuration with comprehensive debugging tools
- Database schema implementation with performance indexes and optimization
- Authentication system with role-based session management (simplified SuperAdmin)
- Basic UI components with reusable patterns and quality standards
- Early performance monitoring integration
- Comprehensive error handling framework implementation
- Code quality standards establishment and automated review processes
- SuperAdmin emergency access system (3-4 days total)

### Phase 2: Core E-commerce (Weeks 3-4)

- Product catalog implementation
- Shopping cart functionality
- Basic search and filtering
- Category management

### Phase 3: Membership System (Weeks 5-6)

- Membership logic implementation
- Registration flow
- Member dashboard
- Admin configuration

### Phase 4: Payment & Orders (Weeks 7-8)

- Billplz payment integration
- Order processing workflow
- Email notifications
- Tax calculations

### Phase 5: Shipping & Logistics (Weeks 9-10)

- EasyParcel integration
- Shipping calculations
- Order fulfillment
- Tracking system

### Phase 6: Admin Dashboard & System Management (Weeks 11-12)

- Complete admin panel with business analytics and reporting
- System configuration management (payment gateways, shipping, email)
- Advanced admin dashboard with business intelligence
- Member management with communication tools
- API key management and service integrations
- Simplified SuperAdmin system (emergency access only) - 2-3 days development

### Phase 7: Content & SEO (Weeks 13-14)

- Content management system
- SEO optimization
- Multi-language support
- Marketing features

### Phase 8: Performance & Security (Weeks 15-16) - Evidence-Based Optimization

- Advanced performance optimization with automated baselines and monitoring
- Security hardening with continuous scanning and threat detection
- Enhanced caching implementation with intelligent invalidation strategies
- Comprehensive load testing with performance profiling and optimization recommendations
- Token economy optimization for resource efficiency
- Cognitive load reduction through UX optimization

### Phase 9: Testing & QA (Weeks 17-18)

- Comprehensive testing
- Security auditing
- User acceptance testing
- Bug fixes and optimization

### Phase 10: Deployment (Weeks 19-20)

- Production deployment
- Monitoring setup
- Documentation
- Training and handover

## Success Metrics

### Technical Metrics

- **Page Load Time:** < 2 seconds for product pages
- **API Response Time:** < 500ms for critical endpoints
- **Uptime:** 99.9% availability
- **Security:** Zero critical vulnerabilities

### Business Metrics

- **Membership Conversion:** Target 25% of eligible customers
- **Member Retention:** 80% repeat purchase rate
- **Average Order Value:** 20% increase for members
- **Customer Satisfaction:** 4.5+ star rating

## Risk Management

### Technical Risks

- **Payment Integration:** Comprehensive testing with Billplz sandbox
- **Performance:** Early load testing and optimization
- **Security:** Regular security audits and penetration testing
- **Data Migration:** Thorough backup and rollback procedures

### Business Risks

- **Scope Creep:** Detailed documentation and change management
- **Timeline Delays:** Agile methodology with weekly reviews
- **Budget Overruns:** Detailed cost tracking and approval process
- **User Adoption:** User testing and feedback integration

## Maintenance & Support

### Post-Launch Support

- **Bug Fixes:** 30-day warranty period for critical issues
- **Performance Monitoring:** 24/7 uptime monitoring
- **Security Updates:** Monthly security patches
- **Feature Updates:** Quarterly enhancement releases

### Documentation

- **User Manual:** Admin and customer user guides
- **Technical Documentation:** API documentation and system architecture
- **Deployment Guide:** Step-by-step deployment procedures
- **Troubleshooting Guide:** Common issues and solutions

---

**Document Version:** 1.0  
**Last Updated:** August 3, 2025  
**Next Review:** Weekly during development phases
