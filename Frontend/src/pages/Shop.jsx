import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HoverEffect } from '../components/ui/HoverEffect';
import { useWishlist } from '../context/WishlistContext';
import { useUser } from '../context/UserContext';
import { CardSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { toast } from '../utils/toast';
import axios from 'axios';

const ShopPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentSort, setCurrentSort] = useState('newest');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);
  
  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const observerTarget = useRef(null);
  const PRODUCTS_PER_PAGE = 12;

  const { addToWishlist, removeFromWishlist, isProductInWishlist, loading: wishlistLoading, wishlistItems, error: wishlistError } = useWishlist();
  const { currentUser: user, authLoading } = useUser();

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/categories?active=true`);
        if (response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Handle clicking outside filter menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterMenuOpen && filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
    };

    if (isFilterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isFilterMenuOpen]);

  // Fetch products with pagination
  const fetchProducts = useCallback(async (page = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setProducts([]);
    }
    setError(null);
    
    const params = new URLSearchParams(location.search);
    const sortBy = params.get('sortBy') || 'newest';
    const filterBy = params.get('filter') || 'all';
    const query = params.get('q') || '';
    const minPrice = params.get('minPrice') || '';
    const maxPrice = params.get('maxPrice') || '';
    const category = params.get('category') || '';
    const rating = params.get('rating') || '';

    let apiUrl;
    const isSearchMode = query || minPrice || maxPrice || category || rating;
    
    if (isSearchMode) {
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('query', query);
      if (minPrice) searchParams.append('minPrice', minPrice);
      if (maxPrice) searchParams.append('maxPrice', maxPrice);
      if (category) searchParams.append('category', category);
      if (rating) searchParams.append('minRating', rating);
      if (sortBy) searchParams.append('sortBy', sortBy);
      searchParams.append('page', page);
      searchParams.append('limit', PRODUCTS_PER_PAGE);
      
      apiUrl = `${import.meta.env.VITE_API_BASE_URL}/products/search?${searchParams.toString()}`;
    } else {
      apiUrl = `${import.meta.env.VITE_API_BASE_URL}/products?sortBy=${sortBy}&filter=${filterBy}&page=${page}&limit=${PRODUCTS_PER_PAGE}`;
    }

    try {
      const response = await fetch(apiUrl, {
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
      
      const newProducts = data?.products || [];
      
      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
      
      setHasMore(data?.pagination?.hasNextPage || false);
      setTotalProducts(data?.pagination?.totalProducts || newProducts.length);
      
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
      setIsLoadingMore(false);
    }
  }, [location.search, navigate]);

  // Initial load and reset on search params change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sortBy = params.get('sortBy') || 'newest';
    const filterBy = params.get('filter') || 'all';
    const query = params.get('q') || '';
    const minPrice = params.get('minPrice') || '';
    const maxPrice = params.get('maxPrice') || '';
    const category = params.get('category') || '';
    const rating = params.get('rating') || '';

    setCurrentSort(sortBy);
    setCurrentFilter(filterBy);
    setSearchQuery(query);
    setPriceRange({ min: minPrice, max: maxPrice });
    setSelectedCategory(category);
    setMinRating(rating);
    setCurrentPage(1);
    setHasMore(true);
    
    fetchProducts(1, false);
  }, [location.search, fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (currentFilter === 'wishlist' || isLoading || isLoadingMore || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
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
  }, [currentPage, hasMore, isLoadingMore, isLoading, currentFilter, fetchProducts]);

  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    const params = new URLSearchParams(location.search);
    params.set('sortBy', newSortBy);
    navigate(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    params.set('sortBy', currentSort);
    navigate(`?${params.toString()}`);
  };

  const handlePriceFilterApply = () => {
    const params = new URLSearchParams(location.search);
    if (priceRange.min) {
      params.set('minPrice', priceRange.min);
    } else {
      params.delete('minPrice');
    }
    if (priceRange.max) {
      params.set('maxPrice', priceRange.max);
    } else {
      params.delete('maxPrice');
    }
    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    if (minRating) {
      params.set('rating', minRating);
    } else {
      params.delete('rating');
    }
    params.set('sortBy', currentSort);
    navigate(`?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setSelectedCategory('');
    setMinRating('');
    navigate('/shop?sortBy=newest&filter=all');
  };

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
      
      toast.success(data?.message || 'Product added to cart!');

    } catch (err) {
      toast.error(err.message || 'Failed to add product to cart.');
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
          toast.success('Product removed from wishlist!');
        } else {
          throw new Error('Failed to remove product from wishlist.');
        }
      } else {
        result = await addToWishlist(productId);
        if (result) {
          toast.success('Product added to wishlist!');
        } else {
          // Error might be set by context, or throw specific error
          throw new Error('Failed to add product to wishlist. User might not be logged in or product already in wishlist.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Wishlist operation failed.');
      console.error("Wishlist toggle error:", err);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    setSuccessMessage('');
    setError(null);
    try {
      const result = await removeFromWishlist(productId);
      if (result) {
        toast.success('Product removed from wishlist!');
      } else {
        throw new Error('Failed to remove product from wishlist.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove product from wishlist.');
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
      
      toast.success(data?.message || 'Product added to cart!');

    } catch (err) {
      toast.error(err.message || 'Failed to add product to cart.');
    }
  };

  // Prepare products for HoverEffect component
  let displayProducts = products;
  
  // If filter is wishlist, show wishlist items instead
  if (currentFilter === 'wishlist') {
    displayProducts = wishlistItems
      .filter(item => item.product)
      .map(item => ({
        ...item.product,
        quantity: item.product.quantity || 1,
      }));
  }
  
  const productsForHoverEffect = useMemo(() => 
    displayProducts.map(product => ({
      ...product,
      onAddToCart: currentFilter === 'wishlist' ? handleAddToCartFromWishlist : handleAddToCart,
      onToggleWishlist: () => handleToggleWishlist(product._id),
      isInWishlist: currentFilter === 'wishlist' ? true : isProductInWishlist(product._id),
      wishlistLoading: wishlistLoading,
    })), [displayProducts, currentFilter, handleAddToCartFromWishlist, handleAddToCart, handleToggleWishlist, isProductInWishlist, wishlistLoading]
  );

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col py-10 pt-24 md:pt-28 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-4 md:px-6 lg:px-8">
        {/* Search Bar Skeleton */}
        <div className="w-full mb-5 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
              <div className="w-24 md:w-32 h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
            </div>
            <div className="w-full md:w-32 h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          </div>
        </div>

        {/* Products Grid Skeleton - 2 columns on mobile, 4 on large screens */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} showImage={true} lines={3} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-h-screen flex flex-col items-start py-10 pt-24 md:pt-28 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 px-4 md:px-6 lg:px-8">
        
        {/* Overlay */}
        {isFilterMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" />
        )}

        {/* Slide-in Filter Menu (Unified for Mobile and Desktop) */}
        <div
          ref={filterMenuRef}
          className={`fixed top-0 right-0 h-full w-[85%] max-w-sm md:max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${
            isFilterMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Filter Menu Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 p-5 flex items-center justify-between shadow-md z-10">
            <div>
              <h3 className="text-lg font-bold text-white">Filters & Search</h3>
              <p className="text-xs text-blue-100 mt-0.5">Refine your results</p>
            </div>
            <button
              onClick={() => setIsFilterMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Content */}
          <div className="p-5 space-y-5">
            {/* Sort By */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Sort By
              </label>
              <select
                value={currentSort}
                onChange={handleSortChange}
                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              >
                <option value="newest">🆕 Newest First</option>
                <option value="popular">🔥 Most Popular</option>
                <option value="price_asc">💰 Price: Low to High</option>
                <option value="price_desc">💎 Price: High to Low</option>
                <option value="rating">⭐ Highest Rated</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-1/2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-1/2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {/* Category */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.name} {cat.productCount > 0 && `(${cat.productCount})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Minimum Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              >
                <option value="">Any Rating</option>
                <option value="4">⭐⭐⭐⭐ 4+ Stars</option>
                <option value="3">⭐⭐⭐ 3+ Stars</option>
                <option value="2">⭐⭐ 2+ Stars</option>
                <option value="1">⭐ 1+ Stars</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex gap-2 pt-2">
              <button
                onClick={() => { handlePriceFilterApply(); setIsFilterMenuOpen(false); }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md"
              >
                Apply Filters
              </button>
              <button
                onClick={() => { handleClearFilters(); setIsFilterMenuOpen(false); }}
                className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                Clear
              </button>
            </div>

            {/* Quick Links */}
            <div className="w-full pt-5 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Quick Links
              </h4>
              <div className="space-y-2">
                <Link
                  onClick={() => setIsFilterMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentFilter === 'newCollection'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  to="/shop?filter=newCollection&sortBy=newest"
                >
                  <span>🆕</span> New Collection
                </Link>
                <Link
                  onClick={() => setIsFilterMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentFilter === 'discounted'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  to="/shop?filter=discounted&sortBy=popular"
                >
                  <span>🏷️</span> Discounted
                </Link>
                <Link
                  onClick={() => setIsFilterMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentFilter === 'wishlist'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  to="/shop?filter=wishlist&sortBy=newest"
                >
                  <span>❤️</span> Wishlist
                </Link>
                <Link
                  onClick={() => setIsFilterMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentFilter === 'availability'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  to="/shop?filter=availability&sortBy=newest"
                >
                  <span>✅</span> In Stock
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="w-full flex flex-col gap-5">
          {/* Search Bar and Filter Button (Always Visible) */}
          <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 min-w-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name..."
                className="flex-1 min-w-0 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/>
                </svg>
                <span className="hidden md:inline">Search</span>
              </button>
            </form>
            
            <button
              onClick={() => setIsFilterMenuOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>
          </div>

          {/* Products Display */}
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
            <>
              <HoverEffect items={productsForHoverEffect} className="py-0" />
              
              {/* Infinite Scroll Trigger & Loading Indicator */}
              {currentFilter !== 'wishlist' && (
                <>
                  {isLoadingMore && (
                    <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <CardSkeleton key={`loading-${i}`} showImage={true} lines={3} />
                      ))}
                    </div>
                  )}
                  <div ref={observerTarget} className="h-4" />
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ShopPage;