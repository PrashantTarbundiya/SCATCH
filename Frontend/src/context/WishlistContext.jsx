import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Assuming you use axios for API calls
import { useUser } from './UserContext'; // To get the logged-in user

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

// Configure axios instance for API calls
// Ensure your backend API URL is correctly set in environment variables
let determinedApiBaseUrl;
const userProvidedApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (userProvidedApiBaseUrl) {
    const cleanedUserUrl = userProvidedApiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    if (cleanedUserUrl.endsWith('/api')) {
        determinedApiBaseUrl = cleanedUserUrl;
    } else {
        determinedApiBaseUrl = `${cleanedUserUrl}/api`;
    }
} else {
    determinedApiBaseUrl = 'http://localhost:3000/api'; // Default if VITE_API_BASE_URL is not set
}

const API_URL = determinedApiBaseUrl;
// console.log('[WishlistContext] Using API_URL:', API_URL); // DEBUG LOG for API_URL REMOVED

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for sending cookies
});

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(false); // This is for wishlist loading, not auth loading
    const [error, setError] = useState(null);
    const { currentUser: user, authLoading } = useUser(); // Correctly destructure currentUser as user

    const fetchWishlist = async () => {
        // Wait for auth to complete and user to be available
        if (authLoading || !user) {
            setWishlistItems([]); // Clear wishlist if no user or still loading auth
            if (!authLoading && !user) { // Only set error if auth is done and still no user
                // setError("User not logged in to fetch wishlist."); // Optional: set an error
            }
            return;
        }
        setLoading(true); // This is for wishlist data fetching
        setError(null);
        try {
            const response = await apiClient.get('/wishlist');
            setWishlistItems(response.data || []);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch wishlist';
            setError(errorMessage);
            console.error("Error fetching wishlist:", {
                message: err.message,
                url: err.config?.url,
                method: err.config?.method,
                responseStatus: err.response?.status,
                responseData: err.response?.data,
                // fullError: err // You can uncomment this for the full error object if needed
            });
            setWishlistItems([]); // Clear on error
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (productId) => {
        if (!user) {
            setError("Please log in to add items to your wishlist.");
            // Optionally, redirect to login or show a modal
            return null;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/wishlist', { productId });
            // Add to local state optimistically or re-fetch
            setWishlistItems(prevItems => {
                // Avoid duplicates if server confirms it's already there
                const existingItem = prevItems.find(item => item.product._id === response.data.product._id);
                if (existingItem) return prevItems;
                return [...prevItems, response.data];
            });
            return response.data; // Return the added item
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to add to wishlist';
            setError(errorMessage);
            console.error("Error adding to wishlist:", {
                message: err.message,
                url: err.config?.url,
                method: err.config?.method,
                responseStatus: err.response?.status,
                responseData: err.response?.data,
            });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!user) {
            setError("User not logged in.");
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/wishlist/${productId}`);
            setWishlistItems(prevItems => prevItems.filter(item => item.product._id !== productId));
            return true; // Indicate success
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to remove from wishlist';
            setError(errorMessage);
            console.error("Error removing from wishlist:", {
                message: err.message,
                url: err.config?.url,
                method: err.config?.method,
                responseStatus: err.response?.status,
                responseData: err.response?.data,
            });
            return false; // Indicate failure
        } finally {
            setLoading(false);
        }
    };

    // Fetch wishlist when user logs in or on initial load if user is already logged in
    useEffect(() => {
        // console.log('[WishlistContext] useEffect triggered. authLoading:', authLoading, 'user:', user); // DEBUG LOG REMOVED
        if (!authLoading) { // Only proceed if authentication check is complete
            if (user) {
                // console.log('[WishlistContext] Calling fetchWishlist().'); // DEBUG LOG REMOVED
                fetchWishlist();
            } else {
                // console.log('[WishlistContext] No user or auth not complete, clearing wishlistItems.'); // DEBUG LOG REMOVED
                setWishlistItems([]); // Clear wishlist if user logs out or not logged in after auth check
            }
        } else {
            // console.log('[WishlistContext] Auth still loading, not fetching wishlist yet.'); // DEBUG LOG REMOVED
        }
    }, [user, authLoading]); // Add authLoading to dependency array

    const isProductInWishlist = (productId) => {
        return wishlistItems.some(item => item.product && item.product._id === productId);
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            loading,
            error,
            fetchWishlist,
            addToWishlist,
            removeFromWishlist,
            isProductInWishlist,
            itemCount: wishlistItems.length
        }}>
            {children}
        </WishlistContext.Provider>
    );
};