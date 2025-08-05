# JRM E-commerce - Conversion Optimization & User Journey Design

## Overview
Comprehensive conversion optimization strategy and user journey mapping for Malaysian e-commerce platform, specifically designed to maximize membership conversion and overall sales performance.

## Conversion Optimization Strategy

### 1. Membership Conversion Elements

#### Primary Conversion Goal: Guest → Member (RM80+ Threshold)

##### Savings Calculator Component
```jsx
const SavingsCalculator = ({ cartTotal, cartItems }) => {
  const [isVisible, setIsVisible] = useState(false);
  const memberTotal = calculateMemberTotal(cartItems);
  const totalSavings = cartTotal - memberTotal;
  const needsMore = Math.max(80 - cartTotal, 0);
  
  useEffect(() => {
    setIsVisible(cartTotal >= 60); // Show when close to threshold
  }, [cartTotal]);
  
  if (!isVisible) return null;
  
  return (
    <Card className="savings-calculator animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-member" />
          <CardTitle className="text-lg">Membership Savings</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {needsMore > 0 ? (
          // Show progress to membership
          <div className="membership-progress">
            <div className="flex justify-between text-sm mb-2">
              <span>RM {cartTotal.toFixed(2)} of RM 80.00</span>
              <span>{Math.round((cartTotal / 80) * 100)}%</span>
            </div>
            <Progress value={(cartTotal / 80) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Add RM {needsMore.toFixed(2)} more to qualify for membership and save!
            </p>
          </div>
        ) : (
          // Show qualified status
          <div className="membership-qualified">
            <div className="flex items-center gap-2 text-success mb-3">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">You qualify for membership!</span>
            </div>
            
            <div className="savings-breakdown">
              <div className="flex justify-between">
                <span>Current Total:</span>
                <span>RM {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Member Total:</span>
                <span>RM {memberTotal.toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg text-savings">
                <span>You Save:</span>
                <span>RM {totalSavings.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Future savings preview */}
        <div className="future-benefits p-3 bg-member/10 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Future Member Benefits:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>✓ Exclusive member prices on all products</li>
            <li>✓ Early access to sales and new products</li>
            <li>✓ Free shipping on all orders</li>
            <li>✓ Birthday discounts and special offers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
```

##### Member Price Preview Component
```jsx
const MemberPricePreview = ({ product, showAnimation = true }) => {
  const savings = product.regularPrice - product.memberPrice;
  const savingsPercent = Math.round((savings / product.regularPrice) * 100);
  
  return (
    <div className={cn(
      "member-price-preview",
      showAnimation && "animate-pulse-glow"
    )}>
      {/* Regular Price */}
      <div className="price-regular">
        <span className="text-sm text-muted-foreground line-through">
          RM {product.regularPrice.toFixed(2)}
        </span>
      </div>
      
      {/* Member Price - Highlighted */}
      <div className="price-member relative">
        <span className="text-lg font-bold text-savings">
          RM {product.memberPrice.toFixed(2)}
        </span>
        <Badge className="ml-2 bg-member text-member-foreground">
          Member Price
        </Badge>
        
        {/* Savings Badge */}
        <div className="savings-badge absolute -top-2 -right-2">
          <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-bold">
            -{savingsPercent}%
          </span>
        </div>
      </div>
      
      {/* Savings Amount */}
      <div className="savings-amount text-sm font-medium text-success">
        Save RM {savings.toFixed(2)}
      </div>
      
      {/* Member CTA */}
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-2 border-member text-member hover:bg-member hover:text-member-foreground"
      >
        <Crown className="h-4 w-4 mr-1" />
        Join & Save
      </Button>
    </div>
  );
};
```

#### Urgency and Scarcity Elements

