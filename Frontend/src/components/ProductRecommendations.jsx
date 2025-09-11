import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';

const ProductRecommendations = ({ productId }) => {
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
            <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-48"></div>
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
        {recommendations.map((product) => (
          <div
            key={product._id}
            className="group rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border dark:border-gray-700 relative"
            style={{ backgroundColor: product.panelcolor || '#ffffff' }}
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
                className="aspect-square overflow-hidden flex items-center justify-center p-2"
                style={{ backgroundColor: product.bgcolor || '#f0f0f0' }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3" style={{ color: product.textcolor || '#000000' }}>
                <h4 className="text-sm font-medium truncate mb-2">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    ₹{(product.price - (product.discount || 0)).toFixed(2)}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-xs opacity-60 line-through">
                      ₹{product.price.toFixed(2)}
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
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
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
        ))}
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-6 bg-green-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          Product added to cart successfully!
        </div>
      )}
    </div>
  );
};

export default ProductRecommendations;