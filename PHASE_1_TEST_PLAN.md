# MTech AI Office — Phase 1 Test Plan

**Phase 1 Goal:** A working daily operating system where Emilee opens AI Office every morning, sees Sandy's briefing, knows exactly what to do, and can manage her real workload.

**Definition of Done:** Emilee can see her daily workflow orchestrated by Sandy, with clear visibility of tasks, blockers, and priorities.

---

## Navigation Structure

### Left Sidebar (Icon-only)
```
[AI Logo]
🏠 Home
📁 Projects
✅ Tasks
📢 Campaigns
🗂️ Board Room
🧠 Knowledge
⚙️ Settings
```

### Top Navigation Tabs
- Today's Work
- Projects
- Tasks
- Campaigns
- Board Room
- Knowledge
- Settings

**Test:** Navigate through all tabs. Each should render without errors.

---

## Phase 1 Core Features

### ✅ Test 1: Home Screen - Today's Work

**This is the centerpiece of Phase 1.**

**Action:** Navigate to Home tab (default landing)

**Expected Layout:**
- Greeting: "Good morning, Emilee." with current date and day
- Sandy panel with morning briefing:
  - Sandy avatar (🤖)
  - Role: "Chief of Staff"
  - Morning summary with 2-4 bullet points:
    * "✓ 2 approvals waiting"
    * "✓ 1 deadline today"
    * "✓ 3 tasks in progress across the team"
  - Input field: "Ask Sandy anything..."
  - "Full Briefing" button

- Today's Focus section (3-column layout):
  * Red border task: "Sateen Email" (Waiting for John)
  * Orange border task: "Website Refresh" (In Progress)
  * Amber border task: "PPC Campaign" (Due today)

- Waiting for Approval section:
  * "Sateen email" — Waiting for John
  * "IRCL stickers" — Waiting for John
  * (Waiting for John must be visually prominent)

- Team Status section:
  * Email Manager 🟢 In Progress: "Account Manager emails"
  * Website Manager 🟢 In Progress: "Radio Systems page"
  * SEO Manager ⚫ Available

**Status:** Ready to test

---

### ✅ Test 2: Sandy as Central Orchestrator

**Action:** Check Sandy's presence and interactions

**Expected:**
- Sandy panel appears on every screen (persists across navigation)
- Input field always available to "Ask Sandy anything..."
- Sandy's response format is clear and actionable
- Sandy shows which employee handles what
- Responses reference expected outputs

**Status:** Ready to test

---

### ✅ Test 3: The Eight Employees

**Action:** View team across all screens

**Expected employees visible:**
1. Sandy — Chief of Staff (special role, always present)
2. 📧 Email Marketing Manager
3. 🌐 Website Manager
4. 📊 SEO & PPC Manager
5. 📱 Social Media Manager
6. ✍️ Proposal Writer
7. 📖 Case Study Writer
8. 💰 Funding & Rewards Manager

**Each employee shows:**
- Role title
- Current task (or "Available")
- Status: 🟢 available / 🟠 busy / 🟡 waiting / 🔴 blocked
- Workload indicator (0-100%)

**Status:** Ready to test

---

### ✅ Test 4: Real Task Data (MTech Current Tasks)

**Action:** View Tasks tab

**Expected email campaigns:**
- Martyn's Law — General Email Post (Brentwood)
- Account Manager Email — Sue Gunnell (Brentwood) ✅
- Account Manager Email — Sateen Baxter (Radio Links) — Waiting for John
- Account Manager Email — Matt Ellwood-Smith (Radio Links) — In progress
- Account Manager Email — Matt Ellwood-Smith (Capcom) — In progress
- Account Manager Email — Alex Bacon (Brentwood) — In progress
- Account Manager Email — Garreth Breen (IRCL) — In progress

**Expected website tasks:**
- Two-Way Radios landing page (Brentwood) — Paused
- Radio Systems new page (Brentwood) — In progress
- BC Home Page — reword + banners (Brentwood) — Banner live ✅
- Two-Way Radios product cards (Brentwood) — Brief ready
- Capcom Website Banner (Capcom) — Not started

**Expected SEO/PPC tasks:**
- Review PPC ads — correct messaging (Brentwood) — Meeting Thu
- PPC Campaign Restructure — Phase 1 (Brentwood) — In progress

**Expected social media:**
- Martyn's Law — General Social Post (Brentwood) — Not started
- HSBC Social Posts (Brentwood) — Not started

**Status:** Requires database seed with real task data

---

### ✅ Test 5: Waiting for John Status - Prominent Throughout

**Action:** Filter tasks or scan all screens

