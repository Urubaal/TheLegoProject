const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ProfileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const {
  updateProfileValidation,
  addSetValidation,
  addWantedSetValidation,
  addMinifigValidation,
  addWantedMinifigValidation,
  searchValidation,
  collectionItemValidation,
  updateCollectionItemValidation
} = require('../middleware/validation');

// Multer configuration for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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
router.put('/collection/:type/:id', updateCollectionItemValidation, ProfileController.updateCollectionItem);
router.delete('/collection/:type/:id', collectionItemValidation, ProfileController.deleteCollectionItem);

// Photo upload route
router.post('/collection/:type/:id/photo', collectionItemValidation, upload.single('photo'), ProfileController.uploadPhoto);

module.exports = router;
