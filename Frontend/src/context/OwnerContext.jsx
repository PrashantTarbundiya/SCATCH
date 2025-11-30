import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '../utils/toast';


const OwnerContext = createContext(null);

export const OwnerProvider = ({ children }) => {
  const [currentOwner, setCurrentOwnerState] = useState(null);
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(false); 
  const [isLoading, setIsLoading] = useState(true); 

  const loginOwnerContext = (ownerData) => {
    setCurrentOwnerState(ownerData);
    setIsOwnerAuthenticated(true);
    localStorage.setItem('currentOwnerSessionActive', 'true');
    if (ownerData) {
      localStorage.setItem('currentOwnerDetails', JSON.stringify({ fullname: ownerData.fullname, email: ownerData.email, id: ownerData.id }));
    }
  };


  const logoutOwnerContext = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/owners/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setCurrentOwnerState(null);
      setIsOwnerAuthenticated(false);
      localStorage.removeItem('currentOwnerSessionActive');
      localStorage.removeItem('currentOwnerDetails');
      if (response.ok) {
        const data = await response.json().catch(() => ({})); 
        toast.success(data?.message || "Owner logout successful");
        return { success: true, message: data?.message || "Owner logout successful" };
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData?.error || errorData?.message || 'Owner logout failed on server');
        return { success: false, error: errorData?.error || errorData?.message || 'Owner logout failed on server' };
      }
    } catch (err) {
      setCurrentOwnerState(null);
      setIsOwnerAuthenticated(false);
      localStorage.removeItem('currentOwnerSessionActive');
      localStorage.removeItem('currentOwnerDetails');
      toast.error(err.message || 'Network error during owner logout');
      return { success: false, error: err.message || 'Network error during owner logout' };
    }
  };
  
  // Check for active owner session on initial load
  useEffect(() => {
    const ownerSessionActive = localStorage.getItem('currentOwnerSessionActive');
    const storedOwnerDetails = localStorage.getItem('currentOwnerDetails');
    if (ownerSessionActive === 'true' && storedOwnerDetails) {
      try {
        const parsedOwner = JSON.parse(storedOwnerDetails);
        setCurrentOwnerState(parsedOwner);
        setIsOwnerAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('currentOwnerSessionActive');
        localStorage.removeItem('currentOwnerDetails');
      }
    }
    setIsLoading(false); // Set loading to false after check
    // A more robust check would be to ping an endpoint like /owners/verify-session
    // that checks the cookie and returns owner data if valid.
    // This avoids relying solely on localStorage which can be stale or tampered with.
    // For now, this localStorage check provides a basic persistence hint.
  }, []);


  const value = {
    currentOwner,
    isOwnerAuthenticated,
    isLoading, 
    loginOwnerContext,
    logoutOwnerContext,
  };

  return (
    <OwnerContext.Provider value={value}>
      {children}
    </OwnerContext.Provider>
  );
};

// Create a custom hook to use the OwnerContext
export const useOwner = () => {
  const context = useContext(OwnerContext);
  if (context === undefined || context === null) {
    throw new Error('useOwner must be used within an OwnerProvider');
  }
  return context;
};

export default OwnerContext;


