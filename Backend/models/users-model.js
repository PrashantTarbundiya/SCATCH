import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    fullname: {
        type: String,
        minLength: 3,
        trim: true,
    },
    email: String,
    password: String,
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }],
    orders: {
        type: Array, // Consider a more structured schema for orders if needed
        default: []
    },
    contact: Number, // Restoring 'contact'
    picture: String // This could also be a Cloudinary URL if users have profile pictures
});

export default mongoose.model("user", userSchema);