'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './button';

export interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = 'ghost', 
  size = 'icon',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant={variant} size={size}>
        <Sun className="h-4 w-4" />
        {showLabel && <span className="ml-2">Toggle theme</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {showLabel && (
        <span className="ml-2">
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}