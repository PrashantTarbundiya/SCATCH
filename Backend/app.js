import express from 'express';
const app = express();

import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors'; // Add cors
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; // For ES module __dirname equivalent

// ES module __dirname equivalent
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

app.use(cors({
  origin: process.env.FRONTEND_URI, // Allow your frontend origin
  credentials: true // Allow cookies to be sent
})); // Use cors middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
   expressSession({
      resave: false,
      saveUninitialized: false,
      secret: process.env.EXPRESS_SESSION_SECRET
   })
);
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

app.use('/', indexRouter);
app.use('/owners', ownerRouter);
app.use('/users', userRouter);
app.use('/products', productRouter);


// Optional: Basic error handler (catches errors from synchronous code or explicitly passed via next(err))
// For more robust error handling, consider a dedicated error-handling middleware.
app.use((err, req, res, next) => {
  console.error(err.stack); // Log error stack for debugging
  // Send a generic error response
  // Avoid sending detailed error messages to the client in production
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    // Optionally, include more details in development
    // details: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(process.env.PORT, () => {
   console.log("Scatch App was runnig")
})