import { nanoid } from 'nanoid';
import { z } from 'zod';
import db from '../db/connection.js';
import {
  getAllTasks,
  getTaskById,
  findTasksByTitle,
  insertTask,
  updateTaskRow,
} from '../db/taskRepository.js';
import {
  getCampaignById,
  updateCampaignRow,
  recalculateCampaignSpend,
} from '../db/campaignRepository.js';
import type { ActionRequest, ActionResult, ActionSource, TaskRecord, TaskHistoryEntry } from '../types.js';

// ---------------------------------------------------------------------------
// Allowlist: only these action names can ever be executed. Anything else is
// rejected before any validation or database access happens.
// ---------------------------------------------------------------------------
const ALLOWED_ACTIONS = new Set([
  'create_task',
  'update_task',
  'complete_task',
  'search_workspace',
  'get_workspace_context',
  'update_campaign',
]);

// Actions that mutate data and are not safe to silently retry/auto-apply
// without the caller (Claude, on the user's behalf) explicitly confirming.
const HIGH_RISK_ACTIONS = new Set(['complete_task', 'update_task', 'update_campaign']);

const BRANDS = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro'] as const;
const STATUSES = [
  'backlog',
  'not-started',
  'in-progress',
  'waiting-approval',
  'waiting-john',
  'waiting-customer',
  'approved-ready',
  'blocked',
  'complete',
] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;
const TASK_TYPES = ['task', 'email-send'] as const;

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(300),
  notes: z.string().max(10000).optional(),
  brand: z.enum(BRANDS).optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(STATUSES).optional(),
  deadline: z.string().datetime().optional().or(z.string().date().optional()),
  campaign_id: z.string().optional(),
  source: z.string().max(100).optional(),
  source_conversation_id: z.string().max(200).optional(),
  type: z.enum(TASK_TYPES).optional().describe('"email-send" marks this as a logged send rather than a general task'),
  recipients: z.number().int().min(0).optional().describe('Recipient count for an email-send'),
  subject: z.string().max(300).optional().describe('Email subject line for an email-send'),
  cost: z.number().min(0).optional().describe('Spend for this item, in £ — convert to GBP before passing this in if the source invoice was in another currency'),
  currency: z.string().max(10).optional().describe('Original invoice currency, e.g. "USD" — for audit only, defaults to GBP'),
});

const updateTaskSchema = z.object({
  task_id: z.string().min(1, 'task_id is required'),
  title: z.string().trim().min(1).max(300).optional(),
  notes: z.string().max(10000).optional(),
  brand: z.enum(BRANDS).optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(STATUSES).optional(),
  deadline: z.string().optional(),
  campaign_id: z.string().nullable().optional(),
  type: z.enum(TASK_TYPES).optional(),
  recipients: z.number().int().min(0).nullable().optional(),
  subject: z.string().max(300).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  currency: z.string().max(10).nullable().optional(),
});

const completeTaskSchema = z.object({
  task_id: z.string().min(1, 'task_id is required'),
});

