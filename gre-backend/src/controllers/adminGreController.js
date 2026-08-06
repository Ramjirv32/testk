const pool = require('../config/database');
const { calculateGreScore } = require('../config/testConfig');

// GET /api/admin/gre/stats
exports.getGREStats = async (req, res) => {
  try {
    const studentsRes = await pool.query('SELECT COUNT(*) FROM users');
    const ticketsRes = await pool.query("SELECT COUNT(*) FROM gre_tickets WHERE UPPER(status) = 'PENDING'");
    const allocRes = await pool.query('SELECT COUNT(*) FROM test_allocations');
    const questionsRes = await pool.query('SELECT COUNT(*) FROM questions');
    const termRes = await pool.query("SELECT COUNT(*) FROM test_allocations WHERE status = 'TERMINATED'");

    res.json({
      success: true,
      data: {
        total_students: parseInt(studentsRes.rows[0].count, 10) || 0,
        pending_tickets: parseInt(ticketsRes.rows[0].count, 10) || 0,
        total_allocations: parseInt(allocRes.rows[0].count, 10) || 0,
        total_questions: parseInt(questionsRes.rows[0].count, 10) || 0,
        malpractice_terminations: parseInt(termRes.rows[0].count, 10) || 0,
        tests_completed_today: 0,
        average_score: 310.5,
      },
    });
  } catch (error) {
    console.error('Error fetching GRE stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/gre/allocation-stats
exports.getAllocationStats = async (req, res) => {
  try {
    const assigned = await pool.query("SELECT COUNT(*) FROM test_allocations WHERE status = 'ASSIGNED'");
    const scheduled = await pool.query("SELECT COUNT(*) FROM test_allocations WHERE status = 'SCHEDULED'");
    const inProgress = await pool.query("SELECT COUNT(*) FROM test_allocations WHERE status = 'IN_PROGRESS'");
    const completed = await pool.query("SELECT COUNT(*) FROM test_allocations WHERE status = 'COMPLETED'");
    const expired = await pool.query("SELECT COUNT(*) FROM test_allocations WHERE status = 'EXPIRED'");
    const terminated = await pool.query("SELECT COUNT(*) FROM test_allocations WHERE status = 'TERMINATED'");

    res.json({
      success: true,
      data: {
        assigned: parseInt(assigned.rows[0].count, 10) || 0,
        scheduled: parseInt(scheduled.rows[0].count, 10) || 0,
        in_progress: parseInt(inProgress.rows[0].count, 10) || 0,
        completed: parseInt(completed.rows[0].count, 10) || 0,
        expired: parseInt(expired.rows[0].count, 10) || 0,
        terminated: parseInt(terminated.rows[0].count, 10) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching allocation stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/audit-trail
exports.getAuditTrail = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        logs: [
          {
            id: 'log-1',
            action: 'TICKET_APPROVED',
            admin_email: 'admin@gre.com',
            target_id: 't-103',
            details: 'Approved GRE Topic-Wise Ticket',
            created_at: new Date().toISOString(),
          },
          {
            id: 'log-2',
            action: 'TEST_ALLOCATED',
            admin_email: 'admin@gre.com',
            target_id: 'alloc-101',
            details: 'Allocated FULL_LENGTH test to Alex Johnson',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/gre/dashboard/stats
exports.getStudentDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';

    const allocRes = await pool.query(
      `SELECT COUNT(*) as total FROM test_allocations WHERE (student_id = $1 OR student_id = $2)`,
      [userId, userEmail]
    );
    const completedRes = await pool.query(
      `SELECT COUNT(*) as total FROM test_allocations WHERE (student_id = $1 OR student_id = $2) AND status IN ('COMPLETED', 'SUBMITTED')`,
      [userId, userEmail]
    );

    const quantRes = await pool.query(
      `SELECT AVG(quant_score) as avg_quant FROM test_results WHERE (user_id = $1 OR user_id = $2) AND quant_score IS NOT NULL`,
      [userId, userEmail]
    );
    const verbalRes = await pool.query(
      `SELECT AVG(verbal_score) as avg_verbal FROM test_results WHERE (user_id = $1 OR user_id = $2) AND verbal_score IS NOT NULL`,
      [userId, userEmail]
    );
    const scoresRes = await pool.query(
      `SELECT AVG(score) as avg_total FROM test_results WHERE (user_id = $1 OR user_id = $2) AND score IS NOT NULL`,
      [userId, userEmail]
    );

    const totalAssigned = parseInt(allocRes.rows[0].total) || 0;
    const totalCompleted = parseInt(completedRes.rows[0].total) || 0;

    const avgQuant = totalCompleted > 0 && quantRes.rows[0]?.avg_quant ? Math.round(parseFloat(quantRes.rows[0].avg_quant)) : null;
    const avgVerbal = totalCompleted > 0 && verbalRes.rows[0]?.avg_verbal ? Math.round(parseFloat(verbalRes.rows[0].avg_verbal)) : null;
    let avgScore = null;
    if (totalCompleted > 0) {
      if (avgQuant !== null && avgVerbal !== null) {
        avgScore = avgQuant + avgVerbal;
      } else if (scoresRes.rows[0]?.avg_total) {
        avgScore = Math.round(parseFloat(scoresRes.rows[0].avg_total));
      }
    }

    res.json({
      success: true,
      data: {
        tests_assigned: totalAssigned,
        tests_completed: totalCompleted,
        average_score: avgScore,
        quant_avg: avgQuant,
        verbal_avg: avgVerbal,
        pending_approvals: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching student dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/analytics/my-analytics
exports.getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';

    // Look up all user IDs matching this email (allocations may use different ID formats)
    let allUserIds = [userId, userEmail];
    if (userEmail) {
      const userLookup = await pool.query(`SELECT id FROM users WHERE email = $1`, [userEmail]);
      for (const row of userLookup.rows) {
        if (!allUserIds.includes(row.id)) allUserIds.push(row.id);
      }
    }

    const idPlaceholders = allUserIds.map((_, i) => `$${i + 1}`).join(',');

    // Query test_results first (completed tests with scores)
    const resultsQuery = await pool.query(
      `SELECT tr.*, ta.test_type, ta.test_title
       FROM test_results tr
       LEFT JOIN test_allocations ta ON tr.allocation_id = ta.id
       WHERE tr.user_id IN (${idPlaceholders}) ORDER BY tr.created_at ASC`,
      allUserIds
    );

    // Also query test_allocations that don't have test_results (terminated, expired, etc.)
    const allocQuery = await pool.query(
      `SELECT ta.id as allocation_id, ta.test_type, ta.test_title, ta.status,
              ta.score_percent, ta.created_at, ta.updated_at,
              ta.student_id
       FROM test_allocations ta
       WHERE ta.student_id IN (${idPlaceholders})
       AND ta.id NOT IN (
         SELECT allocation_id FROM test_results WHERE allocation_id IS NOT NULL
       )
       ORDER BY ta.created_at ASC`,
      allUserIds
    );

    // Merge results and allocations into a unified list
    const results = [...resultsQuery.rows];
    for (const alloc of allocQuery.rows) {
      results.push({
        allocation_id: alloc.allocation_id,
        test_type: alloc.test_type,
        test_title: alloc.test_title,
        status: alloc.status,
        total_score: 0,
        score: 0,
        quant_score: 130,
        verbal_score: 130,
        total_questions: 0,
        correct_answers: 0,
        created_at: alloc.updated_at || alloc.created_at,
      });
    }

    // Sort by created_at
    results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const totalTests = results.length;

    let totalScoreSum = 0;
    let highestScore = 0;
    let lowestScore = 340;
    let totalQuantScore = 0;
    let totalVerbalScore = 0;
    let totalAccuracySum = 0;

    const scoreTrendData = results.map((r, idx) => {
      const score = parseInt(r.total_score) || (parseInt(r.score) || 0);
      totalScoreSum += score;
      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;
      totalQuantScore += parseInt(r.quant_score) || 0;
      totalVerbalScore += parseInt(r.verbal_score) || 0;
      const accuracy = r.total_questions > 0 ? Math.round((parseInt(r.correct_answers) / parseInt(r.total_questions)) * 100) : 0;
      totalAccuracySum += accuracy;

      return {
        dateLabel: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        score,
        label: r.test_title || `Test ${idx + 1}`,
        isActual: true,
        test_type: r.test_type || 'PRACTICE',
      };
    });

    if (totalTests === 0) lowestScore = 0;

    const avgScore = totalTests > 0 ? Math.round(totalScoreSum / totalTests) : 0;
    const avgAccuracy = totalTests > 0 ? Math.round(totalAccuracySum / totalTests) : 0;
    const avgQuant = totalTests > 0 ? Math.round(totalQuantScore / totalTests) : 130;
    const avgVerbal = totalTests > 0 ? Math.round(totalVerbalScore / totalTests) : 130;

    // Topic performance
    const topicPerf = await pool.query(
      `SELECT 
        q.category as topic,
        q.subject,
        COUNT(*) as total,
        COUNT(CASE WHEN ua.is_correct THEN 1 END) as correct,
        ROUND(100.0 * COUNT(CASE WHEN ua.is_correct THEN 1 END) / NULLIF(COUNT(*), 0), 1) as percentage
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.user_id IN (${allUserIds.map((_, i) => `$${i + 1}`).join(',')}) AND q.category IS NOT NULL
       GROUP BY q.category, q.subject
       ORDER BY percentage DESC`,
      allUserIds
    );

    const topStrengthAreas = topicPerf.rows
      .filter(t => parseFloat(t.percentage) >= 60)
      .slice(0, 5)
      .map(t => ({ name: t.topic, progressPct: parseFloat(t.percentage), linkText: 'Practice' }));

    const topWeaknessAreas = topicPerf.rows
      .filter(t => parseFloat(t.percentage) < 60)
      .slice(-5)
      .reverse()
      .map(t => ({ name: t.topic, progressPct: parseFloat(t.percentage), linkText: 'Improve' }));

    // Timing by question type
    const timingResult = await pool.query(
      `SELECT 
        q.category as type,
        ROUND(AVG(ua.time_spent_seconds)::numeric, 0) as avg_time,
        90 as ideal_time
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.user_id IN (${allUserIds.map((_, i) => `$${i + 1}`).join(',')}) AND ua.time_spent_seconds > 0
       GROUP BY q.category
       ORDER BY avg_time DESC`,
      allUserIds
    );

    const timingByQuestionType = timingResult.rows.map(t => ({
      type: t.type,
      avgTime: parseInt(t.avg_time) || 0,
      idealTime: parseInt(t.ideal_time) || 90,
    }));

    // Timing correct vs incorrect
    const pacingResult = await pool.query(
      `SELECT 
        CASE WHEN ua.is_correct THEN 'Correct' ELSE 'Incorrect' END as category,
        ROUND(AVG(ua.time_spent_seconds)::numeric, 0) as avg_time,
        90 as benchmark_time
       FROM user_answers ua
       WHERE ua.user_id IN (${allUserIds.map((_, i) => `$${i + 1}`).join(',')}) AND ua.time_spent_seconds > 0
       GROUP BY CASE WHEN ua.is_correct THEN 'Correct' ELSE 'Incorrect' END`,
      allUserIds
    );

    const timingCorrectVsIncorrect = pacingResult.rows.map(t => ({
      category: t.category,
      avgTimeSpent: parseInt(t.avg_time) || 0,
      benchmarkTime: parseInt(t.benchmark_time) || 90,
    }));

    // Score recommendations
    const scoreRecommendations = [];
    if (topWeaknessAreas.length > 0) {
      scoreRecommendations.push(`Focus on improving ${topWeaknessAreas.map(a => a.name).join(', ')} — current accuracy is below 60%.`);
    }
    if (avgQuant < 160) {
      scoreRecommendations.push('Increase Quant practice — target 160+ by solving advanced Algebra and Geometry problems.');
    }
    if (avgVerbal < 160) {
      scoreRecommendations.push('Boost Verbal score — practice Reading Comprehension passages and vocabulary drills.');
    }
    if (timingByQuestionType.length > 0) {
      const slowTypes = timingByQuestionType.filter(t => t.avgTime > t.idealTime);
      if (slowTypes.length > 0) {
        scoreRecommendations.push(`Improve pacing on ${slowTypes.map(t => t.type).join(', ')} — spending more than ideal time per question.`);
      }
    }
    if (scoreRecommendations.length === 0) {
      scoreRecommendations.push('Continue consistent practice to maintain your strong performance across all topics.');
    }

    res.json({
      success: true,
      analytics: {
        total_tests: totalTests,
        average_score: avgScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
        average_score_percent: avgAccuracy,
        estimated_quant_score: avgQuant,
        estimated_verbal_score: avgVerbal,
        overall_gre_score: avgQuant + avgVerbal,
        scoreTrendData,
        timingByQuestionType,
        timingCorrectVsIncorrect,
        topStrengthAreas,
        topWeaknessAreas,
        scoreRecommendations,
        topic_performance: topicPerf.rows,
        strong_topics: topStrengthAreas.map(a => a.name),
        weak_topics: topWeaknessAreas.map(a => a.name),
        timing_analysis: {
          avg_time_per_question: timingByQuestionType.length > 0 ? Math.round(timingByQuestionType.reduce((s, t) => s + t.avgTime, 0) / timingByQuestionType.length) : 0,
          ideal_time_per_question: 90,
          time_efficiency: 0,
        },
        recent_improvement: totalTests > 1 ? (scoreTrendData[totalTests - 1].score - scoreTrendData[0].score) : 0,
      },
      data: {
        total_tests: totalTests,
        average_score: avgScore,
        highest_score: highestScore,
      },
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
