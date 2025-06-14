import express from 'express';
const router = express.Router();
import {
    sendRegistrationOtp,
    registerUser,
    loginUser,
    logout,
    getUserCart,
    updateUserProfilePhoto, // Import the new controller function
    updateUserProfile // Import the new controller function for general profile updates
} from '../controllers/authController.js';
import isLoggedIn from '../middleware/isLoggedin.js'; // Assuming this is your auth middleware
import { upload } from '../config/multer-config.js'; // Import multer upload middleware

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

// Route to update user's profile photo
router.post(
    '/profile/update-photo',
    isLoggedIn,
    upload.single('profilePhoto'), // 'profilePhoto' should match the FormData key from frontend
    updateUserProfilePhoto
);

// Route to update user's general profile information (fullname, phone, address)
router.put('/profile/update', isLoggedIn, updateUserProfile);

export default router;