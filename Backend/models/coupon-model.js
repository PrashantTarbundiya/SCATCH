import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required']
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  minPurchaseAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase amount cannot be negative']
  },
  maxDiscountAmount: {
    type: Number,
    default: null,
    min: [0, 'Maximum discount amount cannot be negative']
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product'
  }],
  applicationType: {
    type: String,
    enum: ['all', 'categories', 'products'],
    default: 'all'
  },
  usageLimit: {
    type: Number,
    default: null,
    min: [0, 'Usage limit cannot be negative']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  usersUsed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  oneTimePerUser: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ expiryDate: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.expiryDate &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

// Method to check if user can use coupon
couponSchema.methods.canUserUse = function(userId) {
  if (!this.oneTimePerUser) return true;
  return !this.usersUsed.includes(userId);
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(amount) {
  if (this.discountType === 'percentage') {
    const discount = (amount * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      return this.maxDiscountAmount;
    }
    return discount;
  } else {
    return Math.min(this.discountValue, amount);
  }
};

export default mongoose.model('coupon', couponSchema);