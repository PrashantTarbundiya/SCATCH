import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Ensure .env is loaded from the Backend directory

if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
  throw new Error('Email configuration is not complete in .env file. Ensure EMAIL_HOST, EMAIL_PORT, GMAIL_USER, and GMAIL_APP_PASS are set.');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_APP_PASS, 
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error configuring Nodemailer transporter:', error);
  } else {
    console.log('Nodemailer transporter is ready to send emails');
  }
});

export default transporter;