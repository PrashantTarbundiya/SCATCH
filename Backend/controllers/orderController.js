import crypto from 'crypto';
import Razorpay from 'razorpay';
import razorpayInstance from '../utils/razorpay-instance.js';
import Order from '../models/order-model.js';
import User from '../models/users-model.js';
import Product from '../models/product-model.js';
import Coupon from '../models/coupon-model.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { sendOrderConfirmationEmail } from '../utils/email-service.js';

// Modern color palette
const colors = {
  primary: '#2D3436',
  secondary: '#00B894',
  accent: '#FDCB6E',
  text: '#2D3436',
  lightGray: '#DDD5D0',
  white: '#FFFFFF',
  danger: '#E17055'
};

async function generateModernInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A4',
      layout: 'portrait',
      bufferPages: true,
      info: {
        Title: `Invoice - ${order._id}`,
        Author: 'Scatch',
        Subject: 'Order Invoice'
      }
    });
    
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;

    // Modern header background
    doc.rect(0, 0, pageWidth, 120)
       .fill(colors.primary);

    // Brand logo placeholder (you'll need to replace with actual logo path)
    // doc.image('path/to/your/logo.png', margin, 25, { width: 80, height: 40 });
    
    // Company name as text (replace with logo when available)
    doc.fillColor(colors.white)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('SCATCH', margin, 35);

    // Tagline
    doc.fontSize(12)
       .font('Helvetica')
       .text('Premium Shopping Experience', margin, 70);

    // Invoice title
    doc.fillColor(colors.accent)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('INVOICE', pageWidth - 150, 35, { width: 110, align: 'right' });

    // Invoice details in header
    doc.fillColor(colors.white)
       .fontSize(10)
       .font('Helvetica')
       .text(`Invoice #${order._id.toString().slice(-8).toUpperCase()}`, pageWidth - 150, 70, { width: 110, align: 'right' })
       .text(`Date: ${order.orderDate.toLocaleDateString('en-GB')}`, pageWidth - 150, 85, { width: 110, align: 'right' });

    // Reset Y position after header
    let currentY = 150;

    // Billing section
    doc.fillColor(colors.text)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('BILL TO:', margin, currentY);

    currentY += 25;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(colors.text)
       .text(order.user.fullname || order.user.username, margin, currentY);

    currentY += 15;
    doc.text(order.user.email, margin, currentY);

    if (order.shippingAddress) {
      currentY += 15;
      doc.text(`${order.shippingAddress.street || ''}`, margin, currentY);
      currentY += 15;
      doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}`, margin, currentY);
      currentY += 15;
      doc.text(`${order.shippingAddress.country || ''}`, margin, currentY);
    }

    // Order details box
    currentY += 30;
    const boxWidth = pageWidth - 2 * margin;
    const boxHeight = 30;
    doc.rect(margin, currentY, boxWidth, boxHeight)
       .fill(colors.lightGray);

    // Calculate column widths for proper alignment
    const col1Width = boxWidth * 0.33;
    const col2Width = boxWidth * 0.33;
    const col3Width = boxWidth * 0.34;

    doc.fillColor(colors.primary)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Order ID:', margin + 10, currentY + 8, { width: col1Width - 10 })
       .text('Payment ID:', margin + col1Width, currentY + 8, { width: col2Width })
       .text('Status:', margin + col1Width + col2Width, currentY + 8, { width: col3Width });

    doc.font('Helvetica')
       .text(order.razorpayOrderId, margin + 10, currentY + 20, { width: col1Width - 10, ellipsis: true })
       .text(order.razorpayPaymentId.slice(-16), margin + col1Width, currentY + 20, { width: col2Width, ellipsis: true })
       .text('PAID', margin + col1Width + col2Width, currentY + 20, { width: col3Width });

    // Items table
    currentY += 60;
    
    // Table header
    doc.rect(margin, currentY, pageWidth - 2 * margin, 35)
       .fill(colors.secondary);

    const itemColWidth = 280;
    const qtyColWidth = 60;
    const priceColWidth = 80;
    const totalColWidth = 90;

    doc.fillColor(colors.white)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('ITEM', margin + 10, currentY + 12)
       .text('QTY', margin + itemColWidth, currentY + 12, { width: qtyColWidth, align: 'center' })
       .text('PRICE', margin + itemColWidth + qtyColWidth, currentY + 12, { width: priceColWidth, align: 'center' })
       .text('TOTAL', margin + itemColWidth + qtyColWidth + priceColWidth, currentY + 12, { width: totalColWidth, align: 'center' });

    currentY += 35;

    // Table rows
    order.items.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? colors.white : '#F8F9FA';
      const rowHeight = 35;
      
      doc.rect(margin, currentY, pageWidth - 2 * margin, rowHeight)
         .fill(rowColor);

      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica')
         .text(item.nameAtPurchase, margin + 10, currentY + 12, { width: itemColWidth - 20, ellipsis: true });

      doc.text(item.quantity.toString(), margin + itemColWidth, currentY + 12, { width: qtyColWidth, align: 'center' });
      
      doc.text(`₹${item.priceAtPurchase.toFixed(2)}`, margin + itemColWidth + qtyColWidth, currentY + 12, { width: priceColWidth, align: 'center' });
      
      doc.text(`₹${(item.quantity * item.priceAtPurchase).toFixed(2)}`, margin + itemColWidth + qtyColWidth + priceColWidth, currentY + 12, { width: totalColWidth, align: 'center' });

      currentY += rowHeight;
    });

    // Totals section
    currentY += 10;
    const totalsStartY = currentY;

    // Subtotal
    if (order.couponDiscountAmount > 0) {
      const subtotal = order.totalAmount + order.couponDiscountAmount;
      const labelX = pageWidth - margin - 230;
      const valueX = pageWidth - margin - 100;
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(colors.text)
         .text('Subtotal:', labelX, currentY, { width: 130, align: 'right' })
         .text(`₹${subtotal.toFixed(2)}`, valueX, currentY, { width: 100, align: 'right' });

      currentY += 20;

      // Coupon discount
      doc.fillColor(colors.secondary)
         .text('Coupon Discount:', labelX, currentY, { width: 130, align: 'right' })
         .text(`-₹${order.couponDiscountAmount.toFixed(2)}`, valueX, currentY, { width: 100, align: 'right' });

      currentY += 25;
    } else {
      currentY += 5;
    }

    // Total amount box - properly centered and aligned
    const totalBoxWidth = 250;
    const totalBoxX = pageWidth - margin - totalBoxWidth;
    doc.rect(totalBoxX, currentY, totalBoxWidth, 40)
       .fill(colors.primary);

    doc.fillColor(colors.white)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TOTAL AMOUNT', totalBoxX + 15, currentY + 10, { width: totalBoxWidth - 130, align: 'left' })
       .fontSize(18)
       .text(`₹${order.totalAmount.toFixed(2)}`, totalBoxX + 15, currentY + 10, { width: totalBoxWidth - 30, align: 'right' });

    // Thank you section - only if space available
    if (currentY < pageHeight - 150) {
      const footerY = Math.max(currentY + 30, pageHeight - 120);
      
      doc.rect(0, footerY, pageWidth, 120)
         .fill(colors.lightGray);

      doc.fillColor(colors.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Thank you for your business!', 0, footerY + 25, { width: pageWidth, align: 'center' });

      doc.fontSize(9)
         .font('Helvetica')
         .text('For any queries, contact us at scatchotp@gmail.com', 0, footerY + 50, { width: pageWidth, align: 'center' })
         .text('Visit us at https://scatch-livid.vercel.app', 0, footerY + 65, { width: pageWidth, align: 'center' });
    }

    doc.end();
  });
}



// Replace the old functions in your existing code
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes, items, appliedCouponCode, couponDiscount: frontendCalculatedCouponDiscount } = req.body;
    
    const orderAmount = Math.round(parseFloat(amount) * 100);

    if (!orderAmount || orderAmount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount provided." });
    }
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "No items in order." });
    }

    const options = {
      amount: orderAmount,
      currency,
      receipt: receipt || `receipt_order_${Date.now()}`,
      notes: notes || {},
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order.' });
    }

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully.',
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const verifyPaymentAndPlaceOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      totalAmount,
      shippingAddress,
      appliedCouponCode,
      couponDiscount: frontendCalculatedCouponDiscount
    } = req.body;

    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Missing required payment or order details.' });
    }

    // Verify Razorpay Signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const orderItems = items.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      nameAtPurchase: item.nameAtPurchase,
    }));

    let finalCalculatedTotal = parseFloat(totalAmount);
    let backendCalculatedCouponDiscount = 0;
    let actualAppliedCouponCode = null;

    const subtotalBeforeCoupon = orderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);

    if (appliedCouponCode) {
      const coupon = await Coupon.findOne({ code: appliedCouponCode.toUpperCase() });

      if (!coupon) {
        console.warn(`Coupon code ${appliedCouponCode} not found. Proceeding without coupon discount for order ${razorpay_order_id}.`);
      } else {
        const now = new Date();
        if (!coupon.isActive || coupon.validFrom > now || coupon.validUntil < now || (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit)) {
          console.warn(`Coupon ${appliedCouponCode} is invalid or expired for order ${razorpay_order_id}. Proceeding without discount.`);
        } else if (subtotalBeforeCoupon < coupon.minPurchaseAmount) {
          console.warn(`Order subtotal ${subtotalBeforeCoupon} for order ${razorpay_order_id} does not meet minimum purchase amount of ${coupon.minPurchaseAmount} for coupon ${appliedCouponCode}. Proceeding without discount.`);
        } else {
          if (coupon.discountType === 'percentage') {
            backendCalculatedCouponDiscount = (subtotalBeforeCoupon * coupon.discountValue) / 100;
          } else if (coupon.discountType === 'fixedAmount') {
            backendCalculatedCouponDiscount = coupon.discountValue;
          }
          backendCalculatedCouponDiscount = Math.min(backendCalculatedCouponDiscount, subtotalBeforeCoupon);

          const frontendDiscount = parseFloat(frontendCalculatedCouponDiscount) || 0;
          if (Math.abs(backendCalculatedCouponDiscount - frontendDiscount) > 0.01) {
            console.error(`CRITICAL: Coupon discount mismatch for order ${razorpay_order_id}. FE: ${frontendDiscount}, BE: ${backendCalculatedCouponDiscount}. Coupon: ${appliedCouponCode}. Subtotal: ${subtotalBeforeCoupon}`);
            backendCalculatedCouponDiscount = 0;
          } else {
            actualAppliedCouponCode = coupon.code;
          }
        }
      }
    }

    // Calculate estimated delivery date (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const newOrder = new Order({
      user: userId,
      items: orderItems,
      totalAmount: finalCalculatedTotal,
      shippingAddress,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
      orderStatus: 'Processing',
      estimatedDeliveryDate: estimatedDelivery,
      statusHistory: [{
        status: 'Processing',
        timestamp: new Date(),
        note: 'Order placed successfully'
      }],
      appliedCouponCode: actualAppliedCouponCode,
      couponDiscountAmount: backendCalculatedCouponDiscount > 0 ? backendCalculatedCouponDiscount : 0,
    });

    const savedOrder = await newOrder.save();

    if (actualAppliedCouponCode && backendCalculatedCouponDiscount > 0) {
        try {
            await Coupon.updateOne(
                { code: actualAppliedCouponCode },
                { $inc: { timesUsed: 1 } }
            );
        } catch (couponUpdateError) {
            console.error(`Failed to increment usage for coupon ${actualAppliedCouponCode} for order ${savedOrder._id}:`, couponUpdateError);
        }
    }
    
    // Update product stock and purchase count
    for (const item of savedOrder.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.error(`Product with ID ${item.product} not found during stock update for order ${savedOrder._id}`);
        continue;
      }

      if (product.quantity < item.quantity) {
        console.error(`CRITICAL: Insufficient stock for product ${product.name} (ID: ${item.product}) for order ${savedOrder._id}. Required: ${item.quantity}, Available: ${product.quantity}`);
        await Order.findByIdAndUpdate(savedOrder._id, { paymentStatus: 'failed_stock_issue', status: 'Failed - Stock Issue' });
        throw new Error(`Insufficient stock for product ${product.name}. Please contact support regarding order ${savedOrder._id}.`);
      }

      const updateResult = await Product.updateOne(
        { _id: item.product, quantity: { $gte: item.quantity } },
        {
          $inc: {
            quantity: -item.quantity,
            purchaseCount: item.quantity
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        console.error(`CRITICAL: Failed to update stock for product ${product.name} (ID: ${item.product}) due to race condition or insufficient stock for order ${savedOrder._id}.`);
        await Order.findByIdAndUpdate(savedOrder._id, { paymentStatus: 'failed_stock_issue', status: 'Failed - Stock Issue' });
        throw new Error(`Could not reserve stock for product ${product.name}. Please contact support regarding order ${savedOrder._id}.`);
      }
    }

    await savedOrder.populate('user', 'email fullname username');
    await savedOrder.populate('items.product', 'name');

    // Generate modern PDF Invoice
    const pdfBuffer = await generateModernInvoicePDF(savedOrder);

    // Send modern order confirmation email
    await sendOrderConfirmationEmail(user.email, savedOrder, pdfBuffer);

    // Clear user's cart
    if (user) {
      user.cart = [];
      await user.save();
    } else {
      console.error(`User not found when trying to clear cart for order ${savedOrder._id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Order placed successfully!',
      order: savedOrder,
    });

  } catch (error) {
    console.error('Error verifying payment and placing order:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    const orders = await Order.find({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name image price'
      })
      .sort({ orderDate: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching orders.', error: error.message });
  }
};

export const checkIfUserPurchasedProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const orders = await Order.find({
      user: userId,
      'items.product': productId,
      paymentStatus: 'paid',
    });

    if (orders.length > 0) {
      res.status(200).json({ success: true, hasPurchased: true });
    } else {
      res.status(200).json({ success: true, hasPurchased: false });
    }
  } catch (error) {
    console.error('Error checking if user purchased product:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, note } = req.body;

    const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const updateData = {
      orderStatus: status,
      $push: {
        statusHistory: {
          status,
          timestamp: new Date(),
          note: note || `Order status updated to ${status}`
        }
      }
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

    res.status(200).json({ success: true, message: 'Order status updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate({
        path: 'user',
        select: 'fullname email',
      })
      .populate({
        path: 'items.product',
        select: 'name price',
      })
      .sort({ orderDate: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching all orders for admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching all orders.', error: error.message });
  }
};