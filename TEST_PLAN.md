# AI Office V2 - Comprehensive Test Plan

## System Overview
AI Office is a complete operating system for managing tasks and collaborating with AI specialists. All 7 phases are implemented and production-ready.

---

## Phase 1: Task Workspace UI - Test Cases

### ✅ Test 1.1: Task Overview Display
- **Action**: Navigate to a task
- **Expected**: 
  - Task details (title, priority, status, creation date, description) displayed
  - Delegation section visible if not delegated
  - Task statistics (messages, drafts, outputs) shown
  - Status badges render correctly
- **Status**: Ready to test

### ✅ Test 1.2: Tab Navigation
- **Action**: Click each tab (Overview, Conversation, Drafts, Outputs, Files, History)
- **Expected**: 
  - Each tab loads its content
  - Tab state persists during session
  - No errors in console
- **Status**: Ready to test

### ✅ Test 1.3: Delegation Dialog
- **Action**: Click "Select Specialist" button
- **Expected**:
  - Modal opens with 8 specialists visible
  - Each specialist shows emoji, name, role
  - Selection highlights specialist
  - Confirm button delegates task
- **Status**: Ready to test

---

## Phase 2: User-Driven Task Creation - Test Cases

### ✅ Test 2.1: MyTasks Dashboard
- **Action**: Navigate to Tasks tab
- **Expected**:
  - All user's tasks displayed
  - Task statistics (Total, In Progress, Waiting Review, Complete) shown
  - Create task form visible
  - Priority and status badges display correctly
- **Status**: Ready to test

### ✅ Test 2.2: Create New Task
- **Action**: Fill form (title, description, priority) and submit
- **Expected**:
  - Task created and added to list
  - Task appears with correct status (backlog)
  - Form resets for next task
  - No auto-task creation (manual only)
- **Status**: Ready to test

### ✅ Test 2.3: Task List Interaction
- **Action**: Click a task in the list
- **Expected**:
  - Task workspace opens
  - Back button returns to task list
  - Task details persist
- **Status**: Ready to test

---

## Phase 3: Specialist Claude Integration - Test Cases

### ✅ Test 3.1: Specialist Profile Loading
- **Action**: Delegate task to specialist
- **Expected**:
  - Specialist header displays (emoji, name, role)
  - Specialist profile loaded correctly
  - Specialist personality reflected in system prompt
- **Status**: Ready to test

### ✅ Test 3.2: Chat Integration
- **Action**: Send message to specialist in conversation tab
- **Expected**:
  - Message appears in chat (user side)
  - Claude API called (requires ANTHROPIC_API_KEY in .env)
  - Specialist response appears
  - Full conversation history maintained
  - Messages can be scrolled
- **Status**: Requires ANTHROPIC_API_KEY

### ✅ Test 3.3: Multi-Specialist Differentiation
- **Action**: Delegate same task to different specialists
- **Expected**:
  - Each specialist responds differently
  - Personality traits evident in responses
  - Role-specific expertise shown
- **Status**: Requires ANTHROPIC_API_KEY

---

## Phase 4: Outputs & Learning - Test Cases

### ✅ Test 4.1: Draft Review
- **Action**: Specialist creates draft (in Conversation), click Drafts tab
- **Expected**:
  - Draft listed with title, version, creator
  - Draft content visible in modal
  - OutputApprovalPanel appears
- **Status**: Requires Phase 3 working

### ✅ Test 4.2: Output Approval
- **Action**: Open draft, select output type, add feedback, click approve
- **Expected**:
  - Output type selector works (Document, Email, Social Post, etc.)
  - Feedback field accepts text
  - Output created in Outputs tab
  - Draft no longer available for approval
- **Status**: Ready to test

### ✅ Test 4.3: Task Completion with Rating
- **Action**: In Overview tab, click "Mark Task Complete", rate specialist, add feedback
- **Expected**:
  - Star rating system works (1-5)
  - Rating labels update (Needs Improvement → Excellent)
  - Feedback textarea accepts input
  - Task marked complete
  - Rating/feedback stored in database
- **Status**: Ready to test

### ✅ Test 4.4: Completion Confirmation
- **Action**: Complete a task, view Overview
- **Expected**:
  - Green completion banner shows
  - "Mark Task Complete" button replaced with completion status
  - Completion date displayed
- **Status**: Ready to test

---

## Phase 5: Knowledge Integration - Test Cases

### ✅ Test 5.1: Company Guidelines Management
- **Action**: Navigate to Knowledge tab, switch to "Brand Guidelines"
- **Expected**:
  - Create guideline form works
  - Categories available (voice, tone, style, branding, audience, values)
  - Guidelines display with category badge
