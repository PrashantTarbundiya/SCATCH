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
    bgcolor: String,
    panelcolor: String,
    textcolor: String
});

export default mongoose.model("product", productSchema);