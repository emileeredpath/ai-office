import { apiFetch, ApiError } from './apiConfig';
import type { Brand } from '@/types/index';

export interface EmailCampaignRecord {
  taskId: string;
  campaignName: string;
  subject: string | null;
  sentDate: string;
  brand: Brand;
  recipients: number | null;
  opens: number | null;
  clicks: number | null;
  bounces: number | null;
  unsubscribes: number | null;
  uniqueOpens: number | null;
  uniqueOpenRate: number | null;
  delivered: number | null;
  deliveryRate: number | null;
  clickRate: number | null;
  clickToOpenRate: number | null;
  emailCampaignGroup: string | null;
  emailGeography: string | null;
  emailAudienceLevel: string | null;
  emailAudienceType: string | null;
  isTest: boolean;
  campaignMonitorId: string | null;
  dashboardCampaignId: string | null;
}

export type CampaignMonitorSyncState = 'live' | 'error' | 'never-synced' | 'not-configured';

export interface EmailPerformanceResponse {
  campaigns: EmailCampaignRecord[];
  startDate: string;
  endDate: string;
  configured: boolean;
  syncState: CampaignMonitorSyncState;
  lastSyncAt: string | null;
  lastSyncError: string | null;
}

export async function fetchEmailPerformance(startDate: string, endDate: string): Promise<EmailPerformanceResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/campaign-monitor?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Campaign Monitor email performance (${response.status}).`, response.status);
  }
  return response.json();
}

// Top Links (Send Detail) — fetched only when a Send Detail view actually
// opens, never as part of the regular sync. The backend aggregates
// Campaign Monitor's individual-subscriber click log server-side and
// returns ONLY { url, totalClicks, uniqueClicks } rows — see
// backend/src/services/campaignMonitor.ts's getTopLinksForSend doc
// comment. No subscriber-level data (names, emails, IPs) ever reaches
// this response.
export interface TopLinkRow {
  url: string;
  totalClicks: number;
  uniqueClicks: number;
}

export interface TopLinksResponse {
  success: boolean;
  rows?: TopLinkRow[];
  message?: string;
}

export async function fetchTopLinksForSend(campaignMonitorId: string): Promise<TopLinksResponse> {
  const response = await apiFetch(`/api/campaign-monitor/sends/${encodeURIComponent(campaignMonitorId)}/top-links`);
  const body = (await response.json().catch(() => ({}))) as TopLinksResponse;
  if (!response.ok) {
    return { success: false, message: body.message ?? `Failed to fetch top links (${response.status}).` };
  }
  return body;
}

// Manual sync trigger (Email page's "Sync now" button) — mirrors the
// backend's real SyncResult shape exactly (backend/src/services/
// campaignMonitor.ts's SyncResult) so the UI reports genuine
// fetched/created/updated counts and any real Campaign Monitor error
// strings, never an invented summary. Edit-role only — the backend route
// is behind requireEdit, so a view-only session gets a 403 here.
export interface CampaignMonitorSyncResult {
  success: boolean;
  message: string;
  clientsProcessed: number;
  campaignsSeen: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function triggerCampaignMonitorSync(sinceDays: number): Promise<CampaignMonitorSyncResult> {
  const response = await apiFetch(`/api/campaign-monitor/sync?sinceDays=${sinceDays}`, { method: 'POST' });
  const body = (await response.json().catch(() => ({}))) as Partial<CampaignMonitorSyncResult>;
  if (!response.ok) {
    throw new ApiError(body.message ?? `Campaign Monitor sync failed (${response.status}).`, response.status);
  }
  return {
    success: body.success ?? false,
    message: body.message ?? '',
    clientsProcessed: body.clientsProcessed ?? 0,
    campaignsSeen: body.campaignsSeen ?? 0,
    created: body.created ?? 0,
    updated: body.updated ?? 0,
    skipped: body.skipped ?? 0,
    errors: body.errors ?? [],
  };
}

// Genuine Campaign Monitor sync coverage — mirrors the backend's
// CampaignMonitorCoverage shape exactly (backend/src/services/
// emailPerformance.ts's getCampaignMonitorCoverage). Never a period-scoped
// figure — this is a property of the sync history itself.
export interface CampaignMonitorCoverage {
  lastSuccessfulSyncAt: string | null;
  lastSyncError: string | null;
  continuousCoverageSince: string | null;
  hasKnownGap: boolean;
  explanation: string;
}

export async function fetchCampaignMonitorCoverage(): Promise<CampaignMonitorCoverage> {
  const response = await apiFetch('/api/analytics/campaign-monitor/coverage');
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Campaign Monitor coverage (${response.status}).`, response.status);
  }
  return response.json();
}

// Manual Campaign Monitor -> AI Office campaign mapping — mirrors the
// backend's POST /api/campaign-monitor/sends/:taskId/map-campaign route
// (see routes/campaignMonitor.ts's doc comment). Edit-role only. Passing
// campaignId: null explicitly clears the mapping back to Unmatched.
export async function mapSendToCampaign(taskId: string, campaignId: string | null): Promise<string | null> {
  const response = await apiFetch(`/api/campaign-monitor/sends/${encodeURIComponent(taskId)}/map-campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId }),
  });
  const body = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string; task?: { campaignId: string | null } };
  if (!response.ok || !body.success) {
    throw new ApiError(body.message ?? `Failed to map this send to a campaign (${response.status}).`, response.status);
  }
  return body.task?.campaignId ?? null;
}
