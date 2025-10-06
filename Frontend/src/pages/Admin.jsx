import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { CardSkeleton } from '../components/ui/SkeletonLoader.jsx';


// The bufferToImage function is no longer needed for product images from Cloudinary URLs
// and can be removed if not used elsewhere for other buffer-to-image conversions.

const AllProductsPage = () => {
  const { theme } = useTheme(); // Consume theme
  // const navigate = useNavigate(); // Remove useNavigate initialization
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(''); // Category filter
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const observerTarget = useRef(null);
  const PRODUCTS_PER_PAGE = 20;

  const fetchProducts = useCallback(async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setProducts([]);
    }
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/products?page=${page}&limit=${PRODUCTS_PER_PAGE}`,
        { credentials: 'include' }
      );
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
      }
      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      
      const newProducts = data?.products || [];
      
      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      
      setHasMore(data?.pagination?.hasNextPage || false);
      setTotalProducts(data?.pagination?.totalProducts || newProducts.length);
    } catch (err) {
      setError(err.message || 'Failed to fetch products.');
      if (!append) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(1, false);
    fetchCategories();
  }, [fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [currentPage, hasMore, loadingMore, loading, fetchProducts]);

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete all products? This action cannot be undone.")) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/all`, {
          method: 'DELETE',
          credentials: 'include',
        });
        let responseData;
        if (response.headers.get("content-type")?.includes("application/json")) {
            responseData = await response.json();
        }
        if (response.ok) {
          alert(responseData?.message || "All products deleted successfully.");
          setCurrentPage(1);
          setHasMore(true);
          fetchProducts(1, false);
        } else {
          alert(`Failed to delete products: ${responseData?.error || responseData?.message || response.statusText || 'Unknown server error'}`);
        }
      } catch (err) {
        console.error("Error deleting all products:", err);
        alert(`Error deleting products: ${err.message || 'Unknown server error'}`);
      }
    }
  };

  const initiateDeleteProduct = (productId) => {
    setProductToDelete(productId);
    setShowConfirmDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${productToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      let responseData;
      if (response.headers.get("content-type")?.includes("application/json")) {
          responseData = await response.json();
      }
      if (response.ok) {
        alert(responseData?.message || "Product deleted successfully.");
        setCurrentPage(1);
        setHasMore(true);
        fetchProducts(1, false);
      } else {
        alert(`Failed to delete product: ${responseData?.error || responseData?.message || response.statusText || `HTTP error! status: ${response.status}`}`);
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert(`Error deleting product: ${err.message || 'Unknown server error'}`);
    } finally {
      setShowConfirmDialog(false);
      setProductToDelete(null);
    }
  };

  const cancelDeleteProduct = () => {
    setShowConfirmDialog(false);
    setProductToDelete(null);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-8 w-64 rounded"></div>
            <div className="flex gap-3 items-center">
              <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-10 w-48 rounded"></div>
              <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-10 w-32 rounded"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} showImage={true} lines={2} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="w-full min-h-screen flex items-center justify-center py-20 text-red-500 dark:text-red-400">Error fetching products: {error}</div>;
  }

  return (
    // The parent div with padding and margin for sidebar is now in OwnerProtectedRoute.jsx
    // This div should just be a fragment or a simple container for its own content.
    <div className="w-full"> {/* Removed min-h-screen, py, pt, px, bg colors - handled by parent */}
      {/* Admin Navigation REMOVED - Now handled by AdminSidebar */}

      {/* Main content for Product Management */}
      <div className="w-full flex flex-col gap-6">
        {/* Action Bar - Specific to Product Management */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white mb-2">Product Management</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage your product inventory and settings</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? 'Loading categories...' : 'All Categories'}
                </option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                {!categoriesLoading && categories.length === 0 && (
                  <option value="" disabled>No categories available</option>
                )}
              </select>
              <label htmlFor="outOfStockFilter" className="flex items-center cursor-pointer bg-slate-50 dark:bg-slate-700 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200">
                <input
                  id="outOfStockFilter"
                  type="checkbox"
                  checked={showOutOfStockOnly}
                  onChange={(e) => setShowOutOfStockOnly(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                />
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Show Out of Stock Only
                </span>
              </label>
              <button
                onClick={handleDeleteAll}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 text-sm font-semibold w-full sm:w-auto"
              >
                Delete All Products
              </button>
            </div>
          </div>
        </div>

        {products.length === 0 && !loading && (
          <p className="text-gray-600 dark:text-gray-400">No products found.</p>
        )}

        {/* Product List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
          {products
            .filter(product => {
              const stockFilter = !showOutOfStockOnly || product.quantity === 0;
              const categoryFilter = !selectedCategory || product.category?.name === selectedCategory;
              return stockFilter && categoryFilter;
            })
            .map((product) => {
            const originalPrice = parseFloat(product.price) || 0;
            const discountAmount = parseFloat(product.discount) || 0;
            const finalPrice = originalPrice - discountAmount;
            const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

            return (
            <div
              key={product._id}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg dark:shadow-xl overflow-hidden bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-2xl md:hover:scale-105 flex flex-col group relative"
            >
              <div
                className="w-full h-52 flex items-center justify-center relative" // Added relative for discount badge positioning
                style={{ backgroundColor: product.bgcolor ||(theme === 'dark' ? '#374151' : '#f0f0f0') }} // Default BG based on theme or product.bgcolor
              >
                {product.image && typeof product.image === 'string' ? (
                  <img
                    src={product.image} // Directly use the Cloudinary URL
                    alt={product.name || "Product Image"}
                    className="h-[12rem] w-full object-contain" // Matched Shop page image style, added w-full
                  />
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">No Image</span>
                )}
                 {/* Discount Badge - Show only if discount > 0 */}
                {discountPercentage > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                    {`${discountPercentage}% OFF`}
                  </div>
                )}
              </div>
              <div
                className="flex flex-col justify-between items-start px-4 py-4 flex-grow"
                style={{
                  backgroundColor: product.panelcolor || (theme === 'dark' ? '#1f2937' : '#ffffff'), // product.panelcolor or theme default
                  color: product.textcolor || (theme === 'dark' ? '#e5e7eb' : '#111827'), // product.textcolor or theme default
                }}
              >
                <div className="mb-10">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <div className="flex items-baseline gap-2"> {/* items-baseline for better alignment */}
                    <h4 className="text-md font-bold">₹ {finalPrice.toFixed(2)}</h4>
                    {discountAmount > 0 && (
                      <h4 className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {originalPrice.toFixed(2)}
                      </h4>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quantity Left: {product.quantity !== undefined ? product.quantity : 'N/A'}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                    {product.category?.name || 'No Category'}
                  </p>
                </div>
                {/* Buttons container - always visible on mobile, hover on desktop */}
                <div className="absolute bottom-4 right-4 mt-auto pt-2 flex justify-end gap-2 opacity-100 visible md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300">
                    <Link
                        to={`/admin/edit-product/${product._id}`}
                        className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-xl shadow-lg transition-all duration-200 md:hover:scale-105 font-medium"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={() => initiateDeleteProduct(product._id)}
                        className="text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-xl shadow-lg transition-all duration-200 md:hover:scale-105 font-medium"
                    >
                        Delete
                    </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
        
        {/* Infinite Scroll Trigger & Loading Indicator */}
        {loadingMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mt-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={`loading-${i}`} showImage={true} lines={2} />
            ))}
          </div>
        )}
        <div ref={observerTarget} className="h-4" />
      </div>

      {/* Sales Data Section REMOVED */}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Confirm Deletion</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteProduct}
                className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProductsPage;
