const User = require('../models/User');
const UserCollection = require('../models/UserCollection');
const BricksEconomyService = require('../utils/bricksEconomyService');

const bricksEconomy = new BricksEconomyService();

class ProfileController {
  // Get user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      console.log('Profile request for user ID:', userId);
      
      if (!userId) {
        console.error('No user ID in token');
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token - no user ID' 
        });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        console.error('User not found in database:', userId);
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      console.log('User found:', user.email);

      // Get collection statistics (make it optional to avoid blocking)
      let stats = {};
      try {
        stats = await UserCollection.getCollectionStats(userId);
      } catch (statsError) {
        console.warn('Could not fetch collection stats:', statsError.message);
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

      console.log('Sending profile response:', JSON.stringify(response, null, 2));
      res.json(response);
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { name, username, country } = req.body;

      // Validate required fields
      if (!name || !username) {
        return res.status(400).json({ error: 'Name and username are required' });
      }

      // Check if username is already taken by another user
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
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
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user's collection
  static async getCollection(req, res) {
    try {
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
    } catch (error) {
      console.error('Error getting collection:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add set to collection
  static async addSet(req, res) {
    try {
      const userId = req.user.userId;
      const { set_number, condition_status, purchase_price, purchase_currency, notes } = req.body;

      if (!set_number) {
        return res.status(400).json({ error: 'Set number is required' });
      }

      // Try to get set info from BricksEconomy
      let setInfo = {};
      try {
        setInfo = await bricksEconomy.getSetInfo(set_number);
      } catch (error) {
        console.log('Could not fetch set info from BricksEconomy:', error.message);
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
    } catch (error) {
      console.error('Error adding set:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add wanted set
  static async addWantedSet(req, res) {
    try {
      const userId = req.user.userId;
      const { set_number, max_price, max_currency, priority, notes } = req.body;

      if (!set_number) {
        return res.status(400).json({ error: 'Set number is required' });
      }

      // Try to get set info from BricksEconomy
      let setInfo = {};
      try {
        setInfo = await bricksEconomy.getSetInfo(set_number);
      } catch (error) {
        console.log('Could not fetch set info from BricksEconomy:', error.message);
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
    } catch (error) {
      console.error('Error adding wanted set:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add minifig to collection
  static async addMinifig(req, res) {
    try {
      const userId = req.user.userId;
      const { minifig_name, minifig_number, condition_status, purchase_price, purchase_currency, notes } = req.body;

      if (!minifig_name) {
        return res.status(400).json({ error: 'Minifig name is required' });
      }

      // Try to get minifig info from BricksEconomy if number provided
      let minifigInfo = {};
      if (minifig_number) {
        try {
          minifigInfo = await bricksEconomy.getMinifigInfo(minifig_number);
        } catch (error) {
          console.log('Could not fetch minifig info from BricksEconomy:', error.message);
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
    } catch (error) {
      console.error('Error adding minifig:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add wanted minifig
  static async addWantedMinifig(req, res) {
    try {
      const userId = req.user.userId;
      const { minifig_name, minifig_number, max_price, max_currency, priority, notes } = req.body;

      if (!minifig_name) {
        return res.status(400).json({ error: 'Minifig name is required' });
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
    } catch (error) {
      console.error('Error adding wanted minifig:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Search sets
  static async searchSets(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = await bricksEconomy.searchSets(q, parseInt(limit));

      res.json({
        query: q,
        results: results
      });
    } catch (error) {
      console.error('Error searching sets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Search minifigs
  static async searchMinifigs(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = await bricksEconomy.searchMinifigs(q, parseInt(limit));

      res.json({
        query: q,
        results: results
      });
    } catch (error) {
      console.error('Error searching minifigs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update collection item
  static async updateCollectionItem(req, res) {
    try {
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
          return res.status(400).json({ error: 'Invalid collection type' });
      }

      if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json({
        message: 'Item updated successfully',
        item: updatedItem
      });
    } catch (error) {
      console.error('Error updating collection item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete collection item
  static async deleteCollectionItem(req, res) {
    try {
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
          return res.status(400).json({ error: 'Invalid collection type' });
      }

      if (!deleted) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json({
        message: 'Item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting collection item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = ProfileController;