const searchWorkspaceSchema = z.object({
  query: z.string().max(300).optional(),
  status: z.enum(STATUSES).optional(),
  brand: z.enum(BRANDS).optional(),
  type: z.enum(TASK_TYPES).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

const CAMPAIGN_STATUSES = ['planning', 'active', 'on-hold', 'completed'] as const;

const updateCampaignSchema = z.object({
  campaign_id: z.string().min(1, 'campaign_id is required'),
  name: z.string().trim().min(1).max(300).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().nullable().optional(),
  actualSpend: z.number().optional().describe('Actual spend in £ — the field shown as "Actual spend (£)" on the campaign card. Overwritten automatically the next time a linked task\'s cost changes, so prefer setting task costs where possible.'),
  entities: z.array(z.enum(BRANDS)).optional(),
  colour: z.string().max(20).optional(),
  notes: z.string().max(10000).optional(),
});

// ---------------------------------------------------------------------------
// Audit logging — every mutation gets a row, whether it succeeded, was
// auto-applied, or required (and received) confirmation.
// ---------------------------------------------------------------------------
function writeAuditLog(entry: {
  action: string;
  resourceType: string;
  resourceId: string | null;
  previousValue: unknown;
  newValue: unknown;
  source: ActionSource | undefined;
  requestId: string | undefined;
  confirmed: boolean;
  automatic: boolean;
}) {
  db.prepare(
    `INSERT INTO audit_log (
      id, action, resource_type, resource_id, previous_value, new_value,
      source, source_conversation_id, request_id, confirmed, automatic, created_at
    ) VALUES (@id, @action, @resourceType, @resourceId, @previousValue, @newValue,
      @source, @sourceConversationId, @requestId, @confirmed, @automatic, @createdAt)`
  ).run({
    id: nanoid(),
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    previousValue: entry.previousValue ? JSON.stringify(entry.previousValue) : null,
    newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
    source: entry.source?.type ?? 'unknown',
    sourceConversationId: entry.source?.conversationId ?? null,
    requestId: entry.requestId ?? null,
    confirmed: entry.confirmed ? 1 : 0,
    automatic: entry.automatic ? 1 : 0,
    createdAt: new Date().toISOString(),
  });
}

export function getAuditLog(limit = 50) {
  return db
    .prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?')
    .all(limit);
}

// ---------------------------------------------------------------------------
// Idempotency — replay the previously-stored response for a repeated
// request_id instead of executing the action twice.
// ---------------------------------------------------------------------------
function getIdempotentResponse(requestId: string | undefined): ActionResult | null {
  if (!requestId) return null;
  const row = db
    .prepare('SELECT response FROM idempotency_keys WHERE request_id = ?')
    .get(requestId) as unknown as { response: string } | undefined;
  return row ? (JSON.parse(row.response) as ActionResult) : null;
}

function storeIdempotentResponse(requestId: string | undefined, action: string, response: ActionResult) {
  if (!requestId) return;
  db.prepare(
    'INSERT OR REPLACE INTO idempotency_keys (request_id, action, response, created_at) VALUES (?, ?, ?, ?)'
  ).run(requestId, action, JSON.stringify(response), new Date().toISOString());
}

// ---------------------------------------------------------------------------
// Duplicate detection for creates
// ---------------------------------------------------------------------------
function findPossibleDuplicateTasks(title: string): TaskRecord[] {
  return findTasksByTitle(title).slice(0, 5);
}

// ---------------------------------------------------------------------------
// Action implementations
// ---------------------------------------------------------------------------
function doCreateTask(payload: unknown, source: ActionSource | undefined, requestId: string | undefined): ActionResult {
  const parsed = createTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, action: 'create_task', message: 'Invalid task data.', error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;

  const duplicates = findPossibleDuplicateTasks(input.title);
  const forceCreate = (payload as { confirm_duplicate?: boolean }).confirm_duplicate === true;
  if (duplicates.length > 0 && !forceCreate) {
    return {
      success: false,
      action: 'create_task',
      message: `Found ${duplicates.length} existing task(s) with a similar title. Set confirm_duplicate: true to create anyway.`,
      possible_duplicates: duplicates.map((d) => ({ id: d.id, title: d.title, status: d.status })),
    };
  }

  const now = new Date().toISOString();
  const task: TaskRecord = {
    id: `task-${nanoid(10)}`,
    title: input.title,
    notes: input.notes ?? '',
    brand: input.brand ?? 'mtech',
    status: input.status ?? 'not-started',
    priority: input.priority ?? 'medium',
    deadline: input.deadline ?? null,
    startDate: null,
    campaignId: input.campaign_id ?? null,
    createdAt: now,
    completedAt: null,
    previousStatus: null,
    history: [],
    approvalRequired: false,
    approver: null,
    blockerReason: null,
    lastBriefGenerated: null,
    source: input.source ?? source?.type ?? 'claude',
    sourceConversationId: input.source_conversation_id ?? source?.conversationId ?? null,
    type: input.type ?? 'task',
    recipients: input.recipients ?? null,
    subject: input.subject ?? null,
    assignedTo: null,
    cost: input.cost ?? null,
    currency: input.currency ?? (input.cost != null ? 'GBP' : null),
    externalId: null,
  };

  insertTask(task);
  writeAuditLog({
    action: 'create_task',
    resourceType: 'task',
    resourceId: task.id,
    previousValue: null,
    newValue: task,
    source,
    requestId,
    confirmed: true,
    automatic: true,
  });

  if (task.campaignId && task.cost != null) {
    recalculateCampaignSpend(task.campaignId);
  }

  return {
    success: true,
    action: 'create_task',
    result: { id: task.id, title: task.title },
    message: `Task "${task.title}" created.`,
  };
}

function doUpdateTask(payload: unknown, source: ActionSource | undefined, requestId: string | undefined, confirmed: boolean): ActionResult {
  const parsed = updateTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, action: 'update_task', message: 'Invalid update data.', error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;
  const existing = getTaskById(input.task_id);
  if (!existing) {
    return { success: false, action: 'update_task', message: `No task found with id ${input.task_id}.` };
  }

  if (!confirmed) {
    return {
      success: false,
      action: 'update_task',
      requires_confirmation: true,
      message: `About to update "${existing.title}". Confirm to apply.`,
      preview: { task_id: existing.id, current: existing, changes: input },
    };
  }

  const updates: Partial<TaskRecord> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.brand !== undefined) updates.brand = input.brand;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.deadline !== undefined) updates.deadline = input.deadline;
  if (input.campaign_id !== undefined) updates.campaignId = input.campaign_id;
  if (input.type !== undefined) updates.type = input.type;
  if (input.recipients !== undefined) updates.recipients = input.recipients;
  if (input.subject !== undefined) updates.subject = input.subject;
  if (input.cost !== undefined) {
    updates.cost = input.cost;
    if (input.currency === undefined && input.cost != null && existing.currency == null) {
      updates.currency = 'GBP';
    }
  }
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.status !== undefined) {
    updates.status = input.status;
    if (input.status !== 'complete' && existing.status === 'complete') {
      // Reopening: clear completion state and record it in history, same as
      // the dashboard's own reopenTask does for local-only tasks.
      updates.completedAt = null;
      updates.previousStatus = null;
      const historyEntry: TaskHistoryEntry = {
        id: `hist-${nanoid(8)}`,
        action: 'reopened',
        timestamp: new Date().toISOString(),
        previousStatus: 'complete',
        newStatus: input.status,
      };
      updates.history = [...existing.history, historyEntry];
    }
  }

  const updated = updateTaskRow(input.task_id, updates)!;
  writeAuditLog({
    action: 'update_task',
    resourceType: 'task',
    resourceId: updated.id,
    previousValue: existing,
    newValue: updated,
    source,
    requestId,
    confirmed: true,
    automatic: false,
  });

  // Keep campaign spend in sync with its tasks' costs whenever either the
  // cost or the campaign link itself changes. Recompute both the old and
  // new campaign if a task moved between them.
  if (updates.cost !== undefined || updates.campaignId !== undefined) {
    if (existing.campaignId) recalculateCampaignSpend(existing.campaignId);
    if (updated.campaignId && updated.campaignId !== existing.campaignId) {
      recalculateCampaignSpend(updated.campaignId);
    }
  }

  return {
    success: true,
    action: 'update_task',
    result: { id: updated.id, title: updated.title },
    message: `Task "${updated.title}" updated.`,
  };
}

