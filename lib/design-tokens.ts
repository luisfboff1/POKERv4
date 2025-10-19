/**
 * Design System Tokens
 * Poker Manager - Landing Page
 */

export const designTokens = {
  // Spacing Scale
  spacing: {
    section: 'py-24 md:py-32',
    container: 'py-16 md:py-20',
    element: 'py-8 md:py-12',
    micro: 'py-4 md:py-6',
  },

  // Typography Scale
  typography: {
    hero: 'text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight',
    h1: 'text-4xl md:text-5xl font-bold tracking-tight',
    h2: 'text-3xl md:text-4xl font-bold tracking-tight',
    h3: 'text-2xl md:text-3xl font-semibold',
    lead: 'text-xl md:text-2xl text-muted-foreground',
    body: 'text-base md:text-lg',
    small: 'text-sm md:text-base',
  },

  // Container Widths
  container: {
    sm: 'max-w-3xl mx-auto',
    md: 'max-w-5xl mx-auto',
    lg: 'max-w-7xl mx-auto',
    full: 'max-w-[1400px] mx-auto',
  },

  // Card Styles
  card: {
    base: 'rounded-2xl border border-border backdrop-blur-sm transition-all duration-300',
    hover: 'hover:shadow-2xl hover:-translate-y-1',
    gradient: 'bg-gradient-to-br from-background/80 via-background/60 to-background/40',
  },

  // Button Styles (complementando shadcn)
  button: {
    glow: 'shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60',
  },

  // Animation Durations
  animation: {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500',
  },
} as const;

// Helper function to combine tokens
export const cx = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};
