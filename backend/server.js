const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { error: logger } = require('./utils/logger');
require('dotenv').config();

// ⚠️ WAŻNE: Przy dodawaniu nowych pól do API ZAWSZE sprawdź:
// 1. Czy baza danych ma odpowiednie kolumny (lego_database_schema.sql)
// 2. Czy modele obsługują nowe pola (UserCollection.js)
// 3. Czy constraints są aktualne
// 4. Uruchom migracje jeśli potrzeba
// Patrz: DEVELOPMENT_RULES.md

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const logsRoutes = require('./routes/logs');
const legoRoutes = require('./routes/lego');
const sessionRoutes = require('./routes/sessions');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger, errorLogger, info, security, error } = require('./utils/logger');

// Environment variables validation
const validateEnvironmentVariables = () => {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    error('Missing required environment variables', { missing });
    process.exit(1);
  }
  
  info('Environment variables validation passed');
};

// Call before server start
validateEnvironmentVariables();
const { monitoringMiddleware, getMetricsEndpoint, cleanupLogsEndpoint, schedulerControlEndpoint, logCleanupScheduler } = require('./utils/monitoring');
const redisService = require('./utils/redisService');
const sessionCleanupService = require('./services/sessionCleanupService');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LEGO Purchase System API',
      version: '1.0.0',
      description: 'API for LEGO set management, user collections, and OLX offers integration',
      contact: {
        name: 'LEGO Purchase System',
        email: 'support@legopurchase.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        LegoSet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            set_number: {
              type: 'string',
              example: '75399-1'
            },
            name: {
              type: 'string',
              example: 'Rebel U-Wing Starfighter'
            },
            theme: {
              type: 'string',
              example: 'Star Wars'
            },
            year: {
              type: 'integer',
              example: 2024
            },
            pieces: {
              type: 'integer',
              example: 1065
            },
            retail_price: {
              type: 'number',
              format: 'float',
              example: 79.99
            },
            image_url: {
              type: 'string',
              format: 'uri'
            },
            description: {
              type: 'string'
            }
          }
        },
        OlxOffer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            set_number: {
              type: 'string',
              example: '75399-1'
            },
            title: {
              type: 'string',
              example: 'LEGO Star Wars Rebel U-Wing Starfighter 75399 - NOWY'
            },
            price: {
              type: 'number',
              format: 'float',
              example: 65.00
            },
            condition: {
              type: 'string',
              example: 'Nowy'
            },
            location: {
              type: 'string',
              example: 'Warszawa'
            },
            seller_name: {
              type: 'string',
              example: 'LEGO_Fan_123'
            },
            seller_rating: {
              type: 'number',
              format: 'float',
              example: 4.8
            },
            offer_url: {
              type: 'string',
              format: 'uri'
            },
            image_url: {
              type: 'string',
              format: 'uri'
            },
            description: {
              type: 'string'
            },
            is_active: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        UserCollection: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            user_id: {
              type: 'integer'
            },
            set_number: {
              type: 'string',
              example: '75399-1'
            },
            collection_type: {
              type: 'string',
              enum: ['owned', 'wanted'],
              example: 'owned'
            },
            quantity: {
              type: 'integer',
              example: 1
            },
            paid_price: {
              type: 'number',
              format: 'float',
              example: 65.00
            },
            condition: {
              type: 'string',
              enum: ['new', 'used', 'excellent', 'good', 'fair'],
              example: 'new'
            },
            notes: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// eslint-disable-next-line no-unused-vars
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdnjs.cloudflare.com'],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\''],
      fontSrc: ['\'self\'', 'data:', 'https://cdnjs.cloudflare.com'],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\''],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting - Enhanced security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // High limit for development and testing
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Rate limiting for auth endpoints - relaxed for development/testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 auth attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// CORS configuration - allows requests from configured origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:8080', // Main frontend port
      'http://localhost:5500', // Alternative frontend port
      'http://localhost:3000', // Development port
      'null' // Allow file:// protocol for local HTML files
    ];
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('null')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware (for httpOnly cookies)
app.use(cookieParser());

// CSRF Protection: Using SameSite=Strict cookies (modern approach, no library needed)
// Note: csurf is deprecated. SameSite cookies provide equivalent protection.
// All cookies are set with sameSite: 'strict' in authController.js

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging and monitoring middleware
app.use(requestLogger);
app.use(monitoringMiddleware);

