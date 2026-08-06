const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { allocateTestToStudent } = require('../services/allocationService');

async function buildTicketAllocation(ticket, scheduledDate, scheduledTime, expiryDate, expiryTime) {
  const testType = ticket.test_type || 'FULL_LENGTH';
  const studentId = ticket.student_id;
  const allocatedBy = 'admin@gre.com';

  let questionIds = [];
  let testTitle = '';
  let durationMinutes = 60;
  let questionCount = 0;
  let subject = null;
  let category = null;
  let level = null;

  if (testType === 'FULL_LENGTH') {
    testTitle = 'Full Length GRE Test';
    questionCount = 54;
    durationMinutes = 118;

    const verbalUnseen = await pool.query(
      `SELECT q.id FROM questions q
       WHERE q.subject = 'Verbal'
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $1
       )
       ORDER BY RANDOM() LIMIT 27`,
      [studentId]
    );
    let verbalQuestions = verbalUnseen.rows.map(q => q.id);

    if (verbalQuestions.length < 27) {
      const verbalFallback = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = 'Verbal'
         ORDER BY RANDOM() LIMIT $1`,
        [27 - verbalQuestions.length]
      );
      verbalQuestions = [...verbalQuestions, ...verbalFallback.rows.map(q => q.id)];
    }

    const quantUnseen = await pool.query(
      `SELECT q.id FROM questions q
       WHERE q.subject = 'Quant'
       AND q.id NOT IN (
         SELECT question_id FROM student_question_history WHERE student_id = $1
       )
       ORDER BY RANDOM() LIMIT 27`,
      [studentId]
    );
    let quantQuestions = quantUnseen.rows.map(q => q.id);

    if (quantQuestions.length < 27) {
      const quantFallback = await pool.query(
        `SELECT q.id FROM questions q
         WHERE q.subject = 'Quant'
         ORDER BY RANDOM() LIMIT $1`,
        [27 - quantQuestions.length]
      );
      quantQuestions = [...quantQuestions, ...quantFallback.rows.map(q => q.id)];
    }

    questionIds = [...verbalQuestions, ...quantQuestions];
  } else if (testType === 'SECTIONAL') {
    subject = ticket.subject || 'Verbal';
    testTitle = `${subject} Section Test`;
    questionCount = 20;
    durationMinutes = 35;

    const unseenQuestions = await pool.query(
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
    questionIds = questions.map(q => q.id);
  } else {
    subject = ticket.subject || 'Verbal';
    category = ticket.category || 'Reading Comprehension';
    level = ticket.level || 'Medium';
    testTitle = `${category} - ${level}`;
    questionCount = 15;
    durationMinutes = 20;

    const unseenQuestions = await pool.query(
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
    questionIds = questions.map(q => q.id);
  }

  const allocationId = uuidv4();
  const scheduledAt = scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || '09:00'}`) : new Date();
  const expiresAt = expiryDate ? new Date(`${expiryDate}T${expiryTime || '23:59'}`) : null;

  const allocationResult = await pool.query(
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
      subject,
      category,
      level,
      'ASSIGNED',
      durationMinutes,
      questionIds.length,
      scheduledAt,
      expiresAt,
    ]
  );

  for (const questionId of questionIds) {
    await pool.query(
      `INSERT INTO student_question_history (student_id, question_id, allocation_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [studentId, questionId, allocationId]
    );
  }

  return allocationResult.rows[0];
}

// GET /api/admin/tickets
exports.getTickets = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM gre_tickets';
    let params = [];

    if (status && status !== 'all') {
      query += ' WHERE UPPER(status) = UPPER($1)';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      tickets: result.rows,
      data: {
        tickets: result.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM gre_tickets WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    res.json({ success: true, ticket: result.rows[0], data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/admin/tickets/:id/approve
exports.approveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const {
      auto_allocate = true,
      test_type,
      subject,
      category,
      level,
      requested_category,
      requested_level,
      scheduled_date,
      scheduled_time,
      scheduled_at,
      expires_at,
      expiry_date,
      expiry_time,
      test_title,
      question_count,
      duration_minutes,
      admin_notes,
      allocation_mode = 'AUTO',
      question_ids,
    } = body;

    // Parse ISO scheduled_at / expires_at into LOCAL date + time components
    // Using local methods instead of toISOString (UTC) + toTimeString (local) to avoid timezone mismatch
    function toLocalDateStr(d) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    function toLocalTimeStr(d) {
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    let finalScheduledDate = scheduled_date;
    let finalScheduledTime = scheduled_time;
    let finalExpiryDate = expiry_date;
    let finalExpiryTime = expiry_time;

    if (scheduled_at) {
      const parsedStart = new Date(scheduled_at);
      if (!isNaN(parsedStart.getTime())) {
        finalScheduledDate = toLocalDateStr(parsedStart);
        finalScheduledTime = toLocalTimeStr(parsedStart);
      }
    }
    if (expires_at) {
      const parsedExpiry = new Date(expires_at);
      if (!isNaN(parsedExpiry.getTime())) {
        finalExpiryDate = toLocalDateStr(parsedExpiry);
        finalExpiryTime = toLocalTimeStr(parsedExpiry);
      }
    }

    const ticketResult = await pool.query('SELECT * FROM gre_tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];
    if (ticket.status !== 'PENDING' && ticket.status !== 'OPEN') {
      return res.status(400).json({ success: false, error: 'Ticket has already been processed' });
    }

    let allocation = null;
    let finalStatus = 'APPROVED';

    if (String(auto_allocate) !== 'false') {
      // Manual question selection mode: bypass auto question picking
      if (allocation_mode === 'MANUAL' && question_ids && Array.isArray(question_ids) && question_ids.length > 0) {
        const { v4: uuidv4 } = require('uuid');
        const presetMins = (test_type || ticket.test_type) === 'FULL_LENGTH' ? 118 : (test_type || ticket.test_type) === 'SECTIONAL' ? 35 : 20;
        const durationMins = duration_minutes || presetMins;
        const schedDateTime = finalScheduledDate ? new Date(`${finalScheduledDate}T${finalScheduledTime || '09:00'}`) : new Date();
        let expDateTime = null;
        if (finalExpiryDate) {
          expDateTime = new Date(`${finalExpiryDate}T${finalExpiryTime || '23:59'}`);
        } else {
          expDateTime = new Date(schedDateTime.getTime() + durationMins * 60 * 1000);
        }
        const allocId = uuidv4();
        const title = test_title || `${test_type || ticket.test_type} Manual Test`;
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `INSERT INTO test_allocations (id, student_id, ticket_id, allocated_by, test_type, test_title, question_ids, subject, category, level, status, duration_minutes, question_count, scheduled_at, expires_at, scheduled_date, scheduled_start_time, admin_notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSIGNED', $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [allocId, ticket.student_id, id, req.user?.email || 'admin@gre.com', test_type || ticket.test_type, title, JSON.stringify(question_ids), subject || null, category || null, level || null, durationMins, question_ids.length, schedDateTime, expDateTime, finalScheduledDate || null, finalScheduledTime || '09:00', adminNotes || null]
          );
          for (const qid of question_ids) {
            await client.query(
              `INSERT INTO student_question_history (student_id, question_id, allocation_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
              [ticket.student_id, qid, allocId]
            );
          }
          await client.query('COMMIT');
          allocation = { id: allocId, question_ids };
          finalStatus = 'ALLOCATED';
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } else {
        const allocationRes = await allocateTestToStudent({
          studentId: ticket.student_id,
          studentEmail: ticket.student_email,
          testType: test_type || ticket.test_type,
          subject: subject || requested_category || ticket.subject || null,
          category: category || requested_category || ticket.category || null,
          level: level || requested_level || ticket.level || null,
          allocatedBy: req.user?.email || req.user?.name || 'admin@gre.com',
          scheduledDate: finalScheduledDate,
          scheduledTime: finalScheduledTime,
          expiryDate: finalExpiryDate,
          expiryTime: finalExpiryTime,
          initialStatus: 'ASSIGNED',
          testTitle: test_title,
          ticketId: id,
          adminNotes: admin_notes,
          overrideQuestionCount: question_count ? parseInt(question_count, 10) : null,
          overrideDuration: duration_minutes ? parseInt(duration_minutes, 10) : null,
        });

        allocation = allocationRes.allocation;
        finalStatus = 'ALLOCATED';
      }
    }

    const updateResult = await pool.query(
      `UPDATE gre_tickets 
       SET status = $1, updated_at = NOW(), notes = $2 
       WHERE id = $3 
       RETURNING *`,
      [finalStatus, admin_notes || (allocation ? `Approved and allocated test ${allocation.id}` : 'Approved'), id]
    );

    res.json({
      success: true,
      message: `Ticket ${allocation ? 'approved and test allocated' : 'approved'}`,
      ticket: updateResult.rows[0],
      allocation,
      data: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error approving ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/admin/tickets/:id/reject
exports.rejectTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason, reason } = req.body || {};
    const notesText = rejection_reason || reason || 'Rejected by admin';

    const updateResult = await pool.query(
      `UPDATE gre_tickets 
       SET status = 'REJECTED', notes = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [notesText, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({
      success: true,
      message: 'Ticket rejected successfully',
      ticket: updateResult.rows[0],
      data: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error rejecting ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/tickets/request — student creates a test request ticket
exports.createTicket = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.user_id || '';
    const { ticket_type, requested_category, requested_level, subject, category, level } = req.body;

    if (!ticket_type) {
      return res.status(400).json({ success: false, error: 'ticket_type is required' });
    }

    const isGeneralSupport = ticket_type === 'GENERAL';

    // Support tickets: close any existing active support ticket so only one is active at a time
    if (isGeneralSupport) {
      await pool.query(
        `UPDATE gre_tickets
         SET status = 'CLOSED', updated_at = NOW()
         WHERE student_id = $1
           AND test_type = 'GENERAL'
           AND UPPER(status) IN ('PENDING', 'APPROVED', 'OPEN')`,
        [studentId]
      );
    }

    // Fetch student name/email from the users table since the JWT does not always include name
    let studentName = req.user?.name || '';
    let studentEmail = req.user?.email || '';
    try {
      const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [studentId]);
      if (userRes.rows.length > 0) {
        studentName = userRes.rows[0].name || studentName;
        studentEmail = userRes.rows[0].email || studentEmail;
      }
    } catch (userErr) {
      console.error('Warning: could not fetch user details for ticket:', userErr.message);
    }

    if (!studentName) studentName = 'Student';
    if (!studentEmail) studentEmail = 'unknown@example.com';

    const ticketId = uuidv4();
    const reqCategory = requested_category || category || null;
    const reqLevel = requested_level || level || null;
    const notesText = `Test request: ${ticket_type}${subject ? ` | Subject: ${subject}` : ''}${category ? ` | Category: ${category}` : ''}${level ? ` | Level: ${level}` : ''}`;

    const { rows } = await pool.query(
      `INSERT INTO gre_tickets (
        id, student_id, student_name, student_email, test_type,
        requested_category, requested_level, subject, category, level,
        status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11) RETURNING *`,
      [
        ticketId,
        studentId,
        studentName,
        studentEmail,
        ticket_type,
        reqCategory,
        reqLevel,
        subject || null,
        category || null,
        level || null,
        notesText,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Test request ticket submitted successfully',
      ticket: rows[0],
      data: rows[0],
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/tickets/my-requests — get student's tickets with unread count
exports.getStudentTickets = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.user_id || '';

    const { rows } = await pool.query(
      `SELECT t.*,
              (SELECT COUNT(*)::int FROM ticket_chat_messages m WHERE m.ticket_id::text = t.id::text AND m.sender_role = 'ADMIN' AND m.is_read = FALSE) as unread_count
       FROM gre_tickets t
       WHERE t.student_id = $1
       ORDER BY t.created_at DESC`,
      [studentId]
    );

    res.json({ success: true, tickets: rows, data: rows });
  } catch (error) {
    console.error('Error fetching student tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/tickets/:id/messages — get chat messages for a ticket
exports.getTicketMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const studentId = user?.id || user?.user_id || '';

    const ticketRes = await pool.query('SELECT * FROM gre_tickets WHERE id = $1 AND student_id = $2', [id, studentId]);
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    await pool.query(
      `UPDATE ticket_chat_messages SET is_read = TRUE WHERE ticket_id = $1 AND sender_role = 'ADMIN' AND is_read = FALSE`,
      [id]
    );

    const { rows } = await pool.query(
      `SELECT * FROM ticket_chat_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({ success: true, messages: rows, data: rows });
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/tickets/:id/messages — send a chat message
exports.sendTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const studentId = user?.id || user?.user_id || '';
    const { message_text, attachment_url, attachment_type } = req.body;

    const ticketRes = await pool.query('SELECT * FROM gre_tickets WHERE id = $1 AND student_id = $2', [id, studentId]);
    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    if (ticketRes.rows[0].status === 'CLOSED' || ticketRes.rows[0].status === 'REJECTED') {
      return res.status(400).json({ success: false, error: 'This ticket is closed. No further messages can be sent.' });
    }

    const senderName = user?.name || user?.email || 'Student';

    const { rows } = await pool.query(
      `INSERT INTO ticket_chat_messages (ticket_id, sender_id, sender_role, sender_name, message_text, attachment_url, attachment_type, is_read)
       VALUES ($1, $2, 'STUDENT', $3, $4, $5, $6, FALSE) RETURNING *`,
      [id, studentId, senderName, message_text || '', attachment_url || null, attachment_type || null]
    );

    if (ticketRes.rows[0].status === 'PENDING' || ticketRes.rows[0].status === 'APPROVED') {
      await pool.query(`UPDATE gre_tickets SET status = 'OPEN' WHERE id = $1`, [id]);
    }

    res.status(201).json({ success: true, message: rows[0], data: rows[0] });
  } catch (error) {
    console.error('Error sending ticket message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/tickets/unread-summary — total unread admin messages for student
exports.getUnreadSummary = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.user_id || '';

    const { rows } = await pool.query(
      `SELECT COUNT(*)::int as count
       FROM ticket_chat_messages m
       JOIN gre_tickets t ON m.ticket_id::text = t.id::text
       WHERE t.student_id = $1 AND m.sender_role = 'ADMIN' AND m.is_read = FALSE`,
      [studentId]
    );

    res.json({ success: true, total_unread: rows[0]?.count || 0 });
  } catch (error) {
    console.error('Error fetching unread summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/tickets/:id/close — student closes their ticket
exports.closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id || req.user?.user_id || '';

    const { rows } = await pool.query(
      `UPDATE gre_tickets SET status = 'CLOSED', updated_at = NOW()
       WHERE id = $1 AND student_id = $2 RETURNING *`,
      [id, studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true, message: 'Ticket closed successfully', ticket: rows[0], data: rows[0] });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/tickets/upload — upload attachment (base64)
exports.uploadAttachment = async (req, res) => {
  try {
    const { file_data, file_name, file_type } = req.body;
    if (!file_data) {
      return res.status(400).json({ success: false, error: 'file_data is required' });
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const base64Data = file_data.replace(/^data:(image|audio)\/\w+;base64,/, '');
    const ext = file_type === 'AUDIO' ? '.webm' : '.png';
    const filename = `attachment_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    res.json({ success: true, attachment_url: `/uploads/${filename}`, attachment_type: file_type || 'IMAGE' });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
