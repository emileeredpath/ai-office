// Client for the Campaign Costs REST API (Structured Campaign Costs phase)
// — same shared database the MCP tools read from (never write to for this
// entity, by design; see the phase's environment rules). Follows the same
// pattern as fundingRecordsApi.ts.
import { apiFetch, ApiError } from './apiConfig';
import type { CampaignCost } from '@/types/index';

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

// campaignId omitted fetches every cost across every campaign — used by the
// Campaigns list to compute Known Campaign Spend per row without an N+1
// request pattern.
export async function fetchCampaignCostsFromApi(campaignId?: string): Promise<CampaignCost[]> {
  const query = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : '';
  const response = await apiFetch(`/api/campaign-costs${query}`);
  return handle<CampaignCost[]>(response, 'load campaign costs');
}

export async function createCampaignCostInApi(payload: Record<string, unknown>): Promise<CampaignCost> {
  const response = await apiFetch('/api/campaign-costs', { method: 'POST', body: JSON.stringify(payload) });
  return handle<CampaignCost>(response, 'create the campaign cost');
}

export async function updateCampaignCostInApi(id: string, updates: Record<string, unknown>): Promise<CampaignCost> {
  const response = await apiFetch(`/api/campaign-costs/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  return handle<CampaignCost>(response, 'update the campaign cost');
}

export async function deleteCampaignCostInApi(id: string): Promise<{ id: string }> {
  const response = await apiFetch(`/api/campaign-costs/${id}`, { method: 'DELETE' });
  return handle<{ id: string }>(response, 'delete the campaign cost');
}
