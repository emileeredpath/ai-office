import { getCampaignEntities } from '@/utils/campaignEntities';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
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
import { resolveCallDateRange, getCallPerformance } from '@/utils/callPerformance';
import { resolveGa4DateRange, getWebsiteUsers, getWebsiteUsersForBrand, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
import { resolveEmailDateRange, getEmailPerformance } from '@/utils/emailPerformance';
import { resolveSearchConsoleDateRange, getSearchConsoleSummary } from '@/utils/searchConsole';
import { getPreviousPeriodRange, compareToPrevious } from '@/utils/periodComparison';
import { fetchGa4Traffic, fetchGa4Enquiries, type Ga4TrafficResponse, type Ga4EnquiriesResponse } from '@/services/ga4Api';
import { fetchAcumaticaSummary, type AcumaticaSummary } from '@/services/acumaticaApi';
import type { BrandAcumaticaInfo } from '@/components/performance/PerformanceByBrandTable';
import { getAcumaticaMissingDataHeadline, getAcumaticaMissingDataLabel } from '@/utils/acumaticaAvailability';

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
function toBrandAcumaticaInfo(summary: AcumaticaSummary | null | undefined, entityLabel: string): BrandAcumaticaInfo {
  if (!summary) {
    return { status: 'not-connected', subtitle: getAcumaticaMissingDataLabel(summary, entityLabel) };
  }
  if (summary.notAvailableForBrand) {
    return {
      status: 'not-available',
      subtitle: summary.notAvailableReason ? `Not available — ${summary.notAvailableReason}` : 'Not available',
    };
  }
  if (!summary.hasImportedData) {
    return {
      status: summary.hasAnyImportedData ? 'no-entity-data' : 'not-connected',
      subtitle: getAcumaticaMissingDataLabel(summary, entityLabel),
    };
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
// another integration dashboard. Shows marketing activity and response,
// then the separate commercial outcome, with entity/campaign/channel
// detail and data coverage available on demand. Every figure here is
// either real or an honest "Not connected"/"Not available" state — never
// a fabricated number or chart. Spend, GA4 Enquiries, and Acumatica figures
// deliberately reuse the exact same canonical utilities as Campaign
// Detail/Campaigns (src/utils/campaignCosts.ts) and Leads & CRM
// (src/services/acumaticaApi.ts). Different date windows can legitimately
// produce different totals; the scope is disclosed beside the figures.
export function PerformanceScreen({ onNavigate }: PerformanceScreenProps) {
  const campaigns = useAppStore((s) => s.campaigns);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
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

  const callRange = useMemo(() => resolveCallDateRange(period), [period]);
  useEffect(() => {
    syncInfinityCalls(callRange.startDate, callRange.endDate);
  }, [callRange.startDate, callRange.endDate, syncInfinityCalls]);

  const scRange = useMemo(() => resolveSearchConsoleDateRange(period), [period]);
  useEffect(() => {
    syncSearchConsolePerformance(scRange.startDate, scRange.endDate);
  }, [scRange.startDate, scRange.endDate, syncSearchConsolePerformance]);

  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => getCampaignEntities(c).some(matchesSelectedEntity)),
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
  // why (Website Users, GA4 Enquiries and campaign-cohort Marketing Leads).
  // Known Campaign Spend has mixed scope and no period comparison. "All time"
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
  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;
  const acumaticaMissingLabel = getAcumaticaMissingDataLabel(acumaticaSummary, isGroupView ? undefined : entityLabel);
  const acumaticaMissingHeadline = getAcumaticaMissingDataHeadline(acumaticaSummary);

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
        campaigns.filter((c) => getCampaignEntities(c).includes(brand)),
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
        acumatica: toBrandAcumaticaInfo(brandAcumaticaSummaries[brand], o.label),
      };
    });
  }, [campaigns, periodStart, ga4Traffic, ga4Enquiries, campaignCosts, googleAdsPerformance, brandAcumaticaSummaries]);

  // ---- F. Channel Performance — identical logic to Overview ---------------
  const emailPerf = useMemo(
    () => getEmailPerformance(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  const callPerformance = useMemo(
    () => getCallPerformance(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
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
  const infinityConfigured = infinityCalls?.configured === true;
  const infinityHasErrors = (infinityCalls?.errors?.length ?? 0) > 0;
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
    // Integration freshness is independent of an entity's confirmed mapping.
    infinityConfigured
      ? { label: 'Infinity (Calls)', status: infinityHasErrors ? 'error' : 'live', detail: infinityHasErrors ? 'Sync error — results may be incomplete' : 'Connected' }
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
        : acumaticaSummary?.hasAnyImportedData
          ? { label: 'Acumatica', status: 'stale', detail: acumaticaMissingLabel }
          : { label: 'Acumatica', status: 'not-connected', detail: acumaticaMissingLabel },
    { label: 'Hootsuite', status: 'not-connected', detail: 'Not connected' },
    // The retained Wave 1 campaign-table display is limited to one
    // hardcoded campaign (see src/utils/wave1.ts) — never general
    // per-campaign attribution. Surfaced here so the limitation is
    // visible in one place rather than only as a per-row caveat on the
    // Campaign Performance table.
    { label: 'Campaign Attribution (GA4/Calls)', status: 'stale', detail: 'Limited — Wave 1 campaign only' },
  ];

  // Two short lines, never truncated (KpiCard's subtitleWrap) — the
  // breakdown itself must always be readable without hovering; the legacy
  // classification note only appears as a second line when it applies.
  const spendBreakdownSubtitle = `Lifetime fixed costs £${Math.round(marketingSpendInfo.fixedCosts).toLocaleString()} · Available mapped media £${Math.round(marketingSpendInfo.mediaSpend).toLocaleString()}${
    marketingSpendInfo.hasLegacyFallback ? '\nIncludes legacy costs requiring classification' : ''
  }`;

  return (
    <div className="v2-page performance-page">
      <div className="performance-page-inner">
        <header className="performance-overview-header">
          <div>
            <div className="performance-eyebrow">{isGroupView ? 'MTech Group' : entityLabel}</div>
            <h1>Performance</h1>
            <p>A management view of marketing activity, response and separate commercial outcomes.</p>
          </div>
          <PeriodSelector />
        </header>

        {/* Separate measures show the available journey signals without
            implying a linked funnel or a calculable drop-off rate. */}
        <section className="v2-perf-section performance-summary-section">
          <div className="performance-section-heading">
            <div><span>Marketing view</span><h2>Activity and response</h2></div>
            <p>Independent signals for the selected entity and reporting period.</p>
          </div>
          <div className="performance-kpi-strip">
            <KpiCard
              title="Website Users"
              value={websiteUsers.status === 'available' ? websiteUsers.activeUsers : undefined}
              status={websiteUsers.status}
              subtitle={websiteUsers.subtitle}
              comparison={websiteUsers.status === 'available' ? websiteUsersComparison : undefined}
              accent="var(--v2-blue)"
            />
            <KpiCard
              title="GA4 Enquiries"
              value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
              status={ga4EnquiriesInfo.status}
              subtitle={ga4EnquiriesInfo.status === 'available' ? 'Verified GA4 key events — a website action, not a qualified lead' : ga4EnquiriesInfo.subtitle}
              subtitleWrap
              comparison={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesComparison : undefined}
              accent="var(--v2-orange)"
            />
            <KpiCard title="Marketing Leads" value={marketingLeads} subtitle={MARKETING_LEADS_CAVEAT} subtitleWrap accent="var(--v2-green)" comparison={leadsComparison} />
            <KpiCard
              title="Known Campaign Spend"
              value={`£${Math.round(marketingSpend).toLocaleString()}`}
              subtitle={spendBreakdownSubtitle}
              subtitleWrap
              onClick={() => onNavigate?.('campaigns')}
            />
          </div>
          <p className="performance-caveat">
            These are separate measures, not linked steps. Known Campaign Spend combines lifetime fixed costs for selected campaigns with available mapped media in the reporting period; it is not spend incurred in that period. Unavailable media is excluded and period spend comparisons are unavailable.
          </p>
          <div className="performance-journey-link">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Where visitors go</h3>
              <p className="text-sm text-text-secondary">Explore entry, viewed and enquiry pages where GA4 reports are available. The reports do not establish a linked visitor path or a drop-off rate.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.('website')}>
              Open page journey <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* Overall Commercial Performance — visually distinct from
            Marketing Response: these are real Acumatica opportunities,
            never implied to be caused by a campaign or channel. */}
        <section className="v2-perf-section performance-commercial-section">
          <div className="performance-section-heading">
            <div><span>Overall CRM</span><h2>Commercial outcomes</h2></div>
            <p>Acumatica totals are shown as business context and are not attributed to marketing.</p>
          </div>
          <div className="v2-commercial-panel">
            <div className="performance-commercial-strip">
              <KpiCard
                title="Opportunities"
                value={acumaticaHasData ? acumaticaSummary!.opportunities : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline}
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? 'Manual Acumatica export — see Settings for last import'
                      : acumaticaMissingLabel
                }
              />
              <KpiCard
                title="Open Pipeline"
                value={acumaticaHasData ? `£${Math.round(acumaticaSummary!.openPipelineValue).toLocaleString()}` : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline}
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? `${acumaticaSummary!.openPipelineCount} opportunities — Status = Open + New`
                      : acumaticaMissingLabel
                }
              />
              <KpiCard
                title="Won Revenue"
                value={acumaticaHasData ? `£${Math.round(acumaticaSummary!.wonRevenue).toLocaleString()}` : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline}
                subtitleWrap
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? (period === 'all-time' ? 'Current Status = Won — latest imported data' : 'Current Status = Won; Created On within the selected period')
                      : acumaticaMissingLabel
                }
              />
            </div>
            <p className="performance-caveat performance-commercial-caveat">
              Acumatica totals are overall commercial results, not attributed to Marketing unless explicitly linked. For a selected period, Won Revenue includes opportunities created in that period whose current Status is Won; it is not revenue won in that period.
            </p>
          </div>
        </section>

        {/* Full entity, campaign and channel breakdowns remain available
            after the headline measures and commercial context. */}
        <section className="v2-perf-section performance-detail-section">
          <div className="performance-section-heading">
            <div><span>Investigate</span><h2>Performance detail</h2></div>
            <p>Compare entities, channels and campaigns without changing their underlying scope.</p>
          </div>
          {isGroupView && (
            <details className="performance-disclosure" open>
              <summary>Performance by entity</summary>
              <div className="performance-disclosure-body"><PerformanceByBrandTable rows={brandPerformanceRows} /></div>
            </details>
          )}
          <details className="performance-disclosure">
            <summary>Campaign performance ({periodCampaigns.length})</summary>
            <div className="performance-disclosure-body">
              <CampaignPerformanceTable
                campaigns={periodCampaigns}
                wave1Performance={wave1Performance}
                campaignCosts={campaignCosts}
                googleAdsPerformance={googleAdsPerformance}
                showEntityColumn={isGroupView}
                onSelectCampaign={(id) => selectCampaign(id, 'performance')}
              />
            </div>
          </details>
          <details className="performance-disclosure" open>
            <summary>Channel performance</summary>
            <div className="performance-channel-grid performance-disclosure-body">
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
              <KpiCard
                title="Calls"
                value={callPerformance.status === 'available' ? callPerformance.totalCalls : undefined}
                status={callPerformance.status}
                subtitle={callPerformance.subtitle}
                onClick={() => onNavigate?.('infinity')}
                size="compact"
              />
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
          </details>

          <details className="performance-disclosure v2-perf-coverage">
            <summary>Coverage and data quality</summary>
            <div className="performance-disclosure-body"><DataFreshnessBar entries={freshnessEntries} /></div>
          </details>
        </section>
      </div>
    </div>
  );
}
