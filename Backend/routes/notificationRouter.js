import express from 'express';
import { getUserNotifications, markAsRead, createSeasonalEvent, markAllAsRead, clearAllNotifications } from '../controllers/notificationController.js';
import isLoggedin from '../middleware/isLoggedin.js';
import isOwner from '../middleware/isOwner.js';

const router = express.Router();

router.get('/', isLoggedin, getUserNotifications);
router.patch('/:id/read', isLoggedin, markAsRead);
router.patch('/mark-all-read', isLoggedin, markAllAsRead);
router.delete('/clear-all', isLoggedin, clearAllNotifications);
router.post('/seasonal-event', isOwner, createSeasonalEvent);

export default router;