const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const questionsRoutes = require('./routes/questions');
const allocationsRoutes = require('./routes/allocations');
const examRoutes = require('./routes/exam');
const resultsRoutes = require('./routes/results');
const ticketsRoutes = require('./routes/tickets');
const adminGreRoutes = require('./routes/adminGre');
const adminDashboardRoutes = require('./routes/adminDashboard');
const adminGreController = require('./controllers/adminGreController');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration - allow all origins in dev mode or specified origins
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Serve uploaded & question image files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/images', express.static(path.join(__dirname, '../../original/gre-frontend/public/images')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GRE Backend is running',
    port: process.env.PORT || 11000,
    environment: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/allocations', allocationsRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/test', resultsRoutes);
app.use('/api/tickets', ticketsRoutes);

// Analytics route
app.get('/api/analytics/my-analytics', require('./middleware/auth').authMiddleware, adminGreController.getStudentAnalytics);

// Admin & GRE dashboard routes
app.use('/api/admin/gre', adminGreRoutes);
app.use('/api/gre', adminGreRoutes);
app.use('/api/admin', adminDashboardRoutes);

// Shadow routes for backwards compatibility (mounted after adminDashboardRoutes so they don't shadow custom admin endpoints)
app.use('/api/admin/questions', questionsRoutes);
app.use('/api/admin/allocations', allocationsRoutes);
app.use('/api/admin/tickets', ticketsRoutes);
app.post('/api/admin/malpractice-logs', require('./middleware/auth').authMiddleware, require('./controllers/examController').logMalpractice);
app.post('/api/exam/malpractice-log', require('./middleware/auth').authMiddleware, require('./controllers/examController').logMalpractice);
app.patch('/api/allocations/:id/terminate-malpractice', require('./middleware/auth').authMiddleware, require('./controllers/examController').terminateMalpractice);
app.post('/api/allocations/:id/terminate-malpractice', require('./middleware/auth').authMiddleware, require('./controllers/examController').terminateMalpractice);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

module.exports = app;
