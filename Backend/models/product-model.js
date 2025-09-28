import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    image: {
        type: String, 
        required: true
    },
    name: String,
    price: Number,
    discount: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    purchaseCount: {
        type: Number,
        default: 0,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        reviewText: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        reviewImage: [{ // Changed to array of Strings
            type: String
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual property to calculate average rating
productSchema.virtual('averageRating').get(function() {
    if (this.ratings && this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
        return parseFloat((sum / this.ratings.length).toFixed(1));
    }
    return 0; // Default to 0 if no ratings
});

export default mongoose.model("product", productSchema);