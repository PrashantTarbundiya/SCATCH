import express from 'express';
const router = express.Router();
import {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} from '../controllers/couponController.js';
import isOwner from '../middleware/isOwner.js'; 
import isLoggedIn from '../middleware/isLoggedin.js'; 


router.post('/', isOwner, createCoupon); // Create a new coupon
router.get('/', isOwner, getAllCoupons); // Get all coupons
router.get('/:id', isOwner, getCouponById); // Get a single coupon by ID
router.put('/:id', isOwner, updateCoupon); // Update a coupon
router.delete('/:id', isOwner, deleteCoupon); // Delete a coupon

router.post('/validate', isLoggedIn, validateCoupon); 

export default router;
