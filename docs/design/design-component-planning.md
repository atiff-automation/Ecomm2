# JRM E-commerce - Design Component Planning

## Overview
Comprehensive design component planning document outlining the component architecture, design system integration, and implementation strategy for the Malaysian e-commerce platform with membership system.

## Component Architecture Strategy

### 1. Design System Hierarchy

#### Foundation Layer (Atomic Design)
```
Foundation (Design Tokens)
├── Colors (Malaysian Market Optimized)
├── Typography (Multilingual Support)
├── Spacing (Touch-Friendly)
├── Border Radius (Modern)
└── Shadows (Subtle Depth)

Atoms (Base Components)
├── Button
├── Input
├── Label
├── Icon
├── Avatar
└── Badge

Molecules (Composite Components)
├── SearchBar
├── PriceDisplay
├── RatingStars
├── ProductCard
├── FormField
└── NavigationItem

Organisms (Complex Components)
├── Header
├── ProductGrid
├── ShoppingCart
├── CheckoutFlow
├── MemberDashboard
└── Footer

Templates (Layout Patterns)
├── ProductListingPage
├── ProductDetailPage
├── CheckoutPage
├── DashboardPage
└── LandingPage

Pages (Complete Views)
├── Homepage
├── ProductPage
├── CartPage
├── MemberArea
└── AdminDashboard
```

### 2. Component Development Priorities

#### Phase 1: Core Commerce Components (High Priority)
```json
{
  "coreComponents": [
    {
      "name": "ProductCard",
      "priority": "critical",
      "complexity": "medium",
      "dependencies": ["PriceDisplay", "RatingStars", "Button"],
      "malaysianFeatures": [
        "Dual pricing display (regular/member)",
        "RM currency formatting",
        "Malaysian product categories",
        "Local trust badges"
      ],
      "estimatedHours": 12
    },
    {
      "name": "PriceDisplay",
      "priority": "critical",
      "complexity": "low",
      "dependencies": ["Badge", "Icon"],
      "malaysianFeatures": [
        "RM currency symbol",
        "Member pricing calculation",
        "Savings percentage display",
        "Cultural color coding"
      ],
      "estimatedHours": 6
    },
    {
      "name": "ShoppingCart",
      "priority": "critical",
      "complexity": "high",
      "dependencies": ["ProductCard", "Button", "Input"],
      "malaysianFeatures": [
        "Membership qualification tracker",
        "Local payment method icons",
        "Delivery cost calculator",
        "Malaysian address validation"
      ],
      "estimatedHours": 20
    },
    {
      "name": "Header",
      "priority": "critical",
      "complexity": "high",
      "dependencies": ["SearchBar", "NavigationMenu", "UserMenu"],
      "malaysianFeatures": [
        "Language switcher (EN/MS)",
        "Malaysian business logo",
        "Local customer service number",
        "Mobile-first navigation"
      ],
      "estimatedHours": 16
    }
  ]
}
```

#### Phase 2: Enhanced Experience Components (Medium Priority)
```json
{
  "enhancedComponents": [
    {
      "name": "MembershipProgress",
      "priority": "high",
      "complexity": "medium",
      "dependencies": ["ProgressBar", "Button", "Badge"],
      "malaysianFeatures": [
        "RM80 threshold visualization",
        "Savings calculator",
        "Cultural motivational messaging",
        "Mobile-optimized progress display"
      ],
      "estimatedHours": 10
    },
    {
      "name": "PaymentMethodSelector",
      "priority": "high",
      "complexity": "medium",
      "dependencies": ["RadioGroup", "Icon", "Image"],
      "malaysianFeatures": [
        "Malaysian bank logos",
        "E-wallet integration (TNG, Boost)",
        "Online banking prioritization",
        "Trust signals for security"
      ],
      "estimatedHours": 14
    },
    {
      "name": "AddressForm",
      "priority": "high",
      "complexity": "medium",
      "dependencies": ["Input", "Select", "Validation"],
      "malaysianFeatures": [
        "Malaysian state dropdown",
        "Postcode validation (5-digit)",
        "Address format guidelines",
        "Delivery zone detection"
      ],
      "estimatedHours": 12
    }
  ]
}
```

