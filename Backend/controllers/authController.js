import userModel from '../models/users-model.js';
import ownerModel from '../models/owner-model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; // Added for OTP generation
import nodemailer from 'nodemailer'; // Added for sending emails
import { generateToken } from '../utils/generateToken.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'; // Corrected import
import { addToBlacklist } from '../utils/tokenBlacklist.js';
// userModel is already imported at the top of the file

// In-memory store for OTPs. In production, use Redis or a similar persistent store.
let otpStore = {}; // Format: { email: { otp: '123456', expires: timestamp, attempts: 0 } }
// In-memory store for password reset OTPs
let passwordResetOtpStore = {}; // Format: { email: { otp: '123456', expires: timestamp, attempts: 0, resendCooldown: timestamp } }

// Nodemailer transporter setup for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Make sure GMAIL_USER is set in .env
        pass: process.env.GMAIL_APP_PASS, // Make sure GMAIL_APP_PASS is set in .env
    },
    tls: {
        rejectUnauthorized: false // Necessary for some environments, especially local development
    }
});

export const sendRegistrationOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
            console.error("CRITICAL: GMAIL_USER or GMAIL_APP_PASS not found in environment variables. Email sending will fail.");
            return res.status(500).json({ error: "Email service is not configured correctly on the server." });
        }

        if (!email) {
            return res.status(400).json({ error: "Email is required to send OTP." });
        }
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ error: emailValidation.message });
        }

        const existingUser = await userModel.findOne({ email: email });
        if (existingUser) {
            return res.status(409).json({ error: "This email is already registered. Please login." });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expires = Date.now() + 2 * 60 * 1000; // OTP expires in 2 minutes

        otpStore[email] = { otp, expires, attempts: 0 };

        const mailOptions = {
            from: `"Scatch - Premium Shopping" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🔐 Your Scatch Registration OTP',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Registration OTP</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2D3436; margin: 0; padding: 0; background-color: #f8f9fa;">
                    <div style="background: linear-gradient(135deg, #2D3436, #636e72); padding: 30px 20px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 700;">SCATCH</h1>
                        <p style="color: #ddd5d0; margin: 5px 0 0 0; font-size: 12px;">Premium Shopping Experience</p>
                    </div>
                    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; margin-top: -15px; position: relative; z-index: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 30px;">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <div style="background: linear-gradient(135deg, #00B894, #00A085); color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px;">
                                🔐 Registration OTP
                            </div>
                        </div>
                        <h2 style="color: #2D3436; text-align: center; margin: 0 0 20px 0; font-size: 20px;">Complete Your Registration</h2>
                        <p style="color: #636e72; text-align: center; margin: 0 0 25px 0;">Enter this OTP to verify your email and create your Scatch account:</p>
                        <div style="background: linear-gradient(135deg, #2D3436, #636e72); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                            <div style="font-size: 12px; margin-bottom: 5px; opacity: 0.8;">Your OTP Code</div>
                            <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace; display: flex; justify-content: center; gap: 8px;">
                                ${otp.split('').map(digit => `<span style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; min-width: 20px; display: inline-block;">${digit}</span>`).join('')}
                            </div>
                        </div>
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">⏰ This OTP expires in <strong>2 minutes</strong></p>
                        </div>
                        <p style="color: #636e72; font-size: 14px; text-align: center; margin: 20px 0;">If you didn't request this registration, please ignore this email.</p>
                    </div>
                    <div style="background: #2D3436; color: white; padding: 20px; text-align: center; margin-top: 20px;">
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2024 Scatch. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        // console.log(`OTP email sent to ${email}.`); 

        return res.status(200).json({ success: true, message: "OTP sent successfully to your email. Please check your inbox (and spam folder) and enter it to register." });

    } catch (err) {
        console.error("Error sending OTP email:", err); // Retained general error log

        if (err.code === 'EENVELOPE' || err.responseCode === 550 || err.responseCode === 553) {
            return res.status(500).json({ error: "Failed to send OTP email. The recipient email address might be invalid or not exist.", details: err.message });
        }
        if (err.code === 'EAUTH' || err.responseCode === 535 || err.responseCode === 534) {
            console.error("Nodemailer authentication failed. This usually indicates an issue with GMAIL_USER or GMAIL_APP_PASS in .env or Google account security settings for the sender email.");
            return res.status(500).json({ error: "Failed to send OTP email due to authentication issues with the email server.", details: "Server email configuration error." });
        }
        res.status(500).json({ error: "Server error while sending OTP.", details: err.message });
    }
};


