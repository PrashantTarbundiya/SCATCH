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
      <section className="w-full py-16 px-4 md:px-6 lg:px-8 bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-gray-200 animate-pulse mx-auto mb-4 border-2 border-black shadow-neo"></div>
            <div className="h-6 w-96 bg-gray-200 animate-pulse mx-auto border-2 border-black shadow-neo-sm"></div>
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
      <section className="w-full py-16 px-4 md:px-6 lg:px-8 bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E]">
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
    <section className="w-full py-16 px-4 md:px-6 lg:px-8 bg-background border-b-2 border-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4">
            Featured Products
          </h2>
          <p className="text-muted-foreground text-lg font-medium border-2 border-black inline-block px-4 py-1 shadow-neo-sm transform -rotate-1">
            Discover our most popular items
          </p>
        </div>

        {/* Products Grid */}
        <HoverEffect items={productsForDisplay} className="py-0" />

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            to="/shop?sortBy=popular&filter=all"
            className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground font-black text-lg border-2 border-black shadow-neo hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase tracking-wide"
          >
            View All Products
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;