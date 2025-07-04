import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useTheme } from '../context/ThemeContext'; // Import useTheme


// The bufferToImage function is no longer needed for product images from Cloudinary URLs
// and can be removed if not used elsewhere for other buffer-to-image conversions.

const AllProductsPage = () => {
  const { theme } = useTheme(); // Consume theme
  // const navigate = useNavigate(); // Remove useNavigate initialization
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false); // New state for filter

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`, { credentials: 'include' });
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
      }
      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      setProducts(data?.products || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
          fetchProducts();
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
        fetchProducts();
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
    return <div className="w-full min-h-screen flex items-center justify-center py-20 dark:text-gray-300">Loading products...</div>;
  }

  if (error) {
    return <div className="w-full min-h-screen flex items-center justify-center py-20 text-red-500 dark:text-red-400">Error fetching products: {error}</div>;
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-start py-20 pt-28 px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"> {/* Added px-6 for horizontal padding, changed flex to flex-col */}
      {/* Sidebar REMOVED */}

      {/* Main content */}
      <div className="w-full flex flex-col gap-6"> {/* Adjusted width to full, removed padding, increased gap */}
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-200">Product Management</h1>
          <div className="flex gap-3 items-center"> {/* Added items-center */}
            <label htmlFor="outOfStockFilter" className="flex items-center cursor-pointer">
              <input
                id="outOfStockFilter"
                type="checkbox"
                checked={showOutOfStockOnly}
                onChange={(e) => setShowOutOfStockOnly(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Out of Stock Only
              </span>
            </label>
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm transition-colors text-sm font-medium"
            >
              Delete All Products
            </button>
          </div>
        </div>

        {products.length === 0 && !loading && (
          <p className="text-gray-600 dark:text-gray-400">No products found.</p>
        )}

        {/* Product List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"> {/* Reverted to Shop page grid */}
          {products
            .filter(product => !showOutOfStockOnly || product.quantity === 0)
            .map((product) => {
            const originalPrice = parseFloat(product.price) || 0;
            const discountAmount = parseFloat(product.discount) || 0;
            const finalPrice = originalPrice - discountAmount;
            const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

            return (
            <div
              key={product._id}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-md dark:shadow-lg overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-xl flex flex-col group relative" // Added group and relative
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
                </div>
                {/* Buttons container - initially hidden, shown on hover */}
                <div className="absolute bottom-4 right-4 mt-auto pt-2 flex justify-end gap-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300">
                    <Link
                        to={`/admin/edit-product/${product._id}`}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded shadow"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={() => initiateDeleteProduct(product._id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded shadow"
                    >
                        Delete
                    </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
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
