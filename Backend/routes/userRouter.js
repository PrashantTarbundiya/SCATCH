const express = require('express')
const router = express.Router();
const {sendRegistrationOtp, registerUser,loginUser, logout, getUserCart} = require('../controllers/authController') // Added sendRegistrationOtp
const isLoggedIn = require('../middleware/isLoggedin'); // Assuming this is your auth middleware

router.get('/',(req,res)=>{
    res.send("hey")
})

router.post('/send-otp', sendRegistrationOtp); // New route for sending OTP
router.post('/register',registerUser);
router.post('/login', loginUser);
router.get('/logout',logout);

// Route to get user's cart
// isLoggedIn middleware will protect this route and add req.user
router.get('/cart', isLoggedIn, getUserCart);

module.exports = router;