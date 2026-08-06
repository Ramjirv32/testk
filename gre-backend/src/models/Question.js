const pool = require('../config/database');

class Question {
  static async getAllQuestions(filters = {}) {
    let query = 'SELECT * FROM questions WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.subject) {
      paramCount++;
      query += ` AND subject = $${paramCount}`;
      values.push(filters.subject);
    }

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters.level) {
      paramCount++;
      query += ` AND level = $${paramCount}`;
      values.push(filters.level);
    }

    if (filters.question_type) {
      paramCount++;
      query += ` AND question_type = $${paramCount}`;
      values.push(filters.question_type);
    }

    // Pagination
    if (filters.fetchAll || filters.limit === 'all' || filters.limit >= 5000 || filters.limit === 0) {
      query += ` ORDER BY id ASC`;
    } else {
      const limit = filters.limit || 20;
      const offset = (filters.page || 0) * limit;
      query += ` ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`;
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getQuestionById(id) {
    const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getQuestionCount(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM questions WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.subject) {
      paramCount++;
      query += ` AND subject = $${paramCount}`;
      values.push(filters.subject);
    }

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters.level) {
      paramCount++;
      query += ` AND level = $${paramCount}`;
      values.push(filters.level);
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  static async getCategories(subject) {
    const query = 'SELECT DISTINCT category FROM questions WHERE subject = $1 ORDER BY category';
    const result = await pool.query(query, [subject]);
    return result.rows.map(row => row.category);
  }

  static async getLevels() {
    const query = 'SELECT DISTINCT level FROM questions ORDER BY level';
    const result = await pool.query(query);
    return result.rows.map(row => row.level);
  }

  static async getQuestionTypes() {
    const query = 'SELECT DISTINCT question_type FROM questions ORDER BY question_type';
    const result = await pool.query(query);
    return result.rows.map(row => row.question_type);
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        subject,
        COUNT(CASE WHEN level = 'Easy' THEN 1 END) as easy_count,
        COUNT(CASE WHEN level = 'Medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN level = 'Hard' THEN 1 END) as hard_count
      FROM questions
      GROUP BY subject
    `);
    return result.rows;
  }

  static async getRandomQuestions(subject, count = 10, level = null) {
    let query = 'SELECT * FROM questions WHERE subject = $1';
    const values = [subject];

    if (level) {
      query += ' AND level = $2';
      values.push(level);
    }

    query += ` ORDER BY RANDOM() LIMIT ${count}`;

    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = Question;
