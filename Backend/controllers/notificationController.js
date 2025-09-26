import Notification from '../models/notification-model.js';
import Product from '../models/product-model.js';
import PriceHistory from '../models/price-history-model.js';
import User from '../models/users-model.js';
import Wishlist from '../models/wishlist-model.js';

// Get user notifications
export const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate('product', 'name image price')
            .sort({ createdAt: -1 })
            .limit(20);
        
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
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
        
        for (const wishlist of wishlists) {
            await Notification.create({
                user: wishlist.user._id,
                type: 'stock_alert',
                title: 'Stock Alert',
                message,
                product: productId,
                priority,
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
        
        for (const wishlist of wishlists) {
            await Notification.create({
                user: wishlist.user._id,
                type: 'price_drop',
                title: 'Price Drop Alert!',
                message: `Price dropped by ${changePercentage}%`,
                product: productId,
                priority: 'high',
                data: { oldPrice, newPrice }
            });
        }
    } catch (error) {
        console.error('Price drop alert error:', error);
    }
};

// Create seasonal event notification
export const createSeasonalEvent = async (req, res) => {
    try {
        const { title, message, eventCode, userIds } = req.body;
        
        const targetUsers = userIds || await User.find({}).select('_id');
        
        for (const userId of targetUsers) {
            await Notification.create({
                user: userId._id || userId,
                type: 'seasonal_event',
                title,
                message,
                priority: 'high',
                data: { eventCode }
            });
        }
        
        res.json({ success: true, message: 'Seasonal event notifications sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};