import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OnlineStatusManager = () => {
  const { user } = useAuth();
  const { setOnline, setOffline } = useOnlineStatus();

  useEffect(() => {
    if (user) {
      // Set user as online when they log in
      setOnline();
    } else {
      // Set user as offline when they log out
      setOffline();
    }
  }, [user, setOnline, setOffline]);

  // This component doesn't render anything, it just manages online status
  return null;
}; 