# Settings Implementation Guide

## Overview

Comprehensive settings system for EcomJRM with role-based access control and centralized business profile management. Following @CLAUDE.md principles for systematic, DRY implementation with single source of truth approach.

## Architecture Design

### Role-Based Settings Structure
- **Customer Settings** (`/settings/*`): User account management, membership, preferences
- **Admin Settings** (`/admin/settings/*`): Business operations, hybrid navigation approach
- **Superadmin Settings** (`/superadmin/settings/*`): Admin account control only

### Design Principles
1. **Single Source of Truth**: Business profile eliminates redundancy
2. **Hybrid Navigation**: Settings hub + links to existing configurations
3. **Role Separation**: Clean boundaries between user types
4. **Malaysian Compliance**: GST/SST tax management, business validation
5. **Security First**: Sensitive data encryption, comprehensive audit trails

## Database Schema Updates

### New Business Profile Model
```prisma
model BusinessProfile {
  id                    String   @id @default(cuid())
  
  // Company Information
  legalName            String
  tradingName          String?
  registrationNumber   String   @unique // SSM Registration
  taxRegistrationNumber String? // GST Registration
  businessType         String   @default("SDN_BHD")
  
  // Addresses
  registeredAddress    Json     // Full address object
  operationalAddress   Json?    // Can be different from registered
  shippingAddress      Json?    // Default shipping sender address
  
  // Contact Information
  primaryPhone         String
  secondaryPhone       String?
  primaryEmail         String
  supportEmail         String?
  website              String?
  
  // Banking Information (Encrypted)
  bankName             String?
  bankAccountNumber    String?  // Encrypted field
  bankAccountHolder    String?
  
  // Legal & Compliance
  businessLicense      String?
  industryCode         String?
  establishedDate      DateTime?
  
  // System Fields
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  createdBy            String
  updatedBy            String?
  
  @@map("business_profile")
}

model BusinessProfileHistory {
  id                String   @id @default(cuid())
  businessProfileId String
  operation         String   // CREATE, UPDATE, DELETE
  oldValues         Json?
  newValues         Json
  changedBy         String
  changeReason      String?
  createdAt         DateTime @default(now())
  
  @@index([businessProfileId, createdAt])
  @@map("business_profile_history")
}
```

### Enhanced Tax Rate Model
```prisma
model TaxConfiguration {
  id                String   @id @default(cuid())
  
  // Company Tax Information
  gstRegistered     Boolean  @default(false)
  gstNumber         String?  @unique
  sstRegistered     Boolean  @default(false)
  sstNumber         String?  @unique
  
  // Default Tax Rates
  defaultGstRate    Decimal  @default(0) @db.Decimal(5, 4)
  defaultSstRate    Decimal  @default(0) @db.Decimal(5, 4)
  
  // Tax Settings
  taxInclusivePricing Boolean @default(true)
  autoCalculateTax    Boolean @default(true)
  
  // System Fields
  isActive          Boolean  @default(true)
  effectiveFrom     DateTime @default(now())
  effectiveTo       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  updatedBy         String
  
  @@map("tax_configuration")
}
```

## Customer Settings Implementation

### 1. Account Management (`/src/app/settings/account/page.tsx`)

#### Features
- Personal information management
- Password change functionality
- Profile picture upload
- Address management with Malaysian validation
- Account deactivation request

#### Components
```typescript
interface PersonalInfoForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}

interface AddressForm {
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: MalaysianState;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}
```

#### Validation Schema
```typescript
import { z } from 'zod';

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^(\+?6?01)[02-46-9]\d{7,8}$/, 'Invalid Malaysian phone number'),
  dateOfBirth: z.string().optional()
});

const addressSchema = z.object({
  type: z.enum(['billing', 'shipping']),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  company: z.string().max(100).optional(),
  addressLine1: z.string().min(1).max(100),
  addressLine2: z.string().max(100).optional(),
  city: z.string().min(1).max(50),
  state: z.enum(['JOH','KDH','KTN','MLK','NSN','PHG','PRK','PLS','PNG','KUL','TRG','SEL','SBH','SWK','LBN']),
  postalCode: z.string().regex(/^\d{5}$/, 'Invalid Malaysian postal code'),
  country: z.literal('Malaysia'),
  phone: z.string().regex(/^(\+?6?01)[02-46-9]\d{7,8}$/).optional(),
  isDefault: z.boolean()
});
```

