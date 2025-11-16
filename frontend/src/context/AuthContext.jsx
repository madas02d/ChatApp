import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Use environment variable or default to proxy path
const API_URL = import.meta.env.VITE_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const apiPath = API_URL || '/api';
      const response = await fetch(`${apiPath}/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // User will be null if not authenticated, which is fine
        setUser(data.user || null);
      } else {
        // Should not happen with optionalAuth, but handle it gracefully
        console.warn('Auth check failed with status:', response.status);
        setUser(null);
      }
    } catch (error) {
      // Network errors are expected if server is not running - don't log as error on initial load
      // Only log if it's not a connection error (server might not be running yet)
      if (error.message !== 'Failed to fetch' && error.name !== 'TypeError') {
        console.error('Auth check failed:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const apiPath = API_URL || '/api';
      const response = await fetch(`${apiPath}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.error || errorData.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        return { success: false, error: 'Cannot connect to server. Please make sure the backend server is running on port 5000.' };
      }
      return { success: false, error: 'Login failed. Please check if the server is running.' };
    }
  };

  const logout = async () => {
    try {
      const apiPath = API_URL || '/api';
      await fetch(`${apiPath}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const register = async (username, email, password) => {
    try {
      const apiPath = API_URL || '/api';
      const response = await fetch(`${apiPath}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.error || errorData.message || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        return { success: false, error: 'Cannot connect to server. Please make sure the backend server is running on port 5000.' };
      }
      return { success: false, error: 'Registration failed. Please check if the server is running.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
