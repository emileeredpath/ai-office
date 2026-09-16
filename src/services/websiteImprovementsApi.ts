import { apiFetch, ApiError } from './apiConfig';

export interface WebsiteSite { id: string; name: string; url: string; brand: string | null; created_at: string }
export interface WebsiteImprovement {
  id: string; site_id: string; channel: 'website' | 'ppc'; page_url: string | null; page_type: string | null;
  improvement_type: string; title: string; reason: string; priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Suggested' | 'Approved' | 'Planned' | 'In Progress' | 'Live' | 'Measuring' | 'Successful' | 'Inconclusive' | 'Reverted';
  implemented_on: string | null; implemented_by: string | null;
  baseline_start: string | null; baseline_end: string | null;
  measurement_start: string | null; measurement_end: string | null;
  confidence: 'Low' | 'Medium' | 'High' | null;
  competing_activity: string | null; notes: string | null;
  created_at: string; updated_at: string;
}

async function result<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) throw new ApiError(`Website Improvement request failed (${response.status}).`, response.status);
  return ((await response.json()) as { result: T }).result;
}

export const fetchWebsiteSites = () => result<WebsiteSite[]>('/api/website-improvements/sites');
export const fetchWebsiteImprovements = (area?: 'website' | 'ppc') => result<WebsiteImprovement[]>(`/api/website-improvements${area ? `?area=${area}` : ''}`);
export const createWebsiteSite = (name: string, url: string) => result<WebsiteSite>('/api/website-improvements/sites', {
  method: 'POST', body: JSON.stringify({ name, url }),
});
export const createWebsiteImprovement = (data: Record<string, unknown>) => result<WebsiteImprovement>('/api/website-improvements', {
  method: 'POST', body: JSON.stringify(data),
});
export const updateWebsiteImprovement = (id: string, data: Record<string, unknown>) => result<WebsiteImprovement>(`/api/website-improvements/${encodeURIComponent(id)}`, {
  method: 'PATCH', body: JSON.stringify(data),
});
