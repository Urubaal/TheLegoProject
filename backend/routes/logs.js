const express = require('express');
const { getLogs, getLogStats, searchLogs, cleanupLogs, getLogById } = require('../controllers/logsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Wszystkie endpointy wymagają autoryzacji (opcjonalne - można usunąć dla publicznego dostępu)
// router.use(authenticateToken);

/**
 * @route GET /api/logs
 * @desc Pobierz logi z filtrowaniem i paginacją
 * @access Private (opcjonalne)
 * @query page, limit, level, service, environment, userId, startDate, endDate, search
 */
router.get('/', getLogs);

/**
 * @route GET /api/logs/stats
 * @desc Pobierz statystyki logów
 * @access Private (opcjonalne)
 * @query service, environment
 */
router.get('/stats', getLogStats);

/**
 * @route GET /api/logs/:id
 * @desc Pobierz szczegóły konkretnego loga
 * @access Private (opcjonalne)
 * @param id - ID loga
 */
router.get('/:id', getLogById);

/**
 * @route POST /api/logs/search
 * @desc Wyszukaj logi za pomocą zaawansowanych filtrów
 * @access Private (opcjonalne)
 * @body query, level, userId, ip, startDate, endDate, limit
 */
router.post('/search', searchLogs);

/**
 * @route POST /api/logs/cleanup
 * @desc Wyczyść stare logi
 * @access Private (opcjonalne)
 * @body olderThanDays
 */
router.post('/cleanup', cleanupLogs);

module.exports = router;