**Expected:**
- "Waiting for John" appears as distinct badge (amber color: #F59E0B)
- Always visible — never buried in collapsible sections
- Examples on Home screen:
  * Sateen Baxter email (visible in Today's Focus)
  * IRCL stickers/leaflets (visible in Waiting for Approval)
- Separate "Waiting for John" filter in Tasks view
- High visibility in Analytics (when added)

**Status:** Ready to test

---

### ✅ Test 6: Brand Filtering

**Action:** Navigate to Tasks, Projects, Campaigns

**Expected:**
- Brand selector dropdown: "All Brands" (default)
- Filter options:
  * MTech Brentwood Communications
  * MTech Radio Links
  * Capcom
  * IRCL
  * All Brands
- Each task/project shows brand clearly
- Filtering updates view in real-time
- Brand badges use consistent colors

**Status:** Ready to test

---

### ✅ Test 7: Task Statuses

**Action:** View various tasks across statuses

**Expected statuses shown:**
- Backlog — grey
- Assigned — light blue
- In Progress — green dot 🟢
- Waiting for Review — waiting symbol
- Waiting for Approval — awaiting symbol
- Waiting for John — amber badge #F59E0B (prominent)
- Waiting for Customer — external symbol
- Blocked — red badge with reason
- Complete — greyed out

**Status:** Ready to test

---

### ✅ Test 8: Board Room - Weekly Reporting

**Action:** Navigate to Board Room tab

**Expected:**
- Title: "Board Room"
- Subtitle: "Weekly Meeting · Friday"
- [Generate This Week's Report] button
- LAST MEETING section showing:
  * Week ending [date]
  * Completed Work
  * Work in Progress
  * Blockers
  * Wins
  * Next Week's Priorities
- ARCHIVE section listing previous reports
- Report exportable as PDF or copyable text

**Status:** Ready to test

---

## Data Structure Validation

### ✅ Test DB.1: Real Task Data

**Action:** Query database for task data

**Expected:**
- Tasks table populated with MTech real tasks
- Each task has:
  * id (UUID)
  * title (from Section 11 of brief)
  * brand (brentwood / radio-links / capcom / ircl)
  * owner (employee ID)
  * status (one of 9 statuses)
  * priority (high / medium / low)
  * deadline (date or null)
  * projectId (null for Phase 1)
  * approval_required (boolean)
  * approver (john / emilee / customer / null)
  * created_at, updated_at timestamps
  * blocker_reason (if blocked)

**Status:** Ready to test

---

### ✅ Test DB.2: Employee Data

**Action:** Query employees table

**Expected:**
- 8 employees (Sandy + 7 specialists):
  1. Sandy — Chief of Staff
  2. Email Marketing Manager
  3. Website Manager
  4. SEO & PPC Manager
  5. Social Media Manager
  6. Proposal Writer
  7. Case Study Writer
  8. Funding & Rewards Manager
- Each employee has:
  * id (UUID)
  * name
  * role
  * status (available / busy / waiting / blocked)
  * current_task_id (null or task UUID)
  * workload (0-100)
  * area (office location)

**Status:** Ready to test

---

### ✅ Test DB.3: Brand Data

**Action:** Query companies/brands table

**Expected:**
- 4 brands:
  1. MTech Brentwood Communications (brentwoodradios.co.uk)
  2. MTech Radio Links (radio-links.co.uk)
  3. Capcom (capcom.co.uk)
  4. IRCL (ircl.ie)
- Each brand has:
  * id
  * name
  * website
  * created_at

**Status:** Ready to test

---

## API Endpoint Tests

### ✅ Test API.1: Home Screen Data

```bash
GET /api/home/briefing
Expected: Sandy's morning summary data
{
  approvalsWaiting: number,
  deadlinesToday: array,
  tasksInProgress: array,
  blockers: array
}
```

### ✅ Test API.2: Task List

```bash
GET /api/tasks?brand=brentwood&status=in-progress
Expected: Filtered task list for display
```

### ✅ Test API.3: Employee Status

```bash
GET /api/employees
Expected: All 8 employees with current status and tasks
```

### ✅ Test API.4: Weekly Report

```bash
GET /api/board-room/report?weekEnding=2026-07-18
Expected: Weekly report structure with tasks by category
```

---

## Success Criteria

✅ Home screen loads with Sandy's greeting and briefing  
✅ Today's Focus shows 3 priority tasks  
✅ Waiting for Approval section displays pending items  
✅ Waiting for John status is prominent (amber badge)  
✅ Team Status shows who is working on what  
✅ All 8 employees visible across UI  
✅ Real MTech task data displayed (not placeholder)  
✅ Brand filtering works on all views  
✅ Navigation tabs render correctly  
✅ Board Room structure in place  
✅ No console errors  
✅ UI matches dark theme (#070A0F, #0F1219)  
✅ Orange accent (#F97031) used correctly  
✅ Amber (#F59E0B) for Waiting for John  

---

## Known Limitations (Phase 1)

- Sandy AI responses not yet powered by Claude API (placeholder for now)
- Projects list view coming in Phase 2
- Task detail editor coming in Phase 2
- Campaign list coming in Phase 2
- Knowledge Hub basic structure only
- Weekly report auto-generation by Sandy (Phase 3)
- Integrations removed (Phase 3)
- Analytics dashboard removed (Phase 4)

---

## Next Steps After Phase 1

**Phase 2: Projects**
- Project CRUD (create, read, update, delete)
- Project detail view with 7 tabs
- Tasks linked to projects
- Outputs section (draft / awaiting review / approved / published)
- Knowledge Hub file management

**Phase 3: Intelligence (Sandy AI)**
- Sandy powered by Claude API
- Each employee has their own system prompt
- Sandy creates tasks automatically
- Sandy assigns to correct employee
- Employee outputs returned to Sandy
- Sandy presents for approval

**Phase 4: Memory and Learning**
- Employee preferences saved per task rating
- Feedback loop for continuous improvement
- Sandy learns Emilee's preferences
- Search across all projects/tasks/outputs

---

## Test Environment Setup

```bash
# Frontend (dev mode)
npm run dev
# Runs on http://localhost:5173

# Backend (if needed for real API testing)
cd backend && npm run dev
# Runs on http://localhost:3001

# Database
# Use Railway PostgreSQL with schema from backend/src/db/schema.sql
```

---

**Test Plan prepared for Phase 1 of MTech AI Office.**  
**Focus: Home screen, Sandy orchestration, real task data.**  
**Target: Complete by end of Phase 1 sprint.**
