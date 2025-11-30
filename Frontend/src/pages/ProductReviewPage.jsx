import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { ProductDetailSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { toast } from '../utils/toast';

const ProductReviewPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewImages, setReviewImages] = useState([]); 
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      setIsLoading(true);
      setError(null);
      try {
        const productResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${productId}`);
        if (!productResponse.ok) {
          const errData = await productResponse.json();
          throw new Error(errData.message || `HTTP error! status: ${productResponse.status}`);
        }
        const productData = await productResponse.json();
        setProduct(productData.product);

        if (currentUser) {
          try {
            const purchaseCheckResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/has-purchased/${productId}`, {
              credentials: 'include',
            });
            if (purchaseCheckResponse.ok) {
              const purchaseData = await purchaseCheckResponse.json();
              setHasPurchasedProduct(purchaseData.hasPurchased);
            }
          } catch (purchaseErr) {
            console.error("Error checking purchase status:", purchaseErr);
            setHasPurchasedProduct(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch product data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [productId, currentUser]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const selectedFiles = files.slice(0, 5); 
      setReviewImages(selectedFiles);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setReviewImagePreviews(newPreviews);
    } else {
      setReviewImages([]);
      setReviewImagePreviews([]);
    }
  };

  const handleReviewSubmit = async () => {
    if (!product || userRating === 0) {
      setError("Please select a rating (1-5 stars).");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!currentUser) {
      setError("You must be logged in to submit a review.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsSubmittingReview(true);
    setError(null);
    setSuccessMessage('');
    
    const formData = new FormData();
    formData.append('rating', userRating);
    formData.append('reviewText', reviewText);
    reviewImages.forEach(file => formData.append('reviewImages', file));
    
    if (editingReview && reviewImages.length === 0 && reviewImagePreviews.length === 0 && editingReview.reviewImage?.length > 0) {
      formData.append('removeAllReviewImages', 'true');
    }
    
    const url = editingReview 
      ? `${import.meta.env.VITE_API_BASE_URL}/products/${product._id}/reviews/${editingReview._id}` 
      : `${import.meta.env.VITE_API_BASE_URL}/products/${product._id}/rate`;
    const method = editingReview ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, { method, credentials: 'include', body: formData });
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        if (!response.ok) throw new Error(textResponse || `HTTP error! status: ${response.status}`);
        throw new Error("Received non-JSON response from server.");
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `HTTP error! status: ${response.status}`);
      }
      
      toast.success(data.success || (editingReview ? "Review updated!" : "Review submitted!"));
      setProduct(data.product);
      setUserRating(0);
      setReviewText('');
      setReviewImages([]);
      setReviewImagePreviews([]);
      setEditingReview(null);
    } catch (err) {
      console.error("Review submission error:", err);
      toast.error(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = (reviewToEdit) => {
    setEditingReview(reviewToEdit);
    setUserRating(reviewToEdit.rating);
    setReviewText(reviewToEdit.reviewText || '');
    setReviewImages([]); 
    setReviewImagePreviews(reviewToEdit.reviewImage || []); 
    document.getElementById('review-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDeleteReview = async (reviewIdToDelete) => {
    if (!product || !reviewIdToDelete || !window.confirm("Delete this review?")) return;
    if (!currentUser) {
      setError("You must be logged in to delete a review.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setIsSubmittingReview(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${product._id}/reviews/${reviewIdToDelete}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      
      toast.success(data.success || "Review deleted!");
      setProduct(data.product);
      if (editingReview && editingReview._id === reviewIdToDelete) {
        setUserRating(0);
        setReviewText('');
        setReviewImages([]);
        setReviewImagePreviews([]);
        setEditingReview(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return <ProductDetailSkeleton />;
  if (error && !product) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center pt-20 bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E]">
        <p className="text-red-600 dark:text-red-400 text-xl mb-4">Error: {error}</p>
        <button 
          onClick={() => navigate('/shop')} 
          className="px-6 py-2 bg-blue-600 dark:bg-purple-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 transition-colors"
        >
          Back to Shop
        </button>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-20 bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E]">
        <p className="text-gray-700 dark:text-purple-200 text-lg">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E] pt-24 pb-12 px-4 md:px-8 lg:px-16">


      <div className="bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl border border-purple-500/20 p-6 rounded-lg shadow-xl w-full max-w-4xl mx-auto">
        {/* Product Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b dark:border-gray-700">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-20 h-20 object-contain rounded-lg border dark:border-gray-600" 
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{product.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                  const starType = i < (product.averageRating || 0) ? 'fill' : 'line';
                  return <i key={`avg-star-${i}`} className={`ri-star-${starType} text-yellow-400 text-lg`}></i>;
                })}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-600 dark:text-purple-300">
                  ({(product.averageRating || 0).toFixed(1)} rating)
                  {product.ratings && product.ratings.length > 0 && (
                    <span className="ml-1">({product.ratings.length} reviews)</span>
                  )}
                </span>
              </div>
              <button 
                onClick={() => navigate(`/product/${product._id}`)}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View Product Details
              </button>
            </div>
          </div>
        </div>

        {/* Review Form */}
        {hasPurchasedProduct && currentUser ? (
          <div id="review-form-section" className="mb-8 p-6 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {editingReview ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 text-gray-700 dark:text-gray-700 dark:text-purple-200">Your Rating:</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => {
                    const starType = i < userRating ? 'fill' : 'line';
                    return (
                      <i 
                        key={`user-star-${i}`} 
                        className={`ri-star-${starType} text-yellow-400 text-2xl cursor-pointer hover:scale-110 transition-transform`} 
                        onClick={() => !isSubmittingReview && setUserRating(i + 1)}
                      />
                    );
                  })}
                </div>
              </div>

              <textarea 
                value={reviewText} 
                onChange={(e) => setReviewText(e.target.value)} 
                placeholder="Share your thoughts about the product..." 
                className="w-full p-3 border border-purple-500/30 rounded-md bg-white dark:bg-[#2A1F47] text-gray-900 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                rows="4" 
                disabled={isSubmittingReview}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-purple-200 mb-2">
                  Upload images (up to 5):
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange} 
                  className="block w-full text-sm text-gray-600 dark:text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 disabled:opacity-50" 
                  disabled={isSubmittingReview} 
                />
                {reviewImagePreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {reviewImagePreviews.map((previewUrl, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={previewUrl} 
                          alt={`Preview ${index + 1}`} 
                          className="w-20 h-20 object-cover rounded-md border" 
                        />
                        <button 
                          onClick={() => {
                            const newImages = [...reviewImages];
                            const newPreviews = [...reviewImagePreviews];
                            newImages.splice(index, 1);
                            newPreviews.splice(index, 1);
                            setReviewImages(newImages);
                            setReviewImagePreviews(newPreviews);
                          }} 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" 
                          title="Remove image" 
                          disabled={isSubmittingReview}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleReviewSubmit} 
                  disabled={isSubmittingReview || userRating === 0} 
                  className="bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReview ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
                </button>
                {editingReview && (
                  <button 
                    onClick={() => {
                      setEditingReview(null);
                      setUserRating(0);
                      setReviewText('');
                      setReviewImages([]);
                      setReviewImagePreviews([]);
                    }} 
                    disabled={isSubmittingReview} 
                    className="bg-gray-300 dark:bg-[#2A1F47] hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-6 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30 text-center">
            <p className="text-gray-600 dark:text-gray-600 dark:text-purple-300">
              {currentUser ? "You must purchase this product to write a review." : "Please log in to write a review."}
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Customer Reviews ({product.ratings ? product.ratings.length : 0})
          </h3>
          
          {product.ratings && product.ratings.length > 0 ? (
            <div className="space-y-6">
              {product.ratings.slice().reverse().map((review) => (
                <div key={review._id} className="p-6 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => {
                          const starType = i < review.rating ? 'fill' : 'line';
                          return <i key={`review-star-${review._id}-${i}`} className={`ri-star-${starType} text-yellow-400 text-lg`}></i>;
                        })}
                      </div>
                      <span className="font-semibold text-gray-700 text-gray-900 dark:text-gray-900 dark:text-purple-100">
                        {review.user ? (review.user.fullname || review.user.username || `User...${review.user._id.toString().slice(-4)}`) : 'Anonymous'}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-600 dark:text-purple-300">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {currentUser && review.user && review.user._id === currentUser._id && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditReview(review)} 
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2" 
                          title="Edit your review"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(review._id)} 
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2" 
                          title="Delete your review"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {review.reviewText && (
                    <p className="text-gray-700 dark:text-purple-200 mb-3">{review.reviewText}</p>
                  )}
                  
                  {review.reviewImage && review.reviewImage.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {review.reviewImage.map((imgUrl, idx) => (
                        <img 
                          key={idx} 
                          src={imgUrl} 
                          alt={`Review image ${idx + 1}`} 
                          className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => window.open(imgUrl, '_blank')} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-purple-300 text-lg">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewPage;







