// Lightweight parser for campaign plan markdown files — see the Campaign
// Plan Integration brief. Deliberately hand-rolled (no markdown library
// dependency) since the input format is narrow and known: H1 title, H2
// section headers, pipe tables, and "- [ ]"/"- [x]" checklists.

export interface PlanTable {
  headers: string[];
  rows: Record<string, string>[];
}

export interface PlanChecklistItem {
  done: boolean;
  text: string;
}

export interface PlanSection {
  title: string;
  paragraphs: string[];
  tables: PlanTable[];
  checklist: PlanChecklistItem[];
}

export interface ParsedPlan {
  title: string;
  sections: PlanSection[];
}

function parseTable(lines: string[]): PlanTable | null {
  if (lines.length < 2) return null;
  const splitRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const headers = splitRow(lines[0]);
  // Row 1 must be the "---|---|---" separator for this to be a real table.
  if (!/^[\s|:-]+$/.test(lines[1])) return null;

  const rows = lines.slice(2).map((line) => {
    const cells = splitRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });

  return { headers, rows };
}

export function parsePlanMarkdown(markdown: string): ParsedPlan {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  let title = '';
  const sections: PlanSection[] = [];
  let current: PlanSection | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim();
      i += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      current = { title: line.slice(3).trim(), paragraphs: [], tables: [], checklist: [] };
      sections.push(current);
      i += 1;
      continue;
    }

    if (!current) {
      i += 1;
      continue;
    }

    // Table block — consume contiguous "|"-prefixed lines.
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const table = parseTable(tableLines);
      if (table) current.tables.push(table);
      continue;
    }

    // Checklist item.
    const checklistMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      current.checklist.push({ done: checklistMatch[1].toLowerCase() === 'x', text: checklistMatch[2].trim() });
      i += 1;
      continue;
    }

    // Plain paragraph text.
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      current.paragraphs.push(trimmed.replace(/^[-*]\s*/, ''));
    }
    i += 1;
  }

  return { title, sections };
}

export function getPlanSection(plan: ParsedPlan, titleMatch: RegExp): PlanSection | undefined {
  return plan.sections.find((s) => titleMatch.test(s.title));
}
