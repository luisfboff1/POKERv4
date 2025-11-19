/**
 * Mobile-First Utility Functions and Constants
 * Provides responsive spacing, typography, and mobile-optimized patterns
 */

import { cn } from './utils';

/**
 * Responsive spacing system
 * Provides smaller values for mobile, larger for desktop
 */
export const mobileSpacing = {
  // Page-level padding
  page: {
    mobile: 'p-3',      // 12px
    tablet: 'md:p-6',   // 24px
    desktop: 'lg:p-8'   // 32px
  },
  
  // Card padding
  card: {
    mobile: 'p-4',      // 16px
    tablet: 'md:p-5',   // 20px
    desktop: 'lg:p-6'   // 24px
  },
  
  // Section spacing
  section: {
    mobile: 'space-y-3',      // 12px gap
    tablet: 'md:space-y-4',   // 16px gap
    desktop: 'lg:space-y-6'   // 24px gap
  },
  
  // Grid gaps
  grid: {
    mobile: 'gap-3',          // 12px
    tablet: 'md:gap-4',       // 16px
    desktop: 'lg:gap-6'       // 24px
  }
};

/**
 * Mobile-first typography system
 * Provides appropriate font sizes for different screen sizes
 */
export const mobileTypography = {
  // Main page title
  display: {
    mobile: 'text-2xl font-bold tracking-tight',
    desktop: 'md:text-4xl'
  },
  
  // Section titles
  title: {
    mobile: 'text-lg font-semibold',
    desktop: 'md:text-2xl'
  },
  
  // Subsection titles
  subtitle: {
    mobile: 'text-sm font-medium',
    desktop: 'md:text-base'
  },
  
  // Body text
  body: {
    mobile: 'text-sm',
    desktop: 'md:text-base'
  },
  
  // Small text, captions
  caption: {
    mobile: 'text-xs text-muted-foreground',
    desktop: 'md:text-sm'
  },
  
  // Tiny text, metadata
  meta: {
    mobile: 'text-xs text-muted-foreground',
    desktop: 'md:text-xs'
  }
};

/**
 * Helper to combine mobile spacing classes
 */
export function getResponsiveSpacing(
  type: 'page' | 'card' | 'section' | 'grid'
): string {
  const spacing = mobileSpacing[type];
  return cn(spacing.mobile, spacing.tablet, spacing.desktop);
}

/**
 * Helper to combine typography classes
 */
export function getResponsiveTypography(
  type: keyof typeof mobileTypography
): string {
  const typo = mobileTypography[type];
  return cn(typo.mobile, typo.desktop);
}

/**
 * Check if running on mobile device
 * (client-side only)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Check if running on touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Mobile-optimized card classes
 * Reduces visual weight on mobile while maintaining desktop appearance
 */
export const mobileCardClasses = {
  // Minimal card for mobile, full card for desktop
  minimal: cn(
    // Mobile: flat, minimal styling
    'rounded-lg bg-surface/30 border border-border/30 p-4',
    // Desktop: full card with shadow
    'md:rounded-xl md:bg-card md:border-border md:p-6 md:shadow-sm'
  ),
  
  // Completely flat on mobile
  flat: cn(
    'rounded-lg bg-transparent p-4',
    'md:rounded-xl md:bg-card md:border md:border-border md:p-6 md:shadow-sm'
  ),
  
  // Default card with reduced padding on mobile
  default: cn(
    'rounded-lg bg-surface border border-border/40 p-4',
    'md:rounded-xl md:bg-card md:border-border md:p-6 md:shadow-sm'
  )
};

/**
 * Touch feedback classes
 * Provides visual and tactile feedback on mobile interactions
 */
export const touchFeedback = {
  // Standard touch feedback
  standard: 'active:scale-95 active:opacity-80 transition-all duration-100',
  
  // Soft touch feedback
  soft: 'active:scale-98 active:opacity-90 transition-all duration-150',
  
  // No scale, just opacity
  subtle: 'active:opacity-70 transition-opacity duration-100'
};

/**
 * Mobile-optimized button sizes
 */
export const mobileTapTargets = {
  // Minimum tap target size (44px recommended)
  minimum: 'min-h-11 min-w-11',
  
  // Standard button
  button: 'h-11 px-4',
  
  // Icon button
  icon: 'h-11 w-11',
  
  // Large button (primary actions)
  large: 'h-12 px-6',
  
  // Extra large (FAB, important actions)
  xl: 'h-14 w-14'
};

/**
 * Scroll optimization classes
 */
export const scrollOptimization = {
  // Hide scrollbar
  hideScrollbar: 'scrollbar-hide',
  
  // Snap scroll for carousels
  snapX: 'snap-x snap-mandatory overflow-x-auto',
  snapCenter: 'snap-center',
  snapStart: 'snap-start',
  
  // Smooth scrolling
  smooth: 'scroll-smooth',
  
  // Overscroll behavior
  overscrollNone: 'overscroll-none',
  overscrollContain: 'overscroll-contain'
};

/**
 * Safe area classes for devices with notches
 */
export const safeAreas = {
  top: 'pt-safe',
  bottom: 'pb-safe',
  left: 'pl-safe',
  right: 'pr-safe',
  all: 'p-safe'
};

/**
 * Mobile list item optimization
 */
export const mobileListItem = cn(
  'flex items-center gap-3 p-4',
  'border-b border-border/30 last:border-0',
  'active:bg-accent/50 transition-colors',
  touchFeedback.soft
);

/**
 * Grid system optimized for mobile
 */
export const mobileGrid = {
  // 2 columns on mobile, 4 on desktop
  stats: 'grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6',
  
  // 1 column on mobile, 2 on tablet, 3+ on desktop
  cards: 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6',
  
  // Auto-fit responsive
  autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3 md:gap-6'
};

/**
 * Horizontal scroll container for mobile
 */
export const horizontalScroll = cn(
  'overflow-x-auto pb-2 -mx-3 px-3',
  'md:mx-0 md:px-0 md:overflow-x-visible',
  scrollOptimization.snapX,
  scrollOptimization.hideScrollbar
);

/**
 * Fixed bottom bar for mobile (actions, navigation)
 */
export const fixedBottomBar = cn(
  'fixed bottom-0 left-0 right-0 z-40',
  'bg-background/95 backdrop-blur-lg',
  'border-t border-border/50',
  'p-4 pb-safe',
  'md:static md:bg-transparent md:border-0 md:p-0'
);

/**
 * Floating Action Button positioning
 */
export const fabPosition = {
  bottomRight: cn(
    'fixed z-40 bottom-20 right-4',
    'md:hidden',
    safeAreas.bottom
  ),
  bottomCenter: cn(
    'fixed z-40 bottom-20 left-1/2 -translate-x-1/2',
    'md:hidden',
    safeAreas.bottom
  )
};
