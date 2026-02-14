import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '../services/apiClient'; // Use centralized apiClient
import { useUser } from './UserContext';
import { toast } from '../utils/toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(false); // This is for wishlist loading, not auth loading
    const [error, setError] = useState(null);
    const { currentUser: user, authLoading } = useUser();

    const fetchWishlist = useCallback(async () => {
        if (authLoading || !user) {
            setWishlistItems([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get('/api/wishlist');
            // Check if data is array or object with success property, adapt as needed based on backend response structure
            // Based on previous code: setWishlistItems(response.data || [])
            // apiClient returns the parsed JSON body directly
            setWishlistItems(data.wishlist || data || []);
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch wishlist';
            setError(errorMessage);
            setWishlistItems([]);
        } finally {
            setLoading(false);
        }
    }, [authLoading, user]);

    const addToWishlist = useCallback(async (productId) => {
        if (!user) {
            toast.error("Please log in to add items to your wishlist.");
            return null;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.post('/api/wishlist', { productId });
            if (data.success) {
                setWishlistItems(prevItems => {
                    // Check if it's already there to avoid duplicates (though backend should handle)
                    const existingItem = prevItems.find(item => item.product._id === data.product._id);
                    if (existingItem) return prevItems;
                    return [...prevItems, data];
                });
                toast.success(data.message || "Added to wishlist");
            }
            return data;
        } catch (err) {
            const errorMessage = err.message || 'Failed to add to wishlist';
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const removeFromWishlist = useCallback(async (productId) => {
        if (!user) {
            setError("User not logged in.");
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.delete(`/api/wishlist/${productId}`);
            if (data.success) {
                setWishlistItems(prevItems => prevItems.filter(item => item.product._id !== productId));
                toast.success(data.message || "Removed from wishlist");
            }
            return true;
        } catch (err) {
            const errorMessage = err.message || 'Failed to remove from wishlist';
            setError(errorMessage);
            toast.error(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch wishlist when user logs in or on initial load if user is already logged in
    useEffect(() => {
        if (!authLoading) {
            if (user) {
                fetchWishlist();
            } else {
                setWishlistItems([]);
            }
        }
    }, [user, authLoading, fetchWishlist]);

    const isProductInWishlist = useCallback((productId) => {
        return wishlistItems.some(item => item.product && item.product._id === productId);
    }, [wishlistItems]);

    const contextValue = useMemo(() => ({
        wishlistItems,
        loading,
        error,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        isProductInWishlist,
        itemCount: wishlistItems.length
    }), [wishlistItems, loading, error, fetchWishlist, addToWishlist, removeFromWishlist, isProductInWishlist]);

    return (
        <WishlistContext.Provider value={contextValue}>
            {children}
        </WishlistContext.Provider>
    );
};


