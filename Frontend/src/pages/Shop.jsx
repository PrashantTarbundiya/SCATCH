import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
// cn and motion imports are no longer needed here as they are in HoverEffect.jsx
import { HoverEffect } from '../components/ui/HoverEffect'; // Import the external HoverEffect

// ProductCard component is now defined in HoverEffect.jsx and exported from there if needed separately,
// but HoverEffect itself uses it internally. So, no need to define ProductCard here.

const ShopPage = () => {
  // const { theme } = useTheme(); // theme is used by ProductCard, which is now in HoverEffect.jsx
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Page level error for fetching products
  const [successMessage, setSuccessMessage] = useState(''); // Page level success message

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
            navigate('/login');
            throw new Error(data?.error || data?.message || 'Unauthorized access. Please login.');
          }
          throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
        }
        
        setProducts(data?.products || []);
        // Global success message for fetch, if needed.
        // The ProductCard's add to cart success/error is handled within ProductCard itself.
        if (data?.message && !data?.products) { // Example: "No products found but request was ok"
            setSuccessMessage(data.message);
        } else if (data?.products?.length > 0 && data?.success?.[0]) { // If products and a success message
            setSuccessMessage(data.success[0]);
        }


      } catch (err) {
        setError(err.message || 'Failed to fetch products.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  const handleAddToCart = async (productId) => {
    // This function is passed to ProductCard via HoverEffect's items prop
    setSuccessMessage(''); // Clear global messages
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
      
      // Set global success message for add to cart
      setSuccessMessage(data?.message || 'Product added to cart!');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear after 3s

    } catch (err) {
      // Set global error message for add to cart
      setError(err.message || 'Failed to add product to cart.');
      setTimeout(() => setError(null), 3000); // Clear after 3s
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center py-10 dark:text-gray-300">
          {/* <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div> */}
          Loading products...
        </div>
      </div>
    );
  }

  // Prepare products for HoverEffect component
  // The item structure for HoverEffect now expects `_id` and `onAddToCart` directly on the item.
  const productsWithHandler = products.map(product => ({
    ...product, // Spread all product properties
    _id: product._id, // Ensure _id is present for key in HoverEffect
    onAddToCart: handleAddToCart // Pass the ShopPage's handler
  }));

  return (
    <>
      {/* Notification Banner for page-level messages */}
      {(successMessage || error) && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 p-3 rounded-md shadow-lg z-[100] ${successMessage ? 'bg-blue-500 dark:bg-blue-600' : 'bg-red-500 dark:bg-red-600'} text-white transition-all duration-300`}>
          <span className="inline-block">{successMessage || error}</span>
        </div>
      )}

      <div className="w-full min-h-screen flex items-start py-10 pt-24 md:pt-28 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-4 md:px-6 lg:px-8">
        {/* Sidebar */}
        <div className="w-full md:w-[25%] flex-col items-start hidden md:flex bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mr-6 transition-colors duration-300">
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

        {/* Products Grid with Hover Effect */}
        <div className="w-full md:w-[75%] flex flex-col gap-5 md:pl-5">
          {/* Error message for product fetching is handled by the global banner */}
          {!isLoading && !error && products.length === 0 && (
            <div className="text-center col-span-full py-10 text-gray-600 dark:text-gray-400">
              No products found.
            </div>
          )}
          {products.length > 0 && (
            // The HoverEffect component itself defines the grid structure (grid, grid-cols, gap)
            // So we pass the items and any additional className for the container if needed,
            // but the grid layout classes are part of HoverEffect's definition now.
            // The className prop on HoverEffect in Shop.jsx was "py-0" in your example.
            // The HoverEffect component itself has "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            // If you want to override these, you pass them in the className here.
            // For now, I'll use the "py-0" as per your example, assuming HoverEffect's defaults are fine.
            <HoverEffect items={productsWithHandler} className="py-0" /> 
          )}
        </div>
      </div>
    </>
  );
};

export default ShopPage;