import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { CardSkeleton } from './ui/SkeletonLoader.jsx';
import { toast } from '../utils/toast';

const ProductRecommendations = ({ productId }) => {
  const { theme } = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const { isProductInWishlist } = useWishlist();

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

  if (isLoading) {
    return (
      <div className="mt-8 pt-6 border-t dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">You might also like</h3>
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
    <div className="mt-8 pt-6 border-t dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">You might also like</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => {
          const originalPrice = parseFloat(product.price) || 0;
          const discountAmount = parseFloat(product.discount) || 0;
          const finalPrice = originalPrice - discountAmount;
          const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
          
          return (
          <div
            key={product._id}
            className="group rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-slate-700 dark:hover:border-slate-500 relative"
          >
            {/* Wishlist icon - top left */}
            {isProductInWishlist(product._id) && (
              <i className="ri-heart-fill text-red-500 text-sm absolute top-2 left-2 z-10"></i>
            )}
            
            {/* Rating - top right */}
            {product.averageRating > 0 && (
              <div className="absolute top-2 right-2 z-10 flex items-center bg-black/20 backdrop-blur-sm rounded px-2 py-1">
                <i className="ri-star-fill text-yellow-400 text-xs"></i>
                <span className="text-xs text-white ml-1">
                  {product.averageRating.toFixed(1)}
                </span>
              </div>
            )}

            <Link to={`/product/${product._id}`} className="block">
              <div
                className="w-full h-44 flex items-center justify-center relative"
                style={{ backgroundColor: product.bgcolor || (theme === 'dark' ? '#374151' : '#f0f0f0') }}
              >
                {discountPercentage > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md z-10">
                    {`${discountPercentage}% OFF`}
                  </div>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-40 w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div
                className="p-3"
                style={{
                  backgroundColor: product.panelcolor || (theme === 'dark' ? '#1f2937' : '#ffffff'),
                  color: product.textcolor || (theme === 'dark' ? '#e5e7eb' : '#111827')
                }}
              >
                <h4 className="text-sm font-medium truncate mb-2">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    ₹{finalPrice.toFixed(2)}
                  </span>
                  {discountAmount > 0 && (
                    <span className="text-xs opacity-60 line-through">
                      ₹{originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addtocart/${product._id}`, {
                    method: 'GET',
                    credentials: 'include'
                  });
                  if (response.ok) {
                    toast.success('Product added to cart successfully!');
                  }
                } catch (err) {
                  console.error('Failed to add to cart:', err);
                }
              }}
              className="absolute bottom-3 right-3 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
              title="Add to cart"
            >
              <i className="ri-add-line text-sm"></i>
            </button>
          </div>
          );
        })}
      </div>
      

    </div>
  );
};

export default ProductRecommendations;