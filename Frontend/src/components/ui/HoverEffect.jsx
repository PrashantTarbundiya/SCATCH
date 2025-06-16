import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext'; // ProductCard uses useTheme
import { AnimatePresence, motion } from 'framer-motion'; // Corrected import
import { cn } from '../../utils/cn'; // Adjusted path for cn utility

// ProductCard Component
export const ProductCard = ({ product, onAddToCart }) => {
  const { theme } = useTheme();
  
  const originalPrice = parseFloat(product.price) || 0;
  const discountAmount = parseFloat(product.discount) || 0;
  const finalPrice = originalPrice - discountAmount;
  const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

  return (
    <div className="rounded-2xl h-full overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-slate-700 dark:group-hover:border-slate-500 relative z-20 transition-all duration-300 shadow-md hover:shadow-xl" style={{ width: 'calc(100% + 2px)' }}>
      <div className="relative z-50">
          <div
            className="w-full h-52 flex items-center justify-center relative"
            style={{ backgroundColor: product.bgcolor || (theme === 'dark' ? '#374151' : '#f0f0f0') }}
          >
            {product.image && typeof product.image === 'string' ? (
              <img
                className="h-[12rem] w-full object-contain"
                src={product.image}
                alt={product.name || "Product Image"}
              />
            ) : (
              <span className="text-gray-400 dark:text-gray-500">No Image</span>
            )}
            {discountPercentage > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                {`${discountPercentage}% OFF`}
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
              <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            <div className="flex items-center gap-2 whitespace-nowrap mt-1"> {/* Added mt-1 for slight spacing */}
              <h4 className="text-md font-bold">₹ {finalPrice.toFixed(2)}</h4>
              {discountAmount > 0 && (
                <h4 className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {originalPrice.toFixed(2)}
                </h4>
              )}
            </div>
          </div>
          <button
            onClick={() => onAddToCart(product._id)}
            title="Add to cart"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
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
                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-3xl"
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
              />
            )}
          </AnimatePresence>
          <ProductCard product={item} onAddToCart={item.onAddToCart} />
        </div>
      ))}
    </div>
  );
};