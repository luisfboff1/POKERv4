'use client';

import React, { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showHeader?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  variant?: 'glass' | 'solid';
  forceOpaque?: boolean; // ignora variant e aplica fundo sólido
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showHeader = true,
  showCloseButton = true,
  closeOnOverlayClick = true,
  variant = 'solid',
  forceOpaque = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      modal.removeEventListener('keydown', handleTab);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl transition-all duration-300 animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} bg-card/95 backdrop-blur-xl text-card-foreground border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-300`}
      >
        {showHeader && (title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border sticky top-0 z-10 bg-card/80 backdrop-blur-xl shadow-sm">
            {title && <div id="modal-title" className="font-semibold text-lg tracking-tight animate-fade-in-up text-foreground">{title}</div>}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="ml-2"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
        {description && (
          <div className="px-4 md:px-6 py-2 text-muted-foreground text-sm border-b border-border bg-muted/30 backdrop-blur animate-fade-in-up">{description}</div>
        )}
        <div className="flex-1 overflow-y-auto bg-card/50 backdrop-blur text-card-foreground p-4 md:p-6 transition-all duration-300">{children}</div>
      </div>
    </div>
    );
  }

interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export function ModalContent({ children, className = "" }: ModalContentProps) {
  return (
    <div className={`bg-transparent text-foreground ${className}`}>
      {children}
    </div>
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ModalHeader({ children, className = "" }: ModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-6 pb-4 ${className}`}>
      {children}
    </div>
  );
}

interface ModalTitleProps {
  children: ReactNode;
  className?: string;
}

export function ModalTitle({ children, className = "" }: ModalTitleProps) {
  return (
    <h2 className={`text-xl font-semibold tracking-tight ${className}`}>
      {children}
    </h2>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = "" }: ModalFooterProps) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row justify-end gap-2 p-6 pt-4 border-t border-border bg-card/30 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

// Hook para controlar estado do modal
export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// Componente de Modal de Confirmação
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <ModalContent>
        <p className="text-sm text-foreground">{message}</p>
      </ModalContent>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button 
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={handleConfirm}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Hook para modal de confirmação
export function useConfirmModal() {
  const modal = useModal();
  const [config, setConfig] = React.useState<{
    title?: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  } | null>(null);

  const confirm = React.useCallback((options: {
    title?: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }) => {
    setConfig(options);
    modal.open();
  }, [modal]);

  const ConfirmModalComponent = config ? (
    <ConfirmModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      onConfirm={config.onConfirm}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
    />
  ) : null;

  return {
    confirm,
    ConfirmModalComponent,
  };
}

