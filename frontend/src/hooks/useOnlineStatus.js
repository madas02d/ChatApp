import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useOnlineStatus = () => {
  const authContext = useAuth();
  const user = authContext?.user;

  // Set user as online when component mounts
  const setOnline = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/users/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'online' })
      });
      // Only log errors if not 401 (unauthorized is expected if user is not logged in)
      if (!response.ok && response.status !== 401) {
        console.warn('Failed to set online status:', response.status);
      }
    } catch (error) {
      // Silently ignore network errors
      if (error.name !== 'TypeError') {
        console.error('Error setting online status:', error);
      }
    }
  }, [user]);

  // Set user as offline when component unmounts
  const setOffline = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/users/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'offline' })
      });
      // Only log errors if not 401 (unauthorized is expected if user is not logged in)
      if (!response.ok && response.status !== 401) {
        console.warn('Failed to set offline status:', response.status);
      }
    } catch (error) {
      // Silently ignore network errors
      if (error.name !== 'TypeError') {
        console.error('Error setting offline status:', error);
      }
    }
  }, [user]);

  // Heartbeat to keep user online
  const sendHeartbeat = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/users/heartbeat', {
        method: 'POST',
        credentials: 'include'
      });
      // Only log errors if not 401 (unauthorized is expected if user is not logged in)
      if (!response.ok && response.status !== 401) {
        console.warn('Failed to send heartbeat:', response.status);
      }
    } catch (error) {
      // Silently ignore network errors
      if (error.name !== 'TypeError') {
        console.error('Error sending heartbeat:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set online when component mounts
    setOnline();

    // Send heartbeat every 30 seconds to keep user online
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Handle visibility change (tab switch, minimize, etc.) - but NOT page refresh
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (minimized, switched tab, etc.)
        // Don't set offline immediately - wait to see if it's a refresh
        // We'll rely on heartbeat timeout instead
      } else {
        // Page is visible again - user came back
        setOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Don't set offline on cleanup - user might be refreshing
    };
  }, [user, setOnline, setOffline, sendHeartbeat]);

  return { setOnline, setOffline };
}; 