import { nanoid } from 'nanoid';
import db from './connection.js';
import type { Brand, FundingRecord, FundingRebateType, FundingClaimStatus, FundingBonusTier } from '../types.js';

interface FundingRow {
  id: string;
  brand: string;
  vendor: string;
  scheme_name: string;
  rebate_type: string;
  rebate_percent: number | null;
  total_purchases: number;
  amount_earned: number;
  amount_claimed: number;
  claim_status: string;
  claim_deadline: string | null;
  credited_frequency: string;
  target_spend: number | null;
  bonus_tiers: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: FundingRow): FundingRecord {
  const balanceToClaim = row.amount_earned - row.amount_claimed;
  const percentOfTarget = row.target_spend && row.target_spend > 0 ? (row.total_purchases / row.target_spend) * 100 : null;

  return {
    id: row.id,
    brand: row.brand as Brand,
    vendor: row.vendor,
    schemeName: row.scheme_name,
    rebateType: row.rebate_type as FundingRebateType,
    rebatePercent: row.rebate_percent,
    totalPurchases: row.total_purchases,
    amountEarned: row.amount_earned,
    amountClaimed: row.amount_claimed,
    balanceToClaim,
    claimStatus: row.claim_status as FundingClaimStatus,
    claimDeadline: row.claim_deadline,
    creditedFrequency: row.credited_frequency,
    targetSpend: row.target_spend,
    percentOfTarget,
    bonusTiers: row.bonus_tiers ? (JSON.parse(row.bonus_tiers) as FundingBonusTier[]) : [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllFundingRecords(): FundingRecord[] {
  const rows = db.prepare('SELECT * FROM funding_records ORDER BY created_at DESC').all() as unknown as FundingRow[];
  return rows.map(rowToRecord);
}

export function getFundingRecordById(id: string): FundingRecord | undefined {
  const row = db.prepare('SELECT * FROM funding_records WHERE id = ?').get(id) as unknown as FundingRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export interface NewFundingRecordInput {
  id?: string;
  brand: Brand;
  vendor: string;
  schemeName: string;
  rebateType?: FundingRebateType;
  rebatePercent?: number | null;
  totalPurchases?: number;
  amountEarned?: number;
  amountClaimed?: number;
  claimStatus?: FundingClaimStatus;
  claimDeadline?: string | null;
  creditedFrequency?: string;
  targetSpend?: number | null;
  bonusTiers?: FundingBonusTier[];
  notes?: string;
}

export function insertFundingRecord(input: NewFundingRecordInput): FundingRecord {
  const now = new Date().toISOString();
  const id = input.id ?? `funding-${nanoid(10)}`;

  db.prepare(
    `INSERT INTO funding_records (
      id, brand, vendor, scheme_name, rebate_type, rebate_percent,
      total_purchases, amount_earned, amount_claimed, claim_status,
      claim_deadline, credited_frequency, target_spend, bonus_tiers,
      notes, created_at, updated_at
    ) VALUES (@id, @brand, @vendor, @schemeName, @rebateType, @rebatePercent,
      @totalPurchases, @amountEarned, @amountClaimed, @claimStatus,
      @claimDeadline, @creditedFrequency, @targetSpend, @bonusTiers,
      @notes, @createdAt, @updatedAt)`
  ).run({
    id,
    brand: input.brand,
    vendor: input.vendor,
    schemeName: input.schemeName,
    rebateType: input.rebateType ?? 'other',
    rebatePercent: input.rebatePercent ?? null,
    totalPurchases: input.totalPurchases ?? 0,
    amountEarned: input.amountEarned ?? 0,
    amountClaimed: input.amountClaimed ?? 0,
    claimStatus: input.claimStatus ?? 'eligible',
    claimDeadline: input.claimDeadline ?? null,
    creditedFrequency: input.creditedFrequency ?? '',
    targetSpend: input.targetSpend ?? null,
    bonusTiers: JSON.stringify(input.bonusTiers ?? []),
    notes: input.notes ?? '',
    createdAt: now,
    updatedAt: now,
  });

  return getFundingRecordById(id)!;
}

export function updateFundingRecordRow(id: string, updates: Partial<NewFundingRecordInput>): FundingRecord | undefined {
  const existing = getFundingRecordById(id);
  if (!existing) return undefined;

  const merged = {
    brand: updates.brand ?? existing.brand,
    vendor: updates.vendor ?? existing.vendor,
    schemeName: updates.schemeName ?? existing.schemeName,
    rebateType: updates.rebateType ?? existing.rebateType,
    rebatePercent: updates.rebatePercent !== undefined ? updates.rebatePercent : existing.rebatePercent,
    totalPurchases: updates.totalPurchases ?? existing.totalPurchases,
    amountEarned: updates.amountEarned ?? existing.amountEarned,
    amountClaimed: updates.amountClaimed ?? existing.amountClaimed,
    claimStatus: updates.claimStatus ?? existing.claimStatus,
    claimDeadline: updates.claimDeadline !== undefined ? updates.claimDeadline : existing.claimDeadline,
    creditedFrequency: updates.creditedFrequency ?? existing.creditedFrequency,
    targetSpend: updates.targetSpend !== undefined ? updates.targetSpend : existing.targetSpend,
    bonusTiers: updates.bonusTiers ?? existing.bonusTiers,
    notes: updates.notes ?? existing.notes,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(
    `UPDATE funding_records SET
      brand = @brand, vendor = @vendor, scheme_name = @schemeName,
      rebate_type = @rebateType, rebate_percent = @rebatePercent,
      total_purchases = @totalPurchases, amount_earned = @amountEarned,
      amount_claimed = @amountClaimed, claim_status = @claimStatus,
      claim_deadline = @claimDeadline, credited_frequency = @creditedFrequency,
      target_spend = @targetSpend, bonus_tiers = @bonusTiers,
      notes = @notes, updated_at = @updatedAt
    WHERE id = @id`
  ).run({
    id,
    brand: merged.brand,
    vendor: merged.vendor,
    schemeName: merged.schemeName,
    rebateType: merged.rebateType,
    rebatePercent: merged.rebatePercent,
    totalPurchases: merged.totalPurchases,
    amountEarned: merged.amountEarned,
    amountClaimed: merged.amountClaimed,
    claimStatus: merged.claimStatus,
    claimDeadline: merged.claimDeadline,
    creditedFrequency: merged.creditedFrequency,
    targetSpend: merged.targetSpend,
    bonusTiers: JSON.stringify(merged.bonusTiers),
    notes: merged.notes,
    updatedAt: merged.updatedAt,
  });

  return getFundingRecordById(id);
}
