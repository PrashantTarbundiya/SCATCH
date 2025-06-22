import express from 'express';
const router = express.Router();
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
} from '../controllers/wishlistController.js'; // Added .js extension
import isLoggedIn from '../middleware/isLoggedin.js'; // Added .js extension

// All wishlist routes are protected
router.use(isLoggedIn);

router.route('/')
    .get(getWishlist)
    .post(addToWishlist);

router.route('/:productId')
    .delete(removeFromWishlist);

export default router;