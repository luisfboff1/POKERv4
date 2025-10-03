/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System Base Colors
        background: 'hsl(var(--background, 0 0% 100%))',
        foreground: 'hsl(var(--foreground, 224 71.4% 4.1%))',
        
        // Card/Surface Components
        card: {
          DEFAULT: 'hsl(var(--card, 0 0% 100%))',
          foreground: 'hsl(var(--card-foreground, 224 71.4% 4.1%))',
        },
        
        // Popover/Modal Components
        popover: {
          DEFAULT: 'hsl(var(--popover, 0 0% 100%))',
          foreground: 'hsl(var(--popover-foreground, 224 71.4% 4.1%))',
        },
        
        // Primary Brand Colors
        primary: {
          DEFAULT: 'hsl(var(--primary, 262.1 83.3% 57.8%))',
          foreground: 'hsl(var(--primary-foreground, 210 20% 98%))',
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bce5cd',
          300: '#8dd2aa',
          400: '#58b882',
          500: '#38a063',
          600: '#2a824d',
          700: '#22683f',
          800: '#1f5336',
          900: '#1b452d',
        },
        
        // Secondary Brand Colors  
        secondary: {
          DEFAULT: 'hsl(var(--secondary, 220 14.3% 95.9%))',
          foreground: 'hsl(var(--secondary-foreground, 220.9 39.3% 11%))',
        },
        
        // Accent Colors
        accent: {
          DEFAULT: 'hsl(var(--accent, 220 14.3% 95.9%))',
          foreground: 'hsl(var(--accent-foreground, 220.9 39.3% 11%))',
        },
        
        // Muted/Subtle Colors
        muted: {
          DEFAULT: 'hsl(var(--muted, 220 14.3% 95.9%))',
          foreground: 'hsl(var(--muted-foreground, 220 8.9% 46.1%))',
        },
        
        // Destructive/Error Colors
        destructive: {
          DEFAULT: 'hsl(var(--destructive, 0 84.2% 60.2%))',
          foreground: 'hsl(var(--destructive-foreground, 210 20% 98%))',
        },
        
        // Border and Input
        border: 'hsl(var(--border, 220 13% 91%))',
        input: 'hsl(var(--input, 220 13% 91%))',
        ring: 'hsl(var(--ring, 262.1 83.3% 57.8%))',
        
        // Poker-specific colors
        poker: {
          green: {
            50: '#f0f9f4',
            100: '#dcf2e4', 
            200: '#bce5cd',
            300: '#8dd2aa',
            400: '#58b882',
            500: '#38a063',
            600: '#2a824d',
            700: '#22683f',
            800: '#1f5336',
            900: '#1b452d',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
        },
      },
      
      // Border Radius
      borderRadius: {
        'xs': '0.125rem',    // 2px
        'sm': '0.25rem',     // 4px  
        'md': '0.375rem',    // 6px
        'lg': '0.5rem',      // 8px
        'xl': '0.75rem',     // 12px
        '2xl': '1rem',       // 16px
        '3xl': '1.5rem',     // 24px
      },
      
      // Shadows
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(56, 160, 99, 0.15)',
        'poker': '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
      
      // Animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Typography
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      
      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    function ({ addUtilities, addBase, theme }) {
      // Add CSS custom properties
      addBase({
        ':root': {
          // Light mode variables
          '--background': '0 0% 100%',
          '--foreground': '240 10% 3.9%',
          '--card': '0 0% 100%',
          '--card-foreground': '240 10% 3.9%',
          '--popover': '0 0% 100%',
          '--popover-foreground': '240 10% 3.9%',
          '--primary': '142 76% 36%',
          '--primary-foreground': '355 100% 97%',
          '--secondary': '240 4.8% 95.9%',
          '--secondary-foreground': '240 5.9% 10%',
          '--muted': '240 4.8% 95.9%',
          '--muted-foreground': '240 3.8% 46.1%',
          '--accent': '240 4.8% 95.9%',
          '--accent-foreground': '240 5.9% 10%',
          '--destructive': '0 84.2% 60.2%',
          '--destructive-foreground': '0 0% 98%',
          '--border': '240 5.9% 90%',
          '--input': '240 5.9% 90%',
          '--ring': '142 76% 36%',
        },
        '.dark': {
          // Dark mode variables
          '--background': '240 10% 3.9%',
          '--foreground': '0 0% 98%',
          '--card': '240 10% 3.9%',
          '--card-foreground': '0 0% 98%',
          '--popover': '240 10% 3.9%',
          '--popover-foreground': '0 0% 98%',
          '--primary': '142 76% 36%',
          '--primary-foreground': '355 100% 97%',
          '--secondary': '240 3.7% 15.9%',
          '--secondary-foreground': '0 0% 98%',
          '--muted': '240 3.7% 15.9%',
          '--muted-foreground': '240 5% 64.9%',
          '--accent': '240 3.7% 15.9%',
          '--accent-foreground': '0 0% 98%',
          '--destructive': '0 62.8% 30.6%',
          '--destructive-foreground': '0 0% 98%',
          '--border': '240 3.7% 15.9%',
          '--input': '240 3.7% 15.9%',
          '--ring': '142 76% 36%',
        },
      });
      
      // Add utility classes
      addUtilities({
        '.shadow-soft': {
          'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        '.shadow-card': {
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        '.shadow-modal': {
          'box-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        '.bg-poker-pattern': {
          'background-image': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
      });
    }
  ],
}
