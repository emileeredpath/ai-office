import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { UnmatchedActivity } from '@/components/leads/UnmatchedActivity';
import { AcumaticaBreakdownBars, AcumaticaBreakdownTable } from '@/components/leads/AcumaticaBreakdown';
import { CommercialByEntityTable, type EntityCommercialRow } from '@/components/leads/CommercialByEntityTable';
import { filterCampaignsByPeriod, sumLeads, sumEnquiries, MARKETING_LEADS_CAVEAT } from '@/utils/campaignMetrics';
import { resolveEmailDateRange } from '@/utils/emailPerformance';
import { resolveCallDateRange } from '@/utils/callPerformance';
import { resolveGa4DateRange } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import {
  getUnmappedEmailSends,
  getUnclassifiedCalls,
  getCampaignsWithNoActivity,
  SPEND_WITHOUT_CAMPAIGN_GAP,
} from '@/utils/attributionHealth';
import { getUnmatchedGoogleAdsCampaigns, getUnmatchedGa4Campaigns } from '@/utils/campaignAttribution';
import { resolveGoogleAdsDateRange } from '@/utils/googleAdsPerformance';
import { fetchGa4CampaignNamesInUse } from '@/services/ga4Api';
import { fetchAcumaticaSummary, fetchAcumaticaBreakdowns, type AcumaticaSummary, type AcumaticaBreakdowns } from '@/services/acumaticaApi';
import { BRAND_LABEL } from '@/utils/brandColors';
import type { Brand } from '@/types/index';

const GA4_BRANDS: Brand[] = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro'];

const STATUS_LABEL: Record<string, string> = {
  won: 'Won',
  open: 'Open',
  lost: 'Lost',
  new: 'New',
  unclassified: 'Unclassified',
};

interface LeadsCrmScreenProps {
  onNavigate?: (screen: string) => void;
}

