import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { CardSkeleton } from '../components/ui/SkeletonLoader.jsx';
import apiClient from '../services/apiClient';

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'

  const handleSendNotification = async (couponId, couponCode) => {
    if (!window.confirm(`Send notification about coupon "${couponCode}" to all users?`)) {
      return;
    }

    try {
      const response = await apiClient.post(`/api/v1/coupons/${couponId}/notify`);
      
      // Check if response is successful
      if (response && response.data && response.data.success) {
        alert(response.data.message || `Notification sent successfully to ${response.data.userCount || 0} users`);
      } else {
        alert('Notification sent but received unexpected response');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      
      // Check if it's a network error vs server error
      if (err.response) {
        // Server responded with error
        alert(err.response.data?.error || err.response.data?.message || 'Failed to send notification');
      } else if (err.request) {
        // Request made but no response
        alert('Network error: Unable to reach server');
      } else {
        // Something else went wrong
        alert('Failed to send notification: ' + err.message);
      }
    }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/coupons?${params.toString()}`,
        { credentials: 'include' }
      );
      
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }
      
      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      
      setCoupons(data?.coupons || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch coupons.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filterActive]);

  const initiateDeleteCoupon = (couponId) => {
    setCouponToDelete(couponId);
    setShowConfirmDialog(true);
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/coupons/${couponToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      let responseData;
      if (response.headers.get("content-type")?.includes("application/json")) {
        responseData = await response.json();
      }
      
      if (response.ok) {
        alert(responseData?.message || "Coupon deleted successfully.");
        fetchCoupons();
      } else {
        alert(`Failed to delete coupon: ${responseData?.error || responseData?.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Error deleting coupon:", err);
      alert(`Error deleting coupon: ${err.message || 'Unknown server error'}`);
    } finally {
      setShowConfirmDialog(false);
      setCouponToDelete(null);
    }
  };

  const cancelDeleteCoupon = () => {
    setShowConfirmDialog(false);
    setCouponToDelete(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const expiryDate = new Date(coupon.expiryDate);
    
    if (!coupon.isActive) return { text: 'Inactive', color: 'bg-gray-500' };
    if (now < startDate) return { text: 'Scheduled', color: 'bg-yellow-500' };
    if (now > expiryDate) return { text: 'Expired', color: 'bg-red-500' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { text: 'Used Up', color: 'bg-red-500' };
    return { text: 'Active', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-8 w-64 rounded"></div>
            <div className="flex gap-3 items-center">
              <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-10 w-48 rounded"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} showImage={false} lines={3} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="w-full min-h-screen flex items-center justify-center py-20 text-red-500 dark:text-red-400">Error fetching coupons: {error}</div>;
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white mb-2">Manage Coupons</h1>
            <p className="text-slate-600 dark:text-slate-400">Create and manage discount coupons for your store</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Coupons</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <Link
              to="/admin/create-coupon"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 text-sm font-semibold text-center"
            >
              Create New Coupon
            </Link>
          </div>
        </div>
      </div>

      {coupons.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">No coupons found.</p>
          <Link
            to="/admin/create-coupon"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 text-sm font-semibold"
          >
            Create Your First Coupon
          </Link>
        </div>
      )}

      {/* Coupons List */}
      <div className="grid grid-cols-1 gap-5">
        {coupons.map((coupon) => {
          const status = getCouponStatus(coupon);
          const usagePercentage = coupon.usageLimit ? (coupon.usedCount / coupon.usageLimit) * 100 : 0;
          
          return (
            <div
              key={coupon._id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-2xl"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  {/* Left Section - Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{coupon.code}</h3>
                          <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full font-semibold`}>
                            {status.text}
                          </span>
                        </div>
                        {coupon.description && (
                          <p className="text-slate-600 dark:text-slate-400 mb-3">{coupon.description}</p>
                        )}
                        
                        {/* Discount Info */}
                        <div className="flex flex-wrap gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Discount:</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                            </span>
                          </div>
                          {coupon.maxDiscountAmount && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500 dark:text-slate-400">Max:</span>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">₹{coupon.maxDiscountAmount}</span>
                            </div>
                          )}
                          {coupon.minPurchaseAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500 dark:text-slate-400">Min Purchase:</span>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">₹{coupon.minPurchaseAmount}</span>
                            </div>
                          )}
                        </div>

                        {/* Application Type */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">
                            {coupon.applicationType === 'all' ? 'All Products' : 
                             coupon.applicationType === 'categories' ? `${coupon.applicableCategories.length} Categories` : 
                             `${coupon.applicableProducts.length} Products`}
                          </span>
                          {coupon.oneTimePerUser && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                              One per User
                            </span>
                          )}
                        </div>

                        {/* Categories Display */}
                        {coupon.applicationType === 'categories' && coupon.applicableCategories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Categories:</span>
                            {coupon.applicableCategories.map((cat) => (
                              <span key={cat._id} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Stats & Actions */}
                  <div className="lg:w-64 flex flex-col gap-4">
                    {/* Usage Stats */}
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Usage</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">
                          {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                        </span>
                      </div>
                      {coupon.usageLimit && (
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <span>Start:</span>
                          <span>{formatDate(coupon.startDate)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>Expires:</span>
                          <span>{formatDate(coupon.expiryDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendNotification(coupon._id, coupon.code)}
                        className="flex-1 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 py-2 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 font-medium flex items-center justify-center gap-1"
                        title="Send notification to all users"
                      >
                        <Bell className="w-3 h-3" />
                        Notify
                      </button>
                      <Link
                        to={`/admin/edit-coupon/${coupon._id}`}
                        className="flex-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-2 py-2 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 font-medium text-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => initiateDeleteCoupon(coupon._id)}
                        className="flex-1 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-2 py-2 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Confirm Deletion</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteCoupon}
                className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDeleteCoupon}
                className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoupons;