import * as React from 'react';
import { cn } from '@/lib/utils';
import { fabPosition } from '@/lib/mobile-utils';

interface FABProps {
  /**
   * Icon to display in the FAB
   */
  icon: React.ReactNode;
  
  /**
   * Optional label for extended FAB
   */
  label?: string;
  
  /**
   * Click handler
   */
  onClick: () => void;
  
  /**
   * Position of the FAB
   * @default 'bottomRight'
   */
  position?: 'bottomRight' | 'bottomCenter';
  
  /**
   * Variant style
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline';
  
  /**
   * Size of the FAB
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
  /**
   * Whether to show the FAB
   * @default true
   */
  visible?: boolean;
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * Accessibility label
   */
  ariaLabel?: string;
}

/**
 * Floating Action Button (FAB) component
 * Mobile-only primary action button
 * Hidden on desktop (md breakpoint and up)
 * 
 * @example
 * <FAB
 *   icon={<Plus className="h-5 w-5" />}
 *   label="Nova Sessão"
 *   onClick={() => router.push('/dashboard/new')}
 *   position="bottomRight"
 * />
 */
export const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ 
    icon, 
    label, 
    onClick, 
    position = 'bottomRight',
    variant = 'primary',
    size = 'default',
    visible = true,
    className,
    ariaLabel,
    ...props 
  }, ref) => {
    // Position classes
    const positionClasses = fabPosition[position];
    
    // Size classes
    const sizeClasses = {
      sm: label ? 'px-4 py-3' : 'p-3',
      default: label ? 'px-6 py-4' : 'p-4',
      lg: label ? 'px-8 py-5' : 'p-5'
    };
    
    // Variant classes
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground shadow-2xl shadow-primary/50 hover:shadow-primary/70',
      secondary: 'bg-secondary text-secondary-foreground shadow-2xl hover:shadow-xl',
      outline: 'bg-background text-foreground border-2 border-primary shadow-xl hover:bg-primary hover:text-primary-foreground'
    };
    
    if (!visible) {
      return null;
    }
    
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          // Base styles
          'flex items-center justify-center gap-2',
          'rounded-full font-semibold text-sm',
          'transition-all duration-200',
          'active:scale-95',
          // Position (mobile-only)
          positionClasses,
          // Size
          sizeClasses[size],
          // Variant
          variantClasses[variant],
          className
        )}
        aria-label={ariaLabel || label || 'Action button'}
        {...props}
      >
        {icon}
        {label && (
          <span className="whitespace-nowrap">{label}</span>
        )}
      </button>
    );
  }
);

FAB.displayName = 'FAB';

/**
 * Multiple FABs with speed dial menu
 * Opens a menu with multiple actions
 */
interface FABSpeedDialAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FABSpeedDialProps {
  /**
   * Main FAB icon (when closed)
   */
  icon: React.ReactNode;
  
  /**
   * Icon when menu is open
   */
  openIcon?: React.ReactNode;
  
  /**
   * Actions to display in the speed dial
   */
  actions: FABSpeedDialAction[];
  
  /**
   * Position of the FAB
   */
  position?: 'bottomRight' | 'bottomCenter';
  
  /**
   * Additional class name
   */
  className?: string;
}

export function FABSpeedDial({
  icon,
  openIcon,
  actions,
  position = 'bottomRight',
  className
}: FABSpeedDialProps) {
  const [open, setOpen] = React.useState(false);
  
  const handleAction = (action: FABSpeedDialAction) => {
    action.onClick();
    setOpen(false);
  };
  
  return (
    <div className={cn('relative', className)}>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Actions */}
      {open && (
        <div className={cn(
          'absolute z-40 flex flex-col gap-3',
          position === 'bottomRight' ? 'bottom-20 right-0' : 'bottom-20 left-1/2 -translate-x-1/2',
          'animate-in slide-in-from-bottom-2 duration-200'
        )}>
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {position === 'bottomRight' && (
                <span className="bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                  {action.label}
                </span>
              )}
              <button
                onClick={() => handleAction(action)}
                className={cn(
                  'h-12 w-12 rounded-full',
                  'bg-card text-foreground',
                  'border border-border',
                  'shadow-lg hover:shadow-xl',
                  'flex items-center justify-center',
                  'transition-all duration-200',
                  'active:scale-95'
                )}
                aria-label={action.label}
              >
                {action.icon}
              </button>
              {position === 'bottomCenter' && (
                <span className="bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                  {action.label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Main FAB */}
      <FAB
        icon={open ? (openIcon || icon) : icon}
        onClick={() => setOpen(!open)}
        position={position}
        className={cn(
          open && 'rotate-45',
          'transition-transform duration-200'
        )}
      />
    </div>
  );
}
