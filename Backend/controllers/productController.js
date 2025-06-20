import productModel from '../models/product-model.js';
import orderModel from '../models/order-model.js'; // To verify purchase
import mongoose from 'mongoose';
import { uploadOnCloudinary } from '../utils/cloudinary.js'; // For review image uploads
import fs from 'fs'; // For cleaning up local file after upload

export const rateProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const rawRating = req.body.rating;
        const reviewText = req.body.reviewText;
        const userId = req.user._id;
        let reviewImageUrls = []; // Initialize as an array for multiple URLs

        const rating = parseInt(rawRating, 10);

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const localFilePath = file.path;
                try {
                    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
                    if (cloudinaryResponse && cloudinaryResponse.secure_url) {
                        reviewImageUrls.push(cloudinaryResponse.secure_url);
                    } else {
                        console.warn(`Failed to upload a review image to Cloudinary: ${file.originalname}`);
                        // Optionally, decide if a partial failure should stop the whole process
                    }
                } catch (uploadError) {
                    console.error(`Error uploading review image ${file.originalname} to Cloudinary:`, uploadError);
                    // Decide how to handle individual file upload errors
                }
            }
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const err = new Error("Invalid product ID format.");
            err.status = 400;
            return next(err);
        }

        if (isNaN(rating) || rating < 1 || rating > 5) { // Validate parsed number
            const err = new Error("Rating must be a number between 1 and 5.");
            err.status = 400;
            return next(err);
        }

        // 1. Check if the user has purchased this product
        const orders = await orderModel.find({ 
            user: userId, 
            'items.product': productId,
            // Optionally, you might want to check for a specific order status, e.g., 'Delivered'
            // status: 'Delivered' 
        });

        if (orders.length === 0) {
            const err = new Error("You can only rate products you have purchased.");
            err.status = 403; // Forbidden
            return next(err);
        }

        const product = await productModel.findById(productId);
        if (!product) {
            const err = new Error("Product not found.");
            err.status = 404;
            return next(err);
        }

        // Check if the user has already rated this product
        const existingRatingIndex = product.ratings.findIndex(r => r.user.equals(userId));

        if (existingRatingIndex > -1) {
            // Update existing rating
            product.ratings[existingRatingIndex].rating = rating;
            product.ratings[existingRatingIndex].reviewText = reviewText || "";
            product.ratings[existingRatingIndex].createdAt = Date.now();
            // Handle multiple images: append new, or replace existing if logic dictates
            // For simplicity, this example replaces existing images if new ones are uploaded.
            // A more complex logic might involve merging, deleting specific old ones, etc.
            if (reviewImageUrls.length > 0) {
                 // TODO: Optionally delete ALL old images from Cloudinary associated with this review
                product.ratings[existingRatingIndex].reviewImage = reviewImageUrls;
            } else if (req.body.removeAllReviewImages === 'true') { // Example: if a form field indicates removal
                // TODO: Optionally delete ALL old images from Cloudinary
                product.ratings[existingRatingIndex].reviewImage = [];
            }
            // If no new images and no removal flag, existing images are kept.
        } else {
            // Add new rating
            product.ratings.push({
                user: userId,
                rating: rating,
                reviewText: reviewText || "",
                reviewImage: reviewImageUrls // Array of URLs
            });
        }

        await product.save();

        // Recalculate average rating (or rely on virtual if not sending back immediately)
        // For the response, let's send the updated product with its new average rating
        const updatedProduct = await productModel.findById(productId);


        res.status(200).json({ 
            success: "Product rated successfully.", 
            product: updatedProduct // Send back the product with the new averageRating
        });

    } catch (err) {
        err.message = `Failed to rate product: ${err.message}`;
        next(err);
    } finally {
        // Clean up all locally saved temporary files if they exist (from multer)
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (file && file.path) {
                    try {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (unlinkErr) {
                        console.error(`Error deleting temporary review image file ${file.path}:`, unlinkErr);
                    }
                }
            });
        }
    }
};

