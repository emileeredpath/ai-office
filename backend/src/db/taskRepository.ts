import db from './connection.js';
import type { TaskRecord, TaskHistoryEntry } from '../types.js';

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
  schedule_id: string | null;
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
  assigned_to: string | null;
  type: string;
  recipients: number | null;
  subject: string | null;
  cost: number | null;
  currency: string | null;
  external_id: string | null;
  opens: number | null;
  clicks: number | null;
  open_rate: number | null;
  click_rate: number | null;
  bounces: number | null;
  unsubscribes: number | null;
  unique_opens: number | null;
  unique_open_rate: number | null;
  delivered: number | null;
  delivery_rate: number | null;
  click_to_open_rate: number | null;
  email_campaign_group: string | null;
  email_geography: string | null;
  email_audience_level: string | null;
  email_audience_type: string | null;
  email_is_test: number;
  archived: number;
  archived_at: string | null;
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
    scheduleId: row.schedule_id,
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
    assignedTo: row.assigned_to,
    type: (row.type as TaskRecord['type']) || 'task',
    recipients: row.recipients,
    subject: row.subject,
    cost: row.cost,
    currency: row.currency,
    externalId: row.external_id,
    opens: row.opens,
    clicks: row.clicks,
    openRate: row.open_rate,
    clickRate: row.click_rate,
    bounces: row.bounces,
    unsubscribes: row.unsubscribes,
    uniqueOpens: row.unique_opens,
    uniqueOpenRate: row.unique_open_rate,
    delivered: row.delivered,
    deliveryRate: row.delivery_rate,
    clickToOpenRate: row.click_to_open_rate,
    emailCampaignGroup: row.email_campaign_group,
    emailGeography: row.email_geography,
    emailAudienceLevel: row.email_audience_level,
    emailAudienceType: row.email_audience_type,
    emailIsTest: !!row.email_is_test,
    archived: !!row.archived,
    archivedAt: row.archived_at,
  };
}

