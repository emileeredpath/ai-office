import { nanoid } from 'nanoid';
import db from './connection.js';
import type { Brand } from '../types.js';
import type { CommercialStatus } from '../services/acumaticaKpiRules.js';

export type { CommercialStatus };

export interface AcumaticaOpportunityRecord {
  id: string;
  opportunityId: string;
  createdOn: string | null;
  status: string | null;
  stage: string | null;
  commercialStatus: CommercialStatus;
  total: number | null;
  estimatedCloseDate: string | null;
  opportunityClass: string | null;
  owner: string | null;
  sourceLead: string | null;
  heardAboutUs: string | null;
  productFocus: string | null;
  probability: number | null;
  industrySector: string | null;
  proposalSent: string | null;
  hireType: string | null;
  quantityUnits: number | null;
  brand: Brand | null;
  source: string;
  sourceFilename: string | null;
  importedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface OpportunityRow {
  id: string;
  opportunity_id: string;
  created_on: string | null;
  status: string | null;
  stage: string | null;
  commercial_status: string;
  total: number | null;
  estimated_close_date: string | null;
  opportunity_class: string | null;
  owner: string | null;
  source_lead: string | null;
  heard_about_us: string | null;
  product_focus: string | null;
  probability: number | null;
  industry_sector: string | null;
  proposal_sent: string | null;
  hire_type: string | null;
  quantity_units: number | null;
  brand: string | null;
  source: string;
  source_filename: string | null;
  imported_at: string;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: OpportunityRow): AcumaticaOpportunityRecord {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    createdOn: row.created_on,
    status: row.status,
    stage: row.stage,
    commercialStatus: row.commercial_status as CommercialStatus,
    total: row.total,
    estimatedCloseDate: row.estimated_close_date,
    opportunityClass: row.opportunity_class,
    owner: row.owner,
    sourceLead: row.source_lead,
    heardAboutUs: row.heard_about_us,
    productFocus: row.product_focus,
    probability: row.probability,
    industrySector: row.industry_sector,
    proposalSent: row.proposal_sent,
    hireType: row.hire_type,
    quantityUnits: row.quantity_units,
    brand: row.brand as Brand | null,
    source: row.source,
    sourceFilename: row.source_filename,
    importedAt: row.imported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllOpportunities(): AcumaticaOpportunityRecord[] {
  const rows = db.prepare('SELECT * FROM acumatica_opportunities ORDER BY created_on DESC').all() as unknown as OpportunityRow[];
  return rows.map(rowToRecord);
}

export function findOpportunityByExternalId(opportunityId: string): AcumaticaOpportunityRecord | undefined {
  const row = db.prepare('SELECT * FROM acumatica_opportunities WHERE opportunity_id = ?').get(opportunityId) as unknown as OpportunityRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export type UpsertOpportunityInput = Omit<AcumaticaOpportunityRecord, 'id' | 'createdAt' | 'updatedAt' | 'source'>;

// Re-importing the same opportunityId updates the existing row in place —
// never a duplicate — matching the Discovery brief's dedup requirement.
export function upsertOpportunity(input: UpsertOpportunityInput): { record: AcumaticaOpportunityRecord; wasCreated: boolean } {
  const existing = findOpportunityByExternalId(input.opportunityId);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE acumatica_opportunities SET
        created_on = @createdOn, status = @status, stage = @stage, commercial_status = @commercialStatus,
        total = @total, estimated_close_date = @estimatedCloseDate, opportunity_class = @opportunityClass,
        owner = @owner, source_lead = @sourceLead, heard_about_us = @heardAboutUs, product_focus = @productFocus,
        probability = @probability, industry_sector = @industrySector, proposal_sent = @proposalSent,
        hire_type = @hireType, quantity_units = @quantityUnits, brand = @brand,
        source_filename = @sourceFilename, imported_at = @importedAt, updated_at = @updatedAt
      WHERE opportunity_id = @opportunityId`
    ).run({ ...input, updatedAt: now });
    return { record: findOpportunityByExternalId(input.opportunityId)!, wasCreated: false };
  }

  const id = `acumatica-opp-${nanoid(10)}`;
  db.prepare(
    `INSERT INTO acumatica_opportunities (
      id, opportunity_id, created_on, status, stage, commercial_status, total, estimated_close_date,
      opportunity_class, owner, source_lead, heard_about_us, product_focus, probability, industry_sector,
      proposal_sent, hire_type, quantity_units, brand, source, source_filename, imported_at, created_at, updated_at
    ) VALUES (
      @id, @opportunityId, @createdOn, @status, @stage, @commercialStatus, @total, @estimatedCloseDate,
      @opportunityClass, @owner, @sourceLead, @heardAboutUs, @productFocus, @probability, @industrySector,
      @proposalSent, @hireType, @quantityUnits, @brand, 'acumatica_manual', @sourceFilename, @importedAt, @createdAt, @updatedAt
    )`
  ).run({ ...input, id, createdAt: now, updatedAt: now });
  return { record: findOpportunityByExternalId(input.opportunityId)!, wasCreated: true };
}

export interface AcumaticaImportLogEntry {
  id: string;
  filename: string;
  recognisedColumns: string[];
  ignoredPersonalDataColumns: string[];
  processed: number;
  created: number;
  updated: number;
  rejected: number;
  errors: string[];
  importedAt: string;
}

interface ImportLogRow {
  id: string;
  filename: string;
  recognised_columns: string;
  ignored_personal_data_columns: string;
  processed: number;
  created: number;
  updated: number;
  rejected: number;
  errors: string;
  imported_at: string;
}

export function recordImportLog(entry: Omit<AcumaticaImportLogEntry, 'id'>): AcumaticaImportLogEntry {
  const id = `acumatica-import-${nanoid(10)}`;
  db.prepare(
    `INSERT INTO acumatica_imports (
      id, filename, recognised_columns, ignored_personal_data_columns, processed, created, updated, rejected, errors, imported_at
    ) VALUES (@id, @filename, @recognisedColumns, @ignoredPersonalDataColumns, @processed, @created, @updated, @rejected, @errors, @importedAt)`
  ).run({
    id,
    filename: entry.filename,
    recognisedColumns: JSON.stringify(entry.recognisedColumns),
    ignoredPersonalDataColumns: JSON.stringify(entry.ignoredPersonalDataColumns),
    processed: entry.processed,
    created: entry.created,
    updated: entry.updated,
    rejected: entry.rejected,
    errors: JSON.stringify(entry.errors),
    importedAt: entry.importedAt,
  });
  return { id, ...entry };
}

export function getLastImportLog(): AcumaticaImportLogEntry | undefined {
  const row = db.prepare('SELECT * FROM acumatica_imports ORDER BY imported_at DESC LIMIT 1').get() as unknown as ImportLogRow | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    filename: row.filename,
    recognisedColumns: JSON.parse(row.recognised_columns) as string[],
    ignoredPersonalDataColumns: JSON.parse(row.ignored_personal_data_columns) as string[],
    processed: row.processed,
    created: row.created,
    updated: row.updated,
    rejected: row.rejected,
    errors: JSON.parse(row.errors) as string[],
    importedAt: row.imported_at,
  };
}
