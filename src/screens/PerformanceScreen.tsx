import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { PerformanceByBrandTable, type BrandPerformanceRow } from '@/components/performance/PerformanceByBrandTable';
import { CampaignPerformanceTable } from '@/components/performance/CampaignPerformanceTable';
import { Brand } from '@/types/index';
import {
  filterCampaignsByPeriod,
  filterCampaignsByDateRange,
  sumLeads,
  MARKETING_LEADS_CAVEAT,
} from '@/utils/campaignMetrics';
import { sumKnownCampaignSpend } from '@/utils/campaignCosts';
import { getCallsSnapshot } from '@/utils/channelSnapshot';
import { resolveGa4DateRange, getWebsiteUsers, getWebsiteUsersForBrand, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
import { resolveEmailDateRange, getEmailPerformance } from '@/utils/emailPerformance';
import { resolveSearchConsoleDateRange, getSearchConsoleSummary } from '@/utils/searchConsole';
import { getPreviousPeriodRange, compareToPrevious } from '@/utils/periodComparison';
import { fetchGa4Traffic, fetchGa4Enquiries, type Ga4TrafficResponse, type Ga4EnquiriesResponse } from '@/services/ga4Api';
import { fetchAcumaticaSummary, type AcumaticaSummary } from '@/services/acumaticaApi';
import type { BrandAcumaticaInfo } from '@/components/performance/PerformanceByBrandTable';

interface PerformanceScreenProps {
  onNavigate?: (screen: string) => void;
}

// Converts a raw AcumaticaSummary fetch (or its absence) into the honest
// three-state shape PerformanceByBrandTable renders — 'not-available' for
// a brand structurally outside Acumatica (IRCL), 'not-connected' when this
// brand has no imported opportunities of its own (see the Acumatica
// Per-Entity Availability phase — never inferred from another brand's
// import), 'available' only once real imported data exists for THIS
// brand. Never presents a missing brand as a genuine £0/0.
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

// The strategic Marketing Manager reporting page — deliberately not
// another integration dashboard. Answers, in order: what did Marketing
// spend, what response did it generate, how is that changing, which
// entities/campaigns/channels are performing, what commercial outcome do
// we know, and where is data/attribution incomplete. Every figure here is
// either real or an honest "Not connected"/"Not available" state — never
// a fabricated number or chart. Spend, GA4 Enquiries, and Acumatica figures
// deliberately reuse the exact same canonical utilities as Campaign
// Detail/Campaigns (src/utils/campaignCosts.ts) and Leads & CRM
// (src/services/acumaticaApi.ts) so no two screens can ever disagree.
export function PerformanceScreen({ onNavigate }: PerformanceScreenProps) {
  const campaigns = useAppStore((s) => s.campaigns);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const ga4Traffic = useAppStore((s) => s.ga4Traffic);
  const ga4SocialTraffic = useAppStore((s) => s.ga4SocialTraffic);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const searchConsolePerformance = useAppStore((s) => s.searchConsolePerformance);
  const campaignCosts = useAppStore((s) => s.campaignCosts);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const syncGa4SocialTraffic = useAppStore((s) => s.syncGa4SocialTraffic);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const syncSearchConsolePerformance = useAppStore((s) => s.syncSearchConsolePerformance);
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

  const scRange = useMemo(() => resolveSearchConsoleDateRange(period), [period]);
  useEffect(() => {
    syncSearchConsolePerformance(scRange.startDate, scRange.endDate);
  }, [scRange.startDate, scRange.endDate, syncSearchConsolePerformance]);

  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );

  // ---- A. Marketing Performance — headline KPIs ---------------------------
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
  const searchConsoleSummary = useMemo(
    () => getSearchConsoleSummary(searchConsolePerformance, isGroupView, selectedEntity),
    [searchConsolePerformance, isGroupView, selectedEntity]
  );

  // ---- Previous-period comparisons ---------------------------------------
  // See src/utils/periodComparison.ts and REPORTING_PERIOD.md/
  // KPI_DEFINITIONS.md for exactly which KPIs can honestly support this and
  // why (Website Users, GA4 Enquiries, Marketing Leads, Marketing Spend —
  // the same real, bounded-window sources already used above). "All time"
  // has no meaningful previous period (previousRange is null), so every
  // comparison below is null in that case — an honest "not available" via
  // KpiCard's comparison prop, never a fabricated 0%.
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

  // ---- E. Overall Commercial Performance — Acumatica, not marketing-
  // attributed --------------------------------------------------------------
  // Reuses the exact same fetchAcumaticaSummary() API and period/brand
  // date-range derivation as Leads & CRM (src/screens/LeadsCrmScreen.tsx),
  // so figures here always reconcile exactly with that screen for the same
  // period/entity — there is only ever one Acumatica calculation, this
  // just reads it a second time for a second screen.
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
  const acumaticaHasData = acumaticaSummary?.hasImportedData === true && !acumaticaNotAvailable;

  // Per-brand Acumatica figures for Performance by Entity (group view
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

  // ---- C. Performance by Entity (group level only) ------------------------
  const brandPerformanceRows = useMemo<BrandPerformanceRow[]>(() => {
    return ENTITY_OPTIONS.filter((o) => o.value !== 'all').map((o) => {
      const brand = o.value as Brand;
      const brandCampaigns = filterCampaignsByPeriod(
        campaigns.filter((c) => c.brand === brand),
        periodStart
      );
      const brandWebsiteUsers = getWebsiteUsersForBrand(ga4Traffic, brand);
      const brandGa4Enquiries = getEnquiries(ga4Enquiries, false, brand);
      const brandSpend = sumKnownCampaignSpend(brandCampaigns, campaignCosts, googleAdsPerformance);
      return {
        brand,
        label: o.label,
        websiteUsers: brandWebsiteUsers.status === 'available' ? brandWebsiteUsers.activeUsers! : null,
        ga4Enquiries: brandGa4Enquiries.status === 'available' ? brandGa4Enquiries.total! : null,
        leads: sumLeads(brandCampaigns),
        spend: brandSpend.total,
        hasLegacySpendFallback: brandSpend.hasLegacyFallback,
        acumatica: toBrandAcumaticaInfo(brandAcumaticaSummaries[brand]),
      };
    });
  }, [campaigns, periodStart, ga4Traffic, ga4Enquiries, campaignCosts, googleAdsPerformance, brandAcumaticaSummaries]);

  // ---- F. Channel Performance — identical logic to Overview ---------------
  const emailPerf = useMemo(
    () => getEmailPerformance(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  const callsSnapshot = useMemo(
    () => getCallsSnapshot(campaigns, wave1Performance, matchesSelectedEntity),
    [campaigns, wave1Performance, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ---- G. Coverage / Data Quality ------------------------------------------
  // GA4 freshness reflects the general website-traffic source this page
  // uses (ga4Traffic), not the separate campaign-scoped Wave 1 GA4 query —
  // the two have independent configured/error states. Campaign Monitor
  // freshness reflects the real sync outcome, never just "an env var is
  // set" — see backend/src/services/emailPerformance.ts. One compact strip
  // for the whole page — no other section repeats this state messaging.
  const ga4Configured = ga4Traffic?.configured === true;
  const ga4HasErrors = (ga4Traffic?.errors?.length ?? 0) > 0;
  const infinityConfigured = wave1Performance?.infinityConfigured === true;
  const scConfigured = searchConsolePerformance?.configured === true;
  const scHasErrors = (searchConsolePerformance?.errors?.length ?? 0) > 0;

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
    scConfigured
      ? { label: 'Search Console', status: scHasErrors ? 'error' : 'live', detail: scHasErrors ? 'Sync error' : 'Live' }
      : { label: 'Search Console', status: 'not-connected', detail: 'Not connected' },
    // "Connected" here means the Infinity integration itself is live —
    // distinct from whether THIS entity has any real call data to show.
    // Infinity's real data today is scoped to one hardcoded campaign (see
    // src/utils/wave1.ts), so a connected integration can still show
    // "Not connected" on an out-of-scope entity's Channel Performance
    // tile below — that's a genuine data-availability gap, not a
    // contradiction, and the "Wave 1 campaign only" suffix here makes
    // that explicit rather than leaving the two readings unreconciled.
    infinityConfigured
      ? { label: 'Infinity (Calls)', status: (wave1Performance?.infinityErrors?.length ?? 0) > 0 ? 'error' : 'live', detail: (wave1Performance?.infinityErrors?.length ?? 0) > 0 ? 'Sync error' : 'Connected — Wave 1 campaign only' }
      : { label: 'Infinity (Calls)', status: 'not-connected', detail: 'Not connected' },
    campaignMonitorStatus,
    googleAdsPerformance?.configured === true
      ? {
          label: 'PPC (Google Ads)',
          status: (googleAdsPerformance?.errors?.length ?? 0) > 0 ? 'error' : 'live',
          detail: (googleAdsPerformance?.errors?.length ?? 0) > 0 ? 'Sync error' : 'Connected',
        }
      : { label: 'PPC (Google Ads)', status: 'not-connected', detail: 'Not connected' },
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
    // Wave 1 campaign-level GA4/Calls attribution is scoped to one
    // hardcoded campaign (see src/utils/wave1.ts) — never general
    // per-campaign attribution. Surfaced here so the limitation is
    // visible in one place rather than only as a per-row caveat on the
    // Campaign Performance table.
    { label: 'Campaign Attribution (GA4/Calls)', status: 'stale', detail: 'Limited — Wave 1 campaign only' },
  ];

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  // Two short lines, never truncated (KpiCard's subtitleWrap) — the
  // breakdown itself must always be readable without hovering; the legacy
  // classification note only appears as a second line when it applies.
  const spendBreakdownSubtitle = `Fixed costs £${Math.round(marketingSpendInfo.fixedCosts).toLocaleString()} · Media £${Math.round(marketingSpendInfo.mediaSpend).toLocaleString()}${
    marketingSpendInfo.hasLegacyFallback ? '\nIncludes legacy costs requiring classification' : ''
  }`;

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

        {/* A. Marketing Performance — what did Marketing spend, and the
            top-line response/change-vs-previous-period summary. */}
        <section className="v2-perf-section">
          <h2 className="v2-section-title">Marketing Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Marketing Spend"
              value={`£${Math.round(marketingSpend).toLocaleString()}`}
              subtitle={spendBreakdownSubtitle}
              subtitleWrap
              onClick={() => onNavigate?.('campaigns')}
              comparison={spendComparison}
            />
            <KpiCard title="Marketing Leads" value={marketingLeads} subtitle={MARKETING_LEADS_CAVEAT} accent="var(--v2-green)" comparison={leadsComparison} />
            <KpiCard
              title="GA4 Enquiries"
              value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
              status={ga4EnquiriesInfo.status}
              subtitle={ga4EnquiriesInfo.status === 'available' ? 'Verified GA4 key events — a website action, not a qualified lead' : ga4EnquiriesInfo.subtitle}
              comparison={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesComparison : undefined}
            />
            <KpiCard
              title="Website Users"
              value={websiteUsers.status === 'available' ? websiteUsers.activeUsers : undefined}
              status={websiteUsers.status}
              subtitle={websiteUsers.subtitle}
              comparison={websiteUsers.status === 'available' ? websiteUsersComparison : undefined}
            />
          </div>
        </section>

        {/* C. Performance by Entity — group level only; at entity level
            the campaign table below already covers this without
            repeating it. */}
        {isGroupView && (
          <section className="v2-perf-section">
            <h2 className="v2-section-title">Performance by Entity</h2>
            <div className="card">
              <PerformanceByBrandTable rows={brandPerformanceRows} />
            </div>
          </section>
        )}

        {/* D. Campaign Performance — canonical spend; attribution stays
            honest and Wave-1-scoped, never expanded here. */}
        <section className="v2-perf-section">
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
        </section>

        {/* E. Overall Commercial Performance — visually distinct from
            Marketing Response: these are real Acumatica opportunities,
            never implied to be caused by a campaign or channel. */}
        <section className="v2-perf-section">
          <h2 className="v2-section-title">Overall Commercial Performance</h2>
          <div className="v2-commercial-panel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                title="Opportunities"
                value={acumaticaHasData ? acumaticaSummary!.opportunities : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? 'Manual Acumatica export — see Settings for last import'
                      : 'No Acumatica export imported yet'
                }
              />
              <KpiCard
                title="Open Pipeline"
                value={acumaticaHasData ? `£${Math.round(acumaticaSummary!.openPipelineValue).toLocaleString()}` : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? `${acumaticaSummary!.openPipelineCount} opportunities — Status = Open + New`
                      : 'No Acumatica export imported yet'
                }
              />
              <KpiCard
                title="Won Revenue"
                value={acumaticaHasData ? `£${Math.round(acumaticaSummary!.wonRevenue).toLocaleString()}` : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? 'Manual Acumatica export'
                      : 'No Acumatica export imported yet'
                }
              />
            </div>
            <p className="v2-perf-section-subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
              Overall commercial performance from imported Acumatica opportunity data. Not attributed to Marketing unless explicitly linked.
            </p>
          </div>
        </section>

        {/* F. Channel Performance — compact, link-through only; detailed
            metrics stay on each channel's own dedicated page. */}
        <section className="v2-perf-section">
          <h2 className="v2-section-title">Channel Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              title="Website"
              value={websiteUsers.status === 'available' ? `${websiteUsers.activeUsers} users` : undefined}
              status={websiteUsers.status}
              subtitle={websiteUsers.subtitle}
              onClick={() => onNavigate?.('website')}
              size="compact"
            />
            {searchConsoleSummary.status === 'available' ? (
              <KpiCard
                title="Organic Search"
                value={`${searchConsoleSummary.clicks!.toLocaleString()} clicks`}
                subtitle={`${searchConsoleSummary.impressions!.toLocaleString()} impressions — see Website`}
                onClick={() => onNavigate?.('website')}
                size="compact"
              />
            ) : (
              <KpiCard title="Organic Search" status="not-connected" subtitle={searchConsoleSummary.subtitle} onClick={() => onNavigate?.('website')} size="compact" />
            )}
            {emailPerf.status === 'available' && emailPerf.campaignsSent! > 0 ? (
              <KpiCard
                title="Email"
                value={`${emailPerf.opens} opens`}
                subtitle={`${emailPerf.campaignsSent} sends · ${emailPerf.recipients} recipients — see Email`}
                onClick={() => onNavigate?.('email')}
                size="compact"
              />
            ) : (
              <KpiCard title="Email" status="not-connected" subtitle={emailPerf.subtitle} onClick={() => onNavigate?.('email')} size="compact" />
            )}
            {googleAds.status === 'available' ? (
              <KpiCard
                title="PPC"
                value={`£${googleAds.spend!.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                subtitle={`${googleAds.clicks} clicks — see PPC`}
                onClick={() => onNavigate?.('ppc')}
                size="compact"
              />
            ) : (
              <KpiCard title="PPC" status="not-connected" subtitle={googleAds.subtitle} onClick={() => onNavigate?.('ppc')} size="compact" />
            )}
            {callsSnapshot ? (
              <KpiCard title="Calls" value={callsSnapshot.totalCalls} subtitle={`${callsSnapshot.answeredCalls} answered — see Call Tracking`} onClick={() => onNavigate?.('infinity')} size="compact" />
            ) : (
              // Infinity being globally "Connected" (Coverage & Data
              // Quality below) doesn't mean this entity has real call
              // data — Infinity's real data is scoped to one Wave 1
              // campaign. Distinguish that from the integration itself
              // genuinely not being set up, so the two states never read
              // as contradictory.
              <KpiCard
                title="Calls"
                status="not-connected"
                subtitle={infinityConfigured ? 'No calls scoped to this entity — Wave 1 campaign only' : 'Awaiting Infinity integration'}
                onClick={() => onNavigate?.('infinity')}
                size="compact"
              />
            )}
            {socialTraffic.status === 'available' ? (
              <KpiCard
                title="Social"
                value={`${socialTraffic.sessions} sessions`}
                subtitle={`${socialTraffic.users} users — see Social`}
                onClick={() => onNavigate?.('social')}
                size="compact"
              />
            ) : (
              <KpiCard title="Social" status="not-connected" subtitle={socialTraffic.subtitle} onClick={() => onNavigate?.('social')} size="compact" />
            )}
          </div>
        </section>

        {/* G. Coverage / Data Quality — one compact strip for the whole
            page's source state, replacing the previously scattered
            per-section messaging. */}
        <section className="v2-perf-section v2-perf-coverage" style={{ marginBottom: 8 }}>
          <h2 className="v2-section-title">Coverage &amp; Data Quality</h2>
          <DataFreshnessBar entries={freshnessEntries} />
        </section>
      </div>
    </div>
  );
}
