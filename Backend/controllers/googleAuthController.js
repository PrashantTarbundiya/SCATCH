import { OAuth2Client } from 'google-auth-library';
import userModel from '../models/users-model.js';
import { generateToken } from '../utils/generateToken.js';

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || 'http://localhost:3000'}/users/google-callback`
);

// Initiate Google OAuth flow
export const googleAuth = async (req, res) => {
    try {
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
            prompt: 'select_account',
        });

        res.redirect(authUrl);
    } catch (error) {
        console.error('Google auth initiation error:', error);
        res.redirect(`${process.env.FRONTEND_URI}/login?error=auth_failed`);
    }
};

// Handle Google OAuth callback
export const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URI}/login?error=no_code`);
        }

        // Exchange code for tokens
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Get user info from Google
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
            return res.redirect(`${process.env.FRONTEND_URI}/login?error=no_email`);
        }

        // Check if user exists by googleId or email
        let user = await userModel.findOne({ 
            $or: [
                { googleId: googleId },
                { email: email }
            ]
        });

        if (user) {
            // User exists - generate token
            const token = generateToken(user);
            
            if (!token) {
                return res.redirect(`${process.env.FRONTEND_URI}/login?error=token_generation_failed`);
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
            return res.redirect(`${process.env.FRONTEND_URI}/shop`);

        } else {
            // Create new user with Google OAuth
            const newUser = await userModel.create({
                email,
                fullname: name || email.split('@')[0],
                googleId: googleId,
                authProvider: 'google',
                profilePhoto: picture || 'https://res.cloudinary.com/dnlkzlnhv/image/upload/v1757783899/profile-image_ju6q5f.png',
                isEmailVerified: true
            });

            const token = generateToken(newUser);

            if (!token) {
                return res.redirect(`${process.env.FRONTEND_URI}/login?error=token_generation_failed`);
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
            return res.redirect(`${process.env.FRONTEND_URI}/shop`);
        }

    } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URI}/login?error=callback_failed`);
    }
};