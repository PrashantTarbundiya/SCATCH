import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Corrected import

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser(); // Correctly use the hook

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
      setProduct(null);
      setHasPurchasedProduct(false);
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
              } else {
                  console.warn("Failed to check purchase status:", purchaseCheckResponse.statusText);
                  setHasPurchasedProduct(false);
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
    setIsSubmittingReview(true); setError(null); setSuccessMessage('');
    const formData = new FormData();
    formData.append('rating', userRating);
    formData.append('reviewText', reviewText);
    reviewImages.forEach(file => formData.append('reviewImages', file));
    if (editingReview && reviewImages.length === 0 && reviewImagePreviews.length === 0 && editingReview.reviewImage?.length > 0) {
        formData.append('removeAllReviewImages', 'true');
    }
    const url = editingReview ? `${import.meta.env.VITE_API_BASE_URL}/products/${product._id}/reviews/${editingReview._id}` : `${import.meta.env.VITE_API_BASE_URL}/products/${product._id}/rate`;
    const method = editingReview ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, { method, credentials: 'include', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      setSuccessMessage(data.success || (editingReview ? "Review updated!" : "Review submitted!"));
      setProduct(data.product);
      setUserRating(0); setReviewText(''); setReviewImages([]); setReviewImagePreviews([]); setEditingReview(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || "Failed to submit review.");
      setTimeout(() => setError(null), 3000);
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
    document.getElementById('review-form-section-detailpage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDeleteReview = async (reviewIdToDelete) => {
    if (!product || !reviewIdToDelete || !window.confirm("Delete this review?")) return;
    if (!currentUser) {
      setError("You must be logged in to delete a review.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsSubmittingReview(true); setError(null); setSuccessMessage('');
    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${product._id}/reviews/${reviewIdToDelete}`, { method: 'DELETE', credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
        setSuccessMessage(data.success || "Review deleted!");
        setProduct(data.product);
        if (editingReview && editingReview._id === reviewIdToDelete) {
            setUserRating(0); setReviewText(''); setReviewImages([]); setReviewImagePreviews([]); setEditingReview(null);
        }
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
        setError(err.message || "Failed to delete review.");
        setTimeout(() => setError(null), 3000);
    } finally {
        setIsSubmittingReview(false);
    }
  };
  
  const handleAddToCart = async (productId) => {
    setSuccessMessage(''); setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addtocart/${productId}`, { method: 'GET', credentials: 'include' });
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      setSuccessMessage(data?.message || 'Product added to cart!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add product to cart.');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading) return <div className="w-full min-h-screen flex items-center justify-center pt-20 bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300 text-lg">Loading product details...</p></div>;
  if (error && !product) return <div className="w-full min-h-screen flex flex-col items-center justify-center pt-20 bg-gray-100 dark:bg-gray-900"><p className="text-red-600 dark:text-red-400 text-xl mb-4">Error: {error}</p><button onClick={() => navigate('/shop')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Back to Shop</button></div>;
  if (!product) return <div className="w-full min-h-screen flex items-center justify-center pt-20 bg-gray-100 dark:bg-gray-900"><p className="text-gray-700 dark:text-gray-300 text-lg">Product not found.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4 md:px-8 lg:px-16">
      {(successMessage || (error && product)) && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 p-3 rounded-md shadow-lg z-[100] w-auto max-w-md text-center ${successMessage ? 'bg-blue-500 dark:bg-blue-600' : 'bg-red-500 dark:bg-red-600'} text-white transition-all duration-300`}>
          <span className="inline-block">{successMessage || error}</span>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-3xl mx-auto"> {/* max-w-3xl for the simpler layout */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="border dark:border-gray-700 p-4 rounded-lg flex items-center justify-center md:h-full">
            <img src={product.image} alt={product.name} className="max-h-64 w-auto object-contain rounded-md" />
          </div>
          <div className="border dark:border-gray-700 p-4 rounded-lg flex flex-col justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">{product.name}</h1>
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => { const starType = i < (product.averageRating || 0) ? 'fill' : 'line'; return <i key={`avg-star-${i}`} className={`ri-star-${starType} text-yellow-400 text-lg`}></i>; })}
                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">({(product.averageRating || 0).toFixed(1)} rating){product.ratings && product.ratings.length > 0 && <span className="ml-1">({product.ratings.length} reviews)</span>}</span>
              </div>
              <div className="mb-3">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{(product.price - (product.discount || 0)).toFixed(2)}</span>
                {product.discount > 0 && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 line-through">₹{product.price.toFixed(2)}</span>}
              </div>
              {/* Removed Out of Stock text from here, button indicates it */}
            </div>
            <button
              onClick={() => product.quantity > 0 && handleAddToCart(product._id)}
              className={`w-full text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 mt-auto ${product.quantity > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'}`}
              disabled={product.quantity === 0}
            >
              <i className="ri-shopping-cart-line"></i>
              {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
          {hasPurchasedProduct && currentUser ? (
            <div id="review-form-section-detailpage" className="border dark:border-gray-700 p-4 rounded-lg flex flex-col justify-between">
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">{editingReview ? 'Edit Your Review:' : 'Write a Review:'}</h4>
                <div className="flex items-center mb-2">
                  <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">Your Rating:</span>
                  {[...Array(5)].map((_, i) => { const starType = i < userRating ? 'fill' : 'line'; return <i key={`user-star-${i}`} className={`ri-star-${starType} text-yellow-400 text-2xl cursor-pointer`} onClick={() => !isSubmittingReview && setUserRating(i + 1)}></i>; })}
                </div>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your thoughts about the product..." className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500" rows="2" disabled={isSubmittingReview}></textarea>
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{editingReview && editingReview.reviewImage?.length > 0 && reviewImagePreviews?.length > 0 && reviewImagePreviews.every(p => typeof p === 'string' && p.startsWith('http')) ? "Current images will be kept." : "Upload images (up to 5):"}</label>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="block w-full text-xs text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 disabled:opacity-50" disabled={isSubmittingReview} />
                  {reviewImagePreviews.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {reviewImagePreviews.map((previewUrl, index) => (
                        <div key={index} className="relative group w-16 h-16">
                          <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                          <button onClick={() => { const ni = [...reviewImages]; const np = [...reviewImagePreviews]; ni.splice(index, 1); np.splice(index, 1); setReviewImages(ni); setReviewImagePreviews(np); if (np.length === 0) { const fi = document.querySelector('input[type="file"][multiple]'); if (fi) fi.value = null; } }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity" title="Remove image" disabled={isSubmittingReview}><i className="ri-close-line"></i></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={handleReviewSubmit} disabled={isSubmittingReview || userRating === 0} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmittingReview ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}</button>
                {editingReview && (<button onClick={() => { setEditingReview(null); setUserRating(0); setReviewText(''); setReviewImages([]); setReviewImagePreviews([]); }} disabled={isSubmittingReview} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-3 rounded-lg transition-colors">Cancel Edit</button>)}
              </div>
            </div>
          ) : (
            <div className="border dark:border-gray-700 p-4 rounded-lg flex items-center justify-center h-full"><p className="text-sm text-gray-600 dark:text-gray-400 text-center">{currentUser ? "You must purchase this product to write a review." : "Please log in to write a review."}</p></div>
          )}
        </div>
        <div className="mt-6 pt-6 border-t dark:border-gray-700 md:col-span-3"> 
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Customer Reviews ({product.ratings ? product.ratings.length : 0})</h3>
          {product.ratings && product.ratings.length > 0 ? (
            <div className="space-y-3">
              {product.ratings.slice().reverse().map((review) => (
                <div key={review._id} className="p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex gap-3 items-start">
                  {review.reviewImage && review.reviewImage.length > 0 && (
                    <div className="flex-shrink-0 flex flex-wrap gap-1 w-20 md:w-24"> {/* Compact image gallery */}
                      {review.reviewImage.slice(0, 4).map((imgUrl, idx) => (
                        <img key={idx} src={imgUrl} alt={`Review image ${idx + 1}`} className="w-8 h-8 md:w-10 md:h-10 object-cover rounded cursor-pointer" onClick={() => window.open(imgUrl, '_blank')} />
                      ))}
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="flex items-center mb-1 justify-between">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => { const starType = i < review.rating ? 'fill' : 'line'; return <i key={`review-star-${review._id}-${i}`} className={`ri-star-${starType} text-yellow-400 text-sm`}></i>; })}
                        <span className="ml-2 text-xs font-semibold text-gray-700 dark:text-gray-200">{review.user ? (review.user.fullname || review.user.username || `User...${review.user._id.toString().slice(-4)}`) : 'Anonymous'}</span>
                      </div>
                      {currentUser && review.user && review.user._id === currentUser._id && (
                        <div className="flex gap-1">
                            <button onClick={() => handleEditReview(review)} className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="Edit your review"><i className="ri-pencil-line"></i></button>
                            <button onClick={() => handleDeleteReview(review._id)} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1" title="Delete your review"><i className="ri-delete-bin-line"></i></button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                    {review.reviewText && <p className="text-gray-700 dark:text-gray-300 text-sm">{review.reviewText}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;