// Client for the funding records REST API — same shared database the MCP
// tools use, so a record created here is immediately visible to
// ai_office_list_funding_records and vice versa. Named fundingRecordsApi
// (not fundingApi) to avoid colliding with the existing fundingService.ts,
// an unrelated client-side AI grant-brainstorming prototype.
import { apiFetch, ApiError } from './apiConfig';

async function handle<T>(response: Response, action: string): Promise<T> {
  if (response.status === 401) {
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }
  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(`Unexpected response from the backend (${action}).`, response.status);
  }
  if (!response.ok || !body.success) {
    throw new ApiError(body.message || `Failed to ${action}.`, response.status);
  }
  return body.result as T;
}

export async function fetchFundingRecordsFromApi(): Promise<any[]> {
  const response = await apiFetch('/api/funding');
  return handle<any[]>(response, 'load funding records');
}

export async function createFundingRecordInApi(payload: Record<string, unknown>): Promise<any> {
  const response = await apiFetch('/api/funding', { method: 'POST', body: JSON.stringify(payload) });
  return handle<any>(response, 'create the funding record');
}

export async function updateFundingRecordInApi(id: string, updates: Record<string, unknown>): Promise<any> {
  const response = await apiFetch(`/api/funding/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  return handle<any>(response, 'update the funding record');
}
