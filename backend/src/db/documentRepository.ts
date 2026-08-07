import { nanoid } from 'nanoid';
import db from './connection.js';

export interface DocumentRecord {
  id: string;
  entityType: string;
  recordId: string;
  filename: string;
  mimeType: string;
  url: string | null;
  contentBase64: string | null;
  description: string;
  uploadedAt: string;
  archived: boolean;
  archivedAt: string | null;
}

interface DocumentRow {
  id: string;
  entity_type: string;
  record_id: string;
  filename: string;
  mime_type: string;
  url: string | null;
  content_base64: string | null;
  description: string;
  uploaded_at: string;
  archived: number;
  archived_at: string | null;
}

function rowToRecord(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    entityType: row.entity_type,
    recordId: row.record_id,
    filename: row.filename,
    mimeType: row.mime_type,
    url: row.url,
    contentBase64: row.content_base64,
    description: row.description,
    uploadedAt: row.uploaded_at,
    archived: !!row.archived,
    archivedAt: row.archived_at,
  };
}

// contentBase64 omitted by default — callers listing/describing documents
// don't need the full file payload, only the download route does.
function stripContent(record: DocumentRecord): DocumentRecord {
  return { ...record, contentBase64: record.contentBase64 ? '(binary content omitted — use the download route)' : null };
}

export function listDocuments(filters: { entityType?: string; recordId?: string; includeArchived?: boolean } = {}): DocumentRecord[] {
  const conditions: string[] = [];
  const params: Record<string, string> = {};
  if (filters.entityType) {
    conditions.push('entity_type = @entityType');
    params.entityType = filters.entityType;
  }
  if (filters.recordId) {
    conditions.push('record_id = @recordId');
    params.recordId = filters.recordId;
  }
  if (!filters.includeArchived) {
    conditions.push('archived = 0');
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM documents ${where} ORDER BY uploaded_at DESC`).all(params) as unknown as DocumentRow[];
  return rows.map(rowToRecord).map(stripContent);
}

// Only this one includes contentBase64 — used exclusively by the download route.
export function getDocumentWithContent(id: string): DocumentRecord | undefined {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as unknown as DocumentRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export function getDocumentById(id: string): DocumentRecord | undefined {
  const record = getDocumentWithContent(id);
  return record ? stripContent(record) : undefined;
}

export interface NewDocumentInput {
  id?: string;
  entityType: string;
  recordId: string;
  filename: string;
  mimeType?: string;
  url?: string | null;
  contentBase64?: string | null;
  description?: string;
}

export function insertDocument(input: NewDocumentInput): DocumentRecord {
  const now = new Date().toISOString();
  const id = input.id ?? `doc-${nanoid(10)}`;

  db.prepare(
    `INSERT INTO documents (
      id, entity_type, record_id, filename, mime_type, url, content_base64,
      description, uploaded_at, archived, archived_at
    ) VALUES (@id, @entityType, @recordId, @filename, @mimeType, @url, @contentBase64,
      @description, @uploadedAt, 0, NULL)`
  ).run({
    id,
    entityType: input.entityType,
    recordId: input.recordId,
    filename: input.filename,
    mimeType: input.mimeType ?? 'application/octet-stream',
    url: input.url ?? null,
    contentBase64: input.contentBase64 ?? null,
    description: input.description ?? '',
    uploadedAt: now,
  });

  return getDocumentById(id)!;
}

export function archiveDocument(id: string): DocumentRecord | undefined {
  const existing = getDocumentById(id);
  if (!existing) return undefined;
  db.prepare('UPDATE documents SET archived = 1, archived_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  return getDocumentById(id);
}

export function restoreDocument(id: string): DocumentRecord | undefined {
  const existing = getDocumentById(id);
  if (!existing) return undefined;
  db.prepare('UPDATE documents SET archived = 0, archived_at = NULL WHERE id = ?').run(id);
  return getDocumentById(id);
}
