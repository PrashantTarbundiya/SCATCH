const jwt = require('jsonwebtoken')
const userModel = require('../models/users-model');

module.exports = async (req,res,next) =>{
    if(!req.cookies.token){
        // req.flash("error","You Need to login first");
        // return res.redirect("/");
        return res.status(401).json({ error: "Unauthorized: You need to login first." });
    }

    try{
        const decoded = jwt.verify(req.cookies.token,process.env.JWT_KEY);
        const user = await userModel
                    .findOne({email:decoded.email})
                    .select("-password");

        if (!user) {
            // This case might indicate a token for a user that no longer exists
            return res.status(401).json({ error: "Unauthorized: Invalid token or user not found." });
        }

        req.user = user;
        
        next();
    }catch(err){
        // req.flash("error","something went wrong");
        // res.redirect("/");
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Unauthorized: Invalid or expired token.", details: err.message });
        }
        return res.status(500).json({ error: "Something went wrong during authentication.", details: err.message });
    }
};