function doCompleteTask(payload: unknown, source: ActionSource | undefined, requestId: string | undefined, confirmed: boolean): ActionResult {
  const parsed = completeTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, action: 'complete_task', message: 'Invalid payload.', error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const existing = getTaskById(parsed.data.task_id);
  if (!existing) {
    return { success: false, action: 'complete_task', message: `No task found with id ${parsed.data.task_id}.` };
  }
  if (existing.status === 'complete') {
    return { success: true, action: 'complete_task', result: { id: existing.id }, message: 'Task was already complete.' };
  }

  if (!confirmed) {
    return {
      success: false,
      action: 'complete_task',
      requires_confirmation: true,
      message: `About to mark "${existing.title}" complete. Confirm to apply.`,
      preview: { task_id: existing.id, title: existing.title, current_status: existing.status },
    };
  }

  const now = new Date().toISOString();
  const historyEntry: TaskHistoryEntry = {
    id: `hist-${nanoid(8)}`,
    action: 'completed',
    timestamp: now,
    previousStatus: existing.status,
    newStatus: 'complete',
  };
  const updated = updateTaskRow(existing.id, {
    status: 'complete',
    completedAt: now,
    previousStatus: existing.status,
    history: [...existing.history, historyEntry],
  })!;

  writeAuditLog({
    action: 'complete_task',
    resourceType: 'task',
    resourceId: updated.id,
    previousValue: { status: existing.status },
    newValue: { status: 'complete', completedAt: now },
    source,
    requestId,
    confirmed: true,
    automatic: false,
  });

  return {
    success: true,
    action: 'complete_task',
    result: { id: updated.id, title: updated.title },
    message: `Task "${updated.title}" marked complete.`,
  };
}

function doSearchWorkspace(payload: unknown): ActionResult {
  const parsed = searchWorkspaceSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, action: 'search_workspace', message: 'Invalid search parameters.', error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const { query, status, brand, type, limit = 20 } = parsed.data;

  let tasks = getAllTasks();
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (brand) tasks = tasks.filter((t) => t.brand === brand);
  if (type) tasks = tasks.filter((t) => t.type === type);
  if (query) {
    const q = query.toLowerCase();
    tasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)
    );
  }

  return {
    success: true,
    action: 'search_workspace',
    result: {
      tasks: tasks.slice(0, limit).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        brand: t.brand,
        priority: t.priority,
        deadline: t.deadline,
        type: t.type,
        recipients: t.recipients,
        cost: t.cost,
        campaignId: t.campaignId,
      })),
    },
    message: `Found ${tasks.length} matching task(s).`,
  };
}

