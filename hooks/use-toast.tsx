'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [timeouts, setTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timeout = timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      setTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [timeouts]);

  const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID?.() || Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...newToast, id }]);

    // Auto dismiss after 5 seconds
    const timeout = setTimeout(() => {
      dismiss(id);
    }, 5000);

    setTimeouts(prev => {
      const newMap = new Map(prev);
      newMap.set(id, timeout);
      return newMap;
    });
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 max-w-sm w-full">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg p-4 shadow-lg ${
                t.variant === 'destructive'
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className="font-semibold">{t.title}</h3>
              {t.description && (
                <p className={`text-sm mt-1 ${t.variant === 'destructive' ? 'text-red-100' : 'text-gray-600'}`}>
                  {t.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
