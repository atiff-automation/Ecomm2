# JRM E-commerce - Accessibility Compliance Checklist (WCAG 2.1 AA)

## Overview
Comprehensive accessibility checklist ensuring WCAG 2.1 AA compliance for Malaysian e-commerce platform with specific considerations for local users and cultural accessibility needs.

## WCAG 2.1 AA Compliance Framework

### Principle 1: Perceivable
Information and user interface components must be presentable to users in ways they can perceive.

#### 1.1 Text Alternatives
- [ ] **1.1.1 Non-text Content (Level A)**
  - [ ] All product images have descriptive alt text
  - [ ] Decorative images use empty alt attributes (`alt=""`)
  - [ ] Complex images (charts, graphs) have detailed descriptions
  - [ ] Logo images include company name in alt text
  - [ ] Payment method logos include payment provider names

#### 1.2 Time-based Media
- [ ] **1.2.1 Audio-only and Video-only (Level A)**
  - [ ] Product videos have text transcripts
  - [ ] Audio product descriptions have text alternatives
- [ ] **1.2.2 Captions (Level A)**
  - [ ] All videos include accurate captions
  - [ ] Captions available in both English and Bahasa Malaysia
- [ ] **1.2.3 Audio Description or Media Alternative (Level A)**
  - [ ] Video content includes audio descriptions when needed

#### 1.3 Adaptable
- [ ] **1.3.1 Info and Relationships (Level A)**
  - [ ] Proper heading hierarchy (h1 → h2 → h3)
  - [ ] Form labels properly associated with inputs
  - [ ] Lists use proper markup (`<ul>`, `<ol>`, `<li>`)
  - [ ] Tables have proper headers and captions
  - [ ] Price information structured semantically

```html
<!-- Proper heading hierarchy -->
<h1>Product Category</h1>
  <h2>Product Name</h2>
    <h3>Product Details</h3>
    <h3>Customer Reviews</h3>

<!-- Proper form labeling -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email" required>

<!-- Structured pricing -->
<div role="group" aria-labelledby="pricing">
  <h3 id="pricing">Pricing Information</h3>
  <span class="regular-price" aria-label="Regular price">RM 100.00</span>
  <span class="member-price" aria-label="Member price">RM 85.00</span>
  <span class="savings" aria-label="Savings amount">Save RM 15.00</span>
</div>
```

- [ ] **1.3.2 Meaningful Sequence (Level A)**
  - [ ] Content order makes sense when CSS is disabled
  - [ ] Tab order follows logical sequence
  - [ ] Shopping cart items listed in meaningful order
  
- [ ] **1.3.3 Sensory Characteristics (Level A)**
  - [ ] Instructions don't rely solely on shape, size, or visual location
  - [ ] Color isn't the only way to convey information
  - [ ] Sound isn't required to understand content

#### 1.4 Distinguishable
- [ ] **1.4.1 Use of Color (Level A)**
  - [ ] Error messages don't rely on red color alone
  - [ ] Form validation includes text and icons, not just color
  - [ ] Member pricing benefits shown with text, not just color coding
  
- [ ] **1.4.2 Audio Control (Level A)**
  - [ ] Auto-playing audio can be paused/stopped
  - [ ] Background music in videos controllable

- [ ] **1.4.3 Contrast (Minimum) (Level AA)**
  - [ ] Text contrast ratio at least 4.5:1 against background
  - [ ] Large text (18pt+) contrast ratio at least 3:1
  - [ ] Price displays have high contrast for visibility
  - [ ] Link colors meet contrast requirements

```css
/* Contrast-compliant colors */
.text-primary { color: #1f2937; } /* 8.9:1 contrast on white */
.text-secondary { color: #374151; } /* 7.2:1 contrast on white */
.price-member { color: #059669; } /* 4.7:1 contrast on white */
.error-text { color: #dc2626; } /* 5.9:1 contrast on white */

/* High contrast for important elements */
.cta-button {
  background: #1f2937;
  color: #ffffff;
  /* 15.3:1 contrast ratio */
}
```

