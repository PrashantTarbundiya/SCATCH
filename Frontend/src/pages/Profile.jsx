import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import UserContext from '../context/UserContext'; // Assuming you have a UserContext
import { useUser } from '../context/UserContext'; // Import useUser to get user and setUser
import { ProfileSkeleton } from '../components/ui/SkeletonLoader.jsx';

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
          profilePhoto: user.profilePhoto || 'https://via.placeholder.com/150',
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 pt-20 pb-12">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-4 pt-20 text-center text-red-500 dark:text-red-400">Error: {error}</div>;
  }

  if (!profileData) {
    return <div className="container mx-auto p-4 pt-20 text-center text-gray-700 dark:text-gray-300">No profile data found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 pt-20 pb-12">
      <div className="w-[85%] mx-auto px-4">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-8 rounded-lg shadow-xl mb-10 text-white">
          <div className="flex flex-col md:flex-row items-center">
            <img
              className="h-36 w-36 rounded-full object-cover border-4 border-white dark:border-gray-300 shadow-md md:mr-8 mb-4 md:mb-0"
              src={profileData.profilePhoto}
              alt="Profile"
            />
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold">{profileData.name}</h1>
              <p className="text-lg opacity-90">{profileData.email}</p>
            </div>
            <Link
              to="/profile/edit"
              className="absolute top-4 right-4 md:static md:ml-auto mt-4 md:mt-0 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold py-2 px-5 rounded-lg shadow transition-colors flex items-center"
            >
              <i className="ri-edit-2-line mr-2"></i> Edit Profile
            </Link>
          </div>
        </div>

        {/* Adjusted grid for wider Personal Info on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Personal Information Card - now takes up 2/5 on large screens */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-100 border-b pb-3 border-gray-200 dark:border-gray-700">
              <i className="ri-user-line mr-2 text-blue-500 dark:text-blue-400"></i>Personal Info
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="text-lg">{profileData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                <p className="text-lg flex items-center">
                  <i className="ri-mail-line mr-2 opacity-70"></i>{profileData.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                <p className="text-lg flex items-center">
                  <i className="ri-phone-line mr-2 opacity-70"></i>{profileData.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                <p className="text-lg flex items-start">
                  <i className="ri-map-pin-line mr-2 mt-1 opacity-70"></i>
                  <span className="whitespace-pre-line">{profileData.address || 'Not provided'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Orders Card - now takes up 3/5 on large screens */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-100 border-b pb-3 border-gray-200 dark:border-gray-700">
              <i className="ri-shopping-bag-3-line mr-2 text-green-500 dark:text-green-400"></i>My Orders
            </h2>
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                  if (!order) return <p className="text-center text-gray-500 dark:text-gray-400">Order not found.</p>;
                  return (
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
                        <div>
                          <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">Order ID: {order.razorpayOrderId || order._id}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Placed on: {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                          'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                        }`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Items:</h4>
                        <ul className="list-disc list-inside pl-1 space-y-1 text-sm text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {order.items.map(item => (
                            <li key={item._id || item.product?._id}>
                              {item.nameAtPurchase || item.product?.name || 'N/A'} - {item.quantity} x ₹{item.priceAtPurchase.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 text-right">
                        <p className="text-md font-semibold text-gray-800 dark:text-gray-100">Total: ₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })()}
                {orders.length > 1 && (
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setCurrentOrderIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentOrderIndex === 0}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                      Order {currentOrderIndex + 1} of {orders.length}
                    </span>
                    <button
                      onClick={() => setCurrentOrderIndex(prev => Math.min(orders.length - 1, prev + 1))}
                      disabled={currentOrderIndex === orders.length - 1}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="ri-dropbox-line text-5xl text-gray-400 dark:text-gray-500 mb-3"></i>
                <p className="text-gray-500 dark:text-gray-400">You have no orders yet.</p>
                <Link to="/shop" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
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