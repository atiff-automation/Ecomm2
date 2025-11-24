/**
 * Click Page Style Transformer
 * Transforms StyleSettings into CSS properties for frontend rendering
 */

import type {
  StyleSettings,
  TypographySettings,
  SpacingSettings,
  BorderSettings,
  EffectSettings,
  HoverEffects,
  AnimationSettings,
  AdvancedSettings,
  ResponsiveSettings,
} from '@/types/click-page-styles.types';

/**
 * CSS properties object type
 */
export type CSSProperties = Record<string, string | number>;

/**
 * Transform typography settings to CSS
 */
export function transformTypography(typography: TypographySettings): CSSProperties {
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
 * Transform spacing settings to CSS
 */
export function transformSpacing(spacing: SpacingSettings): CSSProperties {
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
 * Transform border settings to CSS
 */
export function transformBorder(border: BorderSettings): CSSProperties {
  return {
    borderTopWidth: `${border.width.top}px`,
    borderRightWidth: `${border.width.right}px`,
    borderBottomWidth: `${border.width.bottom}px`,
    borderLeftWidth: `${border.width.left}px`,
    borderStyle: border.style,
    borderColor: border.color,
    borderTopLeftRadius: `${border.radius.topLeft}px`,
    borderTopRightRadius: `${border.radius.topRight}px`,
    borderBottomRightRadius: `${border.radius.bottomRight}px`,
    borderBottomLeftRadius: `${border.radius.bottomLeft}px`,
  };
}

/**
 * Transform effect settings to CSS
 */
export function transformEffects(effects: EffectSettings): CSSProperties {
  const css: CSSProperties = {
    opacity: effects.opacity,
  };

  // Box shadow
  if (effects.boxShadow?.enabled) {
    const { offsetX, offsetY, blur, spread, color, inset } = effects.boxShadow;
    css.boxShadow = `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
  }

  // Text shadow
  if (effects.textShadow?.enabled) {
    const { offsetX, offsetY, blur, color } = effects.textShadow;
    css.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }

  // Backdrop blur
  if (effects.blur && effects.blur > 0) {
    css.backdropFilter = `blur(${effects.blur}px)`;
  }

  return css;
}

/**
 * Transform hover effects to CSS transition and hover state
 * Returns both base styles and hover styles
 */
export function transformHoverEffects(hover: HoverEffects): {
  base: CSSProperties;
  hover: CSSProperties;
} {
  if (!hover.enabled) {
    return { base: {}, hover: {} };
  }

  const base: CSSProperties = {
    transition: `all ${hover.transition.duration}ms ${hover.transition.easing}`,
  };

  const hoverStyles: CSSProperties = {};

  if (hover.backgroundColor) {
    hoverStyles.backgroundColor = hover.backgroundColor;
  }
  if (hover.textColor) {
    hoverStyles.color = hover.textColor;
  }
  if (hover.borderColor) {
    hoverStyles.borderColor = hover.borderColor;
  }
  if (hover.scale !== undefined && hover.scale !== 1) {
    hoverStyles.transform = `scale(${hover.scale})`;
  }
  if (hover.translateY !== undefined && hover.translateY !== 0) {
    const existingTransform = hoverStyles.transform || '';
    hoverStyles.transform = `${existingTransform} translateY(${hover.translateY}px)`.trim();
  }
  if (hover.boxShadow) {
    const { offsetX, offsetY, blur, spread, color } = hover.boxShadow;
    hoverStyles.boxShadow = `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
  }

  return { base, hover: hoverStyles };
}

/**
 * Transform animation settings to CSS animation
 */
export function transformAnimation(animation: AnimationSettings): CSSProperties {
  if (!animation.enabled || animation.type === 'none') {
    return {};
  }

  const animationValue = `${animation.type} ${animation.duration}ms ${animation.easing} ${animation.delay}ms ${animation.repeat ? (animation.repeatCount === 0 ? 'infinite' : animation.repeatCount) : 1}`;

  return {
    animation: animationValue,
    animationFillMode: 'both',
  };
}

/**
 * Transform advanced settings to CSS
 */
export function transformAdvanced(advanced: AdvancedSettings): CSSProperties {
  const css: CSSProperties = {};

  if (advanced.display) {
    css.display = advanced.display;
  }
  if (advanced.position) {
    css.position = advanced.position;
  }
  if (advanced.zIndex !== undefined) {
    css.zIndex = advanced.zIndex;
  }
  if (advanced.overflow) {
    css.overflow = advanced.overflow;
  }

  return css;
}

/**
 * Transform all style settings to a complete CSS object
 */
export function transformStyleSettings(styles: StyleSettings | undefined): {
  css: CSSProperties;
  hoverCss: CSSProperties;
  customCSS: string;
  customClasses: string[];
  animation: CSSProperties;
} {
  if (!styles) {
    return {
      css: {},
      hoverCss: {},
      customCSS: '',
      customClasses: [],
      animation: {},
    };
  }

  let css: CSSProperties = {};
  let hoverCss: CSSProperties = {};
  let customCSS = '';
  let customClasses: string[] = [];
  let animation: CSSProperties = {};

  // Typography
  if (styles.typography) {
    css = { ...css, ...transformTypography(styles.typography) };
  }

  // Spacing
  if (styles.spacing) {
    css = { ...css, ...transformSpacing(styles.spacing) };
  }

  // Border
  if (styles.border) {
    css = { ...css, ...transformBorder(styles.border) };
  }

  // Effects
  if (styles.effects) {
    css = { ...css, ...transformEffects(styles.effects) };
  }

  // Hover effects
  if (styles.hover) {
    const { base, hover } = transformHoverEffects(styles.hover);
    css = { ...css, ...base };
    hoverCss = hover;
  }

  // Animation
  if (styles.animation) {
    animation = transformAnimation(styles.animation);
  }

  // Advanced
  if (styles.advanced) {
    css = { ...css, ...transformAdvanced(styles.advanced) };
    customCSS = styles.advanced.customCSS || '';
    customClasses = styles.advanced.customClasses || [];
  }

  return { css, hoverCss, customCSS, customClasses, animation };
}

/**
 * Check if block should be hidden on current breakpoint
 */
export function shouldHideOnBreakpoint(
  responsive: ResponsiveSettings | undefined,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): boolean {
  if (!responsive) return false;
  return responsive[breakpoint]?.hidden || false;
}

/**
 * Generate CSS keyframes for animations
 * This should be injected once into the page
 */
export const ANIMATION_KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes slideInDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce {
  0%, 20%, 53%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-30px); }
  70% { transform: translateY(-15px); }
  90% { transform: translateY(-4px); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`;

/**
 * Convert CSS properties object to inline style string
 */
export function cssPropertiesToString(css: CSSProperties): string {
  return Object.entries(css)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabKey}: ${value}`;
    })
    .join('; ');
}

/**
 * Generate responsive CSS media queries
 */
export function generateResponsiveCSS(
  blockId: string,
  responsive: ResponsiveSettings | undefined
): string {
  if (!responsive) return '';

  let css = '';

  // Mobile
  if (responsive.mobile?.hidden) {
    css += `@media (max-width: 767px) { #block-${blockId} { display: none !important; } }\n`;
  }

  // Tablet
  if (responsive.tablet?.hidden) {
    css += `@media (min-width: 768px) and (max-width: 1023px) { #block-${blockId} { display: none !important; } }\n`;
  }

  // Desktop
  if (responsive.desktop?.hidden) {
    css += `@media (min-width: 1024px) { #block-${blockId} { display: none !important; } }\n`;
  }

  return css;
}
