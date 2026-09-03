import { apiFetch, ApiError } from './apiConfig';
import type { Brand } from '@/types/index';

// Manual Acumatica Opportunities import (Discovery & Foundation phase) —
// mirrors backend/src/routes/acumatica.ts and services/acumaticaImport.ts
// exactly. Never a live API connection — every response here reflects the
// last manually-uploaded CSV export, not real-time Acumatica state.

export interface AcumaticaImportResult {
  success: boolean;
  filename: string;
  recognisedColumns: string[];
  ignoredPersonalDataColumns: string[];
  unrecognisedColumns: string[];
  processed: number;
  created: number;
  updated: number;
  rejected: number;
  errors: string[];
  importedAt: string;
  message?: string;
}

export async function importAcumaticaFile(filename: string, contentBase64: string): Promise<AcumaticaImportResult> {
  const response = await apiFetch('/api/acumatica/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentBase64 }),
  });
  const body = (await response.json().catch(() => ({}))) as Partial<AcumaticaImportResult>;
  if (!response.ok) {
    throw new ApiError(body.message ?? `Import failed (${response.status}).`, response.status);
  }
  return body as AcumaticaImportResult;
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

export interface AcumaticaStatusResponse {
  apiStatus: 'not_connected';
  lastImport: AcumaticaImportLogEntry | null;
  opportunityCount: number;
}

export async function fetchAcumaticaStatus(): Promise<AcumaticaStatusResponse> {
  const response = await apiFetch('/api/acumatica/status');
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Acumatica status (${response.status}).`, response.status);
  }
  return response.json();
}

export interface AcumaticaSummary {
  hasImportedData: boolean;
  lastImportedAt: string | null;
  opportunities: number;
  wonDeals: number;
  wonRevenue: number;
  lostDeals: number;
  // Open Pipeline is deliberately provisional — see backend/src/services/
  // acumaticaKpiRules.ts's OPEN_PIPELINE_STATUSES doc comment. While
  // openPipelineDefinitionConfirmed is false, never present
  // openPipelineValue/openPipelineCount as a settled figure — always show
  // newStatusCount/newStatusValue alongside it.
  openPipelineValue: number;
  openPipelineCount: number;
  openPipelineDefinitionConfirmed: boolean;
  openPipelineIncludesStatuses: string[];
  newStatusCount: number;
  newStatusValue: number;
  unclassifiedCount: number;
  undated: number;
}

export async function fetchAcumaticaSummary(startDate?: string, endDate?: string, brand?: Brand): Promise<AcumaticaSummary> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (brand) params.set('brand', brand);
  const query = params.toString();
  const response = await apiFetch(`/api/analytics/acumatica${query ? `?${query}` : ''}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Acumatica summary (${response.status}).`, response.status);
  }
  return response.json();
}

// Reads a File as base64 (no data: prefix) for the import request above.
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
