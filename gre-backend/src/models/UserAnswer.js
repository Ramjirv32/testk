const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserAnswer {
  static async saveAnswer(sessionId, userId, questionId, selectedAnswer, isCorrect, timeSpent = 0) {
    const id = uuidv4();
    const created_at = new Date();

    const result = await pool.query(
      `INSERT INTO user_answers (id, session_id, user_id, question_id, selected_answer, is_correct, time_spent_seconds, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, sessionId, userId, questionId, selectedAnswer, isCorrect, timeSpent, created_at]
    );
    return result.rows[0];
  }

  static async getSessionAnswers(sessionId) {
    const result = await pool.query(
      'SELECT * FROM user_answers WHERE session_id = $1 ORDER BY created_at',
      [sessionId]
    );
    return result.rows;
  }

  static async markForReview(answerId, marked = true) {
    const result = await pool.query(
      'UPDATE user_answers SET marked_for_review = $1 WHERE id = $2 RETURNING *',
      [marked, answerId]
    );
    return result.rows[0];
  }

  static async getMarkedForReview(sessionId) {
    const result = await pool.query(
      'SELECT * FROM user_answers WHERE session_id = $1 AND marked_for_review = true',
      [sessionId]
    );
    return result.rows;
  }

  static async getAnswerStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_answered,
        COUNT(CASE WHEN is_correct THEN 1 END) as correct,
        ROUND(100.0 * COUNT(CASE WHEN is_correct THEN 1 END) / COUNT(*), 2) as accuracy_percent,
        AVG(time_spent_seconds) as avg_time_per_question
       FROM user_answers
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async getUserCategoryStats(userId, subject) {
    const result = await pool.query(
      `SELECT 
        q.category,
        COUNT(*) as total_attempted,
        COUNT(CASE WHEN ua.is_correct THEN 1 END) as correct,
        ROUND(100.0 * COUNT(CASE WHEN ua.is_correct THEN 1 END) / COUNT(*), 2) as accuracy_percent
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.user_id = $1 AND q.subject = $2
       GROUP BY q.category
       ORDER BY q.category`,
      [userId, subject]
    );
    return result.rows;
  }
}

module.exports = UserAnswer;
