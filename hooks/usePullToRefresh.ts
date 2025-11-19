import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  /**
   * Callback function to execute on refresh
   */
  onRefresh: () => Promise<void>;
  
  /**
   * Distance in pixels to trigger refresh
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
}

interface UsePullToRefreshReturn {
  /**
   * Whether the user is currently pulling
   */
  isPulling: boolean;
  
  /**
   * Whether refresh is in progress
   */
  isRefreshing: boolean;
  
  /**
   * Current pull distance in pixels
   */
  pullDistance: number;
  
  /**
   * Progress percentage (0-1)
   */
  progress: number;
}

/**
 * Hook for implementing pull-to-refresh functionality
 * Works only on mobile/touch devices
 * 
 * @example
 * const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await refetchData();
 *   },
 *   threshold: 60,
 *   maxPullDistance: 120
 * });
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  maxPullDistance = 120,
  enabled = true
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  const progress = Math.min(pullDistance / threshold, 1);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setIsPulling(false);
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('Pull-to-refresh error:', error);
    } finally {
      // Small delay for better UX
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 300);
    }
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of page
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        startScrollTop.current = window.scrollY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      // Only trigger if at top of page and pulling down
      if (window.scrollY === 0 && startY.current > 0) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY.current;
        
        if (distance > 0) {
          // Prevent default scrolling when pulling
          e.preventDefault();
          
          // Apply resistance curve (slower pull as distance increases)
          const resistance = 2;
          const adjustedDistance = Math.min(
            distance / resistance,
            maxPullDistance
          );
          
          setPullDistance(adjustedDistance);
          setIsPulling(adjustedDistance > threshold);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && pullDistance >= threshold) {
        await handleRefresh();
      } else {
        // Reset if not enough pull distance
        setPullDistance(0);
        setIsPulling(false);
      }
      
      startY.current = 0;
      startScrollTop.current = 0;
    };

    // Use passive: false to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, maxPullDistance, enabled, isRefreshing, handleRefresh]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    progress
  };
}
