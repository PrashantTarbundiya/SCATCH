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

// Modern color palette (kept for backward compatibility if needed, though replaced in function)
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
      margin: 40,
      size: 'A4',
      layout: 'portrait',
      bufferPages: true,
      info: {
        Title: `INVOICE - ${order._id}`,
        Author: 'SCATCH',
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

    // Neo-brutalist styling constants
    const colors = {
      black: '#000000',
      white: '#FFFFFF',
      yellow: '#FFEB3B',
      blue: '#3B82F6',
      red: '#EF4444',
      gray: '#F3F4F6'
    };

    // Helper to draw a box with hard shadow
    const drawBox = (x, y, w, h, bgColor = colors.white, borderColor = colors.black, shadow = true) => {
      if (shadow) {
        doc.rect(x + 4, y + 4, w, h).fill(colors.black); // Hard shadow
      }
      doc.rect(x, y, w, h).fillAndStroke(bgColor, borderColor);
      doc.lineWidth(2).stroke(borderColor); // Thick borders
    };

    // --- Header ---
    const logoY = 40;
    doc.fontSize(36)
      .font('Helvetica-Bold')
      .fillColor(colors.black)
      .text('SCATCH', margin, logoY);

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .text('NEO-SHOPPING EXPERIENCE', margin, logoY + 35);

    // Invoice Details Box
    const invoiceBoxW = 200;
    const invoiceBoxH = 85;
    const invoiceBoxX = pageWidth - margin - invoiceBoxW;
    const invoiceBoxY = 30;

    drawBox(invoiceBoxX, invoiceBoxY, invoiceBoxW, invoiceBoxH, colors.white, colors.black, true);

    doc.fillColor(colors.black)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('INVOICE', invoiceBoxX + 15, invoiceBoxY + 15);

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .text(`#${order._id.toString().slice(-8).toUpperCase()}`, invoiceBoxX + 15, invoiceBoxY + 45)
      .text(`DATE: ${order.orderDate.toLocaleDateString('en-GB')}`, invoiceBoxX + 15, invoiceBoxY + 60);

    // --- Billing & Shipping ---
    let currentY = 140;
    const sectionW = (pageWidth - (margin * 2) - 20) / 2;

    // Bill To Section
    drawBox(margin, currentY, sectionW, 110, colors.white, colors.black, true);

    // Label Strip
    doc.rect(margin, currentY, sectionW, 25).fill(colors.black);
    doc.fillColor(colors.white)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BILL TO', margin + 10, currentY + 7);

    doc.fillColor(colors.black)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text((order.user.fullname || order.user.username).toUpperCase(), margin + 10, currentY + 35, { width: sectionW - 20, ellipsis: true });

    doc.font('Courier')
      .fontSize(10);

    // Move to next line naturally
    let billAddrY = currentY + 50;
    doc.text(order.user.email, margin + 10, billAddrY, { width: sectionW - 20 });

    // Ship To Section
    if (order.shippingAddress) {
      const shipX = margin + sectionW + 20;
      drawBox(shipX, currentY, sectionW, 110, colors.white, colors.black, true);

      doc.rect(shipX, currentY, sectionW, 25).fill(colors.black);
      doc.fillColor(colors.white)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('SHIP TO', shipX + 10, currentY + 7);

      doc.fillColor(colors.black)
        .font('Courier')
        .fontSize(10);

      // Dynamic address positioning
      let addrY = currentY + 35;
      const addrWidth = sectionW - 20;

      const street = (order.shippingAddress.street || '').toUpperCase();
      const cityState = `${(order.shippingAddress.city || '').toUpperCase()}, ${(order.shippingAddress.postalCode || '').toUpperCase()}`;
      const country = (order.shippingAddress.country || '').toUpperCase();

      doc.text(street, shipX + 10, addrY, { width: addrWidth });
      addrY += doc.heightOfString(street, { width: addrWidth }) + 2;

      doc.text(cityState, shipX + 10, addrY, { width: addrWidth });
      addrY += doc.heightOfString(cityState, { width: addrWidth }) + 2;

      doc.text(country, shipX + 10, addrY, { width: addrWidth });
    }

    // --- Order Details Banner ---
    currentY += 130;
    const detailsH = 40;
    drawBox(margin, currentY, pageWidth - (margin * 2), detailsH, colors.yellow, colors.black, true);

    const colW = (pageWidth - (margin * 2)) / 3;
    doc.fillColor(colors.black)
      .font('Helvetica-Bold')
      .fontSize(10);

    doc.text('ORDER ID', margin + 10, currentY + 8)
      .text('PAYMENT ID', margin + colW, currentY + 8)
      .text('STATUS', margin + (colW * 2), currentY + 8);

    doc.font('Courier')
      .text(order.razorpayOrderId, margin + 10, currentY + 22)
      .text(order.razorpayPaymentId.slice(-16), margin + colW, currentY + 22)
      .text('PAID', margin + (colW * 2), currentY + 22);

    // --- Items Table ---
    currentY += 60;
    const tableW = pageWidth - (margin * 2);
    const headerH = 30;

    // Header
    doc.rect(margin, currentY, tableW, headerH).fill(colors.black);

    const qtyW = 60;
    const priceW = 80;
    const totalW = 90;
    const itemW = tableW - qtyW - priceW - totalW;

    doc.fillColor(colors.white)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('ITEM', margin + 10, currentY + 10)
      .text('QTY', margin + itemW, currentY + 10, { width: qtyW, align: 'center' })
      .text('PRICE', margin + itemW + qtyW, currentY + 10, { width: priceW, align: 'center' })
      .text('TOTAL', margin + itemW + qtyW + priceW, currentY + 10, { width: totalW, align: 'center' });

    currentY += headerH;

    // Rows
    order.items.forEach((item) => {
      const rowH = 40;

      // Row Box Outline
      doc.rect(margin, currentY, tableW, rowH).stroke(colors.black);

      // Vertical Dividers
      doc.moveTo(margin + itemW, currentY).lineTo(margin + itemW, currentY + rowH).stroke();
      doc.moveTo(margin + itemW + qtyW, currentY).lineTo(margin + itemW + qtyW, currentY + rowH).stroke();
      doc.moveTo(margin + itemW + qtyW + priceW, currentY).lineTo(margin + itemW + qtyW + priceW, currentY + rowH).stroke();

      doc.fillColor(colors.black)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(item.nameAtPurchase.toUpperCase(), margin + 10, currentY + 15, { width: itemW - 20, ellipsis: true });

      doc.font('Courier')
        .text(item.quantity.toString(), margin + itemW, currentY + 15, { width: qtyW, align: 'center' })
        .text(`Rs.${item.priceAtPurchase.toFixed(2)}`, margin + itemW + qtyW, currentY + 15, { width: priceW, align: 'center' })
        .text(`Rs.${(item.quantity * item.priceAtPurchase).toFixed(2)}`, margin + itemW + qtyW + priceW, currentY + 15, { width: totalW, align: 'center' });

      currentY += rowH;
    });

    // --- Totals ---
    currentY += 20;
    const totalsW = 250;
    const totalsX = pageWidth - margin - totalsW;

    // Subtotal & Discount
    if (order.couponDiscountAmount > 0) {
      doc.font('Helvetica-Bold')
        .fontSize(10)
        .text('SUBTOTAL:', totalsX, currentY, { width: 100, align: 'right' });
      doc.font('Courier')
        .text(`Rs.${(order.totalAmount + order.couponDiscountAmount).toFixed(2)}`, totalsX + 110, currentY, { width: 130, align: 'right' });

      currentY += 20;

      doc.fillColor(colors.red)
        .font('Helvetica-Bold')
        .text('DISCOUNT:', totalsX, currentY, { width: 100, align: 'right' });
      doc.fillColor(colors.black)
        .font('Courier')
        .text(`-Rs.${order.couponDiscountAmount.toFixed(2)}`, totalsX + 110, currentY, { width: 130, align: 'right' });

      currentY += 30;
    }

    // Grand Total
    drawBox(totalsX, currentY, totalsW, 50, colors.yellow, colors.black, true);

    doc.fillColor(colors.black)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('TOTAL AMOUNT', totalsX + 15, currentY + 18)
      .fontSize(18)
      .text(`Rs.${order.totalAmount.toFixed(2)}`, totalsX + 15, currentY + 15, { width: totalsW - 30, align: 'right' });

    // --- Footer ---
    const footerY = pageHeight - 80;

    doc.rect(0, footerY, pageWidth, 80).fill(colors.black);

    doc.fillColor(colors.white)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('THANK YOU FOR YOUR ORDER', 0, footerY + 25, { align: 'center' });

    doc.fontSize(10)
      .font('Courier')
      .text('scatchotp@gmail.com', 0, footerY + 45, { align: 'center' });

    doc.fillColor(colors.blue)
      .text('https://scatch-livid.vercel.app', 0, footerY + 60, {
        align: 'center',
        link: 'https://scatch-livid.vercel.app',
        underline: true
      });

    doc.end();
  });
}

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
