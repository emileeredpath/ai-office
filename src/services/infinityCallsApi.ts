import { apiFetch, ApiError } from './apiConfig';
import type { Brand } from '@/types/index';

export interface InfinityCallRecord {
  rowId: string;
  triggerDatetime: string;
  brand: Brand | null;
  dgrpName: string | null;
  chName: string | null;
  chType: string | null;
  src: string | null;
  dialledPhoneNumber: string | null;
  customerPhoneNumber: string | null;
  callDuration: number | null;
  bridgeDuration: number | null;
  ringTime: number | null;
  // 'bridge' means answered/connected — see callPerformance.ts's isAnswered.
  callStage: string | null;
  // Hangup-reason code (e.g. NORMAL_CLEARING_A/B) — not an answered signal.
  callState: string | null;
  callDirection: string | null;
  landingPageUrl: string | null;
  conversionPageUrl: string | null;
  // Kept for future marketing-attribution use, not consumed yet.
  pageTitle: string | null;
  campaign: string | null;
  adGroup: string | null;
  ppcAssisted: boolean | null;
  // Retained for future use — confirmed populated, not surfaced yet.
  href: string | null;
  pub: string | null;
  dom: string | null;
}

export interface InfinityCallsResponse {
  configured: boolean;
  calls: InfinityCallRecord[];
  mappedBrands: Brand[];
  errors: string[];
}

export async function fetchInfinityCalls(startDate: string, endDate: string): Promise<InfinityCallsResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/infinity-calls?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Infinity call records (${response.status}).`, response.status);
  }
  return response.json();
}
