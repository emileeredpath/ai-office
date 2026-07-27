import db from './connection.js';

export interface MarketingObjective {
  id: string;
  brand: string;
  title: string;
  description: string;
  targetAudience: string;
  kpis: string[];
  timeframe: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardContext {
  id: string;
  objectiveId: string;
  marketAnalysis: string;
  competitors: string[];
  assumptions: Record<string, string>;
  createdAt: string;
}

export interface StrategySnapshot {
  id: string;
  objectiveId: string;
  title: string;
  strategy: string;
  tactics: string[];
  metrics: Record<string, string>;
  generatedAt: string;
}

export function initMarketingTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS marketing_objectives (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      targetAudience TEXT NOT NULL,
      kpis TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      budget REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_contexts (
      id TEXT PRIMARY KEY,
      objectiveId TEXT NOT NULL,
      marketAnalysis TEXT NOT NULL,
      competitors TEXT NOT NULL,
      assumptions TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (objectiveId) REFERENCES marketing_objectives(id)
    );

    CREATE TABLE IF NOT EXISTS strategy_snapshots (
      id TEXT PRIMARY KEY,
      objectiveId TEXT NOT NULL,
      title TEXT NOT NULL,
      strategy TEXT NOT NULL,
      tactics TEXT NOT NULL,
      metrics TEXT NOT NULL,
      generatedAt TEXT NOT NULL,
      FOREIGN KEY (objectiveId) REFERENCES marketing_objectives(id)
    );
  `);
}

export function createObjective(objective: Omit<MarketingObjective, 'id' | 'createdAt' | 'updatedAt'>): MarketingObjective {
  const id = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO marketing_objectives (id, brand, title, description, targetAudience, kpis, timeframe, budget, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, objective.brand, objective.title, objective.description, objective.targetAudience, JSON.stringify(objective.kpis), objective.timeframe, objective.budget || null, now, now);

  return { ...objective, id, createdAt: now, updatedAt: now };
}

export function getObjective(id: string): MarketingObjective | null {
  const stmt = db.prepare('SELECT * FROM marketing_objectives WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    ...row,
    kpis: JSON.parse(row.kpis)
  };
}

export function listObjectives(brand: string): MarketingObjective[] {
  const stmt = db.prepare('SELECT * FROM marketing_objectives WHERE brand = ? ORDER BY createdAt DESC');
  const rows = stmt.all(brand) as any[];

  return rows.map(row => ({
    ...row,
    kpis: JSON.parse(row.kpis)
  }));
}

export function updateObjective(id: string, updates: Partial<Omit<MarketingObjective, 'id' | 'createdAt' | 'updatedAt'>>): MarketingObjective | null {
  const objective = getObjective(id);
  if (!objective) return null;

  const updated = { ...objective, ...updates, updatedAt: new Date().toISOString() };

  const stmt = db.prepare(`
    UPDATE marketing_objectives
    SET title = ?, description = ?, targetAudience = ?, kpis = ?, timeframe = ?, budget = ?, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(updated.title, updated.description, updated.targetAudience, JSON.stringify(updated.kpis), updated.timeframe, updated.budget || null, updated.updatedAt, id);

  return updated;
}

export function saveDashboardContext(context: Omit<DashboardContext, 'id' | 'createdAt'>): DashboardContext {
  const id = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO dashboard_contexts (id, objectiveId, marketAnalysis, competitors, assumptions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, context.objectiveId, context.marketAnalysis, JSON.stringify(context.competitors), JSON.stringify(context.assumptions), now);

  return { ...context, id, createdAt: now };
}

export function getLatestContext(objectiveId: string): DashboardContext | null {
  const stmt = db.prepare('SELECT * FROM dashboard_contexts WHERE objectiveId = ? ORDER BY createdAt DESC LIMIT 1');
  const row = stmt.get(objectiveId) as any;

  if (!row) return null;

  return {
    ...row,
    competitors: JSON.parse(row.competitors),
    assumptions: JSON.parse(row.assumptions)
  };
}

export function saveStrategySnapshot(snapshot: Omit<StrategySnapshot, 'id' | 'generatedAt'>): StrategySnapshot {
  const id = `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO strategy_snapshots (id, objectiveId, title, strategy, tactics, metrics, generatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, snapshot.objectiveId, snapshot.title, snapshot.strategy, JSON.stringify(snapshot.tactics), JSON.stringify(snapshot.metrics), now);

  return { ...snapshot, id, generatedAt: now };
}

export function listSnapshots(objectiveId: string): StrategySnapshot[] {
  const stmt = db.prepare('SELECT * FROM strategy_snapshots WHERE objectiveId = ? ORDER BY generatedAt DESC');
  const rows = stmt.all(objectiveId) as any[];

  return rows.map(row => ({
    ...row,
    tactics: JSON.parse(row.tactics),
    metrics: JSON.parse(row.metrics)
  }));
}
