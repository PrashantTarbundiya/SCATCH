const express = require('express')
const router = express.Router();
const upload = require('../config/multer-config')
const productModel = require('../models/product-model');
const isOwner = require('../middleware/isOwner'); // Import isOwner middleware

router.post('/create', isOwner, upload.single("image"),async (req,res, next)=>{ // Added isOwner
   try{
     const {name,price,discount,bgcolor,panelcolor,textcolor} = req.body;

     if (!req.file) {
        const err = new Error("Image is required");
        err.status = 400;
        return next(err); // Pass error to central handler
     }

    const product = await productModel.create(({
        image:req.file.buffer, // Storing buffer directly, consider storing path/URL for React
        name,price,discount,bgcolor,panelcolor,textcolor
    }))
    res.status(201).json({ success: "Product created successfully", product });
   }catch(err){
    err.message = `Product creation failed: ${err.message}`; // Add context to error
    next(err); // Pass error to central handler
   }
    
})

// Route to get all products
router.get('/', async (req, res, next) => { // Added next
    try {
        const products = await productModel.find();
        res.status(200).json({ success: true, products });
    } catch (err) {
        err.message = `Failed to fetch products: ${err.message}`;
        next(err);
    }
});

// Route to delete all products
router.delete('/all', isOwner, async (req, res, next) => { // Added isOwner
    try {
        const result = await productModel.deleteMany({}); // Deletes all documents in the collection
        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} products.`
        });
    } catch (err) {
        err.message = `Failed to delete all products: ${err.message}`;
        next(err);
    }
});

// Route to get a single product by ID
router.get('/:id', async (req, res, next) => { // Added next
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) {
            const err = new Error("Product not found");
            err.status = 404;
            return next(err);
        }
        res.status(200).json({ success: true, product });
    } catch (err) {
        err.message = `Failed to fetch product with ID ${req.params.id}: ${err.message}`;
        next(err);
    }
});

// Route to update a product by ID
router.put('/:id', isOwner, upload.single("image"), async (req, res, next) => { // Added isOwner
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        let updateData = { name, price, discount, bgcolor, panelcolor, textcolor };

        if (req.file) {
            updateData.image = req.file.buffer;
        }

        const product = await productModel.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!product) {
            const err = new Error("Product not found for update");
            err.status = 404;
            return next(err);
        }
        res.status(200).json({ success: "Product updated successfully", product });
    } catch (err) {
        err.message = `Product update failed for ID ${req.params.id}: ${err.message}`;
        next(err);
    }
});

// Route to delete a single product by ID
router.delete('/:id', isOwner, async (req, res, next) => { // Added isOwner
    try {
        const product = await productModel.findByIdAndDelete(req.params.id);
        if (!product) {
            const err = new Error("Product not found for deletion");
            err.status = 404;
            return next(err);
        }
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        err.message = `Product deletion failed for ID ${req.params.id}: ${err.message}`;
        next(err);
    }
});

module.exports = router;