const Question = require('../models/Question');

// Get all questions with filters
exports.getAllQuestions = async (req, res) => {
  try {
    const { subject, category, level, question_type, page = 0, limit = 20 } = req.query;
    const isFetchAll = limit === 'all' || limit === '0' || parseInt(limit) >= 5000 || parseInt(limit) === 0;

    const filters = {
      subject: subject || null,
      category: category || null,
      level: level || null,
      question_type: question_type || null,
      fetchAll: isFetchAll,
      page: isFetchAll ? 0 : (parseInt(page) || 0),
      limit: isFetchAll ? 'all' : (parseInt(limit) || 20),
    };

    const questions = await Question.getAllQuestions(filters);
    const count = await Question.getQuestionCount(filters);

    res.json({
      success: true,
      data: questions,
      questions,
      pagination: {
        page: isFetchAll ? 0 : parseInt(page),
        limit: isFetchAll ? count : parseInt(limit),
        total: count,
        pages: isFetchAll ? 1 : Math.ceil(count / (parseInt(limit) || 20)),
      },
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.getQuestionById(id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get question without answer/explanation (for exam)
exports.getQuestionForExam = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.getQuestionById(id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    // Remove answer and explanation
    const { answer, explanation, ...questionData } = question;

    res.json({ success: true, data: questionData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get categories by subject
exports.getCategories = async (req, res) => {
  try {
    const { subject } = req.query;

    if (!subject) {
      return res.status(400).json({ success: false, error: 'Subject is required' });
    }

    const categories = await Question.getCategories(subject);

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get levels
exports.getLevels = async (req, res) => {
  try {
    const levels = await Question.getLevels();
    res.json({ success: true, data: levels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get question types
exports.getQuestionTypes = async (req, res) => {
  try {
    const types = await Question.getQuestionTypes();
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await Question.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get random questions (for practice tests)
exports.getRandomQuestions = async (req, res) => {
  try {
    const { subject, count = 10, level } = req.query;

    if (!subject) {
      return res.status(400).json({ success: false, error: 'Subject is required' });
    }

    const questions = await Question.getRandomQuestions(subject, parseInt(count), level || null);

    // Remove answers and explanations
    const questionsForClient = questions.map(q => {
      const { answer, explanation, ...data } = q;
      return data;
    });

    res.json({ success: true, data: questionsForClient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create question (Admin)
exports.createQuestion = async (req, res) => {
  try {
    const pool = require('../config/database');
    const { id, subject, category, level, question_text, options, answer, explanation, question_image_url } = req.body;
    const qId = id || `Q_${Date.now()}_${Math.floor(Math.random()*1000)}`;

    const result = await pool.query(
      `INSERT INTO questions (id, subject, category, level, question_text, options, answer, explanation, question_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [qId, subject, category, level, question_text, JSON.stringify(options || []), answer, explanation, question_image_url || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update question (Admin)
exports.updateQuestion = async (req, res) => {
  try {
    const pool = require('../config/database');
    const { id } = req.params;
    const { subject, category, level, question_text, options, answer, explanation, question_image_url } = req.body;

    const result = await pool.query(
      `UPDATE questions SET
        subject = COALESCE($1, subject),
        category = COALESCE($2, category),
        level = COALESCE($3, level),
        question_text = COALESCE($4, question_text),
        options = COALESCE($5, options),
        answer = COALESCE($6, answer),
        explanation = COALESCE($7, explanation),
        question_image_url = COALESCE($8, question_image_url)
       WHERE id = $9 RETURNING *`,
      [subject, category, level, question_text, options ? JSON.stringify(options) : null, answer, explanation, question_image_url, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete question (Admin)
exports.deleteQuestion = async (req, res) => {
  try {
    const pool = require('../config/database');
    const { id } = req.params;
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Bulk import questions (Admin)
exports.bulkImportQuestions = async (req, res) => {
  const pool = require('../config/database');
  const client = await pool.connect();
  try {
    const questions = Array.isArray(req.body) ? req.body : (req.body.questions || []);
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'No questions provided for bulk import' } });
    }

    await client.query('BEGIN');
    let importedCount = 0;

    for (const q of questions) {
      const qId = q.id || `Q_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      await client.query(
        `INSERT INTO questions (id, subject, category, level, question_text, options, answer, explanation, question_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           subject = EXCLUDED.subject,
           category = EXCLUDED.category,
           level = EXCLUDED.level,
           question_text = EXCLUDED.question_text,
           options = EXCLUDED.options,
           answer = EXCLUDED.answer,
           explanation = EXCLUDED.explanation,
           question_image_url = EXCLUDED.question_image_url`,
        [qId, q.subject, q.category, q.level, q.question_text, JSON.stringify(q.options || []), q.answer, q.explanation, q.question_image_url || null]
      );
      importedCount++;
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Successfully imported ${importedCount} questions`, count: importedCount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk importing questions:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  } finally {
    client.release();
  }
};

// Upload question image
exports.uploadQuestionImage = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { image, filename } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const uploadDir = path.join(__dirname, '../../../original/gre-frontend/public/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanFilename = (filename || `img_${Date.now()}.png`).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(uploadDir, cleanFilename);

    // Parse Base64 image string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `http://localhost:11000/images/${encodeURIComponent(cleanFilename)}`;
    res.json({ success: true, image_url: imageUrl, filename: cleanFilename });
  } catch (error) {
    console.error('Error uploading question image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
