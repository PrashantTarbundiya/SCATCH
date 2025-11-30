import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EditCoupon = () => {
  const navigate = useNavigate();
  const { couponId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingCoupon, setFetchingCoupon] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchaseAmount: '0',
    maxDiscountAmount: '',
    applicationType: 'all',
    applicableCategories: [],
    usageLimit: '',
    oneTimePerUser: false,
    startDate: '',
    expiryDate: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});

  // Fetch coupon data
  useEffect(() => {
    const fetchCoupon = async () => {
      setFetchingCoupon(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/coupons/${couponId}`,
          { credentials: 'include' }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch coupon');
        }
        
        const data = await response.json();
        const coupon = data.coupon;
        
        // Helper function to safely format dates
        const formatDate = (dateValue) => {
          if (!dateValue) return '';
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        };

        setFormData({
          code: coupon.code,
          description: coupon.description || '',
          discountType: coupon.discountType,
          discountValue: coupon.discountValue.toString(),
          minPurchaseAmount: coupon.minPurchaseAmount.toString(),
          maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '',
          applicationType: coupon.applicationType,
          applicableCategories: coupon.applicableCategories.map(cat => cat._id),
          usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
          oneTimePerUser: coupon.oneTimePerUser,
          startDate: formatDate(coupon.startDate),
          expiryDate: formatDate(coupon.expiryDate),
          isActive: coupon.isActive
        });
      } catch (err) {
        console.error('Error fetching coupon:', err);
        alert('Failed to load coupon. Please try again.');
        navigate('/admin/coupons');
      } finally {
        setFetchingCoupon(false);
      }
    };

    fetchCoupon();
  }, [couponId, navigate]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'applicableCategories') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selectedOptions
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Coupon code must be at least 3 characters';
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (new Date(formData.expiryDate) < new Date(formData.startDate)) {
      newErrors.expiryDate = 'Expiry date must be after start date';
    }

    if (formData.applicationType === 'categories' && formData.applicableCategories.length === 0) {
      newErrors.applicableCategories = 'Please select at least one category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update coupon');
      }

      alert('Coupon updated successfully!');
      navigate('/admin/coupons');
    } catch (error) {
      console.error('Error updating coupon:', error);
      alert(error.message || 'Failed to update coupon');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCoupon) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-[#2A1F47] rounded-2xl shadow-lg shadow-purple-500/20 p-6 mb-8 border border-purple-500/20">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-100 mb-2">Edit Coupon</h1>
        <p className="text-purple-300">Modify coupon details</p>
      </div>

      <div className="bg-[#2A1F47] rounded-2xl shadow-lg shadow-purple-500/20 p-8 border border-purple-500/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Coupon Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Discount Type *
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Discount Value *
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              />
              {errors.discountValue && <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>}
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Max Discount (₹)
                </label>
                <input
                  type="number"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* Application Type */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Apply To *
            </label>
            <select
              name="applicationType"
              value={formData.applicationType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Products</option>
              <option value="categories">Specific Categories</option>
            </select>
          </div>

          {/* Category Selection */}
          {formData.applicationType === 'categories' && (
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Select Categories *
              </label>
              <select
                name="applicableCategories"
                multiple
                value={formData.applicableCategories}
                onChange={handleChange}
                disabled={categoriesLoading}
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500 min-h-[150px]"
              >
                {categoriesLoading ? (
                  <option disabled>Loading categories...</option>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No categories available</option>
                )}
              </select>
              <p className="text-sm text-purple-400 mt-1">
                Hold Ctrl (Cmd on Mac) to select multiple categories
              </p>
              {errors.applicableCategories && <p className="text-red-500 text-sm mt-1">{errors.applicableCategories}</p>}
            </div>
          )}

          {/* Purchase Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Minimum Purchase Amount (₹)
              </label>
              <input
                type="number"
                name="minPurchaseAmount"
                value={formData.minPurchaseAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-purple-500/30 rounded-xl bg-[#1E1538] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500"
              />
              {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="oneTimePerUser"
                checked={formData.oneTimePerUser}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 border-purple-500/30 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="ml-3 text-sm font-medium text-purple-200">
                One time use per user
              </span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 border-purple-500/30 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="ml-3 text-sm font-medium text-purple-200">
                Active
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200 hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Coupon'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/coupons')}
              className="px-8 py-3 bg-slate-200 dark:bg-white dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-purple-200 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCoupon;







