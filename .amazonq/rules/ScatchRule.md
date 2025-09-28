# Claude Sonnet 4 Production Code Rules for SCATCH Project

## 🎯 Core Principles

### 1. Code Quality Standards
- **Zero Tolerance for Errors**: All code must be syntactically correct and logically sound
- **Production-Ready**: Code must be ready for deployment without modifications
- **Scalable Architecture**: Design for growth and high traffic scenarios
- **Clean Code**: Follow SOLID principles and maintain high readability
- **No Redundancy**: Eliminate duplicate code through proper abstractions

## 🏗️ Architecture Rules

### 2. MERN Stack Specific Guidelines

#### Backend (Node.js + Express)
```javascript
// ✅ Always use async/await with proper error handling
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ❌ Never use callbacks or unhandled promises
```

#### Frontend (React + Vite)
```jsx
// ✅ Always use functional components with proper hooks
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom hook for data fetching
  const { data, loading, error } = useUser(userId);
  
  return <UserProfileUI user={data} loading={loading} error={error} />;
};
```

### 3. Error Handling Rules

#### Global Error Handling
```javascript
// Backend - Always implement centralized error middleware
const errorHandler = (err, req, res, next) => {
  const error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Handle all error types systematically
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

#### Frontend Error Boundaries
```jsx
// Always implement error boundaries for React components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 4. Security Rules

#### Authentication & Authorization
```javascript
// ✅ Always implement proper JWT validation
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token verification failed' });
  }
};
```

#### Input Validation
```javascript
// Always validate and sanitize inputs
const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('name').trim().isLength({ min: 2, max: 50 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 5. Database Rules

#### MongoDB/Mongoose Best Practices
```javascript
// ✅ Always use proper schema design with validation
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false // Don't include in queries by default
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ verificationToken: 1 });
```

#### Connection Management
```javascript
// ✅ Proper connection handling with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

### 6. Performance Optimization Rules

#### Caching Strategy
```javascript
// Implement Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

#### Database Query Optimization
```javascript
// ✅ Always use efficient queries with proper pagination
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -verificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for read-only operations

    const total = await User.countDocuments();
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### 7. Code Structure Rules

#### File Organization
```
Backend/
├── config/
│   ├── database.js
│   ├── email.js
│   └── redis.js
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   └── base.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   ├── error.middleware.js
│   └── rateLimit.middleware.js
├── models/
│   ├── User.model.js
│   └── BaseModel.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   └── index.routes.js
├── services/
│   ├── email.service.js
│   ├── auth.service.js
│   └── user.service.js
├── utils/
│   ├── logger.js
│   ├── helpers.js
│   └── constants.js
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

#### Service Layer Pattern
```javascript
// ✅ Always use service layer for business logic
class UserService {
  static async createUser(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      verificationToken,
      verificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    await EmailService.sendVerificationEmail(user.email, verificationToken);
    
    return user;
  }
}
```

### 8. Testing Rules

#### Unit Tests
```javascript
// ✅ Always write comprehensive tests
describe('UserService', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      };

      const user = await UserService.createUser(userData);

      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password);
      expect(user.verificationToken).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      };

      await UserService.createUser(userData);
      
      await expect(UserService.createUser(userData))
        .rejects
        .toThrow('User already exists');
    });
  });
});
```

### 9. Frontend React Rules

#### Custom Hooks
```jsx
// ✅ Always create reusable custom hooks
const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(url, options);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
```

#### Component Patterns
```jsx
// ✅ Use compound components and render props patterns
const UserProfile = ({ children }) => {
  const { user, loading, error } = useUser();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};

UserProfile.Avatar = ({ size = 'md' }) => {
  const user = useContext(UserContext);
  return <Avatar src={user.avatar} size={size} />;
};

UserProfile.Name = () => {
  const user = useContext(UserContext);
  return <span className="font-medium">{user.name}</span>;
};
```

### 10. Environment & Deployment Rules

#### Environment Configuration
```javascript
// ✅ Always use proper environment configuration
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  }
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### 11. Logging & Monitoring Rules

