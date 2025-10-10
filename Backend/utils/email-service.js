import axios from 'axios';

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmail = async (to, subject, html, attachments = []) => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { email: process.env.EMAIL_USER, name: 'Scatch' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        attachment: attachments.length > 0 ? attachments.map(att => ({
          name: att.filename,
          content: att.content.toString('base64')
        })) : undefined
      }, {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('Email sending error:', error.response?.data || error.message);
        return { success: false, error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Registration OTP Email
export const sendRegistrationOTPEmail = async (email, otp, fullName) => {
  const subject = '🔐 Your Scatch Registration OTP';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration OTP</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2D3436; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #2D3436, #636e72); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 700;">SCATCH</h1>
            <p style="color: #ddd5d0; margin: 5px 0 0 0; font-size: 12px;">Premium Shopping Experience</p>
        </div>
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; margin-top: -15px; position: relative; z-index: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #00B894, #00A085); color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px;">
                    🔐 Registration OTP
                </div>
            </div>
            <h2 style="color: #2D3436; text-align: center; margin: 0 0 20px 0; font-size: 20px;">Complete Your Registration</h2>
            <p style="color: #636e72; text-align: center; margin: 0 0 25px 0;">Enter this OTP to verify your email and create your Scatch account:</p>
            <div style="background: linear-gradient(135deg, #2D3436, #636e72); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <div style="font-size: 12px; margin-bottom: 10px; opacity: 0.8;">Your OTP Code</div>
                <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; font-family: monospace; text-align: center; white-space: nowrap;">
                    ${otp.split('').map(digit => `<span style="background: rgba(255,255,255,0.2); padding: 4px 6px; border-radius: 5px; display: inline-block; margin: 0 1.5px;">${digit}</span>`).join('')}
                </div>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #856404; font-size: 14px;">⏰ This OTP expires in <strong>2 minutes</strong></p>
            </div>
            <p style="color: #636e72; font-size: 14px; text-align: center; margin: 20px 0;">If you didn't request this registration, please ignore this email.</p>
        </div>
        <div style="background: #2D3436; color: white; padding: 20px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2025 Scatch. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Password Reset OTP Email
export const sendOTPEmail = async (email, otp, fullName) => {
  const subject = '🔒 Reset Your Scatch Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2D3436; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #2D3436, #636e72); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 700;">SCATCH</h1>
            <p style="color: #ddd5d0; margin: 5px 0 0 0; font-size: 12px;">Premium Shopping Experience</p>
        </div>
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; margin-top: -15px; position: relative; z-index: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #E17055, #D63031); color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px;">
                    🔒 Password Reset
                </div>
            </div>
            <h2 style="color: #2D3436; text-align: center; margin: 0 0 10px 0; font-size: 20px;">Hello ${fullName}!</h2>
            <p style="color: #636e72; text-align: center; margin: 0 0 25px 0;">We received a request to reset your Scatch account password. Use this OTP to proceed:</p>
            <div style="background: linear-gradient(135deg, #E17055, #D63031); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <div style="font-size: 12px; margin-bottom: 10px; opacity: 0.8;">Your Reset OTP</div>
                <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; font-family: monospace; text-align: center; white-space: nowrap;">
                    ${otp.split('').map(digit => `<span style="background: rgba(255,255,255,0.2); padding: 4px 6px; border-radius: 5px; display: inline-block; margin: 0 1.5px;">${digit}</span>`).join('')}
                </div>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #856404; font-size: 14px;">⏰ This OTP expires in <strong>10 minutes</strong></p>
            </div>
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px; text-align: center;">🛡️ If you didn't request this password reset, please ignore this email or contact our support team if you have security concerns.</p>
            </div>
        </div>
        <div style="background: #2D3436; color: white; padding: 20px; text-align: center; margin-top: 20px;">
            <p style="margin: 0 0 10px 0; font-size: 14px;">Need help? Contact us at <a href="mailto:support@scatch.com" style="color: #FDCB6E; text-decoration: none;">support@scatch.com</a></p>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2025 Scatch. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Password Reset Confirmation Email
export const sendPasswordResetConfirmationEmail = async (email, fullName) => {
  const subject = '✅ Password Reset Successful - Scatch';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2D3436; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #2D3436, #636e72); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 700;">SCATCH</h1>
            <p style="color: #ddd5d0; margin: 5px 0 0 0; font-size: 12px;">Premium Shopping Experience</p>
        </div>
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; margin-top: -15px; position: relative; z-index: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #00B894, #00A085); color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px;">
                    ✅ Password Reset Complete
                </div>
            </div>
            <h2 style="color: #2D3436; text-align: center; margin: 0 0 10px 0; font-size: 20px;">Hello ${fullName}!</h2>
            <p style="color: #636e72; text-align: center; margin: 0 0 25px 0;">Your Scatch account password has been successfully reset. You can now log in with your new password.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URI || 'http://localhost:3000'}/login" 
                   style="background: linear-gradient(135deg, #2D3436, #636e72); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Login to Your Account
                </a>
            </div>
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #0c5460; font-size: 14px; text-align: center;">🔐 For your security, we recommend using a strong, unique password and enabling two-factor authentication if available.</p>
            </div>
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px; text-align: center;">⚠️ If you didn't reset your password, please contact our support team immediately.</p>
            </div>
        </div>
        <div style="background: #2D3436; color: white; padding: 20px; text-align: center; margin-top: 20px;">
            <p style="margin: 0 0 10px 0; font-size: 14px;">Need help? Contact us at <a href="mailto:support@scatch.com" style="color: #FDCB6E; text-decoration: none;">support@scatch.com</a></p>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2025 Scatch. All rights reserved.</p>
        </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

// Order Confirmation Email with Invoice
export const sendOrderConfirmationEmail = async (userEmail, order, pdfBuffer) => {
  let itemListHtml = '';
  order.items.forEach(item => {
    itemListHtml += `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px 16px; color: #2D3436;">${item.nameAtPurchase}</td>
        <td style="padding: 12px 16px; text-align: center; color: #2D3436;">${item.quantity}</td>
        <td style="padding: 12px 16px; text-align: right; color: #2D3436;">₹${item.priceAtPurchase.toFixed(2)}</td>
        <td style="padding: 12px 16px; text-align: right; color: #2D3436; font-weight: 600;">₹${(item.priceAtPurchase * item.quantity).toFixed(2)}</td>
      </tr>
    `;
  });

  const couponSection = order.couponDiscountAmount > 0 ? `
    <div style="background: linear-gradient(135deg, #00B894, #00A085); padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="color: white; margin: 0; font-size: 16px;">🎉 You saved ₹${order.couponDiscountAmount.toFixed(2)} with coupon!</h3>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Coupon code: ${order.appliedCouponCode}</p>
    </div>
  ` : '';

  const subject = `🛍️ Order Confirmed - Your Scatch Purchase #${order._id.toString().slice(-8).toUpperCase()}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #2D3436; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #2D3436, #636e72); padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h1 style="color: white; font-size: 32px; margin: 0; font-weight: 700;">SCATCH</h1>
          <p style="color: #ddd5d0; margin: 8px 0 0 0; font-size: 14px;">Premium Shopping Experience</p>
        </div>
      </div>
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; margin-top: -20px; position: relative; z-index: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <div style="text-align: center; padding: 30px 30px 20px 30px;">
          <div style="background: linear-gradient(135deg, #00B894, #00A085); color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px;">
            ✅ Order Confirmed!
          </div>
          <h2 style="color: #2D3436; margin: 20px 0 10px 0; font-size: 24px;">Thank you for your purchase!</h2>
          <p style="color: #636e72; margin: 0; font-size: 16px;">Your order has been successfully placed and confirmed.</p>
        </div>
        <div style="padding: 0 30px 30px 30px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <strong style="color: #2D3436;">Order ID:</strong>
                  <br><span style="color: #636e72; font-family: monospace;">#${order._id.toString().slice(-8).toUpperCase()}</span>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                  <strong style="color: #2D3436;">Order Date:</strong>
                  <br><span style="color: #636e72;">${order.orderDate.toLocaleDateString('en-GB')}</span>
                </td>
              </tr>
            </table>
          </div>
          ${couponSection}
          <div style="margin: 25px 0;">
            <h3 style="color: #2D3436; margin-bottom: 15px; font-size: 18px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #2D3436, #636e72);">
                  <th style="padding: 16px; text-align: left; color: white; font-weight: 600;">Item</th>
                  <th style="padding: 16px; text-align: center; color: white; font-weight: 600;">Qty</th>
                  <th style="padding: 16px; text-align: right; color: white; font-weight: 600;">Price</th>
                  <th style="padding: 16px; text-align: right; color: white; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody style="background: white;">
                ${itemListHtml}
              </tbody>
            </table>
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <table style="margin: 0 auto;">
              <tr>
                <td>
                  <div style="background: linear-gradient(135deg, #2D3436, #636e72); color: white; padding: 20px; border-radius: 8px; min-width: 200px; text-align: center;">
                    <div style="font-size: 16px; margin-bottom: 8px;">Total Amount Paid</div>
                    <div style="font-size: 28px; font-weight: 700;">₹${order.totalAmount.toFixed(2)}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #2D3436; margin: 0 0 15px 0; font-size: 16px;">📦 Shipping Address</h3>
            <div style="color: #636e72; line-height: 1.6;">
              ${order.shippingAddress.street || ''}<br>
              ${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}<br>
              ${order.shippingAddress.country || ''}
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #FDCB6E, #F39C12); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <h3 style="color: white; margin: 0 0 10px 0; font-size: 18px;">What's Next?</h3>
            <p style="color: white; margin: 0; opacity: 0.95;">We'll send you tracking information once your order ships. Your invoice is attached to this email.</p>
          </div>
        </div>
        <div style="background: #2D3436; color: white; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
          <h3 style="margin: 0 0 15px 0; font-size: 20px;">Thank you for choosing Scatch!</h3>
          <p style="margin: 0 0 15px 0; opacity: 0.8;">Need help? Contact us at <a href="mailto:support@scatch.com" style="color: #FDCB6E; text-decoration: none;">support@scatch.com</a></p>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; color: #636e72; font-size: 12px;">
        <p style="margin: 0;">This is an automated email. Please do not reply directly to this message.</p>
      </div>
    </body>
    </html>
  `;

  const attachments = [{
    filename: `scatch-invoice-${order._id.toString().slice(-8).toUpperCase()}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }];

  return await sendEmail(userEmail, subject, html, attachments);
};