// Routes with enhanced security
app.use('/api/auth', authLimiter, authRoutes); // Stricter rate limiting for auth
app.use('/api/profile', profileRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/lego', legoRoutes);
app.use('/api/sessions', sessionRoutes); // Session management

// CSRF Protection Info endpoint
app.get('/api/csrf-info', (req, res) => {
  // SameSite=Strict cookies provide CSRF protection without tokens
  res.json({ 
    success: true,
    csrfProtection: 'SameSite=Strict cookies',
    info: 'CSRF protection is enabled via SameSite=Strict cookie attribute'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  info('Health check requested', { ip: req.ip });
  res.json(healthData);
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LEGO Purchase System API Documentation'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Setup endpoint (for development only)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/setup', async (req, res) => {
    try {
      const { Pool } = require('pg');
      const fs = require('fs');
      const path = require('path');
      
      const pool = new Pool({
        user: process.env.POSTGRES_USER || 'lego_user',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'lego_purchase_system',
        port: process.env.POSTGRES_PORT || 5432,
        password: process.env.POSTGRES_PASSWORD || 'lego_password'
      });
      
      // Read migration file
      const migrationPath = path.join(__dirname, 'migrations', 'create_lego_tables.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Run migration
      await pool.query(migrationSQL);
      
      // Check if data exists
      const setsResult = await pool.query('SELECT COUNT(*) FROM lego_sets');
      const offersResult = await pool.query('SELECT COUNT(*) FROM olx_offers');
      
      await pool.end();
      
      res.json({
        success: true,
        message: 'Database setup completed',
        data: {
          sets: parseInt(setsResult.rows[0].count),
          offers: parseInt(offersResult.rows[0].count)
        }
      });
    } catch (error) {
      logger.error('Setup error', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// Monitoring endpoints
app.get('/api/metrics', getMetricsEndpoint);
app.post('/api/admin/cleanup-logs', cleanupLogsEndpoint);
app.post('/api/admin/scheduler', schedulerControlEndpoint);

// 404 handler
app.use('*', (req, res) => {
  security('404 - Endpoint not found', { 
    path: req.originalUrl, 
    method: req.method,
    ip: req.ip 
  });
  
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Error handling middleware - order matters!
app.use(errorLogger);
app.use(errorHandler);

// Initialize Redis connection with retry logic
const initializeRedis = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connected = await redisService.connect();
      if (connected) {
        info('Redis connection established successfully');
        return true;
      }
    } catch (err) {
      error(`Redis connection attempt ${i + 1} failed`, { error: err.message });
      if (i < retries - 1) {
        await new Promise(resolve => global.setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  error('Failed to establish Redis connection after all retries - REDIS IS REQUIRED');
  throw new Error('Redis connection failed - system cannot start without Redis');
};

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Initialize Redis and start server with graceful startup
  const startServer = async () => {
    try {
      // Initialize Redis FIRST - system requires Redis to start
      await initializeRedis();
      
      // Start server only after Redis is connected
      const server = app.listen(PORT, () => {
        const serverInfo = {
          port: PORT,
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
          environment: process.env.NODE_ENV || 'development',
          database: process.env.POSTGRES_DB || 'lego_purchase_system',
          redis: 'connected'
        };
        
        // eslint-disable-next-line no-console
        console.log(`🚀 Server running on port ${PORT}`);
        // eslint-disable-next-line no-console
        console.log(`📱 Frontend URL: ${serverInfo.frontendUrl}`);
        // eslint-disable-next-line no-console
        console.log(`🌍 Environment: ${serverInfo.environment}`);
        // eslint-disable-next-line no-console
        console.log(`🗄️  Database: ${serverInfo.database}`);
        // eslint-disable-next-line no-console
        console.log(`🔴 Redis: ${serverInfo.redis}`);
        
        info('Server started successfully', serverInfo);
        
        // Start log cleanup scheduler
        const cleanupInterval = process.env.LOG_CLEANUP_INTERVAL_HOURS || 6;
        logCleanupScheduler.start(parseInt(cleanupInterval));
        info('Automatic log cleanup scheduler started', { intervalHours: cleanupInterval });
        
        // Start session cleanup scheduler
        const sessionCleanupInterval = process.env.SESSION_CLEANUP_INTERVAL_HOURS || 24;
        sessionCleanupService.start(parseInt(sessionCleanupInterval));
        info('Automatic session cleanup scheduler started', { intervalHours: sessionCleanupInterval });
      });

      // Redis is already connected at this point
      // eslint-disable-next-line no-console
      console.log('🔴 Redis: connected (required)');

      // Graceful shutdown handling
      const gracefulShutdown = (signal) => {
        // eslint-disable-next-line no-console
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        
        // Stop schedulers
        logCleanupScheduler.stop();
        sessionCleanupService.stop();
        
        server.close(() => {
          // eslint-disable-next-line no-console
          console.log('HTTP server closed.');
          redisService.disconnect().then(() => {
            // eslint-disable-next-line no-console
            console.log('Redis connection closed.');
            process.exit(0);
          });
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to start server:', err.message);
      // eslint-disable-next-line no-console
      console.error(err.stack);
      process.exit(1);
    }
  };

  startServer();
}

// Export app and pool for models to use
module.exports = app;
module.exports.pool = require('./models/User').pool || null;
