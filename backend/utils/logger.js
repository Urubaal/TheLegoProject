const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const { createCloudLogger, createDatadogLogger } = require('./cloudLogger');

// Definicja formatów logów
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Konfiguracja transportów
const transports = [
  // Konsola - tylko w trybie development
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: consoleFormat
  }),

  // Plik ogólny - wszystkie logi
  new DailyRotateFile({
    filename: path.join('logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: logFormat
  }),

  // Plik błędów - tylko błędy
  new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  }),

  // Plik audytu - operacje użytkowników
  new DailyRotateFile({
    filename: path.join('logs', 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d',
    level: 'info',
    format: logFormat
  })
];

// Dodaj chmurowe logowanie jeśli dostępne
const cloudLogger = createCloudLogger();
if (cloudLogger) {
  transports.push(cloudLogger);
  console.log('✅ Google Cloud Logging enabled');
}

const datadogLogger = createDatadogLogger();
if (datadogLogger) {
  transports.push(datadogLogger);
  console.log('✅ Datadog logging enabled');
}

// Tworzenie loggera głównego
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Specjalne metody dla różnych typów logów
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d'
    })
  ]
});

// Metody pomocnicze
const logMethods = {
  // Logi systemowe
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Logi audytu - operacje użytkowników
  audit: (action, userId, details = {}) => {
    auditLogger.info('AUDIT', {
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // Logi bezpieczeństwa
  security: (event, details = {}) => {
    logger.warn('SECURITY', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // Logi wydajności
  performance: (operation, duration, details = {}) => {
    logger.info('PERFORMANCE', {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // Logi HTTP requestów
  http: (req, res, responseTime) => {
    logger.info('HTTP', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });
  }
};

// Middleware dla Express
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logMethods.http(req, res, duration);
  });
  
  next();
};

// Middleware do logowania błędów
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });
  
  next(err);
};

module.exports = {
  ...logMethods,
  requestLogger,
  errorLogger,
  logger
};
