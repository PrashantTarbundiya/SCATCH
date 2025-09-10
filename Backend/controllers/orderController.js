import crypto from 'crypto';
import Razorpay from 'razorpay'; // Required for Razorpay.validateWebhookSignature
import razorpayInstance from '../utils/razorpay-instance.js';
import Order from '../models/order-model.js';
import User from '../models/users-model.js'; // To get user email
import Product from '../models/product-model.js'; // To potentially update stock or verify
import Coupon from '../models/coupon-model.js'; // Import Coupon model
import nodemailer from 'nodemailer'; // Added for direct use
import PDFDocument from 'pdfkit';
import fs from 'fs'; // For temporarily saving PDF if needed

// Define a transporter specifically for order emails, similar to authController
const orderEmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Ensure GMAIL_USER is in .env
        pass: process.env.GMAIL_APP_PASS, // Ensure GMAIL_APP_PASS is in .env
    },
    tls: {
        rejectUnauthorized: false // As used in your authController
    }
});

// --- Helper function placeholders (to be implemented) ---
async function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' }); // Reduced margin
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Invoice Header
    doc
      .fontSize(18) // Reduced font size
      .text('INVOICE', { align: 'center' })
      .moveDown(0.3); // Reduced spacing

    // Company & Client Details (Example)
    doc.fontSize(9); // Reduced font size
    doc.text('Scatch', { align: 'left' }); // Changed company name
    // Removed company address line
    doc.moveDown(0.3); // Reduced spacing
    doc.text(`Invoice ID: ${order._id}`, { align: 'left' });
    doc.text(`Order Date: ${order.orderDate.toLocaleDateString()}`, { align: 'left' });
    doc.text(`Razorpay Order ID: ${order.razorpayOrderId}`, { align: 'left' });
    doc.moveDown(0.5); // Reduced spacing

    doc.text('Bill To:', { align: 'left' });
    doc.text(order.user.fullname || order.user.username, { align: 'left' }); // Assuming user has fullname or username
    doc.text(order.user.email, { align: 'left' });
    if (order.shippingAddress) {
      doc.text(`${order.shippingAddress.street || ''}`, { align: 'left' });
      doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}`, { align: 'left' });
      doc.text(`${order.shippingAddress.country || ''}`, { align: 'left' });
    }
    doc.moveDown(1); // Reduced spacing

    // Table Header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(10); // Kept font size for table header
    doc.text('Item', 30, tableTop); // Adjusted X for reduced margin
    doc.text('Quantity', 230, tableTop, { width: 90, align: 'right' }); // Adjusted X
    doc.text('Price', 330, tableTop, { width: 90, align: 'right' }); // Adjusted X
    doc.text('Total', 430, tableTop, { width: 90, align: 'right' }); // Adjusted X
    doc.font('Helvetica').fontSize(9); // Set font size for table rows
    doc.moveDown(0.5); // Reduced spacing
    const headerBottom = doc.y;
    doc.lineCap('butt').moveTo(30, headerBottom).lineTo(doc.page.width - 30, headerBottom).stroke(); // Adjusted X for reduced margin


    // Table Rows
    let yPosition = headerBottom + 5; // Reduced spacing
    order.items.forEach(item => {
      doc.text(item.nameAtPurchase, 30, yPosition, { width: 190 }); // Adjusted X and width
      doc.text(item.quantity.toString(), 230, yPosition, { width: 90, align: 'right' }); // Adjusted X
      doc.text(item.priceAtPurchase.toFixed(2), 330, yPosition, { width: 90, align: 'right' }); // Adjusted X
      doc.text((item.quantity * item.priceAtPurchase).toFixed(2), 430, yPosition, { width: 90, align: 'right' }); // Adjusted X
      yPosition += 15; // Reduced spacing
      // Removed pagination logic: if (yPosition > 700) ...
    });
    const itemsBottom = yPosition - 5; // Adjusted itemsBottom based on new yPosition logic
    doc.lineCap('butt').moveTo(30, itemsBottom).lineTo(doc.page.width - 30, itemsBottom).stroke(); // Adjusted X
    doc.moveDown(0.5); // Reduced spacing


    // Total
    doc.font('Helvetica-Bold').fontSize(10); // Set font size for Total
    const yPosForTotal = doc.y + 5; // Reduced spacing

    // "Total Amount:" label on the left
    doc.text('Total Amount:', 30, yPosForTotal, { width: 380, align: 'left' }); // Adjusted X

    // "INR XXX.XX" value on the right, aligned with the item totals column
    doc.text(`INR ${order.totalAmount.toFixed(2)}`, 430, yPosForTotal, { width: 90, align: 'right' }); // Adjusted X
    
    doc.font('Helvetica').fontSize(9); // Reset font size
    // doc.y is automatically advanced by the text calls. Add extra space if needed.
    doc.y = yPosForTotal + doc.heightOfString('Total Amount:') + 2; // Reduced spacing
    doc.moveDown(0.5); // Reduced spacing

    // Footer - Positioned dynamically at the bottom
    const footerY = doc.page.height - doc.page.margins.bottom - 10; // 10 for font size + small buffer
    doc.fontSize(7).text('Thank you for your business!', 30, footerY, { align: 'center', width: doc.page.width - 60 }); // Adjusted X and width

    doc.end();
  });
}

async function sendOrderConfirmationEmail(userEmail, order, pdfBuffer) {
  try {
    let itemListHtml = '<ul>';
    order.items.forEach(item => {
      itemListHtml += `<li>${item.nameAtPurchase} (Qty: ${item.quantity}) - INR ${(item.priceAtPurchase * item.quantity).toFixed(2)}</li>`;
    });
    itemListHtml += '</ul>';

    const mailOptions = {
      from: `"Scatch App" <${process.env.GMAIL_USER}>`, // Changed sender name
      to: userEmail,
      subject: `Your Order Confirmation - #${order._id}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Your order with ID #${order._id} has been successfully placed.</p>
        <h2>Order Summary:</h2>
        ${itemListHtml}
        <p><strong>Total Amount: INR ${order.totalAmount.toFixed(2)}</strong></p>
        <p>Your invoice is attached.</p>
        <p>Shipping Address:</p>
        <p>
          ${order.shippingAddress.street || ''}<br>
          ${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}<br>
          ${order.shippingAddress.country || ''}
        </p>
        <p>Thank you for shopping with us!</p>
      `,
      attachments: [
        {
          filename: `invoice-${order._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };
    // Verify transporter before sending (optional, but good for debugging)
    try {
        await orderEmailTransporter.verify();
        // console.log('Order email transporter verified and ready.');
    } catch (verifyError) {
        console.error('Error verifying order email transporter:', verifyError);
        // Potentially throw or handle this error to prevent trying to send mail with a misconfigured transporter
        // For now, we'll let it proceed and fail at sendMail if not configured.
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
        console.error("CRITICAL: GMAIL_USER or GMAIL_APP_PASS not found for order confirmation email.");
        // Do not attempt to send email if config is missing
        // This error should ideally be caught earlier or handled more gracefully
        throw new Error("Order email service is not configured correctly on the server.");
    }

    await orderEmailTransporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Decide if this error should fail the whole process or just be logged
  }
}
// --- ---

