const pool = require('../config/database');

/**
 * GET /api/admin/dashboard-stats
 * Returns comprehensive admin dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total students
    const studentsRes = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['student']
    );
    const total_students = parseInt(studentsRes.rows[0].count, 10) || 0;

    // Get pending tickets
    const ticketsRes = await pool.query(
      "SELECT COUNT(*) as count FROM gre_tickets WHERE UPPER(status) = 'PENDING'"
    );
    const pending_tickets = parseInt(ticketsRes.rows[0].count, 10) || 0;

    // Get total allocations
    const allocRes = await pool.query(
      'SELECT COUNT(*) as count FROM test_allocations'
    );
    const total_allocations = parseInt(allocRes.rows[0].count, 10) || 0;

    // Get total questions
    const questionsRes = await pool.query(
      'SELECT COUNT(*) as count FROM questions'
    );
    const total_questions = parseInt(questionsRes.rows[0].count, 10) || 0;

    // Get tests completed today
    const todayRes = await pool.query(
      `SELECT COUNT(*) as count FROM test_allocations 
       WHERE status IN ('COMPLETED', 'SUBMITTED') 
       AND DATE(COALESCE(submitted_at, updated_at, created_at)) = CURRENT_DATE`
    );
    const tests_completed_today = parseInt(todayRes.rows[0].count, 10) || 0;

    // Get average score (from test results)
    const avgScoreRes = await pool.query(
      `SELECT AVG(score) as avg_score FROM test_results 
       WHERE score IS NOT NULL`
    );
    const average_score = avgScoreRes.rows[0]?.avg_score 
      ? parseFloat(avgScoreRes.rows[0].avg_score).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        total_students,
        pending_tickets,
        total_allocations,
        total_questions,
        tests_completed_today,
        average_score: parseFloat(average_score),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/allocation-stats
 * Returns detailed allocation status breakdown
 */
