# JRM E-commerce - Component Library Specifications

## Overview
Extended component library built on shadcn/ui foundation, specifically designed for Malaysian e-commerce platform with membership system and dual pricing.

## Design System Foundation

### Color Palette (Malaysian Market Optimized)

```css
:root {
  /* Primary Colors - Trust and Malaysian Heritage */
  --primary: 220 98% 51%;      /* Royal Blue #0066ff */
  --primary-foreground: 0 0% 98%;
  
  /* Secondary Colors - Malaysian Flag Inspired */
  --secondary: 0 84% 60%;      /* Red #dc2626 */
  --secondary-foreground: 0 0% 98%;
  
  /* Success/Money Colors */
  --success: 142 76% 36%;      /* Malaysian Green #059669 */
  --success-foreground: 0 0% 98%;
  
  /* Member Colors */
  --member: 45 93% 47%;        /* Gold #eab308 */
  --member-foreground: 0 0% 9%;
  
  /* Malaysian Cultural Colors */
  --heritage-red: 0 100% 50%;  /* Malaysian flag red */
  --heritage-blue: 240 100% 27%; /* Malaysian flag blue */
  --heritage-yellow: 51 100% 50%; /* Malaysian flag yellow */
  
  /* Trust Building Colors */
  --trust: 213 94% 68%;        /* Light blue for security */
  --savings: 84 81% 44%;       /* Green for savings */
  --urgent: 0 84% 60%;         /* Red for urgency */
  
  /* Semantic Colors */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
}
```

### Typography Scale

```css
.font-malay {
  font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif;
  font-feature-settings: "kern" 1, "liga" 1;
}

/* Pricing Typography */
.price-regular {
  font-size: 1rem;
  font-weight: 400;
  text-decoration: line-through;
  color: hsl(var(--muted-foreground));
}

.price-member {
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--savings));
}

.price-savings {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--secondary));
}
```

---

## Core E-commerce Components

### 1. Product Card Component

#### Basic Product Card
```typescript
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    regularPrice: number;
    memberPrice: number;
    image: string;
    rating: number;
    reviewCount: number;
    isPromotional?: boolean;
    isMemberExclusive?: boolean;
    inStock: boolean;
  };
  showMemberPrice?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'featured';
}
```

#### Component Structure
```jsx
<Card className="product-card">
  <CardHeader className="p-0">
    <div className="relative">
      <Image src={product.image} alt={product.name} />
      {/* Badges */}
      {product.isMemberExclusive && (
        <Badge className="absolute top-2 left-2" variant="member">
          Member Only
        </Badge>
      )}
      {product.isPromotional && (
        <Badge className="absolute top-2 right-2" variant="secondary">
          Sale
        </Badge>
      )}
      {/* Wishlist Button */}
      <Button 
        className="absolute top-2 right-2" 
        variant="ghost" 
        size="icon"
      >
        <Heart className="h-4 w-4" />
      </Button>
    </div>
  </CardHeader>
  
  <CardContent className="p-4">
    <CardTitle className="text-sm line-clamp-2">
      {product.name}
    </CardTitle>
    
    {/* Rating */}
    <div className="flex items-center gap-1 mt-2">
      <StarRating rating={product.rating} />
      <span className="text-xs text-muted-foreground">
        ({product.reviewCount})
      </span>
    </div>
    
    {/* Pricing */}
    <div className="mt-3">
      <PricingDisplay 
        regularPrice={product.regularPrice}
        memberPrice={product.memberPrice}
        showMemberPrice={showMemberPrice}
      />
    </div>
  </CardContent>
  
  <CardFooter className="p-4 pt-0">
    <Button 
      className="w-full" 
      disabled={!product.inStock}
    >
      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
    </Button>
  </CardFooter>
</Card>
```

### 2. Pricing Display Component

```typescript
interface PricingDisplayProps {
  regularPrice: number;
  memberPrice: number;
  showMemberPrice?: boolean;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  showSavings?: boolean;
}
```

