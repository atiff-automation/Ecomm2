# JRM E-commerce - Wireframes & User Flow Documentation

## Overview
This document contains comprehensive wireframes and user flow specifications for the Malaysian e-commerce platform with membership system.

## Design Principles
- **Mobile-First:** 70% of traffic expected from mobile devices
- **Malaysian Market Focus:** Cultural preferences, RM currency, local trust signals
- **Membership-Centric:** Dual pricing system with clear member benefits
- **Accessibility:** WCAG 2.1 AA compliance

## Responsive Breakpoints
- **Mobile:** 320px - 767px (Primary focus)
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+ (including large displays)

---

## 1. Landing Page Wireframe

### Mobile Layout (320px - 767px)
```
┌─────────────────────────────┐
│ [🏠] JRM Store    [🔍] [👤] │ ← Header (56px height)
├─────────────────────────────┤
│     HERO SECTION            │
│  "Become a Member & Save!"  │ ← Membership CTA
│   [Join Now - RM80+]        │
│                             │
├─────────────────────────────┤
│  FEATURED PRODUCTS          │
│ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │ Prod │ │ Prod │ │ Prod │  │ ← Dual pricing visible
│ │ RM50 │ │ RM25 │ │ RM75 │  │
│ │ RM45*│ │ RM20*│ │ RM65*│  │ ← Member prices
│ └──────┘ └──────┘ └──────┘  │
├─────────────────────────────┤
│  MEMBERSHIP BENEFITS        │
│ ✓ Exclusive Prices          │
│ ✓ Early Access             │
│ ✓ Free Shipping             │
├─────────────────────────────┤
│  [Browse Categories]        │ ← Bottom CTA
└─────────────────────────────┘
```

