const fs = require('fs');
const path = require('path');
const { info, warn, error } = require('./logger');

// Metryki systemowe
class SystemMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      startTime: Date.now(),
      lastHealthCheck: Date.now()
    };
  }

  // Zwiększ licznik requestów
  incrementRequests() {
    this.metrics.requests++;
  }

  // Zwiększ licznik błędów
  incrementErrors() {
    this.metrics.errors++;
  }

  // Pobierz metryki
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const errorRate = this.metrics.requests > 0 ? 
      (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0;

    return {
      ...this.metrics,
      uptime: Math.floor(uptime / 1000), // w sekundach
      errorRate: `${errorRate}%`,
      requestsPerMinute: this.calculateRequestsPerMinute()
    };
  }

  // Oblicz requesty na minutę
  calculateRequestsPerMinute() {
    const uptimeMinutes = (Date.now() - this.metrics.startTime) / (1000 * 60);
    return uptimeMinutes > 0 ? 
      Math.round(this.metrics.requests / uptimeMinutes) : 0;
  }

  // Sprawdź zdrowie systemu
  healthCheck() {
    const metrics = this.getMetrics();
    const isHealthy = metrics.errorRate < 10; // Mniej niż 10% błędów

    this.metrics.lastHealthCheck = Date.now();

    if (!isHealthy) {
      warn('System health check failed', { 
        errorRate: metrics.errorRate,
        totalErrors: metrics.errors,
        totalRequests: metrics.requests
      });
    }

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      metrics,
      timestamp: new Date().toISOString()
    };
  }

  // Sprawdź miejsce na dysku
  checkDiskSpace() {
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      
      if (!fs.existsSync(logsDir)) {
        return { available: true, message: 'Logs directory does not exist' };
      }

      fs.statSync(logsDir);
      // Prosta kontrola - sprawdź czy katalog istnieje i można do niego pisać
      fs.accessSync(logsDir, fs.constants.W_OK);
      
      return { 
        available: true, 
        message: 'Disk space check passed',
        logsDirectory: logsDir
      };
    } catch (err) {
      error('Disk space check failed', { 
        error: err.message,
        logsDir: path.join(__dirname, '..', 'logs')
      });
      
      return { 
        available: false, 
        message: 'Disk space check failed',
        error: err.message
      };
    }
  }

  // Sprawdź rozmiar plików logów
  checkLogFileSizes() {
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      
      if (!fs.existsSync(logsDir)) {
        return { message: 'Logs directory does not exist' };
      }

      const files = fs.readdirSync(logsDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      const fileSizes = logFiles.map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        return {
          file,
          size: Math.round(stats.size / 1024), // w KB
          modified: stats.mtime
        };
      });

      // Sortuj według rozmiaru (największe pierwsze)
      fileSizes.sort((a, b) => b.size - a.size);

      return {
        totalFiles: logFiles.length,
        files: fileSizes,
        totalSize: fileSizes.reduce((sum, file) => sum + file.size, 0)
      };
    } catch (err) {
      error('Log file size check failed', { error: err.message });
      return { error: err.message };
    }
  }

  // Wyczyść stare pliki logów (starsze niż 2 dni)
  cleanupOldLogs() {
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      
      if (!fs.existsSync(logsDir)) {
        return { message: 'Logs directory does not exist' };
      }

      const files = fs.readdirSync(logsDir);
      const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
      let deletedCount = 0;
      const deletedFiles = [];

      files.forEach(file => {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < twoDaysAgo) {
            fs.unlinkSync(filePath);
            deletedCount++;
            deletedFiles.push({
              file,
              size: Math.round(stats.size / 1024), // w KB
              age: Math.round((Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000)) // w dniach
            });
            info('Deleted old log file', { 
              file, 
              age: `${Math.round((Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000))} days`,
              size: `${Math.round(stats.size / 1024)}KB`
            });
          }
        }
      });

      return {
        message: 'Cleanup completed - removed files older than 2 days',
        deletedFiles: deletedCount,
        deletedFilesList: deletedFiles,
        remainingFiles: files.length - deletedCount
      };
    } catch (err) {
      error('Log cleanup failed', { error: err.message });
      return { error: err.message };
    }
  }
}