#### Phase 3: Specialized Components (Lower Priority)
```json
{
  "specializedComponents": [
    {
      "name": "CulturalBanner",
      "priority": "medium",
      "complexity": "low",
      "dependencies": ["Image", "Text", "Button"],
      "malaysianFeatures": [
        "Festival-specific designs",
        "Cultural color schemes",
        "Seasonal promotions",
        "Localized messaging"
      ],
      "estimatedHours": 8
    },
    {
      "name": "ReviewSystem",
      "priority": "medium",
      "complexity": "high",
      "dependencies": ["StarRating", "Avatar", "Text", "Modal"],
      "malaysianFeatures": [
        "Malaysian name display",
        "Verified purchase badges",
        "Bilingual review support",
        "Cultural appropriateness filters"
      ],
      "estimatedHours": 18
    }
  ]
}
```

---

## Component Design Specifications

### 1. Core Component Designs

#### ProductCard Component
```typescript
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    regularPrice: number;
    memberPrice: number;
    image: string;
    images?: string[];
    rating: number;
    reviewCount: number;
    brand: string;
    category: string;
    isPromotional?: boolean;
    isMemberExclusive?: boolean;
    inStock: boolean;
    stockLevel?: number;
    tags?: string[];
  };
  user?: {
    isMember: boolean;
    memberLevel?: 'bronze' | 'silver' | 'gold';
  };
  variant?: 'default' | 'compact' | 'featured' | 'list';
  showMemberPrice?: boolean;
  showWishlist?: boolean;
  showCompare?: boolean;
  malaysianContext?: {
    showLocalDelivery: boolean;
    showMalaysianWarranty: boolean;
    displayLanguage: 'en' | 'ms' | 'both';
  };
}
```

#### Design Variants
```jsx
// Default Card (Mobile-first)
const DefaultProductCard = ({ product, user, malaysianContext }) => (
  <Card className="product-card-default w-full max-w-[180px]">
    <CardHeader className="p-0 relative">
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <Image
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full hover:scale-105 transition-transform"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isMemberExclusive && (
            <Badge variant="member" className="text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Member Only
            </Badge>
          )}
          {product.isPromotional && (
            <Badge variant="destructive" className="text-xs">
              Sale
            </Badge>
          )}
        </div>
        
        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
        >
          <Heart className="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
    
    <CardContent className="p-3">
      {/* Brand */}
      <div className="text-xs text-muted-foreground mb-1">
        {product.brand}
      </div>
      
      {/* Product Name */}
      <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
        {product.name}
      </h3>
      
      {/* Rating */}
      <div className="flex items-center gap-1 mb-2">
        <StarRating rating={product.rating} size="xs" />
        <span className="text-xs text-muted-foreground">
          ({product.reviewCount})
        </span>
      </div>
      
      {/* Pricing */}
      <div className="space-y-1">
        <MalaysianPriceDisplay
          regularPrice={product.regularPrice}
          memberPrice={product.memberPrice}
          showMemberPrice={user?.isMember || false}
          size="sm"
        />
      </div>
      
      {/* Stock Status */}
      {product.stockLevel && product.stockLevel <= 10 && (
        <div className="text-xs text-orange-600 mt-1">
          Only {product.stockLevel} left!
        </div>
      )}
    </CardContent>
    
    <CardFooter className="p-3 pt-0">
      <Button
        className="w-full h-8 text-xs"
        disabled={!product.inStock}
        variant={product.inStock ? "default" : "secondary"}
      >
        {product.inStock ? "Add to Cart" : "Out of Stock"}
      </Button>
    </CardFooter>
  </Card>
);

// Featured Card (Homepage Hero)
const FeaturedProductCard = ({ product, user }) => (
  <Card className="product-card-featured w-full max-w-[300px]">
    <CardHeader className="p-0 relative">
      <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
        <Image
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full"
          priority
        />
        
        {/* Featured Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
        
        {/* Savings Badge */}
        {user?.isMember && (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="text-sm font-bold">
              Save RM {(product.regularPrice - product.memberPrice).toFixed(2)}
            </Badge>
          </div>
        )}
      </div>
    </CardHeader>
    
    <CardContent className="p-6">
      <div className="text-sm text-muted-foreground mb-2">
        {product.brand} • {product.category}
      </div>
      
      <h2 className="text-xl font-bold mb-3 line-clamp-2">
        {product.name}
      </h2>
      
      <div className="flex items-center gap-2 mb-4">
        <StarRating rating={product.rating} size="sm" />
        <span className="text-sm text-muted-foreground">
          ({product.reviewCount} reviews)
        </span>
      </div>
      
      <MalaysianPriceDisplay
        regularPrice={product.regularPrice}
        memberPrice={product.memberPrice}
        showMemberPrice={user?.isMember || false}
        size="lg"
        showSavings={true}
      />
    </CardContent>
    
    <CardFooter className="p-6 pt-0 flex gap-3">
      <Button className="flex-1" size="lg">
        Add to Cart
      </Button>
      <Button variant="outline" size="lg">
        <Heart className="w-4 h-4" />
      </Button>
    </CardFooter>
  </Card>
);
```