### Tablet Layout (768px - 1023px)
```
┌─────────────────────────────────────────────────────────┐
│ [🏠] JRM E-commerce Store     [🔍 Search]    [👤] [🛒] │
├─────────────────────────────────────────────────────────┤
│              HERO BANNER                                │
│    "Malaysia's #1 Membership Store"                    │
│         [Become Member - Save up to 20%]               │
├─────────────────────────────────────────────────────────┤
│                FEATURED PRODUCTS GRID                   │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │Product │ │Product │ │Product │ │Product │            │
│ │ RM100  │ │ RM50   │ │ RM200  │ │ RM75   │            │
│ │ RM85*  │ │ RM40*  │ │ RM170* │ │ RM60*  │            │
│ └────────┘ └────────┘ └────────┘ └────────┘            │
├─────────────────────────────────────────────────────────┤
│  BENEFITS SECTION | TESTIMONIALS | TRUST SIGNALS       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Product Listing Page Wireframe

### Mobile Layout
```
┌─────────────────────────────┐
│ ← Categories    [🔍] [⚙️]   │ ← Navigation + Filter
├─────────────────────────────┤
│ "Electronics" (24 items)    │ ← Category title
├─────────────────────────────┤
│ [Sort: Price ↓] [Filter]    │ ← Sort & Filter controls
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [IMG] Product Name      │ │
│ │       RM50 → RM40*      │ │ ← Dual pricing
│ │       ⭐⭐⭐⭐⭐ (12)     │ │ ← Rating
│ │       [Add to Cart]     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [IMG] Product Name      │ │
│ │       RM75 → RM60*      │ │
│ │       ⭐⭐⭐⭐☆ (8)      │ │
│ │       [Add to Cart]     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Load More Products]        │ ← Infinite scroll
└─────────────────────────────┘
```

---

## 3. Product Detail Page Wireframe

### Mobile Layout
```
┌─────────────────────────────┐
│ ← Back to Electronics       │
├─────────────────────────────┤
│    PRODUCT IMAGE GALLERY    │
│ ┌─────────────────────────┐ │
│ │     [Main Image]        │ │ ← Swipeable gallery
│ │   ● ○ ○ ○               │ │ ← Image indicators
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Product Title               │
│ ⭐⭐⭐⭐⭐ (24 reviews)       │
│                             │
│ RM100.00  → RM85.00*        │ ← Pricing emphasis
│ [Member Price] Save RM15!   │
│                             │
│ ┌─────────────────────────┐ │
│ │ Qty: [1] [- +]          │ │
│ │ [Add to Cart - RM85]    │ │ ← Dynamic pricing
│ │ [♡ Add to Wishlist]     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ PRODUCT DESCRIPTION         │
│ • Feature 1                 │
│ • Feature 2                 │
│ • Feature 3                 │
├─────────────────────────────┤
│ CUSTOMER REVIEWS            │
│ [View All 24 Reviews]       │
└─────────────────────────────┘
```

---

## 4. Shopping Cart Page Wireframe

### Mobile Layout
```
┌─────────────────────────────┐
│ ← Continue Shopping         │
├─────────────────────────────┤
│ Shopping Cart (3 items)     │
├─────────────────────────────┤
│ MEMBERSHIP STATUS           │
│ ┌─────────────────────────┐ │
│ │ 🎯 RM78 of RM80 needed  │ │ ← Progress indicator
│ │ [████████░░] 97%        │ │
│ │ Add RM2 more for member │ │
│ │ benefits!               │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ CART ITEMS                  │
│ ┌─────────────────────────┐ │
│ │ [IMG] Product A         │ │
│ │ RM50 → RM40* (member)   │ │
│ │ Qty: [2] [- +] [🗑️]     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [IMG] Product B         │ │
│ │ RM25 (promotional)      │ │
│ │ Qty: [1] [- +] [🗑️]     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ORDER SUMMARY               │
│ Subtotal:        RM105.00   │
│ Member Savings:  -RM15.00   │
│ Shipping:        FREE       │
│ ─────────────────────────   │
│ Total:           RM90.00    │
├─────────────────────────────┤
│ [Proceed to Checkout]       │
└─────────────────────────────┘
```

---

## 5. Checkout Flow Wireframe

### Step 1: Member Registration Offer (if qualified)
```
┌─────────────────────────────┐
│     🎉 CONGRATULATIONS!     │
│                             │
│ You qualify for membership! │
│ Total: RM90 (≥ RM80)        │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✅ BECOME A MEMBER      │ │
│ │ • Save RM15 today       │ │
│ │ • Future member prices  │ │
│ │ • Free shipping         │ │
│ │                         │ │
│ │ Email: [____________]   │ │
│ │ Password: [_________]   │ │
│ │ [Create Account & Pay]  │ │
│ └─────────────────────────┘ │
│                             │
│ [Skip - Continue as Guest]  │
└─────────────────────────────┘
```

### Step 2: Shipping Information
```
┌─────────────────────────────┐
│ Checkout (Step 2 of 4)      │
├─────────────────────────────┤
│ SHIPPING ADDRESS            │
│ Full Name: [_____________]  │
│ Phone: [________________]   │
│ Address: [______________]   │
│          [______________]   │
│ City: [_________________]   │
│ State: [Selangor ▼]         │
│ Postcode: [_____________]   │
│                             │
│ ☐ Save as default address  │
├─────────────────────────────┤
│ DELIVERY OPTIONS            │
│ ○ Standard (3-5 days) FREE  │
│ ○ Express (1-2 days) RM10   │
├─────────────────────────────┤
│ [Continue to Payment]       │
└─────────────────────────────┘
```

---

## 6. Member Dashboard Wireframe

### Mobile Layout
```
┌─────────────────────────────┐
│ [Menu] Member Dashboard [👤]│
├─────────────────────────────┤
│ Welcome back, Ahmad!        │
│ Member since: Jan 2025      │
├─────────────────────────────┤
│ YOUR SAVINGS                │
│ ┌─────────────────────────┐ │
│ │ This Month: RM45.50     │ │
│ │ Total Saved: RM234.00   │ │
│ │ [View Savings History]  │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ QUICK ACTIONS               │
│ [📦 Orders] [❤️ Wishlist]    │
│ [🔁 Reorder] [👤 Profile]   │
├─────────────────────────────┤
│ RECENT ORDERS               │
│ Order #12345 - Delivered    │
│ Order #12344 - Processing   │
│ [View All Orders]           │
├─────────────────────────────┤
│ MEMBER OFFERS               │
│ 🎯 20% off Electronics      │
│ 🚚 Free shipping weekend    │
│ [View All Offers]           │
└─────────────────────────────┘
```

---

## 7. Admin Dashboard Wireframe

### Desktop Layout (1024px+)
```
┌────────────────────────────────────────────────────────┐
│ JRM Admin                           Ahmad (Admin) [⚙️] │
├──────────┬─────────────────────────────────────────────┤
│ SIDEBAR  │              MAIN DASHBOARD                 │
│          │                                             │
│ 📊 Dashboard│ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ 📦 Orders   │ │  1,234  │ │  RM45K  │ │   89%   │     │
│ 🛍️ Products│ │ Orders  │ │Revenue  │ │ Members │     │
│ 👥 Customers│ │ Today   │ │ This    │ │ Conversion │  │
│ 💰 Finance  │ │         │ │ Month   │ │  Rate   │     │
│ 📈 Analytics│ └─────────┘ └─────────┘ └─────────┘     │
│ ⚙️ Settings │                                         │
│ 🔧 Bulk Ops │ RECENT ORDERS                           │
│ 📊 Reports  │ ┌─────────────────────────────────────┐ │
│ 🔐 Users    │ │ #12345  Ahmad    RM85   Processing  │ │
│             │ │ #12346  Siti     RM120  Shipped    │ │
│             │ │ #12347  Kumar    RM75   Pending    │ │
│             │ └─────────────────────────────────────┘ │
│             │                                         │
│             │ MEMBERSHIP CONVERSION STATS             │
│             │ ┌─────────────────────────────────────┐ │
│             │ │ This Week: 24 new members          │ │
│             │ │ Conversion Rate: 23%               │ │
│             │ │ [View Detailed Analytics]          │ │
│             │ └─────────────────────────────────────┘ │
└──────────┴─────────────────────────────────────────────┘
```

---

## User Flow Specifications

### Guest to Member Conversion Flow
1. **Entry Point:** Landing page or product page
2. **Browsing:** Dual pricing visible, member benefits highlighted
3. **Cart Addition:** Real-time membership eligibility calculation
4. **Checkout:** Membership offer if qualified (≥RM80)
5. **Registration:** Simple form with email/password
6. **Confirmation:** Welcome email, member dashboard access

### Member Shopping Flow
1. **Login:** Personalized dashboard
2. **Shopping:** Member prices automatically applied
3. **Exclusive Access:** Member-only products/sales
4. **Checkout:** Streamlined with saved addresses
5. **Post-Purchase:** Savings tracking, loyalty points

### Malaysian Market Specific Flows
1. **Address Entry:** Malaysian states dropdown, postcode validation
2. **Payment:** Local methods (Billplz, banking, e-wallets)
3. **Shipping:** EasyParcel integration, local courier options
4. **Support:** Bahasa Malaysia support, local business hours

---

## Component Specifications

### Product Card Component
- **Image:** WebP format, lazy loading, 1:1 aspect ratio
- **Pricing:** Regular price (strikethrough) + Member price (highlighted)
- **Badges:** "Member Exclusive", "New", "Sale"
- **Rating:** 5-star system with review count
- **Actions:** Add to cart, Add to wishlist, Quick view

### Shopping Cart Component
- **Membership Progress:** Visual progress bar to RM80 threshold
- **Item Cards:** Image, name, price, quantity controls, remove
- **Savings Display:** Member discount breakdown
- **Summary:** Subtotal, shipping, total with clear formatting

### Checkout Components
- **Progress Indicator:** Step 1-4 with current step highlighted
- **Forms:** Malaysian address format, validation
- **Payment:** Multiple payment method selection
- **Security:** SSL badges, secure payment indicators

---

## Mobile-Specific Optimizations

### Touch Targets
- **Minimum Size:** 44px for all interactive elements
- **Spacing:** 8px minimum between touch targets
- **Button Height:** 48px for primary actions

### Navigation
- **Bottom Navigation:** Fixed bottom nav for main sections
- **Hamburger Menu:** Collapsible side menu for categories
- **Back Button:** Consistent back navigation pattern

### Performance
- **Image Optimization:** WebP, lazy loading, responsive images
- **Critical CSS:** Inline critical CSS for above-fold content
- **JavaScript:** Code splitting, lazy loading for non-critical features

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Phase 0 Week -2 Implementation*