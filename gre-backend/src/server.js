const app = require('./app');
const pool = require('./config/database');
const { initializeTables } = require('./config/initDatabase');
require('dotenv').config();

const PORT = process.env.PORT || 11000;

async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);

    // Initialize tables
    await initializeTables();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║          🎓 GRE BACKEND SERVER STARTED                     ║
╠════════════════════════════════════════════════════════════╣
║ Server:      http://localhost:${PORT}                    ║
║ Environment: ${process.env.NODE_ENV}                           ║
║ Database:    ${process.env.DB_NAME}                             ║
║ Port:        ${PORT}                                        ║
╚════════════════════════════════════════════════════════════╝
      
📚 API Endpoints:
  • GET    /health                      - Server health
  • GET    /api/questions               - List questions
  • GET    /api/questions/stats         - Question statistics
  • GET    /api/allocations/my-allocations - My tests
  • POST   /api/exam/start              - Start exam
  • POST   /api/exam/submit             - Submit exam
  • GET    /api/results/my-results      - My results

      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Pool ended');
    process.exit(0);
  });
});

startServer();
