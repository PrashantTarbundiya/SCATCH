import productModel from '../models/product-model.js';
import orderModel from '../models/order-model.js';
import wishlistModel from '../models/wishlist-model.js';
import mongoose from 'mongoose';

export const getPersonalizedProducts = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 12 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        let scoredProducts = [];

        if (userId) {
            // Get user's purchase history
            const userOrders = await orderModel.find({ 
                user: userId,
                paymentStatus: 'paid'
            }).populate('items.product');

            // Get user's wishlist
            const userWishlist = await wishlistModel.find({ user: userId })
                .populate('product');

            // Extract categories from purchases and wishlist
            const purchasedCategories = new Set();
            const purchasedProducts = new Set();
            
            userOrders.forEach(order => {
                order.items.forEach(item => {
                    if (item.product && item.product.category) {
                        purchasedCategories.add(item.product.category.toString());
                        purchasedProducts.add(item.product._id.toString());
                    }
                });
            });

            const wishlistCategories = new Set();
            const wishlistProducts = new Set();
            
            userWishlist.forEach(item => {
                if (item.product && item.product.category) {
                    wishlistCategories.add(item.product.category.toString());
                    wishlistProducts.add(item.product._id.toString());
                }
            });

            // Get all available products
            const allProducts = await productModel.find({ 
                quantity: { $gt: 0 }
            }).populate('category');

            // Score each product
            scoredProducts = allProducts.map(product => {
                let score = 0;
                const productId = product._id.toString();
                const categoryId = product.category?._id.toString();

                // Skip already purchased products
                if (purchasedProducts.has(productId)) {
                    return null;
                }

                // 1. Wishlist category match (40 points)
                if (categoryId && wishlistCategories.has(categoryId)) {
                    score += 40;
                }

                // 2. Purchase history category match (35 points)
                if (categoryId && purchasedCategories.has(categoryId)) {
                    score += 35;
                }

                // 3. Product in wishlist (50 points - highest priority)
                if (wishlistProducts.has(productId)) {
                    score += 50;
                }

                // 4. Popularity/Trending (15 points)
                const popularityScore = Math.min(product.purchaseCount / 20, 1);
                score += 15 * popularityScore;

                // 5. High rating (10 points)
                const rating = product.averageRating || 0;
                if (rating >= 4) {
                    score += 10 * (rating / 5);
                }

                // 6. Discount bonus (5 points)
                if (product.discount > 0) {
                    score += 5 * Math.min(product.discount / product.price, 0.5);
                }

                // 7. Recency bonus (5 points)
                const daysSinceCreation = (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
                if (daysSinceCreation <= 30) {
                    score += 5 * (1 - daysSinceCreation / 30);
                }

                return { product, score };
            }).filter(item => item !== null);

        } else {
            // For non-logged-in users, show trending products
            const trendingProducts = await productModel.find({ 
                quantity: { $gt: 0 }
            }).populate('category');

            scoredProducts = trendingProducts.map(product => {
                let score = 0;

                // 1. Popularity (40 points)
                score += 40 * Math.min(product.purchaseCount / 20, 1);

                // 2. High rating (30 points)
                const rating = product.averageRating || 0;
                if (rating >= 4) {
                    score += 30 * (rating / 5);
                }

                // 3. Discount (15 points)
                if (product.discount > 0) {
                    score += 15 * Math.min(product.discount / product.price, 0.5);
                }

                // 4. Recency (15 points)
                const daysSinceCreation = (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
                if (daysSinceCreation <= 30) {
                    score += 15 * (1 - daysSinceCreation / 30);
                }

                return { product, score };
            });
        }

        // Sort by score and paginate
        scoredProducts.sort((a, b) => b.score - a.score);
        
        const totalProducts = scoredProducts.length;
        const paginatedProducts = scoredProducts
            .slice(skip, skip + limitNum)
            .map(item => item.product);

        res.status(200).json({
            success: true,
            products: paginatedProducts,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalProducts / limitNum),
                totalProducts,
                productsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(totalProducts / limitNum),
                hasPrevPage: pageNum > 1
            }
        });

    } catch (err) {
        err.message = `Failed to get personalized products: ${err.message}`;
        next(err);
    }
};
