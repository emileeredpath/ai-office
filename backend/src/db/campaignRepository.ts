import { nanoid } from 'nanoid';
import db from './connection.js';
import type { Brand, TrackingLink } from '../types.js';

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
  // Phase 1 fields
  industry?: string;
  recipients?: number | null;
  valueGenerated?: number | null;
  vendor?: string | null;
  scheme?: string | null;
  cofundRate?: number | null;
  claimStatus?: string | null;
  schedule?: Array<{ date: string; element: string; status: string }>;
  trackingLinks?: TrackingLink[];
  archived: boolean;
  archivedAt: string | null;
  // Central campaign-attribution identifiers (Campaign Attribution phase) —
  // see connection.ts's addColumnIfMissing comment for exactly what each is
  // and isn't matched against. Both entirely manual/user-entered, never
  // inferred.
  campaignCode: string | null;
  googleAdsCampaignIds: string[];
  ga4CampaignNames: string[];
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
  // Phase 1 fields
  industry?: string;
  recipients?: number | null;
  value_generated?: number | null;
  vendor?: string | null;
  scheme?: string | null;
  cofund_rate?: number | null;
  claim_status?: string | null;
  schedule?: string | null;
  tracking_links?: string | null;
  archived?: number;
  archived_at?: string | null;
  campaign_code?: string | null;
  google_ads_campaign_ids?: string | null;
  ga4_campaign_names?: string | null;
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
    industry: row.industry,
    recipients: row.recipients,
    valueGenerated: row.value_generated,
    vendor: row.vendor,
    scheme: row.scheme,
    cofundRate: row.cofund_rate,
    claimStatus: row.claim_status,
    schedule: row.schedule ? (JSON.parse(row.schedule) as Array<{ date: string; element: string; status: string }>) : undefined,
    trackingLinks: row.tracking_links ? (JSON.parse(row.tracking_links) as TrackingLink[]) : [],
    archived: !!row.archived,
    archivedAt: row.archived_at ?? null,
    campaignCode: row.campaign_code ?? null,
    googleAdsCampaignIds: row.google_ads_campaign_ids ? (JSON.parse(row.google_ads_campaign_ids) as string[]) : [],
    ga4CampaignNames: row.ga4_campaign_names ? (JSON.parse(row.ga4_campaign_names) as string[]) : [],
  };
}

export function getAllCampaigns(includeArchived = false): CampaignRecord[] {
  const where = includeArchived ? '' : 'WHERE archived = 0';
  const rows = db.prepare(`SELECT * FROM campaigns ${where} ORDER BY created_at DESC`).all() as unknown as CampaignRow[];
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
  // Phase 1 fields
  industry?: string;
  recipients?: number | null;
  valueGenerated?: number | null;
  vendor?: string | null;
  scheme?: string | null;
  cofundRate?: number | null;
  claimStatus?: string | null;
  schedule?: Array<{ date: string; element: string; status: string }>;
  trackingLinks?: TrackingLink[];
  campaignCode?: string | null;
  googleAdsCampaignIds?: string[];
  ga4CampaignNames?: string[];
}

