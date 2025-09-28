import Coupon from '../models/coupon-model.js';
import Owner from '../models/owner-model.js';
import { createCouponAlert } from './notificationController.js';

export const createCoupon = async (req, res) => {
    try {
      const ownerId = req.owner._id; 
      const {
        code,
        discountType,
            discountValue,
            description,
            validFrom,
            validUntil,
            minPurchaseAmount,
            usageLimit
        } = req.body;

        if (!code || !discountType || !discountValue || !validUntil) {
            return res.status(400).json({
                success: false,
                message: "Code, discount type, discount value, and valid until date are required."
            });
        }

        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: `Coupon code '${code.toUpperCase()}' already exists.`
            });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            description,
            validFrom,
            validUntil,
            minPurchaseAmount,
            usageLimit,
            createdBy: ownerId,
        });

        // Send coupon notification to all users
        try {
            await createCouponAlert({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                validUntil: coupon.validUntil
            });
        } catch (notificationError) {
            console.error('Failed to send coupon notifications:', notificationError);
        }

        res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            data: coupon,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create coupon.",
            error: error.message,
        });
    }
};

export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate('createdBy', 'fullname email');
        
        // Add computed status fields to each coupon
        const couponsWithStatus = coupons.map(coupon => {
            const couponObj = coupon.toObject();
            return {
                ...couponObj,
                isExpired: coupon.isExpired(),
                isUsageLimitReached: coupon.isUsageLimitReached(),
                isCurrentlyActive: coupon.isCurrentlyActive
            };
        });
        
        res.status(200).json({
            success: true,
            count: couponsWithStatus.length,
            data: couponsWithStatus,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch coupons.",
            error: error.message,
        });
    }
};


export const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id).populate('createdBy', 'fullname email');
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found.",
            });
        }
        res.status(200).json({
            success: true,
            data: coupon,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch coupon.",
            error: error.message,
        });
    }
};


export const updateCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const updates = req.body;

        
        if (updates.code) {
            updates.code = updates.code.toUpperCase();
            const existingCoupon = await Coupon.findOne({ code: updates.code, _id: { $ne: couponId } });
            if (existingCoupon) {
                return res.status(400).json({
                    success: false,
                    message: `Coupon code '${updates.code}' already exists.`
                });
            }
        }
        
        const coupon = await Coupon.findByIdAndUpdate(couponId, updates, {
            new: true,
            runValidators: true,
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found.",
            });
        }
        res.status(200).json({
            success: true,
            message: "Coupon updated successfully.",
            data: coupon,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update coupon.",
            error: error.message,
        });
    }
};


export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found.",
            });
        }
        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete coupon.",
            error: error.message,
        });
    }
};


export const validateCoupon = async (req, res) => {
    try {
        const { code, purchaseAmount } = req.body;
        
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, message: "Valid coupon code is required." });
        }

        if (purchaseAmount !== undefined && (isNaN(purchaseAmount) || purchaseAmount < 0)) {
            return res.status(400).json({ success: false, message: "Purchase amount must be a valid positive number." });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid coupon code." });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: "This coupon is no longer active." });
        }

        const now = new Date();
        if (coupon.validFrom > now) {
            return res.status(400).json({ success: false, message: "This coupon is not yet valid." });
        }
        
        if (coupon.validUntil < now) {
            return res.status(400).json({ success: false, message: "This coupon has expired." });
        }

        if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: "This coupon has reached its usage limit." });
        }

        const purchaseAmountValue = purchaseAmount || 0;
        if (purchaseAmountValue < coupon.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase amount of $${coupon.minPurchaseAmount} is required for this coupon.`
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Coupon is valid.",
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                description: coupon.description,
                minPurchaseAmount: coupon.minPurchaseAmount,
                usageLimit: coupon.usageLimit,
                timesUsed: coupon.timesUsed
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to validate coupon.",
            error: error.message,
        });
    }
};