exports.getAllocationStats = async (req, res) => {
  try {
    const assigned = await pool.query(
      "SELECT COUNT(*) as count FROM test_allocations WHERE UPPER(status) = 'ASSIGNED'"
    );
    const scheduled = await pool.query(
      "SELECT COUNT(*) as count FROM test_allocations WHERE UPPER(status) = 'SCHEDULED'"
    );
    const in_progress = await pool.query(
      "SELECT COUNT(*) as count FROM test_allocations WHERE UPPER(status) = 'IN_PROGRESS'"
    );
    const completed = await pool.query(
      "SELECT COUNT(*) as count FROM test_allocations WHERE UPPER(status) = 'COMPLETED'"
    );
    const expired = await pool.query(
      "SELECT COUNT(*) as count FROM test_allocations WHERE UPPER(status) = 'EXPIRED'"
    );
    const cancelled = await pool.query(
      "SELECT COUNT(*) as count FROM test_allocations WHERE UPPER(status) = 'CANCELLED'"
    );

    res.json({
      success: true,
      data: {
        assigned: parseInt(assigned.rows[0].count, 10) || 0,
        scheduled: parseInt(scheduled.rows[0].count, 10) || 0,
        in_progress: parseInt(in_progress.rows[0].count, 10) || 0,
        completed: parseInt(completed.rows[0].count, 10) || 0,
        expired: parseInt(expired.rows[0].count, 10) || 0,
        cancelled: parseInt(cancelled.rows[0].count, 10) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching allocation stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/students
 * Returns list of all registered students
 */
exports.getStudents = async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT u.id, u.email, u.name, u.created_at,
             COUNT(ta.id) as total_tests,
             SUM(CASE WHEN UPPER(ta.status) = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tests
      FROM users u
      LEFT JOIN test_allocations ta ON (u.id = ta.student_id OR LOWER(u.email) = LOWER(ta.student_id))
      WHERE UPPER(u.role) = 'STUDENT'
    `;
    const params = [];

    if (search) {
      query += ` AND (u.email ILIKE $1 OR u.name ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY u.id, u.email, u.name, u.created_at
               ORDER BY u.created_at DESC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE role = $1';
    const countParams = ['student'];

    if (search) {
      countQuery += ` AND (email ILIKE $2 OR name ILIKE $2)`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total_count = parseInt(countResult.rows[0].count, 10);

    res.json({
      success: true,
      data: {
        students: result.rows,
        total_count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/questions/stats
 * Returns question bank statistics
 */
exports.getQuestionStats = async (req, res) => {
  try {
    // Total questions
    const totalRes = await pool.query(
      'SELECT COUNT(*) as count FROM questions'
    );
    const total_questions = parseInt(totalRes.rows[0].count, 10) || 0;

    // Questions by subject
    const subjectRes = await pool.query(
      `SELECT subject, COUNT(*) as count 
       FROM questions 
       WHERE subject IS NOT NULL
       GROUP BY subject`
    );
    const by_subject = {};
    subjectRes.rows.forEach(row => {
      by_subject[row.subject] = parseInt(row.count, 10);
    });

    // Questions by category
    const categoryRes = await pool.query(
      `SELECT category, COUNT(*) as count 
       FROM questions 
       WHERE category IS NOT NULL
       GROUP BY category`
    );
    const by_category = {};
    categoryRes.rows.forEach(row => {
      by_category[row.category] = parseInt(row.count, 10);
    });

    // Questions by level
    const levelRes = await pool.query(
      `SELECT level, COUNT(*) as count 
       FROM questions 
       WHERE level IS NOT NULL
       GROUP BY level`
    );
    const by_level = {};
    levelRes.rows.forEach(row => {
      by_level[row.level] = parseInt(row.count, 10);
    });

    res.json({
      success: true,
      data: {
        total_questions,
        by_subject,
        by_category,
        by_level,
      },
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/questions
 * Returns paginated list of questions with filters
 */
exports.getQuestions = async (req, res) => {
  try {
    const { subject, category, level, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (subject && subject !== 'ALL') {
      query += ` AND subject = $${params.length + 1}`;
      params.push(subject);
    }

    if (category && category !== 'ALL') {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (level && level !== 'ALL') {
      query += ` AND level = $${params.length + 1}`;
      params.push(level);
    }

    if (search) {
      query += ` AND question_text ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        questions: result.rows,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/admin/questions/:id
 * Delete a question
 */
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM questions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/audit-trail
 * Returns admin audit log
 */
exports.getAuditTrail = async (req, res) => {
  try {
    const { action, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT id, action, admin_email, target_id, details, created_at, metadata
      FROM admin_audit_logs
      WHERE 1=1
    `;
    const params = [];

    if (action && action !== 'ALL') {
      query += ` AND action = $${params.length + 1}`;
      params.push(action);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        logs: result.rows.map(log => ({
          ...log,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/allocations
 * Get all test allocations with optional filters
 */
exports.getAllocations = async (req, res) => {
  try {
    const { status, student_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT a.*,
             COALESCE(u.email, CASE WHEN a.student_id LIKE '%@%' THEN a.student_id ELSE NULL END) as student_email,
             COALESCE(u.name, CASE WHEN a.student_id LIKE '%@%' THEN SPLIT_PART(a.student_id, '@', 1) ELSE a.student_id END) as student_name
      FROM test_allocations a
      LEFT JOIN users u ON (a.student_id = u.id OR LOWER(a.student_id) = LOWER(u.email))
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      query += ` AND UPPER(a.status) = $${params.length + 1}`;
      params.push(status.toUpperCase());
    }

    if (student_id) {
      query += ` AND a.student_id = $${params.length + 1}`;
      params.push(student_id);
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const allocations = result.rows.map(a => ({
      ...a,
      question_ids: safeParseQuestionIds(a.question_ids),
    }));

    res.json({
      success: true,
      data: {
        allocations,
      },
    });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Helper function to safely parse question IDs
 */
function safeParseQuestionIds(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch (e) {
    if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
      return val.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    }
    return typeof val === 'string' ? val.split(',').map(s => s.trim()) : [val];
  }
}

/**
 * GET /api/admin/allocations/:id
 * Get allocation detail with student responses and anti-cheat violations
 */
exports.getAllocationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const allocRes = await pool.query(
      `SELECT a.*, u.email as student_email, u.name as student_name
       FROM test_allocations a
       LEFT JOIN users u ON a.student_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (!allocRes.rows.length) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const allocation = allocRes.rows[0];
    const questionIds = safeParseQuestionIds(allocation.question_ids);

    // Get student responses joined with question details
    let responses = [];
    if (questionIds.length > 0) {
      const respRes = await pool.query(
        `SELECT ua.id, ua.question_id, ua.selected_answer as student_answer, ua.is_correct, ua.time_spent_seconds,
                q.question_text, q.options, q.answer as correct_answer, q.explanation,
                q.subject, q.category, q.level
         FROM user_answers ua
         JOIN questions q ON ua.question_id = q.id
         WHERE ua.session_id IN (
           SELECT es.id FROM exam_sessions es WHERE es.allocation_id = $1
         )
         ORDER BY ua.created_at ASC`,
        [id]
      );
      responses = respRes.rows.map(r => ({
        ...r,
        options: typeof r.options === 'string' ? (() => { try { return JSON.parse(r.options); } catch { return r.options; } })() : r.options,
      }));
    }

    // Get anti-cheat violations
    const violationsRes = await pool.query(
      `SELECT acl.id, acl.event_type as violation_type, acl.description as details, acl.severity, acl.created_at as logged_at
       FROM anti_cheat_logs acl
       WHERE acl.exam_session_id IN (
         SELECT es.id FROM exam_sessions es WHERE es.allocation_id = $1
       )
       ORDER BY acl.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        allocation: {
          ...allocation,
          question_ids: questionIds,
        },
        responses,
        violations: violationsRes.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching allocation detail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/questions/available
 * Get available unassigned questions for a student
 */
exports.getAvailableQuestions = async (req, res) => {
  try {
    const { student_id, category, level, subject } = req.query;

    if (!student_id) {
      return res.status(400).json({ success: false, error: 'student_id query parameter is required' });
    }

    let query = `
      SELECT q.id, q.subject, q.category, q.level, q.question_type, q.question_text, q.options, q.question_image_url
      FROM questions q
      WHERE q.id NOT IN (
        SELECT question_id FROM student_question_history WHERE student_id = $1
      )`;
    const args = [student_id];
    let idx = 2;

    if (subject) {
      query += ` AND q.subject = $${idx}`;
      args.push(subject);
      idx++;
    }
    if (category) {
      query += ` AND q.category = $${idx}`;
      args.push(category);
      idx++;
    }
    if (level) {
      query += ` AND q.level = $${idx}`;
      args.push(level);
      idx++;
    }

    query += ' ORDER BY q.category, q.level LIMIT 200';

    let { rows } = await pool.query(query, args);

    // Fallback: if no unseen questions, get from full pool
    if (rows.length === 0) {
      let fbQuery = `SELECT q.id, q.subject, q.category, q.level, q.question_type, q.question_text, q.options, q.question_image_url FROM questions q WHERE 1=1`;
      const fbArgs = [];
      let fbIdx = 1;

      if (subject) {
        fbQuery += ` AND q.subject = $${fbIdx}`;
        fbArgs.push(subject);
        fbIdx++;
      }
      if (category) {
        fbQuery += ` AND q.category = $${fbIdx}`;
        fbArgs.push(category);
        fbIdx++;
      }
      if (level) {
        fbQuery += ` AND q.level = $${fbIdx}`;
        fbArgs.push(level);
        fbIdx++;
      }
      fbQuery += ' ORDER BY q.category, q.level LIMIT 200';
      const fbRes = await pool.query(fbQuery, fbArgs);
      rows = fbRes.rows;
    }

    const availableQs = rows.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? (() => { try { return JSON.parse(q.options); } catch { return q.options; } })() : q.options,
    }));

    res.json({
      success: true,
      data: {
        student_id,
        available_questions: availableQs,
        count: availableQs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching available questions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/questions/categories
 * Get category hierarchy with question counts
 */
exports.getCategoryHierarchy = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT subject, category, level, COUNT(*) as count
       FROM questions
       WHERE subject IS NOT NULL AND category IS NOT NULL
       GROUP BY subject, category, level
       ORDER BY subject, category, level`
    );

    res.json({
      success: true,
      data: result.rows.map(r => ({
        ...r,
        count: parseInt(r.count, 10),
      })),
    });
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/admin/allocations/direct
 * Direct allocate a test to a student without a ticket
 */
exports.directAllocate = async (req, res) => {
  try {
    const { allocateTestToStudent } = require('../services/allocationService');
    const {
      student_id, test_type, test_title, subject, category, level,
      allocation_mode, question_ids, scheduled_at, expires_at,
      duration_minutes, question_count,
    } = req.body;

    if (!student_id || !test_type) {
      return res.status(400).json({ success: false, error: 'student_id and test_type are required' });
    }

    // For manual mode, use provided question_ids
    if (allocation_mode === 'MANUAL' && question_ids && question_ids.length > 0) {
      const { v4: uuidv4 } = require('uuid');
      const presetMins = test_type === 'FULL_LENGTH' ? 118 : test_type === 'SECTIONAL' ? 35 : 20;
      const durationMins = duration_minutes || presetMins;
      const sched = scheduled_at ? new Date(scheduled_at) : new Date();
      const exp = expires_at ? new Date(expires_at) : new Date(sched.getTime() + durationMins * 60 * 1000);
      const title = test_title || `Direct ${test_type} Test`;
      const allocId = uuidv4();

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO test_allocations (id, student_id, allocated_by, test_type, test_title, question_ids, status, duration_minutes, question_count, subject, scheduled_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'ASSIGNED', $7, $8, $9, $10, $11)`,
          [allocId, student_id, `ADMIN_DIRECT_${allocation_mode}`, test_type, title, JSON.stringify(question_ids), durationMins, question_ids.length, subject || 'Mixed', sched, exp]
        );
        for (const qid of question_ids) {
          await client.query(
            `INSERT INTO student_question_history (student_id, question_id, allocation_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [student_id, qid, allocId]
          );
        }
        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Direct test allocated successfully', data: { allocation_id: allocId, allocated_questions: question_ids.length } });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // For auto mode, use the allocation service
    // Use local date/time methods to avoid timezone mismatch
    function toLocalDateStr(d) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    function toLocalTimeStr(d) {
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    const sched = scheduled_at ? new Date(scheduled_at) : new Date();
    const schedDate = toLocalDateStr(sched);
    const schedTime = toLocalTimeStr(sched);
    const presetMins = test_type === 'FULL_LENGTH' ? 118 : test_type === 'SECTIONAL' ? 35 : 20;
    const exp = expires_at ? new Date(expires_at) : new Date(sched.getTime() + (duration_minutes || presetMins) * 60 * 1000);
    const expDate = toLocalDateStr(exp);
    const expTime = toLocalTimeStr(exp);

    const result = await allocateTestToStudent({
      studentId: student_id,
      testType: test_type,
      subject,
      category,
      level,
      allocatedBy: `ADMIN_DIRECT_${allocation_mode || 'AUTO'}`,
      scheduledDate: schedDate,
      scheduledTime: schedTime,
      expiryDate: expDate,
      expiryTime: expTime,
      initialStatus: 'ASSIGNED',
      testTitle: test_title || `Direct ${test_type} Test`,
      overrideQuestionCount: question_count,
      overrideDuration: duration_minutes,
    });

    res.status(201).json({ success: true, message: 'Direct test allocated successfully', data: result });
  } catch (error) {
    console.error('Error in direct allocation:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/students/:student_id/history
 * Get student question history
 */
exports.getStudentHistory = async (req, res) => {
  try {
    const { student_id } = req.params;
    const result = await pool.query(
      `SELECT h.id, h.student_id, h.question_id, q.category, q.level, q.subject, h.created_at
       FROM student_question_history h
       JOIN questions q ON h.question_id = q.id
       WHERE h.student_id = $1
       ORDER BY h.created_at DESC`,
      [student_id]
    );

    res.json({
      success: true,
      data: {
        student_id,
        total_completed: result.rows.length,
        history: result.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching student history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/admin/log-action
 * Log an admin action for audit trail
 */
exports.logAdminAction = async (req, res) => {
  try {
    const { action, target_id, details, metadata } = req.body;
    const admin_email = req.user?.email || 'system@admin.com';

    const result = await pool.query(
      `INSERT INTO admin_audit_logs (action, admin_email, target_id, details, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [action, admin_email, target_id, details, JSON.stringify(metadata || {})]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/admin/test-results
 * Returns paginated test allocations with student info for admin review
 */
exports.getTestResults = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 30;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 30;
    const offset = (page - 1) * limit;

    const search = req.query.search || '';
    const status = req.query.status || '';
    const testType = req.query.test_type || '';
    const dateFrom = req.query.date_from || '';
    const dateTo = req.query.date_to || '';
    const scoreMin = req.query.score_min || '';
    const scoreMax = req.query.score_max || '';

    const whereParts = ['1=1'];
    const args = [];
    let idx = 1;

    if (search) {
      whereParts.push(`(
        u.name ILIKE $${idx} OR
        u.email ILIKE $${idx} OR
        a.test_title ILIKE $${idx} OR
        a.test_type ILIKE $${idx} OR
        a.status ILIKE $${idx} OR
        a.allocated_by ILIKE $${idx} OR
        TO_CHAR(a.created_at, 'Mon DD, YYYY, HH:MI AM') ILIKE $${idx} OR
        TO_CHAR(a.created_at, 'YYYY-MM-DD') ILIKE $${idx}
      )`);
      args.push(`%${search}%`);
      idx++;
    }
    if (status) {
      whereParts.push(`a.status = $${idx}`);
      args.push(status);
      idx++;
    }
    if (testType) {
      whereParts.push(`a.test_type = $${idx}`);
      args.push(testType);
      idx++;
    }
    if (dateFrom) {
      whereParts.push(`a.created_at >= $${idx}`);
      args.push(dateFrom);
      idx++;
    }
    if (dateTo) {
      whereParts.push(`a.created_at <= $${idx}`);
      args.push(`${dateTo} 23:59:59`);
      idx++;
    }
    if (scoreMin) {
      whereParts.push(`COALESCE(a.score_percent, 0) >= $${idx}`);
      args.push(parseFloat(scoreMin));
      idx++;
    }
    if (scoreMax) {
      whereParts.push(`COALESCE(a.score_percent, 0) <= $${idx}`);
      args.push(parseFloat(scoreMax));
      idx++;
    }

    const whereClause = whereParts.join(' AND ');

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM test_allocations a JOIN users u ON a.student_id = u.id WHERE ${whereClause}`,
      args
    );
    const totalCount = parseInt(countRes.rows[0].count) || 0;

    const dataQuery = `
      SELECT a.id, a.ticket_id, a.student_id, u.name as student_name, u.email,
             a.allocated_by, a.test_type, a.test_title, a.status, a.score_percent,
             a.scheduled_at, a.expires_at, a.created_at
      FROM test_allocations a
      JOIN users u ON a.student_id = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}`;

    const dataRes = await pool.query(dataQuery, [...args, limit, offset]);

    res.json({
      success: true,
      results: dataRes.rows,
      page,
      limit,
      total: totalCount,
      total_pages: Math.max(1, Math.ceil(totalCount / limit)),
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
