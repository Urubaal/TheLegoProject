const { body, param, query } = require('express-validator');

// Auth validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('username')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('Username must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('display_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters'),
  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Profile validation rules
const updateProfileValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 2, max: 30 })
    .withMessage('Username must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('country')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
];

const addSetValidation = [
  body('set_number')
    .notEmpty()
    .withMessage('Set number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Set number must be between 1 and 20 characters'),
  body('condition_status')
    .optional()
    .isIn(['factory_sealed', 'new', 'used', 'damaged'])
    .withMessage('Condition status must be factory_sealed, new, used, or damaged'),
  body('purchase_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  body('purchase_currency')
    .optional()
    .isIn(['PLN', 'EUR'])
    .withMessage('Purchase currency must be PLN or EUR'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const addWantedSetValidation = [
  body('set_number')
    .notEmpty()
    .withMessage('Set number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Set number must be between 1 and 20 characters'),
  body('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  body('max_currency')
    .optional()
    .isIn(['PLN', 'EUR'])
    .withMessage('Max currency must be PLN or EUR'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const addMinifigValidation = [
  body('minifig_name')
    .notEmpty()
    .withMessage('Minifig name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Minifig name must be between 1 and 100 characters'),
  body('minifig_number')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Minifig number must be between 1 and 20 characters'),
  body('condition_status')
    .optional()
    .isIn(['factory_sealed', 'new', 'used', 'damaged'])
    .withMessage('Condition status must be factory_sealed, new, used, or damaged'),
  body('purchase_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  body('purchase_currency')
    .optional()
    .isIn(['PLN', 'EUR'])
    .withMessage('Purchase currency must be PLN or EUR'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const addWantedMinifigValidation = [
  body('minifig_name')
    .notEmpty()
    .withMessage('Minifig name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Minifig name must be between 1 and 100 characters'),
  body('minifig_number')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Minifig number must be between 1 and 20 characters'),
  body('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  body('max_currency')
    .optional()
    .isIn(['PLN', 'EUR'])
    .withMessage('Max currency must be PLN or EUR'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const searchValidation = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const collectionItemValidation = [
  param('type')
    .isIn(['owned-set', 'wanted-set', 'owned-minifig', 'wanted-minifig'])
    .withMessage('Invalid collection type'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid item ID')
];

const updateCollectionItemValidation = [
  param('type')
    .isIn(['owned-set', 'wanted-set', 'owned-minifig', 'wanted-minifig'])
    .withMessage('Invalid collection type'),
  param('id')
    .isUUID()
    .withMessage('Invalid item ID'),
  // Common fields for all types
  body('set_name')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Set name must be between 1 and 200 characters'),
  body('minifig_name')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Minifig name must be between 1 and 200 characters'),
  body('condition_status')
    .optional()
    .isIn(['factory_sealed', 'new', 'used', 'damaged'])
    .withMessage('Condition status must be factory_sealed, new, used, or damaged'),
  body('purchase_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  body('purchase_currency')
    .optional()
    .isIn(['PLN', 'EUR'])
    .withMessage('Purchase currency must be PLN or EUR'),
  body('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  body('max_currency')
    .optional()
    .isIn(['PLN', 'EUR'])
    .withMessage('Max currency must be PLN or EUR'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('purchase_date')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      // If value is provided, validate it's a valid date
      const date = new Date(value);
      return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
    })
    .withMessage('Purchase date must be a valid date or empty'),
  // Boolean fields
  body('has_minifigures')
    .optional()
    .isBoolean()
    .withMessage('Has minifigures must be a boolean'),
  body('has_instructions')
    .optional()
    .isBoolean()
    .withMessage('Has instructions must be a boolean'),
  body('has_box')
    .optional()
    .isBoolean()
    .withMessage('Has box must be a boolean'),
  body('has_building_blocks')
    .optional()
    .isBoolean()
    .withMessage('Has building blocks must be a boolean')
];

module.exports = {
  // Auth validations
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  
  // Profile validations
  updateProfileValidation,
  addSetValidation,
  addWantedSetValidation,
  addMinifigValidation,
  addWantedMinifigValidation,
  searchValidation,
  collectionItemValidation,
  updateCollectionItemValidation
};
