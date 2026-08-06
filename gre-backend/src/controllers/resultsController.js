const pool = require('../config/database');

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

// Get user's test results
exports.getUserResults = async (req, res) => {
  try {
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM test_results 
       WHERE (user_id = $1 OR user_id = $2)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, userEmail, parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM test_results WHERE (user_id = $1 OR user_id = $2)`,
      [userId, userEmail]
    );

    res.json({
      success: true,
      data: result.rows,
      results: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get specific result with detailed answers
exports.getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';

    // Get result
    const resultQuery = await pool.query(
      `SELECT * FROM test_results WHERE id = $1 AND (user_id = $2 OR user_id = $3)`,
      [resultId, userId, userEmail]
    );

    if (!resultQuery.rows.length) {
      return res.status(404).json({ success: false, error: 'Result not found' });
    }

    const testResult = resultQuery.rows[0];

    // Get allocation to get question IDs
    const allocationQuery = await pool.query(
      `SELECT question_ids FROM test_allocations WHERE id = $1`,
      [testResult.allocation_id]
    );

    const questionIds = allocationQuery.rows.length ? safeParseQuestionIds(allocationQuery.rows[0].question_ids) : [];

    // Get user answers
    const answersQuery = await pool.query(
      `SELECT ua.*, q.answer as correct_answer, q.question_text, q.options
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.session_id = $1
       ORDER BY ua.created_at`,
      [testResult.session_id]
    );

    const answers = answersQuery.rows;

    res.json({
      success: true,
      data: {
        result: testResult,
        answers: answers.map(a => ({
          question_id: a.question_id,
          question_text: a.question_text,
          options: a.options,
          selected_answer: a.selected_answer,
          correct_answer: a.correct_answer,
          is_correct: a.is_correct,
          time_spent_seconds: a.time_spent_seconds,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get result by allocation ID
exports.getResultByAllocationId = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const userId = req.user?.id || req.user?.sub || '';
    const userEmail = req.user?.email || '';

    // Get allocation (try allocationId first, or test_results.id fallback)
    let allocRes = await pool.query(
      `SELECT * FROM test_allocations WHERE id = $1`,
      [allocationId]
    );

    if (!allocRes.rows.length) {
      const resultLookup = await pool.query(
        `SELECT ta.* FROM test_results tr JOIN test_allocations ta ON tr.allocation_id = ta.id WHERE tr.id = $1`,
        [allocationId]
      );
      if (resultLookup.rows.length > 0) {
        allocRes = resultLookup;
      }
    }

    if (!allocRes.rows.length) {
      const trRes = await pool.query(`SELECT * FROM test_results WHERE id = $1`, [allocationId]);
      if (trRes.rows.length > 0) {
        const tr = trRes.rows[0];
        allocRes = {
          rows: [{
            id: tr.allocation_id || tr.id,
            test_title: tr.test_title || 'GRE Test',
            test_type: tr.test_type || 'PRACTICE',
            status: 'COMPLETED',
            score_percent: tr.score_percent || (tr.total_score ? Math.round((tr.total_score / 340) * 100) : 0),
            created_at: tr.created_at,
          }]
        };
      }
    }

    if (!allocRes.rows.length) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    const allocation = allocRes.rows[0];

    // Get test_results if present
    const resultQuery = await pool.query(
      `SELECT * FROM test_results WHERE allocation_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [allocationId]
    );
    const testResult = resultQuery.rows[0] || null;

    // Get session - pick the one with the most answers in case of multiple sessions
    const sessionQuery = await pool.query(
      `SELECT es.* FROM exam_sessions es
       WHERE es.allocation_id = $1
       ORDER BY (SELECT COUNT(*) FROM user_answers ua WHERE ua.session_id = es.id) DESC, es.started_at DESC LIMIT 1`,
      [allocationId]
    );
    const examSession = sessionQuery.rows[0] || null;
    const sessionId = examSession?.id || testResult?.session_id || null;

    let questions = [];
    let userAnswers = [];

    if (sessionId) {
      // Get all answered questions with user answers
      const answersQuery = await pool.query(
        `SELECT ua.*, q.answer as correct_answer, q.question_text, q.options, q.category, q.subject, q.level, q.explanation, q.question_image_url
         FROM user_answers ua
         JOIN questions q ON ua.question_id = q.id
         WHERE ua.session_id = $1
         ORDER BY ua.created_at`,
        [sessionId]
      );

      // Build a map of answered question IDs
      const answeredMap = {};
      answersQuery.rows.forEach(a => {
        answeredMap[a.question_id] = {
          id: a.question_id,
          question_text: a.question_text || '',
          options: safeParseQuestionIds(a.options),
          correct_option: a.correct_answer,
          answer: a.correct_answer,
          category: a.category || allocation.category || 'General',
          subject: a.subject || allocation.subject || 'Mixed',
          difficulty: a.level || allocation.level || 'Medium',
          level: a.level || allocation.level || 'Medium',
          question_image_url: a.question_image_url,
          explanation: a.explanation || '',
          student_answer: a.selected_answer,
          is_correct: a.is_correct ?? false,
        };
      });

      // Fetch ALL questions from the allocation to include unanswered ones too
      const qIds = safeParseQuestionIds(allocation.question_ids);
      if (qIds.length > 0) {
        // Build placeholders for IN clause (question IDs may be strings, not UUIDs)
        const placeholders = qIds.map((_, i) => `$${i + 1}`).join(',');
        const allQRes = await pool.query(
          `SELECT id, question_text, options, answer as correct_answer, category, subject, level, explanation, question_image_url
           FROM questions WHERE id IN (${placeholders})`,
          qIds
        );

        // Build ordered question list following allocation order
        const qMap = {};
        allQRes.rows.forEach(q => { qMap[q.id] = q; });

        questions = qIds.map(qid => {
          if (answeredMap[qid]) return answeredMap[qid];
          const q = qMap[qid];
          if (!q) return null;
          return {
            id: q.id,
            question_text: q.question_text || '',
            options: safeParseQuestionIds(q.options),
            correct_option: q.correct_answer,
            answer: q.correct_answer,
            category: q.category || allocation.category || 'General',
            subject: q.subject || allocation.subject || 'Mixed',
            difficulty: q.level || allocation.level || 'Medium',
            level: q.level || allocation.level || 'Medium',
            question_image_url: q.question_image_url,
            explanation: q.explanation || '',
            student_answer: null,
            is_correct: false,
          };
        }).filter(Boolean);
      } else {
        questions = Object.values(answeredMap);
      }

      userAnswers = answersQuery.rows.map(a => ({
        question_id: a.question_id,
        selected_option: a.selected_answer,
        is_correct: a.is_correct ?? false,
        time_spent: a.time_spent_seconds || 0,
      }));
    } else {
      // Fallback to allocation question_ids if session not recorded
      const qIds = safeParseQuestionIds(allocation.question_ids);
      if (qIds.length > 0) {
        const placeholders = qIds.map((_, i) => `$${i + 1}`).join(',');
        const qRes = await pool.query(
          `SELECT id, question_text, options, answer as correct_option, category, subject, level as difficulty, explanation, question_image_url
           FROM questions WHERE id IN (${placeholders})`,
          qIds
        );
        const qMap = {};
        qRes.rows.forEach(q => { qMap[q.id] = q; });
        questions = qIds.map(qid => {
          const q = qMap[qid];
          if (!q) return null;
          return {
            ...q,
            options: safeParseQuestionIds(q.options),
            student_answer: null,
            is_correct: false,
          };
        }).filter(Boolean);
      }
    }

    const payload = {
      allocation,
      exam_session: examSession,
      result: testResult || {
        id: allocation.id,
        test_title: allocation.test_title,
        test_type: allocation.test_type,
        score_percent: allocation.score_percent,
        total_questions: questions.length,
        correct_answers: questions.filter(q => q.is_correct).length,
        status: allocation.status,
        completed_at: allocation.submitted_at || allocation.created_at,
        questions,
      },
      questions,
      user_answers: userAnswers,
    };

    res.json(payload);
  } catch (error) {
    console.error('Error fetching result by allocation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';

    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_tests,
        ROUND(AVG(score), 2) as avg_score,
        MAX(score) as max_score,
        ROUND(AVG(percentile), 2) as avg_percentile,
        COUNT(CASE WHEN test_type = 'FULL_LENGTH' THEN 1 END) as full_length_tests,
        COUNT(CASE WHEN test_type = 'SECTIONAL' THEN 1 END) as sectional_tests,
        COUNT(CASE WHEN test_type = 'TOPIC_WISE' THEN 1 END) as topic_wise_tests
       FROM test_results WHERE (user_id = $1 OR user_id = $2)`,
      [userId, userEmail]
    );

    const categoryStats = await pool.query(
      `SELECT 
        category,
        COUNT(*) as attempts,
        ROUND(AVG((correct_answers::float / NULLIF(total_questions, 0)) * 100), 2) as accuracy_percent,
        ROUND(AVG(score), 2) as avg_score
       FROM test_results 
       WHERE (user_id = $1 OR user_id = $2) AND category IS NOT NULL
       GROUP BY category
       ORDER BY attempts DESC`,
      [userId, userEmail]
    );

    const subjectStats = await pool.query(
      `SELECT 
        subject,
        COUNT(*) as attempts,
        ROUND(AVG((correct_answers::float / NULLIF(total_questions, 0)) * 100), 2) as accuracy_percent,
        ROUND(AVG(score), 2) as avg_score
       FROM test_results 
       WHERE (user_id = $1 OR user_id = $2) AND subject IS NOT NULL
       GROUP BY subject`,
      [userId, userEmail]
    );

    res.json({
      success: true,
      data: {
        overall: statsResult.rows[0],
        by_category: categoryStats.rows,
        by_subject: subjectStats.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get category-wise performance
exports.getCategoryPerformance = async (req, res) => {
  try {
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';
    const { subject } = req.query;

    let query = `SELECT 
      category,
      COUNT(*) as total_questions,
      COUNT(CASE WHEN is_correct THEN 1 END) as correct_answers,
      ROUND(100.0 * COUNT(CASE WHEN is_correct THEN 1 END) / NULLIF(COUNT(*), 0), 2) as accuracy_percent,
      ROUND(AVG(time_spent_seconds), 2) as avg_time_per_question
     FROM user_answers ua
     JOIN questions q ON ua.question_id = q.id
     WHERE (ua.user_id = $1 OR ua.user_id = $2)`;
    
    const values = [userId, userEmail];

    if (subject) {
      query += ` AND q.subject = $3`;
      values.push(subject);
    }

    query += ` GROUP BY category ORDER BY accuracy_percent DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get level-wise performance
exports.getLevelPerformance = async (req, res) => {
  try {
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';
    const { subject } = req.query;

    let query = `SELECT 
      q.level,
      COUNT(*) as total_questions,
      COUNT(CASE WHEN ua.is_correct THEN 1 END) as correct_answers,
      ROUND(100.0 * COUNT(CASE WHEN ua.is_correct THEN 1 END) / NULLIF(COUNT(*), 0), 2) as accuracy_percent
     FROM user_answers ua
     JOIN questions q ON ua.question_id = q.id
     WHERE (ua.user_id = $1 OR ua.user_id = $2)`;
    
    const values = [userId, userEmail];

    if (subject) {
      query += ` AND q.subject = $3`;
      values.push(subject);
    }

    query += ` GROUP BY q.level ORDER BY q.level`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
