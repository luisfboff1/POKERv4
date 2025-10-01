'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem('theme');
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : mediaQuery.matches;

    setIsDark(shouldUseDark);
    applyTheme(shouldUseDark);
    setMounted(true);

    if (!storedTheme) {
      const handler = (event: MediaQueryListEvent) => {
        setIsDark(event.matches);
        applyTheme(event.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    return () => {};
  }, []);

  const toggle = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
    applyTheme(nextIsDark);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