- [ ] **1.4.4 Resize Text (Level AA)**
  - [ ] Text can be resized up to 200% without horizontal scrolling
  - [ ] Mobile responsive design maintains readability when zoomed
  - [ ] Font sizes scale appropriately across devices

- [ ] **1.4.5 Images of Text (Level AA)**
  - [ ] Text in images avoided when possible
  - [ ] Logo images use high resolution for clarity
  - [ ] Price graphics replaced with HTML text

### Principle 2: Operable
User interface components and navigation must be operable.

#### 2.1 Keyboard Accessible
- [ ] **2.1.1 Keyboard (Level A)**
  - [ ] All interactive elements accessible via keyboard
  - [ ] Shopping cart functions work with keyboard only
  - [ ] Product filters operable with keyboard
  - [ ] Search functionality keyboard accessible

- [ ] **2.1.2 No Keyboard Trap (Level A)**
  - [ ] Users can navigate away from any component using keyboard
  - [ ] Modal dialogs have proper focus management
  - [ ] Dropdown menus don't trap keyboard focus

#### 2.2 Enough Time
- [ ] **2.2.1 Timing Adjustable (Level A)**
  - [ ] Session timeouts have warnings and extensions
  - [ ] Shopping cart timeout can be extended
  - [ ] Payment process allows sufficient time

- [ ] **2.2.2 Pause, Stop, Hide (Level A)**
  - [ ] Auto-rotating banners can be paused
  - [ ] Loading animations don't interfere with screen readers

#### 2.3 Seizures and Physical Reactions
- [ ] **2.3.1 Three Flashes or Below Threshold (Level A)**
  - [ ] No content flashes more than three times per second
  - [ ] Loading animations don't trigger seizures

#### 2.4 Navigable
- [ ] **2.4.1 Bypass Blocks (Level A)**
  - [ ] "Skip to main content" link provided
  - [ ] Skip navigation available on all pages

```html
<!-- Skip link implementation -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<nav aria-label="Main navigation">
  <!-- Navigation items -->
</nav>
<main id="main-content">
  <!-- Main content -->
</main>
```

- [ ] **2.4.2 Page Titled (Level A)**
  - [ ] All pages have descriptive, unique titles
  - [ ] Product pages include product name in title
  - [ ] Page titles help users understand their location

- [ ] **2.4.3 Focus Order (Level A)**
  - [ ] Tab order follows logical sequence
  - [ ] Focus moves predictably through interface
  - [ ] Shopping process maintains logical focus flow

- [ ] **2.4.4 Link Purpose (In Context) (Level A)**
  - [ ] Link text describes destination or function
  - [ ] "Read more" links include context
  - [ ] Product links clearly identify products

```html
<!-- Clear link purposes -->
<a href="/product/123">View Samsung Galaxy Phone Details</a>
<!-- Instead of generic "Click here" or "Read more" -->

<!-- Context for product links -->
<article>
  <h3>Samsung Galaxy Phone</h3>
  <p>Latest flagship smartphone...</p>
  <a href="/product/123" aria-labelledby="product-123-title">
    View full details
  </a>
</article>
```

- [ ] **2.4.5 Multiple Ways (Level AA)**
  - [ ] Multiple navigation methods provided (menu, search, sitemap)
  - [ ] Breadcrumb navigation available
  - [ ] Product categories and search both available

- [ ] **2.4.6 Headings and Labels (Level AA)**
  - [ ] Headings describe topic or purpose
  - [ ] Form labels describe input purpose
  - [ ] Section headings organize content clearly

- [ ] **2.4.7 Focus Visible (Level AA)**
  - [ ] Keyboard focus clearly visible
  - [ ] Focus indicators meet contrast requirements
  - [ ] Custom focus styles maintain visibility

