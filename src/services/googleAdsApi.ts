import { apiFetch, ApiError } from './apiConfig';
import type { Brand } from '@/types/index';

// Google Ads (Phase 1) — real campaign performance for Brentwood and
// Radio Links only, confirmed live against both real accounts. See
// backend/src/services/googleAds.ts's header comment for the exact
// auth/query shape confirmed (direct customer queries, no
// login-customer-id, API version v25).
export interface GoogleAdsCampaignRow {
  campaignId: string;
  campaignName: string;
  // Real GAQL enum strings (e.g. ENABLED, PAUSED, REMOVED) — never
  // relabelled.
  status: string;
  // Real GAQL enum string (e.g. SEARCH, PERFORMANCE_MAX, DISPLAY, VIDEO).
  advertisingChannelType: string;
  impressions: number;
  clicks: number;
  spend: number;
  // Google Ads' own conversions metric — confirmed real as a fractional
  // value (partial-credit attribution), never rounded to a whole number.
  // A different population from GA4 Enquiries — never presented as
  // equivalent.
  conversions: number;
  costPerConversion: number | null;
}

export interface GoogleAdsBrandPerformance {
  brand: Brand;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  averageCpc: number | null;
  conversions: number;
  costPerConversion: number | null;
  campaigns: GoogleAdsCampaignRow[];
}

export interface GoogleAdsResponse {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: GoogleAdsBrandPerformance[];
  configuredBrands: Brand[];
  errors: string[];
}

export async function fetchGoogleAdsPerformance(startDate: string, endDate: string): Promise<GoogleAdsResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/google-ads?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Google Ads performance (${response.status}).`, response.status);
  }
  return response.json();
}