export const registerUser = async (req, res) => {
    try {
        const { email, fullname, password, otp } = req.body; // Added otp

        // Validate OTP
        if (!otp) {
            return res.status(400).json({ error: "OTP is required." });
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ error: emailValidation.message });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        if (!fullname || fullname.trim().length < 2) {
            return res.status(400).json({ error: "Full name must be at least 2 characters long." });
        }

        // Check if user already exists
        const userExists = await userModel.findOne({ email: email })
        if (userExists) {
            return res.status(409).json({ error: "This email is already registered. Please login." });
        }

        // Verify OTP
        const storedOtpData = otpStore[email];
        if (!storedOtpData) {
            return res.status(400).json({ error: "OTP not found or not requested for this email. Please request an OTP first." });
        }
        if (Date.now() > storedOtpData.expires) {
            delete otpStore[email]; // Clean up expired OTP
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }
        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts = (storedOtpData.attempts || 0) + 1;
            if (storedOtpData.attempts >= 5) { // Max 5 attempts
                delete otpStore[email];
                return res.status(400).json({ error: "Invalid OTP. Maximum attempts reached. Please request a new OTP." });
            }
            return res.status(400).json({ error: "Invalid OTP. Please try again." });
        }

        // OTP is valid, proceed with registration
        delete otpStore[email]; // Clean up used OTP

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).json({ error: "Error generating salt", details: err.message });
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.status(500).json({ error: "Error hashing password", details: err.message });
                else {
                    try {
                        const newUser = await userModel.create({ email, fullname, password: hash });
                        const token = generateToken(newUser);

                        if (!token) {
                            console.error("REGISTER_USER: Token generation returned undefined/null.");
                            return res.status(500).json({ error: "Failed to generate token during registration." });
                        }

                        const oneDay = 24 * 60 * 60 * 1000;
                        const cookieOptions = {
                            path: '/',
                            httpOnly: true,
                            secure: true,
                            sameSite: 'none',
                            expires: new Date(Date.now() + oneDay)
                        };
                        
                        // console.log("REGISTER_USER: Attempting to set token cookie. Token exists:", !!token, "Options:", cookieOptions);
                        res.cookie("token", token, cookieOptions);

                        return res.status(201).json({
                            success: true,
                            message: "User registered successfully",
                            token,
                            user: {
                                _id: newUser._id, // Use _id
                                email: newUser.email,
                                fullname: newUser.fullname,
                                phone: newUser.phone || '', // Include new fields
                                address: newUser.address || '',
                                profilePhoto: newUser.profilePhoto || '',
                                orders: newUser.orders || [],
                                cart: newUser.cart || [] // Also include cart if needed by context
                            }
                        });
                    } catch (processingError) {
                        // console.error("REGISTER_USER: Error during user creation or token generation:", processingError);
                        return res.status(500).json({ error: "Server error during user processing.", details: processingError.message });
                    }
                }
            })
        })
    } catch (err) {
        // console.error("REGISTER_USER: Outer error in registerUser:", err);
        res.status(500).json({ error: "Server error during registration", details: err.message });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ error: emailValidation.message });
        }

        const user = await userModel.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ error: "Email or Password incorrect" });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                // console.error("LOGIN_USER: Error comparing password:", err);
                return res.status(500).json({ error: "Error comparing password", details: err.message });
            }

            if (result) {
                try {
                    const token = generateToken(user);
                    if (!token) {
                        console.error("LOGIN_USER: Token generation returned undefined/null.");
                        return res.status(500).json({ error: "Failed to generate token during login." });
                    }

                    const oneDay = 24 * 60 * 60 * 1000;
                    const cookieOptions = {
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none',
                        expires: new Date(Date.now() + oneDay)
                    };
                    // console.log("LOGIN_USER: Attempting to set token cookie. Token exists:", !!token, "Options:", cookieOptions);
                    res.cookie("token", token, cookieOptions);
                    
                    // Return the full user object or necessary fields
                    const userToReturn = {
                        _id: user._id, // Use _id
                        email: user.email,
                        fullname: user.fullname,
                        phone: user.phone || '',
                        address: user.address || '',
                        profilePhoto: user.profilePhoto || '',
                        orders: user.orders || [],
                        cart: user.cart || [] // Also include cart if needed by context
                    };

                    return res.status(200).json({ success: true, message: "Login successful", token, user: userToReturn });
                } catch (tokenError) {
                    console.error("LOGIN_USER: Error generating token:", tokenError);
                    return res.status(500).json({ error: "Login token generation failed.", details: tokenError.message });
                }
            } else {
                return res.status(401).json({ error: "Email or Password incorrect" });
            }
        })
    } catch (err) {
        // console.error("LOGIN_USER: Outer error in loginUser:", err);
        return res.status(500).json({ error: "Server error during login", details: err.message });
    }
}

