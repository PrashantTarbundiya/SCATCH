import React, { useEffect, useState, useRef, useCallback } from 'react'; // Added useRef, useCallback
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext'; // Import useUser
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const MAX_QUANTITY = 10; // Define a maximum quantity for an item

const ShoppingCart = () => {
  const { theme } = useTheme(); // Consume theme
  const { currentUser, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceTimers = useRef({}); // To store debounce timers for each product ID

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!isAuthenticated || !currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/cart`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        let data;
        if (response.headers.get("content-type")?.includes("application/json")) {
            data = await response.json();
        }

        if (!response.ok) {
          throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
        }

        if (data?.success && data?.cart) {
          const formattedCartItems = data.cart.map(cartEntry => {
            if (!cartEntry) return null;
            let imageSrc = 'placeholder.jpg';
            if (cartEntry.image) {
              if (typeof cartEntry.image === 'string') {
                imageSrc = cartEntry.image;
              } else if (cartEntry.image.type === 'Buffer' && Array.isArray(cartEntry.image.data)) {
                try {
                  const uint8Array = new Uint8Array(cartEntry.image.data);
                  let binaryString = '';
                  uint8Array.forEach((byte) => {
                    binaryString += String.fromCharCode(byte);
                  });
                  imageSrc = `data:image/jpeg;base64,${btoa(binaryString)}`;
                } catch (e) {
                  // console.error("Error converting image buffer", e);
                }
              }
            }
            return { ...cartEntry, imageSrc };
          }).filter(item => item !== null);
          setCartItems(formattedCartItems);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error("Failed to fetch cart items:", err);
        setError(err.message || 'Failed to load cart.');
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartItems();

    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [currentUser, isAuthenticated, navigate]);

  const updateCartQuantityOnBackend = useCallback(async (productId, quantity) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cart/update/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
      }
      
      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      if (!data.success) {
        // console.warn("Backend update for quantity failed:", data);
      }
    } catch (err) {
      console.error("Failed to update cart quantity on backend:", err);
      setError(`Failed to save quantity for item. ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 0) return;
    if (newQuantity > MAX_QUANTITY) newQuantity = MAX_QUANTITY;

    if (newQuantity === 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      )
    );

    if (debounceTimers.current[productId]) {
      clearTimeout(debounceTimers.current[productId]);
    }

    debounceTimers.current[productId] = setTimeout(() => {
      updateCartQuantityOnBackend(productId, newQuantity);
    }, 1500);
  };
  
  const handleRemoveFromCart = async (productId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      if (data?.success) {
        setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
      } else {
        // setError(data?.message || "Failed to remove item.");
      }
    } catch (err) {
      console.error("Failed to remove item from cart:", err);
      setError(err.message || 'Failed to remove item.');
    } finally {
      setIsLoading(false);
    }
  };

