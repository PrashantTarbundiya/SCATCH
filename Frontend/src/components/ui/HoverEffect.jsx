import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// ProductCard Component
export const ProductCard = ({ product, onAddToCart, onToggleWishlist, isInWishlist, wishlistLoading }) => { // Added wishlist props
  const { theme } = useTheme();
  const navigate = useNavigate(); // Initialize useNavigate
  
  const originalPrice = parseFloat(product.price) || 0;
  const discountAmount = parseFloat(product.discount) || 0;
  const finalPrice = originalPrice - discountAmount;
  const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

  return (
    <div className="rounded-2xl h-full overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-slate-700 dark:group-hover:border-slate-500 relative z-20 transition-all duration-300 shadow-md hover:shadow-xl" style={{ width: 'calc(100% + 2px)' }}>
      <div className="relative z-50 group"> {/* Added group class here for the overlay */}
          <div // This is the image container, ensure it's relative for the wishlist icon
            className={`w-full h-52 flex items-center justify-center relative cursor-pointer`}
            style={{ backgroundColor: product.bgcolor || (theme === 'dark' ? '#374151' : '#f0f0f0') }}
            // onClick for image navigation is fine, but wishlist button will have its own click
          >
            {/* Wishlist button moved here, positioned absolutely */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking wishlist
                onToggleWishlist && (product.quantity > 0 || product.quantity === undefined) && onToggleWishlist();
              }}
              title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              className={`absolute top-2 left-2 z-30 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ease-in-out
                          ${(product.quantity > 0 || product.quantity === undefined)
                            ? isInWishlist
                              ? 'hover:bg-red-100 dark:hover:bg-red-900/30' // In wishlist: light red background on hover
                              : 'hover:bg-gray-200/70 dark:hover:bg-gray-700/70' // Default (not in wishlist): gray background on hover
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' // Disabled state
                          }`}
              disabled={(product.quantity === 0 && product.quantity !== undefined) || wishlistLoading}
            >
              <i className={`text-xl transition-all duration-200 ease-in-out ${
                (product.quantity > 0 || product.quantity === undefined)
                  ? isInWishlist
                    ? 'ri-heart-fill text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:scale-110' // In wishlist: filled heart with hover effects
                    : 'ri-heart-line text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:scale-110' // Default: outline heart that turns red on hover
                  : 'ri-heart-line text-gray-400 dark:text-gray-500' // Disabled state
                }`}></i>
            </button>
            {product.image && typeof product.image === 'string' ? (
              <img
                onClick={() => product.quantity > 0 && navigate(`/product/${product._id}`)} // Keep navigation on image click
                className={`h-[12rem] w-full object-contain transition-all duration-300 ${product.quantity === 0 ? 'group-hover:filter group-hover:blur-sm' : ''}`} // Apply blur directly to image on hover if out of stock
                src={product.image}
                alt={product.name || "Product Image"}
              />
            ) : (
              <span className="text-gray-400 dark:text-gray-500">No Image</span>
            )}
            {discountPercentage > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md z-10">
                {`${discountPercentage}% OFF`}
              </div>
            )}
            {product.quantity === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <span className="text-white text-xl font-bold bg-red-700 px-4 py-2 rounded-lg shadow-xl">Out of Stock</span>
              </div>
            )}
          </div>
        <div
          className="flex justify-between items-start px-4 py-4"
          style={{
            backgroundColor: product.panelcolor || (theme === 'dark' ? '#1f2937' : '#ffffff'),
            color: product.textcolor || (theme === 'dark' ? '#e5e7eb' : '#111827'),
          }}
        >
          <div className="flex-1 min-w-0 pr-2">
              <h3
                className="font-semibold text-lg truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => navigate(`/product/${product._id}`)} // Navigate to product detail page
              >
                {product.name}
              </h3>
            <div className="flex items-center gap-2 whitespace-nowrap mt-1"> {/* Added mt-1 for slight spacing */}
              <h4 className="text-md font-bold">₹ {finalPrice.toFixed(2)}</h4>
              {discountAmount > 0 && (
                <h4 className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {originalPrice.toFixed(2)}
                </h4>
              )}
            </div>
            {/* Removed the text "Out of Stock" message from here */}
          </div>
          {/* Add to Cart button remains here */}
          <button
            onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                (product.quantity > 0 || product.quantity === undefined) && onAddToCart(product._id);
            }}
            title={(product.quantity > 0 || product.quantity === undefined) ? "Add to cart" : "Out of stock"}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0
                        ${(product.quantity > 0 || product.quantity === undefined)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
            disabled={product.quantity === 0 && product.quantity !== undefined}
          >
            <i className="ri-add-line text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// HoverEffect Component
export const HoverEffect = ({ items, className }) => {
  let [hoveredIndex, setHoveredIndex] = useState(null);
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5", className)}>
      {items.map((item, idx) => (
        <div
          key={item._id} // Assuming item has _id from your ShopPage structure
          className="relative group block p-2 h-full w-full" // p-2 allows background to show
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-neutral-200/80 dark:bg-slate-800/80 block rounded-3xl"
                layoutId="hoverBackground" // This layoutId should ideally be unique if multiple HoverEffects are on one page.
                                          // For now, assuming one instance or careful usage.
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              />
            )}
          </AnimatePresence>
          {/* Pass only necessary props to ProductCard */}
          <ProductCard
            product={item}
            onAddToCart={item.onAddToCart}
            onToggleWishlist={item.onToggleWishlist}
            isInWishlist={item.isInWishlist}
            wishlistLoading={item.wishlistLoading}
          />
        </div>
      ))}
    </div>
  );
};