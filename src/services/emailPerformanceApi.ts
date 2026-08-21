import { apiFetch, ApiError } from './apiConfig';
import type { Brand } from '@/types/index';

export interface EmailCampaignRecord {
  taskId: string;
  campaignName: string;
  sentDate: string;
  brand: Brand;
  recipients: number | null;
  opens: number | null;
  clicks: number | null;
  bounces: number | null;
  unsubscribes: number | null;
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
