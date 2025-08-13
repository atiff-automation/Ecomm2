# 🏗️ E-commerce Architecture Analysis & Refactoring Plan

## Executive Summary

This comprehensive analysis has identified **critical architecture issues** that violate fundamental software engineering principles. The codebase suffers from widespread DRY violations, business logic scattered across frontend components, and inconsistent data handling patterns that significantly impact maintainability, performance, and reliability.

**Severity: CRITICAL** - Immediate refactoring required to prevent technical debt escalation.

---

## 🔍 Critical Issues Identified

### 1. **CRITICAL: Pricing Logic Duplication** 
**Severity: Critical | Impact: 5+ components | Files: 8+**

**Problem:**
- Same pricing calculation logic duplicated across multiple frontend components
- Each component implements its own formatPrice function
- Promotional pricing rules scattered in frontend instead of centralized

**Affected Files:**
- `/src/app/page.tsx` - 57 lines of pricing logic
- `/src/app/products/page.tsx` - 45+ lines of pricing logic  
- `/src/app/products/[slug]/page.tsx` - 60+ lines of pricing logic
- `/src/components/pricing/PriceDisplay.tsx` - 180+ lines
- `/lib/utils.ts` - Contains `formatCurrency` and `formatMalaysianCurrency` but NOT used consistently

**Evidence:**
```typescript
// DUPLICATED in EVERY component:
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(price);
};

const priceInfo = getBestPrice(product, isMember);
const promotionStatus = calculatePromotionStatus(product);
// ... repeated 8+ times
```

**Impact:**
- **Maintenance**: Any pricing rule change requires updating 8+ files
- **Inconsistency**: Risk of different pricing displays across pages
- **Performance**: Repeated calculations on frontend
- **Testing**: Same logic tested in multiple places

---

### 2. **CRITICAL: Session Management Duplication**
**Severity: Critical | Impact: 34+ components**

**Problem:**
- Every component that needs user data implements its own session handling
- Authentication checks scattered across components
- Member status validation duplicated everywhere

**Evidence:**
```typescript
// DUPLICATED in 34+ files:
const { data: session } = useSession();
const isLoggedIn = !!session?.user;
const isMember = session?.user?.isMember || false;
```

**Affected Files:** 34+ components including all product pages, cart, wishlist, etc.

---

### 3. **HIGH: Business Logic in Frontend**
**Severity: High | Impact: Architecture-wide**

**Problems Identified:**

#### 3.1 Promotional Logic in Frontend
- `getBestPrice()`, `calculatePromotionStatus()` called in React components
- Business rules should be in backend/services, not frontend

#### 3.2 Stock Calculations 
- Inventory availability checks in frontend components
- Should be server-side with real-time updates

#### 3.3 Member Eligibility Logic
- Membership validation scattered across components
- Business rules mixed with presentation logic

---

### 4. **HIGH: API Call Duplication**
**Severity: High | Impact: 57+ files | Performance Impact**

**Problem:**
- Same API endpoints called with identical patterns across components
- No centralized API client or service layer
- 118+ `fetch()` calls found across 57 files

**Pattern:**
```typescript
// DUPLICATED everywhere:
const response = await fetch('/api/products?featured=true');
const data = await response.json();
// No error handling standardization
// No loading state management
// No caching strategy
```

---

### 5. **MEDIUM: Inconsistent Data Structures**

#### 5.1 Product Interface Variations
- Different product interfaces across components
- Homepage vs Products page vs Admin have different fields
- No single source of truth for product data structure

#### 5.2 Currency Formatting Inconsistency
- `formatCurrency()` exists in `/lib/utils.ts` but NOT used
- Every component reimplements currency formatting
- Two different currency utilities: `formatCurrency` and `formatMalaysianCurrency`

---

### 6. **MEDIUM: Component Responsibility Violations**

**Problems:**
- Components doing multiple responsibilities (fetching data + rendering + business logic)
- No separation of concerns
- Tight coupling between components and business logic

---

## 📊 Impact Assessment

| Issue Category | Files Affected | Severity | Maintenance Cost | Risk Level |
|---------------|----------------|----------|------------------|------------|
| Pricing Logic | 8+ | Critical | Very High | Critical |
| Session Management | 34+ | Critical | High | High |
| Business Logic | 20+ | High | High | High |
| API Calls | 57+ | High | Medium | Medium |
| Data Structures | 15+ | Medium | Medium | Medium |

---

## 🏗️ Recommended Architecture

### Phase 1: Service Layer Implementation

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Presentation)              │
│  - Components only handle rendering                     │
│  - No business logic                                    │
│  - Use standardized hooks/services                      │
└─────────────────────────────────────────────────────────┘
                               ↕️
┌─────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                         │
│  - PricingService                                       │
│  - AuthService                                          │
│  - ProductService                                       │
│  - APIClient                                            │
└─────────────────────────────────────────────────────────┘
                               ↕️
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                            │
│  - Enhanced API endpoints                               │
│  - Business logic implementation                        │
│  - Data transformation                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Detailed Refactoring Plan

### **Phase 1: Critical Fixes (Week 1-2)**

#### 1.1 Create Centralized Pricing Service
**Priority: Critical**