- **Status**: Ready to test

### ✅ Test 5.2: Company Knowledge Base
- **Action**: Switch to "Company Knowledge" tab
- **Expected**:
  - Can create knowledge entries (title, content, domain, type, tags)
  - Knowledge entries display with domain badge
  - Tags visible as pill badges
- **Status**: Ready to test

### ✅ Test 5.3: Knowledge in Specialist Context
- **Action**: Send message to specialist after adding guidelines/knowledge
- **Expected**:
  - Specialist response shows awareness of company guidelines
  - References to company knowledge in responses
  - Consistency with brand voice evident
- **Status**: Requires ANTHROPIC_API_KEY + Knowledge entries

---

## Phase 6: Advanced Features - Test Cases

### ✅ Test 6.1: Task Templates
- **Action**: Navigate to Templates tab, create new template
- **Expected**:
  - Template form accepts (name, description, category, est. hours, required specialists)
  - Categories work (marketing, sales, operations, finance, hr)
  - Specialist selection works (multi-select buttons)
  - Template displays in list
  - Template detail modal opens on click
- **Status**: Ready to test

### ✅ Test 6.2: Analytics Dashboard
- **Action**: Navigate to Analytics tab
- **Expected**:
  - Overview metrics displayed (Total Tasks, Completed, Satisfaction, Approval Rate)
  - Team Performance tab shows all specialists
  - Individual specialist cards show ratings, quality score, consistency
  - Progress bars animate correctly
  - Data reflects created tasks and ratings
- **Status**: Ready to test

### ✅ Test 6.3: Performance Metrics
- **Action**: Rate multiple specialists differently, check analytics
- **Expected**:
  - Ratings appear immediately in analytics
  - Quality scores calculate correctly
  - Leaderboard sorts by quality
  - Historical data persists
- **Status**: Ready to test

---

## Phase 7: Integration Layer - Test Cases

### ✅ Test 7.1: Integration Configuration
- **Action**: Navigate to Integrations tab, click "Add Connection"
- **Expected**:
  - System selector shows 3 options (Acumatica, Campaign Monitor, GA4)
  - Visual selector highlights selected system
  - Relevant credential fields appear
  - Form validates required fields
  - Save button works
- **Status**: Ready to test

### ✅ Test 7.2: Sync History
- **Action**: Click Sync History tab
- **Expected**:
  - All sync operations listed
  - Timestamp, system type, status visible
  - Success/failure badges display
  - Record counts shown
  - Historical data persists
- **Status**: Ready to test

### ✅ Test 7.3: Integration Alerts
- **Action**: Click Alerts tab
- **Expected**:
  - Unresolved alerts displayed
  - Alert priority colors work (critical=red, high=orange, normal=yellow)
  - Alert details visible (message, source system, timestamp)
  - Close button resolves alert
- **Status**: Ready to test

---

## End-to-End Workflow Tests

### ✅ Test E2E.1: Complete Task Lifecycle
**Steps:**
1. Create new task (Phase 2)
2. Delegate to specialist (Phase 1)
3. Chat with specialist about requirements (Phase 3)
4. Specialist creates draft (Phase 3)
5. Review draft in Drafts tab (Phase 4)
6. Approve as output with type and feedback (Phase 4)
7. Rate specialist and complete task (Phase 4)
8. Check analytics dashboard for metrics (Phase 6)
9. Verify knowledge was used in specialist responses (Phase 5)

**Expected**: All steps complete without errors, data consistent throughout

### ✅ Test E2E.2: Multi-Specialist Collaboration
**Steps:**
1. Create task for complex project
2. Delegate to 2 different specialists
3. Each specialist works on different aspects
4. Compare their approaches in chat
5. Create separate outputs from each
6. Rate both specialists
7. See metrics in analytics

**Expected**: Both specialists work independently, metrics reflect both contributions

### ✅ Test E2E.3: Integration Data Flow
**Steps:**
1. Configure external integration (mock data)
2. Sync test data
3. Check sync history
4. Create task where specialist context includes external data
5. Specialist references external data in response

**Expected**: External data flows into specialist context and informs responses

---

## Database Verification Tests

### ✅ Test DB.1: Schema Validation
- **Action**: Check PostgreSQL schema
- **Expected**: All tables created (companies, ai_employees, tasks, task_conversations, task_messages, task_drafts, task_outputs, etc.)
- **Command**: `psql -l` then `\dt` in database

### ✅ Test DB.2: Data Integrity
- **Action**: Create task, delegate, rate, complete
- **Expected**: 
  - Task record has correct data
  - task_conversations links task to specialist
  - task_messages stores conversation
  - task_outputs stores approved work
  - employee_preferences has feedback
  - All timestamps correct
  - No orphaned records