export const logout = (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        addToBlacklist(token);
    }
    
    res.cookie("token", "", { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0) }); // Clears cookie properly
    return res.status(200).json({ success: true, message: "Logout successful" });
};

export const getUserCart = async (req, res) => {
    try {
        // Assuming req.user is populated by an authentication middleware (e.g., isLoggedIn)
        // and contains the user's ID.
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated or user ID missing." });
        }

        // Fetch the user and populate the cart with product details
        // The .populate() method assumes 'cart' in userModel is an array of ObjectIds
        // referencing a 'Product' model, and that 'Product' model has fields like
        // name, price, image, discount, bgcolor.
        // You might need to adjust the path and select fields based on your actual Product model.
        // Corrected populate call based on userSchema: cart is an array of ObjectIds ref: "product"
        const userWithCart = await userModel.findById(req.user._id)
            .populate({
                path: 'cart.product',
                model: 'product' // Ensure 'product' matches your product model name
            });
        // Mongoose will use the ref: "product" from the schema for the 'cart' path.
        // Ensure your Product model is named "product" (matching the ref) or adjust the ref in userSchema.

        if (!userWithCart) {
            // console.log("getUserCart: User not found with ID:", req.user._id); // DEBUG LOG
            return res.status(404).json({ error: "User not found." });
        }

        // After populating 'cart', userWithCart.cart will be an array of product documents.
        // The frontend Cart.jsx expects an array of items, each being a product object
        // and potentially having a 'quantity' if your cart logic supports it.
        // Since the userModel.cart is just an array of product ObjectIds,
        // the populated userWithCart.cart will be an array of product documents.
        // We need to ensure this structure matches what the frontend expects or transform it.

        // The frontend's formattedCartItems expects each item to have product details
        // and a quantity. Since our current userModel.cart doesn't store quantity,
        // we'll assume quantity 1 for each product for now.
        // If you add quantity to your userModel.cart, this transformation will need to change.
        const cartForFrontend = userWithCart.cart.map(cartItem => {
            if (!cartItem.product) {
                // console.log("getUserCart: Found a cart item with null product, skipping."); // DEBUG LOG
                return null; // Handle if a product in cart was deleted and populate returns null
            }
            return {
                ...cartItem.product._doc, // Spread the actual product document data
                quantity: cartItem.quantity // Use the quantity from the cart item
            };
        }).filter(item => item !== null);

        // console.log("getUserCart: cartForFrontend being sent to client:", JSON.stringify(cartForFrontend, null, 2)); // DEBUG LOG

        res.status(200).json({ success: true, cart: cartForFrontend || [] });

    } catch (err) {
        console.error("Error fetching user cart (getUserCart catch block):", err); // Keep this important error log
        res.status(500).json({ error: "Server error while fetching cart.", details: err.message });
    }
};


export const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return { isValid: false, message: "Email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: "Please enter a valid email address" };
    }

    return { isValid: true, message: "Email is valid" };
};

export const validatePassword = (password) => {
    if (!password || password.trim() === '') {
        return { isValid: false, message: "Password is required" };
    }

    if (password.length < 6) {
        return { isValid: false, message: "Password must be at least 6 characters long" };
    }

    if (password.length > 128) {
        return { isValid: false, message: "Password is too long" };
    }


    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter) {
        return { isValid: false, message: "Password must contain at least one letter" };
    }

    return { isValid: true, message: "Password is valid" };
};

