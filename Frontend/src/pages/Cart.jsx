import React, { useEffect, useState, useRef, useCallback } from 'react'; // Added useRef, useCallback
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext'; // Import useUser
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { validateCoupon } from '../services/couponService.js'; // Import coupon validation service, added .js
import { CartSkeleton } from '../components/ui/SkeletonLoader.jsx';

const MAX_QUANTITY = 10; // Define a maximum quantity for an item

const ShoppingCart = () => {
  const { theme } = useTheme(); // Consume theme
  const { currentUser, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // Stores { code, discountType, discountValue, description }
  const [couponError, setCouponError] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const debounceTimers = useRef({}); // To store debounce timers for each product ID

  useEffect(() => {
    if (currentUser?.address && !shippingAddress.street) { // Pre-fill street if available and not already set
      setShippingAddress(prev => ({ ...prev, street: currentUser.address }));
    }
    // We could also pre-fill other fields if currentUser had them structured, e.g.,
    // if (currentUser?.city && !shippingAddress.city) {
    //   setShippingAddress(prev => ({ ...prev, city: currentUser.city }));
    // }
    // etc. for postalCode and country
  }, [currentUser]); // Rerun when currentUser data is available

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };


  useEffect(() => {
    const fetchCartItems = async () => {
      if (!isAuthenticated || !currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/cart`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
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
      setAppliedCoupon(null); // Remove applied coupon if cart quantity changes
      setCouponCode('');
      setCouponError(null);
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
        setAppliedCoupon(null); // Remove applied coupon if item is removed
        setCouponCode('');
        setCouponError(null);
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
        setAppliedCoupon(null); // Remove applied coupon if cart is cleared
        setCouponCode('');
        setCouponError(null);
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
  
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    const subtotalForCoupon = totalMRP - totalDiscount; // Coupon applies to this
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscountAmount = (subtotalForCoupon * appliedCoupon.discountValue) / 100;
    } else if (appliedCoupon.discountType === 'fixedAmount') {
      couponDiscountAmount = appliedCoupon.discountValue;
    }
    // Ensure coupon discount doesn't make the subtotal negative
    couponDiscountAmount = Math.min(couponDiscountAmount, subtotalForCoupon);
  }

  const finalBill = (totalMRP - totalDiscount - couponDiscountAmount) + platformFee;

  const handlePlaceOrder = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      setPaymentError("Please fill in all shipping address fields.");
      return;
    }
    if (cartItems.length === 0) {
      setPaymentError("Your cart is empty.");
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setPaymentError("Failed to load payment gateway. Please try again.");
      setPaymentLoading(false);
      return;
    }

    try {
      // 1. Create Razorpay Order ID from backend
      const orderCreationResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: finalBill.toFixed(2), // Send final bill amount
          currency: 'INR',
          appliedCouponCode: appliedCoupon ? appliedCoupon.code : null,
          couponDiscount: couponDiscountAmount.toFixed(2),
          items: cartItems.map(item => ({ // Send items for context if needed by backend before creating order
            productId: item._id,
            quantity: item.quantity,
            priceAtPurchase: (Number(item.price) || 0) - (Number(item.discount) || 0),
            nameAtPurchase: item.name || 'Unnamed Product'
          })),
          // notes: { address: 'User address note' } // Optional notes
        }),
      });

      const orderCreationData = await orderCreationResponse.json();

      if (!orderCreationResponse.ok || !orderCreationData.success) {
        throw new Error(orderCreationData.message || 'Failed to create Razorpay order.');
      }

      const { orderId, amount: razorpayAmount, currency, keyId } = orderCreationData;

      // 2. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: razorpayAmount, // Amount is in currency subunits. Hence, 50000 refers to 50000 paise or ₹500.
        currency: currency,
        name: 'Your App Name', // Replace with your app name
        description: 'Test Transaction', // Replace with a relevant description
        order_id: orderId,
        handler: async function (response) {
          // 3. Verify Payment on Backend
          try {
            const verificationResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: cartItems.map(item => ({
                  productId: item._id,
                  quantity: item.quantity,
                  priceAtPurchase: (Number(item.price) || 0) - (Number(item.discount) || 0),
                  nameAtPurchase: item.name || 'Unnamed Product'
                })),
                totalAmount: finalBill.toFixed(2),
                shippingAddress: shippingAddress,
                appliedCouponCode: appliedCoupon ? appliedCoupon.code : null, // Send to verification as well
                couponDiscount: couponDiscountAmount.toFixed(2),
              }),
            });

            const verificationData = await verificationResponse.json();

            if (!verificationResponse.ok || !verificationData.success) {
              throw new Error(verificationData.message || 'Payment verification failed.');
            }

            // Payment successful and order placed
            setPaymentLoading(false);
            alert('Order placed successfully! Invoice sent to your email.'); // Replace with a better notification
            setCartItems([]); // Clear cart on frontend
            // navigate('/order-success'); // Navigate to an order success page
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            setPaymentError(verifyError.message || 'An error occurred during payment verification.');
            setPaymentLoading(false);
            // alert(`Payment verification failed: ${verifyError.message}`); // Replace with better UI
          }
        },
        prefill: {
          name: currentUser?.fullname || currentUser?.username || '',
          email: currentUser?.email || '',
          // contact: '9999999999' // Optional
        },
        notes: {
          address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.postalCode}, ${shippingAddress.country}`
        },
        theme: {
          color: '#3399cc' // Customize theme color
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error("Razorpay payment failed:", response.error);
        setPaymentError(`Payment Failed: ${response.error.description} (Reason: ${response.error.reason})`);
        setPaymentLoading(false);
        // alert(`Payment Failed: ${response.error.description}`); // Replace with better UI
      });
      rzp.open();

    } catch (err) {
      console.error("Error during order placement:", err);
      setPaymentError(err.message || 'An error occurred while placing the order.');
      setPaymentLoading(false);
    }
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setIsApplyingCoupon(true);
    setCouponError(null);
    setAppliedCoupon(null);

    try {
      // Calculate subtotal before any coupon is applied
      const subtotalForValidation = totalMRP - totalDiscount;
      const response = await validateCoupon(couponCode, subtotalForValidation);

      if (response.success && response.data) {
        setAppliedCoupon(response.data);
        // setCouponCode(''); // Optionally clear input on success
      } else {
        setCouponError(response.message || "Invalid coupon code.");
      }
    } catch (err) {
      setCouponError(err.message || "Failed to validate coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };


  if (isLoading && !paymentLoading) { // Ensure payment loading doesn't show main loading
    return <CartSkeleton />;
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

        {/* Shipping Address Form */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Shipping Address</h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</label>
              <input type="text" name="street" id="street" value={shippingAddress.street} onChange={handleShippingChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <input type="text" name="city" id="city" value={shippingAddress.city} onChange={handleShippingChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</label>
              <input type="text" name="postalCode" id="postalCode" value={shippingAddress.postalCode} onChange={handleShippingChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <input type="text" name="country" id="country" value={shippingAddress.country} onChange={handleShippingChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
            </div>
          </div>
        </div>
        
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

        {/* Coupon Code Section */}
        <div className="my-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Have a Coupon Code?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="couponCode"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter Coupon Code"
              className="flex-grow w-[85px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              disabled={isApplyingCoupon}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon || !couponCode.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
          {appliedCoupon && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-300">
                Coupon "<strong>{appliedCoupon.code}</strong>" applied! ({appliedCoupon.description || (appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`)})
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Discount: -₹{couponDiscountAmount.toFixed(2)}
              </p>
            </div>
          )}
        </div>
        
        {appliedCoupon && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Coupon Discount ({appliedCoupon.code})</span>
            <span>-₹{couponDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-gray-300 dark:border-gray-700 my-4"></div>
        
        <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
          <span>Total Amount</span>
          <span className="text-green-600 dark:text-green-400">₹{finalBill.toFixed(2)}</span>
        </div>
        
        {paymentError && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-3">{paymentError}</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={isLoading || paymentLoading || cartItems.length === 0}
          className="w-full bg-green-600 text-white py-3 rounded-md mt-5 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentLoading ? 'Processing Payment...' : 'Place Order & Pay'}
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