import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { HoverEffect } from '../components/ui/HoverEffect';
import { useWishlist } from '../context/WishlistContext'; // Import useWishlist
import { useUser } from '../context/UserContext'; // Import useUser

const ShopPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // To read URL query parameters

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentSort, setCurrentSort] = useState('newest'); // Default sort
  const [currentFilter, setCurrentFilter] = useState('all'); // Default filter
  const { addToWishlist, removeFromWishlist, isProductInWishlist, loading: wishlistLoading, wishlistItems, error: wishlistError } = useWishlist();
  const { currentUser: user, authLoading } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sortBy = params.get('sortBy') || 'newest'; // Default to newest if not present
    const filterBy = params.get('filter') || 'all'; // Default to all

    setCurrentSort(sortBy);
    setCurrentFilter(filterBy);

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      let apiUrl = `${import.meta.env.VITE_API_BASE_URL}/products?sortBy=${sortBy}&filter=${filterBy}`;
      // The backend now handles 'discounted' directly via filter or discounted query param.
      // We can simplify frontend logic if backend handles 'filter=discounted'
      // For now, let's assume backend handles 'filter=discounted' and 'filter=availability'

      try {
        const response = await fetch(apiUrl, { // Use apiUrl with query params
          credentials: 'include',
        });

        let data;
        if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
        }

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login'); // Redirect to login if unauthorized
            throw new Error(data?.error || data?.message || 'Unauthorized access. Please login.');
          }
          throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
        }
        
        setProducts(data?.products || []);
        if (data?.message && !data?.products) {
            setSuccessMessage(data.message);
        } else if (data?.products?.length > 0 && data?.success?.[0]) {
            setSuccessMessage(data.success[0]);
        }

      } catch (err) {
        setError(err.message || 'Failed to fetch products.');
        console.error("Fetch products error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [location.search, navigate]); // Re-fetch when URL search params change

  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    const params = new URLSearchParams(location.search);
    params.set('sortBy', newSortBy);
    navigate(`?${params.toString()}`);
  };

  // No need for handleFilterChange if using Link components to set URL params directly

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
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      setError(err.message || 'Failed to add product to cart.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleWishlist = async (productId) => {
    setSuccessMessage('');
    setError(null);
    try {
      let result;
      if (isProductInWishlist(productId)) {
        result = await removeFromWishlist(productId);
        if (result) {
          setSuccessMessage('Product removed from wishlist!');
        } else {
          throw new Error('Failed to remove product from wishlist.');
        }
      } else {
        result = await addToWishlist(productId);
        if (result) {
          setSuccessMessage('Product added to wishlist!');
        } else {
          // Error might be set by context, or throw specific error
          throw new Error('Failed to add product to wishlist. User might not be logged in or product already in wishlist.');
        }
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Wishlist operation failed.');
      console.error("Wishlist toggle error:", err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    setSuccessMessage('');
    setError(null);
    try {
      const result = await removeFromWishlist(productId);
      if (result) {
        setSuccessMessage('Product removed from wishlist!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to remove product from wishlist.');
      }
    } catch (err) {
      setError(err.message || 'Failed to remove product from wishlist.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddToCartFromWishlist = async (productId) => {
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
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      setError(err.message || 'Failed to add product to cart.');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center py-10 dark:text-gray-300">
          Loading products...
        </div>
      </div>
    );
  }
  
  // Prepare products for HoverEffect component
  // ProductCard will handle navigation to detail page
  let displayProducts = products;
  
  // If filter is wishlist, show wishlist items instead
  if (currentFilter === 'wishlist') {
    displayProducts = wishlistItems
      .filter(item => item.product) // Only include items with valid product data
      .map(item => ({
        ...item.product, // Extract the product data
        quantity: item.product.quantity || 1, // Ensure quantity is set (default to 1 if missing)
      }));
  }
  
  const productsForHoverEffect = displayProducts.map(product => ({
    ...product,
    onAddToCart: currentFilter === 'wishlist' ? handleAddToCartFromWishlist : handleAddToCart, // Use appropriate handler
    onToggleWishlist: () => handleToggleWishlist(product._id),
    isInWishlist: currentFilter === 'wishlist' ? true : isProductInWishlist(product._id), // All wishlist items are in wishlist
    wishlistLoading: wishlistLoading, // Pass loading state for individual button
    // No onViewDetails needed here, ProductCard will navigate
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
            {/* Form removed, select directly updates URL via navigate */}
            <select
              value={currentSort}
              onChange={handleSortChange}
              className="border-[1px] border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              {/* Add other sort options like price_asc, price_desc if backend supports */}
            </select>
          </div>

          <div className="flex flex-col mt-10">
            <h4 className="block w-fit mb-2 font-semibold text-gray-800 dark:text-gray-200">
              Collections:
            </h4>
            <Link className={`block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ${currentFilter === 'newCollection' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`} to="/shop?filter=newCollection&sortBy=newest">
              New Collection
            </Link>
            <Link className={`block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ${currentFilter === 'all' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`} to="/shop?filter=all&sortBy=newest">
              All Products
            </Link>
            <Link className={`block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ${currentFilter === 'discounted' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`} to="/shop?filter=discounted&sortBy=popular">
              Discounted Products
            </Link>
            <Link className={`block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ${currentFilter === 'wishlist' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`} to="/shop?filter=wishlist&sortBy=newest">
              Wishlist
            </Link>
          </div>

          <div className="mt-10"> {/* Adjusted margin */}
            <h4 className="block w-fit mb-2 font-semibold text-gray-800 dark:text-gray-200">
              Filter by:
            </h4>
            <Link className={`block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ${currentFilter === 'availability' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`} to="/shop?filter=availability&sortBy=newest">
              In Stock
            </Link>
            {/* The "Discount" filter link is covered by "Discounted Products" above, or can be a separate filter if backend logic differs */}
            {/* For example, if "Discounted Products" is a collection and "Discount" is a general filter */}
            {/* <Link className={`block w-fit mb-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 ${currentFilter === 'discount' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`} to="/shop?filter=discount&sortBy=popular">
              Discount
            </Link> */}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full md:w-[75%] flex flex-col gap-5 md:pl-5">
          {currentFilter === 'wishlist' && !user && !authLoading ? (
            <div className="text-center py-20">
              <p className="text-xl mb-4 text-gray-700 dark:text-gray-300">Please login to view your wishlist.</p>
              <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Login
              </Link>
            </div>
          ) : currentFilter === 'wishlist' && wishlistError ? (
            <div className="text-center py-10 text-red-500 dark:text-red-400">
              Error loading wishlist: {wishlistError}
            </div>
          ) : currentFilter === 'wishlist' && wishlistItems.length === 0 && !wishlistLoading ? (
            <div className="text-center py-20">
              <p className="text-xl mb-4 text-gray-700 dark:text-gray-300">Your wishlist is currently empty.</p>
              <Link to="/shop?filter=all&sortBy=newest" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Discover Products
              </Link>
            </div>
          ) : error && !isLoading ? (
            <div className="text-center col-span-full py-10 text-red-500 dark:text-red-400">
              Error: {error}
            </div>
          ) : !isLoading && !error && displayProducts.length === 0 ? (
            <div className="text-center col-span-full py-10 text-gray-600 dark:text-gray-400">
              No products found.
            </div>
          ) : displayProducts.length > 0 ? (
            <HoverEffect items={productsForHoverEffect} className="py-0" />
          ) : null}
        </div>
      </div>
      {/* Modal and its related style tag have been removed */}
    </>
  );
};

export default ShopPage;