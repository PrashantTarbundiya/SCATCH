import express from 'express';
const router = express.Router();
import Product from '../models/product-model.js';
import isLoggedIn from '../middleware/isLoggedin.js';

// Check stock availability for cart items
router.post('/check-stock', isLoggedIn, async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items provided for stock check'
            });
        }

        const outOfStock = [];
        const insufficientStock = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
                outOfStock.push({ 
                    productId: item.productId, 
                    name: 'Unknown Product' 
                });
                continue;
            }

            if (product.quantity === 0) {
                outOfStock.push({
                    productId: item.productId,
                    name: product.name
                });
            } else if (product.quantity < item.quantity) {
                insufficientStock.push({
                    productId: item.productId,
                    name: product.name,
                    requested: item.quantity,
                    available: product.quantity
                });
            }
        }

        if (outOfStock.length > 0 || insufficientStock.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock validation failed',
                outOfStock,
                insufficientStock
            });
        }

        res.json({
            success: true,
            message: 'All items are in stock'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Stock check failed',
            error: error.message
        });
    }
});

export default router;