#### MalaysianPriceDisplay Component
```jsx
const MalaysianPriceDisplay = ({
  regularPrice,
  memberPrice,
  showMemberPrice = false,
  size = 'md',
  showSavings = false,
  layout = 'vertical'
}) => {
  const savings = regularPrice - memberPrice;
  const savingsPercentage = Math.round((savings / regularPrice) * 100);
  
  const sizeStyles = {
    sm: {
      regular: 'text-sm',
      member: 'text-base font-semibold',
      savings: 'text-xs'
    },
    md: {
      regular: 'text-base',
      member: 'text-lg font-semibold',
      savings: 'text-sm'
    },
    lg: {
      regular: 'text-lg',
      member: 'text-2xl font-bold',
      savings: 'text-base'
    }
  };
  
  const styles = sizeStyles[size];
  
  return (
    <div className={cn(
      "malaysian-price-display",
      layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'
    )}>
      {/* Regular Price */}
      <div className={cn(
        "price-regular line-through text-muted-foreground",
        styles.regular
      )}>
        RM {formatMalaysianCurrency(regularPrice)}
      </div>
      
      {/* Member Price */}
      {showMemberPrice && (
        <div className={cn(
          "price-member text-success",
          styles.member
        )}>
          RM {formatMalaysianCurrency(memberPrice)}
        </div>
      )}
      
      {/* Savings Display */}
      {showMemberPrice && showSavings && savings > 0 && (
        <div className={cn(
          "price-savings text-destructive font-medium",
          styles.savings
        )}>
          Save RM {formatMalaysianCurrency(savings)} ({savingsPercentage}%)
        </div>
      )}
      
      {/* Member CTA (when not member) */}
      {!showMemberPrice && (
        <div className="member-price-cta">
          <span className={cn("text-member", styles.savings)}>
            RM {formatMalaysianCurrency(memberPrice)} for members
          </span>
          <Button variant="link" className="p-0 h-auto text-xs text-member">
            Join now →
          </Button>
        </div>
      )}
    </div>
  );
};
```

### 2. Malaysian-Specific Component Features

#### CulturalAdaptationWrapper
```jsx
const CulturalAdaptationWrapper = ({ 
  children, 
  culturalContext,
  user 
}) => {
  const [currentFestival, setCurrentFestival] = useState(null);
  const [colorScheme, setColorScheme] = useState('default');
  
  useEffect(() => {
    const festival = getCurrentMalaysianFestival();
    if (festival) {
      setCurrentFestival(festival);
      setColorScheme(festival.colorScheme);
    }
  }, []);
  
  return (
    <div className={cn(
      "cultural-wrapper",
      colorScheme !== 'default' && `festival-${colorScheme}`,
      culturalContext?.region && `region-${culturalContext.region}`
    )}>
      {/* Festival Banner */}
      {currentFestival && (
        <FestivalBanner
          festival={currentFestival}
          user={user}
          dismissible={true}
        />
      )}
      
      {/* Cultural Color Scheme */}
      <style jsx>{`
        .festival-chinese-new-year {
          --festival-primary: #dc2626;
          --festival-secondary: #eab308;
        }
        .festival-hari-raya {
          --festival-primary: #059669;
          --festival-secondary: #eab308;
        }
        .festival-deepavali {
          --festival-primary: #ea580c;
          --festival-secondary: #eab308;
        }
      `}</style>
      
      {children}
    </div>
  );
};
```

