import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import UserContext from '../context/UserContext'; // Assuming you have a UserContext
import { useUser } from '../context/UserContext'; // Import useUser to get user and setUser
import { ProfileSkeleton } from '../components/ui/SkeletonLoader.jsx';
import OrderStatusTracker from '../components/OrderStatusTracker';

function ProfilePage() {
  const { currentUser: user, setCurrentUser: setUser, isAuthenticated, authLoading } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true); // Renamed from 'loading' to avoid conflict
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

  // Placeholder for fetching user profile data
  useEffect(() => {
    if (authLoading) {
      setPageLoading(true); // Ensure page is in loading state while auth is checked
      return;
    }

    // Auth loading is complete here
    if (isAuthenticated && user && user._id) {
      try {
        // Placeholder data for now
        setProfileData({
          phone: user.phone || 'N/A',
          address: user.address || 'N/A',
          profilePhoto: user.profilePhoto || 'https://res.cloudinary.com/dnlkzlnhv/image/upload/v1757783899/profile-image_ju6q5f.png',
          // orders: user.orders || [], // Orders will be fetched separately
          email: user.email || 'N/A', // Add fallback for email
          name: user.fullname || user.username || 'User'
        });
        setError(''); // Clear any previous errors

        // Fetch orders
        const fetchOrders = async () => {
          setOrdersLoading(true);
          setOrdersError('');
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/my-orders`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || data.error || 'Failed to fetch orders.');
            }
            if (data.success) {
              setOrders(data.orders || []);
            } else {
              setOrdersError(data.message || 'Could not load orders.');
              setOrders([]);
            }
          } catch (err) {
            setOrdersError(err.message || 'An error occurred while fetching orders.');
            setOrders([]);
          } finally {
            setOrdersLoading(false);
          }
        };
        fetchOrders();

      } catch (err) {
        setError(`Error processing profile data: ${err.message}`);
        setProfileData(null); // Clear profile data on error
      }
    } else {
      // User is not authenticated or user data is incomplete
      if (!isAuthenticated) {
        setError('User not authenticated. Please log in.');
      } else if (!user) { // isAuthenticated is true, but user is null/undefined
        setError('User data is missing in context. Please try logging in again.');
      } else { // isAuthenticated is true, user exists, so user._id must be missing or other fields for profile
        setError('User data is incomplete (e.g., missing ID or profile fields). Please check login response or contact support.');
      }
      setProfileData(null);
    }
    setPageLoading(false); // Always set page loading to false after processing

  }, [user, isAuthenticated, authLoading]);

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-12">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-28 bg-background">
        <div className="p-8 border-4 border-black shadow-neo bg-white text-center">
          <p className="text-red-600 text-xl font-bold mb-4 uppercase">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-28 bg-background">
        <div className="p-8 border-4 border-black shadow-neo bg-white text-center">
          <p className="text-xl font-black uppercase">No profile data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pt-28 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        {/* Profile Header */}
        <div className="relative bg-white border-4 border-black shadow-neo p-6 md:p-8 mb-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              className="h-32 w-32 md:h-40 md:w-40 rounded-none border-4 border-black shadow-neo-sm object-cover"
              src={profileData.profilePhoto}
              alt="Profile"
            />
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">{profileData.name}</h1>
              <p className="text-lg font-bold text-gray-600 uppercase tracking-widest">{profileData.email}</p>
            </div>
            <Link
              to="/profile/edit"
              className="w-full md:w-auto bg-white text-black font-black uppercase tracking-wider py-3 px-6 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <i className="ri-edit-2-line text-xl"></i>
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Personal Information Card */}
          <div className="lg:col-span-2 bg-white border-4 border-black shadow-neo p-6 md:p-8 h-fit">
            <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex items-center gap-3">
              <i className="ri-user-line"></i>
              <span>Personal Info</span>
            </h2>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-black text-gray-500 uppercase mb-1">Full Name</p>
                <p className="text-lg font-bold border-2 border-black p-2 bg-gray-50">{profileData.name}</p>
              </div>
              <div>
                <p className="text-sm font-black text-gray-500 uppercase mb-1">Email Address</p>
                <p className="text-lg font-bold border-2 border-black p-2 bg-gray-50 break-all">{profileData.email}</p>
              </div>
              <div>
                <p className="text-sm font-black text-gray-500 uppercase mb-1">Phone Number</p>
                <p className="text-lg font-bold border-2 border-black p-2 bg-gray-50">{profileData.phone}</p>
              </div>
              <div>
                <p className="text-sm font-black text-gray-500 uppercase mb-1">Address</p>
                <p className="text-lg font-bold border-2 border-black p-2 bg-gray-50 whitespace-pre-line">{profileData.address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="lg:col-span-3 bg-white border-4 border-black shadow-neo p-6 md:p-8">
            <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex items-center gap-3">
              <i className="ri-shopping-bag-3-line"></i>
              <span>My Orders</span>
            </h2>
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border-2 border-black bg-gray-100 animate-pulse h-32"></div>
                ))}
              </div>
            ) : ordersError ? (
              <p className="text-center text-red-600 font-bold uppercase">{ordersError}</p>
            ) : orders.length > 0 ? (
              <div>
                {(() => {
                  const order = orders[currentOrderIndex];
                  if (!order) return <p className="text-center font-bold">Order not found.</p>;
                  return (
                    <div className="space-y-6">
                      <div className="p-4 border-2 border-black bg-white shadow-neo-sm">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2 border-b-2 border-black pb-2 border-dashed">
                          <div className="flex-1">
                            <span className="font-black text-lg uppercase block break-all">
                              Order ID: <span className="font-mono text-base">{order.razorpayOrderId || order._id}</span>
                            </span>
                            <p className="text-sm font-bold text-gray-500 mt-1 uppercase">
                              Placed on: {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`self-start sm:self-center px-4 py-1 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${order.paymentStatus === 'paid' ? 'bg-green-400 text-black' :
                              order.paymentStatus === 'pending' ? 'bg-yellow-400 text-black' :
                                'bg-red-400 text-white'
                            }`}>
                            {order.paymentStatus}
                          </span>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-black text-sm uppercase mb-2">Items:</h4>
                          <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {order.items.map(item => (
                              <li key={item._id || item.product?._id} className="text-sm font-bold border-l-4 border-black pl-2 py-1 bg-gray-50 flex justify-between items-center">
                                <span>{item.nameAtPurchase || item.product?.name || 'N/A'} (x{item.quantity})</span>
                                <span>₹{item.priceAtPurchase.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-t-2 border-black pt-4 text-right">
                          <p className="text-xl font-black uppercase">
                            Total: ₹{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Order Status Tracker */}
                      <OrderStatusTracker
                        currentStatus={order.orderStatus || 'Processing'}
                        estimatedDeliveryDate={order.estimatedDeliveryDate}
                        statusHistory={order.statusHistory}
                      />
                    </div>
                  );
                })()}
                {orders.length > 1 && (
                  <div className="flex justify-between items-center mt-6 gap-4">
                    <button
                      onClick={() => setCurrentOrderIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentOrderIndex === 0}
                      className="px-4 py-2 bg-white text-black font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <i className="sm:hidden ri-arrow-left-line"></i>
                    </button>
                    <span className="text-sm font-bold uppercase border-2 border-black px-3 py-1 bg-gray-100">
                      Order {currentOrderIndex + 1} / {orders.length}
                    </span>
                    <button
                      onClick={() => setCurrentOrderIndex(prev => Math.min(orders.length - 1, prev + 1))}
                      disabled={currentOrderIndex === orders.length - 1}
                      className="px-4 py-2 bg-white text-black font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <i className="sm:hidden ri-arrow-right-line"></i>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-black border-dashed bg-gray-50">
                <i className="ri-dropbox-line text-5xl text-gray-400 mb-3 block"></i>
                <p className="text-lg font-bold text-gray-600 uppercase mb-6">You have no orders yet.</p>
                <Link
                  to="/shop"
                  className="inline-block bg-primary text-white font-black uppercase py-3 px-6 border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;







