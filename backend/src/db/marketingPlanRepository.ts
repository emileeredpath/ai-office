import { nanoid } from 'nanoid';
import db from './connection.js';
import type {
  CreateMarketingObjectiveInput,
  CreateMarketingPlanInput,
  UpdateMarketingObjectiveInput,
  UpdateMarketingPlanInput,
  CreateMarketingPriorityInput,
  UpdateMarketingPriorityInput,
  CreateMarketingMilestoneInput,
  UpdateMarketingMilestoneInput,
} from '../marketingPlan/schemas.js';

type SqlValue = string | number | null;

interface PlanRow {
  id: string;
  title: string;
  period_year: number;
  business_direction: string;
  status: string;
  next_review_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  archived: number;
  archived_at: string | null;
}

interface ObjectiveRow {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  period_year: number;
  quarter: number | null;
  why_it_matters: string;
  customer_market_context: string;
  commercial_relevance: string;
  marketing_rationale: string;
  next_review_date: string | null;
  sort_order: number;
  notes: string;
  created_at: string;
  updated_at: string;
  archived: number;
  archived_at: string | null;
}

interface PriorityRow {
  id: string; objective_id: string; title: string; description: string; status: string; sort_order: number;
  notes: string; created_at: string; updated_at: string; archived: number; archived_at: string | null;
}

interface MilestoneRow {
  id: string; objective_id: string; priority_id: string | null; level: string; title: string; description: string;
  status: string; period_year: number | null; quarter: number | null; month: number | null; start_date: string | null;
  due_date: string | null; attention_type: string | null; sort_order: number; notes: string; created_at: string;
  updated_at: string; archived: number; archived_at: string | null;
}

function mapPlan(row: PlanRow) {
  return {
    id: row.id,
    title: row.title,
    periodYear: row.period_year,
    businessDirection: row.business_direction,
    status: row.status,
    nextReviewDate: row.next_review_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archived: Boolean(row.archived),
    archivedAt: row.archived_at,
  };
}

function objectiveEntities(objectiveId: string): string[] {
  return (db.prepare('SELECT brand FROM marketing_plan_objective_entities WHERE objective_id = ? ORDER BY brand').all(objectiveId) as Array<{ brand: string }>).map((row) => row.brand);
}

