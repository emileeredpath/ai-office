import type { AcumaticaSummary } from '@/services/acumaticaApi';

export function getAcumaticaMissingDataLabel(
  summary: AcumaticaSummary | null | undefined,
  entityLabel?: string,
): string {
  if (!summary) return 'Acumatica data is currently unavailable';
  if (summary.hasAnyImportedData && entityLabel) {
    return `No ${entityLabel} opportunities have been imported`;
  }
  return 'No Acumatica opportunities have been imported yet';
}

export function getAcumaticaMissingDataHeadline(summary: AcumaticaSummary | null | undefined): string {
  return summary?.hasAnyImportedData ? 'No entity data' : 'Not connected';
}