#### MalaysianAddressForm Component
```jsx
const MalaysianAddressForm = ({ form, onValidation }) => {
  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan',
    'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak',
    'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ];
  
  const validatePostcode = (postcode, state) => {
    const postcodeRanges = {
      'Kuala Lumpur': /^(5|6)\d{4}$/,
      'Selangor': /^(4|6)\d{4}$/,
      'Johor': /^(7|8)\d{4}$/,
      // ... other state patterns
    };
    
    const pattern = postcodeRanges[state];
    return pattern ? pattern.test(postcode) : /^\d{5}$/.test(postcode);
  };
  
  return (
    <div className="malaysian-address-form space-y-4">
      {/* Full Name */}
      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name *</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Ahmad bin Abdullah"
                className="h-12 text-base" // Prevent zoom on iOS
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Phone Number */}
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number *</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="tel"
                placeholder="01X-XXX XXXX"
                pattern="01[0-9]-[0-9]{3} [0-9]{4}"
                className="h-12 text-base"
              />
            </FormControl>
            <FormDescription>
              Malaysian mobile number format (e.g., 012-345 6789)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Address Lines */}
      <FormField
        control={form.control}
        name="addressLine1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 1 *</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="No. 123, Jalan ABC"
                className="h-12 text-base"
              />
            </FormControl>
            <FormDescription>
              House/unit number and street name
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="addressLine2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 2</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Taman DEF (Optional)"
                className="h-12 text-base"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* City, State, Postcode Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Kuala Lumpur"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="50000"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="h-12 text-base"
                  onChange={(e) => {
                    field.onChange(e);
                    const state = form.getValues('state');
                    if (state && e.target.value.length === 5) {
                      const isValid = validatePostcode(e.target.value, state);
                      onValidation?.(isValid);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                5-digit Malaysian postcode
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {malaysianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Address Type */}
      <FormField
        control={form.control}
        name="addressType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home">Home</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="office" id="office" />
                  <Label htmlFor="office">Office</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
```

---

## Component Testing Strategy

### 1. Testing Framework
```javascript
// Component testing setup
const testingConfig = {
  frameworks: [
    'Jest', // Unit testing
    'React Testing Library', // Component testing
    'Storybook', // Visual testing
    'Playwright', // E2E testing
  ],
  
  malaysianContextTests: [
    'Currency formatting (RM)',
    'Language switching (EN/MS)',
    'Address validation (Malaysian format)',
    'Payment method display',
    'Cultural appropriateness'
  ],
  
  accessibilityTests: [
    'WCAG 2.1 AA compliance',
    'Screen reader compatibility',
    'Keyboard navigation',
    'High contrast mode',
    'Mobile touch targets'
  ],
  
  performanceTests: [
    'Component render time',
    'Bundle size impact',
    'Mobile performance',
    'Image loading optimization'
  ]
};
```

### 2. Component Documentation Standards
```markdown
# Component Documentation Template

## ComponentName
Brief description of the component's purpose and use case.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description |

### Malaysian Features
- Feature 1: Description
- Feature 2: Description

### Usage Examples
```jsx
// Basic usage
<ComponentName prop1="value" />

// Malaysian context
<ComponentName 
  malaysianContext={{
    currency: 'RM',
    language: 'en'
  }}
/>
```

### Accessibility
- Screen reader support: Yes/No
- Keyboard navigation: Supported keys
- High contrast: Compatible

### Testing
- Unit tests: Covered scenarios
- Integration tests: E2E flows
- Visual tests: Storybook stories
```

---

## Implementation Timeline

### Week 1: Foundation Components
- Design tokens setup
- Base atomic components (Button, Input, etc.)
- Typography system
- Color palette implementation

### Week 2: Core Commerce Components
- ProductCard variations
- PriceDisplay component
- Shopping cart components
- Basic form components

### Week 3: Malaysian-Specific Features
- Address form components
- Payment method selectors  
- Cultural adaptation wrappers
- Language switching components

### Week 4: Advanced Components & Testing
- Member dashboard components
- Admin interface components
- Comprehensive testing suite
- Documentation completion

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Phase 0 Week -2 Implementation*