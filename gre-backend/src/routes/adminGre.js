const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const adminGreController = require('../controllers/adminGreController');

const router = express.Router();

router.get('/stats', adminGreController.getGREStats);
router.get('/allocation-stats', adminGreController.getAllocationStats);
router.get('/dashboard/stats', authMiddleware, adminGreController.getStudentDashboardStats);

module.exports = router;
