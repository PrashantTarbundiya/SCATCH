import mongoose from 'mongoose';

const ownerSchema = mongoose.Schema({
    fullname: {
        type: String,
        minLength: 3,
        trim: true
    },
    email: String,
    password: String,
    product: { // Consider changing 'product' to 'products' if it's an array of product IDs
        type: Array, // Or [mongoose.Schema.Types.ObjectId] if these are product refs
        default: []
    },
    picture: String, // This could also be a Cloudinary URL if owners have profile pictures
    gstin: String
});

export default mongoose.model("owner", ownerSchema);