'use client';

import React, { ReactNode } from 'react';
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
}: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={handleOverlayClick}
    >
      <div
        className={`relative w-full ${sizeClasses[size]}
          text-card-foreground border border-border rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col
          animate-in fade-in-0 zoom-in-95 duration-300
          ${variant === 'glass'
            ? 'bg-card/80 supports-[backdrop-filter]:bg-card/70 backdrop-blur'
            : 'bg-background'}
        `}
      >
        {/* Header */}
        {showHeader && (title || showCloseButton) && (
          <div className={`flex items-center justify-between p-4 md:p-6 border-b border-border sticky top-0 z-10 ${variant === 'glass' ? 'bg-card/70 backdrop-blur' : 'bg-background'}`}> 
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4 h-8 w-8 p-0 text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${variant === 'glass' ? 'bg-card/60' : 'bg-background'} text-card-foreground p-4 md:p-6`}>{children}</div>
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: ReactNode;
}

export function ModalHeader({ children }: ModalHeaderProps) {
  return (
    <div className="p-6 pb-0">
      {children}
    </div>
  );
}

interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export function ModalContent({ children, className = "" }: ModalContentProps) {
  return (
    <div className={`p-6 bg-background text-foreground ${className}`}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = "" }: ModalFooterProps) {
  return (
    <div className={`flex justify-end gap-2 p-6 pt-0 border-t border-border bg-background ${className}`}>
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

export default Modal;