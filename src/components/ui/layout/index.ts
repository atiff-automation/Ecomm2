/**
 * Layout Components - JRM E-commerce Platform
 * Central export for all layout components
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

// Container exports
export {
  Container,
  SmallContainer,
  MediumContainer,
  LargeContainer,
  XLargeContainer,
  FullContainer,
  PageContainer,
  SectionContainer,
  HeroContainer,
} from './Container';
export type { ContainerProps, ContainerSize } from './Container';

// Grid exports
export {
  Grid,
  GridItem,
  ProductGrid,
  CompactProductGrid,
  SearchResultsGrid,
  WishlistGrid,
  CategoryGrid,
  FeatureGrid,
  BlogGrid,
  TestimonialGrid,
  AutoFitGrid,
  AutoFillGrid,
} from './Grid';
export type {
  GridProps,
  GridItemProps,
  GridCols,
  GridGap,
  GridItemSpan,
} from './Grid';

// Section exports
export {
  Section,
  SectionHeader,
  SectionFooter,
  SectionWithContainer,
  HeroSection,
  FeatureSection,
  ProductSection,
  TestimonialSection,
  CallToActionSection,
  FooterSection,
} from './Section';
export type {
  SectionProps,
  SectionHeaderProps,
  SectionFooterProps,
  SectionWithContainerProps,
  SectionVariant,
  SectionSize,
  SectionDecoration,
} from './Section';

// Stack exports
export {
  Stack,
  StackItem,
  Spacer,
  VStack,
  HStack,
  ResponsiveStack,
  CardStack,
  FormStack,
  ButtonStack,
  NavStack,
  ContentStack,
  FeatureStack,
} from './Stack';
export type {
  StackProps,
  StackItemProps,
  SpacerProps,
  StackDirection,
  StackSpacing,
  StackAlign,
  StackJustify,
} from './Stack';

// Layout composition utilities
export const layoutUtils = {
  // Common layout patterns
  pageLayout: 'min-h-screen flex flex-col',
  contentLayout: 'flex-1 flex flex-col',
  sidebarLayout: 'flex min-h-screen',

  // Responsive utilities
  hideOnMobile: 'hidden md:block',
  hideOnDesktop: 'block md:hidden',
  showOnMobile: 'block md:hidden',
  showOnDesktop: 'hidden md:block',

  // Common spacing
  sectionSpacing: 'py-16 lg:py-20',
  contentSpacing: 'space-y-6 lg:space-y-8',

  // Layout helpers
  centered: 'flex items-center justify-center',
  fullHeight: 'min-h-screen',
  fullWidth: 'w-full',

  // Grid helpers
  autoGrid: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6',
  responsiveGrid:
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
} as const;

// Layout breakpoints for programmatic use
export const layoutBreakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Common layout configurations
export const layoutConfigs = {
  // Page layouts
  defaultPage: {
    container: 'xl' as const,
    section: 'md' as const,
    spacing: 'lg' as const,
  },

  // Product layouts
  productGrid: {
    cols: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
    gap: 'md' as const,
    spacing: 'lg' as const,
  },

  // Feature layouts
  featureGrid: {
    cols: { xs: 1, md: 2, lg: 3 },
    gap: 'xl' as const,
    spacing: 'xl' as const,
  },

  // Content layouts
  contentStack: {
    spacing: 'md' as const,
    align: 'stretch' as const,
  },
} as const;

// Export layout types
export type LayoutBreakpoint = keyof typeof layoutBreakpoints;
export type LayoutConfig = typeof layoutConfigs;
export type LayoutUtil = keyof typeof layoutUtils;
