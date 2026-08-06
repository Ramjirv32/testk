const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

// Student-facing routes (require auth)
router.post('/request', authMiddleware, ticketController.createTicket);
router.get('/my-requests', authMiddleware, ticketController.getStudentTickets);
router.get('/unread-summary', authMiddleware, ticketController.getUnreadSummary);
router.post('/upload', authMiddleware, ticketController.uploadAttachment);
router.get('/:id/messages', authMiddleware, ticketController.getTicketMessages);
router.post('/:id/messages', authMiddleware, ticketController.sendTicketMessage);
router.post('/:id/close', authMiddleware, ticketController.closeTicket);

// Admin routes
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);
router.patch('/:id/approve', ticketController.approveTicket);
router.patch('/:id/reject', ticketController.rejectTicket);

module.exports = router;
