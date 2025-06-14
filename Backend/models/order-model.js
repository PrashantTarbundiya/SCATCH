import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product', // Changed from 'Product' to match the registered model name
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtPurchase: { // Store the price at the time of purchase
    type: Number,
    required: true,
  },
  nameAtPurchase: { // Store the name at the time of purchase
    type: String,
    required: true,
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Changed from 'User' to match the registered model name
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingAddress: { // You might want to add more address fields
    street: String,
    city: String,
    postalCode: String,
    country: String,
  },
  razorpayOrderId: {
    type: String,
    // required: true, // Will be set after order creation with Razorpay
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);