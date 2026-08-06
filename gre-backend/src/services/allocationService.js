const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { TEST_TYPES, TEST_SPECS, STATUSES } = require('../config/testConfig');

/**
 * Core test allocation engine.
 * Picks questions, inserts a test_allocation row, and records student question history.
 * Used by both direct student scheduling and admin ticket approval.
 */
async function allocateTestToStudent({
  studentId,
  studentEmail,
  testType,
  subject,
  category,
  level,
  allocatedBy = 'admin@gre.com',
  scheduledDate,
  scheduledTime = '09:00',
  expiryDate,
  expiryTime,
  initialStatus = STATUSES.ASSIGNED,
  testTitle,
  ticketId = null,
  adminNotes,
  overrideQuestionCount,
  overrideDuration,
}) {
  if (!studentId) {
    if (!studentEmail) throw new Error('Student ID or email is required to allocate a test');
    const studentResult = await pool.query('SELECT id FROM users WHERE email = $1', [studentEmail]);
    if (studentResult.rows.length === 0) throw new Error('Student not found');
    studentId = studentResult.rows[0].id;
  }

  if (!testType) throw new Error('test_type is required');

  // Past date guard
  if (scheduledDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduledDate < todayStr) {
      throw new Error('Cannot schedule a test for a past date. Please select a valid future date.');
    }
  }

  // Duplicate active schedule guard
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
      const err = new Error('You already have an active test scheduled for this date and test type.');
      err.code = 'SLOT_CONFLICT';
      throw err;
    }
  }

  let questionIds = [];
  let questionCount = 0;
  let duration = 60;
  let computedTestTitle = testTitle || '';

  if (testType === TEST_TYPES.TOPIC_WISE) {
    if (!subject || !category || !level) {
      throw new Error('Subject, category, and level are required for TOPIC_WISE test');
    }

    const spec = TEST_SPECS.TOPIC_WISE[level] || TEST_SPECS.TOPIC_WISE.Default;
    computedTestTitle = testTitle || `${category} - ${level}`;
    questionCount = overrideQuestionCount || spec.question_count;
    duration = overrideDuration || spec.duration_minutes;

    // Unseen questions first
    let unseenQuestions = await pool.query(
      `SELECT q.id FROM questions q
       WHERE q.subject = $1 AND q.category = $2 AND q.level = $3
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $4
       )
       ORDER BY RANDOM() LIMIT $5`,
      [subject, category, level, studentId, questionCount]
    );

    let questions = unseenQuestions.rows;
    if (questions.length < questionCount) {
      const fallbackQuestions = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = $1 AND q.category = $2 AND q.level = $3
         ORDER BY RANDOM() LIMIT $4`,
        [subject, category, level, questionCount]
      );
      questions = fallbackQuestions.rows;
    }
    questionIds = questions.map(q => String(q.id));
  } else if (testType === TEST_TYPES.SECTIONAL) {
    if (!subject) {
      throw new Error('Subject is required for SECTIONAL test');
    }

    const spec = TEST_SPECS.SECTIONAL[subject] || TEST_SPECS.SECTIONAL.Default;
    computedTestTitle = testTitle || `${subject} Section Test`;
    questionCount = overrideQuestionCount || spec.question_count;
    duration = overrideDuration || spec.duration_minutes;

    let unseenQuestions = await pool.query(
      `SELECT q.id FROM questions q
       WHERE q.subject = $1
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $2
       )
       ORDER BY RANDOM() LIMIT $3`,
      [subject, studentId, questionCount]
    );

    let questions = unseenQuestions.rows;
    if (questions.length < questionCount) {
      const fallbackQuestions = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = $1
         ORDER BY RANDOM() LIMIT $2`,
        [subject, questionCount]
      );
      questions = fallbackQuestions.rows;
    }
    questionIds = questions.map(q => String(q.id));
  } else if (testType === TEST_TYPES.FULL_LENGTH) {
    const spec = TEST_SPECS.FULL_LENGTH;
    computedTestTitle = testTitle || 'Full Length GRE Test';
    questionCount = overrideQuestionCount || spec.question_count;
    duration = overrideDuration || spec.duration_minutes;

    const awaNeed = spec.awa_count;
    const verbalV1Need = 12;
    const verbalV2Need = 15;
    const quantQ1Need = 12;
    const quantQ2Need = 15;

    // 1. AWA question (unseen first)
    let awaUnseen = await pool.query(
      `SELECT q.id FROM questions q
       WHERE q.subject = 'AWA'
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $1
       )
       ORDER BY RANDOM() LIMIT $2`,
      [studentId, awaNeed]
    );
    let awaQuestions = awaUnseen.rows.map(q => String(q.id));
    if (awaQuestions.length < awaNeed) {
      const awaFallback = await pool.query(
        `SELECT q.id FROM questions q WHERE q.subject = 'AWA' ORDER BY RANDOM() LIMIT $1`,
        [awaNeed - awaQuestions.length]
      );
      awaQuestions = [...new Set([...awaQuestions, ...awaFallback.rows.map(q => String(q.id))])];
    }

    // 2. Verbal Section 1 (12 questions, mixed difficulty, unseen first)
    let verbalV1Unseen = await pool.query(
      `SELECT q.id, q.level FROM questions q
       WHERE q.subject = 'Verbal'
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $1
       )
       ORDER BY RANDOM() LIMIT $2`,
      [studentId, verbalV1Need]
    );
    let verbalV1Questions = verbalV1Unseen.rows.map(q => String(q.id));
    if (verbalV1Questions.length < verbalV1Need) {
      const v1Fallback = await pool.query(
        `SELECT q.id FROM questions q WHERE q.subject = 'Verbal' ORDER BY RANDOM() LIMIT $1`,
        [verbalV1Need - verbalV1Questions.length]
      );
      verbalV1Questions = [...new Set([...verbalV1Questions, ...v1Fallback.rows.map(q => String(q.id))])];
    }

    // 3. Verbal Section 2 (15 questions, mixed difficulty for adaptive selection, unseen first)
    let verbalV2Unseen = await pool.query(
      `SELECT q.id, q.level FROM questions q
       WHERE q.subject = 'Verbal'
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $1
       )
       AND q.id NOT IN (${verbalV1Questions.map((_, i) => `$${i + 3}`).join(',')})
       ORDER BY RANDOM() LIMIT $2`,
      [studentId, verbalV2Need, ...verbalV1Questions]
    );
    let verbalV2Questions = verbalV2Unseen.rows.map(q => String(q.id));
    if (verbalV2Questions.length < verbalV2Need) {
      const v2Fallback = await pool.query(
        `SELECT q.id FROM questions q WHERE q.subject = 'Verbal' AND q.id NOT IN (${verbalV1Questions.map((_, i) => `$${i + 2}`).join(',')}) ORDER BY RANDOM() LIMIT $1`,
        [verbalV2Need - verbalV2Questions.length, ...verbalV1Questions]
      );
      verbalV2Questions = [...new Set([...verbalV2Questions, ...v2Fallback.rows.map(q => String(q.id))])];
    }

    // 4. Quant Section 1 (12 questions, mixed difficulty, unseen first)
    let quantQ1Unseen = await pool.query(
      `SELECT q.id, q.level FROM questions q
       WHERE q.subject = 'Quant'
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $1
       )
       ORDER BY RANDOM() LIMIT $2`,
      [studentId, quantQ1Need]
    );
    let quantQ1Questions = quantQ1Unseen.rows.map(q => String(q.id));
    if (quantQ1Questions.length < quantQ1Need) {
      const q1Fallback = await pool.query(
        `SELECT q.id FROM questions q WHERE q.subject = 'Quant' ORDER BY RANDOM() LIMIT $1`,
        [quantQ1Need - quantQ1Questions.length]
      );
      quantQ1Questions = [...new Set([...quantQ1Questions, ...q1Fallback.rows.map(q => String(q.id))])];
    }

    // 5. Quant Section 2 (15 questions, mixed difficulty for adaptive selection, unseen first)
    let quantQ2Unseen = await pool.query(
      `SELECT q.id, q.level FROM questions q
       WHERE q.subject = 'Quant'
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $1
       )
       AND q.id NOT IN (${quantQ1Questions.map((_, i) => `$${i + 3}`).join(',')})
       ORDER BY RANDOM() LIMIT $2`,
      [studentId, quantQ2Need, ...quantQ1Questions]
    );
    let quantQ2Questions = quantQ2Unseen.rows.map(q => String(q.id));
    if (quantQ2Questions.length < quantQ2Need) {
      const q2Fallback = await pool.query(
        `SELECT q.id FROM questions q WHERE q.subject = 'Quant' AND q.id NOT IN (${quantQ1Questions.map((_, i) => `$${i + 2}`).join(',')}) ORDER BY RANDOM() LIMIT $1`,
        [quantQ2Need - quantQ2Questions.length, ...quantQ1Questions]
      );
      quantQ2Questions = [...new Set([...quantQ2Questions, ...q2Fallback.rows.map(q => String(q.id))])];
    }

    // Order: AWA(1) + V1(12) + V2(15) + Q1(12) + Q2(15) = 55 total
    questionIds = [...awaQuestions, ...verbalV1Questions, ...verbalV2Questions, ...quantQ1Questions, ...quantQ2Questions];
  } else {
    throw new Error('Invalid test_type. Use FULL_LENGTH, SECTIONAL, or TOPIC_WISE');
  }

  if (!questionIds || questionIds.length === 0) {
    throw new Error('No questions available for this student in the requested category/level');
  }

  const allocationId = uuidv4();
  const scheduledDateTime = scheduledDate ? new Date(`${scheduledDate}T${scheduledTime}`) : new Date();
  let expiryDateTime = null;
  if (expiryDate) {
    expiryDateTime = new Date(`${expiryDate}T${expiryTime || '23:59'}`);
  } else {
    // Default expiry = start time + duration
    expiryDateTime = new Date(scheduledDateTime.getTime() + duration * 60 * 1000);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertRes = await client.query(
      `INSERT INTO test_allocations (
        id, student_id, ticket_id, allocated_by, test_type, test_title, question_ids,
        subject, category, level, status, duration_minutes, question_count,
        scheduled_at, expires_at, scheduled_date, scheduled_start_time, admin_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        allocationId,
        studentId,
        ticketId || null,
        allocatedBy,
        testType,
        computedTestTitle,
        JSON.stringify(questionIds),
        subject || null,
        category || null,
        level || null,
        initialStatus,
        duration,
        questionIds.length,
        scheduledDateTime,
        expiryDateTime,
        scheduledDate || null,
        scheduledTime,
        adminNotes || null,
      ]
    );

    const allocation = insertRes.rows[0];

    for (const questionId of questionIds) {
      await client.query(
        `INSERT INTO student_question_history (student_id, question_id, allocation_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [studentId, questionId, allocationId]
      );
    }

    await client.query('COMMIT');

    return {
      success: true,
      allocation: {
        ...allocation,
        question_ids: questionIds,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { allocateTestToStudent };
