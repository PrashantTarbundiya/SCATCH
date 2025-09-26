import mongoose from 'mongoose';

const priceHistorySchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true
    },
    oldPrice: {
        type: Number,
        required: true
    },
    newPrice: {
        type: Number,
        required: true
    },
    changePercentage: {
        type: Number,
        required: true
    }
}, { timestamps: true });

export default mongoose.model("priceHistory", priceHistorySchema);