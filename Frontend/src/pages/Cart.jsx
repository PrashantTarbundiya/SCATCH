import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext'; // Import useUser
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { validateCoupon } from '../services/couponService.js'; // Import coupon validation service, added .js
import { CartSkeleton } from '../components/ui/SkeletonLoader.jsx';

const MAX_QUANTITY = 10; // Define a maximum quantity for an item

const ShoppingCart = () => {
  // Consume theme
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

    // Check stock availability before payment
    try {
      const stockCheckResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cart/check-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item._id,
            quantity: item.quantity || 1
          }))
        })
      });

      const stockData = await stockCheckResponse.json();

      if (!stockCheckResponse.ok) {
        if (stockData.outOfStock && stockData.outOfStock.length > 0) {
          const outOfStockItems = stockData.outOfStock.map(item => item.name).join(', ');
          setPaymentError(`Sorry, these items are out of stock: ${outOfStockItems}`);
          return;
        }

        if (stockData.insufficientStock && stockData.insufficientStock.length > 0) {
          const insufficientItems = stockData.insufficientStock.map(item =>
            `${item.name} (only ${item.available} available)`
          ).join(', ');
          setPaymentError(`Insufficient stock for: ${insufficientItems}`);
          return;
        }

        setPaymentError(stockData.message || 'Stock validation failed.');
        return;
      }
    } catch (error) {
      setPaymentError('Failed to validate stock. Please try again.');
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
      // Prepare cart items in the format backend expects
      const formattedCartItems = cartItems.map(item => ({
        productId: item._id,
        price: Number(item.price) || 0,
        quantity: item.quantity || 1,
        category: item.category // Include category if available
      }));

      const response = await validateCoupon(couponCode, formattedCartItems, currentUser?._id);

      if (response.success && response.coupon) {
        setAppliedCoupon({
          code: response.coupon.code,
          description: response.coupon.description,
          discountType: response.coupon.discountType,
          discountValue: response.coupon.discountValue
        });
        // setCouponCode(''); // Optionally clear input on success
      } else {
        setCouponError(response.error || "Invalid coupon code.");
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
      <div className="w-full min-h-screen flex flex-col items-center justify-center py-20 bg-background text-foreground">
        <div className="p-8 border-4 border-black shadow-neo bg-white text-center">
          <p className="text-xl font-bold mb-4 uppercase">Please log in to view your cart.</p>
          <Link to="/login" className="px-6 py-3 bg-primary text-primary-foreground font-black uppercase text-sm border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-20 bg-background">
        <div className="p-8 border-4 border-red-500 shadow-neo bg-red-50 text-red-600 font-bold uppercase text-center border-dashed">
          <p>Error loading cart: {error}</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center py-20 px-4 bg-background text-foreground">
        <div className="text-center max-w-md p-8 border-4 border-black shadow-neo bg-white">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center">
              <i className="ri-shopping-cart-line text-4xl text-gray-400"></i>
            </div>
          </div>
          <h2 className="text-3xl font-black mb-4 uppercase">Your Cart is Empty</h2>
          <p className="text-gray-600 font-bold mb-8 text-sm uppercase">Looks like you haven't added anything to your cart yet.</p>
          <Link
            to="/shop"
            className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground font-black uppercase tracking-wider border-2 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-start py-10 md:py-20 gap-6 md:gap-10 flex-col lg:flex-row bg-background px-4 md:px-6 lg:px-8">
      {/* Left Section - Cart Items */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-black uppercase text-foreground">Shopping Cart ({cartItems.length})</h2>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white font-bold uppercase text-xs border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={16} /> Clear Cart
            </button>
          )}
        </div>

        {cartItems.map((item, index) => (
          <div key={item._id || index} className="flex flex-col sm:flex-row gap-6 p-6 border-4 border-black bg-white shadow-neo transition-all">
            {/* Product Image */}
            <div
              className="w-full sm:w-32 h-32 flex justify-center items-center border-2 border-black bg-white p-2 flex-shrink-0"
            >
              <img
                className="h-full w-full object-contain"
                src={item.imageSrc || item.image}
                alt={item.name || 'Product Image'}
              />
            </div>

            {/* Product Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-foreground mb-2">{item.name || 'Unnamed Product'}</h3>
                {(() => {
                  const originalPrice = Number(item.price) || 0;
                  const fixedDiscountAmount = Number(item.discount) || 0; // Treat as fixed amount
                  const finalPricePerUnit = originalPrice - fixedDiscountAmount;

                  return (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-foreground">₹{finalPricePerUnit.toFixed(2)}</span>
                      {fixedDiscountAmount > 0 && ( // Show if there's any discount
                        <>
                          <span className="text-sm text-gray-400 font-bold line-through decoration-2 decoration-red-500">
                            ₹{originalPrice.toFixed(2)}
                          </span>
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black uppercase border border-black transform -rotate-2">
                            ₹{fixedDiscountAmount.toFixed(0)} OFF
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex flex-wrap items-center justify-between mt-4 gap-4">
                <div className="flex items-center border-2 border-black shadow-neo-sm">
                  <button
                    onClick={() => handleQuantityChange(item._id, (item.quantity || 0) - 1)}
                    disabled={(item.quantity || 0) <= 1 || isLoading}
                    className="w-10 h-10 bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-black border-r-2 border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={18} strokeWidth={3} />
                  </button>
                  <div className="w-12 h-10 flex items-center justify-center bg-white text-black font-black text-lg">{item.quantity || 0}</div>
                  <button
                    onClick={() => handleQuantityChange(item._id, (item.quantity || 0) + 1)}
                    disabled={(item.quantity || 0) >= MAX_QUANTITY || isLoading}
                    className="w-10 h-10 bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-black border-l-2 border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveFromCart(item._id)}
                  disabled={isLoading}
                  className="text-red-500 font-black uppercase text-sm hover:text-red-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:underline decoration-2 underline-offset-4"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right Section - Price Breakdown */}
      <div className="w-full lg:w-[40%] bg-white border-4 border-black p-6 shadow-neo h-fit sticky top-24">
        <h3 className="text-2xl font-black mb-6 uppercase border-b-4 border-black pb-2">Order Summary</h3>

        {/* Shipping Address Form */}
        <div className="mb-8">
          <h4 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
            <i className="ri-map-pin-line text-lg"></i> Shipping Address
          </h4>
          <div className="space-y-3">
            <div>
              <input type="text" name="street" placeholder="STREET ADDRESS" value={shippingAddress.street} onChange={handleShippingChange} required className="w-full px-3 py-2 border-2 border-black bg-gray-50 text-foreground text-sm font-bold uppercase placeholder-gray-400 focus:outline-none focus:shadow-neo-sm transition-all rounded-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" name="city" placeholder="CITY" value={shippingAddress.city} onChange={handleShippingChange} required className="w-full px-3 py-2 border-2 border-black bg-gray-50 text-foreground text-sm font-bold uppercase placeholder-gray-400 focus:outline-none focus:shadow-neo-sm transition-all rounded-none" />
              <input type="text" name="postalCode" placeholder="ZIP CODE" value={shippingAddress.postalCode} onChange={handleShippingChange} required className="w-full px-3 py-2 border-2 border-black bg-gray-50 text-foreground text-sm font-bold uppercase placeholder-gray-400 focus:outline-none focus:shadow-neo-sm transition-all rounded-none" />
            </div>
            <div>
              <input type="text" name="country" placeholder="COUNTRY" value={shippingAddress.country} onChange={handleShippingChange} required className="w-full px-3 py-2 border-2 border-black bg-gray-50 text-foreground text-sm font-bold uppercase placeholder-gray-400 focus:outline-none focus:shadow-neo-sm transition-all rounded-none" />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm font-bold uppercase">
          <div className="flex justify-between">
            <span className="text-gray-600">Total MRP ({cartItems.length} items)</span>
            <span>₹{totalMRP.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-green-600">
            <span>Discount on MRP</span>
            <span>-₹{totalDiscount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Platform Fee</span>
            <span>₹{platformFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Shipping Fee</span>
            <span className="text-green-600">FREE</span>
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="my-6 pt-6 border-t-4 border-black border-dashed">
          <label htmlFor="couponCode" className="block text-xs font-black uppercase text-gray-500 mb-2">
            Have a Coupon Code?
          </label>
          <div className="flex gap-0">
            <input
              type="text"
              id="couponCode"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              className="flex-grow min-w-0 px-3 py-2 border-2 border-black border-r-0 bg-white text-foreground font-black uppercase placeholder-gray-400 focus:outline-none"
              disabled={isApplyingCoupon}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon || !couponCode.trim()}
              className="px-4 py-2 bg-secondary text-secondary-foreground font-black uppercase border-2 border-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApplyingCoupon ? '...' : 'Apply'}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-xs font-bold mt-2 uppercase bg-red-100 p-1 border border-red-500 inline-block">{couponError}</p>}
          {appliedCoupon && (
            <div className="mt-3 p-3 bg-green-100 border-2 border-green-600">
              <p className="text-xs font-bold text-green-800 uppercase flex items-center gap-1">
                <i className="ri-checkbox-circle-fill"></i> Coupon "{appliedCoupon.code}" applied!
              </p>
              <p className="text-xs font-bold text-green-800 uppercase pl-5">
                {appliedCoupon.description}
              </p>
              <p className="text-sm font-black text-green-800 uppercase mt-1 pl-5">
                Saved: ₹{couponDiscountAmount.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-sm font-bold uppercase text-green-600 border-t-2 border-dashed border-gray-300 pt-2 mb-2">
            <span>Coupon Discount</span>
            <span>-₹{couponDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t-4 border-black my-4"></div>

        <div className="flex justify-between text-xl font-black uppercase text-foreground mb-6">
          <span>Total Amount</span>
          <span className="text-primary">₹{finalBill.toFixed(2)}</span>
        </div>

        {paymentError && (
          <div className="bg-red-100 border-2 border-red-500 p-3 mb-4">
            <p className="text-red-600 text-xs font-bold uppercase flex gap-2 items-start"><i className="ri-error-warning-fill text-lg"></i> {paymentError}</p>
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={isLoading || paymentLoading || cartItems.length === 0}
          className="w-full bg-green-500 text-white font-black uppercase tracking-wider py-4 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 text-lg"
        >
          {paymentLoading ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i> Processing...
            </>
          ) : (
            <>
              Place Order & Pay <i className="ri-arrow-right-line"></i>
            </>
          )}
        </button>

        <div className="mt-4">
          <Link to="/shop" className="block w-full text-center font-bold uppercase text-xs text-gray-500 hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">
            <i className="ri-arrow-left-line"></i> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;