### 2. Membership Dashboard (`/src/app/settings/membership/page.tsx`)

#### Features
- Membership status display
- Referral code management
- Referral history and rewards
- Member benefits overview

#### Components
```typescript
interface MembershipStatus {
  isMember: boolean;
  memberSince?: Date;
  membershipTotal: number;
  currentTier?: string;
  nextTierThreshold?: number;
}

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  availableRewards: number;
}
```

### 3. Preferences (`/src/app/settings/preferences/page.tsx`)

#### Features
- Default shipping/billing addresses
- Preferred payment methods
- Language preference (English/Malay)
- Wishlist privacy settings

### 4. Privacy & Communications (`/src/app/settings/privacy/page.tsx`)

#### Features
- Email notification preferences
- SMS preferences
- Marketing communications opt-in/out
- Data sharing controls
- Privacy settings management

## Admin Settings Implementation

### 1. Settings Dashboard (`/src/app/admin/settings/page.tsx`)

#### Features
- Configuration status overview
- Quick links to existing configuration pages
- Recent setting modifications
- System health indicators

#### Dashboard Sections
```typescript
interface SettingsDashboard {
  businessProfile: {
    configured: boolean;
    lastUpdated?: Date;
    completeness: number; // Percentage
  };
  taxConfiguration: {
    configured: boolean;
    gstEnabled: boolean;
    lastUpdated?: Date;
  };
  integrations: {
    telegram: boolean;
    payment: boolean;
    shipping: boolean;
  };
  recentChanges: SettingChange[];
}

interface SettingChange {
  section: string;
  action: string;
  changedBy: string;
  timestamp: Date;
  description: string;
}
```

### 2. Business Profile (`/src/app/admin/settings/business-profile/page.tsx`)

#### Features
- Centralized company information
- Multi-address management
- Banking information (encrypted storage)
- Legal compliance data

#### Form Sections
```typescript
interface CompanyInformation {
  legalName: string;
  tradingName?: string;
  registrationNumber: string; // SSM format: 123456-X
  taxRegistrationNumber?: string; // GST format
  businessType: 'SDN_BHD' | 'ENTERPRISE' | 'SOLE_PROPRIETOR';
  establishedDate?: Date;
}

interface BusinessAddress {
  type: 'registered' | 'operational' | 'shipping';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: MalaysianState;
  postalCode: string;
  country: 'Malaysia';
}

interface ContactInformation {
  primaryPhone: string;
  secondaryPhone?: string;
  primaryEmail: string;
  supportEmail?: string;
  website?: string;
}

interface BankingInformation {
  bankName: string;
  bankAccountNumber: string; // Encrypted
  bankAccountHolder: string;
}
```

#### Validation Schema
```typescript
const businessProfileSchema = z.object({
  // Company Information
  legalName: z.string().min(1).max(200),
  tradingName: z.string().max(200).optional(),
  registrationNumber: z.string().regex(/^\d{6,8}-[A-Z]$/, 'Invalid SSM format (e.g., 123456-X)'),
  taxRegistrationNumber: z.string().regex(/^[A-Z]\d{11}$/, 'Invalid GST format').optional(),
  businessType: z.enum(['SDN_BHD', 'ENTERPRISE', 'SOLE_PROPRIETOR']),
  
  // Addresses
  registeredAddress: addressSchema,
  operationalAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  
  // Contact
  primaryPhone: z.string().regex(/^(\+?6?0)[1-9]\d{8,9}$/),
  secondaryPhone: z.string().regex(/^(\+?6?0)[1-9]\d{8,9}$/).optional(),
  primaryEmail: z.string().email(),
  supportEmail: z.string().email().optional(),
  website: z.string().url().optional(),
  
  // Banking (if provided)
  bankName: z.string().max(100).optional(),
  bankAccountNumber: z.string().min(10).max(20).optional(),
  bankAccountHolder: z.string().max(200).optional()
});
```

### 3. Tax Management (`/src/app/admin/settings/tax/page.tsx`)

#### Features
- GST/SST rate management
- Tax registration information
- Product tax classes
- Tax reporting links

