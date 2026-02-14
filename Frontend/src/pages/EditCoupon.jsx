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
      <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8 mb-8">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
          <i className="ri-edit-circle-line"></i>
          <span>Edit Coupon</span>
        </h1>
        <p className="text-lg font-bold text-gray-600 uppercase">Modify coupon details</p>
      </div>

      <div className="bg-white border-4 border-black shadow-neo p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-black uppercase mb-2">
                Coupon Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
              {errors.code && <p className="text-red-600 font-bold text-sm mt-1 uppercase">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-black uppercase mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="bg-gray-50 border-2 border-black p-6 relative">
            <h3 className="absolute -top-3 left-4 bg-black text-white px-2 text-xs font-black uppercase">Discount Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <label className="block text-sm font-black uppercase mb-2">
                  Discount Type *
                </label>
                <div className="relative">
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-black bg-white font-bold appearance-none focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <i className="ri-arrow-down-s-line text-xl font-bold"></i>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black uppercase mb-2">
                  Discount Value *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-black bg-white font-bold placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
                {errors.discountValue && <p className="text-red-600 font-bold text-sm mt-1 uppercase">{errors.discountValue}</p>}
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-black uppercase mb-2">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-black bg-white font-bold placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Application Type */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">
              Apply To *
            </label>
            <div className="relative">
              <select
                name="applicationType"
                value={formData.applicationType}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold appearance-none focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <option value="all">All Products</option>
                <option value="categories">Specific Categories</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <i className="ri-arrow-down-s-line text-xl font-bold"></i>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          {formData.applicationType === 'categories' && (
            <div className="border-2 border-black p-4 bg-blue-50">
              <label className="block text-sm font-black uppercase mb-2">
                Select Categories *
              </label>
              <select
                name="applicableCategories"
                multiple
                value={formData.applicableCategories}
                onChange={handleChange}
                disabled={categoriesLoading}
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all min-h-[150px]"
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
              <p className="text-sm font-bold text-gray-500 mt-2 uppercase">
                Hold Ctrl (Cmd on Mac) to select multiple categories
              </p>
              {errors.applicableCategories && <p className="text-red-600 font-bold text-sm mt-1 uppercase">{errors.applicableCategories}</p>}
            </div>
          )}

          {/* Purchase Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-black uppercase mb-2">
                Minimum Purchase Amount (₹)
              </label>
              <input
                type="number"
                name="minPurchaseAmount"
                value={formData.minPurchaseAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-black uppercase mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-2 border-black p-6 bg-yellow-50 relative">
            <h3 className="absolute -top-3 left-4 bg-black text-white px-2 text-xs font-black uppercase">Validity Period</h3>
            <div>
              <label className="block text-sm font-black uppercase mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-black uppercase mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-black bg-white font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
              {errors.expiryDate && <p className="text-red-600 font-bold text-sm mt-1 uppercase">{errors.expiryDate}</p>}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col sm:flex-row gap-6 p-4 border-2 border-black bg-gray-50">
            <label className="flex items-center cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="oneTimePerUser"
                  checked={formData.oneTimePerUser}
                  onChange={handleChange}
                  className="appearance-none h-6 w-6 border-2 border-black checked:bg-black transition-colors"
                />
                {formData.oneTimePerUser && (
                  <i className="ri-check-line absolute inset-0 text-white text-lg font-bold flex items-center justify-center pointer-events-none"></i>
                )}
              </div>
              <span className="ml-3 text-sm font-black uppercase group-hover:underline">
                One time use per user
              </span>
            </label>

            <label className="flex items-center cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="appearance-none h-6 w-6 border-2 border-black checked:bg-black transition-colors"
                />
                {formData.isActive && (
                  <i className="ri-check-line absolute inset-0 text-white text-lg font-bold flex items-center justify-center pointer-events-none"></i>
                )}
              </div>
              <span className="ml-3 text-sm font-black uppercase group-hover:underline">
                Active Immediately
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-4 border-black border-dashed">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {loading ? 'Updating...' : 'Update Coupon'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/coupons')}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-black font-black uppercase tracking-widest border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex-1"
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







