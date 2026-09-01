import { apiFetch, ApiError } from './apiConfig';
import type { Brand } from '@/types/index';

// Google Search Console (Phase 1) — real organic search performance for
// the entities with a verified Search Console property. See
// backend/src/services/searchConsole.ts's header comment for exactly how
// each property is authenticated and which site URL env var each brand
// reads. A fully separate response from Ga4TrafficResponse/
// Ga4EnquiriesResponse/GoogleAdsResponse — never touched by or feeding
// into any of them.
export interface SearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsoleQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsolePageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsoleQueryPageRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface BrandSearchConsolePerformance {
  brand: Brand;
  totals: SearchConsoleTotals;
  topQueries: SearchConsoleQueryRow[];
  topPages: SearchConsolePageRow[];
  topQueryPageCombinations: SearchConsoleQueryPageRow[];
}

export interface SearchConsoleResponse {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: BrandSearchConsolePerformance[];
  configuredBrands: Brand[];
  errors: string[];
}

export async function fetchSearchConsolePerformance(startDate: string, endDate: string): Promise<SearchConsoleResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/search-console?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Search Console performance (${response.status}).`, response.status);
  }
  return response.json();
}
