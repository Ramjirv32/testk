const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  // Create user (with optional password for OAuth users)
  static async createUser(email, name, password = null, age = null, studentType = null) {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const id = uuidv4();
    const created_at = new Date();

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, age, student_type, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, name, age, student_type, created_at`,
      [id, email, hashedPassword, name, age, studentType, created_at]
    );
    return result.rows[0];
  }

  // Sync user from Go backend (create if not exists, update if exists)
  static async syncUserFromGoBackend(goUser) {
    const { userId, email, name, age, studentType } = goUser;

    // Check if user already exists
    let user = await this.getUserByEmail(email);

    if (user) {
      // Update user
      return await this.updateUser(user.id, {
        name,
        age,
        student_type: studentType,
      });
    }

    // Create new user (without password since it comes from Go)
    const result = await pool.query(
      `INSERT INTO users (email, name, age, student_type, created_at) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, age, student_type, created_at`,
      [email, name, age, studentType, new Date()]
    );
    return result.rows[0];
  }

  static async getUserByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, name, age, student_type, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async getUserById(id) {
    const result = await pool.query(
      'SELECT id, email, name, age, student_type, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async getUserByIdWithPassword(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async verifyPassword(password, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(password, hashedPassword);
  }

  static async getAllUsers() {
    const result = await pool.query(
      'SELECT id, email, name, age, student_type, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async updateUser(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'email', 'age', 'student_type'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING id, email, name, age, student_type, created_at, updated_at`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteUser(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  }

  static async getUserStats(id) {
    const result = await pool.query(
      `SELECT 
        u.id, u.email, u.name, u.age, u.student_type,
        COUNT(DISTINCT ta.id) as tests_allocated,
        COUNT(DISTINCT ts.id) as tests_completed,
        ROUND(AVG(ts.score), 2) as avg_score,
        MAX(ts.score) as max_score,
        COUNT(DISTINCT ua.question_id) as questions_attempted
       FROM users u
       LEFT JOIN test_allocations ta ON u.id = ta.student_id
       LEFT JOIN test_sessions ts ON u.id = ts.user_id AND ts.submitted_at IS NOT NULL
       LEFT JOIN user_answers ua ON u.id = ua.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = User;
