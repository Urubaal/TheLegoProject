const { validationResult } = require('express-validator');
const ProfileService = require('../services/profileService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

class ProfileController {
  // Get user profile
  static getProfile(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const result = await ProfileService.getUserProfile(userId);

      res.json({
        success: true,
        data: result
      });
    })(req, res);
  }

  // Update user profile
  static updateProfile(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const userId = req.user.userId;
      const { name, username, country } = req.body;

      const result = await ProfileService.updateUserProfile(userId, { name, username, country });

      res.json({
        message: 'Profile updated successfully',
        user: result.user
      });
    })(req, res);
  }

  // Get user's collection
  static getCollection(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { type } = req.query;

      const collection = await ProfileService.getUserCollection(userId, type);

      res.json(collection);
    })(req, res);
  }

  // Add set to collection
  static addSet(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const userId = req.user.userId;
      const setData = req.body;

      const addedSet = await ProfileService.addSetToCollection(userId, setData);

      res.status(201).json({
        message: 'Set added to collection successfully',
        set: addedSet
      });
    })(req, res);
  }

  // Add wanted set
  static addWantedSet(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const userId = req.user.userId;
      const setData = req.body;

      const addedSet = await ProfileService.addWantedSet(userId, setData);

      res.status(201).json({
        message: 'Set added to wanted list successfully',
        set: addedSet
      });
    })(req, res);
  }

  // Add minifig to collection
  static addMinifig(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const userId = req.user.userId;
      const minifigData = req.body;

      const addedMinifig = await ProfileService.addMinifigToCollection(userId, minifigData);

      res.status(201).json({
        message: 'Minifig added to collection successfully',
        minifig: addedMinifig
      });
    })(req, res);
  }

  // Add wanted minifig
  static addWantedMinifig(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const userId = req.user.userId;
      const minifigData = req.body;

      const addedMinifig = await ProfileService.addWantedMinifig(userId, minifigData);

      res.status(201).json({
        message: 'Minifig added to wanted list successfully',
        minifig: addedMinifig
      });
    })(req, res);
  }

  // Search sets
  static searchSets(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { q, limit = 10 } = req.query;
      const results = await ProfileService.searchSets(q, limit);

      res.json(results);
    })(req, res);
  }

  // Search minifigs
  static searchMinifigs(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { q, limit = 10 } = req.query;
      const results = await ProfileService.searchMinifigs(q, limit);

      res.json(results);
    })(req, res);
  }

  // Update collection item
  static updateCollectionItem(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const userId = req.user.userId;
      const { type, id } = req.params;
      const updateData = req.body;

      const updatedItem = await ProfileService.updateCollectionItem(userId, type, id, updateData);

      res.json({
        message: 'Item updated successfully',
        item: updatedItem
      });
    })(req, res);
  }

  // Delete collection item
  static deleteCollectionItem(req, res) {
    return asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const userId = req.user.userId;
      const { type, id } = req.params;

      await ProfileService.deleteCollectionItem(userId, type, id);

      res.json({
        message: 'Item deleted successfully'
      });
    })(req, res);
  }
}

module.exports = ProfileController;