export const loginOwner = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ error: emailValidation.message });
        }

        const owner = await ownerModel.findOne({ email: email });
        if (!owner) {
            return res.status(401).json({ error: "Email or Password incorrect" });
        }

        bcrypt.compare(password, owner.password, (err, result) => {
            if (err) {
                // console.error("LOGIN_OWNER: Error comparing owner password:", err);
                return res.status(500).json({ error: "Error comparing owner password", details: err.message });
            }

            if (result) {
                try {
                    const token = generateToken(owner); // Use the same token generator
                    if (!token) {
                        // console.error("LOGIN_OWNER: Token generation returned undefined/null.");
                        return res.status(500).json({ error: "Failed to generate owner token during login." });
                    }

                    const oneDay = 24 * 60 * 60 * 1000;
                    const cookieOptions = {
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none',
                        expires: new Date(Date.now() + oneDay)
                    };
                    // console.log("LOGIN_OWNER: Attempting to set token cookie. Token exists:", !!token, "Options:", cookieOptions);
                    res.cookie("token", token, cookieOptions);

                    return res.status(200).json({
                        success: true,
                        message: "Owner login successful",
                        token,
                        owner: {
                            id: owner._id,
                            email: owner.email,
                            fullname: owner.fullname
                        }
                    });
                } catch (tokenError) {
                    // console.error("LOGIN_OWNER: Error generating owner token:", tokenError);
                    return res.status(500).json({ error: "Owner login token generation failed.", details: tokenError.message });
                }
            } else {
                return res.status(401).json({ error: "Email or Password incorrect" });
            }
        });
    } catch (err) {
        // console.error("LOGIN_OWNER: Outer error in loginOwner:", err);
        return res.status(500).json({ error: "Server error during owner login", details: err.message });
    }
};

export const logoutOwner = (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        addToBlacklist(token);
    }
    
    res.cookie("token", "", { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0) });
    return res.status(200).json({ success: true, message: "Owner logout successful" });
};

