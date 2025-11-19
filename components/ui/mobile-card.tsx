import * as React from 'react';
import { cn } from '@/lib/utils';
import { mobileCardClasses } from '@/lib/mobile-utils';

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card title (optional)
   */
  title?: string;
  
  /**
   * Card description (optional)
   */
  description?: string;
  
  /**
   * Action element to display in header (optional)
   */
  action?: React.ReactNode;
  
  /**
   * Card variant - affects visual weight
   * - default: Standard card with border and background
   * - minimal: Reduced styling on mobile
   * - flat: No background/border on mobile
   */
  variant?: 'default' | 'minimal' | 'flat';
  
  /**
   * Whether the card is clickable
   */
  clickable?: boolean;
}

/**
 * Mobile-optimized card component
 * Automatically reduces visual weight on mobile while maintaining desktop appearance
 * 
 * @example
 * <MobileCard
 *   title="Estatísticas"
 *   description="Visão geral do mês"
 *   action={<Button size="sm">Ver mais</Button>}
 *   variant="minimal"
 * >
 *   <div>Card content</div>
 * </MobileCard>
 */
export const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({ 
    title, 
    description, 
    action,
    variant = 'default',
    clickable = false,
    className,
    children,
    ...props 
  }, ref) => {
    const baseClasses = mobileCardClasses[variant];
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          'space-y-3',
          clickable && 'cursor-pointer hover:bg-accent/30 active:scale-[0.98] transition-all',
          className
        )}
        {...props}
      >
        {/* Header (title, description, action) */}
        {(title || description || action) && (
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              {title && (
                <h3 className="text-base font-semibold leading-none md:text-lg">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-muted-foreground md:text-sm">
                  {description}
                </p>
              )}
            </div>
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        {children}
      </div>
    );
  }
);

MobileCard.displayName = 'MobileCard';

/**
 * Mobile-optimized stat card
 * Perfect for dashboard statistics with icon, value, and label
 */
interface MobileStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const MobileStatCard = React.forwardRef<HTMLDivElement, MobileStatCardProps>(
  ({ 
    icon, 
    value, 
    label, 
    subtitle, 
    trend,
    trendValue,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Mobile: compact, minimal
          'rounded-lg bg-surface/50 p-4 space-y-2',
          // Desktop: full card
          'md:rounded-xl md:bg-card md:border md:border-border md:p-6 md:shadow-sm',
          className
        )}
        {...props}
      >
        {/* Icon and Label */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground md:text-sm">
            {label}
          </span>
          {icon && (
            <div className="text-primary flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
        
        {/* Value */}
        <p className="text-2xl font-bold md:text-3xl">
          {value}
        </p>
        
        {/* Subtitle or Trend */}
        {(subtitle || trendValue) && (
          <div className="flex items-center gap-2">
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
            {trendValue && (
              <span className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-muted-foreground'
              )}>
                {trend === 'up' && '↑ '}
                {trend === 'down' && '↓ '}
                {trendValue}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

MobileStatCard.displayName = 'MobileStatCard';