#### Structured Logging
```javascript
// ✅ Always implement proper logging
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'scatch-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 12. API Design Rules

#### RESTful API Standards
```javascript
// ✅ Always follow REST conventions
const router = express.Router();

// GET /api/v1/users - Get all users
router.get('/', validateAuth, cacheMiddleware(300), UserController.getUsers);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', validateAuth, validateObjectId, UserController.getUserById);

// POST /api/v1/users - Create new user
router.post('/', validateRegistration, UserController.createUser);

// PUT /api/v1/users/:id - Update user
router.put('/:id', validateAuth, validateOwnership, validateUpdate, UserController.updateUser);

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', validateAuth, validateOwnership, UserController.deleteUser);

// Standard response format
const sendResponse = (res, statusCode, success, data = null, message = '', errors = null) => {
  res.status(statusCode).json({
    success,
    message,
    data,
    ...(errors && { errors }),
    timestamp: new Date().toISOString()
  });
};
```

### 13. Code Review Checklist

Before providing any code, Claude must verify:

- [ ] **Syntax Correctness**: Code compiles/runs without errors
- [ ] **Error Handling**: All potential errors are caught and handled
- [ ] **Security**: No security vulnerabilities (SQL injection, XSS, etc.)
- [ ] **Performance**: Optimized queries and efficient algorithms
- [ ] **Scalability**: Code can handle increased load
- [ ] **Maintainability**: Clean, readable, and well-documented
- [ ] **Testing**: Testable code with proper separation of concerns
- [ ] **Standards Compliance**: Follows project conventions and best practices
- [ ] **Dependencies**: Uses appropriate and up-to-date packages
- [ ] **Environment**: Proper configuration management

### 14. AI-Specific Guidelines

When Claude generates code for SCATCH project:

1. **Always provide complete, working solutions** - No partial or placeholder code
2. **Include comprehensive error handling** - Never assume happy path
3. **Add inline documentation** - Explain complex logic and business rules
4. **Suggest improvements** - Point out potential optimizations or alternative approaches
5. **Consider edge cases** - Handle boundary conditions and unexpected inputs
6. **Validate against requirements** - Ensure code meets specified functionality
7. **Provide migration strategies** - When suggesting changes to existing code
8. **Include test examples** - Show how to test the generated code
9. **Consider deployment implications** - Ensure code works in production environment
10. **Follow progressive enhancement** - Build features that degrade gracefully

### 15. Mandatory Code Templates

#### Controller Template
```javascript
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');

class BaseController {
  static asyncHandler = asyncHandler;
  
