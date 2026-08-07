import { nanoid } from 'nanoid';
import db from './connection.js';

export interface QuickCaptureRecord {
  id: string;
  type: string;
  content: string;
  category: string | null;
  source: string | null;
  status: string;
  createdAt: string;
}

interface QuickCaptureRow {
  id: string;
  type: string;
  content: string;
  category: string | null;
  source: string | null;
  status: string;
  created_at: string;
}

function rowToRecord(row: QuickCaptureRow): QuickCaptureRecord {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    category: row.category,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
  };
}

// No archived column — this table's existing status field (free text,
// default 'new') already serves that role, so soft-delete just sets
// status = 'archived' rather than adding a redundant flag.
export function listQuickCaptureItems(includeArchived = false): QuickCaptureRecord[] {
  const where = includeArchived ? '' : "WHERE status != 'archived'";
  const rows = db.prepare(`SELECT * FROM quick_capture_items ${where} ORDER BY created_at DESC`).all() as unknown as QuickCaptureRow[];
  return rows.map(rowToRecord);
}

export function getQuickCaptureItemById(id: string): QuickCaptureRecord | undefined {
  const row = db.prepare('SELECT * FROM quick_capture_items WHERE id = ?').get(id) as unknown as QuickCaptureRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

export interface NewQuickCaptureInput {
  id?: string;
  type: string;
  content: string;
  category?: string | null;
  source?: string | null;
  status?: string;
}

export function insertQuickCaptureItem(input: NewQuickCaptureInput): QuickCaptureRecord {
  const id = input.id ?? `capture-${nanoid(10)}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO quick_capture_items (id, type, content, category, source, status, created_at)
     VALUES (@id, @type, @content, @category, @source, @status, @createdAt)`
  ).run({
    id,
    type: input.type,
    content: input.content,
    category: input.category ?? null,
    source: input.source ?? null,
    status: input.status ?? 'new',
    createdAt: now,
  });

  return getQuickCaptureItemById(id)!;
}

export function updateQuickCaptureItem(id: string, updates: Partial<NewQuickCaptureInput>): QuickCaptureRecord | undefined {
  const existing = getQuickCaptureItemById(id);
  if (!existing) return undefined;

  const merged = {
    type: updates.type ?? existing.type,
    content: updates.content ?? existing.content,
    category: updates.category !== undefined ? updates.category : existing.category,
    source: updates.source !== undefined ? updates.source : existing.source,
    status: updates.status ?? existing.status,
  };

  db.prepare('UPDATE quick_capture_items SET type = @type, content = @content, category = @category, source = @source, status = @status WHERE id = @id')
    .run({ id, ...merged });

  return getQuickCaptureItemById(id);
}

export function archiveQuickCaptureItem(id: string): QuickCaptureRecord | undefined {
  return updateQuickCaptureItem(id, { status: 'archived' });
}

export function restoreQuickCaptureItem(id: string): QuickCaptureRecord | undefined {
  const existing = getQuickCaptureItemById(id);
  if (!existing) return undefined;
  return updateQuickCaptureItem(id, { status: 'new' });
}
