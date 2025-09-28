import jwt from 'jsonwebtoken';
import userModel from '../models/users-model.js';
import { isBlacklisted } from '../utils/tokenBlacklist.js';

const isLoggedIn = async (req, res, next) => {
    // Try multiple ways to get the token for production compatibility
    let token = req.cookies.token || 
                req.cookies['token'] || 
                req.headers.authorization?.replace('Bearer ', '') ||
                req.headers['x-auth-token'];
    
    // Debug logging for production
    if (!token && process.env.NODE_ENV === 'production') {
        console.log('No token found. Cookies:', Object.keys(req.cookies || {}));
        console.log('Headers auth:', req.headers.authorization);
    }
    
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: You need to login first." });
    }

    if (isBlacklisted(token)) {
        return res.status(401).json({ error: "Unauthorized: Token has been invalidated." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const user = await userModel
            .findOne({ email: decoded.email })
            .select("-password");

        if (!user) {
            // This case might indicate a token for a user that no longer exists
            return res.status(401).json({ error: "Unauthorized: Invalid token or user not found." });
        }

        req.user = user;

        next();
    } catch (err) {
        // req.flash("error","something went wrong");
        // res.redirect("/");
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Unauthorized: Invalid or expired token.", details: err.message });
        }
        return res.status(500).json({ error: "Something went wrong during authentication.", details: err.message });
    }
};

export default isLoggedIn;