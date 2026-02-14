import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link
// Import useTheme
import { CardSkeleton } from '../components/ui/SkeletonLoader.jsx';


// The bufferToImage function is no longer needed for product images from Cloudinary URLs
// and can be removed if not used elsewhere for other buffer-to-image conversions.

const AllProductsPage = () => {
  // Consume theme
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
            <div className="bg-gray-200 animate-pulse h-8 w-64 border-2 border-black shadow-neo"></div>
            <div className="flex gap-3 items-center">
              <div className="bg-gray-200 animate-pulse h-10 w-48 border-2 border-black shadow-neo-sm"></div>
              <div className="bg-gray-200 animate-pulse h-10 w-32 border-2 border-black shadow-neo-sm"></div>
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
    <div className="w-full">
      {/* Main content for Product Management */}
      <div className="w-full flex flex-col gap-8">
        {/* Action Bar */}
        <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">Product Management</h1>
              <p className="text-lg font-bold text-gray-600 uppercase">Manage your inventory</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white border-4 border-black shadow-neo-sm font-bold uppercase focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all w-full sm:w-auto"
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? 'LOADING...' : 'ALL CATEGORIES'}
                </option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <label htmlFor="outOfStockFilter" className="flex items-center cursor-pointer bg-white px-4 py-3 border-4 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all w-full sm:w-auto">
                <input
                  id="outOfStockFilter"
                  type="checkbox"
                  checked={showOutOfStockOnly}
                  onChange={(e) => setShowOutOfStockOnly(e.target.checked)}
                  className="h-5 w-5 border-2 border-black rounded-none focus:ring-0 text-black"
                />
                <span className="ml-3 font-bold uppercase text-sm">
                  Out of Stock Only
                </span>
              </label>
              <button
                onClick={handleDeleteAll}
                className="px-6 py-3 bg-red-600 text-white border-4 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black uppercase w-full sm:w-auto"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>

        {products.length === 0 && !loading && (
          <div className="p-12 text-center border-4 border-black border-dashed bg-gray-50">
            <p className="text-2xl font-black uppercase text-gray-400">No products found.</p>
          </div>
        )}

        {/* Product List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
                  className="w-full border-4 border-black bg-white shadow-neo transition-all duration-300 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none flex flex-col group relative"
                >
                  <div
                    className="w-full h-52 flex items-center justify-center relative border-b-4 border-black bg-gray-100 p-4"
                  >
                    {product.image && typeof product.image === 'string' ? (
                      <img
                        src={product.image}
                        alt={product.name || "Product Image"}
                        className="h-full w-full object-contain filter drop-shadow-md"
                      />
                    ) : (
                      <span className="text-gray-400 font-bold uppercase">No Image</span>
                    )}
                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-black uppercase px-2 py-1 border-2 border-black">
                        {`${discountPercentage}% OFF`}
                      </div>
                    )}
                    {product.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white border-4 border-white px-4 py-2 font-black uppercase -rotate-12 shadow-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="flex flex-col justify-between items-start px-4 py-4 flex-grow bg-white"
                  >
                    <div className="mb-4 w-full">
                      <h3 className="font-black text-lg uppercase truncate mb-1" title={product.name}>{product.name}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <h4 className="text-xl font-black">₹{finalPrice.toFixed(2)}</h4>
                        {discountAmount > 0 && (
                          <h4 className="text-sm text-gray-500 font-bold line-through decoration-2">
                            {originalPrice.toFixed(2)}
                          </h4>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold uppercase border-t-2 border-black pt-2">
                        <span className={product.quantity < 5 ? 'text-red-600' : 'text-gray-600'}>
                          Qty: {product.quantity !== undefined ? product.quantity : 'N/A'}
                        </span>
                        <span className="text-blue-600 truncate max-w-[50%]">
                          {product.category?.name || 'No Cat'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full flex gap-2 mt-auto">
                      <Link
                        to={`/admin/edit-product/${product._id}`}
                        className="flex-1 text-center text-xs bg-blue-600 text-white py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-black uppercase"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => initiateDeleteProduct(product._id)}
                        className="flex-1 text-center text-xs bg-red-600 text-white py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-black uppercase"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 border-4 border-black bg-gray-100 animate-pulse"></div>
            ))}
          </div>
        )}
        <div ref={observerTarget} className="h-4" />
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-neo p-8 max-w-sm w-full relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600 border-b-2 border-black"></div>
            <h3 className="text-2xl font-black uppercase mb-4">Confirm Delete</h3>
            <p className="mb-8 text-lg font-bold text-gray-600 uppercase leading-tight">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteProduct}
                className="px-6 py-3 border-2 border-black font-black uppercase hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-6 py-3 bg-red-600 text-white border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black uppercase"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProductsPage;








