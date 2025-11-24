# Click Pages Builder Enhancements - Implementation Plan

**Feature**: Advanced Styling & Customization System
**Version**: 2.0.0
**Status**: Planning Phase
**Target Completion**: 5-7 days
**Last Updated**: 2025-01-24

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Industry Research](#industry-research)
4. [Architecture Principles](#architecture-principles)
5. [Database Schema Updates](#database-schema-updates)
6. [Type System](#type-system)
7. [Constants & Configuration](#constants--configuration)
8. [Component Architecture](#component-architecture)
9. [Phase 1: Essential Styling](#phase-1-essential-styling)
10. [Phase 2: Advanced Styling](#phase-2-advanced-styling)
11. [Phase 3: Pro Features](#phase-3-pro-features)
12. [Global Theme System](#global-theme-system)
13. [Frontend Rendering](#frontend-rendering)
14. [Testing Requirements](#testing-requirements)
15. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Purpose
Transform the Click Pages builder from a basic block editor into a professional-grade page builder with comprehensive styling controls comparable to Elementor, Unbounce, and modern 2025 page builders.

### Key Enhancements

**Phase 1: Essential Styling**
- ✅ Typography controls (font, size, weight, line height, letter spacing, color)
- ✅ Color system with opacity and brand palette
- ✅ Spacing controls (padding, margin)
- ✅ Border controls (width, style, radius, color)
- ✅ Background controls (solid, gradient, image)
- ✅ Rich text editor (TipTap integration)

**Phase 2: Advanced Styling**
- ✅ Shadow/Effects (box shadow, text shadow, opacity)
- ✅ Hover effects for interactive elements
- ✅ Responsive controls (desktop/tablet/mobile)
- ✅ Visibility toggles per breakpoint

**Phase 3: Pro Features**
- ✅ Entrance animations (fade, slide, zoom, bounce)
- ✅ Scroll-based animations
- ✅ Custom CSS field
- ✅ Custom CSS classes

**Global Features**
- ✅ Global theme settings (brand colors, fonts)
- ✅ Google Fonts integration
- ✅ Reusable color palette

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Scope** | All 3 phases before MVP | Complete styling system is table stakes for modern builders |
| **Global Styles** | Yes | Ensures brand consistency across all pages |
| **Rich Text Editor** | Yes (TipTap) | Already installed, better UX than raw HTML |
| **Font Library** | Google Fonts | Industry standard, free, performant with Next.js |
| **Color Palette** | Brand colors system | Speeds up design, maintains consistency |
| **Presets** | No (not in MVP) | Keep simple, add later if needed |

---

## Current State Analysis

### What We Have ✅

```typescript
// Basic block settings (example: HERO block)
{
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  overlayOpacity: number;
  textAlignment: 'left' | 'center' | 'right';
  ctaText: string;
  ctaUrl: string;
  showCountdown: boolean;
}
```

**Available Controls:**
- Text inputs
- Text alignment (3 options)
- Image URL input
- Boolean switches
- Opacity slider (single use case)
- Simple select dropdowns

### What We're Missing ❌

**Typography:**
- ❌ Font family selection
- ❌ Font size control
- ❌ Font weight control
- ❌ Line height
- ❌ Letter spacing
- ❌ Text transform (uppercase/lowercase)
- ❌ Text color picker

**Colors & Backgrounds:**
- ❌ Color picker with opacity
- ❌ Gradient backgrounds
- ❌ Background color control
- ❌ Text color for each element
- ❌ Border color

**Spacing:**
- ❌ Padding controls
- ❌ Margin controls
- ❌ Individual side controls (top/right/bottom/left)

**Borders:**
- ❌ Border width
- ❌ Border style (solid/dashed/dotted)
- ❌ Border radius (rounded corners)
- ❌ Border color

**Effects:**
- ❌ Box shadow
- ❌ Text shadow
- ❌ Hover effects
- ❌ Opacity control

**Advanced:**
- ❌ Responsive breakpoints
- ❌ Animations
- ❌ Custom CSS
- ❌ Device visibility toggles

---

## Industry Research

### Modern Page Builder Standards (2025)

Based on analysis of Elementor, Unbounce, Divi, Breakdance, Droip:

#### **Settings Organization**
Modern builders organize controls into **3-4 tabs:**

1. **Content Tab** - Core content (text, images, links)
2. **Style Tab** ⭐ - Visual design (typography, colors, spacing, borders)
3. **Advanced Tab** - Custom CSS, animations, visibility
4. **Responsive Tab** - Device-specific settings

#### **Typography Controls**
Industry standard includes:
- Font Family (dropdown with Google Fonts)
- Font Size (slider with units: px/em/rem)
- Font Weight (100-900)
- Line Height (1.0-3.0)
- Letter Spacing (-2px to 10px)
- Text Transform (none/uppercase/lowercase/capitalize)
- Text Color (color picker)

#### **Color System**
- Global color palette (Primary, Secondary, Accent, Text, Background)
- Color picker with:
  - Hex/RGB/HSL input
  - Opacity slider
  - Swatches (brand colors + recent colors)
  - Eyedropper tool

#### **Spacing System**
- Unified control with lock/unlock
- Individual side controls (top/right/bottom/left)
- Visual padding/margin preview
- Presets (xs/sm/md/lg/xl)

#### **Responsive Controls**
- Breakpoints: Desktop (≥1024px), Tablet (768-1023px), Mobile (<768px)
- Different values per breakpoint
- Hide on device toggles
- Preview modes

---

## Architecture Principles

### Coding Standards Compliance

Following `claudedocs/CODING_STANDARDS.md`:

#### **1. Single Source of Truth**
```typescript
// ✅ GOOD: Centralized configuration
export const STYLE_CONSTANTS = {
  TYPOGRAPHY: {
    FONT_SIZES: { min: 12, max: 72, default: 16 },
    FONT_WEIGHTS: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    LINE_HEIGHT: { min: 1.0, max: 3.0, default: 1.5 },
  },
} as const;

// ❌ BAD: Hardcoded values
if (fontSize > 72) { } // FORBIDDEN
```

#### **2. No Hardcoding**
```typescript
// ✅ GOOD: Use constants
const maxFontSize = STYLE_CONSTANTS.TYPOGRAPHY.FONT_SIZES.max;

// ❌ BAD: Magic numbers
<Slider max={72} /> // FORBIDDEN
```

#### **3. Type Safety (No `any`)**
```typescript
// ✅ GOOD: Explicit types
interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  color: string;
}

// ❌ BAD: any type
const settings: any = {}; // WILL BE REJECTED
```

#### **4. Three-Layer Validation**
```
Frontend (Zod client-side) → API (Zod server-side) → Database (Prisma constraints)
```

#### **5. Component Reusability**
```typescript
// ✅ GOOD: Reusable controls
<TypographyControls
  value={settings.typography}
  onChange={(typography) => updateSettings({ typography })}
/>

// ❌ BAD: Duplicate controls per block
// Repeating the same controls in every block editor
```

#### **6. Separation of Concerns**
```
📁 components/click-pages/admin/controls/  ← UI Controls (reusable)
📁 components/click-pages/admin/blocks/    ← Block Editors (use controls)
📁 components/click-pages/frontend/blocks/ ← Frontend Rendering
📁 lib/click-page/                         ← Business logic
```

### Design Patterns

**1. Composition Over Inheritance**
```typescript
// Block settings composed of reusable style objects
interface BlockSettings {
  content: ContentSettings;      // Block-specific
  typography: TypographySettings; // Shared
  spacing: SpacingSettings;       // Shared
  borders: BorderSettings;        // Shared
  effects: EffectSettings;        // Shared
}
```

**2. Factory Pattern for Defaults**
```typescript
// Create default settings with proper types
export function createDefaultTypography(): TypographySettings {
  return {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none',
    color: '#000000',
  };
}
```

**3. Observer Pattern for Updates**
```typescript
// Centralized update handler
const handleStyleUpdate = <K extends keyof StyleSettings>(
  key: K,
  value: StyleSettings[K]
) => {
  onUpdate({
    settings: {
      ...block.settings,
      [key]: value,
    },
  });
};
```

---

## Database Schema Updates

### Updated Prisma Schema

```prisma
// prisma/schema.prisma

model ClickPage {
  id                String          @id @default(cuid())

  // Core Fields
  title             String          @db.VarChar(200)
  slug              String          @unique @db.VarChar(200)

  // Enhanced Block Content with styling
  blocks            Json            @default("[]")
  // Structure: Array<Block> where each block now includes full styling

  // Global Theme Settings (NEW)
  themeSettings     Json?           @default("{}")
  // Structure: { colors: {...}, fonts: {...} }

  // ... rest of existing fields

  @@map("click_pages")
}
```

### Theme Settings Structure

```typescript
// Stored in ClickPage.themeSettings
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6",
    "accent": "#F59E0B",
    "text": "#1F2937",
    "textSecondary": "#6B7280",
    "background": "#FFFFFF",
    "backgroundSecondary": "#F9FAFB"
  },
  "fonts": {
    "heading": "Poppins",
    "body": "Inter"
  },
  "spacing": {
    "scale": 1.0  // Multiplier for all spacing values
  }
}
```

### Enhanced Block Settings Structure

```typescript
// Example: HERO block with full styling
{
  "id": "block_123",
  "type": "HERO",
  "sortOrder": 0,
  "settings": {
    // Content (existing)
    "title": "Welcome to Our Store",
    "subtitle": "Limited Time Offer",
    "ctaText": "Shop Now",
    "ctaUrl": "/products",

    // Typography (NEW)
    "typography": {
      "title": {
        "fontFamily": "Poppins",
        "fontSize": 48,
        "fontWeight": 700,
        "lineHeight": 1.2,
        "letterSpacing": -0.5,
        "textTransform": "none",
        "color": "#1F2937"
      },
      "subtitle": {
        "fontFamily": "Inter",
        "fontSize": 24,
        "fontWeight": 400,
        "lineHeight": 1.5,
        "letterSpacing": 0,
        "textTransform": "none",
        "color": "#6B7280"
      }
    },

    // Background (NEW)
    "background": {
      "type": "image",  // solid | gradient | image
      "color": "#FFFFFF",
      "gradient": null,
      "image": {
        "url": "https://...",
        "overlay": {
          "enabled": true,
          "color": "#000000",
          "opacity": 0.3
        }
      }
    },

    // Spacing (NEW)
    "spacing": {
      "padding": {
        "top": 64,
        "right": 32,
        "bottom": 64,
        "left": 32,
        "linked": false
      },
      "margin": {
        "top": 0,
        "right": 0,
        "bottom": 32,
        "left": 0,
        "linked": true
      }
    },

    // Borders (NEW)
    "borders": {
      "width": 0,
      "style": "solid",
      "radius": 8,
      "color": "#E5E7EB"
    },

    // Effects (NEW)
    "effects": {
      "shadow": {
        "enabled": true,
        "preset": "lg",  // none | sm | md | lg | xl | custom
        "custom": {
          "offsetX": 0,
          "offsetY": 4,
          "blur": 6,
          "spread": -1,
          "color": "#00000026"
        }
      },
      "opacity": 1.0,
      "hover": {
        "enabled": false,
        "scale": 1.05,
        "shadow": "xl"
      }
    },

    // Animations (NEW)
    "animations": {
      "entrance": {
        "enabled": true,
        "type": "fade",  // fade | slide | zoom | bounce
        "direction": "up",  // up | down | left | right
        "duration": 600,
        "delay": 0
      },
      "scroll": {
        "enabled": false,
        "trigger": "inView",
        "offset": 0.2,
        "repeat": false
      }
    },

    // Responsive (NEW)
    "responsive": {
      "desktop": {
        "fontSize": 48,
        "padding": { top: 64, right: 32, bottom: 64, left: 32 },
        "hidden": false
      },
      "tablet": {
        "fontSize": 36,
        "padding": { top: 48, right: 24, bottom: 48, left: 24 },
        "hidden": false
      },
      "mobile": {
        "fontSize": 28,
        "padding": { top: 32, right: 16, bottom: 32, left: 16 },
        "hidden": false
      }
    },

    // Advanced (NEW)
    "advanced": {
      "cssClasses": ["custom-hero", "promo-section"],
      "customCSS": ".custom-hero { background-attachment: fixed; }"
    }
  }
}
```

### Migration Script

```sql
-- Add themeSettings column to click_pages
ALTER TABLE "click_pages" ADD COLUMN "theme_settings" JSONB DEFAULT '{}';

-- Set default theme for existing pages
UPDATE "click_pages" SET "theme_settings" = '{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6",
    "accent": "#F59E0B",
    "text": "#1F2937",
    "textSecondary": "#6B7280",
    "background": "#FFFFFF",
    "backgroundSecondary": "#F9FAFB"
  },
  "fonts": {
    "heading": "Poppins",
    "body": "Inter"
  },
  "spacing": {
    "scale": 1.0
  }
}'::jsonb WHERE "theme_settings" = '{}';
```

---

## Type System

### Core Style Types

**File**: `src/types/click-page-styles.types.ts`

```typescript
/**
 * Click Page Style System Types
 * Comprehensive styling types for all blocks
 */

// ============================================================================
// Typography
// ============================================================================

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface TypographySettings {
  fontFamily: string;        // Google Font name or system font
  fontSize: number;          // px
  fontWeight: FontWeight;
  lineHeight: number;        // 1.0 - 3.0
  letterSpacing: number;     // px (-2 to 10)
  textTransform: TextTransform;
  color: string;             // Hex with optional opacity (#RRGGBBAA)
}

// ============================================================================
// Colors & Backgrounds
// ============================================================================

export type BackgroundType = 'solid' | 'gradient' | 'image';
export type GradientType = 'linear' | 'radial';

export interface SolidBackground {
  type: 'solid';
  color: string;  // Hex with optional opacity
}

export interface GradientBackground {
  type: 'gradient';
  gradientType: GradientType;
  angle: number;  // 0-360 for linear
  stops: Array<{
    color: string;
    position: number;  // 0-100%
  }>;
}

export interface ImageBackground {
  type: 'image';
  url: string;
  size: 'cover' | 'contain' | 'auto';
  position: string;  // e.g., "center center"
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  attachment: 'scroll' | 'fixed';
  overlay?: {
    enabled: boolean;
    color: string;
    opacity: number;  // 0-1
  };
}

export type BackgroundSettings = SolidBackground | GradientBackground | ImageBackground;

// ============================================================================
// Spacing
// ============================================================================

export interface SpacingSides {
  top: number;     // px
  right: number;   // px
  bottom: number;  // px
  left: number;    // px
  linked: boolean; // If true, all sides use top value
}

export interface SpacingSettings {
  padding: SpacingSides;
  margin: SpacingSides;
}

// ============================================================================
// Borders
// ============================================================================

export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double';

export interface BorderSettings {
  width: number;        // px
  style: BorderStyle;
  radius: number;       // px
  color: string;        // Hex with optional opacity
}

// ============================================================================
// Effects
// ============================================================================

export type ShadowPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';

export interface CustomShadow {
  offsetX: number;   // px
  offsetY: number;   // px
  blur: number;      // px
  spread: number;    // px
  color: string;     // Hex with opacity
}

export interface ShadowSettings {
  enabled: boolean;
  preset: ShadowPreset;
  custom?: CustomShadow;
}

export interface HoverSettings {
  enabled: boolean;
  scale?: number;          // 1.0 - 1.5
  shadow?: ShadowPreset;
  opacity?: number;        // 0-1
  colorChange?: string;    // New color on hover
}

export interface EffectSettings {
  shadow: ShadowSettings;
  textShadow?: ShadowSettings;
  opacity: number;         // 0-1
  hover?: HoverSettings;
}

// ============================================================================
// Animations
// ============================================================================

export type AnimationType = 'fade' | 'slide' | 'zoom' | 'bounce' | 'none';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

export interface EntranceAnimation {
  enabled: boolean;
  type: AnimationType;
  direction?: AnimationDirection;
  duration: number;  // ms
  delay: number;     // ms
  easing?: string;   // CSS easing function
}

export interface ScrollAnimation {
  enabled: boolean;
  trigger: 'inView' | 'scroll';
  offset: number;    // 0-1 (percentage of viewport)
  repeat: boolean;
}

export interface AnimationSettings {
  entrance: EntranceAnimation;
  scroll: ScrollAnimation;
}

// ============================================================================
// Responsive
// ============================================================================

export interface ResponsiveOverrides {
  fontSize?: number;
  padding?: Omit<SpacingSides, 'linked'>;
  margin?: Omit<SpacingSides, 'linked'>;
  hidden: boolean;
}

export interface ResponsiveSettings {
  desktop: ResponsiveOverrides;
  tablet: ResponsiveOverrides;
  mobile: ResponsiveOverrides;
}

// ============================================================================
// Advanced
// ============================================================================

export interface AdvancedSettings {
  cssClasses: string[];
  customCSS: string;
  htmlAttributes?: Record<string, string>;
}

// ============================================================================
// Complete Style Settings
// ============================================================================

export interface StyleSettings {
  typography?: Partial<Record<string, TypographySettings>>;  // e.g., { title: {...}, subtitle: {...} }
  background?: BackgroundSettings;
  spacing?: SpacingSettings;
  borders?: BorderSettings;
  effects?: EffectSettings;
  animations?: AnimationSettings;
  responsive?: ResponsiveSettings;
  advanced?: AdvancedSettings;
}

// ============================================================================
// Theme Settings
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  background: string;
  backgroundSecondary: string;
}

export interface ThemeFonts {
  heading: string;  // Google Font name
  body: string;     // Google Font name
}

export interface ThemeSettings {
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: {
    scale: number;  // 0.5 - 2.0
  };
}
```

### Extended Block Types

**File**: `src/types/click-page.types.ts` (update)

```typescript
// Update existing block settings to include StyleSettings

import { StyleSettings } from './click-page-styles.types';

export interface HeroBlockSettings {
  // Content
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  textAlignment: 'left' | 'center' | 'right';
  ctaText: string;
  ctaUrl: string;
  showCountdown: boolean;
  countdownEndDate?: Date;

  // Styling (NEW)
  styles?: StyleSettings;
}

// Apply to all block types similarly
export interface TextBlockSettings {
  content: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: number;

  // Styling (NEW)
  styles?: StyleSettings;
}

// ... repeat for all 10 block types
```

---

## Constants & Configuration

### Style Constants

**File**: `src/lib/constants/style-constants.ts`

```typescript
/**
 * Style System Constants
 * All styling-related constants and configurations
 */

export const STYLE_CONSTANTS = {
  // ============================================================================
  // Typography
  // ============================================================================
  TYPOGRAPHY: {
    FONT_SIZES: {
      min: 12,
      max: 72,
      default: 16,
      step: 1,
    },
    FONT_WEIGHTS: [100, 200, 300, 400, 500, 600, 700, 800, 900] as const,
    LINE_HEIGHT: {
      min: 1.0,
      max: 3.0,
      default: 1.5,
      step: 0.1,
    },
    LETTER_SPACING: {
      min: -2,
      max: 10,
      default: 0,
      step: 0.1,
    },
    TEXT_TRANSFORMS: ['none', 'uppercase', 'lowercase', 'capitalize'] as const,
  },

  // ============================================================================
  // Google Fonts
  // ============================================================================
  GOOGLE_FONTS: [
    { name: 'Inter', category: 'sans-serif' },
    { name: 'Roboto', category: 'sans-serif' },
    { name: 'Open Sans', category: 'sans-serif' },
    { name: 'Lato', category: 'sans-serif' },
    { name: 'Montserrat', category: 'sans-serif' },
    { name: 'Poppins', category: 'sans-serif' },
    { name: 'Raleway', category: 'sans-serif' },
    { name: 'Nunito', category: 'sans-serif' },
    { name: 'Work Sans', category: 'sans-serif' },
    { name: 'Playfair Display', category: 'serif' },
    { name: 'Merriweather', category: 'serif' },
    { name: 'Lora', category: 'serif' },
    { name: 'PT Serif', category: 'serif' },
    { name: 'Source Serif Pro', category: 'serif' },
    { name: 'Roboto Mono', category: 'monospace' },
    { name: 'JetBrains Mono', category: 'monospace' },
    { name: 'Fira Code', category: 'monospace' },
    { name: 'Dancing Script', category: 'handwriting' },
    { name: 'Pacifico', category: 'handwriting' },
  ] as const,

  // ============================================================================
  // Colors
  // ============================================================================
  DEFAULT_THEME_COLORS: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    text: '#1F2937',
    textSecondary: '#6B7280',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
  } as const,

  // ============================================================================
  // Spacing
  // ============================================================================
  SPACING: {
    min: 0,
    max: 200,
    default: 16,
    step: 4,
    presets: {
      none: 0,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
      '3xl': 64,
    },
  },

  // ============================================================================
  // Borders
  // ============================================================================
  BORDERS: {
    WIDTH: {
      min: 0,
      max: 10,
      default: 1,
      step: 1,
    },
    RADIUS: {
      min: 0,
      max: 50,
      default: 0,
      step: 1,
      presets: {
        none: 0,
        sm: 2,
        md: 4,
        lg: 8,
        xl: 12,
        '2xl': 16,
        full: 9999,
      },
    },
    STYLES: ['none', 'solid', 'dashed', 'dotted', 'double'] as const,
  },

  // ============================================================================
  // Shadows
  // ============================================================================
  SHADOWS: {
    PRESETS: {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
    CUSTOM: {
      offsetX: { min: -50, max: 50, default: 0, step: 1 },
      offsetY: { min: -50, max: 50, default: 4, step: 1 },
      blur: { min: 0, max: 50, default: 6, step: 1 },
      spread: { min: -50, max: 50, default: 0, step: 1 },
    },
  },

  // ============================================================================
  // Effects
  // ============================================================================
  EFFECTS: {
    OPACITY: {
      min: 0,
      max: 1,
      default: 1,
      step: 0.05,
    },
    HOVER_SCALE: {
      min: 1.0,
      max: 1.5,
      default: 1.05,
      step: 0.05,
    },
  },

  // ============================================================================
  // Animations
  // ============================================================================
  ANIMATIONS: {
    TYPES: ['none', 'fade', 'slide', 'zoom', 'bounce'] as const,
    DIRECTIONS: ['up', 'down', 'left', 'right'] as const,
    DURATION: {
      min: 100,
      max: 2000,
      default: 600,
      step: 100,
    },
    DELAY: {
      min: 0,
      max: 2000,
      default: 0,
      step: 100,
    },
  },

  // ============================================================================
  // Responsive Breakpoints
  // ============================================================================
  BREAKPOINTS: {
    mobile: { max: 767 },
    tablet: { min: 768, max: 1023 },
    desktop: { min: 1024 },
  },
} as const;

// Type helpers
export type GoogleFontName = typeof STYLE_CONSTANTS.GOOGLE_FONTS[number]['name'];
export type ShadowPresetName = keyof typeof STYLE_CONSTANTS.SHADOWS.PRESETS;
export type SpacingPresetName = keyof typeof STYLE_CONSTANTS.SPACING.presets;
export type BorderRadiusPresetName = keyof typeof STYLE_CONSTANTS.BORDERS.RADIUS.presets;
```

---

## Component Architecture

### Directory Structure

```
src/components/click-pages/admin/
├── controls/                          # ⭐ Reusable style controls
│   ├── ColorPicker.tsx               # Color picker with opacity
│   ├── TypographyControls.tsx        # Complete typography panel
│   ├── SpacingControls.tsx           # Padding/margin controls
│   ├── BorderControls.tsx            # Border styling
│   ├── ShadowControls.tsx            # Shadow effects
│   ├── BackgroundControls.tsx        # Background (solid/gradient/image)
│   ├── AnimationControls.tsx         # Entrance & scroll animations
│   ├── ResponsiveControls.tsx        # Breakpoint settings
│   └── FontFamilySelect.tsx          # Google Fonts dropdown
│
├── panels/                            # Settings panels
│   ├── ContentTab.tsx                # Content settings
│   ├── StyleTab.tsx                  # Style settings
│   ├── AdvancedTab.tsx               # Advanced settings
│   ├── ResponsiveTab.tsx             # Responsive settings
│   └── ThemeSettingsPanel.tsx        # Global theme settings
│
├── BlockSettingsPanel.tsx            # Main settings panel (tabbed)
├── BlockPalette.tsx                  # Block type selector
└── SortableBlock.tsx                 # Draggable block wrapper

src/lib/click-page/
├── style-utils.ts                    # Style helper functions
├── google-fonts.ts                   # Google Fonts loader
└── animation-utils.ts                # Animation utilities
```

### Reusable Control Components

#### ColorPicker Component

**File**: `src/components/click-pages/admin/controls/ColorPicker.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  label: string;
  value: string;  // Hex with optional alpha (#RRGGBBAA)
  onChange: (color: string) => void;
  showOpacity?: boolean;
  brandColors?: string[];  // Global theme colors
}

export function ColorPicker({
  label,
  value,
  onChange,
  showOpacity = true,
  brandColors = [],
}: ColorPickerProps) {
  // Parse hex to RGB and opacity
  const hexToRgba = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
    return { r, g, b, a };
  };

  const rgbaToHex = (r: number, g: number, b: number, a: number) => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? alpha : ''}`;
  };

  const { r, g, b, a } = hexToRgba(value);
  const [opacity, setOpacity] = useState(a);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    onChange(opacity < 1 ? `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : hex);
  };

  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0];
    setOpacity(newOpacity);
    onChange(rgbaToHex(r, g, b, newOpacity));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-4">
          {/* Hex Input */}
          <div>
            <Label>Hex Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={value.slice(0, 7)}
                onChange={handleColorChange}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={value}
                onChange={handleColorChange}
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Opacity Slider */}
          {showOpacity && (
            <div>
              <Label>Opacity: {Math.round(opacity * 100)}%</Label>
              <Slider
                value={[opacity]}
                onValueChange={handleOpacityChange}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          )}

          {/* Brand Colors */}
          {brandColors.length > 0 && (
            <div>
              <Label>Brand Colors</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {brandColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChange(color)}
                    className="w-8 h-8 rounded border hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

#### Typography Controls Component

**File**: `src/components/click-pages/admin/controls/TypographyControls.tsx`

```typescript
'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from './ColorPicker';
import { FontFamilySelect } from './FontFamilySelect';
import { STYLE_CONSTANTS } from '@/lib/constants/style-constants';
import type { TypographySettings } from '@/types/click-page-styles.types';

interface TypographyControlsProps {
  value: TypographySettings;
  onChange: (typography: TypographySettings) => void;
  brandColors?: string[];
}

export function TypographyControls({
  value,
  onChange,
  brandColors = [],
}: TypographyControlsProps) {
  const updateField = <K extends keyof TypographySettings>(
    key: K,
    fieldValue: TypographySettings[K]
  ) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="space-y-4">
      {/* Font Family */}
      <FontFamilySelect
        value={value.fontFamily}
        onChange={(font) => updateField('fontFamily', font)}
      />

      {/* Font Size */}
      <div>
        <Label>Font Size: {value.fontSize}px</Label>
        <Slider
          value={[value.fontSize]}
          onValueChange={([size]) => updateField('fontSize', size)}
          min={STYLE_CONSTANTS.TYPOGRAPHY.FONT_SIZES.min}
          max={STYLE_CONSTANTS.TYPOGRAPHY.FONT_SIZES.max}
          step={STYLE_CONSTANTS.TYPOGRAPHY.FONT_SIZES.step}
        />
      </div>

      {/* Font Weight */}
      <div>
        <Label>Font Weight</Label>
        <Select
          value={value.fontWeight.toString()}
          onValueChange={(w) => updateField('fontWeight', parseInt(w) as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STYLE_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.map((weight) => (
              <SelectItem key={weight} value={weight.toString()}>
                {weight} {weight === 400 ? '(Normal)' : weight === 700 ? '(Bold)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Line Height */}
      <div>
        <Label>Line Height: {value.lineHeight}</Label>
        <Slider
          value={[value.lineHeight]}
          onValueChange={([height]) => updateField('lineHeight', height)}
          min={STYLE_CONSTANTS.TYPOGRAPHY.LINE_HEIGHT.min}
          max={STYLE_CONSTANTS.TYPOGRAPHY.LINE_HEIGHT.max}
          step={STYLE_CONSTANTS.TYPOGRAPHY.LINE_HEIGHT.step}
        />
      </div>

      {/* Letter Spacing */}
      <div>
        <Label>Letter Spacing: {value.letterSpacing}px</Label>
        <Slider
          value={[value.letterSpacing]}
          onValueChange={([spacing]) => updateField('letterSpacing', spacing)}
          min={STYLE_CONSTANTS.TYPOGRAPHY.LETTER_SPACING.min}
          max={STYLE_CONSTANTS.TYPOGRAPHY.LETTER_SPACING.max}
          step={STYLE_CONSTANTS.TYPOGRAPHY.LETTER_SPACING.step}
        />
      </div>

      {/* Text Transform */}
      <div>
        <Label>Text Transform</Label>
        <Select
          value={value.textTransform}
          onValueChange={(transform) => updateField('textTransform', transform as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <ColorPicker
        label="Text Color"
        value={value.color}
        onChange={(color) => updateField('color', color)}
        brandColors={brandColors}
      />
    </div>
  );
}
```

#### Spacing Controls Component

**File**: `src/components/click-pages/admin/controls/SpacingControls.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import type { SpacingSides } from '@/types/click-page-styles.types';

interface SpacingControlsProps {
  label: string;
  value: SpacingSides;
  onChange: (spacing: SpacingSides) => void;
}

export function SpacingControls({ label, value, onChange }: SpacingControlsProps) {
  const [isLocked, setIsLocked] = useState(value.linked);

  const handleUnifiedChange = (unified: number) => {
    onChange({
      top: unified,
      right: unified,
      bottom: unified,
      left: unified,
      linked: true,
    });
  };

  const handleSideChange = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    onChange({
      ...value,
      [side]: val,
      linked: false,
    });
  };

  const toggleLock = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    if (newLocked) {
      // When locking, set all sides to top value
      onChange({
        top: value.top,
        right: value.top,
        bottom: value.top,
        left: value.top,
        linked: true,
      });
    } else {
      onChange({ ...value, linked: false });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleLock}
          className="h-8 w-8 p-0"
        >
          {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </Button>
      </div>

      {isLocked ? (
        /* Unified Control */
        <div>
          <Label className="text-xs text-gray-500">All Sides</Label>
          <Input
            type="number"
            value={value.top}
            onChange={(e) => handleUnifiedChange(parseInt(e.target.value) || 0)}
            className="w-full"
          />
        </div>
      ) : (
        /* Individual Sides */
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Top</Label>
            <Input
              type="number"
              value={value.top}
              onChange={(e) => handleSideChange('top', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Right</Label>
            <Input
              type="number"
              value={value.right}
              onChange={(e) => handleSideChange('right', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Bottom</Label>
            <Input
              type="number"
              value={value.bottom}
              onChange={(e) => handleSideChange('bottom', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Left</Label>
            <Input
              type="number"
              value={value.left}
              onChange={(e) => handleSideChange('left', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      {/* Visual Preview */}
      <div className="bg-gray-100 p-4 rounded text-center text-sm text-gray-500">
        {isLocked
          ? `${value.top}px all sides`
          : `${value.top}px ${value.right}px ${value.bottom}px ${value.left}px`}
      </div>
    </div>
  );
}
```

---

## Phase 1: Essential Styling

### Implementation Tasks

**Task 1: Database & Type System**
- ✅ Update Prisma schema with `themeSettings` JSON field
- ✅ Create `click-page-styles.types.ts` with all style types
- ✅ Run migration: `npx prisma migrate dev --name add_theme_and_styling`
- ✅ Generate Prisma client: `npx prisma generate`

**Task 2: Constants**
- ✅ Create `style-constants.ts` with all styling constants
- ✅ Add Google Fonts list
- ✅ Add default theme colors
- ✅ Add spacing, border, shadow presets

**Task 3: ColorPicker Component**
- ✅ Create `ColorPicker.tsx`
- ✅ Implement hex input
- ✅ Implement opacity slider
- ✅ Implement brand color swatches
- ✅ Add recent colors tracking

**Task 4: Typography Controls**
- ✅ Create `FontFamilySelect.tsx` (Google Fonts dropdown)
- ✅ Create `TypographyControls.tsx`
- ✅ Implement all typography settings
- ✅ Integrate with ColorPicker

**Task 5: Spacing Controls**
- ✅ Create `SpacingControls.tsx`
- ✅ Implement unified control
- ✅ Implement lock/unlock mechanism
- ✅ Implement individual side controls
- ✅ Add visual preview

**Task 6: Border Controls**
- ✅ Create `BorderControls.tsx`
- ✅ Implement width slider
- ✅ Implement style select
- ✅ Implement radius slider with presets
- ✅ Integrate with ColorPicker

**Task 7: Background Controls**
- ✅ Create `BackgroundControls.tsx`
- ✅ Implement type selector (solid/gradient/image)
- ✅ Implement solid color picker
- ✅ Implement gradient editor (Phase 2+)
- ✅ Implement image with overlay

**Task 8: Restructure BlockSettingsPanel**
- ✅ Add Tabs component (Content/Style/Advanced/Responsive)
- ✅ Create `ContentTab.tsx` (move existing fields)
- ✅ Create `StyleTab.tsx` (new styling controls)
- ✅ Create `AdvancedTab.tsx` (custom CSS)
- ✅ Create `ResponsiveTab.tsx` (breakpoint controls)

**Task 9: Add Style Tab to All Blocks**
- ✅ Hero Block
- ✅ Text Block
- ✅ CTA Button Block
- ✅ Image Block
- ✅ Spacer Block
- ✅ Divider Block
- ✅ Pricing Table Block
- ✅ Testimonial Block
- ✅ Countdown Timer Block
- ✅ Social Proof Block

**Task 10: TipTap Integration**
- ✅ Replace raw HTML textarea in TEXT block settings
- ✅ Integrate existing `TipTapEditor.tsx`
- ✅ Test formatting preservation

---

## Phase 2: Advanced Styling

### Implementation Tasks

**Task 11: Shadow Controls**
- ✅ Create `ShadowControls.tsx`
- ✅ Implement preset selector (none/sm/md/lg/xl)
- ✅ Implement custom shadow editor
- ✅ Add shadow preview

**Task 12: Hover Effects**
- ✅ Add hover settings to `EffectSettings`
- ✅ Implement scale control
- ✅ Implement shadow on hover
- ✅ Implement opacity on hover
- ✅ Add transition duration control

**Task 13: Responsive Controls**
- ✅ Create `ResponsiveControls.tsx`
- ✅ Implement breakpoint selector (Desktop/Tablet/Mobile)
- ✅ Implement per-breakpoint overrides (fontSize, padding, margin)
- ✅ Add responsive preview mode

**Task 14: Visibility Toggles**
- ✅ Add "Hide on Desktop" checkbox
- ✅ Add "Hide on Tablet" checkbox
- ✅ Add "Hide on Mobile" checkbox
- ✅ Test visibility with media queries

---

## Phase 3: Pro Features

### Implementation Tasks

**Task 15: Entrance Animations**
- ✅ Create `AnimationControls.tsx`
- ✅ Implement animation type selector
- ✅ Implement direction selector
- ✅ Implement duration slider
- ✅ Implement delay slider
- ✅ Add animation preview

**Task 16: Scroll Animations**
- ✅ Implement scroll trigger option
- ✅ Implement offset control (viewport percentage)
- ✅ Implement repeat toggle
- ✅ Integrate with Intersection Observer

**Task 17: Advanced Tab**
- ✅ Create custom CSS textarea
- ✅ Add syntax highlighting (optional)
- ✅ Add CSS validator (optional)
- ✅ Show applied CSS preview

**Task 18: Custom CSS Classes**
- ✅ Add CSS classes input (comma-separated)
- ✅ Apply to block wrapper
- ✅ Document usage in help text

---

## Global Theme System

### Theme Settings Panel

**File**: `src/app/(admin)/admin/click-pages/_components/ThemeSettingsPanel.tsx`

```typescript
'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ColorPicker } from './controls/ColorPicker';
import { FontFamilySelect } from './controls/FontFamilySelect';
import type { ThemeSettings } from '@/types/click-page-styles.types';

interface ThemeSettingsPanelProps {
  theme: ThemeSettings;
  onChange: (theme: ThemeSettings) => void;
}

export function ThemeSettingsPanel({ theme, onChange }: ThemeSettingsPanelProps) {
  const updateColor = (key: keyof ThemeSettings['colors'], color: string) => {
    onChange({
      ...theme,
      colors: { ...theme.colors, [key]: color },
    });
  };

  const updateFont = (key: keyof ThemeSettings['fonts'], font: string) => {
    onChange({
      ...theme,
      fonts: { ...theme.fonts, [key]: font },
    });
  };

  return (
    <div className="space-y-6">
      {/* Brand Colors */}
      <div>
        <h3 className="font-semibold mb-4">Brand Colors</h3>
        <div className="space-y-3">
          <ColorPicker
            label="Primary Color"
            value={theme.colors.primary}
            onChange={(color) => updateColor('primary', color)}
          />
          <ColorPicker
            label="Secondary Color"
            value={theme.colors.secondary}
            onChange={(color) => updateColor('secondary', color)}
          />
          <ColorPicker
            label="Accent Color"
            value={theme.colors.accent}
            onChange={(color) => updateColor('accent', color)}
          />
          <ColorPicker
            label="Text Color"
            value={theme.colors.text}
            onChange={(color) => updateColor('text', color)}
          />
          <ColorPicker
            label="Background Color"
            value={theme.colors.background}
            onChange={(color) => updateColor('background', color)}
          />
        </div>
      </div>

      {/* Typography */}
      <div>
        <h3 className="font-semibold mb-4">Default Fonts</h3>
        <div className="space-y-3">
          <FontFamilySelect
            label="Heading Font"
            value={theme.fonts.heading}
            onChange={(font) => updateFont('heading', font)}
          />
          <FontFamilySelect
            label="Body Font"
            value={theme.fonts.body}
            onChange={(font) => updateFont('body', font)}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="border rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-500">Preview</p>
        <div
          style={{
            backgroundColor: theme.colors.background,
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <h1
            style={{
              fontFamily: theme.fonts.heading,
              color: theme.colors.primary,
              fontSize: '24px',
              marginBottom: '8px',
            }}
          >
            Heading Text
          </h1>
          <p
            style={{
              fontFamily: theme.fonts.body,
              color: theme.colors.text,
              fontSize: '16px',
            }}
          >
            Body text with secondary color.
          </p>
          <button
            style={{
              backgroundColor: theme.colors.accent,
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '4px',
              marginTop: '8px',
            }}
          >
            Accent Button
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Google Fonts Integration

**File**: `src/lib/click-page/google-fonts.ts`

```typescript
/**
 * Google Fonts Integration
 * Dynamic font loading with Next.js optimization
 */

import { STYLE_CONSTANTS } from '@/lib/constants/style-constants';

/**
 * Generate Google Fonts URL for dynamic loading
 * @param fonts Array of font names to load
 * @returns Google Fonts CSS URL
 */
export function generateGoogleFontsURL(fonts: string[]): string {
  if (fonts.length === 0) return '';

  // Remove duplicates
  const uniqueFonts = Array.from(new Set(fonts));

  // Format font names for URL
  const formattedFonts = uniqueFonts
    .map((font) => {
      // Replace spaces with +
      const formatted = font.replace(/ /g, '+');
      // Add weights (we'll load multiple weights for flexibility)
      return `${formatted}:wght@100;200;300;400;500;600;700;800;900`;
    })
    .join('&family=');

  return `https://fonts.googleapis.com/css2?family=${formattedFonts}&display=swap`;
}

/**
 * Extract all fonts used in a Click Page
 * @param blocks Array of blocks
 * @param theme Theme settings
 * @returns Array of unique font names
 */
export function extractFontsFromPage(blocks: any[], theme?: any): string[] {
  const fonts = new Set<string>();

  // Add theme fonts
  if (theme?.fonts?.heading) fonts.add(theme.fonts.heading);
  if (theme?.fonts?.body) fonts.add(theme.fonts.body);

  // Extract fonts from blocks
  blocks.forEach((block) => {
    const typography = block.settings?.styles?.typography;
    if (typography && typeof typography === 'object') {
      Object.values(typography).forEach((typo: any) => {
        if (typo?.fontFamily) {
          fonts.add(typo.fontFamily);
        }
      });
    }
  });

  return Array.from(fonts);
}

/**
 * Preload Google Fonts (for head section)
 * @param fonts Array of font names
 * @returns Array of link tags
 */
export function generateFontPreloadTags(fonts: string[]): string[] {
  if (fonts.length === 0) return [];

  const url = generateGoogleFontsURL(fonts);

  return [
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link rel="stylesheet" href="${url}">`,
  ];
}
```

**Usage in Frontend Page**:

```typescript
// src/app/click/[slug]/page.tsx
import { extractFontsFromPage, generateFontPreloadTags } from '@/lib/click-page/google-fonts';

export default function ClickPageView({ clickPage }) {
  const fonts = extractFontsFromPage(clickPage.blocks, clickPage.themeSettings);
  const fontTags = generateFontPreloadTags(fonts);

  return (
    <>
      <head>
        {fontTags.map((tag, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: tag }} />
        ))}
      </head>
      {/* ... rest of page */}
    </>
  );
}
```

---

## Frontend Rendering

### Style Application Utility

**File**: `src/lib/click-page/style-utils.ts`

```typescript
/**
 * Style Application Utilities
 * Convert style settings to inline CSS and classes
 */

import type {
  TypographySettings,
  BackgroundSettings,
  SpacingSettings,
  BorderSettings,
  EffectSettings,
  StyleSettings,
} from '@/types/click-page-styles.types';
import { STYLE_CONSTANTS } from '@/lib/constants/style-constants';

/**
 * Convert typography settings to CSS properties
 */
export function typographyToCSS(typography: TypographySettings): React.CSSProperties {
  return {
    fontFamily: typography.fontFamily,
    fontSize: `${typography.fontSize}px`,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    letterSpacing: `${typography.letterSpacing}px`,
    textTransform: typography.textTransform,
    color: typography.color,
  };
}

/**
 * Convert background settings to CSS properties
 */
export function backgroundToCSS(background: BackgroundSettings): React.CSSProperties {
  if (background.type === 'solid') {
    return { backgroundColor: background.color };
  }

  if (background.type === 'gradient') {
    const stops = background.stops
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(', ');
    return {
      background:
        background.gradientType === 'linear'
          ? `linear-gradient(${background.angle}deg, ${stops})`
          : `radial-gradient(circle, ${stops})`,
    };
  }

  if (background.type === 'image') {
    return {
      backgroundImage: `url(${background.url})`,
      backgroundSize: background.size,
      backgroundPosition: background.position,
      backgroundRepeat: background.repeat,
      backgroundAttachment: background.attachment,
    };
  }

  return {};
}

/**
 * Convert spacing settings to CSS properties
 */
export function spacingToCSS(spacing: SpacingSettings): React.CSSProperties {
  return {
    paddingTop: `${spacing.padding.top}px`,
    paddingRight: `${spacing.padding.right}px`,
    paddingBottom: `${spacing.padding.bottom}px`,
    paddingLeft: `${spacing.padding.left}px`,
    marginTop: `${spacing.margin.top}px`,
    marginRight: `${spacing.margin.right}px`,
    marginBottom: `${spacing.margin.bottom}px`,
    marginLeft: `${spacing.margin.left}px`,
  };
}

/**
 * Convert border settings to CSS properties
 */
export function borderToCSS(borders: BorderSettings): React.CSSProperties {
  return {
    borderWidth: `${borders.width}px`,
    borderStyle: borders.style,
    borderRadius: `${borders.radius}px`,
    borderColor: borders.color,
  };
}

/**
 * Convert shadow settings to CSS box-shadow
 */
export function shadowToCSS(shadow: EffectSettings['shadow']): React.CSSProperties {
  if (!shadow.enabled || shadow.preset === 'none') {
    return { boxShadow: 'none' };
  }

  if (shadow.preset !== 'custom') {
    return { boxShadow: STYLE_CONSTANTS.SHADOWS.PRESETS[shadow.preset] };
  }

  if (shadow.custom) {
    const { offsetX, offsetY, blur, spread, color } = shadow.custom;
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`,
    };
  }

  return {};
}

/**
 * Combine all style settings into CSS properties
 */
export function styleSettingsToCSS(
  styles: StyleSettings,
  elementKey?: string
): React.CSSProperties {
  const css: React.CSSProperties = {};

  // Typography
  if (styles.typography && elementKey && styles.typography[elementKey]) {
    Object.assign(css, typographyToCSS(styles.typography[elementKey]));
  }

  // Background
  if (styles.background) {
    Object.assign(css, backgroundToCSS(styles.background));
  }

  // Spacing
  if (styles.spacing) {
    Object.assign(css, spacingToCSS(styles.spacing));
  }

  // Borders
  if (styles.borders) {
    Object.assign(css, borderToCSS(styles.borders));
  }

  // Effects
  if (styles.effects) {
    if (styles.effects.shadow) {
      Object.assign(css, shadowToCSS(styles.effects.shadow));
    }
    if (styles.effects.opacity !== undefined) {
      css.opacity = styles.effects.opacity;
    }
  }

  return css;
}

/**
 * Generate responsive CSS classes
 */
export function generateResponsiveClasses(
  styles: StyleSettings,
  blockId: string
): string {
  if (!styles.responsive) return '';

  const classes: string[] = [];

  // Hide on specific devices
  if (styles.responsive.desktop.hidden) classes.push('hidden lg:block');
  if (styles.responsive.tablet.hidden) classes.push('md:hidden lg:block');
  if (styles.responsive.mobile.hidden) classes.push('block md:hidden');

  return classes.join(' ');
}

/**
 * Generate animation CSS
 */
export function generateAnimationCSS(styles: StyleSettings): string {
  if (!styles.animations?.entrance.enabled) return '';

  const { type, direction, duration, delay } = styles.animations.entrance;

  const animations = {
    fade: 'opacity: 0; animation: fadeIn',
    slide: `opacity: 0; transform: translateY(${direction === 'up' ? '20px' : '-20px'}); animation: slideIn${direction}`,
    zoom: 'opacity: 0; transform: scale(0.95); animation: zoomIn',
    bounce: 'animation: bounceIn',
  };

  return `${animations[type]} ${duration}ms ${delay}ms forwards;`;
}
```

### Block Rendering with Styles

**Example**: `src/components/click-pages/frontend/blocks/HeroBlock.tsx`

```typescript
'use client';

import { HeroBlockSettings } from '@/types/click-page.types';
import { styleSettingsToCSS, generateResponsiveClasses } from '@/lib/click-page/style-utils';
import { Button } from '@/components/ui/button';

interface HeroBlockProps {
  settings: HeroBlockSettings;
  blockId: string;
}

export default function HeroBlock({ settings, blockId }: HeroBlockProps) {
  const { title, subtitle, description, ctaText, ctaUrl, styles } = settings;

  // Generate CSS from style settings
  const containerStyle = styleSettingsToCSS(styles);
  const titleStyle = styleSettingsToCSS(styles, 'title');
  const subtitleStyle = styleSettingsToCSS(styles, 'subtitle');

  // Responsive classes
  const responsiveClasses = generateResponsiveClasses(styles, blockId);

  return (
    <section
      data-block-id={blockId}
      style={containerStyle}
      className={`hero-block ${responsiveClasses} ${styles?.advanced?.cssClasses.join(' ') || ''}`}
    >
      <div className="container mx-auto">
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <h2 style={subtitleStyle}>{subtitle}</h2>}
        {description && <p>{description}</p>}
        {ctaText && (
          <Button asChild>
            <a href={ctaUrl}>{ctaText}</a>
          </Button>
        )}
      </div>
    </section>
  );
}
```

---

## Testing Requirements

### Unit Tests

**Typography Controls Test**:

```typescript
// __tests__/click-pages/controls/TypographyControls.test.tsx

describe('TypographyControls', () => {
  it('should update font family', () => {
    const onChange = jest.fn();
    render(<TypographyControls value={defaultTypography} onChange={onChange} />);

    // Select new font
    fireEvent.change(screen.getByLabelText('Font Family'), {
      target: { value: 'Poppins' },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fontFamily: 'Poppins' })
    );
  });

  it('should update font size via slider', () => {
    // Test font size slider
  });

  it('should update font weight', () => {
    // Test font weight select
  });
});
```

**Style Utils Test**:

```typescript
// __tests__/click-pages/style-utils.test.ts

describe('styleSettingsToCSS', () => {
  it('should convert typography to CSS', () => {
    const typography: TypographySettings = {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 700,
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none',
      color: '#000000',
    };

    const css = typographyToCSS(typography);

    expect(css).toEqual({
      fontFamily: 'Inter',
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: 1.5,
      letterSpacing: '0px',
      textTransform: 'none',
      color: '#000000',
    });
  });

  it('should convert spacing to CSS', () => {
    // Test spacing conversion
  });

  it('should convert shadow to CSS', () => {
    // Test shadow conversion
  });
});
```

### Integration Tests

**Block Styling Test**:

```typescript
// __tests__/click-pages/integration/block-styling.test.tsx

describe('Block Styling Integration', () => {
  it('should apply typography styles to HERO block', () => {
    const block: HeroBlock = {
      id: 'test-1',
      type: 'HERO',
      sortOrder: 0,
      settings: {
        title: 'Test Hero',
        subtitle: 'Test Subtitle',
        ctaText: 'Click Me',
        ctaUrl: '/test',
        styles: {
          typography: {
            title: {
              fontFamily: 'Poppins',
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: -0.5,
              textTransform: 'none',
              color: '#000000',
            },
          },
          spacing: {
            padding: { top: 64, right: 32, bottom: 64, left: 32, linked: false },
            margin: { top: 0, right: 0, bottom: 0, left: 0, linked: true },
          },
        },
      },
    };

    render(<HeroBlock settings={block.settings} blockId={block.id} />);

    const titleElement = screen.getByText('Test Hero');

    expect(titleElement).toHaveStyle({
      fontFamily: 'Poppins',
      fontSize: '48px',
      fontWeight: 700,
    });
  });

  it('should apply responsive classes correctly', () => {
    // Test responsive visibility
  });
});
```

### Manual Testing Checklist

- [ ] **Typography**: Test all typography controls on all block types
- [ ] **Colors**: Test color picker with opacity on all color fields
- [ ] **Spacing**: Test padding/margin controls with lock/unlock
- [ ] **Borders**: Test border width, style, radius, color
- [ ] **Shadows**: Test shadow presets and custom shadow
- [ ] **Hover Effects**: Test hover states on buttons and images
- [ ] **Animations**: Test entrance animations (fade, slide, zoom, bounce)
- [ ] **Responsive**: Test different breakpoints (desktop/tablet/mobile)
- [ ] **Visibility**: Test hide on device toggles
- [ ] **Google Fonts**: Test font loading on frontend
- [ ] **Theme Colors**: Test global theme color application
- [ ] **Custom CSS**: Test custom CSS field
- [ ] **Cross-Browser**: Test on Chrome, Firefox, Safari, Edge

---

## Implementation Checklist

### Phase 1: Essential Styling

- [ ] **Database**
  - [ ] Add `themeSettings` JSON field to `ClickPage` model
  - [ ] Run migration
  - [ ] Generate Prisma client

- [ ] **Types**
  - [ ] Create `click-page-styles.types.ts`
  - [ ] Define all style interfaces
  - [ ] Update block settings types

- [ ] **Constants**
  - [ ] Create `style-constants.ts`
  - [ ] Add Google Fonts list
  - [ ] Add theme colors
  - [ ] Add presets

- [ ] **Components**
  - [ ] Create `ColorPicker.tsx`
  - [ ] Create `FontFamilySelect.tsx`
  - [ ] Create `TypographyControls.tsx`
  - [ ] Create `SpacingControls.tsx`
  - [ ] Create `BorderControls.tsx`
  - [ ] Create `BackgroundControls.tsx`

- [ ] **Settings Panel**
  - [ ] Restructure with tabs
  - [ ] Create `ContentTab.tsx`
  - [ ] Create `StyleTab.tsx`
  - [ ] Add style controls to all 10 blocks

- [ ] **TipTap**
  - [ ] Integrate into TEXT block
  - [ ] Test formatting

### Phase 2: Advanced Styling

- [ ] **Effects**
  - [ ] Create `ShadowControls.tsx`
  - [ ] Add hover effects

- [ ] **Responsive**
  - [ ] Create `ResponsiveControls.tsx`
  - [ ] Add breakpoint controls
  - [ ] Add visibility toggles

### Phase 3: Pro Features

- [ ] **Animations**
  - [ ] Create `AnimationControls.tsx`
  - [ ] Implement entrance animations
  - [ ] Implement scroll animations

- [ ] **Advanced**
  - [ ] Create `AdvancedTab.tsx`
  - [ ] Add custom CSS field
  - [ ] Add CSS classes input

### Global Features

- [ ] **Theme**
  - [ ] Create `ThemeSettingsPanel.tsx`
  - [ ] Add to page settings
  - [ ] Test brand colors

- [ ] **Fonts**
  - [ ] Create `google-fonts.ts`
  - [ ] Implement font loading
  - [ ] Test performance

- [ ] **Frontend**
  - [ ] Create `style-utils.ts`
  - [ ] Apply styles to all blocks
  - [ ] Test rendering

- [ ] **Testing**
  - [ ] Write unit tests
  - [ ] Write integration tests
  - [ ] Manual testing

---

## Success Criteria

### MVP is complete when:

✅ **Core Features**
- [ ] All 3 phases implemented
- [ ] All controls functional
- [ ] Theme system working
- [ ] Google Fonts loading
- [ ] Frontend rendering correctly

✅ **Quality Standards**
- [ ] All code follows `CODING_STANDARDS.md`
- [ ] No `any` types used
- [ ] All constants centralized
- [ ] Components reusable
- [ ] Unit test coverage ≥80%

✅ **Functionality**
- [ ] Typography controls work on all blocks
- [ ] Color picker works with opacity
- [ ] Spacing controls work (lock/unlock)
- [ ] Borders and shadows apply correctly
- [ ] Animations work smoothly
- [ ] Responsive controls work
- [ ] Custom CSS applies
- [ ] Google Fonts load properly

✅ **User Experience**
- [ ] Settings panel is intuitive
- [ ] Controls are responsive
- [ ] Preview updates in real-time
- [ ] Theme colors apply globally
- [ ] Mobile-friendly

---

**END OF DOCUMENT**

*This document is the SINGLE SOURCE OF TRUTH for Click Pages Builder Enhancements.*
*Last Updated: 2025-01-24*
*Version: 2.0.0*
