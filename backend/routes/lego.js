const express = require('express');
const router = express.Router();
const multer = require('multer');
const LegoController = require('../controllers/legoController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');

// Multer configuration for CSV uploads
const csvStorage = multer.memoryStorage();
const csvUpload = multer({
  storage: csvStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for CSV files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Tylko pliki CSV są dozwolone'), false);
    }
  }
});

// Validation rules
const setValidation = [
  body('setNumber').notEmpty().withMessage('Numer zestawu jest wymagany'),
  body('name').notEmpty().withMessage('Nazwa zestawu jest wymagana'),
  body('theme').notEmpty().withMessage('Motyw jest wymagany'),
  body('year').isInt({ min: 1950, max: 2030 }).withMessage('Rok musi być między 1950 a 2030'),
  body('pieces').isInt({ min: 1 }).withMessage('Liczba elementów musi być większa niż 0'),
  body('retailPrice').isFloat({ min: 0 }).withMessage('Cena detaliczna musi być większa lub równa 0')
];

const collectionValidation = [
  body('setNumber').notEmpty().withMessage('Numer zestawu jest wymagany'),
  body('collectionType').isIn(['owned', 'wanted']).withMessage('Typ kolekcji musi być "owned" lub "wanted"'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Ilość musi być większa niż 0'),
  body('paidPrice').optional().isFloat({ min: 0 }).withMessage('Cena zapłacona musi być większa lub równa 0'),
  body('condition').optional().isIn(['new', 'used', 'excellent', 'good', 'fair']).withMessage('Nieprawidłowy stan')
];

// Public routes
router.get('/sets', LegoController.getAllSets);
router.get('/sets/themes', LegoController.getThemes);
router.get('/sets/years', LegoController.getYears);
router.get('/sets/stats', LegoController.getStats);
router.get('/sets/:setNumber', LegoController.getSetByNumber);
router.get('/sets/:setNumber/offers', LegoController.getSetOffers);
router.get('/offers', LegoController.getAllOffers);

// Protected routes (require authentication)
router.use(authenticateToken);

// Collection management
router.post('/collection/add', collectionValidation, LegoController.addToCollection);
router.delete('/collection/:setNumber/:collectionType', LegoController.removeFromCollection);
router.get('/collection', LegoController.getUserCollection);

// Collection import/export
router.get('/collection/export', LegoController.exportCollection);
router.post('/collection/import', csvUpload.single('csvFile'), LegoController.importCollection);

// Admin routes (you might want to add admin middleware here)
router.post('/sets', setValidation, LegoController.createSet);
router.put('/sets/:id', setValidation, LegoController.updateSet);
router.delete('/sets/:id', LegoController.deleteSet);

module.exports = router;