#### Tax Configuration
```typescript
interface TaxConfiguration {
  // Registration Status
  gstRegistered: boolean;
  gstNumber?: string;
  sstRegistered: boolean;
  sstNumber?: string;
  
  // Tax Rates
  rates: TaxRate[];
  defaultGstRate: number;
  defaultSstRate: number;
  
  // Settings
  taxInclusivePricing: boolean;
  autoCalculateTax: boolean;
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description?: string;
  isActive: boolean;
  applicableToProducts?: string[];
  applicableToCategories?: string[];
}
```

#### Malaysian Tax Rates
```typescript
const malaysianTaxRates = {
  GST_ZERO: { rate: 0, name: 'GST 0%', description: 'Zero-rated supplies' },
  GST_STANDARD: { rate: 6, name: 'GST 6%', description: 'Standard rate' },
  SST_SERVICE: { rate: 6, name: 'SST 6%', description: 'Service tax' },
  SST_GOODS: { rate: 10, name: 'SST 10%', description: 'Sales tax on goods' },
  EXEMPT: { rate: 0, name: 'Tax Exempt', description: 'Exempt supplies' }
};
```

### 4. Admin Preferences (`/src/app/admin/settings/preferences/page.tsx`)

#### Features
- Dashboard layout preferences
- Default filters and views
- Notification preferences
- System preferences (timezone, currency)

## Superadmin Settings Implementation

### 1. Admin Account Management (`/src/app/superadmin/settings/admins/page.tsx`)

#### Features
- List all admin accounts
- Activate/deactivate admin accounts
- Reset admin passwords
- View admin activity logs

#### Admin Management Interface
```typescript
interface AdminAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
  createdBy?: string;
}

interface AdminAccountActions {
  activate: (adminId: string) => Promise<void>;
  deactivate: (adminId: string, reason: string) => Promise<void>;
  resetPassword: (adminId: string) => Promise<string>; // Returns temp password
  viewActivity: (adminId: string) => AdminActivity[];
}
```

### 2. System Security (`/src/app/superadmin/settings/security/page.tsx`)

#### Features
- Critical system locks/unlocks
- Emergency access controls
- System-wide security settings

## Technical Implementation

### Shared UI Components

#### Form Components
```typescript
// Reusable form components with consistent styling
export const SettingsCard: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}>;

export const SettingsSection: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}>;

export const SettingsInput: React.FC<{
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>>;

export const SettingsSelect: React.FC<{
  label: string;
  options: Array<{value: string; label: string}>;
  placeholder?: string;
  required?: boolean;
  error?: string;
}>;
```

#### Layout Components
```typescript
export const SettingsLayout: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}>;

export const SettingsTabs: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    href: string;
    icon?: React.ReactNode;
  }>;
  currentTab: string;
}>;
```

### API Routes Structure

#### Customer Settings APIs
```typescript
// /src/app/api/settings/account/route.ts
export async function GET(request: Request) {
  // Get user account information
}

export async function PUT(request: Request) {
  // Update user account information
  // Include audit logging
}

// /src/app/api/settings/addresses/route.ts
export async function GET(request: Request) {
  // Get user addresses
}

export async function POST(request: Request) {
  // Add new address with validation
}

export async function PUT(request: Request) {
  // Update address
}

export async function DELETE(request: Request) {
  // Delete address (soft delete if used in orders)
}
```

#### Admin Settings APIs
```typescript
// /src/app/api/admin/settings/business-profile/route.ts
export async function GET(request: Request) {
  // Get business profile
  // Check admin permissions
}

export async function PUT(request: Request) {
  // Update business profile
  // Encrypt sensitive data
  // Log changes to history
  // Invalidate caches
}

// /src/app/api/admin/settings/tax/route.ts
export async function GET(request: Request) {
  // Get tax configuration
}

export async function PUT(request: Request) {
  // Update tax configuration
  // Validate Malaysian tax formats
  // Update related calculations
}
```

### Security Implementation

#### Data Encryption
```typescript
import crypto from 'crypto';

class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static secretKey = process.env.ENCRYPTION_KEY!;

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('business-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('business-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### Audit Logging
```typescript
interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

