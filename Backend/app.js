import express from 'express';
import compression from 'compression';
const app = express();

import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors'; 
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

import expressSession from 'express-session';
import flash from 'connect-flash';

import connectDB from './config/mongoose-connection.js';
connectDB();

import ownerRouter from './routes/ownerRouter.js';
import productRouter from './routes/productRouter.js';
import userRouter from './routes/userRouter.js';
import indexRouter from './routes/index.js';
import orderRouter from './routes/orderRouter.js';
import wishlistRouter from './routes/wishlistRouter.js';
import couponRouter from './routes/couponRouter.js';

// Performance middleware
app.use(compression());

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [process.env.FRONTEND_URI, 'https://scatch-livid.vercel.app', 'http://localhost:5173'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
})); 

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(
   expressSession({
      resave: false,
      saveUninitialized: false,
      secret: process.env.EXPRESS_SESSION_SECRET,
      cookie: { 
         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
         httpOnly: true,
         secure: true,
         sameSite: 'none'
      }
   })
);
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

// Debug route to check cookies
app.get('/debug/cookies', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    origin: req.get('origin')
  });
});

app.use('/', indexRouter);
app.use('/owners', ownerRouter);
app.use('/users', userRouter);
app.use('/products', productRouter);
app.use('/orders', orderRouter);
app.use('/api/wishlist', wishlistRouter); 
app.use('/api/v1/coupons', couponRouter);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(process.env.PORT || 3000, () => {
   console.log(`Scatch App is running on port ${process.env.PORT || 3000}`)
})