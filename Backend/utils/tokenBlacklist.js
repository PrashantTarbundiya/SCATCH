import jwt from 'jsonwebtoken';

// In-memory token blacklist (use Redis in production)
const blacklistedTokens = new Set();

export const addToBlacklist = (token) => {
    blacklistedTokens.add(token);
};

export const isBlacklisted = (token) => {
    return blacklistedTokens.has(token);
};

export const clearExpiredTokens = () => {
    const tokensToRemove = [];
    
    blacklistedTokens.forEach(token => {
        try {
            jwt.verify(token, process.env.JWT_KEY);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                tokensToRemove.push(token);
            }
        }
    });
    
    tokensToRemove.forEach(token => blacklistedTokens.delete(token));
};

setInterval(clearExpiredTokens, 60 * 60 * 1000);