// Controller to update a specific review (rating, text, image)
export const updateReview = async (req, res, next) => {
    try {
        const { productId, reviewId } = req.params;
        const rawRating = req.body.rating;
        const reviewText = req.body.reviewText;
        const userId = req.user._id;
        let newImageUrls = [];
        let rating;

        if (rawRating !== undefined) {
            rating = parseInt(rawRating, 10);
        }

        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
            const err = new Error("Invalid Product or Review ID format.");
            err.status = 400;
            return next(err);
        }

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const localFilePath = file.path;
                try {
                    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
                    if (cloudinaryResponse && cloudinaryResponse.secure_url) {
                        newImageUrls.push(cloudinaryResponse.secure_url);
                    } else {
                         console.warn(`Failed to upload a review image to Cloudinary during update: ${file.originalname}`);
                    }
                } catch (uploadError) {
                     console.error(`Error uploading review image ${file.originalname} to Cloudinary during update:`, uploadError);
                }
            }
        }

        const product = await productModel.findById(productId);
        if (!product) {
            const err = new Error("Product not found.");
            err.status = 404;
            return next(err);
        }

        const reviewIndex = product.ratings.findIndex(r => r._id.equals(reviewId) && r.user.equals(userId));
        if (reviewIndex === -1) {
            const err = new Error("Review not found or you are not authorized to edit this review.");
            err.status = 404; // Or 403
            return next(err);
        }

        if (rating !== undefined) { // Only validate and update if rating was provided and parsed
            if (isNaN(rating) || rating < 1 || rating > 5) {
                const err = new Error("Rating must be a number between 1 and 5.");
                err.status = 400;
                return next(err);
            }
            product.ratings[reviewIndex].rating = rating;
        }
        if (reviewText !== undefined) {
            product.ratings[reviewIndex].reviewText = reviewText;
        }
        // Handle image updates for multiple images
        if (newImageUrls.length > 0) {
            // This example replaces all existing images with the new set.
            // TODO: Optionally delete old images from Cloudinary from product.ratings[reviewIndex].reviewImage array
            product.ratings[reviewIndex].reviewImage = newImageUrls;
        } else if (req.body.removeAllReviewImages === 'true') { // If a flag is sent to remove all images
            // TODO: Optionally delete all old images from Cloudinary
            product.ratings[reviewIndex].reviewImage = [];
        }
        // If no new images are uploaded and no removal flag, existing images are kept.

        product.ratings[reviewIndex].createdAt = Date.now(); // Update timestamp

        await product.save();
        const updatedProduct = await productModel.findById(productId); // Fetch again to populate virtuals

        res.status(200).json({
            success: "Review updated successfully.",
            product: updatedProduct
        });

    } catch (err) {
        err.message = `Failed to update review: ${err.message}`;
        next(err);
    } finally {
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (file && file.path) {
                    try {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (unlinkErr) {
                        console.error(`Error deleting temporary review image file ${file.path} during update:`, unlinkErr);
                    }
                }
            });
        }
    }
};


// Controller to delete a specific review
export const deleteReview = async (req, res, next) => {
    try {
        const { productId, reviewId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
            const err = new Error("Invalid Product or Review ID format.");
            err.status = 400;
            return next(err);
        }

        const product = await productModel.findById(productId);
        if (!product) {
            const err = new Error("Product not found.");
            err.status = 404;
            return next(err);
        }

        const reviewIndex = product.ratings.findIndex(r => r._id.equals(reviewId) && r.user.equals(userId));
        if (reviewIndex === -1) {
            const err = new Error("Review not found or you are not authorized to delete this review.");
            err.status = 404; // Or 403
            return next(err);
        }

        // TODO: Optionally delete ALL images from Cloudinary associated with product.ratings[reviewIndex].reviewImage array
        product.ratings.splice(reviewIndex, 1); // Remove the review

        await product.save();
        const updatedProduct = await productModel.findById(productId); // Fetch again to populate virtuals

        res.status(200).json({
            success: "Review deleted successfully.",
            product: updatedProduct
        });

    } catch (err) {
        err.message = `Failed to delete review: ${err.message}`;
        next(err);
    }
};
// Placeholder for other product-specific controller functions if needed in the future
// export const getProductReviews = async (req, res, next) => { ... };