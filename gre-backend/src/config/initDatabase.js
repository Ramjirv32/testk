const pool = require('./database');

async function initializeTables() {
  const client = await pool.connect();

  try {
    console.log('🔄 Initializing database tables...');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        age INTEGER,
        student_type VARCHAR(50),
        role VARCHAR(50) DEFAULT 'STUDENT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ Users table created');

    // 2. Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        subject VARCHAR(50),
        category VARCHAR(255),
        level VARCHAR(50),
        question_text TEXT NOT NULL,
        question_image_url TEXT,
        options JSONB,
        answer TEXT,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
      CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
      CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level);
    `);
    console.log('✅ Questions table created');

    // 3. Test Allocations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_allocations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id VARCHAR(255) NOT NULL,
        ticket_id VARCHAR(255),
        allocated_by VARCHAR(255),
        test_type VARCHAR(50),
        test_title VARCHAR(255),
        question_ids JSONB,
        subject VARCHAR(50),
        category VARCHAR(255),
        level VARCHAR(50),
        section VARCHAR(50),
        topic VARCHAR(255),
        difficulty VARCHAR(50),
        status VARCHAR(50) DEFAULT 'REQUESTED',
        duration_minutes INTEGER DEFAULT 60,
        question_count INTEGER,
        scheduled_at TIMESTAMP,
        expires_at TIMESTAMP,
        scheduled_date VARCHAR(50),
        scheduled_start_time VARCHAR(50),
        scheduled_end_time VARCHAR(50),
        request_notes TEXT,
        admin_notes TEXT,
        cancellation_reason TEXT,
        rejection_reason TEXT,
        started_at TIMESTAMP,
        submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS section VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS scheduled_date VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS scheduled_start_time VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS scheduled_end_time VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(255);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS request_notes TEXT;
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

      CREATE INDEX IF NOT EXISTS idx_test_allocations_student_id ON test_allocations(student_id);
      CREATE INDEX IF NOT EXISTS idx_test_allocations_status ON test_allocations(status);
      CREATE INDEX IF NOT EXISTS idx_test_allocations_student_status ON test_allocations(student_id, status);
      CREATE INDEX IF NOT EXISTS idx_test_allocations_scheduled ON test_allocations(scheduled_date, scheduled_start_time);
      CREATE INDEX IF NOT EXISTS idx_test_allocations_created_at ON test_allocations(created_at DESC);
    `);
    console.log('✅ Test Allocations table created');

    // 4. Exam Sessions table (tracks live exam sessions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        allocation_id UUID REFERENCES test_allocations(id),
        user_id VARCHAR(255) NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP,
        current_section INTEGER DEFAULT 1,
        section_1_score DECIMAL(5,2),
        section_2_score DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_exam_sessions_allocation_id ON exam_sessions(allocation_id);
      CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
    `);
    console.log('✅ Exam Sessions table created');

    // 5. Test Sessions table (legacy practice sessions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        subject VARCHAR(50),
        test_type VARCHAR(50) DEFAULT 'PRACTICE',
        total_questions INTEGER DEFAULT 10,
        time_limit_minutes INTEGER DEFAULT 60,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP,
        score DECIMAL(5,2),
        percentile DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
    `);
    console.log('✅ Test Sessions table created');

    // 6. User Answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        question_id VARCHAR(255) NOT NULL,
        selected_answer VARCHAR(255),
        is_correct BOOLEAN DEFAULT FALSE,
        time_spent_seconds INTEGER DEFAULT 0,
        marked_for_review BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON user_answers(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
    `);
    console.log('✅ User Answers table created');

    // 7. Student Question History table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_question_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id VARCHAR(255) NOT NULL,
        question_id VARCHAR(255) NOT NULL,
        allocation_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, question_id)
      );
      CREATE INDEX IF NOT EXISTS idx_student_question_history_student_id ON student_question_history(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_question_history_question_id ON student_question_history(question_id);
    `);
    console.log('✅ Student Question History table created');

    // 8. Test Results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        session_id UUID,
        allocation_id UUID REFERENCES test_allocations(id),
        test_type VARCHAR(50),
        subject VARCHAR(50),
        category VARCHAR(255),
        level VARCHAR(50),
        total_questions INTEGER,
        correct_answers INTEGER,
        score DECIMAL(5,2),
        quant_score INTEGER,
        verbal_score INTEGER,
        total_score INTEGER,
        percentile DECIMAL(5,2),
        time_taken_seconds INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at DESC);
    `);
    console.log('✅ Test Results table created');

    // 9. Anti-cheat logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anti_cheat_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_session_id UUID REFERENCES exam_sessions(id),
        user_id VARCHAR(255),
        event_type VARCHAR(50),
        description TEXT,
        severity VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_anti_cheat_logs_exam_session_id ON anti_cheat_logs(exam_session_id);
      CREATE INDEX IF NOT EXISTS idx_anti_cheat_logs_user_id ON anti_cheat_logs(user_id);
    `);
    console.log('✅ Anti-Cheat Logs table created');

    // 10. GRE Tickets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gre_tickets (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) NOT NULL,
        student_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Student',
        student_email VARCHAR(255) NOT NULL DEFAULT 'unknown@example.com',
        test_type VARCHAR(50) NOT NULL,
        requested_category VARCHAR(255),
        requested_level VARCHAR(50),
        subject VARCHAR(50),
        category VARCHAR(255),
        level VARCHAR(50),
        status VARCHAR(50) DEFAULT 'PENDING',
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_gre_tickets_student_id ON gre_tickets(student_id);
      CREATE INDEX IF NOT EXISTS idx_gre_tickets_status ON gre_tickets(status);
    `);

    // Backfill/migrate existing gre_tickets tables to ensure required columns exist
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS student_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Student';`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS student_email VARCHAR(255) NOT NULL DEFAULT 'unknown@example.com';`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS test_type VARCHAR(50);`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS requested_category VARCHAR(255);`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS requested_level VARCHAR(50);`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS subject VARCHAR(50);`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS category VARCHAR(255);`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS level VARCHAR(50);`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS reason TEXT;`);
    await client.query(`ALTER TABLE gre_tickets ADD COLUMN IF NOT EXISTS notes TEXT;`);

    console.log('✅ GRE Tickets table created');

    // 11. Ticket Chat Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255),
        message_text TEXT,
        attachment_url TEXT,
        attachment_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ticket_chat_ticket_id ON ticket_chat_messages(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_chat_sender_role ON ticket_chat_messages(sender_role);
    `);
    console.log('✅ Ticket Chat Messages table created');

    // Perform safe migrations for existing tables
    await client.query(`
      ALTER TABLE ticket_chat_messages DROP CONSTRAINT IF EXISTS ticket_chat_messages_ticket_id_fkey;
      ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_session_id_fkey;
      ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS user_answers_session_id_fkey;
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS quant_score INTEGER;
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS verbal_score INTEGER;
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS total_score INTEGER;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'STUDENT';
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS section VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS scheduled_date VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS scheduled_start_time VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS scheduled_end_time VARCHAR(50);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(255);
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS request_notes TEXT;
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS admin_notes TEXT;
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE test_allocations ADD COLUMN IF NOT EXISTS score_percent DECIMAL(5,2);
    `);

    console.log('✅ All tables initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { initializeTables };
