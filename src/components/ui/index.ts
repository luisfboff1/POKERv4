// UI Component Library Index
// This file provides centralized exports for all UI components

// Basic Components
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

export { Input } from './input';
export type { InputProps } from './input';

export { Label } from './label';
export type { LabelProps } from './label';

export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';

// Layout Components
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './card';

export { Sidebar } from './sidebar';
export type { SidebarProps } from './sidebar';

// Data Display Components
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from './table';

// Overlay Components
export { 
  Modal, 
  ModalHeader, 
  ModalContent, 
  ModalFooter, 
  ConfirmModal,
  useModal,
  useConfirmModal 
} from './modal';

// Feedback Components
export { LoadingSpinner, LoadingState, EmptyState, ErrorState } from './loading';

// Theme Components
export { ThemeProvider } from './theme-provider';

// Utilities
export { cn } from '../../../lib/utils';