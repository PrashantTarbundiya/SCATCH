import express from 'express';
const router = express.Router();
import couponController from '../controllers/couponController.js';
import isOwner from '../middleware/isOwner.js';
import isLoggedin from '../middleware/isLoggedin.js';

// Owner-only routes (create, update, delete coupons)
router.post('/', isOwner, couponController.createCoupon);
router.get('/', isOwner, couponController.getAllCoupons);
router.get('/:id', isOwner, couponController.getCouponById);
router.put('/:id', isOwner, couponController.updateCoupon);
router.delete('/:id', isOwner, couponController.deleteCoupon);
router.post('/:couponId/notify', isOwner, couponController.sendCouponNotification);

// User routes (validate and apply coupons)
router.post('/validate', isLoggedin, couponController.validateCoupon);
router.post('/apply', isLoggedin, couponController.applyCoupon);

export default router;
