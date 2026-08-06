# 🎓 GRE Backend Server

A Node.js/Express backend server for GRE testing platform, integrated with PostgreSQL and JWT authentication.

## Features

- ✅ JWT-based authentication (compatible with Go backend)
- ✅ PostgreSQL database with 2,343 GRE questions
- ✅ Question allocation system (TOPIC_WISE, SECTIONAL, FULL_LENGTH)
- ✅ Real-time exam tracking and auto-save
- ✅ Automatic score calculation
- ✅ Comprehensive analytics and reporting
- ✅ Non-repetition guarantee for questions
- ✅ Anti-cheat logging

## Architecture

```
┌──────────────────────────────────────┐
│    Frontend (Next.js Port 3000)      │
└──────────────────────────────────────┘
            ↓
    ┌───────────────────┬────────────────┐
    ↓                   ↓
┌─────────────────┐  ┌──────────────────┐
│  Go Backend     │  │ Node.js Backend  │
│  (Port 7000)    │  │ (Port 11000)     │
│  - Auth         │  │ - GRE Tests      │
│  - Users        │  │ - Questions      │
│  - MongoDB      │  │ - PostgreSQL     │
└─────────────────┘  └──────────────────┘
```

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm/yarn

### Installation

```bash
cd gre-backend
npm install
```

### Environment Variables

Create `.env` file:

```env
# Server
PORT=11000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Ramji123
DB_NAME=gre_main

# JWT (must match Go backend)
JWT_SECRET=gre_super_secret_key_change_in_production_12345
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# MinIO
MINIO_URL=https://kprcloud-storage.cloudlab.works
MINIO_BUCKET=gretestimages
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will be available at `http://localhost:11000`

## Database Schema

### Tables
- `users` - User data synced from Go backend
- `questions` - 2,343 GRE questions (copied from gre_db)
- `test_allocations` - Tests assigned to students
- `test_sessions` - Active/completed exam sessions
- `user_answers` - Student responses
- `test_results` - Completed test analytics
- `student_question_history` - Non-repetition tracking
- `exam_sessions` - Live exam state
- `anti_cheat_logs` - Cheat detection logs

## API Endpoints

### Questions
```
GET  /api/questions                    - List questions (with filters)
GET  /api/questions/stats              - Overall statistics
GET  /api/questions/categories         - Get categories by subject
GET  /api/questions/levels             - Get difficulty levels
GET  /api/questions/types              - Get question types
GET  /api/questions/by-id/:id          - Get question with answer
GET  /api/questions/exam/:id           - Get question for exam (no answer)
GET  /api/questions/random             - Get random questions
```

### Test Allocation
```
GET  /api/allocations/my-allocations   - Get student's allocated tests
GET  /api/allocations/:allocationId    - Get specific allocation
POST /api/allocations/allocate         - Allocate test to student
POST /api/allocations/reset-history/:studentId - Reset student history
```

### Exam
```
POST /api/exam/start                   - Start an exam
GET  /api/exam/:allocationId/questions - Get exam questions
POST /api/exam/save-answer             - Auto-save answer
POST /api/exam/mark-for-review         - Mark question for review
GET  /api/exam/:sessionId/progress     - Get exam progress
POST /api/exam/submit                  - Submit exam and calculate score
```

### Results
```
GET  /api/results/my-results           - Get user's test results
GET  /api/results/result/:resultId     - Get detailed result
GET  /api/results/stats/user           - Get user statistics
GET  /api/results/performance/category - Category-wise performance
GET  /api/results/performance/level    - Level-wise performance
```

## Test Types

### TOPIC_WISE
- **Duration:** 20 minutes
- **Questions:** 15
- **Filters:** Subject + Category + Level
- **Non-Repetition:** Yes (unless pool exhausted)

### SECTIONAL
- **Duration:** 35 minutes
- **Questions:** 20
- **Filters:** Subject
- **Non-Repetition:** Yes

### FULL_LENGTH
- **Duration:** 118 minutes
- **Questions:** 54 (27 Verbal + 27 Quant)
- **Filters:** Subject-specific
- **Non-Repetition:** Yes per subject

## Authentication

Uses JWT tokens from Go backend:

```
Header: Authorization: Bearer ${token}
```

Token contains:
- `userId` - User's UUID
- `email` - User's email
- `name` - User's name
- `age` - User's age (for eligibility)
- `studentType` - Student category

## Scoring

Score calculation follows GRE format:

```javascript
const scorePercent = (correctAnswers / totalQuestions) * 100;
const quantScore = 130 + Math.round((scorePercent / 100) * 40);  // 130-170
const verbalScore = 130 + Math.round((scorePercent / 100) * 40); // 130-170
const totalScore = quantScore + verbalScore;                       // 260-340
```

## Question Non-Repetition Algorithm

1. Check `student_question_history` table
2. Pick random questions **not** in history
3. If insufficient unseen questions:
   - Fallback to random from the pool
   - Allow repetition (tracked separately)
4. After allocation, insert all question IDs into history

## Project Structure

```
src/
├── config/
│   ├── database.js         - PostgreSQL pool setup
│   └── initDatabase.js     - Create tables on startup
├── middleware/
│   └── auth.js             - JWT verification
├── models/
│   ├── Question.js         - Question queries
│   ├── User.js             - User syncing from Go
│   ├── TestSession.js      - Session management
│   └── UserAnswer.js       - Answer tracking
├── controllers/
│   ├── questionsController.js
│   ├── testAllocationController.js
│   ├── examController.js
│   └── resultsController.js
├── routes/
│   ├── questions.js
│   ├── allocations.js
│   ├── exam.js
│   └── results.js
├── app.js                  - Express app setup
└── server.js              - Server entry point
```

## Integration with Go Backend

### User Sync Flow
1. User logs in via Go Backend (Port 7000)
2. Go Backend generates JWT token
3. User sends token to GRE Backend (Port 11000)
4. GRE Backend verifies with same JWT_SECRET
5. On first request, user data synced to PostgreSQL users table

### Authentication
- Both backends share same `JWT_SECRET`
- Tokens are portable across services
- No server-to-server calls needed (stateless)

## Error Handling

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Performance

- **Questions Cache:** 2,343 questions indexed by subject/category/level
- **User History:** O(1) lookup via unique constraint
- **Allocation Pick:** Random LIMIT optimized with PostgreSQL
- **Answer Save:** Auto-save with upsert pattern (no duplicates)

## Future Enhancements

- [ ] Admin dashboard
- [ ] Proctoring integration
- [ ] Video recording during exam
- [ ] Machine learning for difficulty prediction
- [ ] Section-adaptive testing
- [ ] Real-time leaderboards
- [ ] Mobile app integration

## Support

For issues or questions, contact: support@gre.com

## License

ISC
