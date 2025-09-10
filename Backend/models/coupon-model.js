import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Coupon code is required."],
        unique: true,
        trim: true,
        uppercase: true,
    },
    discountType: {
        type: String,
        required: [true, "Discount type is required."],
        enum: ['percentage', 'fixedAmount'], 
    },
    discountValue: {
        type: Number,
        required: [true, "Discount value is required."],
        min: [0, "Discount value cannot be negative."],
    },
    description: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    validFrom: {
        type: Date,
        default: Date.now,
    },
    validUntil: {
        type: Date,
        required: [true, "Coupon validity end date is required."],
    },
    minPurchaseAmount: {
        type: Number,
        default: 0,
    },
    usageLimit: { 
        type: Number,
        min: [1, "Usage limit must be at least 1."],
        default: null,
    },
    timesUsed: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'owner',
        required: true,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual property to check if coupon is truly active (not expired)
couponSchema.virtual('isCurrentlyActive').get(function() {
    const now = new Date();
    return this.isActive &&
           this.validFrom <= now &&
           this.validUntil >= now &&
           (this.usageLimit === null || this.timesUsed < this.usageLimit);
});

// Method to check if coupon is expired
couponSchema.methods.isExpired = function() {
    const now = new Date();
    return this.validUntil < now;
};

// Method to check if coupon usage limit is reached
couponSchema.methods.isUsageLimitReached = function() {
    return this.usageLimit !== null && this.timesUsed >= this.usageLimit;
};

couponSchema.pre('save', function(next) {
    if (this.validUntil && this.validFrom && this.validUntil <= this.validFrom) {
        next(new Error('validUntil must be after validFrom.'));
    }
    if (this.discountType === 'percentage' && (this.discountValue <= 0 || this.discountValue > 100)) {
        next(new Error('Percentage discount value must be between 1 and 100.'));
    }
    if (this.discountType === 'fixedAmount' && this.discountValue <= 0) {
        next(new Error('Fixed amount discount value must be greater than 0.'));
    }
    next();
});

export default mongoose.model('Coupon', couponSchema);