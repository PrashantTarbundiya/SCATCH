const express = require('express')
const router = express.Router();
const ownerModel = require('../models/owner-model');
const bcrypt = require('bcrypt');
const { loginOwner, logoutOwner } = require('../controllers/authController'); // Import loginOwner and logoutOwner

if (process.env.NODE_ENV === "development") {
    router.post('/create', async (req, res) => {
        try {
            const owners = await ownerModel.find();
            if (owners.length > 0) {
                return res.status(503).json({ message: "You don't have permission to create a new owner" });
            }

            const {fullname,email,password} = req.body;
            if (!fullname || !email || !password) {
                return res.status(400).json({ message: "Fullname, email, and password are required" });
            }

            bcrypt.genSalt(10, (err, salt) => {
                if (err) return res.status(500).json({ message: "Error generating salt for owner password", error: err.message });
                bcrypt.hash(password, salt, async (err, hash) => {
                    if (err) return res.status(500).json({ message: "Error hashing owner password", error: err.message });
                    
                    const createdOwner = await ownerModel.create({
                        fullname,
                        email,
                        password: hash // Save the hashed password
                    });
                    res.status(201).json({ message: "Owner created successfully", owner: { id: createdOwner._id, fullname: createdOwner.fullname, email: createdOwner.email } });
                });
            });
        } catch (error) {
            res.status(500).json({ message: "Error creating owner", error: error.message });
        }
    })
}

router.get('/admin', async (req, res) => {
    const success = req.flash("success");
    // res.render("createproducts",{ success })
    res.json({ success, page: "createproducts" }); // Or page: "admin" if that's more appropriate for React routing
})

// Owner Login Route
router.post('/login', loginOwner);

// Owner Logout Route
router.post('/logout', logoutOwner); // Assuming POST for logout, can be GET


module.exports = router;