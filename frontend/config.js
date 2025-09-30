// API Configuration - Dynamic URL based on environment
// This file provides the correct API URL for both development and production

/**
 * Get API base URL based on current environment
 * @returns {string} API base URL
 */
function getApiUrl() {
  // Check if we're on localhost (development)
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '') {
    return 'http://localhost:3000/api';
  }
  
  // Production - use same host with /api path (nginx proxy)
  return `${window.location.protocol}//${window.location.host}/api`;
}

// Export API base URL
const API_BASE_URL = getApiUrl();

// Log API URL in development for debugging
if (window.location.hostname === 'localhost') {
  console.log('🔗 API URL:', API_BASE_URL);
}