// Singleton instance
const systemMonitor = new SystemMonitor();

// Harmonogram automatycznego czyszczenia logów
class LogCleanupScheduler {
  constructor() {
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  // Uruchom harmonogram czyszczenia (co 6 godzin)
  start(intervalHours = 6) {
    if (this.isRunning) {
      warn('Log cleanup scheduler is already running');
      return;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000; // konwersja na milisekundy
    
    this.cleanupInterval = global.setInterval(() => {
      this.performCleanup();
    }, intervalMs);

    this.isRunning = true;
    
    // Uruchom pierwsze czyszczenie po 1 minucie
    global.setTimeout(() => {
      this.performCleanup();
    }, 60000);

    info('Log cleanup scheduler started', { 
      intervalHours, 
      nextCleanup: new Date(Date.now() + intervalMs).toISOString() 
    });
  }

  // Zatrzymaj harmonogram
  stop() {
    if (this.cleanupInterval) {
      global.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isRunning = false;
      info('Log cleanup scheduler stopped');
    }
  }

  // Wykonaj czyszczenie
  performCleanup() {
    try {
      info('Starting scheduled log cleanup');
      const result = systemMonitor.cleanupOldLogs();
      
      if (result.error) {
        error('Scheduled log cleanup failed', { error: result.error });
      } else {
        info('Scheduled log cleanup completed', {
          deletedFiles: result.deletedFiles,
          remainingFiles: result.remainingFiles
        });
      }
    } catch (err) {
      error('Scheduled log cleanup error', { error: err.message });
    }
  }

  // Sprawdź status harmonogramu
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.isRunning ? 
        new Date(Date.now() + (6 * 60 * 60 * 1000)).toISOString() : null
    };
  }
}

// Singleton instance harmonogramu
const logCleanupScheduler = new LogCleanupScheduler();

// Middleware do śledzenia requestów
const monitoringMiddleware = (req, res, next) => {
  systemMonitor.incrementRequests();
  
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      systemMonitor.incrementErrors();
    }
  });
  
  next();
};

// Endpoint do metryk
const getMetricsEndpoint = (req, res) => {
  try {
    const metrics = systemMonitor.getMetrics();
    const health = systemMonitor.healthCheck();
    const diskSpace = systemMonitor.checkDiskSpace();
    const logSizes = systemMonitor.checkLogFileSizes();

    res.json({
      success: true,
      data: {
        metrics,
        health,
        diskSpace,
        logSizes,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    error('Failed to get metrics', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system metrics'
    });
  }
};

// Endpoint do czyszczenia logów
const cleanupLogsEndpoint = (req, res) => {
  try {
    const result = systemMonitor.cleanupOldLogs();
    
    res.json({
      success: true,
      message: 'Log cleanup completed',
      data: result
    });
  } catch (err) {
    error('Log cleanup endpoint failed', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup logs'
    });
  }
};

// Endpoint do zarządzania harmonogramem czyszczenia
const schedulerControlEndpoint = (req, res) => {
  try {
    const { action, intervalHours } = req.body;
    
    switch (action) {
      case 'start':
        logCleanupScheduler.start(intervalHours || 6);
        res.json({
          success: true,
          message: 'Log cleanup scheduler started',
          data: logCleanupScheduler.getStatus()
        });
        break;
        
      case 'stop':
        logCleanupScheduler.stop();
        res.json({
          success: true,
          message: 'Log cleanup scheduler stopped',
          data: logCleanupScheduler.getStatus()
        });
        break;
        
      case 'status':
        res.json({
          success: true,
          data: logCleanupScheduler.getStatus()
        });
        break;
        
      case 'cleanup':
        logCleanupScheduler.performCleanup();
        res.json({
          success: true,
          message: 'Manual cleanup triggered',
          data: logCleanupScheduler.getStatus()
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action. Use: start, stop, status, or cleanup'
        });
    }
  } catch (err) {
    error('Scheduler control endpoint failed', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to control scheduler'
    });
  }
};

module.exports = {
  systemMonitor,
  logCleanupScheduler,
  monitoringMiddleware,
  getMetricsEndpoint,
  cleanupLogsEndpoint,
  schedulerControlEndpoint
};
