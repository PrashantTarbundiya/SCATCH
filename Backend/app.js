import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
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

// Security middleware imports
import { generalLimiter, authLimiter, searchLimiter } from './middleware/rateLimiter.js';
import { sanitizeInput, preventInjection } from './middleware/inputSanitizer.js';
import { generateCsrfToken, getCsrfToken } from './middleware/csrfProtection.js';

import connectDB from './config/mongoose-connection.js';
connectDB();

import ownerRouter from './routes/ownerRouter.js';
import productRouter from './routes/productRouter.js';
import userRouter from './routes/userRouter.js';
import indexRouter from './routes/index.js';
import orderRouter from './routes/orderRouter.js';
import wishlistRouter from './routes/wishlistRouter.js';
import couponRouter from './routes/couponRouter.js';
import notificationRouter from './routes/notificationRouter.js';
import cartRouter from './routes/cartRouter.js';
import categoryRouter from './routes/categoryRouter.js';
import analyticsRouter from './routes/analyticsRouter.js';

// Security Headers - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Performance middleware
app.use(compression());

// Apply general rate limiter to all routes
app.use(generalLimiter);

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization - protect against NoSQL injection
app.use(sanitizeInput);

// Prevent common injection patterns
app.use(preventInjection);

app.use(cookieParser());
app.use(
   expressSession({
      resave: false,
      saveUninitialized: false,
      secret: process.env.EXPRESS_SESSION_SECRET,
      cookie: { 
         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
         httpOnly: false, // Allow client-side access for debugging
         secure: process.env.NODE_ENV === 'production',
         sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
         domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
      }
   })
);
app.use(flash());

// CSRF token generation (must come after session)
app.use(generateCsrfToken);

app.use(express.static(path.join(__dirname, "public")));

// CSRF token endpoint for SPA
app.get('/api/csrf-token', getCsrfToken);

// Debug route to check cookies
app.get('/debug/cookies', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    origin: req.get('origin')
  });
});

// Apply routes with appropriate rate limiters
app.use('/', indexRouter);
app.use('/owners', ownerRouter);

// Authentication routes with stricter rate limiting
app.use('/users', authLimiter, userRouter);

// Product and search routes
app.use('/products', searchLimiter, productRouter);

// Other routes with general limiter (already applied globally)
app.use('/orders', orderRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/v1/coupons', couponRouter);
app.use('/notifications', notificationRouter);
app.use('/cart', cartRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/analytics', analyticsRouter);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(process.env.PORT || 3000, () => {
   console.log(`Scatch App is running on port ${process.env.PORT || 3000}`)
})