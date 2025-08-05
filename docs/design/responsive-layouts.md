# JRM E-commerce - Responsive Layout Specifications

## Overview
Comprehensive responsive design specifications for Malaysian e-commerce platform with membership system, optimized for mobile-first approach.

## Breakpoint System

### Primary Breakpoints
```css
/* Mobile (Primary focus - 70% traffic expected) */
@media (min-width: 320px) and (max-width: 767px) {
  /* Mobile-first base styles */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Tablet enhancements */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop optimizations */
}

/* Large Desktop */
@media (min-width: 1440px) {
  /* Large screen optimizations */
}
```

### Micro Breakpoints (for fine-tuning)
```css
/* Small Mobile */
@media (max-width: 375px) {
  /* iPhone SE, small Android */
}

/* Large Mobile */
@media (min-width: 414px) and (max-width: 767px) {
  /* iPhone Pro Max, large Android */
}

/* Small Desktop */
@media (min-width: 1024px) and (max-width: 1279px) {
  /* Small laptops */
}
```

---

## Layout Grid System

### Mobile Layout (320px - 767px)
```
Container: 100% width with 16px padding
Max content width: calc(100vw - 32px)

Grid System:
- 1 column for main content
- 2 columns for product grid
- Stack navigation vertically
- Full-width hero sections

Spacing:
- Section margins: 24px
- Element margins: 16px
- Content padding: 16px
- Button height: 48px
```

### Tablet Layout (768px - 1023px)
```
Container: 100% width with 24px padding
Max content width: calc(100vw - 48px)

Grid System:
- 2-3 columns for product grid
- Side navigation options
- Card-based layouts
- Split content areas

Spacing:
- Section margins: 32px
- Element margins: 20px
- Content padding: 24px
- Button height: 44px
```

### Desktop Layout (1024px+)
```
Container: Max-width 1200px, centered
Padding: 32px

Grid System:
- 4-6 columns for product grid
- Sidebar navigation
- Multi-column layouts
- Fixed header navigation

Spacing:
- Section margins: 48px
- Element margins: 24px
- Content padding: 32px
- Button height: 40px
```

---

## Component Responsive Behavior

### Header Component

#### Mobile (320px - 767px)
```
┌─────────────────────────────┐
│ [☰] JRM Store    [🔍] [👤] │ ← 56px height
└─────────────────────────────┘

Features:
- Hamburger menu (left)
- Logo (center, truncated if needed)
- Search & account icons (right)
- No category navigation
- Sticky header on scroll
```

#### Tablet (768px - 1023px)
```
┌─────────────────────────────────────────┐
│ [☰] JRM E-commerce  [Search Bar] [👤][🛒] │ ← 64px height
└─────────────────────────────────────────┘

Features:
- Logo with full name
- Search bar (expanded)
- User and cart icons
- Optional category tabs below
```

#### Desktop (1024px+)
```
┌─────────────────────────────────────────────────────────┐
│ JRM E-commerce    [Search Bar]      [Account] [Cart] [Menu] │ ← 72px height
├─────────────────────────────────────────────────────────┤
│ Electronics | Clothing | Home | Sports | More ▼        │ ← Category nav
└─────────────────────────────────────────────────────────┘

Features:
- Full logo and branding
- Expanded search with filters
- Full category navigation
- Account dropdown menu
```

### Product Grid Component

#### Mobile Layout
```css
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}

.product-card {
  min-height: 280px;
  padding: 12px;
}

.product-image {
  aspect-ratio: 1 / 1;
  width: 100%;
}

.product-title {
  font-size: 14px;
  line-height: 1.3;
  max-height: 2.6em; /* 2 lines */
  overflow: hidden;
}

.product-price {
  font-size: 16px;
  font-weight: 600;
}
```

#### Tablet Layout
```css
.product-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 24px;
}

.product-card {
  min-height: 320px;
  padding: 16px;
}

.product-title {
  font-size: 15px;
  max-height: 3.0em; /* 2 lines with more space */
}
```

#### Desktop Layout
```css
.product-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 32px;
}

@media (min-width: 1440px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.product-card {
  min-height: 360px;
  padding: 20px;
}

.product-title {
  font-size: 16px;
  max-height: 3.2em;
}
```

### Shopping Cart Component

#### Mobile Layout
```css
.cart-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 100vw;
  height: 100vh;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.cart-sidebar.open {
  transform: translateX(0);
}

.cart-items {
  flex-direction: column;
  gap: 16px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.cart-item-image {
  width: 60px;
  height: 60px;
}
```

#### Tablet & Desktop Layout
```css
.cart-sidebar {
  width: 400px;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
}

.cart-item-image {
  width: 80px;
  height: 80px;
}

/* Desktop specific */
@media (min-width: 1024px) {
  .cart-sidebar {
    width: 480px;
  }
}
```

---

## Typography Responsive System

### Font Size Scale
```css
/* Mobile */
.text-xs { font-size: 12px; line-height: 16px; }
.text-sm { font-size: 14px; line-height: 20px; }
.text-base { font-size: 16px; line-height: 24px; }
.text-lg { font-size: 18px; line-height: 28px; }
.text-xl { font-size: 20px; line-height: 28px; }
.text-2xl { font-size: 24px; line-height: 32px; }
.text-3xl { font-size: 30px; line-height: 36px; }

/* Tablet */
@media (min-width: 768px) {
  .text-base { font-size: 16px; line-height: 24px; }
  .text-lg { font-size: 18px; line-height: 28px; }
  .text-xl { font-size: 20px; line-height: 28px; }
  .text-2xl { font-size: 24px; line-height: 32px; }
  .text-3xl { font-size: 32px; line-height: 38px; }
}

/* Desktop */
@media (min-width: 1024px) {
  .text-base { font-size: 16px; line-height: 26px; }
  .text-lg { font-size: 18px; line-height: 30px; }
  .text-xl { font-size: 20px; line-height: 30px; }
  .text-2xl { font-size: 26px; line-height: 34px; }
  .text-3xl { font-size: 36px; line-height: 42px; }
}
```

