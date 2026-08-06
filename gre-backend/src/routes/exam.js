const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const examController = require('../controllers/examController');

const router = express.Router();

// Exam routes
router.post('/start', authMiddleware, examController.startExam);
router.get('/:allocationId/questions', authMiddleware, examController.getExamQuestions);
router.post('/save-answer', authMiddleware, examController.saveAnswer);
router.post('/mark-for-review', authMiddleware, examController.markForReview);
router.get('/:sessionId/progress', authMiddleware, examController.getExamProgress);
router.post('/malpractice-log', authMiddleware, examController.logMalpractice);
router.post('/submit', authMiddleware, examController.submitExam);

module.exports = router;
