import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useTheme } from '../context/ThemeContext'; // Import useTheme custom hook


const ShopPage = () => {
  const { theme } = useTheme(); // Consume theme using the custom hook
  const navigate = useNavigate(); // Initialize useNavigate
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/shop`, {
          credentials: 'include',
        });

        let data;
        if (response.headers.get("content-type")?.includes("application/json")) {
            data = await response.json();
        }

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized, redirect to login
            navigate('/login');
            // It's good practice to also set an error or clear data to prevent rendering stale info
            // For now, the redirect should prevent further rendering of this page's content.
            // We might want to throw an error here as well so the `catch` block still runs,
            // or return early to prevent further processing.
            throw new Error(data?.error || data?.message || 'Unauthorized access. Please login.');
          }
          throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
        }
        
        setProducts(data?.products || []);
        if (data?.success && data?.success.length > 0) {
          setSuccessMessage(data.success[0]);
        } else if (data?.message && !data?.products) {
          setSuccessMessage(data.message);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch products.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    setSuccessMessage('');
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addtocart/${productId}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      
      setSuccessMessage(data?.message || 'Product added to cart!');
    } catch (err) {
      setError(err.message || 'Failed to add product to cart.');
    }
  };

  // Function to convert buffer to base64 string for image display
  const BufferToBase64 = (buffer) => {
    if (!buffer || !buffer.data) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer.data);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };


  if (isLoading) {
    return <div className="text-center py-10 dark:text-gray-300">Loading products...</div>;
  }

  return (
    <>
      {/* Header is rendered in App.jsx */}

      {(successMessage || error) && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 p-3 rounded-md shadow-lg z-50 ${successMessage ? 'bg-blue-500 dark:bg-blue-600' : 'bg-red-500 dark:bg-red-600'} text-white transition-all duration-300`}> {/* Reverted to top-20 */}
          <span className="inline-block">{successMessage || error}</span>
        </div>
      )}

      <div className="w-full min-h-screen flex items-start py-10 pt-24 md:pt-28 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-4 md:px-6 lg:px-8"> {/* Added px for horizontal padding, Added pt for header, dark mode bg */}
        {/* Sidebar */}
        <div className="w-full md:w-[25%] flex-col items-start hidden md:flex bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mr-6 transition-colors duration-300"> {/* Dark mode for sidebar */}
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-gray-800 dark:text-gray-200">Sort by</h3>
            <form>
              <select className="border-[1px] border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
              </select>
            </form>
          </div>

          <div className="flex flex-col mt-10">
            <Link className="block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" to="/shop?filter=new">
              New Collection
            </Link>
            <Link className="block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" to="/shop?filter=all">
              All Products
            </Link>
            <Link className="block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" to="/shop?filter=discounted">
              Discounted Products
            </Link>
          </div>

          <div className="mt-16">
            <h4 className="block w-fit mb-2 font-semibold text-gray-800 dark:text-gray-200">
              Filter by:
            </h4>
            <Link className="block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" to="/shop?filter=availability">
              Availability
            </Link>
            <Link className="block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" to="/shop?filter=discount">
              Discount
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full md:w-[75%] flex flex-col gap-5 md:pl-5">
          {error && !isLoading && <div className="text-red-500 dark:text-red-400 text-center col-span-full">Error fetching products: {error}</div>}
          {!isLoading && !error && products.length === 0 && (
            <div className="text-center col-span-full py-10 text-gray-600 dark:text-gray-400">No products found.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"> {/* Changed to lg:grid-cols-4 */}
            {products.map((product) => {
              const originalPrice = parseFloat(product.price) || 0;
              const discountAmount = parseFloat(product.discount) || 0;
              const finalPrice = originalPrice - discountAmount;
              const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

              return (
              <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-md dark:shadow-lg overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-xl" key={product._id}>
                <div
                  className="w-full h-52 flex items-center justify-center relative" // Added relative positioning
                  style={{ backgroundColor: product.bgcolor || (theme === 'dark' ? '#374151' : '#f0f0f0') }} // Dynamic default bgcolor for dark/light
                >
                  {product.image && product.image.data ? ( // Added product.image.data check
                     <img
                        className="h-[12rem] object-contain"
                        src={`data:image/jpeg;base64,${BufferToBase64(product.image)}`}
                        alt={product.name || "Product Image"}
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
                  className="flex justify-between items-center px-4 py-4"
                  style={{
                    // For panelcolor and textcolor, if they are set, they override dark mode.
                    // If not set, we can apply dark mode defaults.
                    backgroundColor: product.panelcolor || (theme === 'dark' ? '#1f2937' : '#ffffff'),
                    color: product.textcolor || (theme === 'dark' ? '#e5e7eb' : '#111827'),
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-baseline gap-2"> {/* items-baseline for better alignment if font sizes differ */}
                      <h4 className="text-md font-bold">₹ {finalPrice.toFixed(2)}</h4>
                      {discountAmount > 0 && (
                        <h4 className="text-sm text-gray-500 dark:text-gray-400 line-through">
                          {originalPrice.toFixed(2)}
                        </h4>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product._id)}
                    title="Add to cart"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <i className="ri-add-line text-xl"></i>
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShopPage;
