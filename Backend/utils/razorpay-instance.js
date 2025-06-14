import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Ensure .env is loaded from the Backend directory

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay Key ID or Key Secret is not defined in .env file');
}

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default instance;