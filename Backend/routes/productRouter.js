import express from 'express';
const router = express.Router();
import { upload } from '../config/multer-config.js';
import productModel from '../models/product-model.js';
import categoryModel from '../models/category-model.js';
import isOwner from '../middleware/isOwner.js';
import isLoggedin from '../middleware/isLoggedin.js';
import { rateProduct, updateReview, deleteReview, getRecommendedProducts } from '../controllers/productController.js';
import { getPersonalizedProducts } from '../controllers/recommendationController.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

router.post('/create', isOwner, upload.single("image"), async (req, res, next) => { // Added isOwner
    try {
        const { name, price, discount, quantity, category } = req.body; // Added quantity and category

        if (!quantity || isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) < 0) {
            const err = new Error("Valid quantity is required.");
            err.status = 400;
            return next(err);
        }

        // Validate category if provided
        if (category) {
            const categoryExists = await categoryModel.findById(category);
            if (!categoryExists) {
                const err = new Error("Invalid category ID. Category does not exist.");
                err.status = 400;
                return next(err);
            }
            if (!categoryExists.isActive) {
                const err = new Error("Cannot assign product to inactive category.");
                err.status = 400;
                return next(err);
            }
        }

        if (!req.file) {
            const err = new Error("Image is required");
            err.status = 400;
            return next(err); // Pass error to central handler
        }

        const localFilePath = req.file.path;
        const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

        if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
            // fs.unlinkSync(localFilePath); // Already handled in uploadOnCloudinary
            const err = new Error("Failed to upload image to Cloudinary");
            err.status = 500;
            return next(err);
        }

        const product = await productModel.create(({
            image: cloudinaryResponse.secure_url, // Store Cloudinary URL
            name,
            price,
            discount,
            quantity: parseInt(quantity, 10),
            category: category || null // Store category ObjectId or null
        }));
        
        // Populate category details for response
        await product.populate('category', 'name slug');
        
        res.status(201).json({ success: "Product created successfully", product });
    } catch (err) {
        // If req.file.path exists, it means multer saved it but something else failed.
        // The unlink is handled in uploadOnCloudinary's catch or finally block.
        err.message = `Product creation failed: ${err.message}`; // Add context to error
        next(err); // Pass error to central handler
    }
});

// Route to get personalized/recommended products
router.get('/personalized', getPersonalizedProducts);