```jsx
const PricingDisplay = ({ 
  regularPrice, 
  memberPrice, 
  showMemberPrice = false,
  size = 'md',
  layout = 'vertical',
  showSavings = true 
}) => {
  const savings = regularPrice - memberPrice;
  const savingsPercentage = Math.round((savings / regularPrice) * 100);
  
  return (
    <div className={cn("pricing-display", layout)}>
      {/* Regular Price */}
      <div className={cn("price-regular", sizeClasses[size])}>
        RM {formatCurrency(regularPrice)}
      </div>
      
      {/* Member Price */}
      {showMemberPrice && (
        <div className={cn("price-member", sizeClasses[size])}>
          RM {formatCurrency(memberPrice)}
        </div>
      )}
      
      {/* Savings */}
      {showMemberPrice && showSavings && savings > 0 && (
        <div className="price-savings">
          Save RM {formatCurrency(savings)} ({savingsPercentage}%)
        </div>
      )}
      
      {/* Member CTA */}
      {!showMemberPrice && (
        <div className="member-cta">
          <span className="text-member">
            RM {formatCurrency(memberPrice)} for members
          </span>
        </div>
      )}
    </div>
  );
};
```

### 3. Shopping Cart Components

#### Cart Item Component
```typescript
interface CartItemProps {
  item: {
    id: string;
    productId: string;
    name: string;
    image: string;
    regularPrice: number;
    memberPrice: number;
    quantity: number;
    isPromotional: boolean;
  };
  isMember: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}
```

```jsx
const CartItem = ({ item, isMember, onUpdateQuantity, onRemove }) => {
  const appliedPrice = isMember && !item.isPromotional 
    ? item.memberPrice 
    : item.regularPrice;
  const savings = isMember && !item.isPromotional 
    ? (item.regularPrice - item.memberPrice) * item.quantity 
    : 0;

  return (
    <Card className="cart-item">
      <CardContent className="flex gap-4 p-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <Image
            src={item.image}
            alt={item.name}
            className="w-16 h-16 rounded-md object-cover"
          />
        </div>
        
        {/* Product Details */}
        <div className="flex-1">
          <h4 className="font-medium text-sm line-clamp-2">
            {item.name}
          </h4>
          
          {/* Pricing */}
          <div className="mt-2">
            <PricingDisplay
              regularPrice={item.regularPrice}
              memberPrice={item.memberPrice}
              showMemberPrice={isMember}
              size="sm"
              layout="horizontal"
            />
          </div>
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <span className="w-8 text-center text-sm">
              {item.quantity}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Actions & Price */}
        <div className="flex flex-col items-end justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onRemove(item.productId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="text-right">
            <div className="font-semibold">
              RM {formatCurrency(appliedPrice * item.quantity)}
            </div>
            {savings > 0 && (
              <div className="text-xs text-savings">
                Save RM {formatCurrency(savings)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Membership Progress Component
```typescript
interface MembershipProgressProps {
  currentTotal: number;
  threshold: number;
  qualifyingItems: number;
  totalItems: number;
}
```

```jsx
const MembershipProgress = ({ 
  currentTotal, 
  threshold, 
  qualifyingItems, 
  totalItems 
}) => {
  const progress = Math.min((currentTotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - currentTotal, 0);
  const isQualified = currentTotal >= threshold;

  return (
    <Card className="membership-progress">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-member" />
          <h3 className="font-semibold">Membership Qualification</h3>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>RM {formatCurrency(currentTotal)} of RM {formatCurrency(threshold)}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Status Message */}
        <div className="mt-3">
          {isQualified ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Congratulations! You qualify for membership!
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Add RM {formatCurrency(remaining)} more from qualifying items to become a member
            </div>
          )}
        </div>
        
        {/* Qualifying Items Info */}
        <div className="mt-2 text-xs text-muted-foreground">
          {qualifyingItems} of {totalItems} items qualify for membership
        </div>
      </CardContent>
    </Card>
  );
};
```

### 4. Trust Signal Components

#### Security Badge Component
```jsx
const SecurityBadge = ({ type = 'ssl' }) => {
  const badges = {
    ssl: {
      icon: Shield,
      text: 'SSL Secured',
      color: 'text-trust'
    },
    payment: {
      icon: CreditCard,
      text: 'Secure Payment',
      color: 'text-success'
    },
    guarantee: {
      icon: CheckCircle,
      text: '100% Money Back',
      color: 'text-member'
    }
  };
  
  const badge = badges[type];
  const Icon = badge.icon;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={`h-4 w-4 ${badge.color}`} />
      <span className="font-medium">{badge.text}</span>
    </div>
  );
};
```

#### Malaysian Payment Methods
```jsx
const PaymentMethods = () => {
  const methods = [
    { name: 'Billplz', logo: '/images/payment/billplz.png' },
    { name: 'Maybank', logo: '/images/payment/maybank.png' },
    { name: 'CIMB', logo: '/images/payment/cimb.png' },
    { name: 'Touch n Go', logo: '/images/payment/tng.png' },
    { name: 'Boost', logo: '/images/payment/boost.png' }
  ];
  
  return (
    <div className="payment-methods">
      <div className="text-xs text-muted-foreground mb-2">
        Accepted Payment Methods:
      </div>
      <div className="flex gap-2 flex-wrap">
        {methods.map((method) => (
          <img
            key={method.name}
            src={method.logo}
            alt={method.name}
            className="h-6 opacity-70 hover:opacity-100 transition-opacity"
          />
        ))}
      </div>
    </div>
  );
};
```

### 5. Form Components (Malaysian Specific)

#### Malaysian Address Form
```jsx
const MalaysianAddressForm = ({ form }) => {
  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan',
    'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak',
    'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ];

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input placeholder="Ahmad bin Abdullah" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input 
                placeholder="01X-XXX XXXX" 
                pattern="01[0-9]-[0-9]{3} [0-9]{4}"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="addressLine1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 1</FormLabel>
            <FormControl>
              <Input placeholder="No. 123, Jalan ABC" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="addressLine2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 2 (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="Taman DEF" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Kuala Lumpur" {...field} />
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
              <FormLabel>Postcode</FormLabel>
              <FormControl>
                <Input 
                  placeholder="50000" 
                  pattern="[0-9]{5}"
                  maxLength={5}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
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
  );
};
```

### 6. Review & Rating Components

#### Star Rating Component
```jsx
const StarRating = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 'sm',
  interactive = false,
  onRatingChange 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        
        return (
          <Star
            key={index}
            className={cn(
              sizeClasses[size],
              isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300',
              interactive && 'cursor-pointer hover:text-yellow-400'
            )}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onRatingChange?.(starValue)}
          />
        );
      })}
      {rating > 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};
