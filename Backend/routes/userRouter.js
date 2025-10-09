import express from 'express';
const router = express.Router();
import {
    sendRegistrationOtp,
    registerUser,
    loginUser,
    logout,
    getCurrentUser,
    getUserCart,
    updateUserProfilePhoto,
    updateUserProfile,
    forgotPassword,
    verifyOtpAndResetPassword
} from '../controllers/authController.js';
import { googleAuth, googleCallback } from '../controllers/googleAuthController.js';
import isLoggedIn from '../middleware/isLoggedin.js';
import { upload } from '../config/multer-config.js';

router.get('/', (req, res) => {
    res.send("hey");
});

router.post('/send-otp', sendRegistrationOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/google-auth', googleAuth);
router.get('/google-callback', googleCallback);
router.get('/me', isLoggedIn, getCurrentUser);
router.get('/logout', logout);

// Route to get user's cart
router.get('/cart', isLoggedIn, getUserCart);

// Route to update user's profile photo
router.post(
    '/profile/update-photo',
    isLoggedIn,
    upload.single('profilePhoto'), 
    updateUserProfilePhoto
);

// Route to update user's general profile information (fullname, phone, address)
router.put('/profile/update', isLoggedIn, updateUserProfile);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', verifyOtpAndResetPassword);

export default router;