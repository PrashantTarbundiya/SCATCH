import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

const CsrfContext = createContext(null);


export const CsrfProvider = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = await apiClient.fetchCsrfToken();
        setCsrfToken(token);
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  const refreshToken = async () => {
    try {
      const token = await apiClient.fetchCsrfToken();
      setCsrfToken(token);
      return token;
    } catch (err) {
      console.error('Failed to refresh CSRF token:', err);
      setError(err.message);
      throw err;
    }
  };

  return (
    <CsrfContext.Provider value={{ csrfToken, isLoading, error, refreshToken }}>
      {children}
    </CsrfContext.Provider>
  );
};

/**
 * Hook to access CSRF token
 * @returns {Object} { csrfToken, isLoading, error, refreshToken }
 */
export const useCsrf = () => {
  const context = useContext(CsrfContext);
  if (!context) {
    throw new Error('useCsrf must be used within CsrfProvider');
  }
  return context;
};