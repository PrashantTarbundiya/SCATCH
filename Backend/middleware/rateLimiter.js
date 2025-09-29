import rateLimit from 'express-rate-limit';

// Use different limits based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Much higher in development
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip rate limiting entirely in development
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 5, // More lenient in development
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => isDevelopment, // Skip in development
});

// Moderate limiter for product creation/updates
export const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 500 : 20,
  message: {
    error: 'Too many product operations, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

// Limiter for order operations
export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 500 : 30,
  message: {
    error: 'Too many order operations, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

// Limiter for search operations
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 50000 : 5000,
  message: {
    error: 'Too many search requests, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});