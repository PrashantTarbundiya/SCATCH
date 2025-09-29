import Coupon from '../models/coupon-model.js';
import Category from '../models/category-model.js';
import Product from '../models/product-model.js';
import Notification from '../models/notification-model.js';
import User from '../models/users-model.js';

// Create a new coupon
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      applicableCategories,
      applicableProducts,
      applicationType,
      usageLimit,
      oneTimePerUser,
      startDate,
      expiryDate,
      isActive
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({
        success: false,
        error: 'Code, discount type, discount value, and expiry date are required'
      });
    }

    // Validate discount value based on type
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Percentage discount must be between 0 and 100'
      });
    }

    if (discountType === 'fixedAmount' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Fixed discount must be greater than 0'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code already exists'
      });
    }

    // Validate categories if applicable
    if (applicationType === 'categories' && applicableCategories && applicableCategories.length > 0) {
      const categoryCount = await Category.countDocuments({ _id: { $in: applicableCategories } });
      if (categoryCount !== applicableCategories.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more specified categories do not exist'
        });
      }
    }

    // Validate products if applicable
    if (applicationType === 'products' && applicableProducts && applicableProducts.length > 0) {
      const productCount = await Product.countDocuments({ _id: { $in: applicableProducts } });
      if (productCount !== applicableProducts.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more specified products do not exist'
        });
      }
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount,
      applicableCategories: applicationType === 'categories' ? applicableCategories : [],
      applicableProducts: applicationType === 'products' ? applicableProducts : [],
      applicationType: applicationType || 'all',
      usageLimit,
      oneTimePerUser: oneTimePerUser || false,
      startDate: startDate || Date.now(),
      expiryDate,
      isActive: isActive !== undefined ? isActive : true
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create coupon'
    });
  }
};

// Get all coupons
export const getAllCoupons = async (req, res) => {
  try {
    const { isActive, applicationType } = req.query;
    
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (applicationType) filter.applicationType = applicationType;

    const coupons = await Coupon.find(filter)
      .populate('applicableCategories', 'name slug')
      .populate('applicableProducts', 'name price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch coupons'
    });
  }
};

// Get coupon by ID
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('applicableCategories', 'name slug')
      .populate('applicableProducts', 'name price');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      coupon
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch coupon'
    });
  }
};

// Validate and get coupon by code
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartItems, userId } = req.body;

    if (!code || !cartItems) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code and cart items are required'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })
      .populate('applicableCategories')
      .populate('applicableProducts');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Invalid coupon code'
      });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Coupon has expired or reached usage limit'
      });
    }

    // Check if user can use this coupon
    if (userId && !coupon.canUserUse(userId)) {
      return res.status(400).json({
        success: false,
        error: 'You have already used this coupon'
      });
    }

    // Calculate applicable amount based on cart items and coupon type
    let applicableAmount = 0;

    if (coupon.applicationType === 'all') {
      // Apply to entire cart
      applicableAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } else if (coupon.applicationType === 'categories') {
      // Apply only to items from specified categories
      const categoryIds = coupon.applicableCategories.map(cat => cat._id.toString());
      applicableAmount = cartItems
        .filter(item => item.category && categoryIds.includes(item.category.toString()))
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } else if (coupon.applicationType === 'products') {
      // Apply only to specified products
      const productIds = coupon.applicableProducts.map(prod => prod._id.toString());
      applicableAmount = cartItems
        .filter(item => productIds.includes(item.productId.toString()))
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Check minimum purchase amount
    if (applicableAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(applicableAmount);

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applicableAmount,
        discount,
        minPurchaseAmount: coupon.minPurchaseAmount,
        applicationType: coupon.applicationType
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate coupon'
    });
  }
};

// Update coupon
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      applicableCategories,
      applicableProducts,
      applicationType,
      usageLimit,
      oneTimePerUser,
      startDate,
      expiryDate,
      isActive
    } = req.body;

    // Validate discount value if being updated
    if (discountType && discountValue !== undefined) {
      if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
        return res.status(400).json({
          success: false,
          error: 'Percentage discount must be between 0 and 100'
        });
      }
      if (discountType === 'fixedAmount' && discountValue <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Fixed discount must be greater than 0'
        });
      }
    }

    // Check if new code already exists
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          error: 'Coupon code already exists'
        });
      }
      coupon.code = code.toUpperCase();
    }

    // Update fields
    if (description !== undefined) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = minPurchaseAmount;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (applicationType) coupon.applicationType = applicationType;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (oneTimePerUser !== undefined) coupon.oneTimePerUser = oneTimePerUser;
    if (startDate) coupon.startDate = startDate;
    if (expiryDate) coupon.expiryDate = expiryDate;
    if (isActive !== undefined) coupon.isActive = isActive;

    // Update applicable categories/products based on type
    if (applicationType === 'categories' && applicableCategories) {
      coupon.applicableCategories = applicableCategories;
      coupon.applicableProducts = [];
    } else if (applicationType === 'products' && applicableProducts) {
      coupon.applicableProducts = applicableProducts;
      coupon.applicableCategories = [];
    } else if (applicationType === 'all') {
      coupon.applicableCategories = [];
      coupon.applicableProducts = [];
    }

    await coupon.save();

    const updatedCoupon = await Coupon.findById(coupon._id)
      .populate('applicableCategories', 'name slug')
      .populate('applicableProducts', 'name price');

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon: updatedCoupon
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update coupon'
    });
  }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete coupon'
    });
  }
};

// Apply coupon to order (increment usage count)
export const applyCoupon = async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Invalid coupon code'
      });
    }

    // Increment usage count
    coupon.usedCount += 1;

    // Add user to usersUsed if applicable
    if (userId && coupon.oneTimePerUser) {
      if (!coupon.usersUsed.includes(userId)) {
        coupon.usersUsed.push(userId);
      }
    }

    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully'
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply coupon'
    });
  }
};

// Send notification about a coupon to all users
export const sendCouponNotification = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Get all non-owner users
    const users = await User.find({ role: { $ne: 'owner' } }).select('_id');
    
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users to notify'
      });
    }

    // Build notification message
    let message = `New coupon "${coupon.code}" available! `;
    
    if (coupon.discountType === 'percentage') {
      message += `Get ${coupon.discountValue}% off`;
    } else {
      message += `Get ₹${coupon.discountValue} off`;
    }
    
    if (coupon.applicationType === 'categories' && coupon.applicableCategories?.length > 0) {
      message += ` on selected categories`;
    } else if (coupon.applicationType === 'products' && coupon.applicableProducts?.length > 0) {
      message += ` on selected products`;
    } else {
      message += ` on your purchase`;
    }
    
    if (coupon.minPurchaseAmount > 0) {
      message += `. Minimum purchase: ₹${coupon.minPurchaseAmount}`;
    }

    // Create notifications for all users
    const notificationPromises = users.map(user =>
      Notification.create({
        user: user._id,
        type: 'coupon_alert',
        title: 'New Coupon Available! 🎉',
        message,
        priority: 'high',
        data: {
          couponCode: coupon.code,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
          validUntil: coupon.expiryDate
        },
        actionUrl: '/shop'
      })
    );
    
    await Promise.all(notificationPromises);

    res.status(200).json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      userCount: users.length
    });
  } catch (error) {
    console.error('Error sending coupon notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
};

export default {
  createCoupon,
  getAllCoupons,
  getCouponById,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  sendCouponNotification
};
