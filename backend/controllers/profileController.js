const { validationResult } = require('express-validator');
const ProfileService = require('../services/profileService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { info, warn, error } = require('../utils/logger');

class ProfileController {
  // Get user profile
  static getProfile(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      info('Profile request', { userId });
      
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
      info('Profile update request', { userId, username });

      const result = await ProfileService.updateUserProfile(userId, { name, username, country });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result
      });
    })(req, res);
  }

  // Get user's collection
  static getCollection(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { type } = req.query;
      info('Collection request', { userId, type });

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
        console.error('Validation errors:', errors.array());
        throw new AppError(`Validation failed: ${errors.array().map(err => err.msg).join(', ')}`, 400);
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

  // Upload photo for collection item
  static uploadPhoto(req, res) {
    return asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const { type, id } = req.params;
      
      if (!req.file) {
        throw new AppError('No photo file provided', 400);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new AppError('Invalid file type. Only images are allowed.', 400);
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new AppError('File too large. Maximum size is 5MB.', 400);
      }

      info('Photo upload request', { userId, type, id, fileSize: req.file.size });

      // For now, we'll store the file path as photo_url
      // In production, you might want to upload to cloud storage (AWS S3, etc.)
      const photoUrl = `/uploads/${req.file.filename}`;

      // Update the collection item with photo_url
      const result = await ProfileService.updateCollectionItemPhoto(userId, type, id, photoUrl);

      res.json({
        success: true,
        message: 'Photo uploaded successfully',
        photo_url: photoUrl,
        data: result
      });
    })(req, res);
  }
}

module.exports = ProfileController;