export const createRazorpayOrder = async (req, res) => {
  try {
    // amount here is the FINAL amount after frontend-calculated coupon discount
    const { amount, currency = 'INR', receipt, notes, items, appliedCouponCode, couponDiscount: frontendCalculatedCouponDiscount } = req.body;
    
    // Amount should be in the smallest currency unit (e.g., paise for INR)
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
      receipt: receipt || `receipt_order_${Date.now()}`, // Optional: A unique receipt ID
      notes: notes || {}, // Optional: Any notes you want to add
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    if (!razorpayOrder) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order.' });
    }

    // Optionally, you could create a 'pending' order in your DB here
    // or wait until payment verification. For now, we just return Razorpay order details.

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully.',
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // Amount in paise
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Send key to frontend for Razorpay checkout
      // You might want to send product names/details for the Razorpay checkout display if needed
      // For example, by fetching product details based on 'items' from req.body
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
      items, // Array of { productId, quantity, priceAtPurchase, nameAtPurchase }
      totalAmount, // Final total amount calculated on frontend (after coupon)
      shippingAddress, // { street, city, postalCode, country }
      appliedCouponCode, // Sent from frontend
      couponDiscount: frontendCalculatedCouponDiscount // Sent from frontend
    } = req.body;

    const userId = req.user.id; // Assuming isLoggedIn middleware adds user to req

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Missing required payment or order details.' });
    }

    // 1. Verify Razorpay Signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // 2. Payment is verified, now create and save the order in your database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Map frontend items to the orderItemSchema structure
    const orderItems = items.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase, // This is price per unit *after product's own discount*, before coupon
      nameAtPurchase: item.nameAtPurchase,
    }));

    let finalCalculatedTotal = parseFloat(totalAmount); // This is the amount paid by user
    let backendCalculatedCouponDiscount = 0;
    let actualAppliedCouponCode = null;

    // Calculate subtotal before any coupon, based on items received
    const subtotalBeforeCoupon = orderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);

    if (appliedCouponCode) {
      const coupon = await Coupon.findOne({ code: appliedCouponCode.toUpperCase() });

      if (!coupon) {
        // Coupon code from frontend not found, proceed without coupon or error out
        console.warn(`Coupon code ${appliedCouponCode} not found. Proceeding without coupon discount for order ${razorpay_order_id}.`);
        // Optionally, you could fail the order here if coupon integrity is paramount
        // return res.status(400).json({ success: false, message: `Invalid coupon code: ${appliedCouponCode} provided.` });
      } else {
        // Validate coupon
        const now = new Date();
        if (!coupon.isActive || coupon.validFrom > now || coupon.validUntil < now || (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit)) {
          console.warn(`Coupon ${appliedCouponCode} is invalid or expired for order ${razorpay_order_id}. Proceeding without discount.`);
        } else if (subtotalBeforeCoupon < coupon.minPurchaseAmount) {
          console.warn(`Order subtotal ${subtotalBeforeCoupon} for order ${razorpay_order_id} does not meet minimum purchase amount of ${coupon.minPurchaseAmount} for coupon ${appliedCouponCode}. Proceeding without discount.`);
        } else {
          // Coupon is valid and applicable, calculate discount on backend
          if (coupon.discountType === 'percentage') {
            backendCalculatedCouponDiscount = (subtotalBeforeCoupon * coupon.discountValue) / 100;
          } else if (coupon.discountType === 'fixedAmount') {
            backendCalculatedCouponDiscount = coupon.discountValue;
          }
          backendCalculatedCouponDiscount = Math.min(backendCalculatedCouponDiscount, subtotalBeforeCoupon); // Cannot be more than subtotal

          // CRITICAL: Compare backend calculated discount with frontend calculated discount
          const frontendDiscount = parseFloat(frontendCalculatedCouponDiscount) || 0;
          if (Math.abs(backendCalculatedCouponDiscount - frontendDiscount) > 0.01) { // Tolerance for floating point
            console.error(`CRITICAL: Coupon discount mismatch for order ${razorpay_order_id}. FE: ${frontendDiscount}, BE: ${backendCalculatedCouponDiscount}. Coupon: ${appliedCouponCode}. Subtotal: ${subtotalBeforeCoupon}`);
            // This is a serious issue. Decide how to handle:
            // 1. Reject the order
            // 2. Proceed without coupon
            // 3. Log and alert admin
            // For now, let's proceed without the coupon and log an error.
            // A stricter system might reject the order.
            backendCalculatedCouponDiscount = 0; // Override with no discount due to mismatch
            // Or throw new Error('Coupon discount calculation mismatch.');
          } else {
            actualAppliedCouponCode = coupon.code; // Confirm this coupon will be applied
          }
        }
      }
    }
    
    // The `totalAmount` from frontend should already reflect the coupon discount.
    // We are re-calculating here for verification and to store the correct discount amount.
    // The final amount charged by Razorpay is `totalAmount`.
    // The `totalAmount` stored in the order should be this final charged amount.

    const newOrder = new Order({
      user: userId,
      items: orderItems,
      totalAmount: finalCalculatedTotal, // This is the amount user actually paid
      shippingAddress,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
      appliedCouponCode: actualAppliedCouponCode,
      couponDiscountAmount: backendCalculatedCouponDiscount > 0 ? backendCalculatedCouponDiscount : 0,
    });

    const savedOrder = await newOrder.save();

    // If a coupon was successfully applied and validated on backend, increment its usage
    if (actualAppliedCouponCode && backendCalculatedCouponDiscount > 0) {
        try {
            await Coupon.updateOne(
                { code: actualAppliedCouponCode },
                { $inc: { timesUsed: 1 } }
            );
        } catch (couponUpdateError) {
            console.error(`Failed to increment usage for coupon ${actualAppliedCouponCode} for order ${savedOrder._id}:`, couponUpdateError);
            // Log this error, but the order is already placed.
        }
    }
    
    // 3. Update product stock and purchase count
    for (const item of savedOrder.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        // This should ideally not happen if product IDs are validated before order creation
        console.error(`Product with ID ${item.product} not found during stock update for order ${savedOrder._id}`);
        // Decide on error handling: rollback order? mark as issue?
        // For now, we'll log and continue, but this is a critical point.
        continue;
      }

      if (product.quantity < item.quantity) {
        // VERY CRITICAL: Stock is insufficient. This indicates a race condition or earlier check failure.
        // This order should ideally be invalidated or put on hold.
        // This is a simplified handling. A robust system would use transactions or more complex checks.
        console.error(`CRITICAL: Insufficient stock for product ${product.name} (ID: ${item.product}) for order ${savedOrder._id}. Required: ${item.quantity}, Available: ${product.quantity}`);
        // TODO: Implement rollback logic or alert system.
        // For now, we'll throw an error to prevent further processing of this order as fully successful.
        // This will be caught by the main try-catch block.
        // Before throwing, consider if the order should be marked as 'failed' or 'pending_stock_check'.
        await Order.findByIdAndUpdate(savedOrder._id, { paymentStatus: 'failed_stock_issue', status: 'Failed - Stock Issue' });
        throw new Error(`Insufficient stock for product ${product.name}. Please contact support regarding order ${savedOrder._id}.`);
      }

      // Atomic update to decrement quantity and increment purchaseCount
      const updateResult = await Product.updateOne(
        { _id: item.product, quantity: { $gte: item.quantity } }, // Ensure stock is still available
        {
          $inc: {
            quantity: -item.quantity,
            purchaseCount: item.quantity // Increment purchase count by quantity sold
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        // This means the stock was not sufficient at the exact moment of update (race condition)
        console.error(`CRITICAL: Failed to update stock for product ${product.name} (ID: ${item.product}) due to race condition or insufficient stock for order ${savedOrder._id}.`);
        // TODO: Implement rollback logic for the entire order or for this item.
        await Order.findByIdAndUpdate(savedOrder._id, { paymentStatus: 'failed_stock_issue', status: 'Failed - Stock Issue' });
        throw new Error(`Could not reserve stock for product ${product.name}. Please contact support regarding order ${savedOrder._id}.`);
      }
    }

    await savedOrder.populate('user', 'email fullname username');
    await savedOrder.populate('items.product', 'name');

    // 4. Generate PDF Invoice
    const pdfBuffer = await generateInvoicePDF(savedOrder);

    // 5. Send Order Confirmation Email with PDF Invoice
    await sendOrderConfirmationEmail(user.email, savedOrder, pdfBuffer);

    // 6. Clear user's cart
    if (user) { // Ensure user object is available
      user.cart = []; // Empty the cart array
      await user.save(); // Save the user document with the empty cart
      // console.log(`Cart cleared for user: ${user._id}`);
    } else {
      // This case should ideally not happen if user was fetched successfully earlier
      console.error(`User not found when trying to clear cart for order ${savedOrder._id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Order placed successfully!',
      order: savedOrder,
    });

  } catch (error) {
    console.error('Error verifying payment and placing order:', error);
    // If order was saved but email/pdf failed, you might need a retry mechanism or manual intervention
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming isLoggedIn middleware provides req.user._id
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    const orders = await Order.find({ user: userId })
      .populate({
        path: 'items.product', // Populate the product details within each item
        select: 'name image price' // Select specific fields you want from the product
        // Add other fields if needed, e.g., 'image'
      })
      .sort({ orderDate: -1 }); // Sort by most recent order first

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
      paymentStatus: 'paid', // Ensure the order was actually paid for
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

export const getAllOrdersForAdmin = async (req, res) => {
  try {
    // Assuming an admin check middleware has already run if this is a protected route
    const orders = await Order.find({})
      .populate({
        path: 'user',
        select: 'fullname email', // Select specific fields from the user
      })
      .populate({
        path: 'items.product',
        select: 'name price', // Select specific fields from the product
      })
      .sort({ orderDate: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching all orders for admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching all orders.', error: error.message });
  }
};