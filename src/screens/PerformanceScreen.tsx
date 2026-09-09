import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { PerformanceOverTimePanel } from '@/components/performance/PerformanceOverTimePanel';
import { LeadsBreakdown, type LeadsBreakdownRow } from '@/components/performance/LeadsBreakdown';
import { PerformanceByBrandTable, type BrandPerformanceRow } from '@/components/performance/PerformanceByBrandTable';
import { CampaignPerformanceTable } from '@/components/performance/CampaignPerformanceTable';
import { BRAND_COLOR } from '@/utils/brandColors';
import { Brand } from '@/types/index';
import {
  filterCampaignsByPeriod,
  filterCampaignsByDateRange,
  sumLeads,
  sumEnquiries,
  MARKETING_LEADS_CAVEAT,
} from '@/utils/campaignMetrics';
import { sumKnownCampaignSpend, KNOWN_CAMPAIGN_SPEND_CAVEAT } from '@/utils/campaignCosts';
import { getCallsSnapshot } from '@/utils/channelSnapshot';
import { resolveGa4DateRange, getWebsiteUsers, getWebsiteUsersForBrand, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
import { resolveEmailDateRange, getEmailPerformance } from '@/utils/emailPerformance';
import { getPreviousPeriodRange, compareToPrevious } from '@/utils/periodComparison';
import { fetchGa4Traffic, fetchGa4Enquiries, type Ga4TrafficResponse, type Ga4EnquiriesResponse } from '@/services/ga4Api';
import { fetchAcumaticaSummary, type AcumaticaSummary } from '@/services/acumaticaApi';
import type { BrandAcumaticaInfo } from '@/components/performance/PerformanceByBrandTable';

interface PerformanceScreenProps {
  onNavigate?: (screen: string) => void;
}

// Converts a raw AcumaticaSummary fetch (or its absence) into the honest
// three-state shape PerformanceByBrandTable renders — 'not-available' for
// a brand structurally outside Acumatica (IRCL), 'not-connected' when no
// export has been imported yet or the fetch hasn't resolved, 'available'
// only once real imported data exists. Never presents a missing brand as
// a genuine £0/0.
function toBrandAcumaticaInfo(summary: AcumaticaSummary | null | undefined): BrandAcumaticaInfo {
  if (!summary) {
    return { status: 'not-connected', subtitle: 'No Acumatica export imported yet' };
  }
  if (summary.notAvailableForBrand) {
    return {
      status: 'not-available',
      subtitle: summary.notAvailableReason ? `Not available — ${summary.notAvailableReason}` : 'Not available',
    };
  }
  if (!summary.hasImportedData) {
    return { status: 'not-connected', subtitle: 'No Acumatica export imported yet' };
  }
  return {
    status: 'available',
    opportunities: summary.opportunities,
    openPipelineValue: summary.openPipelineValue,
    openPipelineCount: summary.openPipelineCount,
    wonRevenue: summary.wonRevenue,
    subtitle: 'Manual Acumatica export — see Settings for last import',
  };
}

// Cross-channel, cross-entity reporting — the main "how is marketing
// performing, which entity, which channels, what commercial outcome"
// view. Every figure here is either real (manually-logged campaign
// fields, real Campaign Monitor/Infinity data) or an honest "Not
// connected"/"Not available" state — never a fabricated number or chart.
// Headline totals, period filtering, and channel figures deliberately
// reuse the exact same utilities as Overview (src/utils/campaignMetrics.ts,
// src/utils/channelSnapshot.ts) so the two pages can never disagree.
export function PerformanceScreen({ onNavigate }: PerformanceScreenProps) {
  const campaigns = useAppStore((s) => s.campaigns);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const ga4Traffic = useAppStore((s) => s.ga4Traffic);
  const ga4SocialTraffic = useAppStore((s) => s.ga4SocialTraffic);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const campaignCosts = useAppStore((s) => s.campaignCosts);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const syncGa4SocialTraffic = useAppStore((s) => s.syncGa4SocialTraffic);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const syncCampaignCosts = useAppStore((s) => s.syncCampaignCosts);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  useEffect(() => {
    syncWave1Performance();
    syncWave1Calls();
  }, [syncWave1Performance, syncWave1Calls]);

  // Campaign Costs — canonical source for Known Campaign Spend (Fixed
  // Costs + connected Media Spend), same read used by the Campaigns list
  // and Campaign Detail. Not period/entity-scoped server-side (a small
  // dataset filtered client-side per campaign, same as those screens).
  useEffect(() => {
    syncCampaignCosts();
  }, [syncCampaignCosts]);

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Traffic(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Traffic]);
  useEffect(() => {
    syncGa4SocialTraffic(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4SocialTraffic]);
  useEffect(() => {
    syncGa4Enquiries(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Enquiries]);

  const googleAdsRange = useMemo(() => resolveGoogleAdsDateRange(period), [period]);
  useEffect(() => {
    syncGoogleAdsPerformance(googleAdsRange.startDate, googleAdsRange.endDate);
  }, [googleAdsRange.startDate, googleAdsRange.endDate, syncGoogleAdsPerformance]);

  const emailRange = useMemo(() => resolveEmailDateRange(period), [period]);
  useEffect(() => {
    syncEmailPerformance(emailRange.startDate, emailRange.endDate);
  }, [emailRange.startDate, emailRange.endDate, syncEmailPerformance]);

  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );

  // ---- Headline KPIs ------------------------------------------------------
  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  // Known Campaign Spend (Fixed Costs + connected Media Spend) — the
  // canonical figure from src/utils/campaignCosts.ts, never raw
  // campaign.spend. hasLegacyFallback surfaces whether any included
  // campaign still relies on its un-migrated campaign.spend value (no
  // structured campaign_costs row yet) rather than silently absorbing it.
  const marketingSpendInfo = useMemo(
    () => sumKnownCampaignSpend(periodCampaigns, campaignCosts, googleAdsPerformance),
    [periodCampaigns, campaignCosts, googleAdsPerformance]
  );
  const marketingSpend = marketingSpendInfo.total;
  const enquiriesTotal = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);
  const websiteUsers = useMemo(
    () => getWebsiteUsers(ga4Traffic, isGroupView, selectedEntity),
    [ga4Traffic, isGroupView, selectedEntity]
  );
  const socialTraffic = useMemo(
    () => getSocialTraffic(ga4SocialTraffic, isGroupView, selectedEntity),
    [ga4SocialTraffic, isGroupView, selectedEntity]
  );
  const ga4EnquiriesInfo = useMemo(
    () => getEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const googleAds = useMemo(
    () => getGoogleAdsSummary(googleAdsPerformance, isGroupView, selectedEntity),
    [googleAdsPerformance, isGroupView, selectedEntity]
  );

  // ---- Previous-period comparisons ---------------------------------------
  // See src/utils/periodComparison.ts and REPORTING_PERIOD.md/
  // KPI_DEFINITIONS.md for exactly which KPIs can honestly support this and
  // why (Website Users, GA4 Enquiries, Enquiries, Marketing Leads, Marketing
  // Spend — the same real, bounded-window sources already used above).
  // "All time" has no meaningful previous period (previousRange is null),
  // so every comparison below is null in that case — an honest "not
  // available" via KpiCard's comparison prop, never a fabricated 0%.
  //
  // GA4's previous-period figures are fetched directly (bypassing the
  // shared store, which only ever holds one "current" GA4 response) so this
  // stays entirely local to this screen and never touches what any other
  // screen sees.
  const previousRange = useMemo(() => getPreviousPeriodRange(period), [period]);
  const [previousGa4Traffic, setPreviousGa4Traffic] = useState<Ga4TrafficResponse | null>(null);
  const [previousGa4Enquiries, setPreviousGa4Enquiries] = useState<Ga4EnquiriesResponse | null>(null);
  useEffect(() => {
    if (!previousRange) {
      setPreviousGa4Traffic(null);
      setPreviousGa4Enquiries(null);
      return;
    }
    let cancelled = false;
    fetchGa4Traffic(previousRange.startDate, previousRange.endDate)
      .then((data) => { if (!cancelled) setPreviousGa4Traffic(data); })
      .catch(() => { if (!cancelled) setPreviousGa4Traffic(null); });
    fetchGa4Enquiries(previousRange.startDate, previousRange.endDate)
      .then((data) => { if (!cancelled) setPreviousGa4Enquiries(data); })
      .catch(() => { if (!cancelled) setPreviousGa4Enquiries(null); });
    return () => { cancelled = true; };
  }, [previousRange?.startDate, previousRange?.endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const previousPeriodCampaigns = useMemo(() => {
    if (!previousRange) return [];
    return filterCampaignsByDateRange(entityCampaigns, new Date(previousRange.startDate), new Date(previousRange.endDate));
  }, [entityCampaigns, previousRange]);

  const websiteUsersComparison = useMemo(() => {
    const previousUsers = getWebsiteUsers(previousGa4Traffic, isGroupView, selectedEntity);
    return compareToPrevious(
      websiteUsers.status === 'available' ? websiteUsers.activeUsers! : null,
      previousRange && previousUsers.status === 'available' ? previousUsers.activeUsers! : null
    );
  }, [websiteUsers, previousGa4Traffic, previousRange, isGroupView, selectedEntity]);

  const ga4EnquiriesComparison = useMemo(() => {
    const previousInfo = getEnquiries(previousGa4Enquiries, isGroupView, selectedEntity);
    return compareToPrevious(
      ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total! : null,
      previousRange && previousInfo.status === 'available' ? previousInfo.total! : null
    );
  }, [ga4EnquiriesInfo, previousGa4Enquiries, previousRange, isGroupView, selectedEntity]);

  const enquiriesComparison = useMemo(
    () => compareToPrevious(enquiriesTotal, previousRange ? sumEnquiries(previousPeriodCampaigns) : null),
    [enquiriesTotal, previousPeriodCampaigns, previousRange]
  );
  const leadsComparison = useMemo(
    () => compareToPrevious(marketingLeads, previousRange ? sumLeads(previousPeriodCampaigns) : null),
    [marketingLeads, previousPeriodCampaigns, previousRange]
  );
  const spendComparison = useMemo(
    () =>
      compareToPrevious(
        marketingSpend,
        previousRange ? sumKnownCampaignSpend(previousPeriodCampaigns, campaignCosts, googleAdsPerformance).total : null
      ),
    [marketingSpend, previousPeriodCampaigns, previousRange, campaignCosts, googleAdsPerformance]
  );

  // ---- Leads by Brand (group) / Leads by Campaign (single entity) --------
  const leadsByBrandRows = useMemo<LeadsBreakdownRow[]>(() => {
    return ENTITY_OPTIONS.filter((o) => o.value !== 'all').map((o) => {
      const brand = o.value as Brand;
      const brandCampaigns = filterCampaignsByPeriod(
        campaigns.filter((c) => c.brand === brand),
        periodStart
      );
      return {
        key: brand,
        label: o.label,
        value: sumLeads(brandCampaigns),
        color: BRAND_COLOR[brand],
      };
    });
  }, [campaigns, periodStart]);

  const leadsByCampaignRows = useMemo<LeadsBreakdownRow[]>(() => {
    return [...periodCampaigns]
      .sort((a, b) => (b.leads || 0) - (a.leads || 0))
      .slice(0, 8)
      .map((c) => ({
        key: c.id,
        label: c.name,
        value: c.leads || 0,
        color: BRAND_COLOR[c.brand],
        onClick: () => selectCampaign(c.id, 'performance'),
      }));
  }, [periodCampaigns, selectCampaign]);

  // ---- Acumatica — overall commercial performance, not marketing-
  // attributed ------------------------------------------------------------
  // Reuses the exact same fetchAcumaticaSummary() API and period/brand
  // date-range derivation as Leads & CRM (src/screens/LeadsCrmScreen.tsx),
  // so headline figures here always reconcile exactly with that screen for
  // the same period/entity — there is only ever one Acumatica calculation,
  // this just reads it a second time for a second screen.
  const acumaticaStartDate = periodStart ? periodStart.toISOString().slice(0, 10) : undefined;
  const acumaticaEndDate = periodStart ? new Date().toISOString().slice(0, 10) : undefined;
  const acumaticaBrand = isGroupView || selectedEntity === 'all' ? undefined : (selectedEntity as Brand);

  const [acumaticaSummary, setAcumaticaSummary] = useState<AcumaticaSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchAcumaticaSummary(acumaticaStartDate, acumaticaEndDate, acumaticaBrand)
      .then((data) => { if (!cancelled) setAcumaticaSummary(data); })
      .catch(() => { if (!cancelled) setAcumaticaSummary(null); });
    return () => { cancelled = true; };
  }, [acumaticaStartDate, acumaticaEndDate, acumaticaBrand]);

  const acumaticaNotAvailable = acumaticaSummary?.notAvailableForBrand === true;
  const acumaticaNotAvailableSubtitle = acumaticaSummary?.notAvailableReason
    ? `Not available — ${acumaticaSummary.notAvailableReason}`
    : 'Not available';

  // Per-brand Acumatica figures for Performance by Brand (group view
  // only) — same API, one call per real brand for the current period.
  const [brandAcumaticaSummaries, setBrandAcumaticaSummaries] = useState<Partial<Record<Brand, AcumaticaSummary>>>({});
  useEffect(() => {
    if (!isGroupView) return;
    let cancelled = false;
    const brands = ENTITY_OPTIONS.filter((o) => o.value !== 'all').map((o) => o.value as Brand);
    Promise.all(
      brands.map((brand) =>
        fetchAcumaticaSummary(acumaticaStartDate, acumaticaEndDate, brand)
          .then((data): [Brand, AcumaticaSummary | null] => [brand, data])
          .catch((): [Brand, AcumaticaSummary | null] => [brand, null])
      )
    ).then((results) => {
      if (cancelled) return;
      const map: Partial<Record<Brand, AcumaticaSummary>> = {};
      for (const [brand, data] of results) {
        if (data) map[brand] = data;
      }
      setBrandAcumaticaSummaries(map);
    });
    return () => { cancelled = true; };
  }, [isGroupView, acumaticaStartDate, acumaticaEndDate]);

  // ---- Performance by Brand (group level only) ----------------------------
  const brandPerformanceRows = useMemo<BrandPerformanceRow[]>(() => {
    return ENTITY_OPTIONS.filter((o) => o.value !== 'all').map((o) => {
      const brand = o.value as Brand;
      const brandCampaigns = filterCampaignsByPeriod(
        campaigns.filter((c) => c.brand === brand),
        periodStart
      );
      const brandWebsiteUsers = getWebsiteUsersForBrand(ga4Traffic, brand);
      const brandSpend = sumKnownCampaignSpend(brandCampaigns, campaignCosts, googleAdsPerformance);
      return {
        brand,
        label: o.label,
        enquiries: sumEnquiries(brandCampaigns),
        leads: sumLeads(brandCampaigns),
        spend: brandSpend.total,
        hasLegacySpendFallback: brandSpend.hasLegacyFallback,
        websiteUsers: brandWebsiteUsers.status === 'available' ? brandWebsiteUsers.activeUsers! : null,
        acumatica: toBrandAcumaticaInfo(brandAcumaticaSummaries[brand]),
      };
    });
  }, [campaigns, periodStart, ga4Traffic, campaignCosts, googleAdsPerformance, brandAcumaticaSummaries]);

  // ---- Channel Summary — identical logic to Overview ----------------------
  const emailPerf = useMemo(
    () => getEmailPerformance(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  const callsSnapshot = useMemo(
    () => getCallsSnapshot(campaigns, wave1Performance, matchesSelectedEntity),
    [campaigns, wave1Performance, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ---- Data freshness -------------------------------------------------------
  // GA4 freshness reflects the general website-traffic source this page
  // uses (ga4Traffic), not the separate campaign-scoped Wave 1 GA4 query —
  // the two have independent configured/error states. Campaign Monitor
  // freshness reflects the real sync outcome, never just "an env var is
  // set" — see backend/src/services/emailPerformance.ts.
  const ga4Configured = ga4Traffic?.configured === true;
  const ga4HasErrors = (ga4Traffic?.errors?.length ?? 0) > 0;
  const infinityConfigured = wave1Performance?.infinityConfigured === true;

  const campaignMonitorStatus: FreshnessEntry = (() => {
    switch (emailPerformance?.syncState) {
      case 'live':
        return { label: 'Campaign Monitor', status: 'live', detail: 'Live' };
      case 'error':
        return { label: 'Campaign Monitor', status: 'error', detail: 'Sync failed' };
      case 'never-synced':
        return { label: 'Campaign Monitor', status: 'stale', detail: 'Never synced' };
      default:
        return { label: 'Campaign Monitor', status: 'not-connected', detail: 'Not connected' };
    }
  })();

  const freshnessEntries: FreshnessEntry[] = [
    ga4Configured
      ? { label: 'GA4', status: ga4HasErrors ? 'error' : 'live', detail: ga4HasErrors ? 'Sync error' : 'Live' }
      : { label: 'GA4', status: 'not-connected', detail: 'Not connected' },
    infinityConfigured
      ? { label: 'Infinity (Calls)', status: (wave1Performance?.infinityErrors?.length ?? 0) > 0 ? 'error' : 'live', detail: (wave1Performance?.infinityErrors?.length ?? 0) > 0 ? 'Sync error' : 'Connected' }
      : { label: 'Infinity (Calls)', status: 'not-connected', detail: 'Not connected' },
    campaignMonitorStatus,
    acumaticaNotAvailable
      ? { label: 'Acumatica', status: 'not-connected', detail: acumaticaNotAvailableSubtitle }
      : acumaticaSummary?.hasImportedData
        ? {
            label: 'Acumatica',
            status: 'stale',
            detail: acumaticaSummary.lastImportedAt
              ? `Manual export — last imported ${new Date(acumaticaSummary.lastImportedAt).toLocaleDateString('en-GB')}`
              : 'Manual export',
          }
        : { label: 'Acumatica', status: 'not-connected', detail: 'Not connected — no manual export imported yet' },
    { label: 'Hootsuite', status: 'not-connected', detail: 'Not connected' },
    googleAdsPerformance?.configured === true
      ? {
          label: 'PPC (Google Ads)',
          status: (googleAdsPerformance?.errors?.length ?? 0) > 0 ? 'error' : 'live',
          detail: (googleAdsPerformance?.errors?.length ?? 0) > 0 ? 'Sync error' : 'Connected',
        }
      : { label: 'PPC (Google Ads)', status: 'not-connected', detail: 'Not connected' },
  ];

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Performance</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Cross-channel, cross-entity reporting across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Website Users"
            value={websiteUsers.status === 'available' ? websiteUsers.activeUsers : undefined}
            status={websiteUsers.status}
            subtitle={websiteUsers.subtitle}
            comparison={websiteUsers.status === 'available' ? websiteUsersComparison : undefined}
          />
          <KpiCard title="Enquiries" value={enquiriesTotal} subtitle="Manually logged per campaign" comparison={enquiriesComparison} />
          <KpiCard
            title="GA4 Enquiries"
            value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
            status={ga4EnquiriesInfo.status}
            subtitle={ga4EnquiriesInfo.status === 'available' ? 'Verified GA4 key events — a website action, not a qualified lead' : ga4EnquiriesInfo.subtitle}
            comparison={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesComparison : undefined}
          />
          <KpiCard title="Marketing Leads" value={marketingLeads} subtitle={MARKETING_LEADS_CAVEAT} accent="var(--v2-green)" comparison={leadsComparison} />
          <KpiCard
            title="Marketing Spend"
            value={`£${Math.round(marketingSpend).toLocaleString()}`}
            subtitle={marketingSpendInfo.hasLegacyFallback ? `${KNOWN_CAMPAIGN_SPEND_CAVEAT} — includes legacy costs needing classification` : KNOWN_CAMPAIGN_SPEND_CAVEAT}
            onClick={() => onNavigate?.('campaigns')}
            comparison={spendComparison}
          />
          <KpiCard
            title="Opportunities"
            value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? acumaticaSummary.opportunities : undefined}
            status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'}
            notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
            subtitle={
              acumaticaNotAvailable
                ? acumaticaNotAvailableSubtitle
                : acumaticaSummary?.hasImportedData
                  ? 'Manual Acumatica export — see Settings for last import'
                  : 'No Acumatica export imported yet'
            }
          />
          <KpiCard
            title="Open Pipeline"
            value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? `£${Math.round(acumaticaSummary.openPipelineValue).toLocaleString()}` : undefined}
            status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'}
            notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
            subtitle={
              acumaticaNotAvailable
                ? acumaticaNotAvailableSubtitle
                : acumaticaSummary?.hasImportedData
                  ? `${acumaticaSummary.openPipelineCount} opportunities — Status = Open + New`
                  : 'No Acumatica export imported yet'
            }
          />
          <KpiCard
            title="Won Revenue"
            value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? `£${Math.round(acumaticaSummary.wonRevenue).toLocaleString()}` : undefined}
            status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'}
            notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
            subtitle={
              acumaticaNotAvailable
                ? acumaticaNotAvailableSubtitle
                : acumaticaSummary?.hasImportedData
                  ? 'Manual Acumatica export'
                  : 'No Acumatica export imported yet'
            }
          />
        </div>
        <p className="text-xs text-text-secondary mt-2 mb-8">
          Opportunities, Open Pipeline and Won Revenue are overall commercial performance from imported Acumatica opportunity data. Not attributed to Marketing unless explicitly linked.
        </p>

        {/* Performance Over Time */}
        <div className="mb-8">
          <h2 className="v2-section-title">Performance Over Time</h2>
          <div className="card">
            <PerformanceOverTimePanel />
          </div>
        </div>

        {/* Leads by Brand / Leads by Campaign */}
        <div className="mb-8">
          <h2 className="v2-section-title">{isGroupView ? 'Leads by Brand' : `Leads by Campaign — ${entityLabel}`}</h2>
          <div className="card">
            {isGroupView ? (
              <LeadsBreakdown rows={leadsByBrandRows} emptyLabel="No leads logged yet." />
            ) : (
              <LeadsBreakdown rows={leadsByCampaignRows} emptyLabel={`No campaigns with leads logged for ${entityLabel} in this period.`} />
            )}
          </div>
        </div>

        {/* Performance by Brand — group level only; at entity level the
            campaign table below already covers this without repeating it. */}
        {isGroupView && (
          <div className="mb-8">
            <h2 className="v2-section-title">Performance by Brand</h2>
            <div className="card">
              <PerformanceByBrandTable rows={brandPerformanceRows} />
            </div>
          </div>
        )}

        {/* Campaign Performance */}
        <div className="mb-8">
          <h2 className="v2-section-title">{isGroupView ? 'Campaign Performance' : `Campaign Performance — ${entityLabel}`}</h2>
          <div className="card">
            <CampaignPerformanceTable
              campaigns={periodCampaigns}
              wave1Performance={wave1Performance}
              campaignCosts={campaignCosts}
              googleAdsPerformance={googleAdsPerformance}
              showEntityColumn={isGroupView}
              onSelectCampaign={(id) => selectCampaign(id, 'performance')}
            />
          </div>
        </div>

        {/* Channel Summary */}
        <div className="mb-4">
          <h2 className="v2-section-title">Channel Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              title="Website"
              value={websiteUsers.status === 'available' ? `${websiteUsers.activeUsers} users` : undefined}
              status={websiteUsers.status}
              subtitle={websiteUsers.subtitle}
              size="compact"
            />
            {emailPerf.status === 'available' && emailPerf.campaignsSent! > 0 ? (
              <KpiCard
                title="Email"
                value={`${emailPerf.opens} opens`}
                subtitle={`${emailPerf.campaignsSent} sends · ${emailPerf.recipients} recipients · ${emailPerf.clicks} clicks`}
                size="compact"
              />
            ) : (
              <KpiCard title="Email" status="not-connected" subtitle={emailPerf.subtitle} size="compact" />
            )}
            {socialTraffic.status === 'available' ? (
              <KpiCard
                title="Social"
                value={`${socialTraffic.sessions} sessions`}
                subtitle={`${socialTraffic.users} users · GA4 website traffic from social`}
                size="compact"
              />
            ) : (
              <KpiCard title="Social" status="not-connected" subtitle={socialTraffic.subtitle} size="compact" />
            )}
            {googleAds.status === 'available' ? (
              <KpiCard
                title="PPC"
                value={`£${googleAds.spend!.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                subtitle={`${googleAds.clicks} clicks · ${ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : 0} GA4 enquiries — see PPC page`}
                onClick={() => onNavigate?.('ppc')}
                size="compact"
              />
            ) : (
              <KpiCard title="PPC" status="not-connected" subtitle={googleAds.subtitle} onClick={() => onNavigate?.('ppc')} size="compact" />
            )}
            {callsSnapshot ? (
              <KpiCard title="Calls" value={callsSnapshot.totalCalls} subtitle={`${callsSnapshot.answeredCalls} answered — see Call Tracking`} onClick={() => onNavigate?.('infinity')} size="compact" />
            ) : (
              <KpiCard title="Calls" status="not-connected" subtitle="Awaiting Infinity integration" onClick={() => onNavigate?.('infinity')} size="compact" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
