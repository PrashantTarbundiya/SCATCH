import Wishlist from '../models/wishlist-model.js'; // Added .js extension
import Product from '../models/product-model.js'; // To populate product details, added .js extension
import asyncHandler from 'express-async-handler'; // For cleaner async error handling

const getWishlist = asyncHandler(async (req, res) => {
    const wishlistItems = await Wishlist.find({ user: req.user._id }).populate({
        path: 'product',
        model: 'product', // Corrected to lowercase 'product'
        select: 'name price image stock category discount bgcolor panelcolor textcolor' // Added color fields
    });

    if (wishlistItems) {
        res.status(200).json(wishlistItems);
    } else {
        res.status(404);
        throw new Error('Wishlist not found');
    }
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
        res.status(400);
        // throw new Error('Product already in wishlist'); // Or just return success
        res.status(200).json({ message: 'Product already in wishlist', item: wishlistItemExists });
        return;
    }

    const wishlistItem = await Wishlist.create({
        user: req.user._id,
        product: productId,
    });

    if (wishlistItem) {
        const populatedItem = await wishlistItem.populate({
            path: 'product',
            model: 'product', // Corrected to lowercase 'product'
            select: 'name price image stock category discount bgcolor panelcolor textcolor' // Added color fields
        });
        res.status(201).json(populatedItem);
    } else {
        res.status(400);
        throw new Error('Invalid wishlist item data');
    }
});


const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });

    if (wishlistItem) {
        res.status(200).json({ message: 'Product removed from wishlist', productId });
    } else {
        res.status(404);
        throw new Error('Product not found in wishlist');
    }
});

export { // Changed to named export for ES Modules
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};