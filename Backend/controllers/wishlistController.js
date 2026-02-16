import Wishlist from '../models/wishlist-model.js';
import Product from '../models/product-model.js';
import asyncHandler from 'express-async-handler';

const getWishlist = asyncHandler(async (req, res) => {
    const wishlistItems = await Wishlist.find({ user: req.user._id }).populate({
        path: 'product',
        model: 'product',
        select: 'name price image stock category discount bgcolor panelcolor textcolor'
    });

    res.status(200).json({ success: true, wishlist: wishlistItems });
});


const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        res.status(400);
        throw new Error('Product ID is required');
    }

    // Check if product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Check if item already in wishlist
    const wishlistItemExists = await Wishlist.findOne({ user: req.user._id, product: productId });

    if (wishlistItemExists) {
        res.status(200).json({ success: true, message: 'Product already in wishlist', wishlistItem: wishlistItemExists });
        return;
    }

    const wishlistItem = await Wishlist.create({
        user: req.user._id,
        product: productId,
    });

    if (wishlistItem) {
        const populatedItem = await wishlistItem.populate({
            path: 'product',
            model: 'product',
            select: 'name price image stock category discount bgcolor panelcolor textcolor'
        });
        res.status(201).json({ success: true, message: 'Product added to wishlist', wishlistItem: populatedItem });
    } else {
        res.status(400);
        throw new Error('Invalid wishlist item data');
    }
});


const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });

    if (wishlistItem) {
        res.status(200).json({ success: true, message: 'Product removed from wishlist', productId });
    } else {
        res.status(404);
        throw new Error('Product not found in wishlist');
    }
});

export {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};