class AuditLogger {
  static async logChange(entry: AuditLogEntry): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: {
          oldValues: entry.oldValues,
          newValues: entry.newValues,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent
        },
        createdAt: entry.timestamp
      }
    });
  }

  static async logBusinessProfileChange(
    userId: string,
    oldProfile: any,
    newProfile: any,
    request: Request
  ): Promise<void> {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await this.logChange({
      userId,
      action: 'UPDATE_BUSINESS_PROFILE',
      resource: 'business_profile',
      oldValues: oldProfile,
      newValues: newProfile,
      ipAddress: ip,
      userAgent,
      timestamp: new Date()
    });
  }
}
```

### Caching Strategy

#### Business Profile Caching
```typescript
import { Redis } from 'ioredis';

class BusinessProfileCache {
  private static redis = new Redis(process.env.REDIS_URL!);
  private static CACHE_KEY = 'business:profile';
  private static TTL = 3600; // 1 hour

  static async get(): Promise<BusinessProfile | null> {
    try {
      const cached = await this.redis.get(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(profile: BusinessProfile): Promise<void> {
    try {
      await this.redis.setex(
        this.CACHE_KEY,
        this.TTL,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(): Promise<void> {
    try {
      await this.redis.del(this.CACHE_KEY);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}
```

## Integration Points

### Business Profile Integration

#### Invoice Generation
```typescript
class InvoiceService {
  static async generateInvoice(orderId: string): Promise<string> {
    // Get business profile from cache or database
    let businessProfile = await BusinessProfileCache.get();
    if (!businessProfile) {
      businessProfile = await prisma.businessProfile.findFirst({
        where: { isActive: true }
      });
      if (businessProfile) {
        await BusinessProfileCache.set(businessProfile);
      }
    }

    if (!businessProfile) {
      throw new Error('Business profile not configured');
    }

    // Generate invoice with business profile data
    return this.createInvoicePDF(order, businessProfile);
  }
}
```

#### Shipping Label Integration
```typescript
class ShippingService {
  static async createShipmentLabel(orderId: string): Promise<string> {
    const businessProfile = await BusinessProfileCache.get();
    if (!businessProfile) {
      throw new Error('Business profile required for shipping');
    }

    const senderAddress = businessProfile.shippingAddress || 
                         businessProfile.operationalAddress || 
                         businessProfile.registeredAddress;

    // Create shipment with EasyParcel API using business profile
    return this.callEasyParcelAPI(order, senderAddress, businessProfile);
  }
}
```

### Tax Configuration Integration

#### Order Calculation
```typescript
class TaxCalculationService {
  static async calculateOrderTax(
    items: OrderItem[],
    customerState: string
  ): Promise<TaxCalculation> {
    const taxConfig = await prisma.taxConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!taxConfig || !taxConfig.autoCalculateTax) {
      return { totalTax: 0, itemTaxes: [] };
    }

    // Calculate tax based on configuration
    const calculations = items.map(item => {
      const applicableRate = this.getApplicableTaxRate(item, taxConfig);
      const taxAmount = taxConfig.taxInclusivePricing
        ? this.calculateInclusiveTax(item.price, applicableRate)
        : this.calculateExclusiveTax(item.price, applicableRate);

      return {
        itemId: item.id,
        taxRate: applicableRate,
        taxAmount,
        taxType: applicableRate > 6 ? 'SST' : 'GST'
      };
    });

    return {
      totalTax: calculations.reduce((sum, calc) => sum + calc.taxAmount, 0),
      itemTaxes: calculations
    };
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Database Schema Updates**
   - Create BusinessProfile and TaxConfiguration models
   - Add migration scripts
   - Set up audit logging tables

2. **Shared Components**
   - Create reusable settings UI components
   - Set up form validation schemas
   - Implement layout components

3. **Security Infrastructure**
   - Set up encryption service
   - Implement audit logging
   - Create caching layer

### Phase 2: Customer Settings (Week 3-4)
1. **Account Management**
   - Personal information forms
   - Password change functionality
   - Profile picture upload

2. **Address Management**
   - CRUD operations for addresses
   - Malaysian validation
   - Default address selection

3. **Privacy & Preferences**
   - Notification preferences
   - Privacy controls
   - Language settings

### Phase 3: Admin Settings Hub (Week 5-6)
1. **Settings Dashboard**
   - Configuration status overview
   - Quick navigation to existing pages
   - Recent changes display

2. **Business Profile Management**
   - Company information forms
   - Multi-address management
   - Banking information (encrypted)

3. **Tax Configuration**
   - GST/SST setup
   - Tax rate management
   - Integration with order calculations

### Phase 4: Superadmin & Integration (Week 7-8)
1. **Superadmin Controls**
   - Admin account management
   - System security controls
   - Activity monitoring

2. **Integration Testing**
   - Business profile in invoices
   - Tax calculations in orders
   - Shipping label integration

3. **Performance Optimization**
   - Caching implementation
   - Query optimization
   - Load testing

### Phase 5: Testing & Documentation (Week 9-10)
1. **Comprehensive Testing**
   - Unit tests for all components
   - Integration tests for APIs
   - End-to-end testing

2. **Security Auditing**
   - Penetration testing
   - Data encryption validation
   - Access control verification

3. **Documentation & Training**
   - User documentation
   - Admin training materials
   - Technical documentation

## Quality Assurance

### Testing Strategy

#### Unit Tests
```typescript
// Example: Business profile validation tests
describe('Business Profile Validation', () => {
  it('should validate SSM registration format', () => {
    const validSSM = '123456-X';
    const invalidSSM = '12345-XY';
    
    expect(validateSSMNumber(validSSM)).toBe(true);
    expect(validateSSMNumber(invalidSSM)).toBe(false);
  });

  it('should validate GST number format', () => {
    const validGST = 'C12345678901';
    const invalidGST = '12345678901';
    
    expect(validateGSTNumber(validGST)).toBe(true);
    expect(validateGSTNumber(invalidGST)).toBe(false);
  });
});
```

#### Integration Tests
```typescript
// Example: Business profile API tests
describe('Business Profile API', () => {
  it('should update business profile and log changes', async () => {
    const adminUser = await createTestAdminUser();
    const oldProfile = await getBusinessProfile();
    
    const updateData = {
      legalName: 'Updated Company Name',
      primaryEmail: 'new@company.com'
    };

    const response = await request(app)
      .put('/api/admin/settings/business-profile')
      .set('Authorization', `Bearer ${adminUser.token}`)
      .send(updateData)
      .expect(200);

    // Verify profile updated
    const newProfile = await getBusinessProfile();
    expect(newProfile.legalName).toBe(updateData.legalName);

    // Verify audit log created
    const auditLog = await getLatestAuditLog(adminUser.id);
    expect(auditLog.action).toBe('UPDATE_BUSINESS_PROFILE');
    expect(auditLog.details.oldValues.legalName).toBe(oldProfile.legalName);
    expect(auditLog.details.newValues.legalName).toBe(updateData.legalName);
  });
});
```

### Performance Requirements

#### Response Time Targets
- Settings page load: < 500ms
- Form submission: < 1000ms
- Business profile cache hit: < 50ms
- Tax calculation: < 200ms

#### Scalability Targets
- Support 1000+ concurrent users
- Handle 10,000+ settings updates per day
- Maintain performance with 100,000+ audit log entries

## Security Considerations

### Data Protection
1. **Encryption at Rest**: All sensitive business data encrypted
2. **Encryption in Transit**: HTTPS for all communications
3. **Access Control**: Role-based permissions strictly enforced
4. **Audit Trail**: Complete logging of all changes
5. **Data Validation**: Server-side validation for all inputs

### Compliance Requirements
1. **Malaysian PDPA**: Personal data protection compliance
2. **GST/SST Compliance**: Proper tax calculation and reporting
3. **Business Registration**: Valid SSM and GST number formats
4. **Data Retention**: Audit logs retained per legal requirements

## Maintenance & Support

### Monitoring
- Application performance monitoring
- Error tracking and alerting
- Audit log analysis
- Cache hit rate monitoring

### Backup & Recovery
- Daily database backups
- Business profile configuration backups
- Disaster recovery procedures
- Data integrity checks

### Future Enhancements
1. **Multi-language Support**: Full Malay translation
2. **Advanced Tax Rules**: Complex tax scenarios
3. **API Integrations**: Additional payment gateways
4. **Mobile App Settings**: Native mobile settings sync
5. **Advanced Analytics**: Settings usage analytics

---

This comprehensive implementation guide provides systematic, DRY approach following @CLAUDE.md principles for building a robust, secure, and scalable settings system for the EcomJRM platform.