const express = require('express');
const adminDashboardController = require('../controllers/adminDashboardController');
const ticketController = require('../controllers/ticketController');
const testAllocationController = require('../controllers/testAllocationController');

const router = express.Router();

/**
 * Dashboard Stats
 */
router.get('/dashboard-stats', adminDashboardController.getDashboardStats);
router.get('/allocation-stats', adminDashboardController.getAllocationStats);

/**
 * Student Management
 */
router.get('/students', adminDashboardController.getStudents);

/**
 * Question Bank Management
 */
router.get('/questions/stats', adminDashboardController.getQuestionStats);
router.get('/questions/categories', adminDashboardController.getCategoryHierarchy);
router.get('/questions/available', adminDashboardController.getAvailableQuestions);
router.get('/questions', adminDashboardController.getQuestions);
router.delete('/questions/:id', adminDashboardController.deleteQuestion);

/**
 * Test Tickets (GRE)
 */
router.get('/tickets', ticketController.getTickets);
router.get('/tickets/:id', ticketController.getTicketById);
router.post('/tickets/:id/approve', ticketController.approveTicket);
router.post('/tickets/:id/reject', ticketController.rejectTicket);

/**
 * Student Management
 */
router.get('/students/:student_id/history', adminDashboardController.getStudentHistory);
router.post('/students/:student_id/reset-history', testAllocationController.resetStudentHistory);

/**
 * Test Allocations
 */
router.get('/allocations', adminDashboardController.getAllocations);
router.get('/allocations/:id', adminDashboardController.getAllocationDetail);
router.post('/allocations', testAllocationController.allocateTest);
router.post('/allocations/direct', adminDashboardController.directAllocate);
router.post('/allocations/:id/approve', testAllocationController.approveAllocation);
router.post('/allocations/:id/reschedule', testAllocationController.rescheduleAllocation);
router.post('/allocations/:id/cancel', testAllocationController.cancelAllocation);
router.post('/allocations/:id/reassign', testAllocationController.reassignAllocation);
router.post('/allocations/:id/reject', testAllocationController.rejectAllocation);
router.post('/allocations/:id/terminate', testAllocationController.terminateAllocation);

/**
 * Test Results
 */
router.get('/test-results', adminDashboardController.getTestResults);

/**
 * Audit Trail
 */
router.get('/audit-trail', adminDashboardController.getAuditTrail);
router.post('/log-action', adminDashboardController.logAdminAction);
router.post('/malpractice-logs', require('../controllers/examController').logMalpractice);

module.exports = router;
