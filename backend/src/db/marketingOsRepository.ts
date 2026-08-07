import { db } from './connection.js';
import { nanoid } from 'nanoid';

export interface BusinessObjective {
  id: string;
  title: string;
  description: string;
  successStatement: string;
  metrics: Array<{ name: string; value?: string; target?: string }>;
  status: 'on-track' | 'at-risk' | 'off-track';
  progressPercentage: number;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  riskNotes?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

export interface DashboardContext {
  id: string;
  date: string;
  userProvidedContext: string;
  currentTasks: string[];
  recentActivity: string[];
  salesFeedback: string[];
  performanceObservations: string[];
  decisionsAwaiting: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyDashboardSnapshot {
  id: string;
  date: string;
  businessObjectiveStatus: Array<{
    objectiveId: string;
    title: string;
    status: string;
    progress: number;
    risks: string[];
  }>;
  priorities: Array<{
    rank: number;
    action: string;
    why: string;
    objectiveSupported: string;
    deadline?: string;
    expectedImpact: string;
    confidence: number;
    evidence: string[];
  }>;
  needsAttention: string[];
  opportunities: string[];
  claudeRecommendation: {
    recommendation: string;
    reasoning: string;
    evidence: string[];
    expectedOutcome: string;
  };
  confidenceNotes: string;
  generatedAt: string;
  sourcesUsed: string[];
}

function rowToObjective(row: any): BusinessObjective {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    successStatement: row.success_statement,
    metrics: JSON.parse(row.metrics),
    status: row.status,
    progressPercentage: row.progress_percentage,
    riskLevel: row.risk_level,
    riskNotes: row.risk_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archived: !!row.archived,
    archivedAt: row.archived_at ?? null,
  };
}

export function getAllBusinessObjectives(includeArchived = false): BusinessObjective[] {
  const where = includeArchived ? '' : 'WHERE archived = 0';
  const stmt = db.prepare(`SELECT * FROM business_objectives ${where} ORDER BY created_at ASC`);
  return stmt.all().map(rowToObjective);
}

export function getBusinessObjectiveById(id: string): BusinessObjective | null {
  const stmt = db.prepare('SELECT * FROM business_objectives WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;
  return rowToObjective(row);
}

export function archiveBusinessObjective(id: string): BusinessObjective | null {
  if (!getBusinessObjectiveById(id)) return null;
  db.prepare('UPDATE business_objectives SET archived = 1, archived_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  return getBusinessObjectiveById(id);
}

export function restoreBusinessObjective(id: string): BusinessObjective | null {
  if (!getBusinessObjectiveById(id)) return null;
  db.prepare('UPDATE business_objectives SET archived = 0, archived_at = NULL WHERE id = ?').run(id);
  return getBusinessObjectiveById(id);
}

export function upsertBusinessObjective(objective: Partial<BusinessObjective>): BusinessObjective {
  const now = new Date().toISOString();
  const id = objective.id || nanoid();

  const existing = getBusinessObjectiveById(id);

  if (existing) {
    const stmt = db.prepare(`
      UPDATE business_objectives
      SET title = ?, description = ?, success_statement = ?, metrics = ?,
          status = ?, progress_percentage = ?, risk_level = ?, risk_notes = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      objective.title || existing.title,
      objective.description || existing.description,
      objective.successStatement || existing.successStatement,
      JSON.stringify(objective.metrics || existing.metrics),
      objective.status || existing.status,
      objective.progressPercentage ?? existing.progressPercentage,
      objective.riskLevel || existing.riskLevel,
      objective.riskNotes ?? existing.riskNotes ?? '',
      now,
      id
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO business_objectives
      (id, title, description, success_statement, metrics, status, progress_percentage, risk_level, risk_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      objective.title || '',
      objective.description || '',
      objective.successStatement || '',
      JSON.stringify(objective.metrics || []),
      objective.status || 'on-track',
      objective.progressPercentage || 0,
      objective.riskLevel || 'none',
      objective.riskNotes || '',
      now,
      now
    );
  }

  return getBusinessObjectiveById(id)!;
}

export function getDashboardContextForDate(date: string): DashboardContext | null {
  const stmt = db.prepare('SELECT * FROM dashboard_context WHERE date = ?');
  const row = stmt.get(date) as any;
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    userProvidedContext: row.user_provided_context,
    currentTasks: JSON.parse(row.current_tasks),
    recentActivity: JSON.parse(row.recent_activity),
    salesFeedback: JSON.parse(row.sales_feedback),
    performanceObservations: JSON.parse(row.performance_observations),
    decisionsAwaiting: JSON.parse(row.decisions_awaiting),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function upsertDashboardContext(context: Omit<DashboardContext, 'id' | 'createdAt' | 'updatedAt'>): DashboardContext {
  const now = new Date().toISOString();
  const existing = getDashboardContextForDate(context.date);

  if (existing) {
    const stmt = db.prepare(`
      UPDATE dashboard_context
      SET user_provided_context = ?, current_tasks = ?, recent_activity = ?,
          sales_feedback = ?, performance_observations = ?, decisions_awaiting = ?, updated_at = ?
      WHERE date = ?
    `);
    stmt.run(
      context.userProvidedContext,
      JSON.stringify(context.currentTasks),
      JSON.stringify(context.recentActivity),
      JSON.stringify(context.salesFeedback),
      JSON.stringify(context.performanceObservations),
      JSON.stringify(context.decisionsAwaiting),
      now,
      context.date
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO dashboard_context
      (id, date, user_provided_context, current_tasks, recent_activity, sales_feedback, performance_observations, decisions_awaiting, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      nanoid(),
      context.date,
      context.userProvidedContext,
      JSON.stringify(context.currentTasks),
      JSON.stringify(context.recentActivity),
      JSON.stringify(context.salesFeedback),
      JSON.stringify(context.performanceObservations),
      JSON.stringify(context.decisionsAwaiting),
      now,
      now
    );
  }

  return getDashboardContextForDate(context.date)!;
}

export function getDailyDashboardSnapshot(date: string): DailyDashboardSnapshot | null {
  const stmt = db.prepare('SELECT * FROM daily_dashboard_snapshot WHERE date = ?');
  const row = stmt.get(date) as any;
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    businessObjectiveStatus: JSON.parse(row.business_objective_status),
    priorities: JSON.parse(row.priorities),
    needsAttention: JSON.parse(row.needs_attention),
    opportunities: JSON.parse(row.opportunities),
    claudeRecommendation: JSON.parse(row.claude_recommendation),
    confidenceNotes: row.confidence_notes,
    generatedAt: row.generated_at,
    sourcesUsed: JSON.parse(row.sources_used),
  };
}

export function saveDailyDashboardSnapshot(snapshot: DailyDashboardSnapshot): void {
  const existing = getDailyDashboardSnapshot(snapshot.date);

  if (existing) {
    const stmt = db.prepare(`
      UPDATE daily_dashboard_snapshot
      SET business_objective_status = ?, priorities = ?, needs_attention = ?,
          opportunities = ?, claude_recommendation = ?, confidence_notes = ?, sources_used = ?
      WHERE date = ?
    `);
    stmt.run(
      JSON.stringify(snapshot.businessObjectiveStatus),
      JSON.stringify(snapshot.priorities),
      JSON.stringify(snapshot.needsAttention),
      JSON.stringify(snapshot.opportunities),
      JSON.stringify(snapshot.claudeRecommendation),
      snapshot.confidenceNotes,
      JSON.stringify(snapshot.sourcesUsed),
      snapshot.date
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO daily_dashboard_snapshot
      (id, date, business_objective_status, priorities, needs_attention, opportunities, claude_recommendation, confidence_notes, generated_at, sources_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      snapshot.id,
      snapshot.date,
      JSON.stringify(snapshot.businessObjectiveStatus),
      JSON.stringify(snapshot.priorities),
      JSON.stringify(snapshot.needsAttention),
      JSON.stringify(snapshot.opportunities),
      JSON.stringify(snapshot.claudeRecommendation),
      snapshot.confidenceNotes,
      snapshot.generatedAt,
      JSON.stringify(snapshot.sourcesUsed)
    );
  }
}