export function insertCampaign(input: NewCampaignInput): CampaignRecord {
  const now = new Date().toISOString();
  const id = input.id ?? `campaign-${nanoid(10)}`;

  db.prepare(
    `INSERT INTO campaigns (
      id, name, brand, entities, primary_industry, secondary_industry, theme, status,
      start_date, end_date, budget, spend, conversions, leads, engagement, colour,
      reactive, notes, results, created_at, updated_at, industry, recipients, value_generated,
      vendor, scheme, cofund_rate, claim_status, schedule, tracking_links,
      campaign_code, google_ads_campaign_ids, ga4_campaign_names
    ) VALUES (@id, @name, @brand, @entities, @primaryIndustry, @secondaryIndustry, @theme, @status,
      @startDate, @endDate, @budget, @spend, @conversions, @leads, @engagement, @colour,
      @reactive, @notes, @results, @createdAt, @updatedAt, @industry, @recipients, @valueGenerated,
      @vendor, @scheme, @cofundRate, @claimStatus, @schedule, @trackingLinks,
      @campaignCode, @googleAdsCampaignIds, @ga4CampaignNames)`
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
    industry: input.industry ?? '',
    recipients: input.recipients ?? null,
    valueGenerated: input.valueGenerated ?? null,
    vendor: input.vendor ?? null,
    scheme: input.scheme ?? null,
    cofundRate: input.cofundRate ?? null,
    claimStatus: input.claimStatus ?? null,
    schedule: input.schedule ? JSON.stringify(input.schedule) : null,
    trackingLinks: JSON.stringify(input.trackingLinks ?? []),
    campaignCode: input.campaignCode ?? null,
    googleAdsCampaignIds: JSON.stringify(input.googleAdsCampaignIds ?? []),
    ga4CampaignNames: JSON.stringify(input.ga4CampaignNames ?? []),
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
    schedule: updates.schedule !== undefined ? updates.schedule : existing.schedule,
    trackingLinks: updates.trackingLinks !== undefined ? updates.trackingLinks : existing.trackingLinks,
    campaignCode: updates.campaignCode !== undefined ? updates.campaignCode : existing.campaignCode,
    googleAdsCampaignIds: updates.googleAdsCampaignIds !== undefined ? updates.googleAdsCampaignIds : existing.googleAdsCampaignIds,
    ga4CampaignNames: updates.ga4CampaignNames !== undefined ? updates.ga4CampaignNames : existing.ga4CampaignNames,
    updatedAt: new Date().toISOString(),
  } as CampaignRecord;

  db.prepare(
    `UPDATE campaigns SET
      name = @name, brand = @brand, entities = @entities, primary_industry = @primaryIndustry,
      secondary_industry = @secondaryIndustry, theme = @theme, status = @status,
      start_date = @startDate, end_date = @endDate, budget = @budget, spend = @spend,
      conversions = @conversions, leads = @leads, engagement = @engagement, colour = @colour,
      reactive = @reactive, notes = @notes, results = @results, updated_at = @updatedAt,
      industry = @industry, recipients = @recipients, value_generated = @valueGenerated,
      vendor = @vendor, scheme = @scheme, cofund_rate = @cofundRate, claim_status = @claimStatus,
      schedule = @schedule, tracking_links = @trackingLinks,
      campaign_code = @campaignCode, google_ads_campaign_ids = @googleAdsCampaignIds,
      ga4_campaign_names = @ga4CampaignNames
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
    industry: merged.industry ?? '',
    recipients: merged.recipients ?? null,
    valueGenerated: merged.valueGenerated ?? null,
    vendor: merged.vendor ?? null,
    scheme: merged.scheme ?? null,
    cofundRate: merged.cofundRate ?? null,
    claimStatus: merged.claimStatus ?? null,
    schedule: merged.schedule ? JSON.stringify(merged.schedule) : null,
    trackingLinks: JSON.stringify(merged.trackingLinks ?? []),
    campaignCode: merged.campaignCode ?? null,
    googleAdsCampaignIds: JSON.stringify(merged.googleAdsCampaignIds ?? []),
    ga4CampaignNames: JSON.stringify(merged.ga4CampaignNames ?? []),
  });

  return getCampaignById(id);
}

export function deleteCampaignRow(id: string): boolean {
  const result = db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
  return result.changes > 0;
}

// Actual spend is preferably the sum of its tasks' costs (see the Calendar
// Improvements + Cost Tracking brief) — called whenever a task's cost or
// campaign link changes. A campaign with no costed tasks keeps whatever
// spend was last set manually (via the dashboard or update_campaign), so
// this never clobbers a manually-entered figure with a false zero.
export function recalculateCampaignSpend(campaignId: string): CampaignRecord | undefined {
  const row = db
    .prepare(`SELECT SUM(cost) as total FROM tasks WHERE campaign_id = ? AND cost IS NOT NULL`)
    .get(campaignId) as unknown as { total: number | null };
  if (row.total === null) return getCampaignById(campaignId);
  return updateCampaignRow(campaignId, { spend: row.total });
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

export function archiveCampaign(id: string): CampaignRecord | undefined {
  const existing = getCampaignById(id);
  if (!existing) return undefined;
  db.prepare('UPDATE campaigns SET archived = 1, archived_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  return getCampaignById(id);
}

export function restoreCampaign(id: string): CampaignRecord | undefined {
  const existing = getCampaignById(id);
  if (!existing) return undefined;
  db.prepare('UPDATE campaigns SET archived = 0, archived_at = NULL WHERE id = ?').run(id);
  return getCampaignById(id);
}
