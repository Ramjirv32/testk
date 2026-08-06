const http = require('http');

const API_BASE = 'http://localhost:11000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running Complete GRE Backend Integration Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/health');
    assert(health.status === 200 && health.body.success, 'Backend Health Check');

    // 2. Auth - Student Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'ramjib2311@gmail.com',
      password: 'ramji123',
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'Student Login');
    const studentToken = loginRes.body.token;

    // Admin Login
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'itzrvm2337@gmail.com',
      password: 'admin123',
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.token, 'Admin Login');
    const adminToken = adminLoginRes.body.token;

    // 3. Question Bank CRUD Tests
    const newQuestionId = `TEST_Q_${Date.now()}`;
    const createQRes = await makeRequest('POST', '/api/questions', {
      id: newQuestionId,
      subject: 'Quant',
      category: 'Algebra',
      level: 'Medium',
      question_text: 'What is 5x + 3 = 18?',
      options: ['x = 3', 'x = 5', 'x = 2', 'x = 1'],
      answer: 'x = 3',
      explanation: '5x = 15 => x = 3',
    }, adminToken);
    assert(createQRes.status === 200 && createQRes.body.success, 'Create Question');

    const fetchQRes = await makeRequest('GET', `/api/questions/by-id/${newQuestionId}`, null, adminToken);
    assert(fetchQRes.status === 200 && fetchQRes.body.data.id === newQuestionId, 'Fetch Question by ID');

    const updateQRes = await makeRequest('PUT', `/api/questions/${newQuestionId}`, {
      level: 'Hard',
    }, adminToken);
    assert(updateQRes.status === 200 && updateQRes.body.data.level === 'Hard', 'Update Question');

    const bulkImportRes = await makeRequest('POST', '/api/questions/bulk-import', [
      {
        id: `BULK_Q_${Date.now()}_1`,
        subject: 'Verbal',
        category: 'Text Completion',
        level: 'Easy',
        question_text: 'She was ____ by the news.',
        options: ['happy', 'sad', 'astonished'],
        answer: 'astonished',
      }
    ], adminToken);
    assert(bulkImportRes.status === 200 && bulkImportRes.body.count >= 1, 'Bulk Import Questions');

    // 4. Student Request & Admin Allocation Tests
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    const pastDate = '2020-01-01';

    // Past date rejection test
    const pastDateRes = await makeRequest('POST', '/api/allocations/request', {
      testType: 'TOPIC_WISE',
      subject: 'Quant',
      category: 'Algebra',
      level: 'Medium',
      scheduled_date: pastDate,
    }, studentToken);
    assert(pastDateRes.status === 400, 'Reject Past Date Allocation');

    // Successful Topic-Wise Request
    const requestRes = await makeRequest('POST', '/api/allocations/request', {
      testType: 'TOPIC_WISE',
      subject: 'Quant',
      category: 'Algebra',
      level: 'Medium',
      scheduled_date: todayDate,
      scheduled_time: '00:00',
    }, studentToken);
    assert(requestRes.status === 200 && requestRes.body.success, 'Create Student Test Request');
    const allocationId = requestRes.body.allocation?.id || requestRes.body.data?.id;

    // Overlap Check Test - Same date duplicate
    const overlapRes = await makeRequest('POST', '/api/allocations/request', {
      testType: 'TOPIC_WISE',
      subject: 'Quant',
      category: 'Algebra',
      level: 'Medium',
      scheduled_date: todayDate,
      scheduled_time: '00:00',
    }, studentToken);
    assert(overlapRes.status === 409, 'Reject Duplicate Overlapping Test for Same Student');

    // Admin List Allocations
    const listAllocRes = await makeRequest('GET', '/api/allocations/all', null, adminToken);
    assert(listAllocRes.status === 200 && Array.isArray(listAllocRes.body.allocations || listAllocRes.body.data), 'Admin List Allocations');

    // Admin Approve Allocation
    const approveRes = await makeRequest('PATCH', `/api/allocations/${allocationId}/approve`, {}, adminToken);
    assert(approveRes.status === 200 && approveRes.body.success, 'Admin Approve Allocation');

    // 5. Exam Flow Tests
    const startExamRes = await makeRequest('POST', '/api/exam/start', {
      allocationId: allocationId,
    }, studentToken);
    assert(startExamRes.status === 200 && startExamRes.body.sessionId, 'Start Exam Session');
    const sessionId = startExamRes.body.sessionId;
    const questions = startExamRes.body.questions || [];

    if (questions.length > 0) {
      const qId = questions[0].id;
      const saveAnsRes = await makeRequest('POST', '/api/exam/save-answer', {
        sessionId,
        allocationId,
        questionId: qId,
        selectedAnswer: questions[0].options ? questions[0].options[0] : 'x = 3',
      }, studentToken);
      assert(saveAnsRes.status === 200 && saveAnsRes.body.success, 'Save Answer');

      const markReviewRes = await makeRequest('POST', '/api/exam/mark-for-review', {
        sessionId,
        questionId: qId,
        marked: true,
      }, studentToken);
      assert(markReviewRes.status === 200 && markReviewRes.body.success, 'Mark for Review');
    }

    // Submit Exam
    const submitRes = await makeRequest('POST', '/api/exam/submit', {
      allocationId,
      sessionId,
    }, studentToken);
    assert(submitRes.status === 200 && submitRes.body.success, `Submit Exam Session (Status: ${submitRes.status}, Error: ${JSON.stringify(submitRes.body)})`);

    // Verify Results
    const resultsRes = await makeRequest('GET', '/api/results/my-results', null, studentToken);
    assert(resultsRes.status === 200 && Array.isArray(resultsRes.body.results || resultsRes.body.data), 'Fetch Student Results');

    // Clean up created test question
    const deleteQRes = await makeRequest('DELETE', `/api/questions/${newQuestionId}`, null, adminToken);
    assert(deleteQRes.status === 200 && deleteQRes.body.success, 'Delete Question');

    console.log(`\n==========================================`);
    console.log(`📊 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