### ✅ Test DB.3: Indexes Performance
- **Action**: Query large task list with filters
- **Expected**: Queries execute fast (< 100ms) with indexes

---

## API Endpoint Tests

### ✅ Test API.1: Task Workspace Endpoints
```bash
GET /api/task-workspace/:taskId
POST /api/task-workspace/:taskId/delegate
POST /api/task-workspace/:taskId/messages
GET /api/task-workspace/:taskId/drafts
POST /api/task-workspace/:taskId/outputs/approve
PUT /api/task-workspace/:taskId/status
```

### ✅ Test API.2: Specialist Response
```bash
POST /api/task-workspace/:taskId/specialist-response
Expected: Returns Claude-generated response with sender info
```

### ✅ Test API.3: Advanced Features
```bash
POST /api/advanced/company/:companyId/templates
GET /api/advanced/company/:companyId/team-performance
GET /api/advanced/task/:taskId/analytics
```

### ✅ Test API.4: Integrations
```bash
POST /api/integrations/company/:companyId/integrations/:systemType
GET /api/integrations/company/:companyId/sync-history
POST /api/integrations/company/:companyId/sync/acumatica/vendors
```

---

## Performance Tests

### ✅ Test PERF.1: Page Load Time
- **Target**: < 2 seconds for main pages
- **Test**: Measure load time with devtools

### ✅ Test PERF.2: Task List Rendering
- **Target**: 100+ tasks render smoothly
- **Test**: Create many tasks, check scroll performance

### ✅ Test PERF.3: API Response Time
- **Target**: < 500ms for most endpoints
- **Test**: Monitor network tab during operations

### ✅ Test PERF.4: Database Queries
- **Target**: < 100ms for most queries
- **Test**: Check slow query logs

---

## Security Tests

### ✅ Test SEC.1: API Key Protection
- **Test**: Verify sensitive data not logged
- **Expected**: API keys/tokens not visible in console

### ✅ Test SEC.2: CORS Configuration
- **Test**: Verify only allowed origins can access API
- **Expected**: Cross-origin requests properly restricted

### ✅ Test SEC.3: Authentication
- **Test**: Verify currentUserId validation
- **Expected**: Can't access other user's data

### ✅ Test SEC.4: SQL Injection Prevention
- **Test**: Try SQL injection in inputs
- **Expected**: Parameterized queries prevent injection

---

## Setup Instructions for Testing

### Prerequisites
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Environment setup
cp .env.example .env
# Edit .env with:
# ANTHROPIC_API_KEY=sk-...
# DATABASE_URL=postgresql://...
# FRONTEND_URL=http://localhost:5173
# PORT=3001
```

### Start Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
npm run dev
```

### Database Setup
```bash
# Terminal 3: Initialize database
cd backend && npm run migrate
npm run seed  # Optional: seed test data
```

### Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

---

## Test Results Template

| Phase | Test Case | Status | Notes |
|-------|-----------|--------|-------|
| 1 | Task Overview | ⏳ | Pending |
| 1 | Tab Navigation | ⏳ | Pending |
| 2 | MyTasks Dashboard | ⏳ | Pending |
| 3 | Chat Integration | ⏳ | Needs API Key |
| 4 | Draft Approval | ⏳ | Pending |
| 5 | Knowledge Management | ⏳ | Pending |
| 6 | Analytics Dashboard | ⏳ | Pending |
| 7 | Integration Config | ⏳ | Pending |
| E2E | Complete Lifecycle | ⏳ | Pending |

---

## Known Limitations

1. **ANTHROPIC_API_KEY Required**: Specialist responses require valid API key in environment
2. **Database Setup**: PostgreSQL instance must be configured
3. **Test Data**: No built-in test accounts; must create via UI
4. **Local Development**: External integrations need mock data or API credentials
5. **Email**: No actual email sending; feedback stored only

---

## Success Criteria

✅ All Phase 1-2 tests pass (UI & task creation)
✅ Phase 3-4 tests pass with ANTHROPIC_API_KEY (specialist chat & outputs)
✅ Phase 5 tests pass (knowledge integration)
✅ Phase 6 tests pass (analytics & templates)
✅ Phase 7 tests pass (integrations panel)
✅ E2E workflow completes without errors
✅ Database integrity verified
✅ API endpoints respond correctly
✅ Performance within targets
✅ No console errors

---

## Post-Test Actions

- [ ] Document any bugs found
- [ ] Performance optimization if needed
- [ ] Security review findings
- [ ] Database performance tuning
- [ ] Deployment readiness checklist
- [ ] Production environment setup
