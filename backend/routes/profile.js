const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const {
  updateProfileValidation,
  addSetValidation,
  addWantedSetValidation,
  addMinifigValidation,
  addWantedMinifigValidation,
  searchValidation,
  collectionItemValidation
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/', ProfileController.getProfile);
router.put('/', updateProfileValidation, ProfileController.updateProfile);

// Collection routes
router.get('/collection', ProfileController.getCollection);

// Set routes
router.post('/collection/sets', addSetValidation, ProfileController.addSet);
router.post('/collection/wanted-sets', addWantedSetValidation, ProfileController.addWantedSet);

// Minifig routes
router.post('/collection/minifigs', addMinifigValidation, ProfileController.addMinifig);
router.post('/collection/wanted-minifigs', addWantedMinifigValidation, ProfileController.addWantedMinifig);

// Search routes
router.get('/search/sets', searchValidation, ProfileController.searchSets);
router.get('/search/minifigs', searchValidation, ProfileController.searchMinifigs);

// Update/Delete collection items
router.put('/collection/:type/:id', collectionItemValidation, ProfileController.updateCollectionItem);
router.delete('/collection/:type/:id', collectionItemValidation, ProfileController.deleteCollectionItem);

module.exports = router;
