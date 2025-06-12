import React, { createContext, useState, useContext, useEffect } from 'react'; // Added useEffect

// Create the context
const UserContext = createContext(null);

// Create a provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Or load from localStorage if you want persistence

  // Function to update user, could also include login/logout logic here or keep it separate
  const loginUser = (userData) => {
    // console.log('User data being set in UserContext:', userData); // DEBUG LOG
    setCurrentUser(userData);
    // Optionally, save to sessionStorage for persistence across browser tab session
    sessionStorage.setItem('currentUser', JSON.stringify(userData)); // Save to sessionStorage
  };

  const logoutUser = async () => { // Make logoutUser async
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      setCurrentUser(null);
      sessionStorage.removeItem('currentUser');
      if (response.ok) {
        const data = await response.json().catch(() => ({})); // Catch if no JSON body
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
  };

  // Value provided to consuming components
  const value = {
    currentUser,
    setCurrentUser: loginUser, // Expose loginUser as setCurrentUser for clarity in login page
    logoutUser,
    isAuthenticated: !!currentUser, // Helper to easily check if user is logged in
  };

  // Optional: Load user from localStorage on initial render for persistence
  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // console.log('User data loaded from localStorage in UserContext:', parsedUser); // DEBUG LOG
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        sessionStorage.removeItem('currentUser'); // Clear corrupted data
      }
    }
  }, []);

  return (
    <UserContext.Provider value={value}>
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