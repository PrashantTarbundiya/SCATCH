import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult } from 'express-validator';

// Middleware to sanitize all user inputs against MongoDB query injection
// Note: Using 'replaceWith' instead of direct mutation for Express 5 compatibility
export const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  
  // Sanitize query params - create new object instead of mutating
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = mongoSanitize.sanitize(req.query, { replaceWith: '_' });
    // Delete all existing properties
    Object.keys(req.query).forEach(key => delete req.query[key]);
    // Assign sanitized properties
    Object.assign(req.query, sanitizedQuery);
  }
  
  // Sanitize params
  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  
  next();
};

// Validation helper to check for validation errors
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// Validation rules for user registration
export const validateUserRegistration = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullname')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name must be less than 100 characters'),
];

// Validation rules for user login
export const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
];

// Validation rules for product creation
export const validateProductCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name must be less than 200 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('discount')
    .optional()
    .isNumeric()
    .withMessage('Discount must be a number')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
];

// Validation rules for order creation
export const validateOrderCreation = [
  body('products')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one product'),
  body('products.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required')
    .isLength({ max: 500 })
    .withMessage('Shipping address must be less than 500 characters'),
];

// Validation rules for search queries
export const validateSearchQuery = [
  body('query')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),
  body('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be non-negative'),
  body('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be non-negative'),
];

// Validation rules for coupon creation
export const validateCouponCreation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Coupon code can only contain letters, numbers, hyphens, and underscores'),
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be either percentage or fixed'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be non-negative'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
];

// XSS protection helper - escapes HTML characters
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Middleware to prevent common injection patterns
export const preventInjection = (req, res, next) => {
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /\$where/gi,
    /\$ne/gi,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({ 
      error: 'Invalid input detected. Request contains potentially dangerous patterns.' 
    });
  }

  next();
};