const pool = require('../config/database');
const Question = require('../models/Question');
const { v4: uuidv4 } = require('uuid');
const { calculateGreScore } = require('../config/testConfig');

function safeParseQuestionIds(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === 'object') {
    return Array.isArray(value.question_ids) ? value.question_ids : [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      return value.slice(1, -1).split(',').map(item => item.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }

    return typeof value === 'string'
      ? value.split(',').map(item => item.trim()).filter(Boolean)
      : [];
  }
}

function normalizeAnswer(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // For comma-separated multi answers, normalize by sorting trimmed parts
  if (str.includes(',')) {
    return str
      .split(',')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .sort((a, b) => a.localeCompare(b))
      .join(', ');
  }
  return str.trim();
}

// Start an exam session
exports.startExam = async (req, res) => {
  try {
    const allocationId = req.body.allocationId || req.body.allocation_id;
    const userId = req.user?.id || req.user?.sub || '';
    const userEmail = req.user?.email || '';

    if (!allocationId) {
      return res.status(400).json({ success: false, error: 'Allocation ID is required' });
    }

    // Resolve all student IDs for this user (JWT user ID, email, and DB user IDs matching email)
    let allStudentIds = [userId, userEmail].filter(Boolean);
    if (userEmail) {
      try {
        const userLookup = await pool.query(`SELECT id FROM users WHERE email = $1`, [userEmail]);
        for (const row of userLookup.rows) {
          if (!allStudentIds.includes(row.id)) {
            allStudentIds.push(row.id);
          }
        }
      } catch (e) {}
    }

    let allocationResult;
    if (allStudentIds.length > 0) {
      const placeholders = allStudentIds.map((_, i) => `$${i + 2}`).join(',');
      allocationResult = await pool.query(
        `SELECT * FROM test_allocations WHERE id = $1 AND student_id IN (${placeholders})`,
        [allocationId, ...allStudentIds]
      );
    }

    // Fallback lookup if student_id format differs (e.g. allocated by admin or matching email)
    if (!allocationResult || !allocationResult.rows.length) {
      const directResult = await pool.query(`SELECT * FROM test_allocations WHERE id = $1`, [allocationId]);
      if (directResult.rows.length) {
        const alloc = directResult.rows[0];
        const isOwner = allStudentIds.includes(alloc.student_id) ||
                        (userEmail && alloc.student_id && String(alloc.student_id).toLowerCase() === userEmail.toLowerCase()) ||
                        (alloc.allocated_by && userEmail && String(alloc.allocated_by).toLowerCase() === userEmail.toLowerCase());
        if (isOwner || req.user?.role === 'ADMIN') {
          allocationResult = directResult;
        }
      }
    }

    if (!allocationResult || !allocationResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Allocation not found or unauthorized' });
    }

    const allocation = allocationResult.rows[0];

    if (allocation.status === 'COMPLETED' || allocation.status === 'SUBMITTED') {
      return res.status(400).json({ success: false, error: 'This exam has already been completed.' });
    }

    if (allocation.status === 'MALPRACTICE' || allocation.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        error: 'This test was terminated due to security violations.',
        status: 'MALPRACTICE',
      });
    }

    if (allocation.status === 'EXPIRED') {
      return res.status(400).json({
        success: false,
        error: 'This test has expired and can no longer be taken.',
      });
    }

    const now = new Date();

    // Check scheduled start window
    let scheduledAt = allocation.scheduled_at;
    if (!scheduledAt && allocation.scheduled_date) {
      const time = allocation.scheduled_time || '00:00';
      scheduledAt = new Date(`${allocation.scheduled_date}T${time}:00`);
    }

    if (scheduledAt && now < new Date(scheduledAt)) {
      return res.status(400).json({
        success: false,
        error: `This test is scheduled to start at ${new Date(scheduledAt).toLocaleString()}. It is not yet active for attempt.`,
      });
    }

    // Check expiry window
    let expiresAt = allocation.expires_at;
    if (!expiresAt && allocation.expiry_date) {
      const time = allocation.expiry_time || '23:59';
      expiresAt = new Date(`${allocation.expiry_date}T${time}:00`);
    }

    if (expiresAt && now > new Date(expiresAt)) {
      await pool.query("UPDATE test_allocations SET status = 'EXPIRED' WHERE id = $1", [allocationId]);
      return res.status(400).json({
        success: false,
        error: `This test expired at ${new Date(expiresAt).toLocaleString()} and can no longer be taken.`,
      });
    }

    // Check if session already exists
    let session;
    const existingSession = await pool.query(
      `SELECT * FROM exam_sessions WHERE allocation_id = $1 AND status = 'IN_PROGRESS' ORDER BY created_at DESC LIMIT 1`,
      [allocationId]
    );

    if (existingSession.rows.length) {
      session = existingSession.rows[0];
    } else {
      // Create exam session
      const sessionId = uuidv4();
      const newSession = await pool.query(
        `INSERT INTO exam_sessions (id, allocation_id, user_id, started_at, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [sessionId, allocationId, userId || userEmail, new Date(), 'IN_PROGRESS']
      );
      session = newSession.rows[0];

      // Update allocation status
      await pool.query(
        `UPDATE test_allocations SET status = 'IN_PROGRESS', started_at = $1 WHERE id = $2`,
        [new Date(), allocationId]
      );
    }

    // Fetch questions for frontend
    const questionIds = safeParseQuestionIds(allocation.question_ids);
    let orderedQuestions = [];

    if (questionIds.length > 0) {
      const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(',');
      const questionsResult = await pool.query(
        `SELECT id, subject, category, level, question_text, options, answer, explanation, question_image_url
         FROM questions WHERE id IN (${placeholders})`,
        questionIds
      );

      const questionsMap = {};
      questionsResult.rows.forEach(q => {
        questionsMap[q.id] = q;
      });
      orderedQuestions = questionIds.map(id => questionsMap[id]).filter(Boolean);
    }

    res.json({
      success: true,
      sessionId: session.id,
      data: {
        session,
        allocation,
        questions: orderedQuestions,
      },
      questions: orderedQuestions,
      allocation,
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get questions for exam
exports.getExamQuestions = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const userId = req.user?.id || req.user?.sub || '';
    const userEmail = req.user?.email || '';

    let allStudentIds = [userId, userEmail].filter(Boolean);
    if (userEmail) {
      try {
        const userLookup = await pool.query(`SELECT id FROM users WHERE email = $1`, [userEmail]);
        for (const row of userLookup.rows) {
          if (!allStudentIds.includes(row.id)) {
            allStudentIds.push(row.id);
          }
        }
      } catch (e) {}
    }

    let allocationResult;
    if (allStudentIds.length > 0) {
      const placeholders = allStudentIds.map((_, i) => `$${i + 2}`).join(',');
      allocationResult = await pool.query(
        `SELECT * FROM test_allocations WHERE id = $1 AND student_id IN (${placeholders})`,
        [allocationId, ...allStudentIds]
      );
    }

    if (!allocationResult || !allocationResult.rows.length) {
      const directResult = await pool.query(`SELECT * FROM test_allocations WHERE id = $1`, [allocationId]);
      if (directResult.rows.length) {
        const alloc = directResult.rows[0];
        const isOwner = allStudentIds.includes(alloc.student_id) ||
                        (userEmail && alloc.student_id && String(alloc.student_id).toLowerCase() === userEmail.toLowerCase()) ||
                        (alloc.allocated_by && userEmail && String(alloc.allocated_by).toLowerCase() === userEmail.toLowerCase());
        if (isOwner || req.user?.role === 'ADMIN') {
          allocationResult = directResult;
        }
      }
    }

    if (!allocationResult || !allocationResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const allocation = allocationResult.rows[0];
    const questionIds = safeParseQuestionIds(allocation.question_ids);

    if (questionIds.length === 0) {
      return res.status(404).json({ success: false, error: 'No questions found for this allocation' });
    }

    // Fetch all questions
    const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(',');
    const questionsResult = await pool.query(
      `SELECT id, subject, category, level, question_text, options, passage, question_image_url
       FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );

    // Order questions as per allocation order
    const questionsMap = {};
    questionsResult.rows.forEach(q => {
      questionsMap[q.id] = q;
    });

    const orderedQuestions = questionIds.map(id => questionsMap[id]).filter(Boolean);

    res.json({
      success: true,
      data: {
        allocation: {
          id: allocation.id,
          test_type: allocation.test_type,
          test_title: allocation.test_title,
          duration_minutes: allocation.duration_minutes,
          question_count: allocation.question_count,
        },
        questions: orderedQuestions,
      },
      questions: orderedQuestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Auto-save answer
exports.saveAnswer = async (req, res) => {
  try {
    const { sessionId, allocationId, questionId, selectedAnswer, timeSpent = 0 } = req.body;
    const userId = req.user.id;

    // Get question to check if answer is correct
    const questionResult = await pool.query(
      `SELECT answer FROM questions WHERE id = $1`,
      [questionId]
    );

    if (!questionResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    const qRow = questionResult.rows[0];
    const isAWA = (qRow.subject || '').toUpperCase() === 'AWA' || (qRow.category || '').toUpperCase().includes('AWA');
    const isCorrect = isAWA
      ? !!(selectedAnswer && String(selectedAnswer).trim().length > 0)
      : normalizeAnswer(qRow.answer) === normalizeAnswer(selectedAnswer);

    // Check if answer already exists
    const existingAnswer = await pool.query(
      `SELECT id FROM user_answers WHERE session_id = $1 AND question_id = $2`,
      [sessionId, questionId]
    );

    if (existingAnswer.rows.length) {
      // Update existing answer
      await pool.query(
        `UPDATE user_answers SET selected_answer = $1, is_correct = $2, time_spent_seconds = $3
         WHERE session_id = $4 AND question_id = $5`,
        [selectedAnswer, isCorrect, timeSpent, sessionId, questionId]
      );
    } else {
      // Insert new answer
      const answerId = uuidv4();
      await pool.query(
        `INSERT INTO user_answers (id, session_id, user_id, question_id, selected_answer, is_correct, time_spent_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [answerId, sessionId, userId, questionId, selectedAnswer, isCorrect, timeSpent]
      );
    }

    res.json({
      success: true,
      message: 'Answer saved',
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark question for review
exports.markForReview = async (req, res) => {
  try {
    const { questionId, sessionId, marked } = req.body;
    const userId = req.user.id;

    await pool.query(
      `UPDATE user_answers SET marked_for_review = $1
       WHERE session_id = $2 AND question_id = $3 AND user_id = $4`,
      [marked, sessionId, questionId, userId]
    );

    res.json({ success: true, message: 'Question marked for review' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Submit exam
exports.submitExam = async (req, res) => {
  try {
    const { allocationId, sessionId } = req.body;
    const userId = req.user?.id || req.user?.sub || '';

    // Fetch allocation details
    const allocRes = await pool.query(`SELECT * FROM test_allocations WHERE id = $1`, [allocationId]);
    const allocation = allocRes.rows[0] || {};
    const questionIds = safeParseQuestionIds(allocation.question_ids);

    // Fetch allocated questions
    let allocatedQuestions = [];
    if (questionIds.length > 0) {
      const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(',');
      const qRes = await pool.query(
        `SELECT id, subject, category FROM questions WHERE id IN (${placeholders})`,
        questionIds
      );
      allocatedQuestions = qRes.rows;
    }

    // Fetch user answers
    const uaRes = await pool.query(
      `SELECT question_id, selected_answer, is_correct FROM user_answers WHERE session_id = $1`,
      [sessionId]
    );
    const userAnswersMap = {};
    uaRes.rows.forEach(ua => {
      userAnswersMap[ua.question_id] = ua;
    });

    let totalQs = allocatedQuestions.length || questionIds.length;
    let totalCorrect = 0;
    let quantCorrect = 0;
    let totalQuant = 0;
    let verbalCorrect = 0;
    let totalVerbal = 0;

    for (const q of allocatedQuestions) {
      const ua = userAnswersMap[q.id];
      const isCorrect = ua ? !!ua.is_correct : false;
      if (isCorrect) totalCorrect++;

      const subj = (q.subject || '').toUpperCase();
      if (subj === 'QUANT') {
        totalQuant++;
        if (isCorrect) quantCorrect++;
      } else if (subj === 'VERBAL') {
        totalVerbal++;
        if (isCorrect) verbalCorrect++;
      }
    }

    // Fallback if subjects were not on question objects directly
    if (totalQuant === 0 && totalVerbal === 0) {
      totalQuant = 27;
      totalVerbal = 27;
    }

    const { quant_score, verbal_score, total_score, score_display } = calculateGreScore(
      quantCorrect,
      totalQuant,
      verbalCorrect,
      totalVerbal
    );

    const overallAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
    const percentile = Math.min(99, Math.round(overallAccuracy * 0.99));

    // Update exam session
    await pool.query(
      `UPDATE exam_sessions SET submitted_at = $1, status = 'COMPLETED' WHERE id = $2`,
      [new Date(), sessionId]
    );

    // Update allocation
    await pool.query(
      `UPDATE test_allocations SET status = 'COMPLETED', submitted_at = $1, score_percent = $2 WHERE id = $3`,
      [new Date(), overallAccuracy, allocationId]
    );

    // Create test result
    const resultId = uuidv4();
    await pool.query(
      `INSERT INTO test_results (
        id, user_id, session_id, allocation_id, test_type, subject,
        category, level, total_questions, correct_answers, score, quant_score, verbal_score, total_score, percentile, time_taken_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        resultId,
        userId,
        sessionId,
        allocationId,
        allocation.test_type || 'PRACTICE',
        allocation.subject || null,
        allocation.category || null,
        allocation.level || null,
        totalQs,
        totalCorrect,
        total_score,
        quant_score,
        verbal_score,
        total_score,
        percentile,
        0,
      ]
    );

    res.json({
      success: true,
      data: {
        total_questions: totalQs,
        correct_answers: totalCorrect,
        percentage: overallAccuracy,
        quant_score,
        verbal_score,
        total_score,
        score_display,
        percentile,
      },
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get exam progress
exports.getExamProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_answered,
        COUNT(CASE WHEN is_correct THEN 1 END) as correct,
        COUNT(CASE WHEN marked_for_review THEN 1 END) as marked_for_review
       FROM user_answers WHERE session_id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Log malpractice event
exports.logMalpractice = async (req, res) => {
  try {
    const allocation_id = req.body.allocation_id || req.body.allocationId;
    const exam_session_id = req.body.exam_session_id || req.body.examSessionId;
    const event_type = req.body.event_type || req.body.violation_type || 'SUSPICIOUS_BEHAVIOR';
    const details = req.body.details || {};
    const timestamp = req.body.timestamp || new Date().toISOString();
    const userId = req.user?.id || req.user?.sub || 'system';

    // Get exam_session_id from allocation_id if not provided
    let sessionId = exam_session_id;
    if (!sessionId && allocation_id) {
      const sessionResult = await pool.query(
        `SELECT id FROM exam_sessions WHERE allocation_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [allocation_id]
      );
      if (sessionResult.rows.length > 0) {
        sessionId = sessionResult.rows[0].id;
      }
    }

    if (sessionId || allocation_id) {
      await pool.query(
        `INSERT INTO anti_cheat_logs (exam_session_id, user_id, event_type, description, severity, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          sessionId || null,
          userId,
          event_type,
          JSON.stringify({ ...details, allocation_id }),
          'HIGH',
          timestamp
        ]
      ).catch(err => console.warn('Database insert malpractice log warning:', err.message));
    }

    res.json({ success: true, message: 'Malpractice log recorded' });
  } catch (error) {
    console.error('Error logging malpractice:', error);
    res.json({ success: true, warning: error.message });
  }
};

// Terminate exam due to malpractice
exports.terminateMalpractice = async (req, res) => {
  try {
    const allocationId = req.params.id || req.body.allocation_id || req.body.allocationId;
    if (allocationId) {
      await pool.query(
        `UPDATE test_allocations SET status = 'TERMINATED', updated_at = NOW() WHERE id = $1`,
        [allocationId]
      );
    }

    res.json({ success: true, message: 'Exam terminated due to malpractice' });
  } catch (error) {
    console.error('Error terminating exam for malpractice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
