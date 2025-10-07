import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });


if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
  throw new Error('Email configuration is not complete. Ensure GMAIL_USER and GMAIL_APP_PASS are set in environment variables.');
}

// Free Gmail SMTP configuration - no paid service required
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error configuring Nodemailer transporter:', error);
    console.error('Gmail User:', process.env.GMAIL_USER);
  }
});

export default transporter;