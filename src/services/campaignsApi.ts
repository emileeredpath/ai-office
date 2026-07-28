// Client for the campaigns REST API — the campaigns table lives in the same
// database the MCP tools and tasks share, so a campaign created here is
// immediately visible to anything else that reads it.
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

export async function fetchCampaignsFromApi(): Promise<any[]> {
  const response = await apiFetch('/api/campaigns');
  return handle<any[]>(response, 'load campaigns');
}

export async function createCampaignInApi(payload: Record<string, unknown>): Promise<any> {
  const response = await apiFetch('/api/campaigns', { method: 'POST', body: JSON.stringify(payload) });
  return handle<any>(response, 'create the campaign');
}

export async function updateCampaignInApi(id: string, updates: Record<string, unknown>): Promise<any> {
  const response = await apiFetch(`/api/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  return handle<any>(response, 'update the campaign');
}

export async function deleteCampaignInApi(id: string): Promise<void> {
  const response = await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
  await handle<unknown>(response, 'delete the campaign');
}
