const User = require('../models/User');
const UserCollection = require('../models/UserCollection');
const BricksEconomyService = require('../utils/bricksEconomyService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { error: logError } = require('../utils/logger');

const bricksEconomy = new BricksEconomyService();

class ProfileController {
  // Get user profile
  static getProfile(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      
      if (!userId) {
        throw new AppError('Invalid token - no user ID', 401);
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

      const response = {
        success: true,
        data: {
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
        }
      };

      res.json(response);
    })(req, res);
  }

  // Update user profile
  static updateProfile(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { name, username, country } = req.body;

      // Validate required fields
      if (!name || !username) {
        throw new AppError('Name and username are required', 400);
      }

      // Check if username is already taken by another user
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        throw new AppError('Username already taken', 400);
      }

      const updatedUser = await User.updateProfile(userId, { name, username, country });

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name,
          country: updatedUser.country
        }
      });
    })(req, res);
  }

  // Get user's collection
  static getCollection(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { type } = req.query;

      const collection = {};

      if (!type || type === 'all' || type === 'sets') {
        collection.owned_sets = await UserCollection.getOwnedSets(userId);
        collection.wanted_sets = await UserCollection.getWantedSets(userId);
      }

      if (!type || type === 'all' || type === 'minifigs') {
        collection.owned_minifigs = await UserCollection.getOwnedMinifigs(userId);
        collection.wanted_minifigs = await UserCollection.getWantedMinifigs(userId);
      }

      res.json(collection);
    })(req, res);
  }

  // Add set to collection
  static addSet(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { set_number, condition_status, purchase_price, purchase_currency, notes } = req.body;

      if (!set_number) {
        throw new AppError('Set number is required', 400);
      }

      // Try to get set info from BricksEconomy
      let setInfo = {};
      try {
        setInfo = await bricksEconomy.getSetInfo(set_number);
      } catch (error) {
        logError('Could not fetch set info from BricksEconomy', { 
          error: error.message,
          set_number,
          userId 
        });
      }

      const setData = {
        lego_set_id: null, // Will be set if set exists in our database
        set_number: set_number,
        set_name: setInfo.name || `LEGO Set ${set_number}`,
        condition_status: condition_status || 'new',
        purchase_price: purchase_price,
        purchase_currency: purchase_currency || 'PLN',
        notes: notes
      };

      const addedSet = await UserCollection.addOwnedSet(userId, setData);

      res.status(201).json({
        message: 'Set added to collection successfully',
        set: addedSet
      });
    })(req, res);
  }

  // Add wanted set
  static addWantedSet(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { set_number, max_price, max_currency, priority, notes } = req.body;

      if (!set_number) {
        throw new AppError('Set number is required', 400);
      }

      // Try to get set info from BricksEconomy
      let setInfo = {};
      try {
        setInfo = await bricksEconomy.getSetInfo(set_number);
      } catch (error) {
        logError('Could not fetch set info from BricksEconomy', { 
          error: error.message,
          set_number,
          userId 
        });
      }

      const setData = {
        lego_set_id: null,
        set_number: set_number,
        set_name: setInfo.name || `LEGO Set ${set_number}`,
        max_price: max_price,
        max_currency: max_currency || 'PLN',
        priority: priority || 1,
        notes: notes
      };

      const addedSet = await UserCollection.addWantedSet(userId, setData);

      res.status(201).json({
        message: 'Set added to wanted list successfully',
        set: addedSet
      });
    })(req, res);
  }

  // Add minifig to collection
  static addMinifig(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { minifig_name, minifig_number, condition_status, purchase_price, purchase_currency, notes } = req.body;

      if (!minifig_name) {
        throw new AppError('Minifig name is required', 400);
      }

      // Try to get minifig info from BricksEconomy if number provided
      let minifigInfo = {};
      if (minifig_number) {
        try {
          minifigInfo = await bricksEconomy.getMinifigInfo(minifig_number);
        } catch (error) {
          logError('Could not fetch minifig info from BricksEconomy', { 
            error: error.message,
            minifig_number,
            userId 
          });
        }
      }

      const minifigData = {
        minifig_name: minifig_name,
        minifig_number: minifig_number,
        condition_status: condition_status || 'new',
        purchase_price: purchase_price,
        purchase_currency: purchase_currency || 'PLN',
        notes: notes
      };

      const addedMinifig = await UserCollection.addOwnedMinifig(userId, minifigData);

      res.status(201).json({
        message: 'Minifig added to collection successfully',
        minifig: addedMinifig
      });
    })(req, res);
  }

  // Add wanted minifig
  static addWantedMinifig(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { minifig_name, minifig_number, max_price, max_currency, priority, notes } = req.body;

      if (!minifig_name) {
        throw new AppError('Minifig name is required', 400);
      }

      const minifigData = {
        minifig_name: minifig_name,
        minifig_number: minifig_number,
        max_price: max_price,
        max_currency: max_currency || 'PLN',
        priority: priority || 1,
        notes: notes
      };

      const addedMinifig = await UserCollection.addWantedMinifig(userId, minifigData);

      res.status(201).json({
        message: 'Minifig added to wanted list successfully',
        minifig: addedMinifig
      });
    })(req, res);
  }

  // Search sets
  static searchSets(req, res) {
    return asyncHandler(async (req, res) => {
      const { q, limit = 10 } = req.query;

      if (!q) {
        throw new AppError('Search query is required', 400);
      }

      const results = await bricksEconomy.searchSets(q, parseInt(limit));

      res.json({
        query: q,
        results: results
      });
    })(req, res);
  }

  // Search minifigs
  static searchMinifigs(req, res) {
    return asyncHandler(async (req, res) => {
      const { q, limit = 10 } = req.query;

      if (!q) {
        throw new AppError('Search query is required', 400);
      }

      const results = await bricksEconomy.searchMinifigs(q, parseInt(limit));

      res.json({
        query: q,
        results: results
      });
    })(req, res);
  }

  // Update collection item
  static updateCollectionItem(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { type, id } = req.params;
      const updateData = req.body;

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

      res.json({
        message: 'Item updated successfully',
        item: updatedItem
      });
    })(req, res);
  }

  // Delete collection item
  static deleteCollectionItem(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { type, id } = req.params;

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

      res.json({
        message: 'Item deleted successfully'
      });
    })(req, res);
  }
}

module.exports = ProfileController;