import { useEffect, useMemo } from 'react';
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
import { filterCampaignsByPeriod, sumLeads, sumSpend, sumEnquiries } from '@/utils/campaignMetrics';
import { getCallsSnapshot } from '@/utils/channelSnapshot';
import { resolveGa4DateRange, getWebsiteUsers, getWebsiteUsersForBrand, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import { resolveEmailDateRange, getEmailPerformance } from '@/utils/emailPerformance';

interface PerformanceScreenProps {
  onNavigate?: (screen: string) => void;
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
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const syncGa4SocialTraffic = useAppStore((s) => s.syncGa4SocialTraffic);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  useEffect(() => {
    syncWave1Performance();
    syncWave1Calls();
  }, [syncWave1Performance, syncWave1Calls]);

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
  const marketingSpend = useMemo(() => sumSpend(periodCampaigns), [periodCampaigns]);
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

  // ---- Performance by Brand (group level only) ----------------------------
  const brandPerformanceRows = useMemo<BrandPerformanceRow[]>(() => {
    return ENTITY_OPTIONS.filter((o) => o.value !== 'all').map((o) => {
      const brand = o.value as Brand;
      const brandCampaigns = filterCampaignsByPeriod(
        campaigns.filter((c) => c.brand === brand),
        periodStart
      );
      const brandWebsiteUsers = getWebsiteUsersForBrand(ga4Traffic, brand);
      return {
        brand,
        label: o.label,
        enquiries: sumEnquiries(brandCampaigns),
        leads: sumLeads(brandCampaigns),
        spend: sumSpend(brandCampaigns),
        websiteUsers: brandWebsiteUsers.status === 'available' ? brandWebsiteUsers.activeUsers! : null,
      };
    });
  }, [campaigns, periodStart, ga4Traffic]);

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
    { label: 'Acumatica', status: 'not-connected', detail: 'Not connected' },
    { label: 'Hootsuite', status: 'not-connected', detail: 'Not connected' },
    { label: 'PPC (Google Ads)', status: 'not-connected', detail: 'Not connected' },
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Website Users"
            value={websiteUsers.status === 'available' ? websiteUsers.activeUsers : undefined}
            status={websiteUsers.status}
            subtitle={websiteUsers.subtitle}
          />
          <KpiCard title="Enquiries" value={enquiriesTotal} subtitle="Manually logged per campaign" />
          <KpiCard
            title="GA4 Enquiries"
            value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
            status={ga4EnquiriesInfo.status}
            subtitle={ga4EnquiriesInfo.status === 'available' ? 'Verified GA4 key events — a website action, not a qualified lead' : ga4EnquiriesInfo.subtitle}
          />
          <KpiCard title="Marketing Leads" value={marketingLeads} subtitle="Manually logged, not yet CRM-linked" accent="var(--v2-green)" />
          <KpiCard title="Marketing Spend" value={`£${Math.round(marketingSpend).toLocaleString()}`} subtitle="Manually logged campaign spend" onClick={() => onNavigate?.('campaigns')} />
          <KpiCard title="Opportunities" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
        </div>

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
            <KpiCard title="PPC" status="not-connected" subtitle="Awaiting Google Ads integration — see PPC page" onClick={() => onNavigate?.('ppc')} size="compact" />
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
