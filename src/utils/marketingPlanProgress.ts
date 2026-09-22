import type { Brand, Campaign, CampaignCost } from '@/types';
import type { AcumaticaSummary } from '@/services/acumaticaApi';
import type { Ga4EnquiriesResponse, Ga4TrafficResponse } from '@/services/ga4Api';
import type { GoogleAdsResponse } from '@/services/googleAdsApi';
import type { InfinityCallsResponse } from '@/services/infinityCallsApi';
import type { MarketingPlanKpi, MarketingPlanKpiDefinition, MarketingPlanObjective, MarketingPlanStrategyObjective } from '@/types/marketingPlan';
import { filterCampaignsByDateRange, sumEnquiries, sumLeads } from '@/utils/campaignMetrics';
import { getCampaignKnownSpend } from '@/utils/campaignCosts';
import { getWebsiteUsers } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import { getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
import { getCallPerformance } from '@/utils/callPerformance';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

export interface MarketingPlanPeriodRange {
  status: 'available' | 'unavailable';
  startDate?: string;
  endDate?: string;
  previousStartDate?: string;
  previousEndDate?: string;
  label: string;
  reason?: string;
  allTime: boolean;
}

export interface MarketingPlanEntityScope {
  status: 'available' | 'unavailable';
  isGroupView: boolean;
  selectedEntity: Brand | 'all';
  label: string;
  reason?: string;
}

export type ProgressAvailability = 'available' | 'partial' | 'unavailable';

export interface MarketingPlanActual {
  availability: ProgressAvailability;
  value: number | null;
  previousValue: number | null;
  subtitle: string;
}

export interface MarketingPlanProgressRow extends MarketingPlanActual {
  kpi: MarketingPlanKpi;
  definition?: MarketingPlanKpiDefinition;
  targetStatus: 'meets' | 'below' | 'above' | 'tbc' | 'unavailable';
}

export interface MarketingPlanProgressSources {
  ga4Traffic?: Ga4TrafficResponse | null;
  previousGa4Traffic?: Ga4TrafficResponse | null;
  ga4Enquiries?: Ga4EnquiriesResponse | null;
  previousGa4Enquiries?: Ga4EnquiriesResponse | null;
  googleAds?: GoogleAdsResponse | null;
  previousGoogleAds?: GoogleAdsResponse | null;
  infinityCalls?: InfinityCallsResponse | null;
  previousInfinityCalls?: InfinityCallsResponse | null;
  acumatica?: AcumaticaSummary | null;
  previousAcumatica?: AcumaticaSummary | null;
  campaignCosts?: CampaignCost[] | null;
}

function iso(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function resolveMarketingPlanPeriod(objective: MarketingPlanObjective, kpi: MarketingPlanKpi): MarketingPlanPeriodRange {
  if (kpi.periodScope === 'month') {
    return { status: 'unavailable', label: 'Month TBC', reason: 'This KPI does not identify which month to report.', allTime: false };
  }
  if (kpi.periodScope === 'all-time') return { status: 'available', label: 'All available history', allTime: true };
  if (kpi.periodScope === 'quarter' && objective.quarter === null) {
    return { status: 'unavailable', label: 'Quarter TBC', reason: 'Assign a quarter to this objective before using a quarterly actual.', allTime: false };
  }

  if (objective.quarter !== null) {
    const startMonth = (objective.quarter - 1) * 3;
    return {
      status: 'available',
      startDate: iso(objective.periodYear, startMonth, 1),
      endDate: iso(objective.periodYear, startMonth + 3, 0),
      previousStartDate: iso(objective.periodYear, startMonth - 3, 1),
      previousEndDate: iso(objective.periodYear, startMonth, 0),
      label: `Q${objective.quarter} ${objective.periodYear}`,
      allTime: false,
    };
  }

  return {
    status: 'available',
    startDate: iso(objective.periodYear, 0, 1),
    endDate: iso(objective.periodYear, 11, 31),
    previousStartDate: iso(objective.periodYear - 1, 0, 1),
    previousEndDate: iso(objective.periodYear - 1, 11, 31),
    label: `${objective.periodYear}`,
    allTime: false,
  };
}

export function resolveMarketingPlanEntityScope(entities: Brand[]): MarketingPlanEntityScope {
  if (entities.length === 1) {
    return { status: 'available', isGroupView: false, selectedEntity: entities[0], label: entities[0] };
  }
  const unique = [...new Set(entities)].sort();
  const group = [...GROUP_AGGREGATE_BRANDS].sort();
  if (unique.length === group.length && unique.every((value, index) => value === group[index])) {
    return { status: 'available', isGroupView: true, selectedEntity: 'all', label: 'MTech Group' };
  }
  return {
    status: 'unavailable', isGroupView: false, selectedEntity: 'all', label: 'Entity scope unavailable',
    reason: entities.length === 0 ? 'Select an entity before resolving actual performance.' : 'This entity combination is not an established reporting scope.',
  };
}

function unavailable(subtitle: string): MarketingPlanActual {
  return { availability: 'unavailable', value: null, previousValue: null, subtitle };
}

function externalActual(
  current: { status: 'available' | 'not-connected'; value?: number; subtitle: string },
  previous: { status: 'available' | 'not-connected'; value?: number } | null,
): MarketingPlanActual {
  if (current.status !== 'available' || current.value === undefined) return unavailable(current.subtitle);
  return {
    availability: 'available', value: current.value,
    previousValue: previous?.status === 'available' && previous.value !== undefined ? previous.value : null,
    subtitle: current.subtitle,
  };
}

function acumaticaActual(summary: AcumaticaSummary | null | undefined, previous: AcumaticaSummary | null | undefined, field: keyof AcumaticaSummary, caveat: string) {
  if (!summary) return unavailable('Acumatica data unavailable.');
  if (summary.notAvailableForBrand) return unavailable(summary.notAvailableReason ?? 'Not available for this entity.');
  if (!summary.hasImportedData) return unavailable('No Acumatica import is available for this reporting scope.');
  const value = summary[field];
  const previousValue = previous && previous.hasImportedData && !previous.notAvailableForBrand ? previous[field] : null;
  return {
    availability: 'available' as const,
    value: typeof value === 'number' ? value : null,
    previousValue: typeof previousValue === 'number' ? previousValue : null,
    subtitle: caveat,
  };
}

function linkedCampaignsForRange(campaigns: Campaign[], linkedIds: string[], range: MarketingPlanPeriodRange) {
  const linked = campaigns.filter((campaign) => linkedIds.includes(campaign.id));
  if (range.allTime || range.status === 'unavailable') return linked;
  return filterCampaignsByDateRange(linked, new Date(`${range.startDate}T00:00:00`), new Date(`${range.endDate}T23:59:59`));
}

export function resolveMarketingPlanActual(
  key: string,
  objective: MarketingPlanObjective,
  kpi: MarketingPlanKpi,
  linkedCampaignIds: string[],
  campaigns: Campaign[],
  sources: MarketingPlanProgressSources,
): MarketingPlanActual {
  const range = resolveMarketingPlanPeriod(objective, kpi);
  if (range.status === 'unavailable') return unavailable(range.reason ?? 'Reporting period unavailable.');
  const scope = resolveMarketingPlanEntityScope(objective.entities);
  const linked = linkedCampaignsForRange(campaigns, linkedCampaignIds, range);
  const previousLinked = range.previousStartDate && range.previousEndDate
    ? filterCampaignsByDateRange(campaigns.filter((campaign) => linkedCampaignIds.includes(campaign.id)), new Date(`${range.previousStartDate}T00:00:00`), new Date(`${range.previousEndDate}T23:59:59`))
    : [];

  if (key === 'campaign-enquiries' || key === 'marketing-leads' || key === 'known-campaign-spend') {
    if (linkedCampaignIds.length === 0) return unavailable('No campaigns are linked to this objective.');
    if (key === 'campaign-enquiries') return { availability: 'available', value: sumEnquiries(linked), previousValue: range.allTime ? null : sumEnquiries(previousLinked), subtitle: 'Manually logged campaign enquiries from explicitly linked campaigns.' };
    if (key === 'marketing-leads') return { availability: 'available', value: sumLeads(linked), previousValue: range.allTime ? null : sumLeads(previousLinked), subtitle: 'Manually logged marketing leads from explicitly linked campaigns, not CRM attribution.' };
    if (!sources.campaignCosts) return unavailable('Campaign cost data unavailable.');
    const parts = linked.map((campaign) => getCampaignKnownSpend(campaign, sources.campaignCosts!, sources.googleAds ?? null));
    const value = parts.reduce((sum, item) => sum + item.knownCampaignSpend, 0);
    const missingMedia = parts.filter((item) => item.mediaSpendStatus !== 'available').length;
    return {
      availability: missingMedia ? 'partial' : 'available', value, previousValue: null,
      subtitle: `Lifetime fixed costs plus media spend for ${range.label}${missingMedia ? `; ${missingMedia} linked campaign${missingMedia === 1 ? '' : 's'} have unmapped or unavailable media spend` : ''}.`,
    };
  }

  if (scope.status === 'unavailable') return unavailable(scope.reason ?? 'Entity scope unavailable.');
  const { isGroupView, selectedEntity } = scope;
  if (key === 'website-users' || key === 'sessions') {
    const current = getWebsiteUsers(sources.ga4Traffic ?? null, isGroupView, selectedEntity);
    const previous = getWebsiteUsers(sources.previousGa4Traffic ?? null, isGroupView, selectedEntity);
    return externalActual(
      { ...current, value: key === 'website-users' ? current.activeUsers : current.sessions },
      { ...previous, value: key === 'website-users' ? previous.activeUsers : previous.sessions },
    );
  }
  if (key === 'ga4-enquiries') {
    const current = getEnquiries(sources.ga4Enquiries ?? null, isGroupView, selectedEntity);
    const previous = getEnquiries(sources.previousGa4Enquiries ?? null, isGroupView, selectedEntity);
    return externalActual({ ...current, value: current.total }, { ...previous, value: previous.total });
  }
  if (key === 'google-ads-spend') {
    const current = getGoogleAdsSummary(sources.googleAds ?? null, isGroupView, selectedEntity);
    const previous = getGoogleAdsSummary(sources.previousGoogleAds ?? null, isGroupView, selectedEntity);
    return externalActual({ ...current, value: current.spend }, { ...previous, value: previous.spend });
  }
  if (key === 'total-calls') {
    const current = getCallPerformance(sources.infinityCalls ?? null, isGroupView, selectedEntity);
    const previous = getCallPerformance(sources.previousInfinityCalls ?? null, isGroupView, selectedEntity);
    return externalActual({ ...current, value: current.totalCalls }, { ...previous, value: previous.totalCalls });
  }
  if (key === 'opportunities') return acumaticaActual(sources.acumatica, sources.previousAcumatica, 'opportunities', 'Acumatica opportunities by Created On date and Status classification.');
  if (key === 'won-deals') return acumaticaActual(sources.acumatica, sources.previousAcumatica, 'wonDeals', 'Acumatica Status Won records by Created On date; no trustworthy Won Date is available.');
  if (key === 'won-revenue') return acumaticaActual(sources.acumatica, sources.previousAcumatica, 'wonRevenue', 'Acumatica Status Won value by Created On date; no trustworthy Won Date is available.');
  if (key === 'open-pipeline') return acumaticaActual(sources.acumatica, sources.previousAcumatica, 'openPipelineValue', 'Acumatica Status Open plus Status New. Stage is not used.');
  return unavailable('No canonical resolver is available for this KPI.');
}

export function compareMarketingPlanTarget(actual: MarketingPlanActual, kpi: MarketingPlanKpi): MarketingPlanProgressRow['targetStatus'] {
  if (actual.value === null || actual.availability === 'unavailable') return 'unavailable';
  if (kpi.targetValue === null || kpi.targetStatus !== 'approved') return 'tbc';
  if (actual.value === kpi.targetValue) return 'meets';
  if (kpi.targetDirection === 'maintain') return actual.value > kpi.targetValue ? 'above' : 'below';
  if (kpi.targetDirection === 'decrease') return actual.value < kpi.targetValue ? 'meets' : 'above';
  return actual.value > kpi.targetValue ? 'meets' : 'below';
}

export interface StrategyHealthFinding {
  id: string;
  objectiveId: string;
  severity: 'attention' | 'tbc';
  title: string;
  detail: string;
}

export function getStrategyHealthFindings(rows: MarketingPlanStrategyObjective[], selectedActuals: Record<string, MarketingPlanActual>, today = new Date()): StrategyHealthFinding[] {
  const findings: StrategyHealthFinding[] = [];
  const day = new Date(today); day.setHours(0, 0, 0, 0);
  for (const row of rows) {
    const { objective } = row;
    const add = (id: string, severity: StrategyHealthFinding['severity'], title: string, detail: string) => findings.push({ id: `${objective.id}-${id}`, objectiveId: objective.id, severity, title, detail });
    if (!row.kpis.length) add('no-kpi', 'tbc', 'No KPI linked', 'Add an approved KPI when measurement has been agreed.');
    const tbcTargets = row.kpis.filter((kpi) => kpi.targetValue === null || kpi.targetStatus === 'tbc').length;
    if (tbcTargets) add('target-tbc', 'tbc', `${tbcTargets} KPI target${tbcTargets === 1 ? '' : 's'} TBC`, 'Enter and approve the target when evidence is available.');
    const rationale = [objective.whyItMatters, objective.customerMarketContext, objective.commercialRelevance, objective.marketingRationale];
    const missingRationale = rationale.filter((value) => !value.trim()).length;
    if (missingRationale) add('rationale', 'tbc', 'Rationale incomplete', `${missingRationale} of 4 rationale fields are still blank.`);
    if (objective.quarter === null) add('timeframe', 'tbc', 'Quarter TBC', 'The objective is excluded from quarter views until a quarter is assigned.');
    if (!objective.entities.length) add('entities', 'tbc', 'Entities TBC', 'Select the entity scope before resolving performance.');
    for (const priority of row.priorities) {
      const connected = row.campaignLinks.some((link) => link.priorityId === priority.id) || row.milestones.some((milestone) => milestone.priorityId === priority.id);
      if (!connected) add(`priority-${priority.id}`, 'tbc', 'Priority has no delivery link', priority.title);
    }
    for (const milestone of row.milestones) {
      if (milestone.dueDate && milestone.status !== 'complete' && new Date(`${milestone.dueDate}T00:00:00`) < day) add(`milestone-${milestone.id}`, 'attention', 'Milestone overdue', `${milestone.title} was due ${new Date(`${milestone.dueDate}T00:00:00`).toLocaleDateString('en-GB')}.`);
    }
    if (objective.nextReviewDate && new Date(`${objective.nextReviewDate}T00:00:00`) < day) add('review', 'attention', 'Objective review overdue', `Review was due ${new Date(`${objective.nextReviewDate}T00:00:00`).toLocaleDateString('en-GB')}.`);
    for (const kpi of row.kpis) {
      const actual = selectedActuals[kpi.id];
      if (actual?.availability === 'unavailable') add(`source-${kpi.id}`, 'attention', 'KPI source unavailable', actual.subtitle);
    }
  }
  return findings;
}
