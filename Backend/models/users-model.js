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
        type: Array, 
        default: []
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    profilePhoto: { 
        type: String,
        default: 'https://res.cloudinary.com/dnlkzlnhv/image/upload/v1757783899/profile-image_ju6q5f.png'
    }
});

export default mongoose.model("user", userSchema);