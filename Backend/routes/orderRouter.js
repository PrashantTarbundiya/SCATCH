import express from 'express';
const router = express.Router();
import isLoggedIn from '../middleware/isLoggedin.js'; // Assuming isLoggedin.js uses ES module exports
import isOwner from '../middleware/isOwner.js'; // Import isOwner middleware
import * as orderController from '../controllers/orderController.js'; // Import all exports

// Route to create a Razorpay order ID
router.post('/create', isLoggedIn, orderController.createRazorpayOrder);

// Route to verify payment and place the order
router.post('/verify-payment', isLoggedIn, orderController.verifyPaymentAndPlaceOrder);

// You might want an endpoint to get a user's order history
router.get('/my-orders', isLoggedIn, orderController.getUserOrders);

// Route to check if the current user has purchased a specific product
router.get('/has-purchased/:productId', isLoggedIn, orderController.checkIfUserPurchasedProduct);

// Route for admin to get all orders
router.get('/admin/all-orders', isOwner, orderController.getAllOrdersForAdmin); // Removed isLoggedIn

// Admin route to update order status
router.put('/admin/:orderId/status', isOwner, orderController.updateOrderStatus);

export default router;