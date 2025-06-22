import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming your user model is named 'User'
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Assuming your product model is named 'Product'
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure a user cannot add the same product to their wishlist multiple times
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);