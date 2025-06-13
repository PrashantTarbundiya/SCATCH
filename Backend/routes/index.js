import express from 'express';
import isLoggedIn from '../middleware/isLoggedin.js';
import productModel from '../models/product-model.js';
import usersModel from '../models/users-model.js';
const router = express.Router();


router.get('/', (req, res) => {
    const error = req.flash("error");
    // res.render("register",{error,loggedin:false});
    res.json({ error, loggedin: false, page: "register" });
});

router.get('/login', (req, res) => {
    const error = req.flash("error");
    // res.render('login', { error,loggedin:false });
    res.json({ error, loggedin: false, page: "login" });
});

router.get('/register', (req, res) => {
    const error = req.flash("error");
    // res.render('register', { error,loggedin:false });
    res.json({ error, loggedin: false, page: "register" });
});

router.get("/shop", isLoggedIn, async (req, res, next) => { // Added next
    try {
        const products = await productModel.find();
        const success = req.flash('success');
        res.json({ products, success, page: "shop" });
    } catch (error) {
        error.message = `Failed to fetch products for shop: ${error.message}`;
        next(error);
    }
});

router.get('/addtocart/:id', isLoggedIn, async (req, res, next) => { // Added next
    try {
        const user = await usersModel.findOne({ email: req.user.email });
        if (!user) {
            const err = new Error("User not found");
            err.status = 404;
            return next(err);
        }

        const productId = req.params.id;
        const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (cartItemIndex > -1) {
            user.cart[cartItemIndex].quantity += 1;
        } else {
            user.cart.push({ product: productId, quantity: 1 });
        }

        await user.save();
        res.status(200).json({ success: true, message: "Product added in cart", cart: user.cart });
    } catch (error) {
        console.error("Error in /addtocart/:id :", error);
        error.message = `Failed to add product to cart: ${error.message}`;
        next(error);
    }
});

router.get("/cart", isLoggedIn, async (req, res, next) => { // Added next
    try {
        const user = await usersModel.findOne({ email: req.user.email }).populate("cart.product"); // Ensure product details are populated
        if (!user) {
            const err = new Error("User not found or cart is empty");
            err.status = 404;
            return next(err);
        }
        res.json({ user, page: "cart" }); // Send the whole user object which includes the populated cart
    } catch (error) {
        error.message = `Failed to fetch cart: ${error.message}`;
        next(error);
    }
});

// Route to update item quantity in cart
router.post('/cart/update/:productId', isLoggedIn, async (req, res, next) => { // Added next
    try {
        const user = await usersModel.findOne({ email: req.user.email });
        if (!user) {
            const err = new Error("User not found");
            err.status = 404;
            return next(err);
        }

        const { productId } = req.params;
        const { quantity } = req.body;

        if (typeof quantity !== 'number' || quantity < 0) { // Allow 0 for removal by handleQuantityChange
            const err = new Error("Invalid quantity provided. Must be a non-negative number.");
            err.status = 400;
            return next(err);
        }

        const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (cartItemIndex > -1) {
            if (quantity === 0) { // If quantity is 0, remove the item
                user.cart.splice(cartItemIndex, 1);
            } else {
                user.cart[cartItemIndex].quantity = quantity;
            }
            await user.save();

            // It's often better to send back the whole updated cart or a success message,
            // and let the frontend re-fetch or manage its state.
            // For simplicity, sending success and the updated user cart.
            const updatedUser = await usersModel.findById(user._id).populate('cart.product');
            return res.status(200).json({
                success: true,
                message: quantity === 0 ? "Product removed from cart" : "Cart item quantity updated",
                cart: updatedUser.cart
            });
        } else {
            if (quantity > 0) { // Only add if not found and quantity > 0
                user.cart.push({ product: productId, quantity: quantity });
                await user.save();
                const updatedUser = await usersModel.findById(user._id).populate('cart.product');
                return res.status(200).json({
                    success: true,
                    message: "Product added to cart",
                    cart: updatedUser.cart
                });
            }
            const err = new Error("Product not found in cart for update, and quantity is 0.");
            err.status = 404;
            return next(err);
        }
    } catch (error) {
        console.error("Error in /cart/update/:productId :", error);
        error.message = `Failed to update cart item quantity: ${error.message}`;
        next(error);
    }
});

// Route to remove item from cart
router.delete('/cart/remove/:productId', isLoggedIn, async (req, res, next) => { // Added next
    try {
        const user = await usersModel.findOne({ email: req.user.email });
        if (!user) {
            const err = new Error("User not found");
            err.status = 404;
            return next(err);
        }

        const { productId } = req.params;

        const initialCartLength = user.cart.length;
        user.cart = user.cart.filter(item => item.product.toString() !== productId);

        if (user.cart.length === initialCartLength) {
            const err = new Error("Product not found in cart to remove");
            err.status = 404;
            return next(err);
        }

        await user.save();
        const updatedUser = await usersModel.findById(user._id).populate('cart.product');
        return res.status(200).json({ success: true, message: "Product removed from cart", cart: updatedUser.cart });
    } catch (error) {
        console.error("Error in /cart/remove/:productId :", error);
        error.message = `Failed to remove product from cart: ${error.message}`;
        next(error);
    }
});

// Route to clear all items from cart
router.delete('/cart/clear', isLoggedIn, async (req, res, next) => { // Added next
    try {
        const user = await usersModel.findOne({ email: req.user.email });
        if (!user) {
            const err = new Error("User not found");
            err.status = 404;
            return next(err);
        }

        user.cart = []; // Clear the cart
        await user.save();

        return res.status(200).json({ success: true, message: "Cart cleared successfully", cart: [] }); // Return empty cart
    } catch (error) {
        console.error("Error in /cart/clear :", error);
        error.message = `Failed to clear cart: ${error.message}`;
        next(error);
    }
});

export default router;