### Malaysian Language Support
```css
/* Bahasa Malaysia text rendering */
.text-malay {
  font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif;
  letter-spacing: 0.025em;
  word-spacing: 0.1em;
}

/* Mixed language content */
.text-bilingual {
  font-feature-settings: "kern" 1, "liga" 1;
  text-rendering: optimizeLegibility;
}
```

---

## Form Responsive Design

### Mobile Forms (320px - 767px)
```css
.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  height: 48px; /* Touch-friendly */
  font-size: 16px; /* Prevents zoom on iOS */
  padding: 12px 16px;
  border-radius: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
}

.form-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

/* Malaysian address form */
.address-form {
  gap: 16px;
}

.address-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* State dropdown */
.state-select {
  background-image: url('data:image/svg+xml...');
  background-position: right 12px center;
}
```

### Tablet & Desktop Forms
```css
@media (min-width: 768px) {
  .form-input {
    height: 44px;
    font-size: 15px;
  }
  
  .form-button {
    width: auto;
    min-width: 120px;
    height: 44px;
  }
  
  .address-row {
    flex-direction: row;
  }
  
  .address-row .form-group {
    flex: 1;
  }
  
  .address-row .form-group:not(:last-child) {
    margin-right: 16px;
  }
}

@media (min-width: 1024px) {
  .form-input {
    height: 40px;
  }
  
  .form-button {
    height: 40px;
  }
}
```

---

## Navigation Responsive Patterns

### Mobile Navigation
```css
/* Bottom navigation for main sections */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 50;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.bottom-nav-item.active {
  color: #2563eb;
}

/* Hamburger menu */
.mobile-menu {
  position: fixed;
  top: 56px; /* Below header */
  left: 0;
  width: 100%;
  height: calc(100vh - 56px);
  background: white;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 40;
}

.mobile-menu.open {
  transform: translateX(0);
}
```

### Tablet Navigation
```css
@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
  
  .tablet-nav {
    display: flex;
    justify-content: center;
    padding: 16px 0;
    border-bottom: 1px solid #e5e5e5;
  }
  
  .tablet-nav-item {
    padding: 8px 16px;
    margin: 0 8px;
    border-radius: 6px;
    font-size: 14px;
  }
}
```

### Desktop Navigation
```css
@media (min-width: 1024px) {
  .desktop-nav {
    display: flex;
    justify-content: flex-start;
    padding: 0;
    background: #f8f9fa;
  }
  
  .desktop-nav-item {
    padding: 12px 20px;
    font-size: 15px;
    font-weight: 500;
    transition: background 0.2s ease;
  }
  
  .desktop-nav-item:hover {
    background: #e9ecef;
  }
  
  /* Mega menu for categories */
  .mega-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-width: 1200px;
    background: white;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    padding: 32px;
  }
}
```

---

## Image Responsive System

### Product Images
```css
.product-image {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
}

/* Progressive enhancement */
.product-image-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f5f5;
}

.product-image-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
  font-size: 24px;
}

/* Responsive images */
.product-image-responsive {
  width: 100%;
  height: auto;
}

@media (max-width: 767px) {
  .product-image-responsive {
    max-width: 150px;
  }
}

@media (min-width: 768px) {
  .product-image-responsive {
    max-width: 200px;
  }
}

@media (min-width: 1024px) {
  .product-image-responsive {
    max-width: 250px;
  }
}
```

### Hero Images
```css
.hero-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

@media (min-width: 768px) {
  .hero-image {
    height: 300px;
  }
}

@media (min-width: 1024px) {
  .hero-image {
    height: 400px;
  }
}
```

---

## Performance Optimizations

### CSS Loading Strategy
```css
/* Critical CSS - inline in HTML */
.critical-layout {
  /* Header, navigation, above-fold content */
}

/* Non-critical CSS - async load */
.non-critical {
  /* Below-fold content, animations, etc. */
}
```

### Image Loading Strategy
```html
<!-- Mobile-first responsive image -->
<img
  src="product-mobile.webp"
  srcset="
    product-mobile.webp 320w,
    product-tablet.webp 768w,
    product-desktop.webp 1024w
  "
  sizes="
    (max-width: 767px) 150px,
    (max-width: 1023px) 200px,
    250px
  "
  alt="Product description"
  loading="lazy"
  decoding="async"
/>
```

### Font Loading Strategy
```css
/* Font display strategy */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-display: swap;
  font-weight: 100 900;
}

/* Fallback fonts */
.font-primary {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## Malaysian Market Specific Responsive Features

### Currency Display
```css
.price {
  font-weight: 600;
  color: #059669; /* Green for money */
}

.price-regular {
  text-decoration: line-through;
  color: #6b7280;
  font-size: 0.9em;
}

.price-member {
  color: #dc2626; /* Red for savings */
  font-size: 1.1em;
}

/* Mobile */
@media (max-width: 767px) {
  .price-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .price-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
```

### Trust Signals Responsive
```css
.trust-signals {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
}

.trust-badge {
  height: 32px;
  width: auto;
}

@media (min-width: 768px) {
  .trust-badge {
    height: 40px;
  }
}
```

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Phase 0 Week -2 Implementation*