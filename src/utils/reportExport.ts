// Builds the CSV for Reports' "Export CSV" action. Every row here mirrors
// exactly what's rendered on-screen — real figures where genuine data
// exists, the literal string "Not connected" where it doesn't. Nothing is
// summarized or rounded differently for export than for display.
export interface ReportCsvRow {
  label: string;
  value: string;
  detail?: string;
}

export interface ReportCsvSection {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

function escapeCsvCell(cell: string | number): string {
  const str = String(cell);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildReportCsv(title: string, sections: ReportCsvSection[]): string {
  const lines: string[] = [title, ''];
  for (const section of sections) {
    lines.push(section.title);
    lines.push(section.columns.map(escapeCsvCell).join(','));
    for (const row of section.rows) {
      lines.push(row.map(escapeCsvCell).join(','));
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
