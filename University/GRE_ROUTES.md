# GRE Frontend Routes Documentation

## Student Dashboard Routes

### GRE Tests Overview
**Route:** `/user-dashboard/gre-tests`  
**Component:** `app/user-dashboard/gre-tests/page.tsx`  
**Description:** Main GRE dashboard showing available tests, scheduled tests, and test history  
**Features:**
- View all scheduled tests
- View test history with scores
- Filter by available and completed tests
- Quick links to schedule and take tests

### GRE Test Scheduling
**Route:** `/user-dashboard/gre-schedule`  
**Component:** `app/user-dashboard/gre-schedule/page.tsx`  
**Description:** Schedule a new GRE test with calendar and time slot selection  
**Features:**
- Calendar picker for selecting test date (next 90 days)
- 3 test types: Full Length, Sectional, Topic Wise
- Time slot selection (pre-allocated slots)
- Multiple students can choose same time slot
- Confirmation before scheduling

### GRE Exam Interface
**Route:** `/user-dashboard/gre-exam?allocation_id={id}`  
**Component:** `app/user-dashboard/gre-exam/page.tsx`  
**Description:** Live exam interface for taking GRE tests  
**Features:**
- Multi-section test with separate timers
- 118-minute full test or section-specific durations
- Question navigator (left sidebar)
- Auto-save on each answer
- Mark for review functionality
- Color-coded question status:
  - Green: Answered
  - Yellow: Marked for review
  - White: Not answered
- Section completion with "End Section & Next" button
- Exit exam confirmation modal
- Real-time countdown timer

### GRE Results Page
**Route:** `/user-dashboard/gre-result?allocation_id={id}`  
**Component:** `app/user-dashboard/gre-result/page.tsx`  
**Description:** View detailed test results and performance breakdown  
**Features:**
- Final score display (260-340 range)
- Percentile ranking
- Accuracy percentage
- Question breakdown (correct/incorrect)
- Time spent analysis
- Option to take another test or return to dashboard

---

## Admin Panel Routes

### GRE Management Dashboard
**Route:** `/admin/gre`  
**Component:** `app/admin/gre/page.tsx`  
**Description:** Admin panel for managing GRE test allocations and scheduling  
**Features:**
- Statistics cards (Pending, Scheduled, Completed)
- Tab navigation for filtering allocations
- List of all student allocations
- Status tracking (ASSIGNED, IN_PROGRESS, COMPLETED)
- Modal to allocate new tests
- Test type selection for allocation
- Student search/selection

### Admin Allocation Modal
- Select student by email
- Choose test type:
  - Full Length (54 questions, 118 minutes)
  - Sectional (20 questions, 35 minutes)
  - Topic Wise (15 questions, 20 minutes)
- Auto-allocate or manual selection
- Confirmation and success notification

---

## API Integration Points

### Questions API
```
GET /api/questions?subject=Verbal&category=Reading&level=Medium&page=0&limit=20
GET /api/questions/stats
GET /api/questions/categories?subject=Verbal
GET /api/questions/levels
GET /api/questions/random?subject=Quant&count=10
```

### Test Allocation API
```
POST /api/allocations/allocate
GET /api/allocations/my-allocations
GET /api/allocations/:allocationId
POST /api/allocations/schedule
```

### Exam API
```
POST /api/exam/start
GET /api/exam/:allocationId/questions
POST /api/exam/save-answer
POST /api/exam/mark-for-review
GET /api/exam/:sessionId/progress
POST /api/exam/submit
```

### Results API
```
GET /api/results/my-results
GET /api/results/result/:resultId
GET /api/results/stats/user
GET /api/results/performance/category
GET /api/results/performance/level
```

### Admin API
```
GET /api/admin/allocations?status=pending
POST /api/allocations/allocate
GET /api/admin/gre-stats
```

---

## Navigation Implementation

### Adding GRE to Dashboard Navigation

1. **Import GREDashboardSection component:**
   ```tsx
   import GREDashboardSection from '@/components/GREDashboardSection';
   ```

2. **Add to dashboard page:**
   ```tsx
   <GREDashboardSection 
     stats={{
       testsScheduled: 2,
       testsCompleted: 1,
       averageScore: 310
     }}
   />
   ```

### Adding GRE to Admin Navigation

1. **Add GRE link to admin sidebar:**
   ```tsx
   <Link href="/admin/gre">
     <BookOpenIcon /> GRE Tests
   </Link>
   ```

2. **Style similar to other test management pages (MBTI, Cognitive, etc.)**

---

## Test Flow Diagram

```
Student Dashboard
    ↓
User clicks "GRE Tests" or "Schedule New Test"
    ↓
/user-dashboard/gre-tests (Overview)
    ├─ View Scheduled Tests
    ├─ View Test History
    └─ Click "Schedule New Test"
        ↓
    /user-dashboard/gre-schedule (Scheduling)
        ├─ Select Test Type (Full/Sectional/Topic)
        ├─ Select Date from Calendar
        ├─ Select Time Slot
        └─ Click "Schedule Test"
            ↓
        Allocation Created
            ↓
    /user-dashboard/gre-tests (Back to Overview)
        └─ Click "Start Test"
            ↓
    /user-dashboard/gre-exam (Exam)
        ├─ Answer Questions
        ├─ Mark for Review
        ├─ Navigate with Sidebar
        └─ Click "Submit Exam"
            ↓
    /user-dashboard/gre-result (Results)
        ├─ View Score
        ├─ View Percentile
        ├─ View Performance
        └─ "Take Another Test" or Back to Dashboard
```

---

## Styling Consistency

### Color Scheme (TRU Theme)
- Primary: `#e61a8d` (Magenta) - Actions, highlights
- Background: `#faf4ec` (Beige) - Page background
- Text Dark: `#2d2d2d` - Headings, main text
- Text Light: `#5a5a5a` - Secondary text
- Border: `#ede9e4` - Dividers, borders
- Success: `#10b981` (Green) - Positive feedback
- Warning: `#f59e0b` (Amber) - Warnings
- Info: `#0d6efd` (Blue) - Information

### Component Styling
- Card: `backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'`
- Button: `backgroundColor: '#e61a8d', color: 'white', borderRadius: '6px'`
- Input: `border: '1px solid #ede9e4', borderRadius: '6px'`

---

## Integration Checklist

- [x] GRE Schedule Page (calendar + time slots)
- [x] GRE Exam Interface (multi-section, timer, auto-save)
- [x] GRE Results Page (score breakdown)
- [x] GRE Tests Overview (dashboard)
- [x] Admin GRE Panel (allocations management)
- [x] GRE Dashboard Component
- [ ] Update main dashboard with GRE section
- [ ] Update admin sidebar with GRE link
- [ ] Add GRE navigation to header
- [ ] Test all routes end-to-end
- [ ] Verify API integration
- [ ] Performance optimization

---

## File Structure

```
app/
├── user-dashboard/
│   ├── gre-schedule/page.tsx      ✓ Created
│   ├── gre-exam/page.tsx          ✓ Created
│   ├── gre-result/page.tsx        ✓ Created
│   └── gre-tests/page.tsx         ✓ Created
├── admin/
│   └── gre/page.tsx               ✓ Created
components/
└── GREDashboardSection.tsx        ✓ Created
```

---

## Notes

- Time slots are pre-allocated (9am-11:18, 12pm-2:18, 3pm-5:18)
- Multiple students can book same time slot
- Non-repetition guaranteed by `student_question_history` table
- Auto-save happens every answer
- Exam can be exited anytime (will submit current progress)
- Scores calculated automatically on submit
- Results viewable immediately after completion
