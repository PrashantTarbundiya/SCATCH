import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';

// Create the context
const UserContext = createContext(null);

// Create a provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Or load from localStorage if you want persistence
  const [authLoading, setAuthLoading] = useState(true); // To track initial auth loading

  // Memoized login function
  const loginUser = useCallback((userData) => {
    setCurrentUser(userData);
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
  }, []);

  // Memoized logout function
  const logoutUser = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      setCurrentUser(null);
      sessionStorage.removeItem('currentUser');
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: true, message: data?.message || "Logout successful" };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Logout API failed:', errorData);
        return { success: false, error: errorData?.error || errorData?.message || 'Logout failed on server' };
      }
    } catch (err) {
      console.error('Error during logout API call:', err);
      setCurrentUser(null);
      sessionStorage.removeItem('currentUser');
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

  // Optional: Load user from localStorage on initial render for persistence
  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // console.log('User data loaded from localStorage in UserContext:', parsedUser); // DEBUG LOG
        loginUser(parsedUser); // Use loginUser to set current user
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        sessionStorage.removeItem('currentUser'); // Clear corrupted data
      }
    }
    // console.log('[UserContext] Finished initial auth check. authLoading: false, currentUser:', currentUser); // DEBUG LOG REMOVED
    setAuthLoading(false); // Finished attempting to load user
  }, []); // currentUser should not be in dependency array here to avoid re-running on every currentUser change by loginUser

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