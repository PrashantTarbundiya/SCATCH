import express from 'express';
const router = express.Router();
import { sendRegistrationOtp, registerUser, loginUser, logout, getUserCart } from '../controllers/authController.js'; // Added sendRegistrationOtp
import isLoggedIn from '../middleware/isLoggedin.js'; // Assuming this is your auth middleware

router.get('/', (req, res) => {
    res.send("hey");
});

router.post('/send-otp', sendRegistrationOtp); // New route for sending OTP
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logout);

// Route to get user's cart
// isLoggedIn middleware will protect this route and add req.user
router.get('/cart', isLoggedIn, getUserCart);

export default router;