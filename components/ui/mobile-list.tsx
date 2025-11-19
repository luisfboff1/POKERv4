import * as React from 'react';
import { cn } from '@/lib/utils';
import { mobileListItem } from '@/lib/mobile-utils';
import { ChevronRight } from 'lucide-react';

export interface MobileListItem {
  /**
   * Unique identifier
   */
  id: string | number;
  
  /**
   * Primary text (required)
   */
  primary: string | React.ReactNode;
  
  /**
   * Secondary text (optional)
   */
  secondary?: string | React.ReactNode;
  
  /**
   * Metadata to display on the right (optional)
   */
  meta?: string | React.ReactNode;
  
  /**
   * Badge or status indicator (optional)
   */
  badge?: React.ReactNode;
  
  /**
   * Action buttons (optional)
   */
  actions?: React.ReactNode;
  
  /**
   * Click handler (optional, makes item interactive)
   */
  onClick?: () => void;
  
  /**
   * Icon to display on the left (optional)
   */
  icon?: React.ReactNode;
  
  /**
   * Whether to show chevron when clickable
   */
  showChevron?: boolean;
}

interface MobileListProps {
  /**
   * List items to display
   */
  items: MobileListItem[];
  
  /**
   * Message to display when list is empty
   */
  emptyMessage?: string;
  
  /**
   * Empty state icon
   */
  emptyIcon?: React.ReactNode;
  
  /**
   * Custom empty state component
   */
  emptyState?: React.ReactNode;
  
  /**
   * Whether to show dividers between items
   */
  dividers?: boolean;
  
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Mobile-optimized list component
 * Replacement for data tables on mobile devices
 * 
 * @example
 * <MobileList
 *   items={sessions.map(session => ({
 *     id: session.id,
 *     primary: session.location,
 *     secondary: new Date(session.date).toLocaleDateString('pt-BR'),
 *     meta: `${playerCount} jogadores`,
 *     badge: <StatusBadge status={session.status} />,
 *     onClick: () => viewSession(session.id)
 *   }))}
 *   emptyMessage="Nenhuma sessão encontrada"
 * />
 */
export function MobileList({
  items,
  emptyMessage = 'Nenhum item encontrado',
  emptyIcon,
  emptyState,
  dividers = true,
  className
}: MobileListProps) {
  // Empty state
  if (items.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-surface/30 py-12 text-center">
        {emptyIcon && (
          <div className="text-primary/60">
            {emptyIcon}
          </div>
        )}
        <div>
          <p className="text-base font-medium text-foreground">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-lg overflow-hidden',
        dividers && 'divide-y divide-border/30',
        'bg-surface/30 md:bg-card md:border md:border-border',
        className
      )}
    >
      {items.map((item) => (
        <MobileListItemComponent
          key={item.id}
          item={item}
        />
      ))}
    </div>
  );
}

/**
 * Individual list item component
 */
function MobileListItemComponent({ item }: { item: MobileListItem }) {
  const showChevron = item.showChevron !== false && item.onClick && !item.actions;
  
  const content = (
    <>
      {/* Icon */}
      {item.icon && (
        <div className="flex-shrink-0 text-muted-foreground">
          {item.icon}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Primary text and badge */}
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm truncate flex-1">
            {item.primary}
          </div>
          {item.badge && (
            <div className="flex-shrink-0">
              {item.badge}
            </div>
          )}
        </div>
        
        {/* Secondary text */}
        {item.secondary && (
          <div className="text-xs text-muted-foreground truncate">
            {item.secondary}
          </div>
        )}
      </div>

      {/* Meta & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.meta && (
          <div className="text-xs text-muted-foreground text-right">
            {item.meta}
          </div>
        )}
        {item.actions && (
          <div className="flex items-center gap-1">
            {item.actions}
          </div>
        )}
        {showChevron && (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </>
  );

  if (item.onClick) {
    return (
      <button
        onClick={item.onClick}
        className={cn(
          mobileListItem,
          'w-full text-left'
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(mobileListItem, 'cursor-default')}>
      {content}
    </div>
  );
}

/**
 * Grouped mobile list with section headers
 */
interface MobileListGroup {
  title: string;
  items: MobileListItem[];
}

interface GroupedMobileListProps {
  groups: MobileListGroup[];
  emptyMessage?: string;
  className?: string;
}

export function GroupedMobileList({
  groups,
  emptyMessage = 'Nenhum item encontrado',
  className
}: GroupedMobileListProps) {
  const hasItems = groups.some(group => group.items.length > 0);

  if (!hasItems) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {groups.map((group, index) => {
        if (group.items.length === 0) return null;
        
        return (
          <div key={index} className="space-y-3">
            {/* Section header */}
            <h3 className="text-sm font-semibold text-muted-foreground px-3">
              {group.title}
            </h3>
            
            {/* List */}
            <MobileList items={group.items} dividers />
          </div>
        );
      })}
    </div>
  );
}