const handleClearCart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      if (data?.success) {
        setCartItems([]);
      } else {
        setError(data?.message || "Could not clear cart.");
      }
    } catch (err) {
      console.error("Failed to clear cart:", err);
      setError(err.message || 'Failed to clear cart.');
    } finally {
      setIsLoading(false);
    }
  };

  let totalMRP = 0;
  let totalDiscount = 0;
  const platformFee = 20;
  // const shippingFee = 0; // Not used in finalBill calculation in original

  if (cartItems && cartItems.length > 0) {
    cartItems.forEach((item) => {
      const originalPrice = Number(item.price) || 0;
      const fixedDiscountAmount = Number(item.discount) || 0; // Treat as fixed amount
      const quantity = item.quantity || 1;

      totalMRP += originalPrice * quantity;
      totalDiscount += fixedDiscountAmount * quantity; // Sum of (Fixed Discount Amount * Quantity)
    });
  }

  const finalBill = (totalMRP - totalDiscount) + platformFee;

  if (isLoading) {
    return <div className="w-full min-h-screen flex items-center justify-center py-20 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300"><p>Loading cart...</p></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300">
        <p className="text-xl mb-4">Please log in to view your cart.</p>
        <Link to="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
          Go to Login
        </Link>
      </div>
    );
  }
  
  if (error) {
    return <div className="w-full min-h-screen flex items-center justify-center py-20 bg-gray-50 dark:bg-gray-900 text-red-500 dark:text-red-400"><p>Error loading cart: {error}</p></div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300">
        <h2 className="text-2xl font-semibold mb-5">Your Shopping Cart is Empty</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop" className="px-5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-start py-10 md:py-20 gap-6 md:gap-10 flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 transition-colors duration-300 px-4 md:px-6 lg:px-8"> {/* Added theme bg, text, removed most horizontal padding, added some back for content spacing */}
      {/* Left Section - Cart Items */}
      <div className="w-full lg:w-[60%] flex flex-col gap-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold">Shopping Cart ({cartItems.length} items)</h2>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={18} /> Clear Cart
            </button>
          )}
        </div>
        
        {/* console.log('Cart.jsx: cartItems in render:', JSON.stringify(cartItems, null, 2)) */} {/* DEBUG LOG 3 */}
        {cartItems.map((item, index) => (
          <div key={item._id || index} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
            {/* Product Image */}
            <div
              className="w-full sm:w-32 h-32 flex justify-center items-center rounded-md overflow-hidden self-center sm:self-start"
              style={{ backgroundColor: item.bgcolor || (theme === 'dark' ? '#374151' : '#f0f0f0') }} // Theme-aware fallback bgcolor
            >
              <img
                className="h-28 object-contain"
                src={item.imageSrc || item.image}
                alt={item.name || 'Product Image'}
              />
            </div>
            
            {/* Product Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name || 'Unnamed Product'}</h3>
                {(() => {
                  const originalPrice = Number(item.price) || 0;
                  const fixedDiscountAmount = Number(item.discount) || 0; // Treat as fixed amount
                  const finalPricePerUnit = originalPrice - fixedDiscountAmount;

                  return (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">₹{finalPricePerUnit.toFixed(2)}</span>
                      {fixedDiscountAmount > 0 && ( // Show if there's any discount
                        <>
                          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                            ₹{originalPrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            (₹{fixedDiscountAmount.toFixed(2)} off)
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item._id, (item.quantity || 0) - 1)}
                    disabled={(item.quantity || 0) <= 1 || isLoading} // Disable if quantity is 1 or less (0 will remove)
                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 flex rounded-full items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="px-3 py-1 bg-gray-100 dark:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200">{item.quantity || 0}</div>
                  <button
                    onClick={() => handleQuantityChange(item._id, (item.quantity || 0) + 1)}
                    disabled={(item.quantity || 0) >= MAX_QUANTITY || isLoading} // Disable if quantity is at max or more
                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 flex rounded-full items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveFromCart(item._id)}
                  disabled={isLoading}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Right Section - Price Breakdown */}
      <div className="w-full lg:w-[40%] bg-white dark:bg-gray-800 p-6 rounded-md h-fit sticky top-10 md:top-28 shadow-sm transition-colors duration-300"> {/* Adjusted top, theme bg */}
        <h3 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">Price Breakdown</h3>
        
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Total MRP ({cartItems.length} items)</span>
            <span>₹{totalMRP.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Discount on MRP</span>
            <span>-₹{totalDiscount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>₹{platformFee.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Shipping Fee</span>
            <span className="text-green-600 dark:text-green-400">FREE</span>
          </div>
        </div>
        
        <div className="border-t border-gray-300 dark:border-gray-700 my-4"></div>
        
        <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
          <span>Total Amount</span>
          <span className="text-green-600 dark:text-green-400">₹{finalBill.toFixed(2)}</span>
        </div>
        
        <button className="w-full bg-blue-600 text-white py-3 rounded-md mt-5 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors">
          Proceed to Checkout
        </button>
        
        <div className="mt-4 space-y-2">
          <Link to="/shop" className="block w-full text-center border border-gray-300 dark:border-gray-600 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;