// Route to get all products (with filtering, sorting, and pagination)
router.get('/', async (req, res, next) => {
    try {
        let query = {};
        let sortOptions = {};

        const { sortBy, filter, discounted, page = 1, limit = 12 } = req.query;

        // Pagination parameters
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 items per page
        const skip = (pageNum - 1) * limitNum;

        // Filtering
        if (filter === 'discounted' || discounted === 'true') {
            query.discount = { $gt: 0 };
        }
        if (filter === 'availability') {
            query.quantity = { $gt: 0 };
        }
        if (filter === 'newCollection' || filter === 'new') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.createdAt = { $gte: thirtyDaysAgo };
        }

        // Sorting
        if (sortBy === 'popular') {
            sortOptions.purchaseCount = -1;
        } else if (sortBy === 'price_asc') {
            sortOptions.price = 1;
        } else if (sortBy === 'price_desc') {
            sortOptions.price = -1;
        } else if (sortBy === 'rating') {
            sortOptions.purchaseCount = -1; // Fallback, will sort by rating after
        } else if (sortBy === 'newest' || filter === 'newCollection') {
            sortOptions.createdAt = -1;
        } else {
            sortOptions.createdAt = -1;
        }

        // Get total count for pagination
        const totalProducts = await productModel.countDocuments(query);

        let products = await productModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .populate('category', 'name slug')
            .populate({
                path: 'ratings.user',
                select: 'username fullname'
            });
        
        // Sort by rating if requested (post-query since averageRating is virtual)
        if (sortBy === 'rating') {
            products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }
        
        res.status(200).json({
            success: true,
            products,
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
        err.message = `Failed to fetch products: ${err.message}`;
        next(err);
    }
});

// Route to delete all products
router.delete('/all', isOwner, async (req, res, next) => { // Added isOwner
    try {
        const result = await productModel.deleteMany({}); // Deletes all documents in the collection
        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} products.`
        });
    } catch (err) {
        err.message = `Failed to delete all products: ${err.message}`;
        next(err);
    }
});

// Route to search and filter products (MUST BE BEFORE /:id route)
router.get('/search', async (req, res, next) => {
    try {
        const { query, minPrice, maxPrice, category, minRating, sortBy } = req.query;
        
        let searchQuery = {};
        
        // Text search by name
        if (query && query.trim()) {
            searchQuery.name = { $regex: query.trim(), $options: 'i' };
        }
        
        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            searchQuery.price = {};
            if (minPrice !== undefined) searchQuery.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) searchQuery.price.$lte = parseFloat(maxPrice);
        }
        
        // Category filter - now using ObjectId reference
        if (category && category.trim()) {
            // Find category by slug
            const categoryDoc = await categoryModel.findOne({
                slug: category.trim().toLowerCase(),
                isActive: true
            });
            if (categoryDoc) {
                searchQuery.category = categoryDoc._id;
            } else {
                // If category not found, return empty results
                return res.status(200).json({
                    success: true,
                    count: 0,
                    products: [],
                    message: 'No products found for this category'
                });
            }
        }
        
        // Rating filter
        if (minRating !== undefined) {
            const minRatingNum = parseFloat(minRating);
            if (!isNaN(minRatingNum) && minRatingNum >= 0 && minRatingNum <= 5) {
                // We'll filter by averageRating after fetching
                // For now, just note it for post-processing
            }
        }
        
        // Sort options
        let sortOptions = {};
        if (sortBy === 'price_asc') {
            sortOptions.price = 1;
        } else if (sortBy === 'price_desc') {
            sortOptions.price = -1;
        } else if (sortBy === 'popular') {
            sortOptions.purchaseCount = -1;
        } else if (sortBy === 'rating') {
            // Will sort by averageRating after processing
        } else {
            sortOptions.createdAt = -1; // Default newest
        }
        
        let products = await productModel.find(searchQuery)
            .sort(sortOptions)
            .populate('category', 'name slug')
            .populate({
                path: 'ratings.user',
                select: 'username fullname'
            });
        
        // Filter by rating if specified (post-query filtering since averageRating is virtual)
        if (minRating !== undefined) {
            const minRatingNum = parseFloat(minRating);
            if (!isNaN(minRatingNum)) {
                products = products.filter(product => {
                    const avgRating = product.averageRating || 0;
                    return avgRating >= minRatingNum;
                });
            }
        }
        
        // Sort by rating if requested (post-query since it's virtual)
        if (sortBy === 'rating') {
            products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }
        
        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (err) {
        err.message = `Failed to search products: ${err.message}`;
        next(err);
    }
});

// Route to get a single product by ID
router.get('/:id', async (req, res, next) => { // Added next
    try {
        const product = await productModel.findById(req.params.id)
            .populate('category', 'name slug')
            .populate({
                path: 'ratings.user',
                select: 'username fullname email'
            });

        if (!product) {
            const err = new Error("Product not found");
            err.status = 404;
            return next(err);
        }
        res.status(200).json({ success: true, product });
    } catch (err) {
        err.message = `Failed to fetch product with ID ${req.params.id}: ${err.message}`;
        next(err);
    }
});

// Route to update a product by ID
router.put('/:id', isOwner, upload.single("image"), async (req, res, next) => { // Added isOwner
    try {
        const { name, price, discount, quantity, category } = req.body; // Added quantity and category
        
        // Get current product for comparison
        const currentProduct = await productModel.findById(req.params.id);
        if (!currentProduct) {
            const err = new Error("Product not found for update");
            err.status = 404;
            return next(err);
        }
        
        // Validate category if provided
        if (category) {
            const categoryExists = await categoryModel.findById(category);
            if (!categoryExists) {
                const err = new Error("Invalid category ID. Category does not exist.");
                err.status = 400;
                return next(err);
            }
            if (!categoryExists.isActive) {
                const err = new Error("Cannot assign product to inactive category.");
                err.status = 400;
                return next(err);
            }
        }
        
        let updateData = { name, price, discount, category };
        const oldPrice = currentProduct.price;
        const oldQuantity = currentProduct.quantity;

        if (quantity !== undefined && !isNaN(parseInt(quantity, 10)) && parseInt(quantity, 10) >= 0) {
            updateData.quantity = parseInt(quantity, 10);
        }

        if (req.file) {
            const localFilePath = req.file.path;
            const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

            if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
                const err = new Error("Failed to upload image to Cloudinary for update");
                err.status = 500;
                return next(err);
            }
            updateData.image = cloudinaryResponse.secure_url;
        }

        const product = await productModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('category', 'name slug');
        
        // Import notification functions dynamically to avoid circular imports
        const { createPriceDropAlert, createStockAlert } = await import('../controllers/notificationController.js');
        
        // Check for price drop (>5% decrease)
        if (price && oldPrice && price < oldPrice) {
            const dropPercentage = ((oldPrice - price) / oldPrice) * 100;
            if (dropPercentage >= 5) {
                await createPriceDropAlert(req.params.id, oldPrice, price);
            }
        }
        
        // Check for stock alerts
        if (updateData.quantity !== undefined) {
            const newQuantity = updateData.quantity;
            if (oldQuantity === 0 && newQuantity > 0) {
                await createStockAlert(req.params.id, 'Item is back in stock!', 'high');
            } else if (newQuantity <= 5 && newQuantity > 0) {
                await createStockAlert(req.params.id, `Only ${newQuantity} items left in stock!`, 'medium');
            } else if (newQuantity === 0) {
                await createStockAlert(req.params.id, 'Item is now out of stock', 'low');
            }
        }

        res.status(200).json({ success: "Product updated successfully", product });
    } catch (err) {
        err.message = `Product update failed for ID ${req.params.id}: ${err.message}`;
        next(err);
    }
});

// Route to delete a single product by ID
router.delete('/:id', isOwner, async (req, res, next) => { // Added isOwner
    try {
        const product = await productModel.findByIdAndDelete(req.params.id);
        if (!product) {
            const err = new Error("Product not found for deletion");
            err.status = 404;
            return next(err);
        }
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        err.message = `Product deletion failed for ID ${req.params.id}: ${err.message}`;
        next(err);
    }
});

// Route to add or update a product rating/review (handles both create and update of user's own review)
router.post('/:productId/rate', isLoggedin, upload.array('reviewImages', 5), rateProduct); // Changed to upload.array

// Route to specifically update a review (text, rating, image)
router.put('/:productId/reviews/:reviewId', isLoggedin, upload.array('reviewImages', 5), updateReview); // Changed to upload.array

// Route to delete a review
router.delete('/:productId/reviews/:reviewId', isLoggedin, deleteReview);

// Route to get recommended products
router.get('/:productId/recommendations', getRecommendedProducts);

// TEMPORARY ROUTE: Update existing products with default quantity and purchaseCount
router.post('/temp/update-all-quantities', isOwner, async (req, res, next) => {
    try {
        const result = await productModel.updateMany(
            {}, // An empty filter object to match all documents
            {
                $set: {
                    quantity: 20,
                    purchaseCount: 0
                }
            }
        );
        res.status(200).json({
            success: true,
            message: `Updated ${result.matchedCount} products. ${result.modifiedCount} products were modified.`,
            result
        });
    } catch (err) {
        err.message = `Failed to update product quantities: ${err.message}`;
        next(err);
    }
});

export default router;