function mapObjective(row: ObjectiveRow) {
  return {
    id: row.id,
    planId: row.plan_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    periodYear: row.period_year,
    quarter: row.quarter,
    whyItMatters: row.why_it_matters,
    customerMarketContext: row.customer_market_context,
    commercialRelevance: row.commercial_relevance,
    marketingRationale: row.marketing_rationale,
    nextReviewDate: row.next_review_date,
    sortOrder: row.sort_order,
    notes: row.notes,
    entities: objectiveEntities(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archived: Boolean(row.archived),
    archivedAt: row.archived_at,
  };
}

function addHistory(resourceType: 'plan' | 'objective' | 'priority' | 'milestone', resourceId: string, action: string, previousValue: unknown, newValue: unknown, reason?: string) {
  db.prepare(`
    INSERT INTO marketing_plan_history
      (id, resource_type, resource_id, action, field_name, previous_value, new_value, reason, source, changed_at)
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'dashboard', ?)
  `).run(
    `mph_${nanoid()}`,
    resourceType,
    resourceId,
    action,
    previousValue === undefined ? null : JSON.stringify(previousValue),
    newValue === undefined ? null : JSON.stringify(newValue),
    reason || null,
    new Date().toISOString()
  );
}

function runTransaction<T>(operation: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = operation();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function listMarketingPlans(includeArchived = false) {
  const rows = db.prepare(`SELECT * FROM marketing_plans ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY period_year DESC, created_at DESC`).all() as unknown as PlanRow[];
  return rows.map(mapPlan);
}

export function getMarketingPlan(id: string) {
  const row = db.prepare('SELECT * FROM marketing_plans WHERE id = ?').get(id) as unknown as PlanRow | undefined;
  return row ? mapPlan(row) : null;
}

export function createMarketingPlan(input: CreateMarketingPlanInput) {
  const id = `mp_${nanoid()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO marketing_plans
      (id, title, period_year, business_direction, status, next_review_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.title, input.periodYear, input.businessDirection ?? '', input.status ?? 'draft', input.nextReviewDate ?? null, input.notes ?? '', now, now);
  const plan = getMarketingPlan(id)!;
  addHistory('plan', id, 'create', undefined, plan);
  return plan;
}

const planColumns: Record<string, string> = {
  title: 'title',
  periodYear: 'period_year',
  businessDirection: 'business_direction',
  status: 'status',
  nextReviewDate: 'next_review_date',
  notes: 'notes',
};

export function updateMarketingPlan(id: string, input: UpdateMarketingPlanInput) {
  const previous = getMarketingPlan(id);
  if (!previous) return null;
  const entries = Object.entries(input).filter(([key, value]) => key !== 'reason' && value !== undefined && planColumns[key]);
  if (entries.length === 0) return previous;
  const set = entries.map(([key]) => `${planColumns[key]} = ?`).concat('updated_at = ?').join(', ');
  const values = entries.map(([, value]) => value as SqlValue).concat(new Date().toISOString(), id);
  db.prepare(`UPDATE marketing_plans SET ${set} WHERE id = ?`).run(...values);
  const updated = getMarketingPlan(id)!;
  addHistory('plan', id, 'edit', previous, updated, input.reason);
  return updated;
}

export function setMarketingPlanArchived(id: string, archived: boolean, reason?: string) {
  const previous = getMarketingPlan(id);
  if (!previous) return null;
  const now = new Date().toISOString();
  db.prepare('UPDATE marketing_plans SET archived = ?, archived_at = ?, updated_at = ? WHERE id = ?').run(archived ? 1 : 0, archived ? now : null, now, id);
  const updated = getMarketingPlan(id)!;
  addHistory('plan', id, archived ? 'archive' : 'restore', previous, updated, reason);
  return updated;
}

export function listMarketingObjectives(planId: string, includeArchived = false) {
  const rows = db.prepare(`SELECT * FROM marketing_plan_objectives WHERE plan_id = ? ${includeArchived ? '' : 'AND archived = 0'} ORDER BY sort_order, created_at`).all(planId) as unknown as ObjectiveRow[];
  return rows.map(mapObjective);
}

export function getMarketingObjective(id: string) {
  const row = db.prepare('SELECT * FROM marketing_plan_objectives WHERE id = ?').get(id) as unknown as ObjectiveRow | undefined;
  return row ? mapObjective(row) : null;
}

function replaceObjectiveEntities(objectiveId: string, entities: readonly string[]) {
  db.prepare('DELETE FROM marketing_plan_objective_entities WHERE objective_id = ?').run(objectiveId);
  const insert = db.prepare('INSERT INTO marketing_plan_objective_entities (objective_id, brand) VALUES (?, ?)');
  for (const entity of [...new Set(entities)]) insert.run(objectiveId, entity);
}

export function createMarketingObjective(input: CreateMarketingObjectiveInput) {
  const id = `mpo_${nanoid()}`;
  const now = new Date().toISOString();
  return runTransaction(() => {
    db.prepare(`
      INSERT INTO marketing_plan_objectives
        (id, plan_id, title, description, status, priority, period_year, quarter, why_it_matters,
         customer_market_context, commercial_relevance, marketing_rationale, next_review_date,
         sort_order, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.planId, input.title, input.description ?? '', input.status ?? 'draft', input.priority ?? 'tbc',
      input.periodYear, input.quarter ?? null, input.whyItMatters ?? '', input.customerMarketContext ?? '',
      input.commercialRelevance ?? '', input.marketingRationale ?? '', input.nextReviewDate ?? null,
      input.sortOrder ?? 0, input.notes ?? '', now, now
    );
    replaceObjectiveEntities(id, input.entities ?? []);
    const objective = getMarketingObjective(id)!;
    addHistory('objective', id, 'create', undefined, objective);
    return objective;
  });
}

const objectiveColumns: Record<string, string> = {
  title: 'title', description: 'description', status: 'status', priority: 'priority', periodYear: 'period_year',
  quarter: 'quarter', whyItMatters: 'why_it_matters', customerMarketContext: 'customer_market_context',
  commercialRelevance: 'commercial_relevance', marketingRationale: 'marketing_rationale',
  nextReviewDate: 'next_review_date', sortOrder: 'sort_order', notes: 'notes',
};

export function updateMarketingObjective(id: string, input: UpdateMarketingObjectiveInput) {
  const previous = getMarketingObjective(id);
  if (!previous) return null;
  const entries = Object.entries(input).filter(([key, value]) => key !== 'reason' && key !== 'entities' && value !== undefined && objectiveColumns[key]);
  if (entries.length === 0 && input.entities === undefined) return previous;
  return runTransaction(() => {
    if (entries.length > 0) {
      const set = entries.map(([key]) => `${objectiveColumns[key]} = ?`).concat('updated_at = ?').join(', ');
      const values = entries.map(([, value]) => value as SqlValue).concat(new Date().toISOString(), id);
      db.prepare(`UPDATE marketing_plan_objectives SET ${set} WHERE id = ?`).run(...values);
    }
    if (input.entities !== undefined) replaceObjectiveEntities(id, input.entities);
    const updated = getMarketingObjective(id)!;
    addHistory('objective', id, 'edit', previous, updated, input.reason);
    return updated;
  });
}

