import React, { memo, useCallback } from 'react';

import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';

// ProductCard Component
export const ProductCard = memo(({ product, onAddToCart, onToggleWishlist, isInWishlist, wishlistLoading }) => {

  const navigate = useNavigate();

  const originalPrice = parseFloat(product.price) || 0;
  const discountAmount = parseFloat(product.discount) || 0;
  const finalPrice = originalPrice - discountAmount;
  const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-card border-2 border-black shadow-neo hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 relative z-20" style={{ width: '100%' }}>
      <div className="relative group flex flex-col flex-grow"> {/* Added flex flex-col to ensure children stack properly */}
        <div
          className="w-full h-44 sm:h-52 flex-none flex items-center justify-center relative cursor-pointer bg-white border-b-2 border-black overflow-hidden"
        >
          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist && (product.quantity > 0 || product.quantity === undefined) && onToggleWishlist();
            }}
            title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2 left-2 z-30 w-8 h-8 flex items-center justify-center border-2 border-black transition-all duration-200 ease-in-out
                          ${(product.quantity > 0 || product.quantity === undefined)
                ? isInWishlist
                  ? 'bg-red-500 text-white shadow-neo-sm' // In wishlist
                  : 'bg-white text-black hover:bg-gray-100 shadow-neo-sm' // Default
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-400' // Disabled
              }`}
            disabled={(product.quantity === 0 && product.quantity !== undefined) || wishlistLoading}
          >
            <i className={`text-lg transition-transform ${isInWishlist ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
          </button>

          {product.image && typeof product.image === 'string' ? (
            <OptimizedImage
              onClick={useCallback(() => product.quantity > 0 && navigate(`/product/${product._id}`), [product._id, product.quantity, navigate])}
              className={`h-[90%] w-[90%] object-contain transition-transform duration-300 group-hover:scale-110 ${product.quantity === 0 ? 'filter grayscale blur-sm' : ''}`}
              src={product.image}
              alt={product.name || "Product Image"}
            />
          ) : (
            <span className="text-gray-400 font-bold uppercase">No Image</span>
          )}

          {discountPercentage > 0 && (
            <div className="absolute top-2 right-2 bg-accent text-white font-bold text-xs px-2 py-1 border-2 border-black shadow-neo-sm z-10">
              {`${discountPercentage}% OFF`}
            </div>
          )}

          {product.quantity === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <span className="text-white text-xl font-black bg-destructive px-4 py-2 border-2 border-white shadow-neo transform -rotate-12 uppercase">Out of Stock</span>
            </div>
          )}
        </div>

        <div
          className="flex flex-col justify-between p-4 bg-card text-card-foreground flex-grow"
        >
          <div className="w-full">
            <h3
              className="font-bold text-sm sm:text-base lg:text-lg truncate cursor-pointer hover:underline decoration-2 underline-offset-2 transition-all"
              onClick={useCallback(() => navigate(`/product/${product._id}`), [product._id, navigate])}
            >
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <h4 className="text-base sm:text-lg font-black">₹ {finalPrice.toFixed(2)}</h4>
              {discountAmount > 0 && (
                <h4 className="text-xs sm:text-sm text-gray-500 line-through font-medium">
                  {originalPrice.toFixed(2)}
                </h4>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              (product.quantity > 0 || product.quantity === undefined) && onAddToCart(product._id);
            }}
            title={(product.quantity > 0 || product.quantity === undefined) ? "Add to cart" : "Out of stock"}
            className={`w-full mt-3 py-2 flex items-center justify-center font-bold border-2 border-black shadow-neo-sm transition-all text-sm uppercase tracking-wide
                        ${(product.quantity > 0 || product.quantity === undefined)
                ? 'bg-primary text-white hover:bg-white hover:text-black hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400 shadow-none'}`}
            disabled={product.quantity === 0 && product.quantity !== undefined}
          >
            {(product.quantity > 0 || product.quantity === undefined) ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
});

// HoverEffect Component
export const HoverEffect = memo(({ items, className }) => {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5", className)}>
      {items.map((item) => (
        <div
          key={item._id}
          className="relative group block h-full w-full"
        >
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
});




