import express from 'express';
const router = express.Router();
import { upload } from '../config/multer-config.js'; // Assuming multer-config exports 'upload'
import productModel from '../models/product-model.js';
import isOwner from '../middleware/isOwner.js'; // Import isOwner middleware
import { uploadOnCloudinary } from '../utils/cloudinary.js';

router.post('/create', isOwner, upload.single("image"), async (req, res, next) => { // Added isOwner
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

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
            name, price, discount, bgcolor, panelcolor, textcolor
        }));
        res.status(201).json({ success: "Product created successfully", product });
    } catch (err) {
        // If req.file.path exists, it means multer saved it but something else failed.
        // The unlink is handled in uploadOnCloudinary's catch or finally block.
        err.message = `Product creation failed: ${err.message}`; // Add context to error
        next(err); // Pass error to central handler
    }
});

// Route to get all products
router.get('/', async (req, res, next) => { // Added next
    try {
        const products = await productModel.find();
        res.status(200).json({ success: true, products });
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

// Route to get a single product by ID
router.get('/:id', async (req, res, next) => { // Added next
    try {
        const product = await productModel.findById(req.params.id);
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
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        let updateData = { name, price, discount, bgcolor, panelcolor, textcolor };

        if (req.file) {
            const localFilePath = req.file.path;
            const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

            if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
                // fs.unlinkSync(localFilePath); // Already handled in uploadOnCloudinary
                const err = new Error("Failed to upload image to Cloudinary for update");
                err.status = 500;
                return next(err);
            }
            updateData.image = cloudinaryResponse.secure_url; // Store Cloudinary URL
            // TODO: Optionally, delete the old image from Cloudinary if it exists
        }

        const product = await productModel.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!product) {
            const err = new Error("Product not found for update");
            err.status = 404;
            return next(err);
        }
        res.status(200).json({ success: "Product updated successfully", product });
    } catch (err) {
        // If req.file.path exists, it means multer saved it but something else failed.
        // The unlink is handled in uploadOnCloudinary's catch or finally block.
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

export default router;