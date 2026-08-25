import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { Ga4EnquiriesResponse, Ga4BrandEnquiries, EnquiryType } from '@/services/ga4Api';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';
import { SOCIAL_CHANNEL_GROUPS } from '@/utils/ga4Traffic';

// GA4 Enquiries (Phase 1) — real, verified key events only. Every figure
// derived here comes from backend/src/services/ga4.ts's getEnquiries,
// which queries only event names confirmed live against the real GA4
// account per brand (see that file's own doc comment). This is a website
// action, never a qualified marketing lead, CRM opportunity, or revenue
// figure — nothing here should ever be labelled "Leads" or attributed
// revenue. Brentwood's generate_lead rollup is never summed into any
// total here — the backend already excludes it from `rows`/`total`
// entirely, keeping it only in rollupTotal for cross-check purposes.

interface RelevantEnquiryBrands {
  status: 'available' | 'not-connected';
  brands: Ga4BrandEnquiries[];
  subtitle: string;
}

// Single shared entity/period-scoped brand selection every exported
// function below reads from — so headline totals, type breakdowns,
// channel/source breakdowns, and the Social page's figures can never
// disagree about which brands are "in scope" for the current selection.
function getRelevantEnquiryBrands(
  data: Ga4EnquiriesResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): RelevantEnquiryBrands {
  if (!data || !data.configured) {
    return { status: 'not-connected', brands: [], subtitle: 'Awaiting GA4 integration' };
  }

  if (!isGroupView) {
    const entry = data.brands.find((b) => b.brand === selectedEntity);
    if (entry) {
      return { status: 'available', brands: [entry], subtitle: 'GA4 Enquiries — verified key events for this entity' };
    }
    const hasDefinition = data.configuredBrands.includes(selectedEntity as Brand);
    return {
      status: 'not-connected',
      brands: [],
      subtitle: hasDefinition ? 'GA4 fetch failed for this entity' : 'No verified GA4 Enquiry event definition for this entity',
    };
  }

  const relevant = data.brands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b.brand));
  if (relevant.length === 0) {
    return { status: 'not-connected', brands: [], subtitle: 'No entities have a verified GA4 Enquiry definition yet' };
  }
  const configuredCount = relevant.length;
  const totalCount = GROUP_AGGREGATE_BRANDS.length;
  const subtitle =
    configuredCount < totalCount
      ? `Combined GA4 Enquiries across ${configuredCount} of ${totalCount} entities`
      : `Combined GA4 Enquiries across ${totalCount} entities`;
  return { status: 'available', brands: relevant, subtitle };
}

export interface EnquiryTypeInfo {
  status: 'available' | 'not-connected';
  value?: number;
  subtitle: string;
}

export interface EnquiriesInfo {
  status: 'available' | 'not-connected';
  total?: number;
  subtitle: string;
  form: EnquiryTypeInfo;
  phone: EnquiryTypeInfo;
  email: EnquiryTypeInfo;
  livechat: EnquiryTypeInfo;
}

const TYPE_LABEL: Record<EnquiryType, string> = { form: 'form', phone: 'phone', email: 'email', livechat: 'live chat' };

function buildTypeInfo(relevant: RelevantEnquiryBrands, type: EnquiryType): EnquiryTypeInfo {
  if (relevant.status === 'not-connected') {
    return { status: 'not-connected', subtitle: relevant.subtitle };
  }
  const tracked = relevant.brands.filter((b) => b[type] !== null);
  if (tracked.length === 0) {
    return {
      status: 'not-connected',
      subtitle:
        relevant.brands.length === 1
          ? `No verified ${TYPE_LABEL[type]} enquiry event for this entity`
          : `No entity in this group tracks a verified ${TYPE_LABEL[type]} enquiry event`,
    };
  }
  const value = tracked.reduce((sum, b) => sum + (b[type] ?? 0), 0);
  const subtitle =
    relevant.brands.length === 1
      ? `GA4 Enquiries — verified ${TYPE_LABEL[type]} event`
      : tracked.length < relevant.brands.length
        ? `Combined across ${tracked.length} of ${relevant.brands.length} entities with a verified ${TYPE_LABEL[type]} event`
        : `Combined across ${tracked.length} entities`;
  return { status: 'available', value, subtitle };
}