export function setMarketingObjectiveArchived(id: string, archived: boolean, reason?: string) {
  const previous = getMarketingObjective(id);
  if (!previous) return null;
  return runTransaction(() => {
    const now = new Date().toISOString();
    db.prepare('UPDATE marketing_plan_objectives SET archived = ?, archived_at = ?, updated_at = ? WHERE id = ?').run(archived ? 1 : 0, archived ? now : null, now, id);
    const updated = getMarketingObjective(id)!;
    addHistory('objective', id, archived ? 'archive' : 'restore', previous, updated, reason);
    return updated;
  });
}

function mapPriority(row: PriorityRow) {
  return {
    id: row.id, objectiveId: row.objective_id, title: row.title, description: row.description, status: row.status,
    sortOrder: row.sort_order, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at,
    archived: Boolean(row.archived), archivedAt: row.archived_at,
  };
}

export function listMarketingPriorities(objectiveId: string, includeArchived = false) {
  return (db.prepare(`SELECT * FROM marketing_plan_priorities WHERE objective_id = ? ${includeArchived ? '' : 'AND archived = 0'} ORDER BY sort_order, created_at`).all(objectiveId) as unknown as PriorityRow[]).map(mapPriority);
}

export function getMarketingPriority(id: string) {
  const row = db.prepare('SELECT * FROM marketing_plan_priorities WHERE id = ?').get(id) as unknown as PriorityRow | undefined;
  return row ? mapPriority(row) : null;
}

export function createMarketingPriority(input: CreateMarketingPriorityInput) {
  const id = `mpp_${nanoid()}`;
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO marketing_plan_priorities
    (id, objective_id, title, description, status, sort_order, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.objectiveId, input.title, input.description ?? '', input.status ?? 'draft', input.sortOrder ?? 0, input.notes ?? '', now, now);
  const priority = getMarketingPriority(id)!;
  addHistory('priority', id, 'create', undefined, priority);
  return priority;
}

const priorityColumns: Record<string, string> = {
  title: 'title', description: 'description', status: 'status', sortOrder: 'sort_order', notes: 'notes',
};

export function updateMarketingPriority(id: string, input: UpdateMarketingPriorityInput) {
  const previous = getMarketingPriority(id);
  if (!previous) return null;
  const entries = Object.entries(input).filter(([key, value]) => key !== 'reason' && value !== undefined && priorityColumns[key]);
  if (!entries.length) return previous;
  const set = entries.map(([key]) => `${priorityColumns[key]} = ?`).concat('updated_at = ?').join(', ');
  db.prepare(`UPDATE marketing_plan_priorities SET ${set} WHERE id = ?`).run(...entries.map(([, value]) => value as SqlValue), new Date().toISOString(), id);
  const updated = getMarketingPriority(id)!;
  addHistory('priority', id, 'edit', previous, updated, input.reason);
  return updated;
}

export function setMarketingPriorityArchived(id: string, archived: boolean, reason?: string) {
  const previous = getMarketingPriority(id);
  if (!previous) return null;
  const now = new Date().toISOString();
  db.prepare('UPDATE marketing_plan_priorities SET archived = ?, archived_at = ?, updated_at = ? WHERE id = ?').run(archived ? 1 : 0, archived ? now : null, now, id);
  const updated = getMarketingPriority(id)!;
  addHistory('priority', id, archived ? 'archive' : 'restore', previous, updated, reason);
  return updated;
}

export function reorderMarketingPriorities(objectiveId: string, ids: string[], reason?: string) {
  const current = listMarketingPriorities(objectiveId);
  if (current.length !== ids.length || current.some((priority) => !ids.includes(priority.id))) return null;
  return runTransaction(() => {
    const update = db.prepare('UPDATE marketing_plan_priorities SET sort_order = ?, updated_at = ? WHERE id = ? AND objective_id = ?');
    const now = new Date().toISOString();
    ids.forEach((id, index) => update.run(index, now, id, objectiveId));
    const reordered = listMarketingPriorities(objectiveId);
    addHistory('objective', objectiveId, 'reorder-priorities', current.map((item) => item.id), reordered.map((item) => item.id), reason);
    return reordered;
  });
}

