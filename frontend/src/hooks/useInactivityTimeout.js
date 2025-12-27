import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to handle user inactivity timeout and automatic logout
 * @param {number} timeoutMinutes - Minutes of inactivity before logout (default: 15)
 */
export const useInactivityTimeout = (timeoutMinutes = 15) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert to milliseconds

  const resetTimeout = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timeout if user is logged in
    if (user) {
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        console.log('User inactive for', timeoutMinutes, 'minutes. Logging out...');
        logout();
        navigate('/login');
        // Optionally show a message
        alert(`You have been logged out due to inactivity (${timeoutMinutes} minutes).`);
      }, timeoutMs);
    }
  }, [user, logout, navigate, timeoutMs, timeoutMinutes]);

  useEffect(() => {
    if (!user) {
      // Clear timeout if user is not logged in
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Set initial timeout
    resetTimeout();

    // List of events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // User came back to tab, reset timeout
        resetTimeout();
      }
    };

    // Handle page focus
    const handleFocus = () => {
      if (user) {
        resetTimeout();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, resetTimeout]);
};

