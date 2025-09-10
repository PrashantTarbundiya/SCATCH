import mongoose from 'mongoose';

const ownerSchema = mongoose.Schema({
    fullname: {
        type: String,
        minLength: 3,
        trim: true
    },
    email: String,
    password: String,
    product: { 
        type: Array, 
        default: []
    },
    picture: String
});

export default mongoose.model("owner", ownerSchema);