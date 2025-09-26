# Hero Section Slider Implementation Plan
*Following CLAUDE.md principles: Systematic, DRY, Centralized, Best Practices*

## 🎯 Overview
Implement a carousel/slider system for the hero section where admins can upload multiple images that auto-slide on the homepage. This extends the current single hero image system to support multiple images with smooth transitions.

## 🏗️ Architecture Strategy

### Current System Analysis
- **Frontend**: `DynamicHeroSection.tsx` - Single image/video background
- **Data**: JSON-based configuration in `SiteCustomization` table
- **API**: Unified site customization system with existing image upload
- **Admin**: Site customization page with drag-drop image upload

### Integration Approach
**Extend existing JSON configuration system** - maintains consistency with established architectural patterns and ensures 100% backward compatibility.

---

## 📊 Data Model Extension

### Updated SiteCustomizationConfig Interface
```typescript
interface SiteCustomizationConfig {
  hero: {
    // Existing fields...
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: { text: string; link: string; };
    ctaSecondary: { text: string; link: string; };
    background: {
      type: 'IMAGE' | 'VIDEO';
      url?: string;
      overlayOpacity: number;
    };
    layout: {
      textAlignment: 'left' | 'center' | 'right';
      showTitle: boolean;
      showCTA: boolean;
    };

    // NEW: Slider configuration
    slider: {
      enabled: boolean;           // Enable/disable slider mode
      autoAdvance: boolean;       // Auto-advance slides
      interval: number;           // Time between slides (milliseconds)
      showDots: boolean;          // Show navigation dots
      showArrows: boolean;        // Show navigation arrows
      pauseOnHover: boolean;      // Pause auto-advance on hover
      slides: Array<{
        id: string;               // Unique slide identifier
        imageUrl: string;         // Slide image URL
        altText?: string;         // Alt text for accessibility
        order: number;            // Sort order (0-based)
        isActive: boolean;        // Show/hide slide
      }>;
    };
  };
  // Other existing fields...
}
```

### Validation Schema Extension
```typescript
const SliderValidationSchema = z.object({
  enabled: z.boolean(),
  autoAdvance: z.boolean(),
  interval: z.number().min(1000).max(30000), // 1-30 seconds
  showDots: z.boolean(),
  showArrows: z.boolean(),
  pauseOnHover: z.boolean(),
  slides: z.array(z.object({
    id: z.string().cuid(),
    imageUrl: z.string().url(),
    altText: z.string().max(200).optional(),
    order: z.number().int().min(0),
    isActive: z.boolean()
  })).max(10) // Maximum 10 slides
});
```

---

## 🔧 Implementation Phases

### Phase 1: Data Model & Service Layer (2-3 hours)

#### Task Checklist:
- [ ] **Update type definitions in `site-customization.service.ts`**
  - [ ] Add `SliderConfig` interface
  - [ ] Add `HeroSlide` interface
  - [ ] Update `SiteCustomizationConfig` interface

- [ ] **Extend Zod validation schemas**
  - [ ] Add `SliderValidationSchema`
  - [ ] Update main validation to include slider
  - [ ] Add slide array validation (max 10 slides)

- [ ] **Add service methods for slider management**
  - [ ] `addSlide(slideData: HeroSlide): Promise<void>`
  - [ ] `updateSlide(slideId: string, updates: Partial<HeroSlide>): Promise<void>`
  - [ ] `deleteSlide(slideId: string): Promise<void>`
  - [ ] `reorderSlides(slideIds: string[]): Promise<void>`
  - [ ] `updateSliderConfig(config: SliderConfig): Promise<void>`

- [ ] **Add backward compatibility handling**
  - [ ] Migration logic for existing configurations
  - [ ] Default slider config for new installations
  - [ ] Fallback to single image when slider disabled

#### Files Modified:
- `src/lib/services/site-customization.service.ts`

---

### Phase 2: Admin Interface Enhancement (6-8 hours)

#### Task Checklist:
- [ ] **Add slider configuration section**
  - [ ] Toggle switch for enabling/disabling slider
  - [ ] Slider timing configuration (interval, auto-advance)
  - [ ] Navigation options (dots, arrows, pause on hover)
  - [ ] Configuration preview display

- [ ] **Multi-slide upload component**
  - [ ] Extend existing `DragDropZone` for multiple files
  - [ ] Batch upload with progress tracking
  - [ ] File validation (images only, size limits)
  - [ ] Upload error handling and retry logic

- [ ] **Slide management interface**
  - [ ] Slide list with thumbnail previews
  - [ ] Drag-and-drop reordering functionality
  - [ ] Individual slide edit controls (alt text, active toggle)
  - [ ] Slide deletion with confirmation
  - [ ] Bulk operations (activate/deactivate multiple)

- [ ] **Live preview functionality**
  - [ ] Mini carousel preview in admin
  - [ ] Real-time configuration updates
  - [ ] Responsive preview (desktop/mobile)

- [ ] **Form validation and error handling**
  - [ ] Client-side validation with proper error messages
  - [ ] Server-side validation feedback
  - [ ] Unsaved changes warning

