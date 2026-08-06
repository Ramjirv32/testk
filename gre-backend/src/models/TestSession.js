const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TestSession {
  static async createSession(userId, subject, testType = 'PRACTICE', totalQuestions = 10, timeLimitMinutes = 60) {
    const id = uuidv4();
    const started_at = new Date();

    const result = await pool.query(
      `INSERT INTO test_sessions (id, user_id, subject, test_type, total_questions, time_limit_minutes, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, userId, subject, testType, totalQuestions, timeLimitMinutes, started_at]
    );
    return result.rows[0];
  }

  static async getSessionById(id) {
    const result = await pool.query('SELECT * FROM test_sessions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getUserSessions(userId) {
    const result = await pool.query(
      'SELECT * FROM test_sessions WHERE user_id = $1 ORDER BY started_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async submitSession(sessionId, score, percentile) {
    const submitted_at = new Date();

    const result = await pool.query(
      `UPDATE test_sessions SET submitted_at = $1, score = $2, percentile = $3
       WHERE id = $4 RETURNING *`,
      [submitted_at, score, percentile, sessionId]
    );
    return result.rows[0];
  }

  static async getSessionStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_tests,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        subject,
        COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as completed_tests
       FROM test_sessions
       WHERE user_id = $1 AND submitted_at IS NOT NULL
       GROUP BY subject`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = TestSession;
