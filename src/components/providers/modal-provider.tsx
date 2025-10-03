'use client';

import * as React from 'react';

interface ModalState {
  id: string;
  isOpen: boolean;
  component: React.ComponentType<any>;
  props?: any;
}

interface ModalContextType {
  modals: ModalState[];
  openModal: (id: string, component: React.ComponentType<any>, props?: any) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

const ModalContext = React.createContext<ModalContextType | null>(null);

export function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: React.ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modals, setModals] = React.useState<ModalState[]>([]);

  const openModal = React.useCallback((id: string, component: React.ComponentType<any>, props?: any) => {
    setModals(prev => [
      ...prev.filter(modal => modal.id !== id), // Remove if already exists
      { id, isOpen: true, component, props }
    ]);
  }, []);

  const closeModal = React.useCallback((id: string) => {
    setModals(prev => prev.map(modal => 
      modal.id === id ? { ...modal, isOpen: false } : modal
    ));
    
    // Remove modal from state after animation
    setTimeout(() => {
      setModals(prev => prev.filter(modal => modal.id !== id));
    }, 300);
  }, []);

  const closeAllModals = React.useCallback(() => {
    setModals(prev => prev.map(modal => ({ ...modal, isOpen: false })));
    
    setTimeout(() => {
      setModals([]);
    }, 300);
  }, []);

  const value = React.useMemo(() => ({
    modals,
    openModal,
    closeModal,
    closeAllModals,
  }), [modals, openModal, closeModal, closeAllModals]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map(({ id, component: Component, isOpen, props }) => (
        <Component
          key={id}
          isOpen={isOpen}
          onClose={() => closeModal(id)}
          {...props}
        />
      ))}
    </ModalContext.Provider>
  );
}

// Hook for easy modal management
export function useModal(id: string) {
  const { openModal, closeModal, modals } = useModalContext();
  
  const isOpen = modals.some(modal => modal.id === id && modal.isOpen);
  
  const open = React.useCallback((component: React.ComponentType<any>, props?: any) => {
    openModal(id, component, props);
  }, [id, openModal]);
  
  const close = React.useCallback(() => {
    closeModal(id);
  }, [id, closeModal]);
  
  return {
    isOpen,
    open,
    close,
  };
}