export const updateUserProfilePhoto = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated." });
        }
        if (!req.file) {
            return res.status(400).json({ error: "No profile photo file uploaded." });
        }

        const localFilePath = req.file.path;
        const userId = req.user._id;

        // Upload to Cloudinary - uploadOnCloudinary handles temp file deletion
        // The second argument for folder is not directly supported by the current uploadOnCloudinary,
        // but Cloudinary's uploader.upload can take a `folder` option.
        // For now, we'll assume the default behavior of uploadOnCloudinary is sufficient,
        // or that it's configured to place files in a desired location.
        // If specific folder naming like `profile_photos/${userId}` is needed,
        // uploadOnCloudinary would need to be modified to accept and use a folder option.
        const cloudinaryResult = await uploadOnCloudinary(localFilePath);
        // No need to call deleteTempFile explicitly, as uploadOnCloudinary handles it.

        if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            return res.status(500).json({ error: "Failed to upload image to Cloudinary." });
        }

        // Update user model
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { profilePhoto: cloudinaryResult.secure_url },
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from the returned user object

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found after update." });
        }
        
        // Return the updated user (or just the new photo URL)
        return res.status(200).json({
            success: true,
            message: "Profile photo updated successfully.",
            profilePhotoUrl: updatedUser.profilePhoto,
            user: { // Return relevant user fields for context update on frontend
                _id: updatedUser._id,
                email: updatedUser.email,
                fullname: updatedUser.fullname,
                phone: updatedUser.phone,
                address: updatedUser.address,
                profilePhoto: updatedUser.profilePhoto,
                orders: updatedUser.orders,
                cart: updatedUser.cart
            }
        });

    } catch (error) {
        console.error("Error updating profile photo:", error);
        // If an error occurred, uploadOnCloudinary should have attempted to delete the temp file.
        // No explicit deletion needed here unless uploadOnCloudinary failed before attempting deletion.
        res.status(500).json({ error: "Server error while updating profile photo.", details: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated." });
        }

        const { fullname, phone, address } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (fullname !== undefined) updateData.fullname = fullname;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No update data provided." });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                fullname: updatedUser.fullname,
                phone: updatedUser.phone,
                address: updatedUser.address,
                profilePhoto: updatedUser.profilePhoto,
                orders: updatedUser.orders,
                cart: updatedUser.cart
            }
        });

    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Server error while updating profile.", details: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const existingOtpData = passwordResetOtpStore[email];
        if (existingOtpData && existingOtpData.resendCooldown && Date.now() < existingOtpData.resendCooldown) {
            const timeLeft = Math.ceil((existingOtpData.resendCooldown - Date.now()) / 1000);
            return res.status(429).json({ error: `Please wait ${timeLeft} seconds before requesting a new OTP.` });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
        const resendCooldown = Date.now() + 1 * 60 * 1000; // 1 minute cooldown for resend

        passwordResetOtpStore[email] = {
            otp,
            expires,
            attempts: 0,
            resendCooldown
        };
        // console.log("Password Reset OTP Store after sending:", passwordResetOtpStore);


        const mailOptions = {
            from: `"Scatch - Premium Shopping" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🔒 Reset Your Scatch Password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset OTP</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2D3436; margin: 0; padding: 0; background-color: #f8f9fa;">
                    <div style="background: linear-gradient(135deg, #2D3436, #636e72); padding: 30px 20px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 700;">SCATCH</h1>
                        <p style="color: #ddd5d0; margin: 5px 0 0 0; font-size: 12px;">Premium Shopping Experience</p>
                    </div>
                    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; margin-top: -15px; position: relative; z-index: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 30px;">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <div style="background: linear-gradient(135deg, #E17055, #D63031); color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px;">
                                🔒 Password Reset
                            </div>
                        </div>
                        <h2 style="color: #2D3436; text-align: center; margin: 0 0 10px 0; font-size: 20px;">Hello ${user.fullname}!</h2>
                        <p style="color: #636e72; text-align: center; margin: 0 0 25px 0;">We received a request to reset your Scatch account password. Use this OTP to proceed:</p>
                        <div style="background: linear-gradient(135deg, #E17055, #D63031); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                            <div style="font-size: 12px; margin-bottom: 5px; opacity: 0.8;">Your Reset OTP</div>
                            <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace; display: flex; justify-content: center; gap: 8px;">
                                ${otp.split('').map(digit => `<span style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; min-width: 20px; display: inline-block;">${digit}</span>`).join('')}
                            </div>
                        </div>
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">⏰ This OTP expires in <strong>10 minutes</strong></p>
                        </div>
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #721c24; font-size: 14px; text-align: center;">🛡️ If you didn't request this password reset, please ignore this email or contact our support team if you have security concerns.</p>
                        </div>
                    </div>
                    <div style="background: #2D3436; color: white; padding: 20px; text-align: center; margin-top: 20px;">
                        <p style="margin: 0 0 10px 0; font-size: 14px;">Need help? Contact us at <a href="mailto:scatchotp@gmail.com" style="color: #FDCB6E; text-decoration: none;">scatchotp@gmail.com</a></p>
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2024 Scatch. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "OTP sent to your email for password reset." });

    } catch (err) {
        console.error("Error in forgotPassword:", err);
        res.status(500).json({ error: "Server error while processing forgot password request.", details: err.message });
    }
};

export const verifyOtpAndResetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: "Email, OTP, and new password are required." });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const storedOtpData = passwordResetOtpStore[email];

        if (!storedOtpData || !storedOtpData.otp) {
            return res.status(400).json({ error: "No OTP found for this user or OTP might have been cleared. Please request a new one." });
        }

        if (Date.now() > storedOtpData.expires) {
            delete passwordResetOtpStore[email]; // Clean up expired OTP
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        if (storedOtpData.attempts >= 3) {
            delete passwordResetOtpStore[email]; 
            return res.status(429).json({ error: "Maximum OTP attempts reached. Please request a new OTP." });
        }

        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts += 1;
            const attemptsLeft = 3 - storedOtpData.attempts;
            // console.log("Password Reset OTP Store after failed attempt:", passwordResetOtpStore);
            return res.status(400).json({ error: `Invalid OTP. ${attemptsLeft} attempts remaining.` });
        }

        // OTP is correct, reset password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save(); // Save the new password to the user model

        delete passwordResetOtpStore[email]; // Clean up used OTP from the store
        // console.log("Password Reset OTP Store after successful reset:", passwordResetOtpStore);


        // Optionally, log the user in directly or send a confirmation email
        res.status(200).json({ success: true, message: "Password has been reset successfully." });

    } catch (err) {
        console.error("Error in verifyOtpAndResetPassword:", err);
        res.status(500).json({ error: "Server error while resetting password.", details: err.message });
    }
};
// Removed module.exports as we are using named exports now