// Two clearly separate halves — Marketing Response (real, manually-logged
// + verified GA4 signals) and CRM / Commercial Performance (real, from the
// manually-imported Acumatica opportunity data) — plus the aggregate
// Pipeline & Opportunity Analysis the Acumatica data supports today. There
// is no deterministic link between the two halves (see the Leads & CRM
// audit) so this page never presents one combined Marketing → Revenue
// funnel; every commercial figure is captioned as overall commercial
// performance, not marketing-attributed.
export function LeadsCrmScreen({ onNavigate }: LeadsCrmScreenProps) {
  const campaigns = useAppStore((s) => s.campaigns);
  const tasks = useAppStore((s) => s.tasks);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();
  const { isEditor } = useAuth();

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Enquiries(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Enquiries]);

  const emailRange = useMemo(() => resolveEmailDateRange(period), [period]);
  useEffect(() => {
    syncEmailPerformance(emailRange.startDate, emailRange.endDate);
  }, [emailRange.startDate, emailRange.endDate, syncEmailPerformance]);

  const callRange = useMemo(() => resolveCallDateRange(period), [period]);
  useEffect(() => {
    syncInfinityCalls(callRange.startDate, callRange.endDate);
  }, [callRange.startDate, callRange.endDate, syncInfinityCalls]);

  const googleAdsRange = useMemo(() => resolveGoogleAdsDateRange(period), [period]);
  useEffect(() => {
    syncGoogleAdsPerformance(googleAdsRange.startDate, googleAdsRange.endDate);
  }, [googleAdsRange.startDate, googleAdsRange.endDate, syncGoogleAdsPerformance]);

  // Real gap, not a static placeholder — every real Google Ads campaign
  // this period whose ID isn't mapped to any AI Office campaign. See
  // getUnmatchedGoogleAdsCampaigns's doc comment.
  const unmatchedGoogleAdsCampaigns = useMemo(
    () => getUnmatchedGoogleAdsCampaigns(googleAdsPerformance, campaigns),
    [googleAdsPerformance, campaigns]
  );
  const googleAdsGap = useMemo(() => {
    if (!googleAdsPerformance || !googleAdsPerformance.configured) {
      return { status: 'not-connected' as const, count: null, subtitle: 'Google Ads is not connected' };
    }
    return {
      status: 'available' as const,
      count: unmatchedGoogleAdsCampaigns.length,
      subtitle: unmatchedGoogleAdsCampaigns.length > 0 ? 'Real Google Ads campaigns with no AI Office campaign mapped' : 'Every Google Ads campaign this period is mapped',
    };
  }, [googleAdsPerformance, unmatchedGoogleAdsCampaigns]);

  // Manual Google Ads -> AI Office campaign mapping — additive only:
  // appends this real Google Ads campaign ID to the chosen campaign's own
  // googleAdsCampaignIds, so an existing mapping (on this campaign or any
  // other) is never overwritten, and no AI Office campaign is ever created
  // here. See UnmatchedActivity's doc comment.
  const handleMapGoogleAdsCampaign = async (aiCampaignId: string, googleAdsCampaignId: string) => {
    const target = campaigns.find((c) => c.id === aiCampaignId);
    if (!target) throw new Error('Campaign not found.');
    const existingIds = target.googleAdsCampaignIds ?? [];
    if (existingIds.includes(googleAdsCampaignId)) return;
    await updateCampaign(aiCampaignId, { googleAdsCampaignIds: [...existingIds, googleAdsCampaignId] });
  };

  // Genuine GA4 attribution gap — a discrete list IS identifiable here
  // (sessionCampaignName breakdown, no filter), unlike per-enquiry-record
  // linking which remains genuinely unavailable. Fetched per brand this
  // period; a brand with no GA4 property configured just contributes
  // nothing (never treated as "no gap"). See
  // getUnmatchedGa4Campaigns's doc comment.
  const [ga4NamesInUse, setGa4NamesInUse] = useState<Partial<Record<Brand, string[]>>>({});
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      GA4_BRANDS.map((brand) =>
        fetchGa4CampaignNamesInUse(brand, ga4Range.startDate, ga4Range.endDate)
          .then((res) => [brand, res] as const)
          .catch(() => [brand, null] as const)
      )
    ).then((results) => {
      if (cancelled) return;
      const next: Partial<Record<Brand, string[]>> = {};
      for (const [brand, res] of results) {
        if (res && res.configured) next[brand] = res.campaignNames;
      }
      setGa4NamesInUse(next);
    });
    return () => {
      cancelled = true;
    };
  }, [ga4Range.startDate, ga4Range.endDate]);

  const unmatchedGa4Campaigns = useMemo(() => getUnmatchedGa4Campaigns(ga4NamesInUse, campaigns), [ga4NamesInUse, campaigns]);
  const ga4EnquiryGap = useMemo(() => {
    if (Object.keys(ga4NamesInUse).length === 0) {
      return { status: 'not-connected' as const, count: null, subtitle: 'GA4 is not connected' };
    }
    return {
      status: 'available' as const,
      count: unmatchedGa4Campaigns.length,
      subtitle: unmatchedGa4Campaigns.length > 0 ? 'Real GA4 campaigns with traffic this period but no AI Office campaign mapped' : 'Every GA4 campaign with traffic this period is mapped',
    };
  }, [ga4NamesInUse, unmatchedGa4Campaigns]);

  // ---- A. Marketing Response ------------------------------------------
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );
  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  const enquiriesTotal = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);
  const ga4EnquiriesInfo = useMemo(
    () => getEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );

  // ---- B. CRM / Commercial Performance — Acumatica, not marketing-
  // attributed ------------------------------------------------------------
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

  // ---- C. Pipeline & Opportunity Analysis — same canonical scope as B ---
  const [acumaticaBreakdowns, setAcumaticaBreakdowns] = useState<AcumaticaBreakdowns | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchAcumaticaBreakdowns(acumaticaStartDate, acumaticaEndDate, acumaticaBrand)
      .then((data) => { if (!cancelled) setAcumaticaBreakdowns(data); })
      .catch(() => { if (!cancelled) setAcumaticaBreakdowns(null); });
    return () => { cancelled = true; };
  }, [acumaticaStartDate, acumaticaEndDate, acumaticaBrand]);

  // ---- Commercial Performance by Entity (group view only) ---------------
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

  const entityCommercialRows = useMemo<EntityCommercialRow[]>(() => {
    return ENTITY_OPTIONS.filter((o) => o.value !== 'all').map((o) => {
      const brand = o.value as Brand;
      const summary = brandAcumaticaSummaries[brand];
      if (!summary) {
        return { brand, label: o.label, status: 'not-connected', subtitle: 'No Acumatica export imported yet' };
      }
      if (summary.notAvailableForBrand) {
        return {
          brand,
          label: o.label,
          status: 'not-available',
          subtitle: summary.notAvailableReason ? `Not available — ${summary.notAvailableReason}` : 'Not available',
        };
      }
      if (!summary.hasImportedData) {
        return { brand, label: o.label, status: 'not-connected', subtitle: 'No Acumatica export imported yet' };
      }
      return {
        brand,
        label: o.label,
        status: 'available',
        opportunities: summary.opportunities,
        openPipelineValue: summary.openPipelineValue,
        wonDeals: summary.wonDeals,
        wonRevenue: summary.wonRevenue,
        lostDeals: summary.lostDeals,
        subtitle: 'Manual Acumatica export — see Settings for last import',
      };
    });
  }, [brandAcumaticaSummaries]);

  // ---- Unmatched Activity — see src/utils/attributionHealth.ts ----------
  const unmappedEmailSends = useMemo(
    () => getUnmappedEmailSends(emailPerformance, matchesSelectedEntity),
    [emailPerformance, matchesSelectedEntity]
  );
  const unclassifiedCalls = useMemo(
    () => getUnclassifiedCalls(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const campaignsWithNoActivity = useMemo(
    () => getCampaignsWithNoActivity(periodCampaigns, tasks.filter((t) => matchesSelectedEntity(t.brand))),
    [periodCampaigns, tasks, matchesSelectedEntity]
  );

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  const cmConfigured = emailPerformance?.configured === true;
  const infinityConfigured = infinityCalls?.configured === true;
  const freshnessEntries: FreshnessEntry[] = [
    cmConfigured
      ? { label: 'Campaign Monitor', status: emailPerformance?.syncState === 'live' ? 'live' : 'error', detail: emailPerformance?.syncState === 'live' ? 'Connected' : 'Sync error' }
      : { label: 'Campaign Monitor', status: 'not-connected', detail: 'Not connected' },
    infinityConfigured
      ? { label: 'Infinity', status: 'live', detail: 'Connected' }
      : { label: 'Infinity', status: 'not-connected', detail: 'Not connected' },
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
  ];

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Leads & CRM</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Marketing response and overall commercial performance across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* A. Marketing Response — real, manually-logged + verified GA4
            signals. Marketing KPIs display for any entity that supports
            them (e.g. IRCL has a verified GA4 Enquiry definition) even
            when CRM/commercial data below is unavailable for that
            entity. */}
        <section className="v2-perf-section">
          <h2 className="v2-section-title">Marketing Response</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard
              title="Marketing Leads"
              value={marketingLeads}
              subtitle="Manually logged against campaigns"
              accent="var(--v2-green)"
              onClick={() => onNavigate?.('campaigns')}
            />
            <KpiCard
              title="GA4 Enquiries"
              value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
              status={ga4EnquiriesInfo.status}
              subtitle={ga4EnquiriesInfo.status === 'available' ? 'Verified website enquiry events' : ga4EnquiriesInfo.subtitle}
            />
            <KpiCard title="Logged Enquiries" value={enquiriesTotal} subtitle="Manually entered campaign results" />
          </div>
        </section>

        {/* B. CRM / Commercial Performance — visually distinct: these are
            real Acumatica opportunities, never implied to be caused by a
            campaign or channel. */}
        <section className="v2-perf-section">
          <h2 className="v2-section-title">CRM / Commercial Performance</h2>
          <div className="v2-commercial-panel">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                title="Won Deals"
                value={acumaticaHasData ? acumaticaSummary!.wonDeals : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? 'Status = Won'
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
              <KpiCard
                title="Lost"
                value={acumaticaHasData ? acumaticaSummary!.lostDeals : undefined}
                status={acumaticaHasData ? 'available' : 'not-connected'}
                notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
                subtitle={
                  acumaticaNotAvailable
                    ? acumaticaNotAvailableSubtitle
                    : acumaticaHasData
                      ? 'Status = Lost'
                      : 'No Acumatica export imported yet'
                }
              />
            </div>
            <p className="v2-perf-section-subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
              Overall commercial performance from imported Acumatica opportunity data. Not attributed to Marketing unless explicitly linked.
            </p>
          </div>

          {isGroupView && (
            <div className="card mt-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Commercial Performance by Entity</h3>
              <CommercialByEntityTable rows={entityCommercialRows} />
            </div>
          )}
        </section>

        {/* C. Pipeline & Opportunity Analysis — same canonical scope as B.
            Stage is shown for genuine display only; it never changes
            commercial classification (Status alone decides that). */}
        <section className="v2-perf-section">
          <h2 className="v2-section-title">Pipeline & Opportunity Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Pipeline by Stage</h3>
              <AcumaticaBreakdownBars
                entries={acumaticaBreakdowns?.byStage ?? []}
                emptyLabel={acumaticaNotAvailable ? acumaticaNotAvailableSubtitle : 'No opportunities in this period.'}
              />
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Opportunity Class</h3>
              <AcumaticaBreakdownBars
                entries={acumaticaBreakdowns?.byOpportunityClass ?? []}
                emptyLabel={acumaticaNotAvailable ? acumaticaNotAvailableSubtitle : 'No opportunities in this period.'}
                color="#2E9ECC"
              />
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Product Focus</h3>
              <AcumaticaBreakdownBars
                entries={acumaticaBreakdowns?.byProductFocus ?? []}
                emptyLabel={acumaticaNotAvailable ? acumaticaNotAvailableSubtitle : 'No opportunities in this period.'}
                color="var(--v2-green)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* D. Sales-reported Source — never merged with deterministic
                Marketing attribution; see the note below the table. */}
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Sales-reported Source</h3>
              <p className="text-xs text-text-secondary mb-3">
                Sales-entered source information from Acumatica. This is not deterministic Marketing attribution.
              </p>
              <AcumaticaBreakdownTable
                columnLabel="Sales-reported Source"
                entries={acumaticaBreakdowns?.bySalesReportedSource ?? []}
                emptyLabel={acumaticaNotAvailable ? acumaticaNotAvailableSubtitle : 'No opportunities in this period.'}
              />
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Commercial Status</h3>
              <AcumaticaBreakdownTable
                columnLabel="Status"
                entries={acumaticaBreakdowns?.byCommercialStatus ?? []}
                emptyLabel={acumaticaNotAvailable ? acumaticaNotAvailableSubtitle : 'No opportunities in this period.'}
                labelFor={(key) => STATUS_LABEL[key] ?? key}
              />
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Entity</h3>
              <AcumaticaBreakdownTable
                columnLabel="Entity"
                entries={acumaticaBreakdowns?.byEntity ?? []}
                emptyLabel={acumaticaNotAvailable ? acumaticaNotAvailableSubtitle : 'No opportunities in this period.'}
                labelFor={(key) => BRAND_LABEL[key as Brand] ?? key}
              />
            </div>
          </div>

          {/* E. Data Quality — only shown when there is something to flag. */}
          {acumaticaBreakdowns && !acumaticaNotAvailable && (acumaticaSummary?.unclassifiedCount ?? 0) + (acumaticaSummary?.undated ?? 0) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {(acumaticaSummary?.unclassifiedCount ?? 0) > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--v2-orange)' }}>
                  <div className="text-sm font-semibold text-text-primary">{acumaticaSummary!.unclassifiedCount} unclassified</div>
                  <p className="text-xs text-text-secondary mt-1">Status could not be mapped to Won / Open / New / Lost.</p>
                </div>
              )}
              {(acumaticaSummary?.undated ?? 0) > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--v2-orange)' }}>
                  <div className="text-sm font-semibold text-text-primary">{acumaticaSummary!.undated} undated</div>
                  <p className="text-xs text-text-secondary mt-1">Excluded from period-scoped reporting because Created On is unavailable.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* F. Attribution boundary — real, computed marketing-side gaps
            (Unmatched Activity) are preserved in full below; only the
            Acumatica-pending Attribution Health stub is replaced by this
            one compact note. */}
        <section className="v2-perf-section">
          <p className="v2-not-connected-text" style={{ fontSize: 13 }}>
            Campaign-to-opportunity attribution is not currently available. CRM figures above represent overall commercial performance and are not attributed to Marketing.
          </p>
        </section>

        {/* Unmatched Activity — genuine, computed today from data AI
            Office already has (Campaign Monitor sends, Infinity calls,
            campaign records). Distinct from CRM/Commercial Performance
            above: this never depends on Acumatica. */}
        <section className="v2-perf-section">
          <h2 className="v2-section-title">Unmatched Activity</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real activity that isn't confidently linked to an AI Office campaign — using only the existing,
            deterministic links each integration already computes. Nothing here is a weak or inferred match; where
            a source has no linkage mechanism at all yet, that's shown as "N/A", never guessed.
          </p>
          <UnmatchedActivity
            unmappedEmailSends={unmappedEmailSends}
            unclassifiedCalls={unclassifiedCalls}
            googleAdsGap={googleAdsGap}
            ga4EnquiryGap={ga4EnquiryGap}
            spendGap={SPEND_WITHOUT_CAMPAIGN_GAP}
            campaignsWithNoActivity={campaignsWithNoActivity}
            unmatchedGoogleAdsCampaigns={unmatchedGoogleAdsCampaigns}
            campaigns={campaigns}
            isEditor={isEditor}
            onMapGoogleAdsCampaign={handleMapGoogleAdsCampaign}
          />
        </section>
      </div>
    </div>
  );
}
