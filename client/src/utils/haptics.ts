// Web Vibration API Haptic Feedback Utility for Mobile Browsers

export const triggerHaptic = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignored if device doesn't support vibration
    }
  }
};

// Subtle 8ms tap for button clicks, tab switches, conversation selection
export const hapticLight = () => triggerHaptic(8);

// Firm 15ms pulse for sending messages, toggling switches
export const hapticMedium = () => triggerHaptic(15);

// Dual pulse [10, 35, 15] for success actions (e.g. accepting friend requests)
export const hapticSuccess = () => triggerHaptic([10, 35, 15]);

// Dual pulse [20, 50, 20] for destructive actions (e.g. deleting messages / chats)
export const hapticWarning = () => triggerHaptic([20, 50, 20]);

// Triple pulse [25, 60, 25] for incoming message notifications on mobile
export const hapticNotification = () => triggerHaptic([25, 60, 25]);
