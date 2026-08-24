import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate, PERIOD_OPTIONS } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { CampaignPerformanceTable } from '@/components/performance/CampaignPerformanceTable';
import { ReportExportButtons } from '@/components/reports/ReportExportButtons';
import { filterCampaignsByPeriod, sumLeads, sumSpend, sumEnquiries } from '@/utils/campaignMetrics';
import { getCallsSnapshot } from '@/utils/channelSnapshot';
import { buildReportCsv, downloadCsv, type ReportCsvSection } from '@/utils/reportExport';
import { resolveGa4DateRange, getWebsiteUsers } from '@/utils/ga4Traffic';
import { resolveEmailDateRange, getEmailPerformance } from '@/utils/emailPerformance';

// Reports is the V2 reporting area — a period + entity scoped rollup of
// the honest figures already established across Overview, Performance,
// Funding and Call Tracking. It introduces no new data source of its
// own: every real number here is computed with the exact same shared
// utilities those pages use (campaignMetrics.ts, channelSnapshot.ts), so
// this page can never disagree with them. The old campaign.conversions/
// engagement fields (mock-era, unused by any other V2 screen, not
// editable anywhere in the UI) are removed outright, not replaced with
// an estimate.
export function ReportsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const ga4Traffic = useAppStore((s) => s.ga4Traffic);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncCampaignsFromApi = useAppStore((s) => s.syncCampaignsFromApi);
  const syncFundingRecordsFromApi = useAppStore((s) => s.syncFundingRecordsFromApi);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const { isGroupView, selectedEntity, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  useEffect(() => {
    syncCampaignsFromApi();
    syncFundingRecordsFromApi();
    syncWave1Performance();
    syncWave1Calls();
  }, [syncCampaignsFromApi, syncFundingRecordsFromApi, syncWave1Performance, syncWave1Calls]);

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Traffic(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Traffic]);

  const emailRange = useMemo(() => resolveEmailDateRange(period), [period]);
  useEffect(() => {
    syncEmailPerformance(emailRange.startDate, emailRange.endDate);
  }, [emailRange.startDate, emailRange.endDate, syncEmailPerformance]);

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );

  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  const marketingSpend = useMemo(() => sumSpend(periodCampaigns), [periodCampaigns]);
  const enquiriesTotal = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);
  const websiteUsers = useMemo(
    () => getWebsiteUsers(ga4Traffic, isGroupView, selectedEntity),
    [ga4Traffic, isGroupView, selectedEntity]
  );

  // Funding has no genuine date field this app can honestly match against
  // the global Period selector (funding.period is a free-text label like
  // "Q3 2026", not a Date) — so funding figures are entity-filtered only,
  // never silently period-filtered against a field that doesn't support it.
  const entityFundingRecords = useMemo(
    () => fundingRecords.filter((r) => matchesSelectedEntity(r.brand) && !r.archived),
    [fundingRecords, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const fundingSummary = useMemo(() => {
    const totalEarned = entityFundingRecords.reduce((sum, r) => sum + r.amountEarned, 0);
    const totalClaimed = entityFundingRecords.reduce((sum, r) => sum + r.amountClaimed, 0);
    const totalBalance = entityFundingRecords.reduce((sum, r) => sum + r.balanceToClaim, 0);
    return { totalEarned, totalClaimed, totalBalance };
  }, [entityFundingRecords]);

  const emailPerf = useMemo(
    () => getEmailPerformance(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  const callsSnapshot = useMemo(
    () => getCallsSnapshot(campaigns, wave1Performance, matchesSelectedEntity),
    [campaigns, wave1Performance, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // GA4 freshness reflects the general website-traffic source this page
  // uses (ga4Traffic), not the separate campaign-scoped Wave 1 GA4 query.
  // Campaign Monitor freshness reflects the real sync outcome, never just
  // "an env var is set" — see backend/src/services/emailPerformance.ts.
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
      ? { label: 'Infinity (Calls)', status: 'live', detail: 'Connected' }
      : { label: 'Infinity (Calls)', status: 'not-connected', detail: 'Not connected' },
    campaignMonitorStatus,
    { label: 'Acumatica', status: 'not-connected', detail: 'Not connected' },
    { label: 'PPC (Google Ads)', status: 'not-connected', detail: 'Not connected' },
  ];

  const currency = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportCsv = () => {
    const sections: ReportCsvSection[] = [
      {
        title: 'Marketing Performance',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          websiteUsers.status === 'available'
            ? ['Website Users', websiteUsers.activeUsers!, websiteUsers.subtitle]
            : ['Website Users', 'Not connected', websiteUsers.subtitle],
          ['Enquiries', enquiriesTotal, 'Manually logged per campaign'],
          ['Marketing Leads', marketingLeads, 'Manually logged, not yet CRM-linked'],
          ['Marketing Spend', currency(marketingSpend), 'Manually logged campaign spend'],
          ['Opportunities', 'Not connected', 'Awaiting Acumatica integration'],
          ['Pipeline', 'Not connected', 'Awaiting Acumatica integration'],
          ['Won Revenue', 'Not connected', 'Awaiting Acumatica integration'],
        ],
      },
      {
        title: 'Funding Performance',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          ['Total Earned', currency(fundingSummary.totalEarned), 'Real, entity-filtered — not period-scoped'],
          ['Total Claimed', currency(fundingSummary.totalClaimed), 'Real, entity-filtered — not period-scoped'],
          ['Balance to Claim', currency(fundingSummary.totalBalance), 'Real, entity-filtered — not period-scoped'],
        ],
      },
      {
        title: 'Channel Summary',
        columns: ['Channel', 'Value', 'Detail'],
        rows: [
          websiteUsers.status === 'available'
            ? ['Website', `${websiteUsers.activeUsers} users`, websiteUsers.subtitle]
            : ['Website', 'Not connected', websiteUsers.subtitle],
          emailPerf.status === 'available' && emailPerf.campaignsSent! > 0
            ? ['Email', `${emailPerf.opens} opens`, `${emailPerf.campaignsSent} sends · ${emailPerf.recipients} recipients · ${emailPerf.clicks} clicks`]
            : ['Email', 'Not connected', emailPerf.subtitle],
          ['Social', 'Not connected', 'No integration configured'],
          ['PPC', 'Not connected', 'Awaiting Google Ads integration'],
          callsSnapshot
            ? ['Calls', callsSnapshot.totalCalls, `${callsSnapshot.answeredCalls} answered — MTech Group only`]
            : ['Calls', 'Not connected', isGroupView ? 'Awaiting Infinity integration' : 'Entity-level call attribution not available yet'],
        ],
      },
      {
        title: 'Campaign Summary',
        columns: ['Campaign', 'Entity', 'Enquiries', 'Marketing Leads', 'Spend', 'Value Generated'],
        rows: periodCampaigns.map((c) => [
          c.name,
          c.brand,
          c.results?.enquiriesReceived ?? 'Not logged',
          c.leads,
          currency(c.spend || 0),
          c.valueGenerated != null ? currency(c.valueGenerated) : 'Not logged',
        ]),
      },
    ];

    const title = `MTech Marketing Report — ${isGroupView ? 'MTech Group' : entityLabel} — ${periodLabel} — Generated ${new Date().toLocaleString('en-GB')}`;
    const csv = buildReportCsv(title, sections);
    const filename = `mtech-report-${isGroupView ? 'group' : selectedEntity}-${period}.csv`;
    downloadCsv(filename, csv);
  };

  return (
    <div className="v2-page v2-report-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Reports</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Marketing and commercial performance across MTech Group' : `Showing ${entityLabel}`} · {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="v2-no-print">
              <PeriodSelector />
            </div>
            <ReportExportButtons onExportCsv={handleExportCsv} />
          </div>
        </div>

        <div className="v2-no-print">
          <DataFreshnessBar entries={freshnessEntries} />
        </div>

        {/* Marketing Performance */}
        <div className="mb-8">
          <h2 className="v2-section-title">Marketing Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Website Users"
              value={websiteUsers.status === 'available' ? websiteUsers.activeUsers : undefined}
              status={websiteUsers.status}
              subtitle={websiteUsers.subtitle}
            />
            <KpiCard title="Enquiries" value={enquiriesTotal} subtitle="Manually logged per campaign" />
            <KpiCard title="Marketing Leads" value={marketingLeads} subtitle="Manually logged, not yet CRM-linked" accent="var(--v2-green)" />
            <KpiCard title="Marketing Spend" value={currency(marketingSpend)} subtitle="Manually logged campaign spend" />
            <KpiCard title="Opportunities" status="not-connected" subtitle="Awaiting Acumatica integration" />
            <KpiCard title="Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
            <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
          </div>
        </div>

        {/* Funding Performance */}
        <div className="mb-8">
          <h2 className="v2-section-title">Funding Performance</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real, entity-filtered supplier funding data — not scoped by the Period selector, since funding records
            don't carry a comparable date field yet.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard title="Total Earned" value={currency(fundingSummary.totalEarned)} subtitle="Manually logged funding records" size="compact" />
            <KpiCard title="Total Claimed" value={currency(fundingSummary.totalClaimed)} subtitle="Manually logged funding records" size="compact" />
            <KpiCard title="Balance to Claim" value={currency(fundingSummary.totalBalance)} subtitle="Manually logged funding records" size="compact" />
          </div>
        </div>

        {/* Channel Summary */}
        <div className="mb-8">
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
            <KpiCard title="Social" status="not-connected" subtitle="No integration configured" size="compact" />
            <KpiCard title="PPC" status="not-connected" subtitle="Awaiting Google Ads integration" size="compact" />
            {callsSnapshot ? (
              <KpiCard title="Calls" value={callsSnapshot.totalCalls} subtitle={`${callsSnapshot.answeredCalls} answered — MTech Group only`} size="compact" />
            ) : (
              <KpiCard title="Calls" status="not-connected" subtitle={isGroupView ? 'Awaiting Infinity integration' : 'Entity-level attribution not available yet'} size="compact" />
            )}
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="mb-4">
          <h2 className="v2-section-title">Campaign Summary</h2>
          <div className="card" style={{ padding: 0 }}>
            <CampaignPerformanceTable
              campaigns={periodCampaigns}
              wave1Performance={wave1Performance}
              showEntityColumn={isGroupView}
              onSelectCampaign={(id) => selectCampaign(id, 'performance')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
