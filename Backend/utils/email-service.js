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
    <body style="font-family: 'Courier New', Courier, monospace; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f0f0f0;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border: 4px solid #000000; box-shadow: 12px 12px 0 #000000;">
            <!-- Header -->
            <div style="background-color: #000000; padding: 30px 20px; text-align: center; border-bottom: 4px solid #000000;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">SCATCH</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #000000; text-align: center; margin: 0 0 20px 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">
                    Registration OTP
                </h2>
                <div style="width: 50px; height: 4px; background: #000000; margin: 0 auto 30px auto;"></div>
                
                <p style="color: #000000; text-align: center; margin: 0 0 30px 0; font-weight: 600; font-size: 16px;">
                    Enter the code below to complete your registration:
                </p>

                <!-- OTP Box -->
                <div style="background-color: #a855f7; border: 4px solid #000000; padding: 20px; text-align: center; margin: 30px 0; box-shadow: 6px 6px 0 #000000;">
                    <div style="font-size: 14px; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; color: #ffffff;">Your One-Time Password</div>
                    <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; text-shadow: 3px 3px 0 #000000;">
                        ${otp}
                    </div>
                </div>

                <div style="background: #fff000; border: 2px solid #000000; padding: 15px; margin: 30px 0; text-align: center;">
                    <p style="margin: 0; color: #000000; font-weight: 700; font-size: 14px; text-transform: uppercase;">
                        ⚠️ Expires in 2 minutes
                    </p>
                </div>
                
                <p style="color: #666666; font-size: 12px; text-align: center; margin-top: 30px; font-weight: 600;">
                    If you didn't request this, simply ignore this email.
                </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 4px solid #000000; background: #f0f0f0; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">© 2025 Scatch Inc.</p>
            </div>
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
    <body style="font-family: 'Courier New', Courier, monospace; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f0f0f0;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border: 4px solid #000000; box-shadow: 12px 12px 0 #000000;">
            <!-- Header -->
            <div style="background-color: #000000; padding: 30px 20px; text-align: center; border-bottom: 4px solid #000000;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">SCATCH</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #000000; text-align: center; margin: 0 0 20px 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">
                    Password Reset
                </h2>
                <div style="width: 50px; height: 4px; background: #000000; margin: 0 auto 30px auto;"></div>

                <p style="color: #000000; text-align: center; margin: 0 0 10px 0; font-weight: 700; font-size: 18px;">
                    HELLO ${fullName.toUpperCase()}!
                </p>
                <p style="color: #000000; text-align: center; margin: 0 0 30px 0; font-weight: 600; font-size: 16px;">
                    Use the OTP below to reset your password:
                </p>

                <!-- OTP Box -->
                <div style="background-color: #ef4444; border: 4px solid #000000; padding: 20px; text-align: center; margin: 30px 0; box-shadow: 6px 6px 0 #000000;">
                    <div style="font-size: 14px; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; color: #ffffff;">Reset Code</div>
                    <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; text-shadow: 3px 3px 0 #000000;">
                        ${otp}
                    </div>
                </div>

                <div style="background: #fff000; border: 2px solid #000000; padding: 15px; margin: 30px 0; text-align: center;">
                    <p style="margin: 0; color: #000000; font-weight: 700; font-size: 14px; text-transform: uppercase;">
                        ⏰ Expires in 10 minutes
                    </p>
                </div>
                
                <div style="border: 2px dashed #000000; padding: 15px; background: #f0f0f0; margin-top: 30px;">
                    <p style="color: #000000; font-size: 12px; text-align: center; margin: 0; font-weight: 600;">
                        If you didn't request a password reset, please contact support immediately.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 4px solid #000000; background: #f0f0f0; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">© 2025 Scatch Inc.</p>
            </div>
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
    <body style="font-family: 'Courier New', Courier, monospace; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f0f0f0;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border: 4px solid #000000; box-shadow: 12px 12px 0 #000000;">
            <!-- Header -->
            <div style="background-color: #000000; padding: 30px 20px; text-align: center; border-bottom: 4px solid #000000;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">SCATCH</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #000000; text-align: center; margin: 0 0 20px 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">
                    Password Reset!
                </h2>
                <div style="width: 50px; height: 4px; background: #000000; margin: 0 auto 30px auto;"></div>

                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background: #22c55e; border: 3px solid #000000; color: #ffffff; width: 60px; height: 60px; line-height: 60px; font-size: 30px; border-radius: 50%;">
                        ✓
                    </div>
                </div>

                <p style="color: #000000; text-align: center; margin: 0 0 10px 0; font-weight: 700; font-size: 18px;">
                    HELLO ${fullName.toUpperCase()}!
                </p>
                <p style="color: #000000; text-align: center; margin: 0 0 30px 0; font-weight: 600; font-size: 16px;">
                    Your Scatch password has been successfully reset.
                </p>

                <div style="text-align: center; margin: 40px 0;">
                    <a href="${process.env.FRONTEND_URI || 'http://localhost:3000'}/login" 
                       style="background: #3b82f6; color: #ffffff; padding: 15px 30px; text-decoration: none; border: 3px solid #000000; font-weight: 900; text-transform: uppercase; display: inline-block; box-shadow: 5px 5px 0 #000000;">
                        Login Now
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 4px solid #000000; background: #f0f0f0; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">© 2025 Scatch Inc.</p>
            </div>
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
      <tr style="border-bottom: 2px solid #000000;">
        <td style="padding: 12px; color: #000000; font-weight: 600;">${item.nameAtPurchase}</td>
        <td style="padding: 12px; text-align: center; color: #000000;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; color: #000000;">₹${item.priceAtPurchase.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; color: #000000; font-weight: 700;">₹${(item.priceAtPurchase * item.quantity).toFixed(2)}</td>
      </tr>
    `;
  });

  const couponSection = order.couponDiscountAmount > 0 ? `
    <div style="background-color: #000000; color: #ffffff; padding: 15px; margin: 20px 0; text-align: center; border: 2px dashed #000000;">
      <h3 style="color: #ffffff; margin: 0; font-size: 16px; text-transform: uppercase;">🎉 Saved ₹${order.couponDiscountAmount.toFixed(2)}</h3>
      <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 12px;">COUPON: ${order.appliedCouponCode}</p>
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
    <body style="font-family: 'Courier New', Courier, monospace; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #f0f0f0;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border: 4px solid #000000; box-shadow: 12px 12px 0 #000000;">
            <!-- Header -->
            <div style="background-color: #000000; padding: 30px 20px; text-align: center; border-bottom: 4px solid #000000;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">SCATCH</h1>
                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; font-weight: 700;">Order Confirmation</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                     <h2 style="color: #000000; font-size: 28px; margin: 0; font-weight: 900; text-transform: uppercase;">
                        THANKS FOR YOUR ORDER!
                    </h2>
                    <p style="color: #000000; margin: 10px 0 0 0; font-weight: 600;">Your order has been confirmed.</p>
                </div>

                <!-- Order Details Box -->
                <div style="border: 4px solid #000000; padding: 20px; margin-bottom: 30px; background: #ffffff; box-shadow: 6px 6px 0 #000000;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 50%; vertical-align: top;">
                                <strong style="color: #000000; text-transform: uppercase; font-weight: 900;">Order ID:</strong>
                                <br><span style="color: #000000; font-family: monospace; font-size: 14px; background: #f0f0f0; padding: 2px 5px;">#${order._id.toString().slice(-8).toUpperCase()}</span>
                            </td>
                            <td style="width: 50%; vertical-align: top; text-align: right;">
                                <strong style="color: #000000; text-transform: uppercase; font-weight: 900;">Date:</strong>
                                <br><span style="color: #000000; font-weight: 700;">${order.orderDate.toLocaleDateString('en-GB')}</span>
                            </td>
                        </tr>
                    </table>
                </div>

                ${couponSection}

                <!-- Items Table -->
                <div style="margin-bottom: 30px; border: 2px solid #000000;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #000000;">
                                <th style="padding: 12px; text-align: left; color: white; font-weight: 900; text-transform: uppercase; font-size: 12px;">Item</th>
                                <th style="padding: 12px; text-align: center; color: white; font-weight: 900; text-transform: uppercase; font-size: 12px;">Qty</th>
                                <th style="padding: 12px; text-align: right; color: white; font-weight: 900; text-transform: uppercase; font-size: 12px;">Price</th>
                                <th style="padding: 12px; text-align: right; color: white; font-weight: 900; text-transform: uppercase; font-size: 12px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemListHtml}
                        </tbody>
                    </table>
                </div>

                <!-- Total -->
                <div style="background: #ffe600; border: 4px solid #000000; padding: 20px; text-align: center; margin-bottom: 30px; box-shadow: 6px 6px 0 #000000;">
                    <div style="font-size: 14px; margin-bottom: 5px; font-weight: 900; text-transform: uppercase;">Total Amount</div>
                    <div style="font-size: 32px; font-weight: 900;">₹${order.totalAmount.toFixed(2)}</div>
                </div>

                <!-- Shipping -->
                <div style="border: 2px solid #000000; padding: 20px; background: #f9f9f9;">
                    <h3 style="color: #000000; margin: 0 0 10px 0; font-size: 14px; font-weight: 900; text-transform: uppercase;">📍 Shipping To:</h3>
                    <div style="color: #000000; font-weight: 600; font-size: 14px;">
                        ${order.shippingAddress.street || ''}<br>
                        ${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}<br>
                        ${order.shippingAddress.country || ''}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 4px solid #000000; background: #f0f0f0; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">© 2025 Scatch Inc.</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 600; color: #666;">INVOICE ATTACHED</p>
            </div>
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
