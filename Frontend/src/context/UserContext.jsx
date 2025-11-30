import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { toast } from '../utils/toast';

// Create the context
const UserContext = createContext(null);

// Create a provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Or load from localStorage if you want persistence
  const [authLoading, setAuthLoading] = useState(true); // To track initial auth loading

  // Memoized login function
  const loginUser = useCallback((userData) => {
    setCurrentUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }, []);

  // Memoized logout function
  const logoutUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
        method: 'GET',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      // Clear all auth data immediately
      setCurrentUser(null);
      localStorage.clear(); // Clear all localStorage data
      sessionStorage.clear(); // Clear all sessionStorage data
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.success(data?.message || "Logout successful");
        return { success: true, message: data?.message || "Logout successful" };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Logout API failed:', errorData);
        toast.error(errorData?.error || errorData?.message || 'Logout failed on server');
        return { success: false, error: errorData?.error || errorData?.message || 'Logout failed on server' };
      }
    } catch (err) {
      console.error('Error during logout API call:', err);
      // Clear auth data even if API call fails
      setCurrentUser(null);
      localStorage.clear();
      sessionStorage.clear();
      toast.error(err.message || 'Network error during logout');
      return { success: false, error: err.message || 'Network error during logout' };
    }
  }, []);

  // Memoized context value
  const value = useMemo(() => ({
    currentUser,
    setCurrentUser: loginUser,
    logoutUser,
    isAuthenticated: !!currentUser,
    authLoading,
  }), [currentUser, loginUser, logoutUser, authLoading]);

  // Fetch user from backend on initial render using JWT cookie
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
          method: 'GET',
          credentials: 'include', // Send cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            loginUser(data.user);
          }
        } else {
          // If backend says not authenticated, check localStorage as fallback
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              loginUser(parsedUser);
            } catch (error) {
              console.error("Failed to parse stored user:", error);
              localStorage.removeItem('currentUser');
            }
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        // On network error, try localStorage as fallback
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            loginUser(parsedUser);
          } catch (parseError) {
            console.error("Failed to parse stored user:", parseError);
            localStorage.removeItem('currentUser');
          }
        }
      } finally {
        setAuthLoading(false);
      }
    };

    fetchCurrentUser();
  }, [loginUser]);

  return (
    <UserContext.Provider value={value}>
      {/* {console.log('[UserContext] Rendering Provider. currentUser:', value.currentUser, 'authLoading:', value.authLoading)} // DEBUG LOG REMOVED */}
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined || context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;


