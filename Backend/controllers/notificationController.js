import Notification from '../models/notification-model.js';
import Product from '../models/product-model.js';
import PriceHistory from '../models/price-history-model.js';
import User from '../models/users-model.js';
import Wishlist from '../models/wishlist-model.js';

// Get user notifications
export const getUserNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const notifications = await Notification.find({ user: req.user._id })
            .populate('product', 'name image price discount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const total = await Notification.countDocuments({ user: req.user._id });
        const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
        
        res.json({ 
            success: true, 
            notifications,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total
            },
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create stock alert notification
export const createStockAlert = async (productId, message, priority = 'medium') => {
    try {
        const product = await Product.findById(productId);
        if (!product) return;

        // Find users who have this product in wishlist
        const wishlists = await Wishlist.find({ products: productId }).populate('user');
        
        const title = product.quantity === 0 ? 'Out of Stock' : 
                     product.quantity <= 5 ? 'Low Stock Alert' : 'Back in Stock';
        
        for (const wishlist of wishlists) {
            await Notification.create({
                user: wishlist.user._id,
                type: 'stock_alert',
                title,
                message: `${product.name} - ${message}`,
                product: productId,
                priority,
                actionUrl: `/product/${productId}`,
                data: { stockLevel: product.quantity }
            });
        }
    } catch (error) {
        console.error('Stock alert error:', error);
    }
};

// Create price drop notification
export const createPriceDropAlert = async (productId, oldPrice, newPrice) => {
    try {
        const changePercentage = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1);
        
        // Save price history
        await PriceHistory.create({
            product: productId,
            oldPrice,
            newPrice,
            changePercentage
        });

        // Find users who have this product in wishlist
        const wishlists = await Wishlist.find({ products: productId }).populate('user');
        const product = await Product.findById(productId);
        
        for (const wishlist of wishlists) {
            await Notification.create({
                user: wishlist.user._id,
                type: 'price_drop',
                title: 'Price Drop Alert!',
                message: `${product?.name || 'Product'} price dropped by ${changePercentage}% - Save ₹${(oldPrice - newPrice).toFixed(2)}!`,
                product: productId,
                priority: 'high',
                actionUrl: `/product/${productId}`,
                data: { 
                    oldPrice, 
                    newPrice, 
                    changePercentage: parseFloat(changePercentage)
                }
            });
        }
    } catch (error) {
        console.error('Price drop alert error:', error);
    }
};

// Create coupon notification
export const createCouponAlert = async (couponData, userIds = null) => {
    try {
        const targetUsers = userIds || await User.find({}).select('_id');
        
        for (const userId of targetUsers) {
            await Notification.create({
                user: userId._id || userId,
                type: 'coupon_alert',
                title: 'New Coupon Available!',
                message: `Use code ${couponData.code} and get ${couponData.discountType === 'percentage' ? couponData.discountValue + '%' : '₹' + couponData.discountValue} off!`,
                priority: 'high',
                actionUrl: '/shop',
                data: {
                    couponCode: couponData.code,
                    discountValue: couponData.discountValue,
                    discountType: couponData.discountType,
                    validUntil: couponData.validUntil
                }
            });
        }
    } catch (error) {
        console.error('Coupon alert error:', error);
    }
};

// Create seasonal event notification
export const createSeasonalEvent = async (req, res) => {
    try {
        const { title, message, eventCode, userIds, couponCode, eventEndDate, isActive = true } = req.body;
        
        // Check if event is active
        if (!isActive) {
            return res.status(400).json({ success: false, message: 'Cannot send notification for inactive event' });
        }
        
        // Check if event has ended
        if (eventEndDate && new Date(eventEndDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Cannot send notification for expired event' });
        }
        
        const targetUsers = userIds || await User.find({}).select('_id');
        
        for (const userId of targetUsers) {
            await Notification.create({
                user: userId._id || userId,
                type: 'seasonal_event',
                title,
                message,
                priority: 'high',
                actionUrl: '/shop',
                data: { 
                    eventCode,
                    couponCode,
                    eventEndDate,
                    isActive
                }
            });
        }
        
        res.json({ success: true, message: 'Seasonal event notifications sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true }
        );
        
        res.json({ 
            success: true, 
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({ user: req.user._id });
        
        res.json({ 
            success: true, 
            message: `${result.deletedCount} notifications cleared`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};