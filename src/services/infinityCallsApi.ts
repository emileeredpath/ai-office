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
  callState: string | null;
  callDirection: string | null;
  landingPageUrl: string | null;
  conversionPageUrl: string | null;
  ppcAssisted: boolean | null;
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