**Files to Create:**
- `/src/lib/services/pricing-service.ts`
- `/src/lib/types/pricing.ts`
- `/src/hooks/use-pricing.ts`

**Implementation:**
```typescript
// /src/lib/services/pricing-service.ts
export interface ProductPricing {
  effectivePrice: number;
  originalPrice?: number;
  priceType: 'regular' | 'promotional' | 'member' | 'early-access';
  savings: number;
  savingsPercentage: number;
  badges: PricingBadge[];
  displayClasses: {
    priceColor: string;
    badgeVariant: string;
  };
  formattedPrice: string;
  formattedOriginalPrice?: string;
  formattedSavings?: string;
}

export class PricingService {
  static calculateProductPricing(product: Product, userContext: UserContext): ProductPricing
  static formatPrice(amount: number): string
  static calculateSavings(original: number, effective: number): number
}
```

**Files to Refactor:**
- `/src/app/page.tsx` - Remove 57 lines of pricing logic
- `/src/app/products/page.tsx` - Remove 45+ lines of pricing logic
- `/src/app/products/[slug]/page.tsx` - Remove 60+ lines of pricing logic
- All components using pricing → Use `usePricing(product)` hook

#### 1.2 Create Auth Context Service
**Priority: Critical**

**Files to Create:**
- `/src/lib/context/auth-context.tsx`
- `/src/hooks/use-auth.ts`

**Implementation:**
```typescript
export interface AuthContext {
  user: User | null;
  isLoggedIn: boolean;
  isMember: boolean;
  loading: boolean;
}

export const useAuth = () => useContext(AuthContext);
```

**Impact:** Remove session duplication from 34+ files

### **Phase 2: Service Layer (Week 3-4)**

#### 2.1 API Client Service
```typescript
// /src/lib/services/api-client.ts
export class APIClient {
  static async fetchProducts(params: ProductQuery): Promise<ProductResponse>
  static async fetchProduct(slug: string): Promise<Product>
  static async updateCart(action: CartAction): Promise<CartResponse>
}
```

#### 2.2 Product Service
```typescript
// /src/lib/services/product-service.ts
export class ProductService {
  static async getFeaturedProducts(): Promise<Product[]>
  static async getProductRecommendations(productId: string): Promise<Product[]>
  static async getRecentlyViewed(userId: string): Promise<Product[]>
}
```

### **Phase 3: API Enhancement (Week 5-6)**

#### 3.1 Enhanced API Endpoints
- Modify API routes to return pre-calculated pricing
- Move business logic from frontend to API handlers
- Implement caching strategy

#### 3.2 Data Structure Standardization
- Create unified `Product` interface
- Standardize API response formats
- Implement proper TypeScript types

### **Phase 4: Component Cleanup (Week 7-8)**

#### 4.1 Component Refactoring
- Remove business logic from components
- Implement proper separation of concerns
- Use standardized hooks and services

#### 4.2 Performance Optimization
- Implement proper caching
- Reduce bundle size
- Optimize API calls

---

## 🎯 Implementation Priority

### Critical (Immediate - Week 1-2)
1. ✅ Centralized Pricing Service
2. ✅ Auth Context Service  
3. ✅ Remove pricing logic from components

### High (Week 3-4)
1. ✅ API Client Service
2. ✅ Product Service Layer
3. ✅ Component responsibility cleanup

### Medium (Week 5-6)
1. ✅ API endpoint enhancement
2. ✅ Data structure standardization
3. ✅ Caching implementation

### Low (Week 7-8)
1. ✅ Performance optimization
2. ✅ Documentation updates
3. ✅ Testing improvements

---

## 📈 Expected Benefits

### Code Quality
- **90% reduction** in code duplication
- **Single source of truth** for business logic
- **Improved maintainability** and testability

### Performance
- **Reduced bundle size** (less duplicated code)
- **Better caching** strategies
- **Fewer API calls** through service layer

### Developer Experience
- **Easier feature additions**
- **Consistent patterns** across codebase
- **Better debugging** capabilities

### Business Impact
- **Faster feature delivery**
- **Reduced bug risk**
- **Better scalability**

---

## 🚨 Risk Assessment

### Refactoring Risks
- **High**: Potential for introducing bugs during refactoring
- **Medium**: Temporary development slowdown during transition
- **Low**: Learning curve for new architecture patterns

### Mitigation Strategies
1. **Phased Implementation**: Gradual migration with parallel systems
2. **Comprehensive Testing**: Unit and integration tests for each phase
3. **Feature Flags**: Ability to rollback if issues arise
4. **Code Reviews**: Thorough review of architectural changes

---

## 📝 Next Steps

1. **Immediate**: Create centralized pricing service
2. **This Week**: Implement auth context service
3. **Next Week**: Begin API client implementation
4. **Month 2**: Complete service layer migration

---

## 📖 Standards & Guidelines

### Code Standards
- All business logic must be in service layer
- Components are purely presentational
- No direct API calls in components
- Standardized error handling
- Consistent TypeScript interfaces

### Testing Requirements
- Unit tests for all services
- Integration tests for API endpoints
- Component tests for presentation logic
- E2E tests for critical user flows

---

**Document Version:** 1.0  
**Last Updated:** $(date)  
**Author:** Architecture Team  
**Review Required:** Lead Developer, Product Owner