##### Stock Urgency Component
```jsx
const StockUrgency = ({ stockLevel, threshold = 10 }) => {
  if (stockLevel > threshold) return null;
  
  const urgencyLevel = stockLevel <= 3 ? 'high' : stockLevel <= 7 ? 'medium' : 'low';
  
  const urgencyConfig = {
    high: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      icon: AlertTriangle,
      message: `Only ${stockLevel} left! Order now!`
    },
    medium: {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      icon: AlertCircle,
      message: `${stockLevel} remaining in stock`
    },
    low: {
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: Clock,
      message: `${stockLevel} left - popular item`
    }
  };
  
  const config = urgencyConfig[urgencyLevel];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "stock-urgency flex items-center gap-2 p-2 rounded-md text-sm font-medium",
      config.bg,
      config.color
    )}>
      <Icon className="h-4 w-4" />
      <span>{config.message}</span>
    </div>
  );
};
```

##### Time-Limited Offers
```jsx
const TimeLimitedOffer = ({ endTime, offerText }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endTime));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endTime));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endTime]);
  
  if (timeLeft.total <= 0) return null;
  
  return (
    <Card className="time-limited-offer border-secondary bg-secondary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-secondary" />
          <span className="font-semibold text-secondary">{offerText}</span>
        </div>
        
        <div className="countdown-timer flex gap-2 text-center">
          <div className="time-unit">
            <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded font-bold">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs mt-1">Hours</div>
          </div>
          <div className="time-separator self-center font-bold">:</div>
          <div className="time-unit">
            <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded font-bold">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs mt-1">Mins</div>
          </div>
          <div className="time-separator self-center font-bold">:</div>
          <div className="time-unit">
            <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded font-bold">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs mt-1">Secs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2. Social Proof Implementation

#### Recent Activity Display
```jsx
const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    // Simulate real-time activity updates
    const mockActivities = [
      { name: "Ahmad from KL", action: "became a member", time: "2 minutes ago" },
      { name: "Siti from Penang", action: "saved RM 25", time: "5 minutes ago" },
      { name: "Kumar from JB", action: "bought this item", time: "8 minutes ago" }
    ];
    
    setActivities(mockActivities);
    
    // Update activities periodically
    const interval = setInterval(() => {
      // Rotate activities to show freshness
      setActivities(prev => [...prev.slice(1), generateNewActivity()]);
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="recent-activity space-y-2">
      {activities.map((activity, index) => (
        <div 
          key={index}
          className="activity-item flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm"
        >
          <div className="activity-avatar">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="activity-content">
            <span className="font-medium">{activity.name}</span>
            <span className="text-muted-foreground"> {activity.action}</span>
            <span className="text-xs text-muted-foreground ml-2">{activity.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Malaysian Customer Testimonials
```jsx
const CustomerTestimonials = () => {
  const testimonials = [
    {
      name: "Ahmad Rahman",
      location: "Kuala Lumpur",
      rating: 5,
      comment: "Membership program sangat berbaloi! I saved over RM 200 last month.",
      avatar: "/avatars/ahmad.jpg",
      verified: true
    },
    {
      name: "Siti Aishah",
      location: "Penang",
      rating: 5,
      comment: "Fast delivery and great prices for members. Highly recommended!",
      avatar: "/avatars/siti.jpg",
      verified: true
    },
    {
      name: "Kumar Selvam",
      location: "Johor Bahru",
      rating: 4,
      comment: "Good quality products. The member discount makes it worth joining.",
      avatar: "/avatars/kumar.jpg",
      verified: true
    }
  ];
  
  return (
    <div className="customer-testimonials">
      <h3 className="text-lg font-semibold mb-4">What Our Members Say</h3>
      
      <div className="testimonials-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="testimonial-card">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{testimonial.name}</span>
                    {testimonial.verified && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={testimonial.rating} size="xs" />
                    <span className="text-xs text-muted-foreground">{testimonial.location}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{testimonial.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### 3. Cart Abandonment Prevention

#### Exit-Intent Modal
```jsx
const ExitIntentModal = ({ cartItems, isVisible, onClose }) => {
  const cartTotal = calculateCartTotal(cartItems);
  const memberTotal = calculateMemberTotal(cartItems);
  const savings = cartTotal - memberTotal;
  
  if (!isVisible || cartItems.length === 0) return null;
  
  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Wait! Don't miss out on your savings!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cart Summary */}
          <div className="cart-summary p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span>Your Cart Total:</span>
              <span className="font-semibold">RM {cartTotal.toFixed(2)}</span>
            </div>
            
            {cartTotal >= 80 && (
              <div className="member-offer p-3 bg-member/10 rounded border border-member/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-member" />
                  <span className="font-semibold text-member">Become a Member & Save!</span>
                </div>
                <div className="text-sm">
                  <p>Member Total: <span className="font-semibold">RM {memberTotal.toFixed(2)}</span></p>
                  <p className="text-success">You Save: <span className="font-bold">RM {savings.toFixed(2)}</span></p>
                </div>
              </div>
            )}
          </div>
          
          {/* Special Offer */}
          <div className="special-offer text-center p-4 border border-secondary rounded-lg">
            <h4 className="font-semibold text-secondary mb-2">Special Offer Just for You!</h4>
            <p className="text-sm mb-3">Get 5% extra discount on your first order</p>
            <div className="coupon-code bg-secondary/10 px-3 py-2 rounded font-mono text-sm">
              Use code: <span className="font-bold">WELCOME5</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Continue Shopping
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                // Redirect to checkout
                window.location.href = '/checkout';
              }}
            >
              Complete Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

#### Persistent Cart Notification
```jsx
const PersistentCartNotification = ({ cartItems }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  useEffect(() => {
    if (cartItems.length > 0) {
      // Show notification after 30 seconds of inactivity
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [cartItems, lastActivity]);
  
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsVisible(false);
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
    };
  }, []);
  
  if (!isVisible || cartItems.length === 0) return null;
  
  return (
    <div className="persistent-cart-notification fixed bottom-4 right-4 z-50 animate-slide-up">
      <Card className="w-80 shadow-lg border-primary">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">You have {cartItems.length} item(s) in your cart</span>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                Complete your purchase before items go out of stock!
              </p>
              
              <Button size="sm" className="w-full">
                View Cart & Checkout
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## User Journey Mapping

### 1. Guest User Journey (Complete Flow)

#### Journey Stage 1: Landing Page Discovery
```
Entry Points:
- Organic search (Google)
- Social media ads (Facebook, Instagram)
- Direct URL
- Referral links

Key Elements:
✓ Hero section with membership benefits
✓ Featured products with dual pricing
✓ Trust signals (Malaysian brands, security)
✓ Social proof (testimonials, reviews)

Goals:
- Build trust and credibility
- Showcase membership value
- Guide to product discovery

Metrics:
- Bounce rate < 60%
- Time on page > 45 seconds
- Click-through to products > 25%
```

#### Journey Stage 2: Product Discovery & Browsing
```jsx
const ProductDiscoveryFlow = () => (
  <div className="discovery-flow">
    {/* Category Navigation */}
    <nav className="category-nav">
      <CategoryGrid 
        categories={categories}
        showMemberBenefits={true}
      />
    </nav>
    
    {/* Search & Filters */}
    <div className="search-filters">
      <SearchBar 
        placeholder="Search for products..."
        showMemberFilters={true}
      />
      <FilterSidebar 
        filters={[
          'Price Range',
          'Member Exclusive',
          'Free Shipping',
          'Rating',
          'Brand'
        ]}
      />
    </div>
    
    {/* Product Grid */}
    <div className="product-grid">
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          showMemberPreview={true}
          showSavings={true}
        />
      ))}
    </div>
    
    {/* Member Benefits Reminder */}
    <MembershipBenefitsBar />
  </div>
);

// Key Metrics for this stage:
// - Products viewed per session > 8
// - Category engagement > 40%
// - Filter usage > 20%
// - Add to cart rate > 15%
```

#### Journey Stage 3: Product Detail & Consideration
```jsx
const ProductDetailFlow = ({ product }) => (
  <div className="product-detail-flow">
    {/* Product Images */}
    <ProductImageGallery images={product.images} />
    
    {/* Product Information */}
    <div className="product-info">
      <ProductTitle name={product.name} />
      <ProductRating rating={product.rating} reviewCount={product.reviewCount} />
      
      {/* Pricing - Key Conversion Element */}
      <div className="pricing-section">
        <MemberPricePreview 
          product={product}
          showAnimation={true}
          emphasizeSavings={true}
        />
        <StockUrgency stockLevel={product.stockLevel} />
      </div>
      
      {/* Add to Cart */}
      <div className="cart-actions">
        <QuantitySelector />
        <Button size="lg" className="add-to-cart-btn">
          Add to Cart - RM {product.memberPrice}
        </Button>
        <Button variant="outline" size="lg">
          <Heart className="h-4 w-4 mr-2" />
          Save for Later
        </Button>
      </div>
    </div>
    
    {/* Trust & Social Proof */}
    <div className="trust-section">
      <SecurityBadges />
      <RecentActivity />
      <CustomerReviews reviews={product.reviews} />
    </div>
    
    {/* Membership CTA */}
    <MembershipInvitation product={product} />
  </div>
);
```

#### Journey Stage 4: Cart & Membership Qualification
```jsx
const CartJourney = ({ cartItems, user }) => {
  const cartTotal = calculateCartTotal(cartItems);
  const isQualified = cartTotal >= 80;
  const qualifyingItems = cartItems.filter(item => !item.isPromotional);
  
  return (
    <div className="cart-journey">
      {/* Cart Header */}
      <div className="cart-header">
        <h1>Shopping Cart ({cartItems.length} items)</h1>
        <ContinueShoppingLink />
      </div>
      
      {/* Membership Progress */}
      <MembershipProgress 
        currentTotal={cartTotal}
        threshold={80}
        qualifyingItems={qualifyingItems.length}
        totalItems={cartItems.length}
      />
      
      {/* Cart Items */}
      <div className="cart-items">
        {cartItems.map(item => (
          <CartItem 
            key={item.id}
            item={item}
            showMemberPricing={isQualified}
            onUpdate={updateCartItem}
            onRemove={removeCartItem}
          />
        ))}
      </div>
      
      {/* Recommendations */}
      {!isQualified && (
        <ProductRecommendations 
          title="Add these to qualify for membership:"
          products={getQualifyingProducts(80 - cartTotal)}
        />
      )}
      
      {/* Cart Summary */}
      <CartSummary 
        items={cartItems}
        showMemberBenefits={isQualified}
        onCheckout={() => redirectToCheckout(cartItems)}
      />
    </div>
  );
};
```

#### Journey Stage 5: Checkout & Membership Registration
```jsx
const CheckoutJourney = ({ cartItems, isQualified }) => (
  <div className="checkout-journey">
    {/* Progress Indicator */}
    <CheckoutProgress currentStep={1} totalSteps={4} />
    
    {/* Step 1: Membership Offer (if qualified) */}
    {isQualified && (
      <MembershipOffer 
        cartTotal={calculateCartTotal(cartItems)}
        savings={calculateMemberSavings(cartItems)}
        onAccept={handleMembershipSignup}
        onDecline={handleGuestCheckout}
      />
    )}
    
    {/* Step 2: Shipping Information */}
    <ShippingForm 
      countryDefault="Malaysia"
      stateOptions={malaysianStates}
      postcodeValidation={validateMalaysianPostcode}
    />
    
    {/* Step 3: Payment Method */}
    <PaymentMethods 
      methods={malaysianPaymentMethods}
      recommended="billplz"
      showTrust={true}
    />
    
    {/* Step 4: Order Review */}
    <OrderReview 
      items={cartItems}
      showMemberSavings={isQualified}
      onConfirm={processOrder}
    />
    
    {/* Trust & Security */}
    <CheckoutTrust />
  </div>
);
```

### 2. Member User Journey

#### Member Dashboard Experience
```jsx
const MemberDashboard = ({ user, orders, savings }) => (
  <div className="member-dashboard">
    {/* Welcome Section */}
    <div className="welcome-section">
      <h1>Welcome back, {user.firstName}!</h1>
      <p className="text-muted-foreground">
        Member since {formatDate(user.memberSince)}
      </p>
    </div>
    
    {/* Savings Highlights */}
    <div className="savings-section grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard 
        title="This Month's Savings"
        value={savings.thisMonth}
        format="currency"
        change={savings.monthlyChange}
        changeType="positive"
        icon={PiggyBank}
      />
      <MetricCard 
        title="Total Lifetime Savings"
        value={savings.lifetime}
        format="currency"
        icon={TrendingUp}
      />
      <MetricCard 
        title="Member Level"
        value={user.memberLevel || "Gold"}
        icon={Crown}
      />
    </div>
    
    {/* Quick Actions */}
    <div className="quick-actions">
      <Button asChild>
        <Link href="/products">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Shop with Member Prices
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/orders">
          <Package className="h-4 w-4 mr-2" />
          View Orders
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/wishlist">
          <Heart className="h-4 w-4 mr-2" />
          My Wishlist
        </Link>
      </Button>
    </div>
    
    {/* Member-Only Offers */}
    <MemberExclusiveOffers />
    
    {/* Recent Orders */}
    <RecentOrders orders={orders.slice(0, 3)} />
  </div>
);
```

#### Member Shopping Experience
```jsx
const MemberShoppingExperience = ({ products, user }) => (
  <div className="member-shopping">
    {/* Member Status Bar */}
    <div className="member-status-bar bg-member/10 p-3 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-member" />
          <span className="font-semibold">Member Exclusive Pricing Active</span>
        </div>
        <Badge className="bg-member text-member-foreground">
          {user.memberLevel} Member
        </Badge>
      </div>
    </div>
    
    {/* Member-Only Products Section */}
    <section className="member-exclusive mb-8">
      <h2 className="text-xl font-semibold mb-4">Member Exclusive Products</h2>
      <ProductGrid 
        products={products.filter(p => p.isMemberExclusive)}
        showMemberPricing={true}
      />
    </section>
    
    {/* Early Access Section */}
    <section className="early-access mb-8">
      <h2 className="text-xl font-semibold mb-4">
        <Clock className="inline-block h-5 w-5 mr-2" />
        Early Access - New Arrivals
      </h2>
      <ProductGrid 
        products={products.filter(p => p.isEarlyAccess)}
        showMemberPricing={true}
      />
    </section>
    
    {/* Personalized Recommendations */}
    <PersonalizedRecommendations userId={user.id} />
  </div>
);
```

### 3. Conversion Funnel Analysis

#### Funnel Stage Metrics & Optimization
```javascript
const conversionFunnel = {
  // Stage 1: Landing Page
  landing: {
    visitors: 10000,
    nextStage: 7000, // 70% proceed to browse
    optimizations: [
      'Hero section A/B test',
      'Trust signal placement',
      'Membership benefit highlight',
      'Mobile loading speed'
    ]
  },
  
  // Stage 2: Product Browsing
  browsing: {
    visitors: 7000,
    nextStage: 2800, // 40% add to cart
    optimizations: [
      'Member price visibility',
      'Product recommendation engine',
      'Filter usability',
      'Social proof integration'
    ]
  },
  
  // Stage 3: Cart Addition
  cart: {
    visitors: 2800,
    nextStage: 1400, // 50% proceed to checkout
    optimizations: [
      'Membership progress indicator',
      'Cart abandonment emails',
      'Exit-intent offers',
      'Recommended products'
    ]
  },
  
  // Stage 4: Checkout
  checkout: {
    visitors: 1400,
    nextStage: 980, // 70% complete purchase
    optimizations: [
      'Membership signup flow',
      'Payment method options',
      'Guest checkout option',
      'Security trust signals'
    ]
  },
  
  // Stage 5: Purchase Completion
  purchase: {
    visitors: 980,
    members: 588, // 60% become members (if qualified)
    optimizations: [
      'Membership activation flow',
      'Onboarding email sequence',
      'First member purchase incentive',
      'Loyalty program introduction'
    ]
  }
};

// Conversion Rate Optimization Targets
const cROTargets = {
  landingToBrowse: '75%', // Current: 70%
  browseToCart: '45%',    // Current: 40%
  cartToCheckout: '55%',  // Current: 50%
  checkoutToPurchase: '75%', // Current: 70%
  qualifiedToMember: '65%'   // Current: 60%
};
```

### 4. Malaysian-Specific Journey Optimizations

#### Cultural Adaptation Points
```jsx
const MalaysianJourneyOptimizations = () => (
  <div className="malaysian-optimizations">
    {/* Language Preference Detection */}
    <LanguageDetection 
      defaultLanguage="en"
      supportedLanguages={['en', 'ms']}
      showToggle={true}
    />
    
    {/* Malaysian Payment Preferences */}
    <PaymentMethodPriority 
      order={[
        'maybank2u',
        'cimb_clicks',
        'touch_n_go',
        'boost',
        'grabpay',
        'visa',
        'mastercard'
      ]}
    />
    
    {/* Local Trust Signals */}
    <LocalTrustSignals 
      elements={[
        'SSM registration',
        'Malaysian phone support',
        'Local testimonials',
        'Halal certification (food items)',
        'Local delivery partners'
      ]}
    />
    
    {/* Seasonal Adaptations */}
    <SeasonalPromotions 
      events={[
        'chinese_new_year',
        'hari_raya',
        'deepavali',
        'christmas',
        'malaysia_day'
      ]}
    />
  </div>
);
```

---

## A/B Testing Framework

### 1. Test Categories

#### Membership Conversion Tests
```javascript
const membershipTests = [
  {
    name: 'Membership CTA Placement',
    variants: ['header', 'product_card', 'cart', 'floating'],
    metric: 'membership_signup_rate',
    duration: '2_weeks'
  },
  {
    name: 'Savings Display Format',
    variants: ['percentage', 'amount', 'both'],
    metric: 'cart_conversion_rate',
    duration: '2_weeks'
  },
  {
    name: 'Member Benefits Highlight',
    variants: ['savings_focus', 'perks_focus', 'social_proof'],
    metric: 'membership_interest_clicks',
    duration: '1_week'
  }
];
```

#### Malaysian Market Tests
```javascript
const malaysianMarketTests = [
  {
    name: 'Language Preference',
    variants: ['english_primary', 'bilingual_equal', 'malay_primary'],
    metric: 'engagement_time',
    duration: '3_weeks'
  },
  {
    name: 'Cultural Color Preferences',
    variants: ['blue_trust', 'green_prosperity', 'red_celebration'],
    metric: 'click_through_rate',
    duration: '2_weeks'
  },
  {
    name: 'Payment Method Order',
    variants: ['banking_first', 'ewallet_first', 'mixed'],
    metric: 'checkout_completion_rate',
    duration: '2_weeks'
  }
];
```

### 2. Testing Implementation

#### A/B Test Component
```jsx
const ABTest = ({ testName, variants, children }) => {
  const [variant, setVariant] = useState(null);
  const [userId] = useState(() => getUserId());
  
  useEffect(() => {
    // Determine variant based on user ID for consistency
    const variantIndex = hashCode(userId + testName) % variants.length;
    setVariant(variants[variantIndex]);
    
    // Track test exposure
    analytics.track('ab_test_exposure', {
      test_name: testName,
      variant: variants[variantIndex],
      user_id: userId
    });
  }, [testName, variants, userId]);
  
  if (!variant) return null;
  
  return children(variant);
};

// Usage Example
const MembershipCTATest = () => (
  <ABTest 
    testName="membership_cta_placement"
    variants={['header', 'floating', 'product_card']}
  >
    {(variant) => {
      switch (variant) {
        case 'header':
          return <HeaderMembershipCTA />;
        case 'floating':
          return <FloatingMembershipCTA />;
        case 'product_card':
          return <ProductCardMembershipCTA />;
        default:
          return null;
      }
    }}
  </ABTest>
);
```

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Phase 0 Week -2 Implementation*