function mapMilestone(row: MilestoneRow) {
  return {
    id: row.id, objectiveId: row.objective_id, priorityId: row.priority_id, level: row.level, title: row.title,
    description: row.description, status: row.status, periodYear: row.period_year, quarter: row.quarter,
    month: row.month, startDate: row.start_date, dueDate: row.due_date, attentionType: row.attention_type,
    sortOrder: row.sort_order, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at,
    archived: Boolean(row.archived), archivedAt: row.archived_at,
  };
}

export function listMarketingMilestones(objectiveId: string, includeArchived = false) {
  return (db.prepare(`SELECT * FROM marketing_plan_milestones WHERE objective_id = ? ${includeArchived ? '' : 'AND archived = 0'} ORDER BY sort_order, created_at`).all(objectiveId) as unknown as MilestoneRow[]).map(mapMilestone);
}

export function getMarketingMilestone(id: string) {
  const row = db.prepare('SELECT * FROM marketing_plan_milestones WHERE id = ?').get(id) as unknown as MilestoneRow | undefined;
  return row ? mapMilestone(row) : null;
}

export function createMarketingMilestone(input: CreateMarketingMilestoneInput) {
  const id = `mpm_${nanoid()}`;
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO marketing_plan_milestones
    (id, objective_id, priority_id, level, title, description, status, period_year, quarter, month, start_date,
     due_date, attention_type, sort_order, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.objectiveId, input.priorityId ?? null, input.level, input.title, input.description ?? '', input.status ?? 'draft', input.periodYear ?? null, input.quarter ?? null, input.month ?? null, input.startDate ?? null, input.dueDate ?? null, input.attentionType ?? null, input.sortOrder ?? 0, input.notes ?? '', now, now);
  const milestone = getMarketingMilestone(id)!;
  addHistory('milestone', id, 'create', undefined, milestone);
  return milestone;
}

const milestoneColumns: Record<string, string> = {
  priorityId: 'priority_id', level: 'level', title: 'title', description: 'description', status: 'status',
  periodYear: 'period_year', quarter: 'quarter', month: 'month', startDate: 'start_date', dueDate: 'due_date',
  attentionType: 'attention_type', sortOrder: 'sort_order', notes: 'notes',
};

export function updateMarketingMilestone(id: string, input: UpdateMarketingMilestoneInput) {
  const previous = getMarketingMilestone(id);
  if (!previous) return null;
  const entries = Object.entries(input).filter(([key, value]) => key !== 'reason' && value !== undefined && milestoneColumns[key]);
  if (!entries.length) return previous;
  const set = entries.map(([key]) => `${milestoneColumns[key]} = ?`).concat('updated_at = ?').join(', ');
  db.prepare(`UPDATE marketing_plan_milestones SET ${set} WHERE id = ?`).run(...entries.map(([, value]) => value as SqlValue), new Date().toISOString(), id);
  const updated = getMarketingMilestone(id)!;
  addHistory('milestone', id, 'edit', previous, updated, input.reason);
  return updated;
}

export function setMarketingMilestoneArchived(id: string, archived: boolean, reason?: string) {
  const previous = getMarketingMilestone(id);
  if (!previous) return null;
  const now = new Date().toISOString();
  db.prepare('UPDATE marketing_plan_milestones SET archived = ?, archived_at = ?, updated_at = ? WHERE id = ?').run(archived ? 1 : 0, archived ? now : null, now, id);
  const updated = getMarketingMilestone(id)!;
  addHistory('milestone', id, archived ? 'archive' : 'restore', previous, updated, reason);
  return updated;
}

export function listMarketingPlanHistory(resourceType: 'plan' | 'objective' | 'priority' | 'milestone', resourceId: string) {
  return db.prepare(`
    SELECT id, resource_type AS resourceType, resource_id AS resourceId, action, field_name AS fieldName,
           previous_value AS previousValue, new_value AS newValue, reason, source, changed_at AS changedAt
    FROM marketing_plan_history
    WHERE resource_type = ? AND resource_id = ?
    ORDER BY changed_at DESC, id DESC
  `).all(resourceType, resourceId);
}

export function listMarketingObjectiveHistory(objectiveId: string) {
  return db.prepare(`
    SELECT id, resource_type AS resourceType, resource_id AS resourceId, action, field_name AS fieldName,
           previous_value AS previousValue, new_value AS newValue, reason, source, changed_at AS changedAt
    FROM marketing_plan_history
    WHERE (resource_type = 'objective' AND resource_id = ?)
       OR (resource_type = 'priority' AND resource_id IN (SELECT id FROM marketing_plan_priorities WHERE objective_id = ?))
       OR (resource_type = 'milestone' AND resource_id IN (SELECT id FROM marketing_plan_milestones WHERE objective_id = ?))
    ORDER BY changed_at DESC, id DESC
  `).all(objectiveId, objectiveId, objectiveId);
}
