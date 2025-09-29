const express = require('express');
const router = express.Router();
const LegoController = require('../controllers/legoController');
const { authenticateToken } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

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

// Protected routes (require authentication)
router.use(authenticateToken);

// Collection management
router.post('/collection/add', collectionValidation, LegoController.addToCollection);
router.delete('/collection/:setNumber/:collectionType', LegoController.removeFromCollection);
router.get('/collection', LegoController.getUserCollection);

// Admin routes (you might want to add admin middleware here)
router.post('/sets', setValidation, LegoController.createSet);
router.put('/sets/:id', setValidation, LegoController.updateSet);
router.delete('/sets/:id', LegoController.deleteSet);

module.exports = router;