```

### 7. Admin Dashboard Components

#### Metric Card Component
```jsx
const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  format = 'number' 
}) => {
  const formatValue = (val) => {
    if (format === 'currency') return `RM ${formatCurrency(val)}`;
    if (format === 'percentage') return `${val}%`;
    return val.toLocaleString();
  };
  
  const changeColor = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold mt-2">
              {formatValue(value)}
            </p>
            {change && (
              <p className={cn("text-sm flex items-center gap-1 mt-1", changeColor[changeType])}>
                {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
                {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
                {Math.abs(change)}% from last month
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## Utility Components

### 1. Currency Display
```jsx
const CurrencyDisplay = ({ 
  amount, 
  size = 'md',
  showCurrency = true,
  className 
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  return (
    <span className={cn(sizeClasses[size], className)}>
      {showCurrency && 'RM '}
      {formatMalaysianCurrency(amount)}
    </span>
  );
};
```

### 2. Loading States
```jsx
const ProductCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="p-0">
      <Skeleton className="aspect-square rounded-t-lg" />
    </CardHeader>
    <CardContent className="p-4">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-6 w-full" />
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);
```

### 3. Empty States
```jsx
const EmptyCart = () => (
  <div className="text-center py-12">
    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
    <p className="text-muted-foreground mb-6">
      Add some products to get started
    </p>
    <Button asChild>
      <Link href="/products">Browse Products</Link>
    </Button>
  </div>
);
```

---

## Component Usage Guidelines

### 1. Accessibility Requirements
- All interactive elements must have proper ARIA labels
- Color should not be the only indicator of state/meaning
- Minimum 44px touch targets for mobile
- Proper heading hierarchy (h1 → h2 → h3)
- Descriptive alt text for all images

### 2. Performance Guidelines
- Use React.memo for expensive components
- Implement lazy loading for below-fold content
- Optimize images with next/image
- Use Suspense boundaries for loading states

### 3. Malaysian Market Guidelines
- Always use RM currency format
- Support both English and Bahasa Malaysia
- Include local trust signals and payment methods
- Consider local cultural color preferences
- Implement proper postcode and phone number validation

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Phase 0 Week -2 Implementation*