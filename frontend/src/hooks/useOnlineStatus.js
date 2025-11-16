import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useOnlineStatus = () => {
  const authContext = useAuth();
  const user = authContext?.user;

  // Set user as online when component mounts
  const setOnline = useCallback(async () => {
    if (!user) return;
    
    try {
      await fetch('/api/users/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'online' })
      });
    } catch (error) {
      console.error('Error setting online status:', error);
    }
  }, [user]);

  // Set user as offline when component unmounts
  const setOffline = useCallback(async () => {
    if (!user) return;
    
    try {
      await fetch('/api/users/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'offline' })
      });
    } catch (error) {
      console.error('Error setting offline status:', error);
    }
  }, [user]);

  // Heartbeat to keep user online
  const sendHeartbeat = useCallback(async () => {
    if (!user) return;
    
    try {
      await fetch('/api/users/heartbeat', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set online when component mounts
    setOnline();

    // Send heartbeat every 30 seconds to keep user online
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Set offline when user closes tab or navigates away
    const handleBeforeUnload = () => {
      setOffline();
    };

    // Set offline when page becomes hidden (mobile)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOffline();
    };
  }, [user, setOnline, setOffline, sendHeartbeat]);

  return { setOnline, setOffline };
}; 