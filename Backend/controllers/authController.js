import userModel from '../models/users-model.js';
import ownerModel from '../models/owner-model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; // Added for OTP generation
import nodemailer from 'nodemailer'; // Added for sending emails
import { generateToken } from '../utils/generateToken.js';

// In-memory store for OTPs. In production, use Redis or a similar persistent store.
let otpStore = {}; // Format: { email: { otp: '123456', expires: timestamp, attempts: 0 } }

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
            from: `"Scatch App" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your OTP for Scatch Registration',
            html: `
                <p>Hello,</p>
                <p>Your One-Time Password (OTP) for Scatch registration is: <strong>${otp}</strong></p>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <br>
                <p>Thanks,</p>
                <p>The Scatch Team</p>
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
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'Lax',
                            expires: new Date(Date.now() + oneDay)
                        };
                        
                        // console.log("REGISTER_USER: Attempting to set token cookie. Token exists:", !!token, "Options:", cookieOptions);
                        res.cookie("token", token, cookieOptions);

                        return res.status(201).json({
                            success: true,
                            message: "User registered successfully",
                            token,
                            user: { id: newUser._id, email: newUser.email, fullname: newUser.fullname }
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
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Lax',
                        expires: new Date(Date.now() + oneDay)
                    };
                    // console.log("LOGIN_USER: Attempting to set token cookie. Token exists:", !!token, "Options:", cookieOptions);
                    res.cookie("token", token, cookieOptions);
                    
                    return res.status(200).json({ success: true, message: "Login successful", token, user: { id: user._id, email: user.email, fullname: user.fullname } });
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
    res.cookie("token", "", { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0) }); // Clears cookie properly
    // res.redirect("/register");
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
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Lax',
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
    // The token is HttpOnly, so client-side cannot remove it directly.
    // Clearing the cookie on the server side is the correct approach.
    res.cookie("token", "", { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0) });
    return res.status(200).json({ success: true, message: "Owner logout successful" });
};

// Removed module.exports as we are using named exports now