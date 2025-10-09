import userModel from '../models/users-model.js';
import ownerModel from '../models/owner-model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken } from '../utils/generateToken.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';
import { generateOTP, sendRegistrationOTPEmail, sendOTPEmail, sendPasswordResetConfirmationEmail } from '../utils/nodemailer-transporter.js';

let otpStore = {};
let passwordResetOtpStore = {};

export const sendRegistrationOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("CRITICAL: EMAIL_USER or EMAIL_PASS not found in environment variables. Email sending will fail.");
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

        const otp = generateOTP();
        const expires = Date.now() + 2 * 60 * 1000;

        otpStore[email] = { otp, expires, attempts: 0 };

        await sendRegistrationOTPEmail(email, otp, 'User');

        return res.status(200).json({ success: true, message: "OTP sent successfully to your email. Please check your inbox (and spam folder) and enter it to register." });

    } catch (err) {
        console.error("Error sending OTP email:", err);

        if (err.code === 'EENVELOPE' || err.responseCode === 550 || err.responseCode === 553) {
            return res.status(500).json({ error: "Failed to send OTP email. The recipient email address might be invalid or not exist.", details: err.message });
        }
        if (err.code === 'EAUTH' || err.responseCode === 535 || err.responseCode === 534) {
            console.error("Nodemailer authentication failed. This usually indicates an issue with EMAIL_USER or EMAIL_PASS in .env or Google account security settings for the sender email.");
            return res.status(500).json({ error: "Failed to send OTP email due to authentication issues with the email server.", details: "Server email configuration error." });
        }
        res.status(500).json({ error: "Server error while sending OTP.", details: err.message });
    }
};


export const registerUser = async (req, res) => {
    try {
        const { email, fullname, password, otp } = req.body;

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

        const userExists = await userModel.findOne({ email: email })
        if (userExists) {
            return res.status(409).json({ error: "This email is already registered. Please login." });
        }

        const storedOtpData = otpStore[email];
        if (!storedOtpData) {
            return res.status(400).json({ error: "OTP not found or not requested for this email. Please request an OTP first." });
        }
        if (Date.now() > storedOtpData.expires) {
            delete otpStore[email];
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }
        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts = (storedOtpData.attempts || 0) + 1;
            if (storedOtpData.attempts >= 5) {
                delete otpStore[email];
                return res.status(400).json({ error: "Invalid OTP. Maximum attempts reached. Please request a new OTP." });
            }
            return res.status(400).json({ error: "Invalid OTP. Please try again." });
        }

        delete otpStore[email];

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

                        const oneWeek = 7 * 24 * 60 * 60 * 1000;
                        const cookieOptions = {
                            path: '/',
                            httpOnly: false,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                            expires: new Date(Date.now() + oneWeek),
                            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
                        };
                        
                        res.cookie("token", token, cookieOptions);

                        return res.status(201).json({
                            success: true,
                            message: "User registered successfully",
                            token,
                            user: {
                                _id: newUser._id,
                                email: newUser.email,
                                fullname: newUser.fullname,
                                phone: newUser.phone || '',
                                address: newUser.address || '',
                                profilePhoto: newUser.profilePhoto || '',
                                orders: newUser.orders || [],
                                cart: newUser.cart || []
                            }
                        });
                    } catch (processingError) {
                        return res.status(500).json({ error: "Server error during user processing.", details: processingError.message });
                    }
                }
            })
        })
    } catch (err) {
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
                    res.cookie("token", token, cookieOptions);
                    
                    const userToReturn = {
                        _id: user._id,
                        email: user.email,
                        fullname: user.fullname,
                        phone: user.phone || '',
                        address: user.address || '',
                        profilePhoto: user.profilePhoto || '',
                        orders: user.orders || [],
                        cart: user.cart || []
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
        return res.status(500).json({ error: "Server error during login", details: err.message });
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated." });
        }

        const user = await userModel.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                fullname: user.fullname,
                phone: user.phone || '',
                address: user.address || '',
                profilePhoto: user.profilePhoto || '',
                orders: user.orders || [],
                cart: user.cart || [],
                authProvider: user.authProvider || 'local',
                googleId: user.googleId || null
            }
        });

    } catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ error: "Server error while fetching user data.", details: error.message });
    }
};

export const logout = (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        addToBlacklist(token);
    }
    
    res.cookie("token", "", { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0) });
    return res.status(200).json({ success: true, message: "Logout successful" });
};

export const getUserCart = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "User not authenticated or user ID missing." });
        }

        const userWithCart = await userModel.findById(req.user._id)
            .populate({
                path: 'cart.product',
                model: 'product'
            });

        if (!userWithCart) {
            return res.status(404).json({ error: "User not found." });
        }

        const cartForFrontend = userWithCart.cart.map(cartItem => {
            if (!cartItem.product) {
                return null;
            }
            return {
                ...cartItem.product._doc,
                quantity: cartItem.quantity
            };
        }).filter(item => item !== null);

        res.status(200).json({ success: true, cart: cartForFrontend || [] });

    } catch (err) {
        console.error("Error fetching user cart (getUserCart catch block):", err);
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
                return res.status(500).json({ error: "Error comparing owner password", details: err.message });
            }

            if (result) {
                try {
                    const token = generateToken(owner);
                    if (!token) {
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
                    return res.status(500).json({ error: "Owner login token generation failed.", details: tokenError.message });
                }
            } else {
                return res.status(401).json({ error: "Email or Password incorrect" });
            }
        });
    } catch (err) {
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

        const cloudinaryResult = await uploadOnCloudinary(localFilePath);

        if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            return res.status(500).json({ error: "Failed to upload image to Cloudinary." });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { profilePhoto: cloudinaryResult.secure_url },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found after update." });
        }
        
        return res.status(200).json({
            success: true,
            message: "Profile photo updated successfully.",
            profilePhotoUrl: updatedUser.profilePhoto,
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
        console.error("Error updating profile photo:", error);
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

        const otp = generateOTP();
        const expires = Date.now() + 10 * 60 * 1000;
        const resendCooldown = Date.now() + 1 * 60 * 1000;

        passwordResetOtpStore[email] = {
            otp,
            expires,
            attempts: 0,
            resendCooldown
        };

        await sendOTPEmail(email, otp, user.fullname);
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
            delete passwordResetOtpStore[email];
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        if (storedOtpData.attempts >= 3) {
            delete passwordResetOtpStore[email]; 
            return res.status(429).json({ error: "Maximum OTP attempts reached. Please request a new OTP." });
        }

        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts += 1;
            const attemptsLeft = 3 - storedOtpData.attempts;
            return res.status(400).json({ error: `Invalid OTP. ${attemptsLeft} attempts remaining.` });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        delete passwordResetOtpStore[email];

        res.status(200).json({ success: true, message: "Password has been reset successfully." });

    } catch (err) {
        console.error("Error in verifyOtpAndResetPassword:", err);
        res.status(500).json({ error: "Server error while resetting password.", details: err.message });
    }
};