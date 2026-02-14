import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Corrected import
import { useWishlist } from '../context/WishlistContext'; // Import useWishlist
import { ProductDetailSkeleton } from '../components/ui/SkeletonLoader.jsx';
import ProductRecommendations from '../components/ProductRecommendations.jsx';
import SEO from '../components/SEO';
import { toast } from '../utils/toast';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser(); // Correctly use the hook
  const { addToWishlist, removeFromWishlist, isProductInWishlist, loading: wishlistLoading } = useWishlist();

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
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // If not JSON, try to get text for better error reporting
        const textResponse = await response.text();
        // Throw an error with the text response if not ok, or a generic error if ok but not JSON
        if (!response.ok) throw new Error(textResponse || `HTTP error! status: ${response.status}`);
        throw new Error("Received non-JSON response from server."); // Should ideally be JSON
      }

      if (!response.ok) {
        // data should be populated here if it was JSON
        throw new Error(data?.error || data?.message || `HTTP error! status: ${response.status}`);
      }

      toast.success(data.success || (editingReview ? "Review updated!" : "Review submitted!"));
      setProduct(data.product); // Ensure data.product is valid and expected structure
      setUserRating(0); setReviewText(''); setReviewImages([]); setReviewImagePreviews([]); setEditingReview(null);
    } catch (err) {
      console.error("Review submission error:", err); // Log the full error for debugging
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
      toast.success(data.success || "Review deleted!");
      setProduct(data.product);
      if (editingReview && editingReview._id === reviewIdToDelete) {
        setUserRating(0); setReviewText(''); setReviewImages([]); setReviewImagePreviews([]); setEditingReview(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete review.");
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
      toast.success(data?.message || 'Product added to cart!');
    } catch (err) {
      toast.error(err.message || 'Failed to add product to cart.');
    }
  };

  const handleToggleWishlist = async (currentProductId) => {
    if (!currentProductId) return;
    setSuccessMessage('');
    setError(null);
    try {
      let result;
      if (isProductInWishlist(currentProductId)) {
        result = await removeFromWishlist(currentProductId);
        if (result) {
          toast.success('Product removed from wishlist!');
        } else {
          throw new Error('Failed to remove product from wishlist.');
        }
      } else {
        result = await addToWishlist(currentProductId);
        if (result) {
          toast.success('Product added to wishlist!');
        } else {
          // Error might be set by context, or throw specific error
          throw new Error('Failed to add product to wishlist. User might not be logged in.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Wishlist operation failed.');
      console.error("Wishlist toggle error on detail page:", err);
    }
  };

  if (isLoading) return <ProductDetailSkeleton />;
  if (error && !product) return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center pt-20 bg-background">
      <div className="p-8 border-4 border-black shadow-neo bg-white text-center">
        <p className="text-red-600 text-xl font-bold mb-4 uppercase">Error: {error}</p>
        <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-primary text-primary-foreground font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          Back to Shop
        </button>
      </div>
    </div>
  );
  if (!product) return (
    <div className="w-full min-h-screen flex items-center justify-center pt-20 bg-background">
      <div className="p-8 border-4 border-black shadow-neo bg-white">
        <p className="text-foreground text-xl font-black uppercase">Product not found.</p>
      </div>
    </div>
  );

  // Determine availability based on quantity
  const availability = product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "Scatch"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": (product.price - (product.discount || 0)).toFixed(2),
      "availability": availability
    },
    ...(product.averageRating > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.averageRating.toFixed(1),
        "reviewCount": product.ratings?.length || 0,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  };

  return (
    <div className="min-h-screen bg-background pt-28 pb-12 px-4 md:px-8 lg:px-16 transition-colors duration-300">
      <SEO
        title={product.name}
        description={product.description}
        image={product.image}
        type="product"
        schema={productSchema}
      />

      <div className="bg-card border-4 border-black p-4 md:p-8 shadow-neo w-full mx-auto relative overflow-hidden">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Product Image */}
          <div className="border-2 border-black p-4 bg-white flex items-center justify-center md:h-full min-h-[300px] shadow-neo-sm">
            <img src={product.image} alt={product.name} className="max-h-80 w-auto object-contain hover:scale-105 transition-transform duration-300" />
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between lg:col-span-2">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4 uppercase tracking-tighter loading-none">{product.name}</h1>

              <div className="flex items-center mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => {
                    const starType = i < (product.averageRating || 0) ? 'fill' : 'line';
                    return <i key={`avg-star-${i}`} className={`ri-star-${starType} text-yellow-400 text-2xl`}></i>;
                  })}
                </div>
                <span className="ml-3 text-sm font-bold text-gray-600 border-l-2 border-black pl-3">
                  {(product.averageRating || 0).toFixed(1)} / 5
                  {product.ratings && product.ratings.length > 0 && <span className="ml-1"> • {product.ratings.length} reviews</span>}
                </span>
              </div>

              <div className="mb-8 flex items-end gap-3">
                <span className="text-4xl md:text-5xl font-black text-foreground">₹{(product.price - (product.discount || 0)).toFixed(2)}</span>
                {product.discount > 0 && (
                  <span className="text-xl font-bold text-gray-400 line-through mb-2 decorations-2 decoration-red-500">
                    ₹{product.price.toFixed(2)}
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="ml-2 mb-2 px-2 py-1 bg-red-500 text-white font-black text-xs uppercase border-2 border-black shadow-neo-sm transform -rotate-2 rounded-none">
                    {Math.round((product.discount / product.price) * 100)}% OFF
                  </span>
                )}
              </div>

              <div className="mb-8 border-t-2 border-b-2 border-black py-4">
                <p className="text-gray-700 font-medium leading-relaxed">
                  {product.description || "No description available for this product."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <button
                onClick={() => product && product.quantity > 0 && handleToggleWishlist(product._id)}
                title={product && isProductInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                className={`p-3 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all
                            ${product && product.quantity > 0
                    ? isProductInWishlist(product._id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'}`}
                disabled={!product || product.quantity === 0 || wishlistLoading}
              >
                <i className={`${product && isProductInWishlist(product._id) ? 'ri-heart-fill' : 'ri-heart-line'} text-xl`}></i>
              </button>
              <button
                onClick={() => product && product.quantity > 0 && handleAddToCart(product._id)}
                className={`flex-grow font-black uppercase tracking-wider py-3 px-6 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2 ${product && product.quantity > 0 ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none border-gray-400'}`}
                disabled={!product || product.quantity === 0}
              >
                <i className="ri-shopping-cart-line text-lg"></i>
                {product && product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {hasPurchasedProduct && currentUser ? (
            <div id="review-form-section-detailpage" className="border-4 border-black p-6 bg-white shadow-neo flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-black text-foreground mb-4 uppercase">{editingReview ? 'Edit Your Review:' : 'Write a Review:'}</h4>
                <div className="flex items-center mb-4">
                  <span className="mr-3 text-sm font-bold text-gray-700 uppercase">Your Rating:</span>
                  {[...Array(5)].map((_, i) => { const starType = i < userRating ? 'fill' : 'line'; return <i key={`user-star-${i}`} className={`ri-star-${starType} text-yellow-400 text-2xl cursor-pointer hover:scale-110 transition-transform`} onClick={() => !isSubmittingReview && setUserRating(i + 1)}></i>; })}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="SHARE YOUR THOUGHTS..."
                  className="w-full p-3 border-2 border-black bg-gray-50 text-foreground placeholder-gray-500 font-bold text-sm focus:outline-none focus:shadow-neo-sm transition-all mb-4 resize-none rounded-none"
                  rows="4"
                  disabled={isSubmittingReview}
                />
                <div className="mb-4">
                  <label className="block text-xs font-black text-foreground mb-2 uppercase">{editingReview && editingReview.reviewImage?.length > 0 && reviewImagePreviews?.length > 0 && reviewImagePreviews.every(p => typeof p === 'string' && p.startsWith('http')) ? "Current images will be kept." : "Upload images (up to 5):"}</label>
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-black bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <div className="flex flex-col items-center">
                      <i className="ri-upload-cloud-2-line text-2xl mb-1"></i>
                      <span className="text-xs font-bold uppercase">Click to upload</span>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={isSubmittingReview} />
                  </label>

                  {reviewImagePreviews.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reviewImagePreviews.map((previewUrl, index) => (
                        <div key={index} className="relative group w-16 h-16 border-2 border-black">
                          <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                          <button onClick={() => { const ni = [...reviewImages]; const np = [...reviewImagePreviews]; ni.splice(index, 1); np.splice(index, 1); setReviewImages(ni); setReviewImagePreviews(np); if (np.length === 0) { const fi = document.querySelector('input[type="file"][multiple]'); if (fi) fi.value = null; } }} className="absolute -top-2 -right-2 bg-red-500 text-white border-2 border-black w-6 h-6 flex items-center justify-center text-xs shadow-neo-sm hover:scale-110 transition-transform" title="Remove image" disabled={isSubmittingReview}><i className="ri-close-line"></i></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={handleReviewSubmit}
                  disabled={isSubmittingReview || userRating === 0}
                  className="flex-1 bg-green-500 text-white font-black uppercase text-sm py-3 px-4 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSubmittingReview ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
                </button>
                {editingReview && (
                  <button
                    onClick={() => { setEditingReview(null); setUserRating(0); setReviewText(''); setReviewImages([]); setReviewImagePreviews([]); }}
                    disabled={isSubmittingReview}
                    className="bg-gray-200 text-black font-black uppercase text-sm py-3 px-4 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="border-4 border-black p-6 bg-gray-50 flex items-center justify-center h-full shadow-neo text-center">
              <div className="flex flex-col items-center gap-2">
                <i className="ri-lock-2-line text-3xl text-gray-400"></i>
                <p className="text-sm font-bold text-gray-500 uppercase">
                  {currentUser ? "Purchase this product to write a review." : "Log in to write a review."}
                </p>
                {!currentUser && (
                  <button onClick={() => navigate('/login')} className="mt-2 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                    Login Now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t-4 border-black md:col-span-3">
          <h3 className="text-2xl font-black text-foreground mb-6 uppercase flex items-center gap-3">
            Customer Reviews
            <span className="bg-black text-white text-sm py-1 px-3 rounded-none">{product.ratings ? product.ratings.length : 0}</span>
          </h3>

          {product.ratings && product.ratings.length > 0 ? (
            <div className="space-y-4">
              {product.ratings.slice().reverse().map((review) => (
                <div key={review._id} className="p-4 border-2 border-black bg-white shadow-neo-sm flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-grow w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => { const starType = i < review.rating ? 'fill' : 'line'; return <i key={`review-star-${review._id}-${i}`} className={`ri-star-${starType} text-yellow-500 text-sm`}></i>; })}
                        </div>
                        <h5 className="font-black text-sm uppercase text-foreground">{review.user ? (review.user.fullname || review.user.username || `User...${review.user._id?.toString().slice(-4) || 'Unknown'}`) : 'Anonymous'}</h5>
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>

                    {review.reviewText && <p className="text-gray-800 font-medium text-sm leading-relaxed mb-3 border-l-2 border-gray-200 pl-3">{review.reviewText}</p>}

                    {review.reviewImage && review.reviewImage.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.reviewImage.slice(0, 4).map((imgUrl, idx) => (
                          <div key={idx} className="border-2 border-black w-12 h-12 hover:scale-110 transition-transform cursor-pointer" onClick={() => window.open(imgUrl, '_blank')}>
                            <img src={imgUrl} alt={`Review image ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {currentUser && review.user && review.user._id === currentUser._id && (
                      <div className="flex gap-2 mt-3 justify-end border-t border-dashed border-gray-300 pt-2">
                        <button onClick={() => handleEditReview(review)} className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1" title="Edit"><i className="ri-pencil-fill"></i> Edit</button>
                        <button onClick={() => handleDeleteReview(review._id)} className="text-xs font-bold text-red-600 hover:text-red-800 uppercase flex items-center gap-1" title="Delete"><i className="ri-delete-bin-fill"></i> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-black bg-gray-50 text-center">
              <p className="text-gray-500 font-bold uppercase">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
        <ProductRecommendations productId={product._id} />
      </div>
    </div>
  );
};

export default ProductDetailPage;







