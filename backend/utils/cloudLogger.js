const { LoggingWinston } = require('@google-cloud/logging-winston');
const winston = require('winston');

// Konfiguracja Google Cloud Logging
const createCloudLogger = () => {
  // Sprawdź czy jesteśmy w środowisku Google Cloud
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT) {
    console.log('Google Cloud Logging not configured - using local logging only');
    return null;
  }

  try {
    const loggingWinston = new LoggingWinston({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      logName: 'lego-purchase-system',
      resource: {
        type: 'global'
      },
      labels: {
        service: 'lego-backend',
        environment: process.env.NODE_ENV || 'development'
      }
    });

    return loggingWinston;
  } catch (error) {
    console.error('Failed to initialize Google Cloud Logging:', error.message);
    return null;
  }
};

// Konfiguracja Datadog (opcjonalna)
const createDatadogLogger = () => {
  if (!process.env.DATADOG_API_KEY) {
    return null;
  }

  try {
    // Datadog transport dla Winston
    const DatadogWinston = require('datadog-winston');
    
    return new DatadogWinston({
      apiKey: process.env.DATADOG_API_KEY,
      hostname: process.env.HOSTNAME || 'localhost',
      service: 'lego-purchase-system',
      ddsource: 'nodejs',
      ddtags: `env:${process.env.NODE_ENV || 'development'}`
    });
  } catch (error) {
    console.error('Failed to initialize Datadog logging:', error.message);
    return null;
  }
};

// Eksportuj funkcje konfiguracyjne
module.exports = {
  createCloudLogger,
  createDatadogLogger
};