#### Component Structure:
```
src/app/admin/settings/site-customization/page.tsx (modified)
├── HeroSliderSection (new component)
│   ├── SliderConfiguration
│   ├── SlideUpload
│   ├── SlideManager
│   └── SliderPreview
```

#### Files Modified/Created:
- `src/app/admin/settings/site-customization/page.tsx` (modified)
- `src/components/admin/HeroSliderSection.tsx` (new)
- `src/components/admin/SlideManager.tsx` (new)
- `src/components/admin/SliderPreview.tsx` (new)

---

### Phase 3: Frontend Display Enhancement (4-6 hours)

#### Task Checklist:
- [ ] **Enhance DynamicHeroSection component**
  - [ ] Add slider mode detection logic
  - [ ] Implement carousel state management
  - [ ] Add slide transition animations (CSS transforms)
  - [ ] Maintain backward compatibility with single image mode

- [ ] **Carousel functionality implementation**
  - [ ] Auto-advance timer with proper cleanup
  - [ ] Manual navigation (next/previous)
  - [ ] Navigation dots with current slide indicator
  - [ ] Touch/swipe gesture support for mobile
  - [ ] Keyboard navigation support (arrow keys)

- [ ] **Performance optimizations**
  - [ ] Image preloading strategy (current + next slide)
  - [ ] Lazy loading for inactive slides
  - [ ] Proper cleanup of intervals and event listeners
  - [ ] Debounced resize handling

- [ ] **Accessibility features**
  - [ ] ARIA labels for carousel controls
  - [ ] Screen reader announcements for slide changes
  - [ ] Keyboard focus management
  - [ ] Respect prefers-reduced-motion settings

- [ ] **Mobile responsiveness**
  - [ ] Touch gesture implementation
  - [ ] Responsive navigation controls
  - [ ] Mobile-optimized image loading
  - [ ] Performance considerations for mobile

#### CSS Structure:
```scss
.hero-carousel {
  position: relative;
  overflow: hidden;

  &__slides {
    display: flex;
    transition: transform 300ms ease-in-out;
  }

  &__slide {
    min-width: 100%;
    flex-shrink: 0;
  }

  &__controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  &__dots, &__arrows {
    // Navigation styling
  }
}
```

#### Files Modified:
- `src/components/homepage/DynamicHeroSection.tsx`
- `src/app/api/site-customization/current/route.ts` (add slider data to response)

---

### Phase 4: Testing & Polish (3-4 hours)

#### Task Checklist:
- [ ] **Cross-browser testing**
  - [ ] Chrome (latest)
  - [ ] Safari (latest)
  - [ ] Firefox (latest)
  - [ ] Edge (latest)
  - [ ] Mobile Safari (iOS)
  - [ ] Chrome Mobile (Android)

- [ ] **Functionality testing**
  - [ ] Image upload and processing
  - [ ] Slide reordering via drag-and-drop
  - [ ] Auto-advance timing accuracy
  - [ ] Manual navigation responsiveness
  - [ ] Configuration changes persistence
  - [ ] Backward compatibility with existing setups

- [ ] **Performance validation**
  - [ ] Page load time impact measurement
  - [ ] Image loading optimization verification
  - [ ] Memory usage monitoring
  - [ ] Mobile performance testing
  - [ ] Core Web Vitals impact assessment

- [ ] **Accessibility audit**
  - [ ] Screen reader compatibility
  - [ ] Keyboard navigation flow
  - [ ] ARIA labels verification
  - [ ] Color contrast compliance
  - [ ] Motion sensitivity considerations

- [ ] **Error handling verification**
  - [ ] Network failure scenarios
  - [ ] Image loading failures
  - [ ] Invalid configuration handling
  - [ ] Graceful degradation testing

---

## 🎨 User Experience Design

### Admin Experience Flow
1. **Configuration**: Admin toggles slider mode in site customization
2. **Upload**: Multi-select image upload with drag-and-drop
3. **Management**: Drag to reorder, click to edit, toggle to activate/deactivate
4. **Preview**: Live preview shows changes immediately
5. **Save**: Configuration persists and applies to frontend

### Customer Experience Flow
1. **Loading**: First slide displays immediately (critical path)
2. **Navigation**: Auto-advance or manual controls
3. **Interaction**: Touch swipe on mobile, click/keyboard on desktop
4. **Accessibility**: Screen reader friendly with proper announcements

### Mobile Considerations
- **Touch Priority**: Primary navigation via swipe gestures
- **Visual Indicators**: Clear dots/progress indicators
- **Performance**: Optimized image loading for mobile connections
- **Battery**: Efficient animations and proper timer cleanup

---

## ⚡ Performance Strategy

### Image Loading Optimization
```javascript
const loadingStrategy = {
  immediate: 'current slide',           // Load immediately
  preload: 'next slide',               // Preload in background
  lazy: 'remaining slides',            // Load on demand
  cleanup: 'previous slides',          // Cleanup after navigation
  formats: ['webp', 'jpeg', 'png'],   // Format priority
  sizes: 'responsive variants'         // Multiple sizes
};
```

