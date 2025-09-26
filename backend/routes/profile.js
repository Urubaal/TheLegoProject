const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);

// Collection routes
router.get('/collection', ProfileController.getCollection);

// Set routes
router.post('/collection/sets', ProfileController.addSet);
router.post('/collection/wanted-sets', ProfileController.addWantedSet);

// Minifig routes
router.post('/collection/minifigs', ProfileController.addMinifig);
router.post('/collection/wanted-minifigs', ProfileController.addWantedMinifig);

// Search routes
router.get('/search/sets', ProfileController.searchSets);
router.get('/search/minifigs', ProfileController.searchMinifigs);

// Update/Delete collection items
router.put('/collection/:type/:id', ProfileController.updateCollectionItem);
router.delete('/collection/:type/:id', ProfileController.deleteCollectionItem);

module.exports = router;
