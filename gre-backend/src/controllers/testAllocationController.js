const pool = require('../config/database');
const Question = require('../models/Question');
const { v4: uuidv4 } = require('uuid');
const { TEST_TYPES, TEST_SPECS, STATUSES } = require('../config/testConfig');

// Allocate test to student (TOPIC_WISE, SECTIONAL, or FULL_LENGTH)
exports.allocateTest = async (req, res) => {
  try {
    // Handle both 'id' and 'sub' fields from JWT (different JWT formats)
    let studentId = req.body.studentId || req.body.student_id || req.user?.id || req.user?.sub || '';
    const studentEmail = req.body.student_email || req.body.studentEmail || '';
    const testType = req.body.testType || req.body.test_type;
    const subject = req.body.subject;
    const category = req.body.category;
    const level = req.body.level;
    const allocatedBy = req.user?.email || 'admin@gre.com';
    const scheduledDate = req.body.scheduled_date;
    const scheduledTime = req.body.scheduled_time || '09:00';
    const expiryDate = req.body.expiry_date || null;
    const expiryTime = req.body.expiry_time || null;
    const initialStatus = req.body.status || STATUSES.ASSIGNED;

    if (!studentId && studentEmail) {
      const studentResult = await pool.query('SELECT id FROM users WHERE email = $1', [studentEmail]);
      if (studentResult.rows.length > 0) {
        studentId = studentResult.rows[0].id;
      }
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required to allocate a test',
      });
    }

    // Server-side past date check (Bug 24)
    if (scheduledDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (scheduledDate < todayStr) {
        return res.status(400).json({
          success: false,
          error: 'Cannot schedule a test for a past date. Please select a valid future date.',
        });
      }
    }

    // Duplicate schedule request check (Bug 21)
    if (scheduledDate) {
      const duplicateCheck = await pool.query(
        `SELECT id FROM test_allocations
         WHERE (student_id = $1 OR student_id = $2)
           AND test_type = $3
           AND (scheduled_date = $4 OR DATE(scheduled_at) = $4::date)
           AND status IN ('REQUESTED', 'PENDING', 'APPROVED', 'SCHEDULED', 'ASSIGNED', 'IN_PROGRESS')`,
        [studentId, studentEmail, testType, scheduledDate]
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'You already have an active test scheduled for this date and test type.',
        });
      }
    }

    let questionIds = [];
    let questions = [];
    let questionCount = 0;
    let duration = 60;
    let testTitle = '';

    // Get questions based on test type
    if (testType === TEST_TYPES.TOPIC_WISE) {
      if (!subject || !category || !level) {
        return res.status(400).json({
          success: false,
          error: 'Subject, category, and level are required for TOPIC_WISE test',
        });
      }

      const spec = TEST_SPECS.TOPIC_WISE[level] || TEST_SPECS.TOPIC_WISE.Default;
      testTitle = `${category} - ${level}`;
      questionCount = spec.question_count;
      duration = spec.duration_minutes;

      // Get unseen questions first
      const unseenQuestions = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = $1 AND q.category = $2 AND q.level = $3
         AND q.id NOT IN (
           SELECT question_id FROM student_question_history WHERE student_id = $4
         )
         ORDER BY RANDOM() LIMIT $5`,
        [subject, category, level, studentId, questionCount]
      );

      questions = unseenQuestions.rows;

      // Fallback: if not enough unseen, get from full pool
      if (questions.length < questionCount) {
        const fallbackQuestions = await pool.query(
          `SELECT q.id FROM questions q
           WHERE q.subject = $1 AND q.category = $2 AND q.level = $3
           ORDER BY RANDOM() LIMIT $4`,
          [subject, category, level, questionCount]
        );
        questions = fallbackQuestions.rows;
      }

      questionIds = questions.map(q => q.id);
    } else if (testType === TEST_TYPES.SECTIONAL) {
      if (!subject) {
        return res.status(400).json({
          success: false,
          error: 'Subject is required for SECTIONAL test',
        });
      }

      const spec = TEST_SPECS.SECTIONAL[subject] || TEST_SPECS.SECTIONAL.Default;
      testTitle = `${subject} Section Test`;
      questionCount = spec.question_count;
      duration = spec.duration_minutes;

      // Get unseen questions for subject
      const unseenQuestions = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = $1
         AND q.id NOT IN (
           SELECT question_id FROM student_question_history WHERE student_id = $2
         )
         ORDER BY RANDOM() LIMIT $3`,
        [subject, studentId, questionCount]
      );

      questions = unseenQuestions.rows;

      // Fallback
      if (questions.length < questionCount) {
        const fallbackQuestions = await pool.query(
          `SELECT q.id FROM questions q
           WHERE q.subject = $1
           ORDER BY RANDOM() LIMIT $2`,
          [subject, questionCount]
        );
        questions = fallbackQuestions.rows;
      }

      questionIds = questions.map(q => q.id);
    } else if (testType === TEST_TYPES.FULL_LENGTH) {
      const spec = TEST_SPECS.FULL_LENGTH;
      testTitle = 'Full Length GRE Test';
      questionCount = spec.question_count;
      duration = spec.duration_minutes;

      const awaNeed = spec.awa_count;
      const verbalV1Need = 12;
      const verbalV2Need = 15;
      const quantQ1Need = 12;
      const quantQ2Need = 15;

      // 1. AWA question (unseen first)
      const awaUnseen = await pool.query(
        `SELECT q.id FROM questions q
         WHERE (q.subject = 'AWA' OR UPPER(q.category) LIKE '%AWA%' OR q.question_type = 'AWA')
         AND q.id NOT IN (
           SELECT question_id FROM student_question_history WHERE student_id = $1
         )
         ORDER BY RANDOM() LIMIT $2`,
        [studentId, awaNeed]
      );
      let awaQuestions = awaUnseen.rows.map(q => q.id);
      if (awaQuestions.length < awaNeed) {
        const awaFallback = await pool.query(
          `SELECT q.id FROM questions q WHERE (q.subject = 'AWA' OR UPPER(q.category) LIKE '%AWA%' OR q.question_type = 'AWA') ORDER BY RANDOM() LIMIT $1`,
          [awaNeed - awaQuestions.length]
        );
        awaQuestions = [...new Set([...awaQuestions, ...awaFallback.rows.map(q => q.id)])];
      }

      // 2. Verbal Section 1 (12 questions, mixed difficulty, unseen first - EXCLUDE AWA)
      const verbalV1Unseen = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = 'Verbal'
           AND UPPER(q.category) NOT LIKE '%AWA%'
           AND (q.question_type IS NULL OR q.question_type != 'AWA')
           AND q.id NOT IN (
             SELECT question_id FROM student_question_history WHERE student_id = $1
           )
         ORDER BY RANDOM() LIMIT $2`,
        [studentId, verbalV1Need]
      );
      let verbalV1Questions = verbalV1Unseen.rows.map(q => q.id);
      if (verbalV1Questions.length < verbalV1Need) {
        const v1Fallback = await pool.query(
          `SELECT q.id FROM questions q WHERE q.subject = 'Verbal' AND UPPER(q.category) NOT LIKE '%AWA%' AND (q.question_type IS NULL OR q.question_type != 'AWA') ORDER BY RANDOM() LIMIT $1`,
          [verbalV1Need - verbalV1Questions.length]
        );
        verbalV1Questions = [...new Set([...verbalV1Questions, ...v1Fallback.rows.map(q => q.id)])];
      }

      // 3. Verbal Section 2 (15 questions, unseen first, exclude V1 questions and AWA)
      const v1Placeholders = verbalV1Questions.map((_, i) => `$${i + 3}`).join(',');
      const verbalV2Unseen = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = 'Verbal'
           AND UPPER(q.category) NOT LIKE '%AWA%'
           AND (q.question_type IS NULL OR q.question_type != 'AWA')
           AND q.id NOT IN (
             SELECT question_id FROM student_question_history WHERE student_id = $1
           )
           AND q.id NOT IN (${v1Placeholders})
         ORDER BY RANDOM() LIMIT $2`,
        [studentId, verbalV2Need, ...verbalV1Questions]
      );
      let verbalV2Questions = verbalV2Unseen.rows.map(q => q.id);
      if (verbalV2Questions.length < verbalV2Need) {
        const v2Fallback = await pool.query(
          `SELECT q.id FROM questions q WHERE q.subject = 'Verbal' AND UPPER(q.category) NOT LIKE '%AWA%' AND (q.question_type IS NULL OR q.question_type != 'AWA') AND q.id NOT IN (${v1Placeholders}) ORDER BY RANDOM() LIMIT $1`,
          [verbalV2Need - verbalV2Questions.length, ...verbalV1Questions]
        );
        verbalV2Questions = [...new Set([...verbalV2Questions, ...v2Fallback.rows.map(q => q.id)])];
      }

      // 4. Quant Section 1 (12 questions, mixed difficulty, unseen first)
      const quantQ1Unseen = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = 'Quant'
         AND q.id NOT IN (
           SELECT question_id FROM student_question_history WHERE student_id = $1
         )
         ORDER BY RANDOM() LIMIT $2`,
        [studentId, quantQ1Need]
      );
      let quantQ1Questions = quantQ1Unseen.rows.map(q => q.id);
      if (quantQ1Questions.length < quantQ1Need) {
        const q1Fallback = await pool.query(
          `SELECT q.id FROM questions q WHERE q.subject = 'Quant' ORDER BY RANDOM() LIMIT $1`,
          [quantQ1Need - quantQ1Questions.length]
        );
        quantQ1Questions = [...new Set([...quantQ1Questions, ...q1Fallback.rows.map(q => q.id)])];
      }

      // 5. Quant Section 2 (15 questions, unseen first, exclude Q1 questions)
      const q1Placeholders = quantQ1Questions.map((_, i) => `$${i + 3}`).join(',');
      const quantQ2Unseen = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = 'Quant'
         AND q.id NOT IN (
           SELECT question_id FROM student_question_history WHERE student_id = $1
         )
         AND q.id NOT IN (${q1Placeholders})
         ORDER BY RANDOM() LIMIT $2`,
        [studentId, quantQ2Need, ...quantQ1Questions]
      );
      let quantQ2Questions = quantQ2Unseen.rows.map(q => q.id);
      if (quantQ2Questions.length < quantQ2Need) {
        const q2Fallback = await pool.query(
          `SELECT q.id FROM questions q WHERE q.subject = 'Quant' AND q.id NOT IN (${q1Placeholders}) ORDER BY RANDOM() LIMIT $1`,
          [quantQ2Need - quantQ2Questions.length, ...quantQ1Questions]
        );
        quantQ2Questions = [...new Set([...quantQ2Questions, ...q2Fallback.rows.map(q => q.id)])];
      }

      // Order: AWA(1) + V1(12) + V2(15) + Q1(12) + Q2(15) = 55 total
      questionIds = [...awaQuestions, ...verbalV1Questions, ...verbalV2Questions, ...quantQ1Questions, ...quantQ2Questions];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid test type. Use TOPIC_WISE, SECTIONAL, or FULL_LENGTH',
      });
    }

    // Create allocation with exact 14 columns and 14 parameters ($1..$14)
    const allocationId = uuidv4();
    const scheduledDateTime = scheduledDate ? new Date(`${scheduledDate}T${scheduledTime}`) : new Date();
    const expiryDateTime = expiryDate ? new Date(`${expiryDate}T${expiryTime || '23:59'}`) : null;

    const result = await pool.query(
      `INSERT INTO test_allocations (
        id, student_id, allocated_by, test_type, test_title, question_ids,
        subject, category, level, status, duration_minutes, question_count, scheduled_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        allocationId,
        studentId,
        allocatedBy,
        testType,
        testTitle,
        JSON.stringify(questionIds),
        subject || null,
        category || null,
        level || null,
        initialStatus,
        duration,
        questionIds.length,
        scheduledDateTime,
        expiryDateTime,
      ]
    );

    const allocation = result.rows[0];

    // Record question history
    for (const questionId of questionIds) {
      await pool.query(
        `INSERT INTO student_question_history (student_id, question_id, allocation_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [studentId, questionId, allocationId]
      );
    }

    res.json({
      success: true,
      data: {
        ...allocation,
        question_ids: questionIds, // Return as array
      },
    });
  } catch (error) {
    console.error('Error allocating test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all allocations (admin view)
exports.getAllAllocations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as student_name, u.email as student_email
       FROM test_allocations a
       LEFT JOIN users u ON a.student_id = u.id
       ORDER BY a.created_at DESC`
    );

    const allocations = result.rows.map(a => ({
      ...a,
      question_ids: safeParseQuestionIds(a.question_ids),
    }));

    res.json({
      success: true,
      allocations,
      data: { allocations },
    });
  } catch (error) {
    console.error('Error fetching all allocations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

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

// Get allocation for student
exports.getStudentAllocations = async (req, res) => {
  try {
    // Handle both 'id' and 'sub' fields from JWT (different JWT formats)
    const studentId = req.user?.id || req.user?.sub || '';
    const studentEmail = req.user?.email || '';
    const { status } = req.query;

    if (!studentId && !studentEmail) {
      return res.status(400).json({
        success: false,
        error: 'Could not identify student from JWT token',
        debug: { user: req.user }
      });
    }

    // Also find any user IDs matching this email, since allocations may use a different ID format
    let allStudentIds = [studentId, studentEmail];
    if (studentEmail) {
      const userLookup = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [studentEmail]
      );
      for (const row of userLookup.rows) {
        if (!allStudentIds.includes(row.id)) {
          allStudentIds.push(row.id);
        }
      }
    }

    const placeholders = allStudentIds.map((_, i) => `$${i + 1}`).join(',');
    let query = `SELECT *, 
      CASE 
        WHEN status IN ('IN_PROGRESS', 'ASSIGNED', 'SCHEDULED') AND expires_at < NOW() THEN 'EXPIRED'
        ELSE status 
      END as computed_status
      FROM test_allocations WHERE student_id IN (${placeholders})`;
    const params = allStudentIds;

    if (status && status !== 'all' && status !== 'ALL') {
      params.push(status);
      query += ` AND UPPER(status) = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    const allocations = result.rows.map(a => {
      const parsed = {
        ...a,
        question_ids: safeParseQuestionIds(a.question_ids),
      };
      // Use computed_status if it indicates EXPIRED
      if (a.computed_status === 'EXPIRED') {
        parsed.status = 'EXPIRED';
      }
      return parsed;
    });

    res.json({
      success: true,
      data: allocations,
      allocations,
    });
  } catch (error) {
    console.error('Error fetching student allocations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get specific allocation
exports.getAllocationById = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM test_allocations WHERE id = $1`,
      [allocationId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const allocation = result.rows[0];

    // Check authorization
    if (allocation.student_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: {
        ...allocation,
        question_ids: safeParseQuestionIds(allocation.question_ids),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reset student question history (admin only)
exports.resetStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    await pool.query(
      'DELETE FROM student_question_history WHERE student_id = $1',
      [studentId]
    );

    res.json({
      success: true,
      message: 'Student question history reset successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available time slots for a given date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, test_type } = req.query;
    const studentId = req.user?.id || req.user?.user_id || '';
    const studentEmail = req.user?.email || '';

    let studentAlreadyScheduled = false;
    let existingAllocationId = null;

    if (date && (studentId || studentEmail)) {
      const queryParams = [studentId, studentEmail, date];
      let queryStr = `SELECT id, test_type, scheduled_at, scheduled_date FROM test_allocations
         WHERE (student_id = $1 OR student_id = $2)
           AND (scheduled_date = $3 OR DATE(scheduled_at) = $3::date)
           AND status IN ('REQUESTED', 'PENDING', 'APPROVED', 'SCHEDULED', 'ASSIGNED', 'IN_PROGRESS')`;

      if (test_type) {
        queryStr += ` AND test_type = $4`;
        queryParams.push(test_type);
      }

      const dupCheck = await pool.query(queryStr, queryParams);
      if (dupCheck.rows.length > 0) {
        studentAlreadyScheduled = true;
        existingAllocationId = dupCheck.rows[0].id;
      }
    }

    const defaultSlots = [
      { id: '1', time: '08:00', startTime: '08:00', endTime: '10:00', label: '08:00 AM - 10:00 AM', available: true },
      { id: '2', time: '10:00', startTime: '10:00', endTime: '12:00', label: '10:00 AM - 12:00 PM', available: true },
      { id: '3', time: '12:00', startTime: '12:00', endTime: '14:00', label: '12:00 PM - 02:00 PM', available: true },
      { id: '4', time: '14:00', startTime: '14:00', endTime: '16:00', label: '02:00 PM - 04:00 PM', available: true },
      { id: '5', time: '16:00', startTime: '16:00', endTime: '18:00', label: '04:00 PM - 06:00 PM', available: true },
      { id: '6', time: '18:00', startTime: '18:00', endTime: '20:00', label: '06:00 PM - 08:00 PM', available: true },
      { id: '7', time: '20:00', startTime: '20:00', endTime: '22:00', label: '08:00 PM - 10:00 PM', available: true },
    ];

    if (!date) {
      return res.json({ success: true, slots: defaultSlots, student_already_scheduled: studentAlreadyScheduled });
    }

    const result = await pool.query(
      `SELECT scheduled_at, scheduled_date FROM test_allocations
       WHERE (scheduled_date = $1 OR DATE(scheduled_at) = $1::date)
         AND status IN ('REQUESTED', 'PENDING', 'APPROVED', 'SCHEDULED', 'ASSIGNED', 'IN_PROGRESS')`,
      [date]
    );

    const bookedTimes = result.rows.map(r => {
      const d = new Date(r.scheduled_at);
      return d.toTimeString().substring(0, 5);
    });

    const slots = defaultSlots.map(slot => ({
      ...slot,
      available: studentAlreadyScheduled ? false : !bookedTimes.includes(slot.time),
      already_scheduled: studentAlreadyScheduled,
    }));

    res.json({
      success: true,
      date,
      student_already_scheduled: studentAlreadyScheduled,
      existing_allocation_id: existingAllocationId,
      slots
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve allocation (Admin)
exports.approveAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE test_allocations SET status = 'ASSIGNED', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    res.json({ success: true, message: 'Allocation approved successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error approving allocation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reschedule allocation (Admin)
exports.rescheduleAllocation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    // Accept either scheduled_at (ISO) or scheduledDate + scheduledTime
    let scheduledDate = req.body.scheduledDate || req.body.scheduled_date;
    let scheduledTime = req.body.scheduledTime || req.body.scheduled_time || '09:00';
    const scheduledAtISO = req.body.scheduled_at;

    if (scheduledAtISO) {
      const parsed = new Date(scheduledAtISO);
      if (isNaN(parsed.getTime())) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid scheduled_at ISO date' } });
      }
      scheduledDate = parsed.toISOString().split('T')[0];
      scheduledTime = parsed.toTimeString().substring(0, 5);
    }

    if (!scheduledDate) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'New scheduled date is required' } });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduledDate < todayStr) {
      return res.status(400).json({ success: false, error: { code: 'PAST_DATE', message: 'Cannot reschedule to a past date' } });
    }

    await client.query('BEGIN');

    const checkRes = await client.query('SELECT * FROM test_allocations WHERE id = $1 FOR UPDATE', [id]);
    if (!checkRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Allocation not found' } });
    }

    const alloc = checkRes.rows[0];
    if (alloc.status === 'COMPLETED' || alloc.status === 'SUBMITTED' || alloc.status === 'IN_PROGRESS') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Completed or In-Progress tests cannot be rescheduled' } });
    }

    // Overlap check for rescheduled slot
    const conflictCheck = await client.query(
      `SELECT id FROM test_allocations
       WHERE student_id = $1 AND id != $2
         AND DATE(scheduled_at) = $3
         AND status IN ('REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'READY', 'IN_PROGRESS')`,
      [alloc.student_id, id, scheduledDate]
    );

    if (conflictCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: { code: 'SLOT_CONFLICT', message: 'Student already has an active test scheduled on this date' } });
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    const durationMins = alloc.duration_minutes || 60;
    const expiresAt = new Date(scheduledAt.getTime() + (durationMins + 120) * 60 * 1000);

    const updateRes = await client.query(
      `UPDATE test_allocations SET
        scheduled_at = $1,
        expires_at = $2,
        scheduled_date = $3,
        scheduled_start_time = $4,
        status = 'SCHEDULED',
        updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [scheduledAt, expiresAt, scheduledDate, scheduledTime, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Test rescheduled successfully',
      data: updateRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rescheduling allocation:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  } finally {
    client.release();
  }
};

// Cancel allocation (Admin or Student)
exports.cancelAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const cancellationReason = req.body.cancellationReason || req.body.cancellation_reason || req.body.reason || 'Cancelled by user';

    const checkRes = await pool.query('SELECT status FROM test_allocations WHERE id = $1', [id]);
    if (!checkRes.rows.length) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Allocation not found' } });
    }

    if (checkRes.rows[0].status === 'COMPLETED' || checkRes.rows[0].status === 'SUBMITTED') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Completed tests cannot be cancelled' } });
    }

    const result = await pool.query(
      `UPDATE test_allocations SET status = 'CANCELLED', cancellation_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [cancellationReason, id]
    );

    res.json({ success: true, message: 'Allocation cancelled', data: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling allocation:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// Reassign allocation (Admin)
exports.reassignAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStudentId, adminNotes } = req.body;

    const result = await pool.query(
      `UPDATE test_allocations SET
        student_id = COALESCE($1, student_id),
        admin_notes = COALESCE($2, admin_notes),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [newStudentId || null, adminNotes || null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Allocation not found' } });
    }

    res.json({ success: true, message: 'Allocation reassigned', data: result.rows[0] });
  } catch (error) {
    console.error('Error reassigning allocation:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// Reject allocation (Admin)
exports.rejectAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const rejectionReason = req.body.rejectionReason || req.body.rejection_reason || 'Rejected by admin';
    const result = await pool.query(
      `UPDATE test_allocations SET status = 'REJECTED', rejection_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [rejectionReason, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Allocation not found' } });
    }

    res.json({ success: true, message: 'Allocation rejected', data: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting allocation:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// Terminate allocation (Admin)
exports.terminateAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE test_allocations SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Allocation not found' } });
    }

    res.json({ success: true, message: 'Allocation terminated', data: result.rows[0] });
  } catch (error) {
    console.error('Error terminating allocation:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
