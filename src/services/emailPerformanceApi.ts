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