export function findTaskByExternalId(source: string, externalId: string): TaskRecord | undefined {
  const row = db
    .prepare('SELECT * FROM tasks WHERE source = ? AND external_id = ?')
    .get(source, externalId) as unknown as TaskRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export function getAllTasks(includeArchived = false): TaskRecord[] {
  const where = includeArchived ? '' : 'WHERE archived = 0';
  const rows = db.prepare(`SELECT * FROM tasks ${where} ORDER BY created_at DESC`).all() as unknown as TaskRow[];
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
      id, title, notes, brand, status, priority, deadline, start_date, campaign_id, schedule_id,
      created_at, completed_at, previous_status, history, approval_required, approver,
      blocker_reason, last_brief_generated, source, source_conversation_id, assigned_to,
      type, recipients, subject, cost, currency, external_id, opens, clicks, open_rate, click_rate, bounces, unsubscribes,
      unique_opens, unique_open_rate, delivered, delivery_rate, click_to_open_rate,
      email_campaign_group, email_geography, email_audience_level, email_audience_type, email_is_test
    ) VALUES (@id, @title, @notes, @brand, @status, @priority, @deadline, @startDate, @campaignId, @scheduleId,
      @createdAt, @completedAt, @previousStatus, @history, @approvalRequired, @approver,
      @blockerReason, @lastBriefGenerated, @source, @sourceConversationId, @assignedTo,
      @type, @recipients, @subject, @cost, @currency, @externalId, @opens, @clicks, @openRate, @clickRate, @bounces, @unsubscribes,
      @uniqueOpens, @uniqueOpenRate, @delivered, @deliveryRate, @clickToOpenRate,
      @emailCampaignGroup, @emailGeography, @emailAudienceLevel, @emailAudienceType, @emailIsTest)`
  ).run({
    id: task.id,
    title: task.title,
    notes: task.notes,
    brand: task.brand,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    startDate: task.startDate,
    campaignId: task.campaignId,
    scheduleId: task.scheduleId ?? null,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    previousStatus: task.previousStatus,
    history: JSON.stringify(task.history),
    approvalRequired: task.approvalRequired ? 1 : 0,
    approver: task.approver,
    blockerReason: task.blockerReason,
    lastBriefGenerated: task.lastBriefGenerated,
    source: task.source,
    sourceConversationId: task.sourceConversationId,
    assignedTo: task.assignedTo ?? null,
    type: task.type,
    recipients: task.recipients,
    subject: task.subject,
    cost: task.cost,
    currency: task.currency,
    externalId: task.externalId ?? null,
    opens: task.opens ?? null,
    clicks: task.clicks ?? null,
    openRate: task.openRate ?? null,
    clickRate: task.clickRate ?? null,
    bounces: task.bounces ?? null,
    unsubscribes: task.unsubscribes ?? null,
    uniqueOpens: task.uniqueOpens ?? null,
    uniqueOpenRate: task.uniqueOpenRate ?? null,
    delivered: task.delivered ?? null,
    deliveryRate: task.deliveryRate ?? null,
    clickToOpenRate: task.clickToOpenRate ?? null,
    emailCampaignGroup: task.emailCampaignGroup ?? null,
    emailGeography: task.emailGeography ?? null,
    emailAudienceLevel: task.emailAudienceLevel ?? null,
    emailAudienceType: task.emailAudienceType ?? null,
    emailIsTest: task.emailIsTest ? 1 : 0,
  });
}

export function deleteTaskRow(id: string): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getTasksFiltered(filters: { campaignId?: string; brand?: string }): TaskRecord[] {
  let tasks = getAllTasks();
  if (filters.campaignId) tasks = tasks.filter((t) => t.campaignId === filters.campaignId);
  if (filters.brand) tasks = tasks.filter((t) => t.brand === filters.brand);
  return tasks;
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
      deadline = @deadline, start_date = @startDate, campaign_id = @campaignId, schedule_id = @scheduleId,
      completed_at = @completedAt, previous_status = @previousStatus, history = @history,
      approval_required = @approvalRequired, approver = @approver, blocker_reason = @blockerReason,
      last_brief_generated = @lastBriefGenerated, type = @type, recipients = @recipients, subject = @subject,
      cost = @cost, currency = @currency, external_id = @externalId, opens = @opens, clicks = @clicks,
      open_rate = @openRate, click_rate = @clickRate, bounces = @bounces, unsubscribes = @unsubscribes,
      unique_opens = @uniqueOpens, unique_open_rate = @uniqueOpenRate, delivered = @delivered,
      delivery_rate = @deliveryRate, click_to_open_rate = @clickToOpenRate,
      email_campaign_group = @emailCampaignGroup, email_geography = @emailGeography,
      email_audience_level = @emailAudienceLevel, email_audience_type = @emailAudienceType,
      email_is_test = @emailIsTest
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
    scheduleId: merged.scheduleId ?? null,
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
    cost: merged.cost,
    currency: merged.currency,
    externalId: merged.externalId,
    opens: merged.opens,
    clicks: merged.clicks,
    openRate: merged.openRate,
    clickRate: merged.clickRate,
    bounces: merged.bounces,
    unsubscribes: merged.unsubscribes,
    uniqueOpens: merged.uniqueOpens ?? null,
    uniqueOpenRate: merged.uniqueOpenRate ?? null,
    delivered: merged.delivered ?? null,
    deliveryRate: merged.deliveryRate ?? null,
    clickToOpenRate: merged.clickToOpenRate ?? null,
    emailCampaignGroup: merged.emailCampaignGroup ?? null,
    emailGeography: merged.emailGeography ?? null,
    emailAudienceLevel: merged.emailAudienceLevel ?? null,
    emailAudienceType: merged.emailAudienceType ?? null,
    emailIsTest: merged.emailIsTest ? 1 : 0,
  });

  return getTaskById(id);
}

export function archiveTask(id: string): TaskRecord | undefined {
  const existing = getTaskById(id);
  if (!existing) return undefined;
  db.prepare('UPDATE tasks SET archived = 1, archived_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  return getTaskById(id);
}

export function restoreTask(id: string): TaskRecord | undefined {
  const existing = getTaskById(id);
  if (!existing) return undefined;
  db.prepare('UPDATE tasks SET archived = 0, archived_at = NULL WHERE id = ?').run(id);
  return getTaskById(id);
}

export function taskCountByStatus(status: string): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get(status) as unknown as {
    count: number;
  };
  return row.count;
}
