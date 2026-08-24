import { apiFetch, ApiError } from './apiConfig';
import type { Brand } from '@/types/index';

export interface Ga4BrandTraffic {
  brand: Brand;
  activeUsers: number;
  sessions: number;
}

export interface Ga4TrafficResponse {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: Ga4BrandTraffic[];
  configuredBrands: Brand[];
  errors: string[];
}

export async function fetchGa4Traffic(startDate: string, endDate: string): Promise<Ga4TrafficResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/ga4?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch GA4 traffic (${response.status}).`, response.status);
  }
  return response.json();
}

// GA4 Social Traffic (Phase 1) — website sessions/users GA4 attributes to
// Organic/Paid Social via sessionDefaultChannelGroup, broken down by raw
// sessionSource ("network") and top landing pages. A separate response
// from Ga4TrafficResponse above — never touched by or feeding into it.
export interface Ga4SocialNetworkRow {
  source: string;
  sessions: number;
  users: number;
}

export interface Ga4SocialLandingPageRow {
  landingPage: string;
  sessions: number;
}

export interface Ga4BrandSocialTraffic {
  brand: Brand;
  sessions: number;
  users: number;
  organicSessions: number;
  organicUsers: number;
  paidSessions: number;
  paidUsers: number;
  byNetwork: Ga4SocialNetworkRow[];
  topLandingPages: Ga4SocialLandingPageRow[];
}

export interface Ga4SocialTrafficResponse {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: Ga4BrandSocialTraffic[];
  configuredBrands: Brand[];
  errors: string[];
}

export async function fetchGa4SocialTraffic(startDate: string, endDate: string): Promise<Ga4SocialTrafficResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/ga4-social?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch GA4 social traffic (${response.status}).`, response.status);
  }
  return response.json();
}
