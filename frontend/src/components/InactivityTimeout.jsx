import { useInactivityTimeout } from '../hooks/useInactivityTimeout';

/**
 * Component to handle automatic logout on inactivity
 * This component doesn't render anything, it just manages the timeout
 */
export const InactivityTimeout = () => {
  // 15 minutes of inactivity before automatic logout
  useInactivityTimeout(15);
  
  return null;
};

