import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product', 
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtPurchase: { 
    type: Number,
    required: true,
  },
  nameAtPurchase: { 
    type: String,
    required: true,
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  appliedCouponCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
  },
  couponDiscountAmount: {
    type: Number,
    default: 0,
  },
  shippingAddress: { 
    street: String,
    city: String,
    postalCode: String,
    country: String,
  },
  razorpayOrderId: {
    type: String,
    // required: true,
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