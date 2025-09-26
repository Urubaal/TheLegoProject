const axios = require('axios');

class BricksEconomyService {
  constructor() {
    this.baseUrl = 'https://www.brickeconomy.com';
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  async getSetInfo(setNumber) {
    try {
      // Check cache first
      const cacheKey = `set_${setNumber}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Make API request
      const response = await axios.get(`${this.baseUrl}/api/set/${setNumber}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'LEGO-Purchase-System/1.0'
        }
      });

      if (response.data && response.data.success) {
        const setData = {
          set_number: setNumber,
          name: response.data.data.name,
          theme: response.data.data.theme,
          year_released: response.data.data.year_released,
          pieces: response.data.data.pieces,
          minifigures: response.data.data.minifigures,
          retail_price: response.data.data.retail_price,
          currency: response.data.data.currency || 'USD',
          current_value: response.data.data.current_value,
          value_updated: response.data.data.value_updated,
          image_url: response.data.data.image_url,
          description: response.data.data.description
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: setData,
          timestamp: Date.now()
        });

        return setData;
      } else {
        throw new Error('Set not found or API error');
      }
    } catch (error) {
      console.error(`Error fetching set ${setNumber} from BricksEconomy:`, error.message);
      
      // Return basic info if API fails
      return {
        set_number: setNumber,
        name: `LEGO Set ${setNumber}`,
        theme: 'Unknown',
        year_released: null,
        pieces: null,
        minifigures: null,
        retail_price: null,
        currency: 'USD',
        current_value: null,
        value_updated: null,
        image_url: null,
        description: null,
        error: error.message
      };
    }
  }

  async searchSets(query, limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/search`, {
        params: {
          q: query,
          limit: limit
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'LEGO-Purchase-System/1.0'
        }
      });

      if (response.data && response.data.success) {
        return response.data.data.map(set => ({
          set_number: set.set_number,
          name: set.name,
          theme: set.theme,
          year_released: set.year_released,
          pieces: set.pieces,
          minifigures: set.minifigures,
          retail_price: set.retail_price,
          currency: set.currency || 'USD',
          current_value: set.current_value,
          image_url: set.image_url
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error searching sets:', error.message);
      return [];
    }
  }

  async getMinifigInfo(minifigNumber) {
    try {
      const cacheKey = `minifig_${minifigNumber}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(`${this.baseUrl}/api/minifig/${minifigNumber}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'LEGO-Purchase-System/1.0'
        }
      });

      if (response.data && response.data.success) {
        const minifigData = {
          minifig_number: minifigNumber,
          name: response.data.data.name,
          theme: response.data.data.theme,
          year_released: response.data.data.year_released,
          current_value: response.data.data.current_value,
          currency: response.data.data.currency || 'USD',
          value_updated: response.data.data.value_updated,
          image_url: response.data.data.image_url
        };

        this.cache.set(cacheKey, {
          data: minifigData,
          timestamp: Date.now()
        });

        return minifigData;
      } else {
        throw new Error('Minifig not found or API error');
      }
    } catch (error) {
      console.error(`Error fetching minifig ${minifigNumber} from BricksEconomy:`, error.message);
      
      return {
        minifig_number: minifigNumber,
        name: `LEGO Minifig ${minifigNumber}`,
        theme: 'Unknown',
        year_released: null,
        current_value: null,
        currency: 'USD',
        value_updated: null,
        image_url: null,
        error: error.message
      };
    }
  }

  async searchMinifigs(query, limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/search/minifigs`, {
        params: {
          q: query,
          limit: limit
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'LEGO-Purchase-System/1.0'
        }
      });

      if (response.data && response.data.success) {
        return response.data.data.map(minifig => ({
          minifig_number: minifig.minifig_number,
          name: minifig.name,
          theme: minifig.theme,
          year_released: minifig.year_released,
          current_value: minifig.current_value,
          currency: minifig.currency || 'USD',
          image_url: minifig.image_url
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error searching minifigs:', error.message);
      return [];
    }
  }

  // Convert currency if needed
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      // Simple conversion rates (in real app, use proper currency API)
      const rates = {
        'USD': { 'EUR': 0.85, 'PLN': 4.0, 'GBP': 0.75 },
        'EUR': { 'USD': 1.18, 'PLN': 4.7, 'GBP': 0.88 },
        'PLN': { 'USD': 0.25, 'EUR': 0.21, 'GBP': 0.19 },
        'GBP': { 'USD': 1.33, 'EUR': 1.14, 'PLN': 5.3 }
      };

      if (rates[fromCurrency] && rates[fromCurrency][toCurrency]) {
        return Math.round(amount * rates[fromCurrency][toCurrency] * 100) / 100;
      }

      return amount; // Return original if conversion not available
    } catch (error) {
      console.error('Currency conversion error:', error.message);
      return amount;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = BricksEconomyService;
