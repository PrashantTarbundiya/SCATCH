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

  if (authLoading || pageLoading) { // Check authLoading as well
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E] text-gray-900 dark:text-purple-100 transition-colors duration-300 pt-20 pb-12">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-4 pt-20 text-center text-red-500 dark:text-red-400">Error: {error}</div>;
  }

  if (!profileData) {
    return <div className="container mx-auto p-4 pt-20 text-center text-gray-700 dark:text-gray-700 dark:text-purple-200">No profile data found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E] text-gray-900 dark:text-purple-100 transition-colors duration-300 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 p-4 sm:p-6 md:p-8 rounded-lg shadow-xl shadow-purple-500/20 mb-6 md:mb-10 text-gray-900 dark:text-white">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0">
            <img
              className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-full object-cover border-4 border-white dark:border-gray-300 dark:border-purple-500/30 shadow-md dark:shadow-purple-500/20 md:mr-8"
              src={profileData.profilePhoto}
              alt="Profile"
            />
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">{profileData.name}</h1>
              <p className="text-sm sm:text-base md:text-lg opacity-90 break-all mt-1">{profileData.email}</p>
            </div>
            <Link
              to="/profile/edit"
              className="w-full md:w-auto md:ml-auto bg-white/20 dark:bg-[#2A1F47]/20 backdrop-blur-sm text-white hover:bg-white/30 dark:hover:bg-[#2A1F47]/30 font-semibold py-2 px-4 sm:px-5 rounded-lg shadow transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <i className="ri-edit-2-line"></i>
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Adjusted grid for wider Personal Info on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {/* Personal Information Card - now takes up 2/5 on large screens */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl border border-purple-500/20 p-4 sm:p-5 md:p-6 rounded-lg shadow-lg dark:shadow-purple-500/20 shadow-purple-500/10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-purple-100 border-b pb-2 sm:pb-3 border-purple-500/20 flex items-center gap-2">
              <i className="ri-user-line text-purple-400"></i>
              <span>Personal Info</span>
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-purple-300 mb-1">Full Name</p>
                <p className="text-base sm:text-lg break-words">{profileData.name}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-purple-300 mb-1">Email Address</p>
                <p className="text-base sm:text-lg flex items-center gap-2 break-all">
                  <i className="ri-mail-line opacity-70 flex-shrink-0"></i>
                  <span>{profileData.email}</span>
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-purple-300 mb-1">Phone Number</p>
                <p className="text-base sm:text-lg flex items-center gap-2">
                  <i className="ri-phone-line opacity-70 flex-shrink-0"></i>
                  <span>{profileData.phone}</span>
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-purple-300 mb-1">Address</p>
                <p className="text-base sm:text-lg flex items-start gap-2">
                  <i className="ri-map-pin-line mt-1 opacity-70 flex-shrink-0"></i>
                  <span className="whitespace-pre-line break-words">{profileData.address || 'Not provided'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Orders Card - now takes up 3/5 on large screens */}
          <div className="lg:col-span-3 bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl border border-purple-500/20 p-4 sm:p-5 md:p-6 rounded-lg shadow-lg dark:shadow-purple-500/20 shadow-purple-500/10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-purple-100 border-b pb-2 sm:pb-3 border-purple-500/20 flex items-center gap-2">
              <i className="ri-shopping-bag-3-line text-cyan-400"></i>
              <span>My Orders</span>
            </h2>
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border border-purple-500/20 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-5 w-32 rounded"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-6 w-16 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-4 w-full rounded"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-4 w-3/4 rounded"></div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 text-right">
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-5 w-20 rounded ml-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ordersError ? (
              <p className="text-center text-red-500 dark:text-red-400">{ordersError}</p>
            ) : orders.length > 0 ? (
              <div>
                {(() => {
                  const order = orders[currentOrderIndex];
                  if (!order) return <p className="text-center text-gray-600 dark:text-gray-600 dark:text-purple-300">Order not found.</p>;
                  return (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="p-3 sm:p-4 border border-purple-500/20 rounded-lg bg-white dark:bg-[#2A1F47] shadow-md dark:shadow-purple-500/20">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2">
                          <div className="flex-1">
                            <span className="font-semibold text-base sm:text-lg text-gray-900 dark:text-purple-100 block break-words">
                              Order ID: {order.razorpayOrderId || order._id}
                            </span>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-purple-300 mt-1">
                              Placed on: {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`self-start sm:self-center px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                            order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                            'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                          }`}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="font-medium text-sm sm:text-base text-gray-700 dark:text-purple-200 mb-2">Items:</h4>
                          <ul className="list-disc list-inside pl-1 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-purple-300 max-h-32 sm:max-h-40 overflow-y-auto custom-scrollbar pr-1">
                            {order.items.map(item => (
                              <li key={item._id || item.product?._id} className="break-words">
                                {item.nameAtPurchase || item.product?.name || 'N/A'} - {item.quantity} x ₹{item.priceAtPurchase.toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-t border-purple-500/20 pt-2 mt-2 text-right">
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-purple-100">
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
                  <div className="flex justify-between items-center mt-4 gap-2">
                    <button
                      onClick={() => setCurrentOrderIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentOrderIndex === 0}
                      className="px-3 sm:px-4 py-2 bg-purple-900/50 text-gray-900 dark:text-purple-100 rounded-md hover:bg-purple-900/70 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <i className="sm:hidden ri-arrow-left-line"></i>
                    </button>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-purple-300 text-center px-2">
                      Order {currentOrderIndex + 1} of {orders.length}
                    </span>
                    <button
                      onClick={() => setCurrentOrderIndex(prev => Math.min(orders.length - 1, prev + 1))}
                      disabled={currentOrderIndex === orders.length - 1}
                      className="px-3 sm:px-4 py-2 bg-purple-900/50 text-gray-900 dark:text-purple-100 rounded-md hover:bg-purple-900/70 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <i className="sm:hidden ri-arrow-right-line"></i>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <i className="ri-dropbox-line text-4xl sm:text-5xl text-purple-400 mb-3"></i>
                <p className="text-sm sm:text-base text-gray-600 dark:text-purple-300 mb-4">You have no orders yet.</p>
                <Link
                  to="/shop"
                  className="inline-block bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all shadow-lg dark:shadow-purple-500/20 hover:shadow-purple-500/30 text-sm sm:text-base"
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







