import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';

interface PullToRefreshProps {
  /**
   * Callback function to execute on refresh
   */
  onRefresh: () => Promise<void>;
  
  /**
   * Children to render
   */
  children: React.ReactNode;
  
  /**
   * Distance to trigger refresh
   * @default 60
   */
  threshold?: number;
  
  /**
   * Maximum pull distance
   * @default 120
   */
  maxPullDistance?: number;
  
  /**
   * Whether pull-to-refresh is enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Custom refresh indicator
   */
  indicator?: React.ReactNode;
  
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Pull-to-Refresh wrapper component
 * Adds pull-to-refresh functionality to any content
 * 
 * @example
 * <PullToRefresh
 *   onRefresh={async () => {
 *     await refetchSessions();
 *   }}
 * >
 *   <SessionsList sessions={sessions} />
 * </PullToRefresh>
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 60,
  maxPullDistance = 120,
  enabled = true,
  indicator,
  className
}: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold,
    maxPullDistance,
    enabled
  });

  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div className={cn('relative', className)}>
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center z-10 transition-all"
          style={{
            transform: `translateY(${Math.min(pullDistance - 40, 0)}px)`,
            opacity: Math.min(progress, 1)
          }}
        >
          {indicator || (
            <DefaultRefreshIndicator
              isPulling={isPulling}
              isRefreshing={isRefreshing}
              progress={progress}
            />
          )}
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: isRefreshing 
            ? 'translateY(60px)' 
            : `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 || isRefreshing ? 'transform 0.3s ease' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Default refresh indicator
 */
function DefaultRefreshIndicator({
  isPulling,
  isRefreshing,
  progress
}: {
  isPulling: boolean;
  isRefreshing: boolean;
  progress: number;
}) {
  const rotation = progress * 180;

  return (
    <div className="bg-surface/95 backdrop-blur-md rounded-full p-3 shadow-lg border border-border/50">
      {isRefreshing ? (
        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
      ) : isPulling ? (
        <Check className="h-5 w-5 text-primary" />
      ) : (
        <ArrowDown
          className="h-5 w-5 text-primary transition-transform"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      )}
    </div>
  );
}

/**
 * Simpler pull-to-refresh component without wrapper
 * Just shows the indicator, manage content yourself
 */
interface PullToRefreshIndicatorProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  enabled?: boolean;
}

export function PullToRefreshIndicator({
  onRefresh,
  threshold = 60,
  maxPullDistance = 120,
  enabled = true
}: PullToRefreshIndicatorProps) {
  const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold,
    maxPullDistance,
    enabled
  });

  const showIndicator = pullDistance > 0 || isRefreshing;

  if (!showIndicator) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center z-50 transition-all pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance - 40, 0)}px)`,
        opacity: Math.min(progress, 1)
      }}
    >
      <DefaultRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        progress={progress}
      />
    </div>
  );
}
