import express from 'express';
import { getUserNotifications, markAsRead, markAllAsRead, clearAllNotifications, createCouponAlert } from '../controllers/notificationController.js';
import isLoggedin from '../middleware/isLoggedin.js';
import isOwner from '../middleware/isOwner.js';

const router = express.Router();

router.get('/', isLoggedin, getUserNotifications);
router.patch('/:id/read', isLoggedin, markAsRead);
router.patch('/mark-all-read', isLoggedin, markAllAsRead);
router.delete('/clear-all', isLoggedin, clearAllNotifications);
router.post('/coupon-alert', isOwner, async (req, res) => {
    try {
        await createCouponAlert(req.body.couponData, req.body.userIds);
        res.json({ success: true, message: 'Coupon notifications sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;