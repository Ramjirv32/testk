const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const resultsController = require('../controllers/resultsController');

const router = express.Router();

// User results
router.get('/my-results', authMiddleware, resultsController.getUserResults);
router.get('/user-results', authMiddleware, resultsController.getUserResults);
router.get('/result/:resultId', authMiddleware, resultsController.getResultById);
router.get('/stats/user', authMiddleware, resultsController.getUserStats);
router.get('/:allocationId', authMiddleware, resultsController.getResultByAllocationId);
router.get('/performance/category', authMiddleware, resultsController.getCategoryPerformance);
router.get('/performance/level', authMiddleware, resultsController.getLevelPerformance);

module.exports = router;
