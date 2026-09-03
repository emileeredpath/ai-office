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

// GA4 Enquiries (Phase 1) — real, verified key events only. A separate
// response from Ga4TrafficResponse/Ga4SocialTrafficResponse above — never
// touched by or feeding into either. See backend/src/services/ga4.ts's
// getEnquiries doc comment for exactly which event names, per brand, and
// why generate_lead (Brentwood's rollup) is kept as a cross-check only.
export type EnquiryType = 'form' | 'phone' | 'email' | 'livechat';

export interface Ga4EnquiryTypeSourceRow {
  type: EnquiryType;
  channelGroup: string;
  source: string;
  count: number;
}

export interface Ga4BrandEnquiries {
  brand: Brand;
  total: number;
  form: number | null;
  phone: number | null;
  email: number | null;
  livechat: number | null;
  rollupTotal: number | null;
  rows: Ga4EnquiryTypeSourceRow[];
}

export interface Ga4EnquiriesResponse {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: Ga4BrandEnquiries[];
  configuredBrands: Brand[];
  errors: string[];
}

export async function fetchGa4Enquiries(startDate: string, endDate: string): Promise<Ga4EnquiriesResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/ga4-enquiries?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch GA4 enquiries (${response.status}).`, response.status);
  }
  return response.json();
}

// Education 2026 campaign downstream attribution (Email page) — real GA4
// sessions/enquiries filtered to the campaign's own tagged links. A fully
// separate response from Ga4EnquiriesResponse above — never touched by or
// feeding into it. See backend/src/services/ga4.ts's
// getEducationCampaignAttribution doc comment.
export interface Ga4EducationContentRow {
  utmContent: string;
  sessions: number;
}

export interface Ga4EducationEnquiryContentRow {
  utmContent: string;
  count: number;
}

export interface Ga4BrandEducationAttribution {
  brand: Brand;
  sessions: number;
  byContent: Ga4EducationContentRow[];
  enquiries: number | null;
  enquiriesByContent: Ga4EducationEnquiryContentRow[];
}

export interface Ga4EducationAttributionResponse {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: Ga4BrandEducationAttribution[];
  configuredBrands: Brand[];
  errors: string[];
}

export async function fetchEducationCampaignAttribution(startDate: string, endDate: string): Promise<Ga4EducationAttributionResponse> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/api/analytics/education-campaign?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch Education campaign attribution (${response.status}).`, response.status);
  }
  return response.json();
}

// Generic per-AI-Office-campaign GA4 attribution (Campaign Attribution
// phase, slice 2) — mirrors backend/src/services/ga4.ts's
// getCampaignGa4Attribution exactly. campaignNames must be the campaign's
// own explicit ga4CampaignNames — never derived from its display name.
export interface Ga4CampaignAttribution {
  brand: Brand;
  sessions: number;
  users: number;
  // null when this brand has no verified GA4 Enquiry definition (mtech, idaro).
  enquiries: number | null;
}

export interface Ga4CampaignAttributionResponse {
  configured: boolean;
  startDate: string;
  endDate: string;
  result: Ga4CampaignAttribution | null;
  error: string | null;
}

export async function fetchCampaignGa4Attribution(
  brand: Brand,
  campaignNames: string[],
  startDate: string,
  endDate: string
): Promise<Ga4CampaignAttributionResponse> {
  const params = new URLSearchParams({ brand, campaignNames: campaignNames.join(','), startDate, endDate });
  const response = await apiFetch(`/api/analytics/campaign-ga4?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch campaign GA4 attribution (${response.status}).`, response.status);
  }
  return response.json();
}

// Real GA4 campaign names with genuine session activity for one brand —
// mirrors backend/src/services/ga4.ts's getGa4CampaignNamesInUse. Feeds
// Attribution Health's "GA4 campaigns unlinked" gap.
export interface Ga4CampaignNamesResponse {
  configured: boolean;
  campaignNames: string[];
  error: string | null;
}

export async function fetchGa4CampaignNamesInUse(brand: Brand, startDate: string, endDate: string): Promise<Ga4CampaignNamesResponse> {
  const params = new URLSearchParams({ brand, startDate, endDate });
  const response = await apiFetch(`/api/analytics/ga4-campaign-names?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(`Failed to fetch GA4 campaign names (${response.status}).`, response.status);
  }
  return response.json();
}
