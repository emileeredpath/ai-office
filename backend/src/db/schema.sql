-- AI Office Database Schema

-- Companies (multi-company support, with single company for MVP)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Employees (Sandy, specialist AIs, and humans)
CREATE TABLE IF NOT EXISTS ai_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'ai' or 'human'
  is_ai BOOLEAN DEFAULT FALSE,
  emoji VARCHAR(10),
  status VARCHAR(50) DEFAULT 'available', -- available, working, waiting_approval, blocked
  personality TEXT[], -- array of personality traits
  accent_color VARCHAR(7), -- hex color
  authority_level VARCHAR(50), -- constitutional, executive, domain, team, individual
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Tasks (work assignments)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID REFERENCES ai_employees(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high
  status VARCHAR(50) DEFAULT 'backlog', -- backlog, assigned, awaiting_brief, in_progress, waiting_review, waiting_approval, complete, blocked
  assigned_by UUID REFERENCES ai_employees(id), -- who assigned it (Sandy, manager, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Task Notes (comments/updates on tasks)
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES ai_employees(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations (chat sessions with Sandy or other AIs)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  ai_employee_id UUID NOT NULL REFERENCES ai_employees(id), -- which AI (Sandy, Finance AI, etc.)
  user_id UUID REFERENCES ai_employees(id), -- who's talking to the AI (can be null for system)
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, archived
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages (individual messages in conversations)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES ai_employees(id), -- who sent it (human or AI)
  content TEXT NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base (documents, decision records, processes)
CREATE TABLE IF NOT EXISTS knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  domain VARCHAR(100), -- governance, organisation, people, knowledge, operations, analytics, automation, platform, experience
  type VARCHAR(50), -- process, decision, policy, principle, template, etc.
  owner_id UUID REFERENCES ai_employees(id),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Memory (lessons learned, outcomes)
CREATE TABLE IF NOT EXISTS memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  task_id UUID REFERENCES tasks(id),
  content TEXT NOT NULL,
  category VARCHAR(100), -- lesson, outcome, blocker, success, etc.
  related_knowledge_id UUID REFERENCES knowledge(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects (grouping of tasks, campaigns)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, archived
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Project Tasks (mapping tasks to projects)
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(project_id, task_id)
);

-- AI Role and Authority Contracts
CREATE TABLE IF NOT EXISTS ai_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  ai_employee_id UUID NOT NULL REFERENCES ai_employees(id),
  scope TEXT NOT NULL, -- what the AI is responsible for
  can_decide_independently JSONB, -- array of decisions it can make alone
  requires_notification JSONB, -- array of actions that need notification
  requires_approval JSONB, -- array of actions that need approval
  cannot_do JSONB, -- array of prohibited actions
  escalation_paths JSONB, -- how to escalate decisions
  performance_standards JSONB, -- accuracy, latency, coverage, etc.
  version INTEGER DEFAULT 1,
  effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES ai_employees(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External Integration Tables

-- Vendors (from Acumatica)
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  is_approved BOOLEAN DEFAULT FALSE,
  payment_terms VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, blocked
  approved_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Cost Centers (from Acumatica)
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  budget DECIMAL(15, 2),
  spent DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

-- Invoices (from Acumatica)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_name VARCHAR(255),
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  cost_center VARCHAR(50),
  due_date DATE,
  status VARCHAR(50) DEFAULT 'open', -- open, paid, overdue, rejected, pending_review
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES ai_employees(id),
  rejection_reason TEXT,
  review_reason TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns (from GA4/Analytics)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(15, 2) DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Campaigns (from Campaign Monitor)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  sent_date TIMESTAMP,
  recipient_count INTEGER DEFAULT 0,
  open_rate DECIMAL(5, 4) DEFAULT 0,
  click_rate DECIMAL(5, 4) DEFAULT 0,
  unsubscribe_rate DECIMAL(5, 4) DEFAULT 0,
  bounce_rate DECIMAL(5, 4) DEFAULT 0,
  complaint_rate DECIMAL(5, 4) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, paused
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Lists (from Campaign Monitor)
CREATE TABLE IF NOT EXISTS email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  subscriber_count INTEGER DEFAULT 0,
  unsubscribe_rate DECIMAL(5, 4) DEFAULT 0,
  bounce_rate DECIMAL(5, 4) DEFAULT 0,
  engagement_rate DECIMAL(5, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Email Segments (from Campaign Monitor)
CREATE TABLE IF NOT EXISTS email_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES email_lists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  size INTEGER DEFAULT 0,
  open_rate DECIMAL(5, 4) DEFAULT 0,
  click_rate DECIMAL(5, 4) DEFAULT 0,
  conversion_rate DECIMAL(5, 4) DEFAULT 0,
  revenue_per_email DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traffic Sources (from GA4)
CREATE TABLE IF NOT EXISTS traffic_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  date DATE NOT NULL,
  source VARCHAR(100),
  medium VARCHAR(100),
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, date, source, medium)
);

-- Daily Metrics (from GA4)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, date)
);

-- Anomalies (from GA4)
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  metric_type VARCHAR(100),
  metric_name VARCHAR(255),
  current_value DECIMAL(15, 2),
  expected_value DECIMAL(15, 2),
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unsubscribe Events (from Campaign Monitor)
CREATE TABLE IF NOT EXISTS unsubscribe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Decision Outcomes (for learning and optimization)
CREATE TABLE IF NOT EXISTS task_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  ai_employee_id UUID NOT NULL REFERENCES ai_employees(id),
  ai_name VARCHAR(255),
  decision VARCHAR(50), -- approved, rejected, pending_review
  actual_outcome VARCHAR(50), -- success, failure, partial, unknown
  confidence INTEGER, -- 0-100
  time_to_resolution INTEGER, -- minutes
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Learning Events
CREATE TABLE IF NOT EXISTS ai_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_employee_id UUID NOT NULL REFERENCES ai_employees(id),
  ai_name VARCHAR(255),
  learning_type VARCHAR(100), -- false_positive, false_negative, confidence_mismatch, etc.
  description TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  confidence_improvement INTEGER, -- positive or negative adjustment
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Decision Feedback (human feedback on AI decisions)
CREATE TABLE IF NOT EXISTS decision_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  ai_employee_id UUID NOT NULL REFERENCES ai_employees(id),
  feedback TEXT,
  score INTEGER, -- 1-5 rating
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Performance History (snapshot of performance metrics over time)
CREATE TABLE IF NOT EXISTS ai_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_employee_id UUID NOT NULL REFERENCES ai_employees(id),
  ai_name VARCHAR(255),
  success_rate DECIMAL(5, 2),
  average_confidence DECIMAL(5, 2),
  average_time_to_resolution INTEGER,
  total_decisions INTEGER,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ai_employee_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_employees_company_id ON ai_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_ai_employee_id ON conversations(ai_employee_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_company_id ON knowledge(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_domain ON knowledge(domain);
CREATE INDEX IF NOT EXISTS idx_memory_company_id ON memory(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_contracts_company_id ON ai_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_contracts_ai_employee_id ON ai_contracts(ai_employee_id);
CREATE INDEX IF NOT EXISTS idx_vendors_company_id ON vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_company_id ON cost_centers(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_company_id ON email_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_email_lists_company_id ON email_lists(company_id);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_company_id ON traffic_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_company_id ON daily_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_company_id ON anomalies(company_id);
CREATE INDEX IF NOT EXISTS idx_task_outcomes_task_id ON task_outcomes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_outcomes_ai_employee_id ON task_outcomes(ai_employee_id);
CREATE INDEX IF NOT EXISTS idx_task_outcomes_actual_outcome ON task_outcomes(actual_outcome);
CREATE INDEX IF NOT EXISTS idx_ai_learnings_ai_employee_id ON ai_learnings(ai_employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_learnings_learning_type ON ai_learnings(learning_type);
CREATE INDEX IF NOT EXISTS idx_decision_feedback_task_id ON decision_feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_decision_feedback_ai_employee_id ON decision_feedback(ai_employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_history_ai_employee_id ON ai_performance_history(ai_employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_history_snapshot_date ON ai_performance_history(snapshot_date);
