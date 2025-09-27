const User = require('../models/User');
const UserCollection = require('../models/UserCollection');
const BricksEconomyService = require('../utils/bricksEconomyService');
const { AppError } = require('../middleware/errorHandler');
const { error: logError, info: logInfo } = require('../utils/logger');
const redisService = require('../utils/redisService');

class ProfileService {
  constructor() {
    this.bricksEconomy = new BricksEconomyService();
  }

  // Get user profile with collection stats
  static async getUserProfile(userId) {
    if (!userId) {
      throw new AppError('Invalid token - no user ID', 401);
    }

    // Try to get from cache first
    const cacheKey = `profile:${userId}`;
    try {
      if (await redisService.isHealthy()) {
        const cachedProfile = await redisService.get(cacheKey);
        if (cachedProfile) {
          logInfo('Profile retrieved from cache', { userId });
          return cachedProfile;
        }
      }
    } catch (cacheError) {
      logError('Cache retrieval failed', { 
        error: cacheError.message,
        userId 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get collection statistics (make it optional to avoid blocking)
    let stats = {};
    try {
      stats = await UserCollection.getCollectionStats(userId);
    } catch (statsError) {
      logError('Could not fetch collection stats', { 
        error: statsError.message,
        userId 
      });
      stats = { owned_sets: 0, wanted_sets: 0, owned_minifigs: 0, wanted_minifigs: 0 };
    }

    const profileData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.display_name,
        country: user.country,
        created_at: user.created_at,
        last_login: user.last_login
      },
      collection_stats: stats
    };

    // Cache the profile for 5 minutes
    try {
      if (await redisService.isHealthy()) {
        await redisService.set(cacheKey, profileData, 300); // 5 minutes TTL
        logInfo('Profile cached', { userId });
      }
    } catch (cacheError) {
      logError('Cache storage failed', { 
        error: cacheError.message,
        userId 
      });
    }

    return profileData;
  }

  // Update user profile
  static async updateUserProfile(userId, profileData) {
    const { name, username, country } = profileData;

    // Check if username is already taken by another user
    const existingUser = await User.findByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      throw new AppError('Username already taken', 400);
    }

    const updatedUser = await User.updateProfile(userId, { name, username, country });

    // Invalidate cache after profile update
    const cacheKey = `profile:${userId}`;
    try {
      if (await redisService.isHealthy()) {
        await redisService.del(cacheKey);
        logInfo('Profile cache invalidated after update', { userId });
      }
    } catch (cacheError) {
      logError('Cache invalidation failed', { 
        error: cacheError.message,
        userId 
      });
    }

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        country: updatedUser.country
      }
    };
  }

  // Get user's collection
  static async getUserCollection(userId, type) {
    // Try to get from cache first
    const cacheKey = `collection:${userId}:${type || 'all'}`;
    try {
      if (await redisService.isHealthy()) {
        const cachedCollection = await redisService.get(cacheKey);
        if (cachedCollection) {
          logInfo('Collection retrieved from cache', { userId, type });
          return cachedCollection;
        }
      }
    } catch (cacheError) {
      logError('Collection cache retrieval failed', { 
        error: cacheError.message,
        userId,
        type 
      });
    }

    const collection = {};

    if (!type || type === 'all' || type === 'sets') {
      collection.owned_sets = await UserCollection.getOwnedSets(userId);
      collection.wanted_sets = await UserCollection.getWantedSets(userId);
    }

    if (!type || type === 'all' || type === 'minifigs') {
      collection.owned_minifigs = await UserCollection.getOwnedMinifigs(userId);
      collection.wanted_minifigs = await UserCollection.getWantedMinifigs(userId);
    }

    // Cache the collection for 10 minutes
    try {
      if (await redisService.isHealthy()) {
        await redisService.set(cacheKey, collection, 600); // 10 minutes TTL
        logInfo('Collection cached', { userId, type });
      }
    } catch (cacheError) {
      logError('Collection cache storage failed', { 
        error: cacheError.message,
        userId,
        type 
      });
    }

    return collection;
  }

  // Add set to collection
  static async addSetToCollection(userId, setData) {
    const { set_number, condition_status, purchase_price, purchase_currency, notes } = setData;

    // Try to get set info from BricksEconomy
    let setInfo = {};
    try {
      setInfo = await this.bricksEconomy.getSetInfo(set_number);
    } catch (error) {
      logError('Could not fetch set info from BricksEconomy', { 
        error: error.message,
        set_number,
        userId 
      });
    }

    const processedSetData = {
      lego_set_id: null, // Will be set if set exists in our database
      set_number: set_number,
      set_name: setInfo.name || `LEGO Set ${set_number}`,
      condition_status: condition_status || 'new',
      purchase_price: purchase_price,
      purchase_currency: purchase_currency || 'PLN',
      notes: notes
    };

    const addedSet = await UserCollection.addOwnedSet(userId, processedSetData);
    
    // Invalidate collection cache after adding set
    await this.invalidateCollectionCache(userId);
    
    return addedSet;
  }

  // Add wanted set
  static async addWantedSet(userId, setData) {
    const { set_number, max_price, max_currency, priority, notes } = setData;

    // Try to get set info from BricksEconomy
    let setInfo = {};
    try {
      setInfo = await this.bricksEconomy.getSetInfo(set_number);
    } catch (error) {
      logError('Could not fetch set info from BricksEconomy', { 
        error: error.message,
        set_number,
        userId 
      });
    }

    const processedSetData = {
      lego_set_id: null,
      set_number: set_number,
      set_name: setInfo.name || `LEGO Set ${set_number}`,
      max_price: max_price,
      max_currency: max_currency || 'PLN',
      priority: priority || 1,
      notes: notes
    };

    const addedSet = await UserCollection.addWantedSet(userId, processedSetData);
    
    // Invalidate collection cache after adding wanted set
    await this.invalidateCollectionCache(userId);
    
    return addedSet;
  }

  // Add minifig to collection
  static async addMinifigToCollection(userId, minifigData) {
    const { minifig_name, minifig_number, condition_status, purchase_price, purchase_currency, notes } = minifigData;

    // Try to get minifig info from BricksEconomy if number provided
    let minifigInfo = {};
    if (minifig_number) {
      try {
        minifigInfo = await this.bricksEconomy.getMinifigInfo(minifig_number);
      } catch (error) {
        logError('Could not fetch minifig info from BricksEconomy', { 
          error: error.message,
          minifig_number,
          userId 
        });
      }
    }

    const processedMinifigData = {
      minifig_name: minifig_name,
      minifig_number: minifig_number,
      condition_status: condition_status || 'new',
      purchase_price: purchase_price,
      purchase_currency: purchase_currency || 'PLN',
      notes: notes
    };

    const addedMinifig = await UserCollection.addOwnedMinifig(userId, processedMinifigData);
    
    // Invalidate collection cache after adding minifig
    await this.invalidateCollectionCache(userId);
    
    return addedMinifig;
  }

  // Add wanted minifig
  static async addWantedMinifig(userId, minifigData) {
    const { minifig_name, minifig_number, max_price, max_currency, priority, notes } = minifigData;

    const processedMinifigData = {
      minifig_name: minifig_name,
      minifig_number: minifig_number,
      max_price: max_price,
      max_currency: max_currency || 'PLN',
      priority: priority || 1,
      notes: notes
    };

    const addedMinifig = await UserCollection.addWantedMinifig(userId, processedMinifigData);
    
    // Invalidate collection cache after adding wanted minifig
    await this.invalidateCollectionCache(userId);
    
    return addedMinifig;
  }

  // Search sets
  static async searchSets(query, limit = 10) {
    const results = await this.bricksEconomy.searchSets(query, parseInt(limit));
    return {
      query: query,
      results: results
    };
  }

  // Search minifigs
  static async searchMinifigs(query, limit = 10) {
    const results = await this.bricksEconomy.searchMinifigs(query, parseInt(limit));
    return {
      query: query,
      results: results
    };
  }

  // Update collection item
  static async updateCollectionItem(userId, type, id, updateData) {
    let updatedItem;

    switch (type) {
      case 'owned-set':
        updatedItem = await UserCollection.updateOwnedSet(userId, id, updateData);
        break;
      case 'wanted-set':
        updatedItem = await UserCollection.updateWantedSet(userId, id, updateData);
        break;
      default:
        throw new AppError('Invalid collection type', 400);
    }

    if (!updatedItem) {
      throw new AppError('Item not found', 404);
    }

    // Invalidate collection cache after update
    await this.invalidateCollectionCache(userId);

    return updatedItem;
  }

  // Delete collection item
  static async deleteCollectionItem(userId, type, id) {
    let deleted;

    switch (type) {
      case 'owned-set':
        deleted = await UserCollection.deleteOwnedSet(userId, id);
        break;
      case 'wanted-set':
        deleted = await UserCollection.deleteWantedSet(userId, id);
        break;
      default:
        throw new AppError('Invalid collection type', 400);
    }

    if (!deleted) {
      throw new AppError('Item not found', 404);
    }

    // Invalidate collection cache after deletion
    await this.invalidateCollectionCache(userId);

    return true;
  }

  // Helper method to invalidate collection cache
  static async invalidateCollectionCache(userId) {
    try {
      if (await redisService.isHealthy()) {
        // Invalidate all collection cache keys for this user
        const cacheKeys = [
          `collection:${userId}:all`,
          `collection:${userId}:sets`,
          `collection:${userId}:minifigs`
        ];
        
        for (const key of cacheKeys) {
          await redisService.del(key);
        }
        
        logInfo('Collection cache invalidated', { userId });
      }
    } catch (cacheError) {
      logError('Collection cache invalidation failed', { 
        error: cacheError.message,
        userId 
      });
    }
  }
}

module.exports = ProfileService;
