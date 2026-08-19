import { apiFetch, ApiError } from './apiConfig';

export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  previousValue: unknown;
  newValue: unknown;
  source: string;
  confirmed: boolean;
  automatic: boolean;
  createdAt: string;
}

export async function fetchRecentAuditLog(limit = 10): Promise<AuditLogEntry[]> {
  const response = await apiFetch(`/api/audit-log?limit=${limit}`);
  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('Unexpected response loading recent activity.', response.status);
  }
  if (!response.ok || !body.success) {
    throw new ApiError(body.message || 'Failed to load recent activity.', response.status);
  }
  return body.result as AuditLogEntry[];
}
