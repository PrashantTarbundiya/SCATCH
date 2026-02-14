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
      <div className="w-full min-h-screen flex flex-col items-center justify-center pt-20 bg-yellow-50">
        <div className="bg-white border-4 border-black shadow-neo p-8 text-center max-w-md">
          <i className="ri-error-warning-fill text-5xl text-red-500 mb-4 block"></i>
          <p className="text-red-600 font-bold text-xl mb-6 uppercase tracking-tight">{error}</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3 bg-black text-white font-black uppercase tracking-wider hover:bg-gray-800 transition-all border-2 border-transparent hover:border-black"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-20 bg-white">
        <div className="text-center p-8 border-4 border-black shadow-neo">
          <p className="text-black font-black text-2xl uppercase">Product not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-12 px-4 md:px-8 lg:px-16 font-sans">
      <div className="bg-white border-4 border-black p-6 md:p-8 shadow-neo max-w-4xl mx-auto relative cursor-default">
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-4 h-4 bg-black"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 bg-black"></div>

        {/* Product Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-8 border-b-4 border-black border-dashed">
          <img
            src={product.image}
            alt={product.name}
            className="w-32 h-32 object-contain border-4 border-black shadow-neo-sm bg-white p-2"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter mb-3">{product.name}</h1>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center bg-yellow-300 border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => {
                    const starType = i < (product.averageRating || 0) ? 'fill' : 'line';
                    return <i key={`avg-star-${i}`} className={`ri-star-${starType} text-black text-lg`}></i>;
                  })}
                </div>
                <span className="text-sm font-black text-black uppercase">
                  {(product.averageRating || 0).toFixed(1)} / 5
                </span>
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                {product.ratings && product.ratings.length > 0 ? `${product.ratings.length} Reviews` : 'No reviews'}
              </span>
              <button
                onClick={() => navigate(`/product/${product._id}`)}
                className="text-blue-600 font-black uppercase hover:underline border-b-2 border-transparent hover:border-blue-600 transition-all text-sm ml-auto"
              >
                View Product Details →
              </button>
            </div>
          </div>
        </div>

        {/* Review Form */}
        {hasPurchasedProduct && currentUser ? (
          <div id="review-form-section" className="mb-12 p-6 md:p-8 border-4 border-black bg-purple-100 shadow-neo relative">
            <div className="absolute -top-4 left-6 bg-black text-white px-4 py-1 font-black uppercase tracking-widest text-sm transform -rotate-2">
              {editingReview ? 'Edit Your Review' : 'Write a Review'}
            </div>

            <div className="space-y-6 mt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className="text-lg font-black uppercase text-black">Your Rating:</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => {
                    const starType = i < userRating ? 'fill' : 'line';
                    return (
                      <i
                        key={`user-star-${i}`}
                        className={`ri-star-${starType} text-3xl cursor-pointer transition-transform hover:-translate-y-1 ${i < userRating ? 'text-black' : 'text-gray-400'}`}
                        onClick={() => !isSubmittingReview && setUserRating(i + 1)}
                      />
                    );
                  })}
                </div>
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="SHARE YOUR THOUGHTS ABOUT THE PRODUCT..."
                className="w-full p-4 border-4 border-black bg-white text-black font-bold placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all min-h-[150px] uppercase"
                rows="4"
                disabled={isSubmittingReview}
              />

              <div>
                <label className="block text-sm font-black uppercase text-black mb-3">
                  Upload images (Max 5):
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-sm font-bold text-gray-500
                      file:mr-4 file:py-3 file:px-6
                      file:border-2 file:border-black
                      file:text-xs file:font-black file:uppercase
                      file:bg-white file:text-black
                      hover:file:bg-black hover:file:text-white
                      file:transition-all file:cursor-pointer
                      cursor-pointer border-2 border-black border-dashed p-4 bg-white"
                    disabled={isSubmittingReview}
                  />
                </div>
                {reviewImagePreviews.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {reviewImagePreviews.map((previewUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={previewUrl}
                          alt={`Preview ${index + 1}`}
                          className="w-24 h-24 object-cover border-2 border-black shadow-neo-sm"
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
                          className="absolute -top-2 -right-2 bg-red-600 text-white border-2 border-black w-7 h-7 flex items-center justify-center font-bold shadow-neo-sm hover:scale-110 transition-transform"
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

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleReviewSubmit}
                  disabled={isSubmittingReview || userRating === 0}
                  className="bg-black text-white hover:bg-gray-800 font-black py-4 px-8 uppercase tracking-widest border-2 border-transparent shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1"
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
                    className="bg-white text-black hover:bg-gray-100 font-black py-4 px-8 uppercase tracking-widest border-4 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex-1"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-12 p-8 border-4 border-black bg-gray-100 shadow-neo text-center">
            <i className="ri-lock-2-line text-4xl mb-2 block"></i>
            <p className="text-xl font-black uppercase text-gray-500">
              {currentUser ? "Purchase this product to write a review" : "Log in to write a review"}
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div>
          <h3 className="text-2xl font-black text-black uppercase mb-8 flex items-center gap-3">
            <i className="ri-chat-1-line"></i>
            Customer Reviews <span className="text-gray-500 text-lg">({product.ratings ? product.ratings.length : 0})</span>
          </h3>

          {product.ratings && product.ratings.length > 0 ? (
            <div className="grid gap-6">
              {product.ratings.slice().reverse().map((review) => (
                <div key={review._id} className="p-6 border-4 border-black bg-white shadow-neo hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => {
                          const starType = i < review.rating ? 'fill' : 'line';
                          return <i key={`review-star-${review._id}-${i}`} className={`ri-star-${starType} text-xl drop-shadow-[1px_1px_0_black]`}></i>;
                        })}
                      </div>
                      <span className="font-black text-black uppercase text-lg border-b-4 border-transparent">
                        {review.user ? (review.user.fullname || review.user.username || `User...${review.user._id.toString().slice(-4)}`) : 'Anonymous'}
                      </span>
                      <span className="text-xs font-bold text-gray-500 uppercase bg-gray-100 px-2 py-1 border border-black">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {currentUser && review.user && review.user._id === currentUser._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          title="Edit your review"
                        >
                          <i className="ri-pencil-fill"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="bg-red-100 hover:bg-red-200 text-red-800 p-2 border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          title="Delete your review"
                        >
                          <i className="ri-delete-bin-fill"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {review.reviewText && (
                    <p className="text-black font-bold uppercase mb-4 leading-relaxed border-l-4 border-gray-200 pl-4">
                      "{review.reviewText}"
                    </p>
                  )}

                  {review.reviewImage && review.reviewImage.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                      {review.reviewImage.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`Review image ${idx + 1}`}
                          className="w-20 h-20 object-cover border-2 border-black cursor-pointer hover:scale-105 transition-transform shadow-neo-sm"
                          onClick={() => window.open(imgUrl, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-4 border-black border-dashed bg-gray-50">
              <i className="ri-chat-off-line text-4xl text-gray-400 mb-2 block"></i>
              <p className="text-gray-500 font-bold uppercase text-lg">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewPage;







