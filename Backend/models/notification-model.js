import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    type: {
        type: String,
        enum: ['stock_alert', 'price_drop', 'wishlist_update', 'order_status', 'seasonal_event'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    data: {
        oldPrice: Number,
        newPrice: Number,
        stockLevel: Number,
        eventCode: String
    }
}, { timestamps: true });

export default mongoose.model("notification", notificationSchema);