function doUpdateCampaign(payload: unknown, source: ActionSource | undefined, requestId: string | undefined, confirmed: boolean): ActionResult {
  const parsed = updateCampaignSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, action: 'update_campaign', message: 'Invalid update data.', error: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const input = parsed.data;
  const existing = getCampaignById(input.campaign_id);
  if (!existing) {
    return { success: false, action: 'update_campaign', message: `No campaign found with id ${input.campaign_id}.` };
  }

  if (!confirmed) {
    return {
      success: false,
      action: 'update_campaign',
      requires_confirmation: true,
      message: `About to update "${existing.name}". Confirm to apply.`,
      preview: { campaign_id: existing.id, current: existing, changes: input },
    };
  }

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.status !== undefined) updates.status = input.status;
  if (input.startDate !== undefined) updates.startDate = input.startDate;
  if (input.endDate !== undefined) updates.endDate = input.endDate;
  if (input.budget !== undefined) updates.budget = input.budget;
  if (input.actualSpend !== undefined) updates.spend = input.actualSpend;
  if (input.entities !== undefined) updates.entities = input.entities;
  if (input.colour !== undefined) updates.colour = input.colour;
  if (input.notes !== undefined) updates.notes = input.notes;

  const updated = updateCampaignRow(input.campaign_id, updates)!;
  writeAuditLog({
    action: 'update_campaign',
    resourceType: 'campaign',
    resourceId: updated.id,
    previousValue: existing,
    newValue: updated,
    source,
    requestId,
    confirmed: true,
    automatic: false,
  });

  return {
    success: true,
    action: 'update_campaign',
    result: { id: updated.id, name: updated.name, spend: updated.spend },
    message: `Campaign "${updated.name}" updated.`,
  };
}

function doGetWorkspaceContext(): ActionResult {
  const tasks = getAllTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueToday = tasks.filter((t) => {
    if (!t.deadline || t.status === 'complete') return false;
    const d = new Date(t.deadline);
    return d >= today && d < tomorrow;
  });
  const overdue = tasks.filter((t) => {
    if (!t.deadline || t.status === 'complete') return false;
    return new Date(t.deadline) < today;
  });
  const waitingForJohn = tasks.filter((t) => t.status === 'waiting-john');
  const inProgress = tasks.filter((t) => t.status === 'in-progress');

  const summarize = (list: TaskRecord[]) =>
    list.slice(0, 20).map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, deadline: t.deadline, brand: t.brand }));

  return {
    success: true,
    action: 'get_workspace_context',
    result: {
      due_today: summarize(dueToday),
      overdue: summarize(overdue),
      waiting_for_approval: summarize(waitingForJohn),
      in_progress: summarize(inProgress),
      total_open_tasks: tasks.filter((t) => t.status !== 'complete').length,
    },
    message: `${dueToday.length} due today, ${overdue.length} overdue, ${waitingForJohn.length} waiting for approval.`,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export function executeAction(request: ActionRequest): ActionResult {
  const { action, payload, source, request_id: requestId, confirmed } = request;

  if (!ALLOWED_ACTIONS.has(action)) {
    return { success: false, action, message: `Unknown or unpermitted action: ${action}` };
  }

  const cached = getIdempotentResponse(requestId);
  if (cached) return cached;

  const isConfirmed = HIGH_RISK_ACTIONS.has(action) ? confirmed === true : true;

  let result: ActionResult;
  switch (action) {
    case 'create_task':
      result = doCreateTask(payload, source, requestId);
      break;
    case 'update_task':
      result = doUpdateTask(payload, source, requestId, isConfirmed);
      break;
    case 'complete_task':
      result = doCompleteTask(payload, source, requestId, isConfirmed);
      break;
    case 'search_workspace':
      result = doSearchWorkspace(payload);
      break;
    case 'get_workspace_context':
      result = doGetWorkspaceContext();
      break;
    case 'update_campaign':
      result = doUpdateCampaign(payload, source, requestId, isConfirmed);
      break;
    default:
      result = { success: false, action, message: 'Not implemented.' };
  }

  // Only cache terminal (executed) responses, not confirmation prompts —
  // otherwise a later confirmed retry with the same request_id would replay
  // the original "requires_confirmation" response forever.
  if (!result.requires_confirmation) {
    storeIdempotentResponse(requestId, action, result);
  }

  return result;
}
