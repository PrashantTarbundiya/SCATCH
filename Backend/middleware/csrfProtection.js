import crypto from 'crypto';


const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to generate and attach CSRF token to response
export const generateCsrfToken = (req, res, next) => {
  // Generate token if it doesn't exist in session
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  // Attach token to response locals for templates
  res.locals.csrfToken = req.session.csrfToken;

  // Also set as cookie for client-side access
  res.cookie('XSRF-TOKEN', req.session.csrfToken, {
    httpOnly: false, // Allow JavaScript to read this cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  next();
};

// Middleware to verify CSRF token for state-changing operations
export const verifyCsrfToken = (req, res, next) => {
  // Skip verification for safe HTTP methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Get token from header or body
  const tokenFromHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const tokenFromBody = req.body?._csrf;
  const tokenFromQuery = req.query?._csrf;

  const clientToken = tokenFromHeader || tokenFromBody || tokenFromQuery;

  // Get expected token from session
  const serverToken = req.session.csrfToken;

  // Verify token exists
  if (!clientToken || !serverToken) {
    return res.status(403).json({ 
      error: 'CSRF token missing. Please refresh the page and try again.' 
    });
  }

  // Verify token matches using constant-time comparison
  if (!crypto.timingSafeEqual(Buffer.from(clientToken), Buffer.from(serverToken))) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token. Please refresh the page and try again.' 
    });
  }

  next();
};

// Route handler to get CSRF token (for SPA applications)
export const getCsrfToken = (req, res) => {
  // Ensure token exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  res.json({ 
    csrfToken: req.session.csrfToken,
    message: 'CSRF token generated successfully'
  });
};

// Middleware to refresh CSRF token periodically
export const refreshCsrfToken = (req, res, next) => {
  // Regenerate token for added security
  req.session.csrfToken = generateToken();
  
  // Update cookie
  res.cookie('XSRF-TOKEN', req.session.csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  next();
};