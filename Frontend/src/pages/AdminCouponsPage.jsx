import React, { useState, useEffect } from 'react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../services/couponService.js'; // Corrected path and added .js
import CouponFormModal from '../components/CouponFormModal.jsx'; // Corrected path and added .jsx
import { TableSkeleton } from '../components/ui/SkeletonLoader.jsx';

const AdminCouponsPage = () => {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentCouponToEdit, setCurrentCouponToEdit] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [couponToDeleteId, setCouponToDeleteId] = useState(null);

    const fetchCoupons = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getAllCoupons();
            if (response.success) {
                setCoupons(response.data || []);
            } else {
                setError(response.message || "Failed to fetch coupons.");
                setCoupons([]);
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred while fetching coupons.");
            setCoupons([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreateCouponSubmit = async (couponData) => {
        try {
            const response = await createCoupon(couponData);
            if (response.success) {
                fetchCoupons(); // Refresh the list
                handleCloseCreateModal();
                // Optionally, show a success notification
            } else {
                // The error should be caught by the modal's submit handler and displayed there
                // If not, or for additional handling:
                throw new Error(response.message || "Failed to create coupon from page.");
            }
        } catch (err) {
            console.error("Error creating coupon from page:", err);
            // setError(err.message || "An error occurred while creating the coupon."); // Modal handles its own errors
            // Let the modal display the error from its own submission attempt.
            // If the modal's onSubmit itself throws, it will be caught here.
            // Re-throw to ensure modal's finally block runs if it depends on promise rejection
            throw err;
        }
    };
    
    const handleOpenEditModal = (coupon) => {
        setCurrentCouponToEdit(coupon);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentCouponToEdit(null);
    };

    const handleEditCouponSubmit = async (couponData) => {
        if (!currentCouponToEdit || !currentCouponToEdit._id) {
            console.error("No coupon selected for editing or coupon ID missing.");
            // setError("No coupon selected for editing or coupon ID missing."); // Or display in modal
            throw new Error("No coupon selected for editing or coupon ID missing.");
        }
        try {
            const response = await updateCoupon(currentCouponToEdit._id, couponData);
            if (response.success) {
                fetchCoupons(); // Refresh the list
                handleCloseEditModal();
                // Optionally, show a success notification
            } else {
                throw new Error(response.message || "Failed to update coupon from page.");
            }
        } catch (err) {
            console.error("Error updating coupon from page:", err);
            // Let the modal display the error from its own submission attempt.
            throw err;
        }
    };
 
    const handleDeleteCoupon = async (couponId) => {
        if (window.confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) {
            try {
                const response = await deleteCoupon(couponId);
                if (response.success) {
                    fetchCoupons(); // Refresh the list
                    // Optionally, show a success notification
                } else {
                    setError(response.message || "Failed to delete coupon.");
                }
            } catch (err) {
                setError(err.message || "An error occurred while deleting the coupon.");
            }
        }
    };

    return (
      // The parent div with padding and margin for sidebar is now in OwnerProtectedRoute.jsx
      // This div should just be a simple container for its own content.
      <div className="w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white mb-2">
                        Manage Coupons
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">Create and manage discount coupons for your store</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                >
                    Create New Coupon
                </button>
            </div>
        </div>

            {isLoading && <TableSkeleton rows={5} columns={7} />}
            {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-3 rounded-md">{error}</p>}
            
            {!isLoading && !error && coupons.length === 0 && (
                <p className="text-center text-gray-600 dark:text-gray-300">No coupons found. Create one!</p>
            )}

            {!isLoading && !error && coupons.length > 0 && (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Code</th>
                                <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Type</th>
                                <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Value</th>
                                <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">Usage</th>
                                <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">Valid Until</th>
                                <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {coupons.map((coupon) => {
                                // Determine status display
                                let statusText = 'Active';
                                let statusClass = 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
                                
                                if (!coupon.isActive) {
                                    statusText = 'Inactive';
                                    statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
                                } else if (coupon.isExpired) {
                                    statusText = 'Expired';
                                    statusClass = 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
                                } else if (coupon.isUsageLimitReached) {
                                    statusText = 'Usage Limit Reached';
                                    statusClass = 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100';
                                } else if (!coupon.isCurrentlyActive) {
                                    statusText = 'Not Yet Active';
                                    statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
                                }
                                
                                // Usage display
                                const usageDisplay = coupon.usageLimit
                                    ? `${coupon.timesUsed || 0}/${coupon.usageLimit}`
                                    : `${coupon.timesUsed || 0}/∞`;
                                
                                return (
                                    <tr key={coupon._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{coupon.code}</td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{coupon.discountType}</td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-xl ${statusClass}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                                            {usageDisplay}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                                            {new Date(coupon.validUntil).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(coupon)}
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 text-xs font-semibold"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCoupon(coupon._id)}
                                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 text-xs font-semibold"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            
            <CouponFormModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateCouponSubmit}
                mode="create"
            />
            <CouponFormModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSubmit={handleEditCouponSubmit}
                initialData={currentCouponToEdit}
                mode="edit"
            />
        </div>
    );
};

export default AdminCouponsPage;