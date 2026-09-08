import { nanoid } from 'nanoid';
import db from './connection.js';
import type { CampaignCost, CampaignCostCategory } from '../types.js';

interface CampaignCostRow {
  id: string;
  campaign_id: string;
  category: string;
  description: string;
  amount: number;
  cost_date: string;
  supplier_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: CampaignCostRow): CampaignCost {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    category: row.category as CampaignCostCategory,
    description: row.description,
    amount: row.amount,
    costDate: row.cost_date,
    supplierReference: row.supplier_reference,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Ordered oldest-first by cost_date so the cost table reads as a timeline —
// callers that want a total just sum the array (see canonical calculation
// logic in the frontend's src/utils/campaignCosts.ts).
export function getCampaignCosts(campaignId?: string): CampaignCost[] {
  const rows = campaignId
    ? (db.prepare('SELECT * FROM campaign_costs WHERE campaign_id = ? ORDER BY cost_date ASC, created_at ASC').all(campaignId) as unknown as CampaignCostRow[])
    : (db.prepare('SELECT * FROM campaign_costs ORDER BY cost_date ASC, created_at ASC').all() as unknown as CampaignCostRow[]);
  return rows.map(rowToRecord);
}

export function getCampaignCostById(id: string): CampaignCost | undefined {
  const row = db.prepare('SELECT * FROM campaign_costs WHERE id = ?').get(id) as unknown as CampaignCostRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export interface NewCampaignCostInput {
  id?: string;
  campaignId: string;
  category: CampaignCostCategory;
  description: string;
  amount: number;
  costDate: string;
  supplierReference?: string | null;
  notes?: string | null;
}

export function insertCampaignCost(input: NewCampaignCostInput): CampaignCost {
  const now = new Date().toISOString();
  const id = input.id ?? `campaign-cost-${nanoid(10)}`;

  db.prepare(
    `INSERT INTO campaign_costs (
      id, campaign_id, category, description, amount, cost_date,
      supplier_reference, notes, created_at, updated_at
    ) VALUES (@id, @campaignId, @category, @description, @amount, @costDate,
      @supplierReference, @notes, @createdAt, @updatedAt)`
  ).run({
    id,
    campaignId: input.campaignId,
    category: input.category,
    description: input.description,
    amount: input.amount,
    costDate: input.costDate,
    supplierReference: input.supplierReference ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return getCampaignCostById(id)!;
}

export type CampaignCostUpdateInput = Partial<Omit<NewCampaignCostInput, 'id' | 'campaignId'>>;

export function updateCampaignCostRow(id: string, updates: CampaignCostUpdateInput): CampaignCost | undefined {
  const existing = getCampaignCostById(id);
  if (!existing) return undefined;

  const merged = {
    category: updates.category ?? existing.category,
    description: updates.description ?? existing.description,
    amount: updates.amount ?? existing.amount,
    costDate: updates.costDate ?? existing.costDate,
    supplierReference: updates.supplierReference !== undefined ? updates.supplierReference : existing.supplierReference,
    notes: updates.notes !== undefined ? updates.notes : existing.notes,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(
    `UPDATE campaign_costs SET
      category = @category, description = @description, amount = @amount,
      cost_date = @costDate, supplier_reference = @supplierReference,
      notes = @notes, updated_at = @updatedAt
    WHERE id = @id`
  ).run({ id, ...merged });

  return getCampaignCostById(id);
}

export function deleteCampaignCostRow(id: string): boolean {
  const result = db.prepare('DELETE FROM campaign_costs WHERE id = ?').run(id);
  return result.changes > 0;
}
