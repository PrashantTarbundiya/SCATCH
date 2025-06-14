import express from 'express';
const router = express.Router();
import isLoggedIn from '../middleware/isLoggedin.js'; // Assuming isLoggedin.js uses ES module exports
import * as orderController from '../controllers/orderController.js'; // Import all exports

// Route to create a Razorpay order ID
router.post('/create', isLoggedIn, orderController.createRazorpayOrder);

// Route to verify payment and place the order
router.post('/verify-payment', isLoggedIn, orderController.verifyPaymentAndPlaceOrder);

// You might want an endpoint to get a user's order history
router.get('/my-orders', isLoggedIn, orderController.getUserOrders);

export default router;