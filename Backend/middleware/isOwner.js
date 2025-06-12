const jwt = require('jsonwebtoken');
const ownerModel = require('../models/owner-model');

module.exports = async (req, res, next) => {
    if (!req.cookies.token) {
        return res.status(401).json({ error: "Unauthorized: You need to login as an owner first." });
    }

    try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        
        // Find owner specifically in ownerModel
        const owner = await ownerModel
            .findOne({ email: decoded.email }) // or use decoded.id if preferred: { _id: decoded.id }
            .select("-password");

        if (!owner) {
            // Token is valid, but the user is not an owner or owner not found
            return res.status(403).json({ error: "Forbidden: You do not have owner privileges." });
        }

        req.owner = owner; // Attach owner object to request
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Unauthorized: Invalid or expired token.", details: err.message });
        }
        // For other errors during the process
        console.error("Error in isOwner middleware:", err);
        return res.status(500).json({ error: "Something went wrong during owner authentication.", details: err.message });
    }
};