// Single shared source of truth for "what does GA4 Enquiries mean for the
// current entity selection" — used identically by Performance, Reports,
// and Social so they can never disagree.
export function getEnquiries(
  data: Ga4EnquiriesResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EnquiriesInfo {
  const relevant = getRelevantEnquiryBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') {
    const notConnected: EnquiryTypeInfo = { status: 'not-connected', subtitle: relevant.subtitle };
    return { status: 'not-connected', subtitle: relevant.subtitle, form: notConnected, phone: notConnected, email: notConnected, livechat: notConnected };
  }
  const total = relevant.brands.reduce((sum, b) => sum + b.total, 0);
  return {
    status: 'available',
    total,
    subtitle: relevant.subtitle,
    form: buildTypeInfo(relevant, 'form'),
    phone: buildTypeInfo(relevant, 'phone'),
    email: buildTypeInfo(relevant, 'email'),
    livechat: buildTypeInfo(relevant, 'livechat'),
  };
}

export interface EnquiryChannelBucket {
  channelGroup: string;
  count: number;
}

export interface EnquiriesByChannel {
  status: 'available' | 'not-connected';
  buckets: EnquiryChannelBucket[];
  subtitle: string;
}

// GA4's own sessionDefaultChannelGroup — only channels GA4 actually
// returns are shown, never a fixed/invented list of channel names.
export function getEnquiriesByChannel(
  data: Ga4EnquiriesResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EnquiriesByChannel {
  const relevant = getRelevantEnquiryBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') return { status: 'not-connected', buckets: [], subtitle: relevant.subtitle };

  const totals = new Map<string, number>();
  for (const brand of relevant.brands) {
    for (const row of brand.rows) {
      totals.set(row.channelGroup, (totals.get(row.channelGroup) ?? 0) + row.count);
    }
  }
  const buckets = Array.from(totals.entries())
    .map(([channelGroup, count]) => ({ channelGroup, count }))
    .sort((a, b) => b.count - a.count);
  return { status: 'available', buckets, subtitle: relevant.subtitle };
}

export interface EnquirySourceRow {
  source: string;
  count: number;
}

export interface EnquiriesBySource {
  status: 'available' | 'not-connected';
  rows: EnquirySourceRow[];
  subtitle: string;
}

// GA4's raw sessionSource — never relabelled into a platform name, same
// rule as the Social page's traffic-by-source table.
export function getEnquiriesBySource(
  data: Ga4EnquiriesResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  limit = 10
): EnquiriesBySource {
  const relevant = getRelevantEnquiryBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') return { status: 'not-connected', rows: [], subtitle: relevant.subtitle };

  const totals = new Map<string, number>();
  for (const brand of relevant.brands) {
    for (const row of brand.rows) {
      totals.set(row.source, (totals.get(row.source) ?? 0) + row.count);
    }
  }
  const rows = Array.from(totals.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return { status: 'available', rows, subtitle: relevant.subtitle };
}

export interface SocialEnquiriesInfo {
  status: 'available' | 'not-connected';
  total?: number;
  organic?: number;
  paid?: number;
  subtitle: string;
}

// GA4 Enquiries restricted to rows whose channelGroup is Organic/Paid
// Social — the same two real GA4 channel-group values Social Sessions
// already uses (SOCIAL_CHANNEL_GROUPS, shared from ga4Traffic.ts).
export function getSocialEnquiries(
  data: Ga4EnquiriesResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): SocialEnquiriesInfo {
  const relevant = getRelevantEnquiryBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') return { status: 'not-connected', subtitle: relevant.subtitle };

  let organic = 0;
  let paid = 0;
  for (const brand of relevant.brands) {
    for (const row of brand.rows) {
      if (row.channelGroup === 'Organic Social') organic += row.count;
      else if (row.channelGroup === 'Paid Social') paid += row.count;
    }
  }
  return { status: 'available', total: organic + paid, organic, paid, subtitle: relevant.subtitle };
}

// Enquiries from Social, by GA4's raw sessionSource — same rows as
// getEnquiriesBySource, pre-filtered to social channels only.
export function getSocialEnquiriesBySource(
  data: Ga4EnquiriesResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  limit = 10
): EnquiriesBySource {
  const relevant = getRelevantEnquiryBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') return { status: 'not-connected', rows: [], subtitle: relevant.subtitle };

  const socialGroups: readonly string[] = SOCIAL_CHANNEL_GROUPS;
  const totals = new Map<string, number>();
  for (const brand of relevant.brands) {
    for (const row of brand.rows) {
      if (!socialGroups.includes(row.channelGroup)) continue;
      totals.set(row.source, (totals.get(row.source) ?? 0) + row.count);
    }
  }
  const rows = Array.from(totals.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return { status: 'available', rows, subtitle: relevant.subtitle };
}