### Bundle Size Impact
- **No External Libraries**: Pure CSS + React implementation
- **Estimated Addition**: ~3KB compressed JavaScript
- **CSS Addition**: ~1KB for carousel styles
- **Total Impact**: <5KB additional bundle size

### Memory Management
- Limit concurrent loaded images (max 3 at once)
- Proper cleanup of event listeners and timers
- Blob URL cleanup after upload
- Debounced resize handlers

---

## 🔒 Security Considerations

### File Upload Security
- **File Type Validation**: Images only (JPEG, PNG, WebP)
- **File Size Limits**: Maximum 5MB per image
- **Content Validation**: Image header verification
- **Access Control**: Admin-only upload permissions
- **Path Sanitization**: Secure file storage paths

### Configuration Security
- **Input Validation**: All slider configuration validated server-side
- **XSS Prevention**: Proper escaping of alt text and configuration
- **CSRF Protection**: Protected admin endpoints
- **Audit Logging**: Track slider configuration changes

---

## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Tab order, arrow key control
- **Screen Reader Support**: ARIA labels and announcements
- **Visual Indicators**: Clear focus states and current slide indication
- **Motion Control**: Respect prefers-reduced-motion setting
- **Color Contrast**: Sufficient contrast for navigation elements

### Implementation Details
```typescript
const a11yFeatures = {
  ariaLabels: {
    carousel: 'Hero image carousel',
    slides: 'Slide {current} of {total}',
    controls: 'Carousel navigation',
    dots: 'Go to slide {number}'
  },
  keyboard: {
    leftArrow: 'Previous slide',
    rightArrow: 'Next slide',
    space: 'Pause/resume auto-advance'
  },
  announcements: 'Slide changed to {slideNumber}'
};
```

---

## 📈 Success Metrics

### Technical KPIs
- [ ] **Performance**: Homepage load time increase <200ms
- [ ] **Bundle Size**: Total addition <5KB compressed
- [ ] **Accessibility**: WCAG 2.1 AA compliance score 100%
- [ ] **Browser Support**: 100% functionality on modern browsers
- [ ] **Mobile Performance**: Touch responsiveness <100ms
- [ ] **SEO Impact**: No negative impact on Core Web Vitals

### User Experience KPIs
- [ ] **Admin Efficiency**: Upload and configure 5 slides in <2 minutes
- [ ] **Visual Quality**: Smooth 60fps transitions on all devices
- [ ] **Error Rate**: <1% upload failure rate
- [ ] **Compatibility**: 100% backward compatibility with existing configurations

### Quality Assurance
- [ ] **Code Coverage**: >90% test coverage for new components
- [ ] **Performance Testing**: Load testing with 10 concurrent admin users
- [ ] **Security Audit**: No vulnerabilities in upload or configuration
- [ ] **Accessibility Testing**: Manual and automated a11y validation

---

## 🚀 Deployment Strategy

### Pre-deployment Checklist
- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility compliance verified
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness confirmed
- [ ] Backward compatibility validated

### Rollout Plan
1. **Development**: Feature complete with comprehensive testing
2. **Staging**: Full functionality testing with production-like data
3. **Production**: Gradual rollout with monitoring
4. **Monitoring**: Track performance metrics and user feedback
5. **Optimization**: Iterate based on real-world usage data

### Rollback Strategy
- **Configuration Reset**: Ability to disable slider mode instantly
- **Image Fallback**: Automatic fallback to single image mode
- **Database Backup**: Point-in-time recovery for configuration data
- **CDN Rollback**: Quick asset rollback if needed

---

## 📋 Implementation Timeline

### Week 1: Foundation (15-21 hours total)
- **Days 1-2**: Phase 1 - Data model and service layer (6 hours)
- **Days 3-5**: Phase 2 - Admin interface development (12 hours)
- **Weekend**: Buffer time for unexpected issues

### Week 2: Frontend & Polish (10-15 hours total)
- **Days 1-3**: Phase 3 - Frontend carousel implementation (10 hours)
- **Days 4-5**: Phase 4 - Testing, optimization, and polish (8 hours)
- **Weekend**: Final testing and documentation

### Risk Mitigation
- **Daily Standups**: Track progress and blockers
- **Feature Flags**: Ability to disable feature if issues arise
- **Progressive Testing**: Test each phase thoroughly before proceeding
- **Documentation**: Maintain detailed implementation notes

---

## 🔧 Development Environment Setup

### Required Tools
- Node.js 18+ with npm/yarn
- Modern browser with dev tools
- Image optimization tools for testing
- Mobile device or emulator for touch testing

### Testing Setup
```bash
# Run development server
npm run dev

# Run tests
npm run test

# Run accessibility audit
npm run a11y-audit

# Performance testing
npm run perf-test
```

### Quality Gates
- **Linting**: ESLint + Prettier compliance
- **Type Safety**: Zero TypeScript errors
- **Testing**: All tests passing
- **Performance**: Bundle size within limits
- **Accessibility**: aXe-core validation passing

---

*This implementation plan follows CLAUDE.md principles and ensures systematic, maintainable code that integrates seamlessly with the existing architecture.*