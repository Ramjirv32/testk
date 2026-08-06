const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const testAllocationController = require('../controllers/testAllocationController');

const router = express.Router();

// Student routes
router.get('/my-allocations', authMiddleware, testAllocationController.getStudentAllocations);
router.get('/available-slots', authMiddleware, testAllocationController.getAvailableSlots);
router.post('/schedule', authMiddleware, testAllocationController.allocateTest);
router.post('/request', authMiddleware, testAllocationController.allocateTest);

// Admin Action & Lifecycle routes
router.post('/allocate', adminMiddleware, testAllocationController.allocateTest);
router.post('/direct', adminMiddleware, testAllocationController.allocateTest);
router.patch('/:id/approve', adminMiddleware, testAllocationController.approveAllocation);
router.post('/:id/approve', adminMiddleware, testAllocationController.approveAllocation);
router.patch('/:id/reject', adminMiddleware, testAllocationController.rejectAllocation);
router.post('/:id/reject', adminMiddleware, testAllocationController.rejectAllocation);
router.patch('/:id/reschedule', adminMiddleware, testAllocationController.rescheduleAllocation);
router.post('/:id/reschedule', adminMiddleware, testAllocationController.rescheduleAllocation);
router.patch('/:id/cancel', authMiddleware, testAllocationController.cancelAllocation);
router.post('/:id/cancel', authMiddleware, testAllocationController.cancelAllocation);
router.patch('/:id/reassign', adminMiddleware, testAllocationController.reassignAllocation);
router.post('/:id/reassign', adminMiddleware, testAllocationController.reassignAllocation);
router.patch('/:id/terminate', adminMiddleware, testAllocationController.terminateAllocation);
router.post('/:id/terminate', adminMiddleware, testAllocationController.terminateAllocation);
router.patch('/:id/terminate-malpractice', authMiddleware, require('../controllers/examController').terminateMalpractice);
router.post('/:id/terminate-malpractice', authMiddleware, require('../controllers/examController').terminateMalpractice);

// Admin General routes
router.get('/', adminMiddleware, testAllocationController.getAllAllocations);
router.get('/all', adminMiddleware, testAllocationController.getAllAllocations);
router.post('/reset-history/:studentId', adminMiddleware, testAllocationController.resetStudentHistory);
router.get('/:allocationId', authMiddleware, testAllocationController.getAllocationById);

module.exports = router;
