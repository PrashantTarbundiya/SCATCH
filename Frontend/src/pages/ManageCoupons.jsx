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
    return { text: 'Active', color: 'bg-green-500 dark:bg-green-600' };
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="bg-gray-200 animate-pulse h-8 w-64 border-2 border-black shadow-neo"></div>
            <div className="flex gap-3 items-center">
              <div className="bg-gray-200 animate-pulse h-10 w-48 border-2 border-black shadow-neo-sm"></div>
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
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
              <i className="ri-ticket-2-line"></i>
              <span>Manage Coupons</span>
            </h1>
            <p className="text-lg font-bold text-gray-600 uppercase">Create and manage discount coupons</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
            <div className="relative w-full sm:w-auto">
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="w-full sm:w-48 px-4 py-3 bg-white border-2 border-black font-bold uppercase focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <i className="ri-arrow-down-s-line text-xl font-bold"></i>
              </div>
            </div>
            <Link
              to="/admin/create-coupon"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-black uppercase tracking-wider border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <i className="ri-add-circle-line"></i> Create New Coupon
            </Link>
          </div>
        </div>
      </div>

      {coupons.length === 0 && !loading && (
        <div className="bg-white border-4 border-black shadow-neo p-12 text-center border-dashed">
          <p className="font-black uppercase text-xl mb-6 text-gray-500">No coupons found.</p>
          <Link
            to="/admin/create-coupon"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-black uppercase tracking-wider border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Create Your First Coupon
          </Link>
        </div>
      )}

      {/* Coupons List */}
      <div className="grid grid-cols-1 gap-6">
        {coupons.map((coupon) => {
          const status = getCouponStatus(coupon);
          const usagePercentage = coupon.usageLimit ? (coupon.usedCount / coupon.usageLimit) * 100 : 0;

          return (
            <div
              key={coupon._id}
              className="bg-white border-4 border-black shadow-neo p-6 md:p-8 relative group"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                {/* Left Section - Main Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <span className="text-3xl font-black font-mono border-2 border-black bg-gray-100 px-3 py-1 uppercase tracking-widest">{coupon.code}</span>
                    <span className={`text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${status.text === 'Active' ? 'bg-green-400 text-black' :
                      status.text === 'Inactive' ? 'bg-gray-400 text-black' :
                        status.text === 'Expired' ? 'bg-red-400 text-white' :
                          'bg-yellow-400 text-black'
                      }`}>
                      {status.text}
                    </span>
                  </div>

                  {coupon.description && (
                    <p className="font-bold text-gray-600 uppercase mb-4 text-sm">{coupon.description}</p>
                  )}

                  {/* Discount Info */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 border-2 border-black px-3 py-1 bg-blue-50">
                      <span className="font-black uppercase">Discount:</span>
                      <span className="font-black text-blue-600">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </span>
                    </div>
                    {coupon.maxDiscountAmount && (
                      <div className="flex items-center gap-2 border-2 border-black px-3 py-1 bg-purple-50">
                        <span className="font-black uppercase">Max:</span>
                        <span className="font-bold">₹{coupon.maxDiscountAmount}</span>
                      </div>
                    )}
                    {coupon.minPurchaseAmount > 0 && (
                      <div className="flex items-center gap-2 border-2 border-black px-3 py-1 bg-yellow-50">
                        <span className="font-black uppercase">Min Purchase:</span>
                        <span className="font-bold">₹{coupon.minPurchaseAmount}</span>
                      </div>
                    )}
                  </div>

                  {/* Application Type */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs font-black uppercase bg-black text-white px-3 py-1 border-2 border-black">
                      {coupon.applicationType === 'all' ? 'All Products' :
                        coupon.applicationType === 'categories' ? `${coupon.applicableCategories.length} Categories` :
                          `${coupon.applicableProducts.length} Products`}
                    </span>
                    {coupon.oneTimePerUser && (
                      <span className="text-xs font-black uppercase bg-purple-200 text-purple-900 px-3 py-1 border-2 border-black">
                        One per User
                      </span>
                    )}
                  </div>

                  {/* Categories Display */}
                  {coupon.applicationType === 'categories' && coupon.applicableCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs font-black uppercase text-gray-500 py-1">Categories:</span>
                      {coupon.applicableCategories.map((cat) => (
                        <span key={cat._id} className="text-xs font-bold uppercase bg-blue-100 text-blue-800 px-2 py-1 border-2 border-black">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Section - Stats & Actions */}
                <div className="lg:w-72 flex flex-col gap-6 border-l-4 border-black border-dashed pl-0 lg:pl-8 pt-6 lg:pt-0">
                  {/* Usage Stats */}
                  <div className="bg-gray-50 border-2 border-black p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black uppercase">Usage</span>
                      <span className="text-xs font-black">
                        {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                      </span>
                    </div>
                    {coupon.usageLimit && (
                      <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full border-r-2 border-black transition-all duration-300"
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t-2 border-black border-dashed space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase text-gray-600">
                        <span>Start:</span>
                        <span>{formatDate(coupon.startDate)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase text-gray-600">
                        <span>Expires:</span>
                        <span>{formatDate(coupon.expiryDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSendNotification(coupon._id, coupon.code)}
                      className="bg-green-500 text-black border-2 border-black font-bold p-2 hover:bg-green-400 transition-colors flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      title="Send Notification"
                    >
                      <Bell className="w-5 h-5" />
                    </button>
                    <Link
                      to={`/admin/edit-coupon/${coupon._id}`}
                      className="bg-blue-500 text-white border-2 border-black font-bold p-2 hover:bg-blue-400 transition-colors flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      title="Edit Coupon"
                    >
                      <i className="ri-edit-line text-lg"></i>
                    </Link>
                    <button
                      onClick={() => initiateDeleteCoupon(coupon._id)}
                      className="bg-red-500 text-white border-2 border-black font-bold p-2 hover:bg-red-400 transition-colors flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      title="Delete Coupon"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-neo p-8 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black uppercase mb-4 flex items-center gap-2 text-red-600">
              <i className="ri-alarm-warning-line"></i> Confirm Delete
            </h3>
            <p className="mb-8 font-bold text-gray-700 uppercase">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteCoupon}
                className="px-6 py-2 border-2 border-black font-bold uppercase hover:bg-gray-100 transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDeleteCoupon}
                className="px-6 py-2 bg-red-600 text-white border-2 border-black font-bold uppercase shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
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