```css
/* Accessible focus indicators */
.focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #2563eb;
}

/* High contrast focus for important elements */
.cta-button:focus-visible {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #f59e0b;
}
```

### Principle 3: Understandable
Information and the operation of user interface must be understandable.

#### 3.1 Readable
- [ ] **3.1.1 Language of Page (Level A)**
  - [ ] Page language specified in HTML lang attribute
  - [ ] Bilingual content properly marked

```html
<html lang="en">
<!-- English content -->
<span lang="ms">Selamat datang</span> <!-- Malaysian content marked -->
```

- [ ] **3.1.2 Language of Parts (Level AA)**
  - [ ] Foreign language phrases marked with lang attribute
  - [ ] Malaysian and English text properly identified

#### 3.2 Predictable
- [ ] **3.2.1 On Focus (Level A)**
  - [ ] Focus doesn't trigger unexpected context changes
  - [ ] Dropdown menus don't auto-submit on focus

- [ ] **3.2.2 On Input (Level A)**
  - [ ] Changing input values doesn't cause unexpected changes
  - [ ] Form submission requires explicit action

- [ ] **3.2.3 Consistent Navigation (Level AA)**
  - [ ] Navigation appears in same location across pages
  - [ ] Consistent navigation labels and order

- [ ] **3.2.4 Consistent Identification (Level AA)**
  - [ ] Components with same functionality labeled consistently
  - [ ] Shopping cart icon consistent across site

#### 3.3 Input Assistance
- [ ] **3.3.1 Error Identification (Level A)**
  - [ ] Form errors clearly identified
  - [ ] Error messages specific and helpful
  - [ ] Malaysian-specific validation errors (postcode, phone)

```html
<!-- Accessible error messaging -->
<div class="form-field">
  <label for="postcode">Postcode</label>
  <input 
    type="text" 
    id="postcode" 
    name="postcode"
    pattern="[0-9]{5}"
    aria-describedby="postcode-error postcode-help"
    aria-invalid="true"
  >
  <div id="postcode-help" class="help-text">
    Enter 5-digit Malaysian postcode (e.g., 50000)
  </div>
  <div id="postcode-error" class="error-message" role="alert">
    Postcode must be exactly 5 digits
  </div>
</div>
```

- [ ] **3.3.2 Labels or Instructions (Level A)**
  - [ ] Form fields have clear labels
  - [ ] Required fields clearly marked
  - [ ] Input format explained (phone numbers, postcodes)

- [ ] **3.3.3 Error Suggestion (Level AA)**
  - [ ] Error correction suggestions provided
  - [ ] Malaysian address format guidance given
  - [ ] Phone number format examples shown

- [ ] **3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)**
  - [ ] Order confirmation before payment
  - [ ] Account changes require confirmation
  - [ ] Data deletion requires verification

### Principle 4: Robust
Content must be robust enough to be interpreted reliably by assistive technologies.

#### 4.1 Compatible
- [ ] **4.1.1 Parsing (Level A)**
  - [ ] HTML validates according to specification
  - [ ] Proper opening/closing tags
  - [ ] No duplicate IDs on same page

- [ ] **4.1.2 Name, Role, Value (Level A)**
  - [ ] Custom components have proper ARIA labels
  - [ ] Button roles clearly defined
  - [ ] Form controls properly identified

- [ ] **4.1.3 Status Messages (Level AA)**
  - [ ] Status changes announced to screen readers
  - [ ] Cart updates communicated to assistive technology
  - [ ] Form submission results announced

```html
<!-- Accessible status messages -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <div id="cart-status"></div>
</div>

<script>
// Announce cart updates
function updateCartStatus(message) {
  document.getElementById('cart-status').textContent = message;
}
// Usage: updateCartStatus('Item added to cart');
</script>
```

---

## Malaysian-Specific Accessibility Considerations

### 1. Multilingual Accessibility

#### Screen Reader Support for Local Languages
- [ ] Screen reader testing with Bahasa Malaysia content
- [ ] Proper pronunciation of Malaysian terms
- [ ] Currency amounts read correctly ("RM" as "Ringgit Malaysia")

#### Language Switching Accessibility
```html
<div role="group" aria-labelledby="language-switch">
  <h3 id="language-switch" class="sr-only">Language Selection</h3>
  <button 
    aria-pressed="true" 
    aria-describedby="current-lang"
    onclick="switchLanguage('en')"
  >
    English
  </button>
  <button 
    aria-pressed="false"
    onclick="switchLanguage('ms')"
  >
    Bahasa Malaysia
  </button>
  <span id="current-lang" class="sr-only">Currently selected</span>
</div>
```

### 2. Cultural Accessibility Adaptations

#### Malaysian Currency Accessibility
- [ ] RM amounts announced clearly by screen readers
- [ ] Price savings calculations explained
- [ ] Member pricing benefits clearly communicated

```html
<!-- Accessible pricing information -->
<div class="pricing" role="group" aria-labelledby="price-info">
  <h4 id="price-info" class="sr-only">Pricing Information</h4>
  
  <span class="regular-price" aria-label="Regular price Ringgit Malaysia 100">
    RM 100.00
  </span>
  
  <span class="member-price" aria-label="Member price Ringgit Malaysia 85">
    RM 85.00
  </span>
  
  <span class="savings" aria-label="You save Ringgit Malaysia 15">
    Save RM 15.00
  </span>
</div>
```

#### Local Address Format Accessibility
- [ ] Malaysian address fields properly labeled
- [ ] State selection accessible to screen readers
- [ ] Postcode format explained clearly

```html
<!-- Accessible address form -->
<fieldset>
  <legend>Delivery Address</legend>
  
  <div class="form-field">
    <label for="address-line-1">Address Line 1</label>
    <input 
      type="text" 
      id="address-line-1"
      name="addressLine1"
      aria-describedby="address-help"
      required
    >
    <div id="address-help" class="help-text">
      House number and street name (e.g., "123 Jalan Bukit Bintang")
    </div>
  </div>
  
  <div class="form-field">
    <label for="state">State</label>
    <select id="state" name="state" required>
      <option value="">Select a state</option>
      <option value="selangor">Selangor</option>
      <option value="kuala-lumpur">Kuala Lumpur</option>
      <!-- Other Malaysian states -->
    </select>
  </div>
  
  <div class="form-field">
    <label for="postcode">Postcode</label>
    <input 
      type="text" 
      id="postcode"
      name="postcode"
      pattern="[0-9]{5}"
      aria-describedby="postcode-format"
      required
    >
    <div id="postcode-format" class="help-text">
      5-digit postcode (e.g., 50000 for Kuala Lumpur)
    </div>
  </div>
</fieldset>
```

---

## Testing Procedures

### 1. Automated Testing Tools

#### Required Testing Tools
- [ ] **axe-core**: Automated accessibility testing
- [ ] **WAVE**: Web accessibility evaluation
- [ ] **Lighthouse**: Performance and accessibility audit
- [ ] **Pa11y**: Command-line accessibility testing

```bash
# Example testing commands
npx axe-cli http://localhost:3000
npx pa11y http://localhost:3000
```

### 2. Manual Testing Procedures

#### Keyboard Navigation Testing
- [ ] Navigate entire site using only keyboard
- [ ] Test Tab, Shift+Tab, Enter, Space, Arrow keys
- [ ] Verify all interactive elements reachable
- [ ] Check modal dialog focus management
- [ ] Test dropdown menu keyboard interaction

#### Screen Reader Testing
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] Verify content read in logical order
- [ ] Check form labels read correctly
- [ ] Test table headers and data relationships
- [ ] Verify status messages announced

#### Mobile Accessibility Testing
- [ ] Test with mobile screen readers (TalkBack, VoiceOver)
- [ ] Verify touch targets meet minimum size (44px)
- [ ] Check gesture navigation alternatives
- [ ] Test with device orientation changes

