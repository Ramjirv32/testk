const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const questionsController = require('../controllers/questionsController');

const router = express.Router();

// Public routes (no auth needed)
router.get('/stats', questionsController.getStats);
router.get('/categories', questionsController.getCategories);
router.get('/levels', questionsController.getLevels);
router.get('/types', questionsController.getQuestionTypes);

// Student / General protected routes
router.get('/', authMiddleware, questionsController.getAllQuestions);
router.get('/by-id/:id', authMiddleware, questionsController.getQuestionById);
router.get('/exam/:id', authMiddleware, questionsController.getQuestionForExam);
router.get('/random', authMiddleware, questionsController.getRandomQuestions);

// Admin Question Management CRUD routes
router.post('/bulk-import', adminMiddleware, questionsController.bulkImportQuestions);
router.post('/', adminMiddleware, questionsController.createQuestion);
router.put('/:id', adminMiddleware, questionsController.updateQuestion);
router.delete('/:id', adminMiddleware, questionsController.deleteQuestion);

module.exports = router;
