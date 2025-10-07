import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HoverEffect } from './ui/HoverEffect';
import { useWishlist } from '../context/WishlistContext';
import { CardSkeleton } from './ui/SkeletonLoader';
import { toast } from '../utils/toast';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToWishlist, removeFromWishlist, isProductInWishlist, loading: wishlistLoading } = useWishlist();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/products?sortBy=popular&filter=all&page=1&limit=8`,
          { credentials: 'include' }
        );

        let data;
        if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
        }

        if (!response.ok) {
          throw new Error(data?.error || data?.message || 'Failed to fetch products');
        }
        
        setProducts(data?.products || []);
      } catch (err) {
        setError(err.message);
        console.error("Fetch featured products error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/addtocart/${productId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to add to cart');
      }
      
      toast.success(data?.message || 'Product added to cart!');
    } catch (err) {
      toast.error(err.message || 'Failed to add product to cart.');
    }
  };

  const handleToggleWishlist = async (productId) => {
    try {
      if (isProductInWishlist(productId)) {
        const result = await removeFromWishlist(productId);
        if (result) {
          toast.success('Product removed from wishlist!');
        }
      } else {
        const result = await addToWishlist(productId);
        if (result) {
          toast.success('Product added to wishlist!');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Wishlist operation failed.');
    }
  };

  const productsForDisplay = useMemo(() => 
    products.map(product => ({
      ...product,
      onAddToCart: handleAddToCart,
      onToggleWishlist: () => handleToggleWishlist(product._id),
      isInWishlist: isProductInWishlist(product._id),
      wishlistLoading: wishlistLoading,
    })), [products, handleAddToCart, handleToggleWishlist, isProductInWishlist, wishlistLoading]
  );

  if (isLoading) {
    return (
      <section className="w-full py-16 px-4 md:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg mx-auto mb-4"></div>
            <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} showImage={true} lines={3} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-16 px-4 md:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-500 dark:text-red-400">Failed to load featured products</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 px-4 md:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Products
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Discover our most popular items
          </p>
        </div>

        {/* Products Grid */}
        <HoverEffect items={productsForDisplay} className="py-0" />

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            to="/shop?sortBy=popular&filter=all"
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            View All Products
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;