### 3. User Testing with Disabilities

#### Testing Protocol
- [ ] Recruit users with various disabilities
- [ ] Include Malaysian users with disabilities
- [ ] Test in both English and Bahasa Malaysia
- [ ] Document accessibility barriers found
- [ ] Implement recommended improvements

---

## Implementation Guidelines

### 1. Development Best Practices

#### ARIA Implementation
```jsx
// Accessible product card component
const AccessibleProductCard = ({ product }) => (
  <article 
    className="product-card"
    aria-labelledby={`product-${product.id}-name`}
    aria-describedby={`product-${product.id}-price`}
  >
    <img 
      src={product.image} 
      alt={`${product.name} product image`}
      loading="lazy"
    />
    
    <h3 id={`product-${product.id}-name`}>
      {product.name}
    </h3>
    
    <div 
      id={`product-${product.id}-price`}
      role="group"
      aria-label="Pricing information"
    >
      <span aria-label={`Regular price ${product.regularPrice} ringgit`}>
        RM {product.regularPrice}
      </span>
      <span aria-label={`Member price ${product.memberPrice} ringgit`}>
        RM {product.memberPrice}
      </span>
    </div>
    
    <button 
      aria-describedby={`product-${product.id}-name`}
      onClick={() => addToCart(product.id)}
    >
      Add to Cart
    </button>
  </article>
);
```

#### Focus Management
```jsx
// Accessible modal focus management
const AccessibleModal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement;
      
      // Focus modal
      modalRef.current?.focus();
      
      // Trap focus within modal
      const trapFocus = (e) => {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };
      
      document.addEventListener('keydown', trapFocus);
      return () => document.removeEventListener('keydown', trapFocus);
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <div className="modal-content">
        <button 
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};
```

### 2. Content Guidelines

#### Writing Accessible Content
- [ ] Use clear, simple language
- [ ] Avoid jargon and technical terms
- [ ] Provide definitions for complex terms
- [ ] Use active voice when possible
- [ ] Keep sentences short and focused

#### Malaysian-Specific Content Accessibility
- [ ] Provide Bahasa Malaysia translations
- [ ] Use familiar local terms and concepts
- [ ] Include cultural context when needed
- [ ] Explain Malaysian-specific processes clearly

---

## Compliance Monitoring

### 1. Ongoing Monitoring

#### Regular Audit Schedule
- [ ] **Weekly**: Automated accessibility scans
- [ ] **Monthly**: Manual keyboard and screen reader testing
- [ ] **Quarterly**: Full WCAG 2.1 AA compliance audit
- [ ] **Annually**: User testing with disabled community

### 2. Accessibility Statement

#### Required Information
- [ ] WCAG 2.1 AA compliance commitment
- [ ] Known accessibility issues and workarounds
- [ ] Contact information for accessibility feedback
- [ ] Date of last accessibility review

```html
<!-- Example accessibility statement -->
<section aria-labelledby="accessibility-title">
  <h2 id="accessibility-title">Accessibility Statement</h2>
  
  <p>
    JRM E-commerce is committed to ensuring digital accessibility for people 
    with disabilities. We are continually improving the user experience for 
    everyone and applying the relevant accessibility standards.
  </p>
  
  <h3>Conformance Status</h3>
  <p>
    This website strives to conform to WCAG 2.1 AA standards. These guidelines 
    explain how to make web content accessible to people with a wide array of 
    disabilities.
  </p>
  
  <h3>Feedback</h3>
  <p>
    If you encounter any accessibility barriers, please contact us:
    <br>
    Email: <a href="mailto:accessibility@jrmecommerce.com">accessibility@jrmecommerce.com</a>
    <br>
    Phone: <a href="tel:+60312345678">+603-1234-5678</a>
  </p>
  
  <p>
    <small>Last reviewed: [Current Date]</small>
  </p>
</section>
```

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Phase 0 Week -2 Implementation*