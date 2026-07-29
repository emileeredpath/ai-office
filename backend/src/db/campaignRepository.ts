import { nanoid } from 'nanoid';
import db from './connection.js';
import type { Brand } from '../types.js';

export type CampaignStatus = 'planning' | 'active' | 'on-hold' | 'completed';

export interface CampaignResults {
  emailOpenRate?: number | null;
  emailClickRate?: number | null;
  unsubscribes?: number | null;
  landingPageVisits?: number | null;
  enquiriesReceived?: number | null;
  costToSend?: number | null;
  notes?: string;
  loggedAt?: string;
}

export interface CampaignRecord {
  id: string;
  name: string;
  brand: Brand;
  entities: Brand[];
  primaryIndustry: string;
  secondaryIndustry: string;
  theme: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  budget: number | null;
  spend: number;
  conversions: number;
  leads: number;
  engagement: number;
  colour: string;
  reactive: boolean;
  notes: string;
  results: CampaignResults | null;
  createdAt: string;
  updatedAt: string;
}

interface CampaignRow {
  id: string;
  name: string;
  brand: string;
  entities: string;
  primary_industry: string;
  secondary_industry: string;
  theme: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  spend: number;
  conversions: number;
  leads: number;
  engagement: number;
  colour: string;
  reactive: number;
  notes: string;
  results: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: CampaignRow): CampaignRecord {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand as Brand,
    entities: JSON.parse(row.entities) as Brand[],
    primaryIndustry: row.primary_industry,
    secondaryIndustry: row.secondary_industry,
    theme: row.theme,
    status: row.status as CampaignStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    budget: row.budget,
    spend: row.spend,
    conversions: row.conversions,
    leads: row.leads,
    engagement: row.engagement,
    colour: row.colour,
    reactive: !!row.reactive,
    notes: row.notes,
    results: row.results ? (JSON.parse(row.results) as CampaignResults) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllCampaigns(): CampaignRecord[] {
  const rows = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all() as unknown as CampaignRow[];
  return rows.map(rowToRecord);
}

export function getCampaignById(id: string): CampaignRecord | undefined {
  const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as unknown as CampaignRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export interface NewCampaignInput {
  id?: string;
  name: string;
  brand: Brand;
  entities?: Brand[];
  primaryIndustry?: string;
  secondaryIndustry?: string;
  theme?: string;
  status?: CampaignStatus;
  startDate: string;
  endDate: string;
  budget?: number | null;
  spend?: number;
  conversions?: number;
  leads?: number;
  engagement?: number;
  colour?: string;
  reactive?: boolean;
  notes?: string;
  results?: CampaignResults | null;
}

export function insertCampaign(input: NewCampaignInput): CampaignRecord {
  const now = new Date().toISOString();
  const id = input.id ?? `campaign-${nanoid(10)}`;

  db.prepare(
    `INSERT INTO campaigns (
      id, name, brand, entities, primary_industry, secondary_industry, theme, status,
      start_date, end_date, budget, spend, conversions, leads, engagement, colour,
      reactive, notes, results, created_at, updated_at
    ) VALUES (@id, @name, @brand, @entities, @primaryIndustry, @secondaryIndustry, @theme, @status,
      @startDate, @endDate, @budget, @spend, @conversions, @leads, @engagement, @colour,
      @reactive, @notes, @results, @createdAt, @updatedAt)`
  ).run({
    id,
    name: input.name,
    brand: input.brand,
    entities: JSON.stringify(input.entities && input.entities.length > 0 ? input.entities : [input.brand]),
    primaryIndustry: input.primaryIndustry ?? '',
    secondaryIndustry: input.secondaryIndustry ?? '',
    theme: input.theme ?? '',
    status: input.status ?? 'planning',
    startDate: input.startDate,
    endDate: input.endDate,
    budget: input.budget ?? null,
    spend: input.spend ?? 0,
    conversions: input.conversions ?? 0,
    leads: input.leads ?? 0,
    engagement: input.engagement ?? 0,
    colour: input.colour ?? '#3B82F6',
    reactive: input.reactive ? 1 : 0,
    notes: input.notes ?? '',
    results: input.results ? JSON.stringify(input.results) : null,
    createdAt: now,
    updatedAt: now,
  });

  return getCampaignById(id)!;
}

export function updateCampaignRow(id: string, updates: Partial<NewCampaignInput>): CampaignRecord | undefined {
  const existing = getCampaignById(id);
  if (!existing) return undefined;

  const merged: CampaignRecord = {
    ...existing,
    ...updates,
    entities: updates.entities ?? existing.entities,
    results: updates.results !== undefined ? updates.results : existing.results,
    updatedAt: new Date().toISOString(),
  } as CampaignRecord;

  db.prepare(
    `UPDATE campaigns SET
      name = @name, brand = @brand, entities = @entities, primary_industry = @primaryIndustry,
      secondary_industry = @secondaryIndustry, theme = @theme, status = @status,
      start_date = @startDate, end_date = @endDate, budget = @budget, spend = @spend,
      conversions = @conversions, leads = @leads, engagement = @engagement, colour = @colour,
      reactive = @reactive, notes = @notes, results = @results, updated_at = @updatedAt
    WHERE id = @id`
  ).run({
    id: merged.id,
    name: merged.name,
    brand: merged.brand,
    entities: JSON.stringify(merged.entities),
    primaryIndustry: merged.primaryIndustry,
    secondaryIndustry: merged.secondaryIndustry,
    theme: merged.theme,
    status: merged.status,
    startDate: merged.startDate,
    endDate: merged.endDate,
    budget: merged.budget,
    spend: merged.spend,
    conversions: merged.conversions,
    leads: merged.leads,
    engagement: merged.engagement,
    colour: merged.colour,
    reactive: merged.reactive ? 1 : 0,
    notes: merged.notes,
    results: merged.results ? JSON.stringify(merged.results) : null,
    updatedAt: merged.updatedAt,
  });

  return getCampaignById(id);
}

export function deleteCampaignRow(id: string): boolean {
  const result = db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getCampaignProgress(id: string): { total: number; complete: number } {
  const row = db
    .prepare(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as complete
       FROM tasks WHERE campaign_id = ?`
    )
    .get(id) as unknown as { total: number; complete: number | null };
  return { total: row.total, complete: row.complete ?? 0 };
}
