# GRE Platform — Database Schema & Data Reference

> **Database:** `gre_main` (PostgreSQL) | **Backend:** `http://localhost:11000`  
> **Total Questions:** 2,354 | **Active Tables:** 11

---

## Table of Contents

1. [questions](#1-questions)
2. [users](#2-users)
3. [test_allocations](#3-test_allocations)
4. [exam_sessions](#4-exam_sessions)
5. [user_answers](#5-user_answers)
6. [test_results](#6-test_results)
7. [test_sessions](#7-test_sessions)
8. [anti_cheat_logs](#8-anti_cheat_logs)
9. [gre_tickets](#9-gre_tickets)
10. [ticket_chat_messages](#10-ticket_chat_messages)
11. [student_question_history](#11-student_question_history)
12. [How a Full-Length GRE Test Flows](#how-a-full-length-gre-test-flows)
13. [Image Serving Architecture](#image-serving-architecture)
14. [Known Data Quality Issues](#known-data-quality-issues)

---

## 1. questions

**Purpose:** Stores all 2,354 GRE practice questions. Core content table — never truncated.

### Schema

| Column               | Type      | Nullable | Default             | Description |
|----------------------|-----------|----------|---------------------|-------------|
| `id`                 | VARCHAR   | NO       | —                   | Custom string ID e.g. `QUANT_0051`, `VERBAL_0211`, `XL_ZQ8BYC` |
| `subject`            | TEXT      | YES      | —                   | `"Quant"` or `"Verbal"` |
| `category`           | TEXT      | YES      | —                   | Topic group (see below) |
| `level`              | TEXT      | YES      | —                   | `"Easy"`, `"Medium"`, `"Hard"` |
| `question_type`      | TEXT      | YES      | —                   | `"MCQ"`, `"Text Completion / SE / RC"`, `"MULTIPLE_CHOICE_SINGLE"`, `"FILL IN THE BLANKS"` |
| `question_text`      | TEXT      | YES      | —                   | Full question text (may have `\n` line breaks) |
| `options`            | JSONB     | YES      | —                   | JSON array e.g. `["A choice", "B choice", "C choice"]` |
| `answer`             | TEXT      | YES      | —                   | Correct answer — letter `"A"`, index `"0"`, or full option text |
| `explanation`        | TEXT      | YES      | —                   | Step-by-step solution |
| `question_image_url` | TEXT      | YES      | —                   | Cloud URL to question diagram image |
| `answer_image_url`   | TEXT      | YES      | —                   | Cloud URL to answer/explanation image |
| `source_file`        | TEXT      | YES      | —                   | Original import source filename |
| `created_at`         | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` | Import timestamp |

> **Note:** The `questions` table does NOT have a `passage` column. Reading comprehension passages are embedded inside `question_text`.

### Question Counts by Subject

| Subject  | Count | With Question Image | With Answer Image |
|----------|-------|---------------------|-------------------|
| Quant    | 971   | 307 (total across both subjects) | 83 total |
| Verbal   | 1,383 | — | — |
| **Total**| **2,354** | **307** | **83** |

### Quant Categories (top)

| Category | Count |
|----------|-------|
| 3D_Co-ordinate Geometry | 99 |
| DATA INTERPRETATION | 72 |
| 2D Geometry | 61 |
| Average | 58 |
| Numbers and Number Properties | 50 |
| Fraction & Decimals | 42 |
| Triangles | 38 |
| Circle | 33 |
| Powers and roots | 28 |
| Quadratic Equations | 25 |
| Probability | 25 |
| Percentage | 24 |

### Verbal Categories (top)

| Category | Count |
|----------|-------|
| Verbal New Format-2 (189 Qs) | 499 |
| Verbal New Format-1 (300 Qs) | 300 |
| GRE VERBAL MATERIAL | 110 |
| TEXT COMPLETION HARD | 92 |
| GRE TEXT COMPLETION MEDIUM | 61 |
| EASY 50 / Medium 50 | 100 |
| AWA / AWA ISSUE | 22 |

### Sample: Quant with Image

```json
{
  "id": "QUANT_1217",
  "subject": "Quant",
  "category": "Circle",
  "level": "Medium",
  "question_type": "MCQ",
  "question_text": "Line segments UV, WX, and YZ are diameters of the circles with centers A, B, and C, respectively. If YZ = 2, then what is the area of the shaded region?",
  "options": ["4π", "8π", "9π", "16π", "64π"],
  "answer": "D",
  "explanation": "All diameters in a circle are of equal length...",
  "question_image_url": "https://kprcloud-storage.cloudlab.works/gretestimages/Circle Q21.jpg",
  "answer_image_url": null
}
```

### Sample: Verbal Text-Only

```json
{
  "id": "XL_ZQ8BYC",
  "subject": "Verbal",
  "category": "Reading Comprehension",
  "level": "Medium",
  "question_type": "MULTIPLE_CHOICE_SINGLE",
  "question_text": "The primary purpose of the passage is to demonstrate how ecological biodiversity stabilizes marine ecosystems.",
  "options": [
    "Option A: To refute an economic hypothesis",
    "Option B: To examine ecological consequences of biodiversity",
    "Option C: To criticize industrial fisheries",
    "Option D: To argue for deep-sea exploration"
  ],
  "answer": "Option B: To examine ecological consequences of biodiversity",
  "question_image_url": null,
  "answer_image_url": null
}
```

### Sample: AWA Essay Question

```json
{
  "id": "VERBAL_0211",
  "subject": "Verbal",
  "category": "AWA  ISSUE",
  "question_type": "Text Completion / SE / RC",
  "question_text": "Our greatest fear should not be of failure ... but of succeeding at things in life that don't really matter",
  "options": null,
  "answer": "A",
  "question_image_url": null,
  "answer_image_url": null
}
```
> AWA questions have no options. The `AWAEssayEditor` component renders a full essay editor instead of option buttons.

---

## 2. users

**Purpose:** All registered accounts — students and admins.

### Schema

| Column          | Type      | Nullable | Default             | Description |
|-----------------|-----------|----------|---------------------|-------------|
| `id`            | VARCHAR   | NO       | `gen_random_uuid()` | UUID or custom string like `"student-1"` |
| `email`         | VARCHAR   | NO       | —                   | Unique login email |
| `password_hash` | VARCHAR   | YES      | —                   | bcrypt hash |
| `name`          | VARCHAR   | YES      | —                   | Display name |
| `age`           | INTEGER   | YES      | —                   | Student age |
| `student_type`  | VARCHAR   | YES      | —                   | e.g. `"undergraduate"` |
| `role`          | VARCHAR   | YES      | `'STUDENT'`         | `"STUDENT"` or `"ADMIN"` |
| `created_at`    | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` | Registration time |
| `updated_at`    | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` | Last update |

### Current Users in DB

| id | email | name | role |
|----|-------|------|------|
| `student-1` | ramjib2311@gmail.com | ramjib2311 | STUDENT |
| `admin-1` | itzrvm2337@gmail.com | itzrvm2337 | ADMIN |
| `user-1785948398441` | student@gre.com | student | STUDENT |
| `user-1785952396692` | admin@gre.com | admin | STUDENT ⚠️ |

---

## 3. test_allocations

**Purpose:** Each row = one test assigned to a student. Controls what test the student can take and when.

### Schema

| Column                 | Type      | Nullable | Default      | Description |
|------------------------|-----------|----------|--------------|-------------|
| `id`                   | UUID      | NO       | `gen_random_uuid()` | Allocation ID |
| `student_id`           | VARCHAR   | NO       | —            | User ID **or** email string (inconsistent) |
| `allocated_by`         | VARCHAR   | YES      | —            | Admin email who created it |
| `test_type`            | VARCHAR   | YES      | —            | `FULL_LENGTH`, `SECTIONAL`, `TOPIC_WISE` |
| `test_title`           | VARCHAR   | YES      | —            | e.g. `"Full Length GRE Test"` |
| `question_ids`         | TEXT      | YES      | —            | JSON array of question ID strings |
| `subject`              | VARCHAR   | YES      | —            | `Quant`, `Verbal` — for TOPIC_WISE |
| `category`             | VARCHAR   | YES      | —            | Topic for TOPIC_WISE |
| `level`                | VARCHAR   | YES      | —            | Difficulty for TOPIC_WISE |
| `status`               | VARCHAR   | YES      | `'ASSIGNED'` | See status table below |
| `duration_minutes`     | INTEGER   | YES      | `60`         | Total allowed minutes |
| `question_count`       | INTEGER   | YES      | —            | # of questions |
| `scheduled_at`         | TIMESTAMP | YES      | —            | Legacy datetime field |
| `scheduled_date`       | VARCHAR   | YES      | —            | `"2026-08-06"` |
| `scheduled_start_time` | VARCHAR   | YES      | —            | `"10:15"` (24h format) |
| `scheduled_end_time`   | VARCHAR   | YES      | —            | End time string |
| `expires_at`           | TIMESTAMP | YES      | —            | Hard cutoff — test locked after this |
| `started_at`           | TIMESTAMP | YES      | —            | When student first started |
| `submitted_at`         | TIMESTAMP | YES      | —            | When submitted |
| `score_percent`        | NUMERIC   | YES      | —            | Final score % |
| `request_notes`        | TEXT      | YES      | —            | Student's request message |
| `admin_notes`          | TEXT      | YES      | —            | Admin comments |
| `cancellation_reason`  | TEXT      | YES      | —            | Why cancelled |
| `rejection_reason`     | TEXT      | YES      | —            | Why rejected |
| `ticket_id`            | VARCHAR   | YES      | —            | Linked support ticket |
| `created_at`           | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` | Created time |
| `updated_at`           | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` | Last change |

### Status Values

| Status | Meaning |
|--------|---------|
| `ASSIGNED` | Allocated, student hasn't started |
| `SCHEDULED` | Has a specific future start window |
| `IN_PROGRESS` | Student started, not submitted yet |
| `COMPLETED` | Submitted and scored |
| `EXPIRED` | `expires_at < NOW()` with no submission |
| `CANCELLED` | Cancelled |
| `REJECTED` | Admin rejected request |

---

## 4. exam_sessions

**Purpose:** Active exam attempt tracking. One row per exam sitting.

### Schema

| Column            | Type      | Nullable | Description |
|-------------------|-----------|----------|-------------|
| `id`              | UUID      | NO       | Session ID (used in `user_answers.session_id`) |
| `allocation_id`   | UUID      | YES      | FK → test_allocations.id |
| `user_id`         | VARCHAR   | YES      | FK → users.id |
| `started_at`      | TIMESTAMP | YES      | Exam start |
| `submitted_at`    | TIMESTAMP | YES      | Exam submission |
| `current_section` | INTEGER   | YES      | Section student is on (1–5) |
| `section_1_score` | NUMERIC   | YES      | AWA score |
| `section_2_score` | NUMERIC   | YES      | Verbal 1 score |
| `status`          | VARCHAR   | YES      | `"ACTIVE"`, `"SUBMITTED"`, `"TERMINATED"` |
| `created_at`      | TIMESTAMP | YES      | Row creation |

---

## 5. user_answers

**Purpose:** Every answer a student selects during an exam. One row per question per session.

### Schema

| Column               | Type      | Nullable | Default             | Description |
|----------------------|-----------|----------|---------------------|-------------|
| `id`                 | UUID      | NO       | `gen_random_uuid()` | Row ID |
| `session_id`         | UUID      | NO       | —                   | FK → exam_sessions.id |
| `user_id`            | VARCHAR   | NO       | —                   | FK → users.id |
| `question_id`        | VARCHAR   | NO       | —                   | FK → questions.id |
| `selected_answer`    | VARCHAR   | YES      | —                   | Student's chosen answer |
| `is_correct`         | BOOLEAN   | YES      | `false`             | Graded correct/wrong |
| `time_spent_seconds` | INTEGER   | YES      | `0`                 | Time on this question |
| `marked_for_review`  | BOOLEAN   | YES      | `false`             | Review flag |
| `created_at`         | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` | When answered |

---

## 6. test_results

**Purpose:** Final graded results after exam submission.

### Schema

| Column               | Type      | Nullable | Description |
|----------------------|-----------|----------|-------------|
| `id`                 | UUID      | NO       | Result ID |
| `user_id`            | VARCHAR   | NO       | FK → users.id |
| `session_id`         | UUID      | YES      | FK → exam_sessions.id |
| `allocation_id`      | UUID      | YES      | FK → test_allocations.id |
| `test_type`          | VARCHAR   | YES      | `FULL_LENGTH`, `SECTIONAL`, `TOPIC_WISE` |
| `subject`            | VARCHAR   | YES      | `Quant` or `Verbal` |
| `category`           | VARCHAR   | YES      | Topic category |
| `level`              | VARCHAR   | YES      | Difficulty |
| `total_questions`    | INTEGER   | YES      | Questions in test |
| `correct_answers`    | INTEGER   | YES      | Number correct |
| `score`              | NUMERIC   | YES      | Percentage score |
| `percentile`         | NUMERIC   | YES      | Percentile rank |
| `time_taken_seconds` | INTEGER   | YES      | Total exam time used |
| `quant_score`        | INTEGER   | YES      | Quant section score |
| `verbal_score`       | INTEGER   | YES      | Verbal section score |
| `total_score`        | INTEGER   | YES      | Combined scaled score |
| `created_at`         | TIMESTAMP | YES      | Result stored time |

---

## 7. test_sessions

**Purpose:** Legacy/practice session tracking (simpler than exam_sessions).

### Schema

| Column               | Type      | Nullable | Default      |
|----------------------|-----------|----------|--------------|
| `id`                 | UUID      | NO       | `gen_random_uuid()` |
| `user_id`            | VARCHAR   | NO       | — |
| `subject`            | VARCHAR   | YES      | — |
| `test_type`          | VARCHAR   | YES      | `'PRACTICE'` |
| `total_questions`    | INTEGER   | YES      | `10` |
| `time_limit_minutes` | INTEGER   | YES      | `60` |
| `started_at`         | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` |
| `submitted_at`       | TIMESTAMP | YES      | — |
| `score`              | NUMERIC   | YES      | — |
| `percentile`         | NUMERIC   | YES      | — |
| `created_at`         | TIMESTAMP | YES      | `CURRENT_TIMESTAMP` |

---

## 8. anti_cheat_logs

**Purpose:** Proctoring violation events during exams (fullscreen exit, tab switch, copy).

### Schema

| Column           | Type      | Nullable | Description |
|------------------|-----------|----------|-------------|
| `id`             | UUID      | NO       | Log ID |
| `exam_session_id`| VARCHAR   | YES      | FK → exam_sessions.id (**NOT `allocation_id`**) |
| `user_id`        | VARCHAR   | YES      | FK → users.id |
| `event_type`     | VARCHAR   | YES      | `FULLSCREEN_EXIT`, `TAB_SWITCH`, `COPY_ATTEMPT` |
| `description`    | TEXT      | YES      | Description text |
| `severity`       | VARCHAR   | YES      | `"low"`, `"medium"`, `"high"` |
| `created_at`     | TIMESTAMP | YES      | When violation occurred |

---

## 9. gre_tickets

**Purpose:** Student support tickets during/after exams.

| Column           | Type    | Description |
|------------------|---------|-------------|
| `id`             | VARCHAR | Ticket ID |
| `student_id`     | VARCHAR | FK → users.id |
| `allocation_id`  | VARCHAR | FK → test_allocations.id |
| `subject`        | VARCHAR | Ticket subject |
| `description`    | TEXT    | Issue description |
| `status`         | VARCHAR | `"OPEN"`, `"IN_PROGRESS"`, `"RESOLVED"`, `"CLOSED"` |
| `priority`       | VARCHAR | `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"URGENT"` |
| `created_at`     | TIMESTAMP | Created time |
| `resolved_at`    | TIMESTAMP | Resolution time |

---

## 10. ticket_chat_messages

**Purpose:** Chat messages within a ticket thread.

| Column            | Type    | Description |
|-------------------|---------|-------------|
| `id`              | UUID    | Message ID |
| `ticket_id`       | VARCHAR | FK → gre_tickets.id |
| `sender_id`       | VARCHAR | FK → users.id |
| `sender_role`     | VARCHAR | `"STUDENT"` or `"ADMIN"` |
| `sender_name`     | VARCHAR | Display name |
| `message_text`    | TEXT    | Message content |
| `attachment_url`  | TEXT    | Optional file URL |
| `attachment_type` | VARCHAR | `"image"`, `"pdf"`, etc. |
| `is_read`         | BOOLEAN | Read receipt |
| `created_at`      | TIMESTAMP | Send time |

---

## 11. student_question_history

**Purpose:** Prevents duplicate questions in adaptive testing — tracks which questions a student has seen.

> Typical columns: `student_id`, `question_id`, `seen_at`

---

## How a Full-Length GRE Test Flows

```
ADMIN                          DATABASE                       STUDENT
  │                               │                               │
  ├─ Direct Allocate Test ───────►│ INSERT test_allocations       │
  │  {student_id, FULL_LENGTH,    │ status='ASSIGNED'             │
  │   question_ids=[55 IDs],      │ question_ids='[...]'         │
  │   scheduled_date, expires_at} │ expires_at='2026-08-06 12:00'│
  │                               │                               │
  │                               │◄── GET /my-allocations ───────┤
  │                               │    returns allocation list    │
  │                               │    with status + window       │
  │                               │                               │
  │                               │◄── POST /exam/start ──────────┤
  │                               │    {allocation_id}            │
  │                               │                               │
  │                               ├─ INSERT exam_sessions         │
  │                               │  status='ACTIVE'              │
  │                               │                               │
  │                               ├─ UPDATE test_allocations      │
  │                               │  status='IN_PROGRESS'         │
  │                               │  started_at=NOW()             │
  │                               │                               │
  │                               ├─ Returns 55 questions ───────►│
  │                               │  (AWA:1, V1:12, V2:15,       │
  │                               │   Q1:12, Q2:15)              │
  │                               │                               │
  │                        [Student takes exam — 118 min]        │
  │                               │                               │
  │                               │◄── POST /exam/autosave ───────┤
  │                               │    {session_id, answers{}}    │
  │                               │                               │
  │                               │◄── POST /exam/submit ─────────┤
  │                               │    {session_id, all_answers}  │
  │                               │                               │
  │                               ├─ INSERT user_answers (55 rows)│
  │                               ├─ INSERT test_results (1 row)  │
  │                               ├─ UPDATE test_allocations      │
  │                               │  status='COMPLETED'           │
  │                               │  submitted_at=NOW()           │
  │                               │  score_percent=72.5           │
  │                               │                               │
  │◄── Admin views score ─────────┤                               │
```

### Full-Length Test Section Breakdown

| # | Section | Questions | Time (min) |
|---|---------|-----------|------------|
| 1 | AWA — Analytical Writing (Issue Essay) | 1 essay | 30 |
| 2 | Verbal Reasoning 1 | 12 Qs | 18 |
| 3 | Verbal Reasoning 2 | 15 Qs | 23 |
| 4 | Quantitative Reasoning 1 | 12 Qs | 21 |
| 5 | Quantitative Reasoning 2 | 15 Qs | 26 |
| **Total** | | **55** | **118** |

---

## Image Serving Architecture

### The Problem
`question_image_url` in the DB contains Cloud Storage URLs like:
```
https://kprcloud-storage.cloudlab.works/gretestimages/Circle Q21.jpg
```
These return **HTTP 403** (private bucket) and have **unencoded spaces** that break browsers.

### The Fix
`gre-backend` serves images locally from the 198 static image files:

```javascript
// gre-backend/src/app.js
app.use('/images', express.static(
  path.join(__dirname, '../../original/gre-frontend/public/images')
));
// Result: GET http://localhost:11000/images/Circle%20Q21.jpg → HTTP 200 ✅
```

### Frontend Helper

```typescript
// gre-exam/page.tsx & gre-question-bank/page.tsx
const getFormattedImgUrl = (rawUrl?: string | null): string => {
  if (!rawUrl) return '';
  // Extract just the filename from the full URL
  let filename = rawUrl.includes('/') ? rawUrl.split('/').pop()! : rawUrl;
  try { filename = decodeURIComponent(filename); } catch {}
  // Re-encode for the local server
  return `${GRE_API_URL}/images/${encodeURIComponent(filename)}`;
};

// Usage:
<img src={getFormattedImgUrl(question.question_image_url)} />
// → http://localhost:11000/images/Circle%20Q21.jpg ✅
```

---

## Known Data Quality Issues

| # | Issue | Table | Fix Needed |
|---|-------|-------|------------|
| 1 | Mixed `answer` formats | `questions` | Some use `"A"`, some `"0"`, some full text — frontend must handle all |
| 2 | Mixed `question_type` casing | `questions` | `"MCQ"`, `"mcq"`, `"Fill in the Blank"`, `"FILL UP"` — not normalized |
| 3 | `category` field corrupted | `questions` | Some rows have actual answer values stored in `category` (import bug) |
| 4 | `student_id` format | `test_allocations` | Sometimes UUID (`student-1`), sometimes email string — JOIN must handle both |
| 5 | `admin@gre.com` wrong role | `users` | Has `role='STUDENT'` — should be `'ADMIN'` |
| 6 | Expired status not enforced | `test_allocations` | Backend returns `IN_PROGRESS` after `expires_at` — must check at query time |
| 7 | `admin_audit_logs` missing | — | Table doesn't exist — `getAuditTrail()` must return `{logs:[]}` gracefully |
| 8 | `anti_cheat_logs.allocation_id` | `anti_cheat_logs` | Column doesn't exist — correct column is `exam_session_id` |
