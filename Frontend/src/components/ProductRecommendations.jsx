import React, { useState, useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';

import { CardSkeleton } from './ui/SkeletonLoader.jsx';
import { toast } from '../utils/toast';
import { ProductCard } from './ui/HoverEffect';

const ProductRecommendations = ({ productId }) => {

  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isProductInWishlist, addToWishlist, removeFromWishlist, loading: wishlistLoading } = useWishlist();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${productId}/recommendations?limit=4`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch recommendations');
        }

        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId]);

  const handleAddToCart = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addtocart/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        toast.success('Product added to cart successfully!');
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async (id) => {
    if (isProductInWishlist(id)) {
      await removeFromWishlist(id);
      toast.success('Removed from wishlist');
    } else {
      await addToWishlist(id);
      toast.success('Added to wishlist');
    }
  };

  if (isLoading) {
    return (
      <div className="mt-12 pt-8 border-t-4 border-black">
        <h3 className="text-2xl font-black text-black mb-6 uppercase">You might also like</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} showImage={true} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t-4 border-black">
      <h3 className="text-2xl font-black text-black mb-6 uppercase">You might also like</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <div key={product._id} className="h-full">
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onToggleWishlist={() => handleToggleWishlist(product._id)}
              isInWishlist={isProductInWishlist(product._id)}
              wishlistLoading={wishlistLoading}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProductRecommendations;





