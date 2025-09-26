const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const logsRoutes = require('./routes/logs');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger, errorLogger, info, audit, security } = require('./utils/logger');
const { monitoringMiddleware, getMetricsEndpoint, cleanupLogsEndpoint, schedulerControlEndpoint, logCleanupScheduler } = require('./utils/monitoring');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration - allows requests from multiple frontend ports
app.use(cors({
  origin: [
    'http://localhost:8080', // Main frontend port
    'http://localhost:5500', // Alternative frontend port
    'http://localhost:3000'  // Development port
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging and monitoring middleware
app.use(requestLogger);
app.use(monitoringMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/logs', logsRoutes);

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

// Error handling middleware
app.use(errorLogger);
app.use(errorHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const serverInfo = {
      port: PORT,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
      environment: process.env.NODE_ENV || 'development',
      database: process.env.POSTGRES_DB || 'lego_purchase_system'
    };
    
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${serverInfo.frontendUrl}`);
    console.log(`🌍 Environment: ${serverInfo.environment}`);
    console.log(`🗄️  Database: ${serverInfo.database}`);
    
    info('Server started successfully', serverInfo);
    
    // Uruchom automatyczne czyszczenie logów (co 6 godzin)
    const cleanupInterval = process.env.LOG_CLEANUP_INTERVAL_HOURS || 6;
    logCleanupScheduler.start(parseInt(cleanupInterval));
    info('Automatic log cleanup scheduler started', { intervalHours: cleanupInterval });
  });
}

module.exports = app;