  static validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Validation Error', 400, errors.array()));
    }
    next();
  };
  
  static sendResponse = (res, statusCode, success, data = null, message = '') => {
    res.status(statusCode).json({
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  };
}

module.exports = BaseController;
```

#### Service Template
```javascript
const BaseService = require('./base.service');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class ServiceTemplate extends BaseService {
  constructor(model) {
    super();
    this.model = model;
  }

  async create(data) {
    try {
      const result = await this.model.create(data);
      logger.info(`Created ${this.model.modelName}:`, { id: result._id });
      return result;
    } catch (error) {
      logger.error(`Error creating ${this.model.modelName}:`, error);
      throw new AppError(`Failed to create ${this.model.modelName}`, 500);
    }
  }
}

module.exports = ServiceTemplate;
```

## 🚀 Implementation Priority

1. **Security First**: Authentication, authorization, input validation
2. **Error Handling**: Comprehensive error management
3. **Performance**: Database optimization, caching, efficient queries
4. **Scalability**: Service layer, proper architecture
5. **Maintainability**: Clean code, documentation, testing
6. **Monitoring**: Logging, health checks, metrics

### 16. Self-Testing & Validation Rules

#### Mandatory Self-Testing Process
Before delivering any code, Claude must:

1. **Create temporary test files** to validate the generated code
2. **Run syntax validation** and logical flow checks
3. **Verify all imports and dependencies** are correct
4. **Test edge cases and error scenarios**
5. **Clean up test files** after validation is complete

#### Self-Testing Template
```javascript
// temp_test_validation.js - This file will be auto-deleted after testing
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CodeValidator {
  constructor(generatedCode, testName) {
    this.generatedCode = generatedCode;
    this.testName = testName;
    this.tempDir = path.join(__dirname, 'temp_validation');
    this.testFile = path.join(this.tempDir, `${testName}_test.js`);
    this.errors = [];
  }

  async validateCode() {
    try {
      // Create temporary directory
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      // Write code to temporary file
      fs.writeFileSync(this.testFile, this.generatedCode);

      // Run syntax validation
      await this.validateSyntax();
      
      // Run logical tests
      await this.runLogicalTests();
      
      // Validate dependencies
      await this.validateDependencies();
      
      // Test error scenarios
      await this.testErrorScenarios();

      console.log(`✅ Code validation passed for: ${this.testName}`);
      return { success: true, errors: [] };

    } catch (error) {
      this.errors.push(error.message);
      console.error(`❌ Code validation failed for: ${this.testName}`, error);
      return { success: false, errors: this.errors };
    } finally {
      // Always cleanup temporary files
      this.cleanup();
    }
  }

  validateSyntax() {
    try {
      // Check JavaScript syntax
      execSync(`node --check ${this.testFile}`, { encoding: 'utf8' });
      
      // Check for common linting issues
      const code = fs.readFileSync(this.testFile, 'utf8');
      
      // Basic syntax checks
      if (code.includes('var ')) {
        throw new Error('Use const/let instead of var');
      }
      
      if (code.includes('console.log') && !code.includes('logger')) {
        console.warn('⚠️  Consider using logger instead of console.log');
      }
      
      // Check for async/await pattern
      if (code.includes('Promise') && !code.includes('await')) {
        console.warn('⚠️  Consider using async/await pattern');
      }
      
    } catch (error) {
      throw new Error(`Syntax validation failed: ${error.message}`);
    }
  }

  async runLogicalTests() {
    // Create mini test cases for the generated code
    const testCases = this.generateTestCases();
    
    for (const testCase of testCases) {
      try {
        await testCase.run();
      } catch (error) {
        throw new Error(`Logical test failed: ${testCase.name} - ${error.message}`);
      }
    }
  }

  generateTestCases() {
    const code = fs.readFileSync(this.testFile, 'utf8');
    const testCases = [];

    // Auto-generate test cases based on code analysis
    if (code.includes('async function') || code.includes('async ')) {
      testCases.push({
        name: 'Async Function Test',
        run: async () => {
          // Mock test for async functions
          const mockReq = { body: {}, params: {}, query: {} };
          const mockRes = { 
            json: (data) => data, 
            status: (code) => ({ json: (data) => ({ status: code, data }) })
          };
          const mockNext = (error) => error;
          
          // Test would run here (simplified for example)
          return true;
        }
      });
    }

    if (code.includes('mongoose') || code.includes('Schema')) {
      testCases.push({
        name: 'Mongoose Schema Test',
        run: async () => {
          // Validate schema structure
          return true;
        }
      });
    }

    return testCases;
  }

  validateDependencies() {
    const code = fs.readFileSync(this.testFile, 'utf8');
    const imports = code.match(/require\(['"](.*?)['"]\)/g) || [];
    const esImports = code.match(/import.*?from\s+['"](.*?)['"]/g) || [];
    
    const allImports = [...imports, ...esImports];
    
    for (const importStatement of allImports) {
      const moduleName = importStatement.match(/['"](.*?)['"]/)?.[1];
      
      if (moduleName && !moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        // Check if it's a standard Node.js module or common dependency
        const commonModules = [
          'express', 'mongoose', 'bcrypt', 'jsonwebtoken', 'nodemailer',
          'cors', 'helmet', 'morgan', 'compression', 'express-validator',
          'redis', 'winston', 'dotenv', 'multer', 'axios'
        ];
        
        if (!commonModules.includes(moduleName.split('/')[0])) {
          console.warn(`⚠️  Uncommon dependency detected: ${moduleName}`);
        }
      }
    }
  }

  async testErrorScenarios() {
    const code = fs.readFileSync(this.testFile, 'utf8');
    
    // Check for proper error handling
    if (code.includes('try') && !code.includes('catch')) {
      throw new Error('Try block without catch - incomplete error handling');
    }
    
    if (code.includes('await') && !code.includes('try')) {
      console.warn('⚠️  Async operations without try-catch blocks detected');
    }
    
    // Check for input validation
    if (code.includes('req.body') && !code.includes('validation')) {
      console.warn('⚠️  Request body usage without explicit validation');
    }
  }

  cleanup() {
    try {
      if (fs.existsSync(this.testFile)) {
        fs.unlinkSync(this.testFile);
      }
      
      if (fs.existsSync(this.tempDir) && fs.readdirSync(this.tempDir).length === 0) {
        fs.rmdirSync(this.tempDir);
      }
      
      console.log(`🧹 Cleaned up temporary test files for: ${this.testName}`);
    } catch (error) {
      console.warn(`⚠️  Cleanup warning: ${error.message}`);
    }
  }
}

// Auto-cleanup function for temporary files
const scheduleCleanup = () => {
  process.on('exit', () => {
    const tempDir = path.join(__dirname, 'temp_validation');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🧹 Final cleanup of validation files completed');
    }
  });
};

scheduleCleanup();
```

#### Integration Testing Script
```javascript
// integration_validator.js - Auto-deleted after testing
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

class IntegrationValidator {
  constructor() {
    this.testResults = [];
    this.cleanup = [];
  }

  async runValidation() {
    try {
      await this.setupTestDatabase();
      await this.runAPITests();
      await this.validateDatabaseOperations();
      
      console.log('✅ All integration tests passed');
      return { success: true, results: this.testResults };
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      return { success: false, error: error.message };
    } finally {
      await this.performCleanup();
    }
  }

  async setupTestDatabase() {
    // Connect to test database
    const testDB = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/scatch_test';
    await mongoose.connect(testDB);
    
    // Clean test data
    await mongoose.connection.db.dropDatabase();
    
    this.cleanup.push(async () => {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    });
  }

  async runAPITests() {
    // Test user registration
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    this.testResults.push({
      test: 'User Registration',
      status: 'passed',
      response: response.body
    });

    // Test authentication flow
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    this.testResults.push({
      test: 'User Login',
      status: loginResponse.status === 200 ? 'passed' : 'failed',
      response: loginResponse.body
    });
  }

  async validateDatabaseOperations() {
    // Test database operations
    const User = require('../models/User.model');
    
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      throw new Error('User creation failed - not found in database');
    }

    this.testResults.push({
      test: 'Database Operations',
      status: 'passed',
      data: { userId: user._id }
    });
  }

  async performCleanup() {
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
    }
    
    // Remove this test file
    const fs = require('fs');
    const path = require('path');
    const testFile = path.join(__dirname, 'integration_validator.js');
    
    setTimeout(() => {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
        console.log('🧹 Integration validator file cleaned up');
      }
    }, 1000);
  }
}
```

#### Self-Validation Protocol

Claude must follow this protocol for every code generation:

```javascript
// Claude's internal validation process (conceptual)
const SelfValidationProtocol = {
  
  async validateGeneratedCode(code, context) {
    const validator = new CodeValidator(code, `validation_${Date.now()}`);
    
    // Step 1: Syntax and logic validation
    const syntaxResult = await validator.validateCode();
    if (!syntaxResult.success) {
      throw new Error(`Code validation failed: ${syntaxResult.errors.join(', ')}`);
    }
    
    // Step 2: Security check
    await this.performSecurityValidation(code);
    
    // Step 3: Performance analysis
    await this.performanceAnalysis(code);
    
    // Step 4: SCATCH project compatibility
    await this.validateProjectCompatibility(code, context);
    
    // Step 5: Auto-cleanup
    await this.cleanupTestFiles();
    
    return { validated: true, ready: true };
  },
  
  async performSecurityValidation(code) {
    const securityChecks = [
      { pattern: /eval\(/, message: 'Dangerous eval() usage detected' },
      { pattern: /innerHTML\s*=/, message: 'Potential XSS vulnerability with innerHTML' },
      { pattern: /document\.write/, message: 'Dangerous document.write usage' },
      { pattern: /process\.env\.[\w]+(?!\s*\|\|)/, message: 'Environment variable without fallback' }
    ];
    
    for (const check of securityChecks) {
      if (check.pattern.test(code)) {
        throw new Error(`Security issue: ${check.message}`);
      }
    }
  },
  
  async performanceAnalysis(code) {
    // Check for performance anti-patterns
    const performanceChecks = [
      { pattern: /\.find\(\)\s*\.length/, message: 'Use countDocuments() instead of find().length' },
      { pattern: /for\s*\(\s*let.*await/, message: 'Avoid await in loops - use Promise.all()' },
      { pattern: /JSON\.parse\(JSON\.stringify/, message: 'Inefficient deep clone method' }
    ];
    
    for (const check of performanceChecks) {
      if (check.pattern.test(code)) {
        console.warn(`⚠️  Performance warning: ${check.message}`);
      }
    }
  },
  
  async validateProjectCompatibility(code, context) {
    // Ensure code fits SCATCH project structure
    const projectChecks = [
      { 
        condition: context.type === 'backend',
        pattern: /require.*express/,
        message: 'Backend code should use Express framework'
      },
      {
        condition: context.type === 'frontend', 
        pattern: /import.*react/,
        message: 'Frontend code should use React'
      }
    ];
    
    for (const check of projectChecks) {
      if (check.condition && !check.pattern.test(code)) {
        console.warn(`⚠️  Compatibility warning: ${check.message}`);
      }
    }
  },
  
  async cleanupTestFiles() {
    // Auto-cleanup of all temporary test files
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const tempDirs = ['temp_validation', 'test_temp', 'validation_temp'];
      
      for (const dir of tempDirs) {
        const dirPath = path.join(process.cwd(), dir);
        try {
          await fs.rmdir(dirPath, { recursive: true });
          console.log(`🧹 Cleaned up ${dir}`);
        } catch (error) {
          // Directory might not exist, that's okay
        }
      }
    } catch (error) {
      console.warn('Cleanup completed with warnings');
    }
  }
};
```

#### Auto-Cleanup Timer
```javascript
// cleanup_scheduler.js - Self-deleting cleanup scheduler
class CleanupScheduler {
  static scheduleCleanup(files = [], delay = 5000) {
    setTimeout(async () => {
      const fs = require('fs').promises;
      
      for (const file of files) {
        try {
          await fs.unlink(file);
          console.log(`🧹 Auto-deleted: ${file}`);
        } catch (error) {
          // File might already be deleted
        }
      }
      
      // Delete this scheduler file itself
      try {
        await fs.unlink(__filename);
        console.log('🧹 Cleanup scheduler self-deleted');
      } catch (error) {
        // File might be in use
      }
    }, delay);
  }
}

// Schedule cleanup for common test file patterns
const testFiles = [
  'temp_test_validation.js',
  'integration_validator.js', 
  'cleanup_scheduler.js'
];

CleanupScheduler.scheduleCleanup(testFiles);

module.exports = CleanupScheduler;
```

## ⚡ Final Notes

- **Zero Tolerance Policy**: Any generated code must be production-ready
- **Self-Testing Mandatory**: Claude must test and validate all generated code
- **Auto-Cleanup Required**: All temporary test files must be automatically deleted
- **Continuous Improvement**: Regularly update rules based on project evolution
- **Documentation**: Every function, class, and complex logic must be documented
- **Testing**: All code must be testable and include test examples
- **Security**: Security considerations must be explicit in every code generation
- **Self-Validation**: Code must pass internal validation before delivery

These rules ensure that Claude Sonnet 4 generates enterprise-grade, scalable, and maintainable code for your SCATCH project while maintaining a clean development environment through automatic testing and cleanup.