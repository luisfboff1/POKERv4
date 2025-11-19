/**
 * Haptic Feedback Utilities
 * Uses the Web Vibration API for tactile feedback
 * Gracefully degrades on unsupported devices
 */

/**
 * Check if vibration is supported
 */
export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param pattern - Vibration pattern in milliseconds
 */
function vibrate(pattern: number | number[]): void {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail on unsupported browsers
      console.debug('Vibration not supported or failed:', error);
    }
  }
}

/**
 * Haptic feedback patterns
 * Following iOS haptic guidelines for consistent feel
 */
export const haptics = {
  /**
   * Light tap - For subtle interactions
   * Use for: Minor UI changes, hover states
   */
  light: () => {
    vibrate(10);
  },

  /**
   * Medium tap - For standard interactions
   * Use for: Button taps, selections, toggles
   */
  medium: () => {
    vibrate(20);
  },

  /**
   * Heavy tap - For important interactions
   * Use for: Confirmation, deletion warnings
   */
  heavy: () => {
    vibrate([20, 10, 20]);
  },

  /**
   * Success feedback
   * Use for: Successful operations, confirmations
   */
  success: () => {
    vibrate([10, 50, 10]);
  },

  /**
   * Warning feedback
   * Use for: Warning messages, cautionary actions
   */
  warning: () => {
    vibrate([20, 30, 20]);
  },

  /**
   * Error feedback
   * Use for: Errors, failed operations, invalid inputs
   */
  error: () => {
    vibrate([20, 50, 20, 50, 20]);
  },

  /**
   * Selection feedback
   * Use for: Selecting items, changing tabs
   */
  selection: () => {
    vibrate(15);
  },

  /**
   * Impact feedback
   * Use for: Drag and drop, swipe actions
   */
  impact: () => {
    vibrate(25);
  },

  /**
   * Notification feedback
   * Use for: New messages, alerts
   */
  notification: () => {
    vibrate([30, 50, 30]);
  },

  /**
   * Cancel haptic feedback
   * Stops any ongoing vibration
   */
  cancel: () => {
    if (isVibrationSupported()) {
      navigator.vibrate(0);
    }
  }
};

/**
 * Hook for using haptic feedback with React components
 */
export function useHaptics() {
  return {
    haptics,
    isSupported: isVibrationSupported()
  };
}

/**
 * Higher-order function to add haptic feedback to callbacks
 * 
 * @example
 * const handleClick = withHaptic(() => {
 *   // Your click handler
 * }, 'medium');
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  callback: T,
  hapticType: keyof typeof haptics = 'medium'
): T {
  return ((...args: unknown[]) => {
    haptics[hapticType]();
    return callback(...args);
  }) as T;
}

/**
 * React hook to trigger haptic feedback on mount
 * Useful for page transitions
 */
export function useHapticOnMount(hapticType: keyof typeof haptics = 'light') {
  if (typeof window !== 'undefined') {
    haptics[hapticType]();
  }
}
