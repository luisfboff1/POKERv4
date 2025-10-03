'use client';

import { useEffect } from 'react';
import { Moon } from 'lucide-react';

export function ThemeToggle() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Botão de toggle agora apenas exibe o ícone, sem alternar tema


  return (
      <button
        type="button"
        aria-label="Tema escuro"
        className="rounded-full p-2 hover:bg-accent transition-colors"
        title="Tema escuro"
        disabled
      >
        <Moon className="h-5 w-5" />
      </button>
  );
}

