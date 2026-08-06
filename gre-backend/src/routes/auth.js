const express = require('express');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register new student
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password are required' } });
    }

    const userRole = role ? String(role).toUpperCase() : 'STUDENT';
    const userId = `USER_${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         role = EXCLUDED.role
       RETURNING id, email, name, role`,
      [userId, email.toLowerCase().trim(), password, name || email.split('@')[0], userRole]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password are required' } });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Check database
    let user;
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      // Seed default accounts if logging in for first time
      const userRole = cleanEmail === 'itzrvm2337@gmail.com' ? 'ADMIN' : 'STUDENT';
      const userId = cleanEmail === 'itzrvm2337@gmail.com' ? 'admin-1' : `user-${Date.now()}`;

      const seedResult = await pool.query(
        `INSERT INTO users (id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
         RETURNING *`,
        [userId, cleanEmail, password, cleanEmail.split('@')[0], userRole]
      );
      user = seedResult.rows[0];
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT id, email, name, role, age, student_type, created_at FROM users WHERE id = $1', [userId]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User profile not found' } });
    }

    res.json({
      success: true,
      data: result.rows[0],
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, full_name, mobile_number, target_score, target_date } = req.body;
    const updatedName = full_name || name;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name)
       WHERE id = $2 OR email = $3
       RETURNING id, email, name, role`,
      [updatedName || null, userId, req.user.email]
    );

    const updatedUser = result.rows[0] || { id: userId, email: req.user.email, name: updatedName };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

module.exports = router;
