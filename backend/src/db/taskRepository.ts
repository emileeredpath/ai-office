import db from './connection.js';
import type { TaskRecord, TaskHistoryEntry } from '../types.js';
import { SEED_TASKS } from './seedData.js';

interface TaskRow {
  id: string;
  title: string;
  notes: string;
  brand: string;
  status: string;
  priority: string;
  deadline: string | null;
  start_date: string | null;
  campaign_id: string | null;
  created_at: string;
  completed_at: string | null;
  previous_status: string | null;
  history: string;
  approval_required: number;
  approver: string | null;
  blocker_reason: string | null;
  last_brief_generated: string | null;
  source: string | null;
  source_conversation_id: string | null;
  type: string;
  recipients: number | null;
  subject: string | null;
}

function rowToRecord(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    brand: row.brand as TaskRecord['brand'],
    status: row.status as TaskRecord['status'],
    priority: row.priority as TaskRecord['priority'],
    deadline: row.deadline,
    startDate: row.start_date,
    campaignId: row.campaign_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    previousStatus: row.previous_status as TaskRecord['previousStatus'],
    history: JSON.parse(row.history) as TaskHistoryEntry[],
    approvalRequired: !!row.approval_required,
    approver: row.approver as TaskRecord['approver'],
    blockerReason: row.blocker_reason,
    lastBriefGenerated: row.last_brief_generated,
    source: row.source,
    sourceConversationId: row.source_conversation_id,
    type: (row.type as TaskRecord['type']) || 'task',
    recipients: row.recipients,
    subject: row.subject,
  };
}

export function getAllTasks(): TaskRecord[] {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as unknown as TaskRow[];
  return rows.map(rowToRecord);
}

export function getTaskById(id: string): TaskRecord | undefined {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as TaskRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export function findTasksByTitle(title: string): TaskRecord[] {
  const rows = db
    .prepare('SELECT * FROM tasks WHERE lower(title) LIKE lower(?)')
    .all(`%${title}%`) as unknown as TaskRow[];
  return rows.map(rowToRecord);
}

export function insertTask(task: TaskRecord): void {
  db.prepare(
    `INSERT INTO tasks (
      id, title, notes, brand, status, priority, deadline, start_date, campaign_id,
      created_at, completed_at, previous_status, history, approval_required, approver,
      blocker_reason, last_brief_generated, source, source_conversation_id,
      type, recipients, subject
    ) VALUES (@id, @title, @notes, @brand, @status, @priority, @deadline, @startDate, @campaignId,
      @createdAt, @completedAt, @previousStatus, @history, @approvalRequired, @approver,
      @blockerReason, @lastBriefGenerated, @source, @sourceConversationId,
      @type, @recipients, @subject)`
  ).run({
    ...task,
    history: JSON.stringify(task.history),
    approvalRequired: task.approvalRequired ? 1 : 0,
  });
}

export function updateTaskRow(id: string, updates: Partial<TaskRecord>): TaskRecord | undefined {
  const existing = getTaskById(id);
  if (!existing) return undefined;

  const merged: TaskRecord = { ...existing, ...updates };
  // node:sqlite (unlike better-sqlite3) throws on named parameters present in
  // the bound object but not referenced in the SQL, so only pass exactly the
  // fields this UPDATE statement uses — not the full merged record.
  db.prepare(
    `UPDATE tasks SET
      title = @title, notes = @notes, brand = @brand, status = @status, priority = @priority,
      deadline = @deadline, start_date = @startDate, campaign_id = @campaignId,
      completed_at = @completedAt, previous_status = @previousStatus, history = @history,
      approval_required = @approvalRequired, approver = @approver, blocker_reason = @blockerReason,
      last_brief_generated = @lastBriefGenerated, type = @type, recipients = @recipients, subject = @subject
    WHERE id = @id`
  ).run({
    id: merged.id,
    title: merged.title,
    notes: merged.notes,
    brand: merged.brand,
    status: merged.status,
    priority: merged.priority,
    deadline: merged.deadline,
    startDate: merged.startDate,
    campaignId: merged.campaignId,
    completedAt: merged.completedAt,
    previousStatus: merged.previousStatus,
    history: JSON.stringify(merged.history),
    approvalRequired: merged.approvalRequired ? 1 : 0,
    approver: merged.approver,
    blockerReason: merged.blockerReason,
    lastBriefGenerated: merged.lastBriefGenerated,
    type: merged.type,
    recipients: merged.recipients,
    subject: merged.subject,
  });

  return getTaskById(id);
}

export function taskCountByStatus(status: string): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get(status) as unknown as {
    count: number;
  };
  return row.count;
}

// A brand-new (or freshly-provisioned) database has no tasks in it — the
// frontend's own seed data only ever lands in localStorage, never here. Load
// the same real task list once so a newly connected Claude Actions
// Integration has something other than an empty workspace to sync against.
// No-ops once the table has any rows, so it never overwrites real data.
export function seedTasksIfEmpty(): void {
  const row = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as unknown as { count: number };
  if (row.count > 0) return;
  for (const task of SEED_TASKS) {
    insertTask(task);
  }
  console.log(`Seeded ${SEED_TASKS.length} tasks into an empty database.`);
}
