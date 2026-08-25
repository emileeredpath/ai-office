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
import { buildReportCsv, downloadCsv, type ReportCsvSection } from '@/utils/reportExport';
import { resolveGa4DateRange, getWebsiteUsers, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries, getEnquiriesByChannel, getEnquiriesBySource } from '@/utils/ga4Enquiries';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary, getCostPerGa4Enquiry } from '@/utils/googleAdsPerformance';
import { resolveEmailDateRange, getEmailPerformance } from '@/utils/emailPerformance';
import { resolveCallDateRange, getCallPerformance, getCallSourceBreakdown, getPpcAssistedCalls } from '@/utils/callPerformance';

// Reports is the V2 reporting area — a period + entity scoped rollup of
// the honest figures already established across Overview, Performance,
// Funding and Call Tracking. It introduces no new data source of its
// own: every real number here is computed with the exact same shared
// utilities those pages use (campaignMetrics.ts, ga4Traffic.ts,
// emailPerformance.ts, callPerformance.ts), so this page can never
// disagree with them. Calls figures read the real, entity/period-aware
// Infinity layer (callPerformance.ts) — the same one Call Tracking uses —
// not the legacy Wave 1 combined total. The old campaign.conversions/
// engagement fields (mock-era, unused by any other V2 screen, not
// editable anywhere in the UI) are removed outright, not replaced with
// an estimate.
export function ReportsScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const ga4Traffic = useAppStore((s) => s.ga4Traffic);
  const ga4SocialTraffic = useAppStore((s) => s.ga4SocialTraffic);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const syncCampaignsFromApi = useAppStore((s) => s.syncCampaignsFromApi);
  const syncFundingRecordsFromApi = useAppStore((s) => s.syncFundingRecordsFromApi);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const syncGa4SocialTraffic = useAppStore((s) => s.syncGa4SocialTraffic);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
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
  // Compact summary only — the full by-source/landing-page breakdown now
  // lives on the dedicated Social page (src/screens/SocialScreen.tsx),
  // reading the same getSocialTraffic() so the two can never disagree.
  const socialTraffic = useMemo(
    () => getSocialTraffic(ga4SocialTraffic, isGroupView, selectedEntity),
    [ga4SocialTraffic, isGroupView, selectedEntity]
  );
  // websiteUsers.subtitle is written for Website Users ("...active users
  // across N websites") and reused verbatim for the Sessions card, which
  // is wrong — Sessions isn't a user count. Same source data, correct
  // wording for this specific card only.
  const sessionsSubtitle =
    websiteUsers.status === 'available' ? websiteUsers.subtitle.replace('active users', 'sessions') : websiteUsers.subtitle;

  const ga4EnquiriesInfo = useMemo(
    () => getEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const enquiriesByChannel = useMemo(
    () => getEnquiriesByChannel(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const enquiriesBySource = useMemo(
    () => getEnquiriesBySource(ga4Enquiries, isGroupView, selectedEntity, 10),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const googleAds = useMemo(
    () => getGoogleAdsSummary(googleAdsPerformance, isGroupView, selectedEntity),
    [googleAdsPerformance, isGroupView, selectedEntity]
  );
  const costPerGa4Enquiry = useMemo(
    () => getCostPerGa4Enquiry(googleAdsPerformance, ga4Enquiries, isGroupView, selectedEntity),
    [googleAdsPerformance, ga4Enquiries, isGroupView, selectedEntity]
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

  // Same real, entity/period-aware Infinity layer Call Tracking uses — no
  // separate Wave 1 fallback. Reports can never disagree with Call
  // Tracking about totals, source classification, or Capcom's unmapped
  // status, because both read the exact same shared utility.
  const callPerf = useMemo(
    () => getCallPerformance(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const callSourceBreakdown = useMemo(
    () => getCallSourceBreakdown(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const ppcAssisted = useMemo(
    () => getPpcAssistedCalls(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const callsAnswerRate =
    callPerf.status === 'available' && callPerf.totalCalls! > 0
      ? Math.round((callPerf.answeredCalls! / callPerf.totalCalls!) * 100)
      : null;

  // GA4 freshness reflects the general website-traffic source this page
  // uses (ga4Traffic), not the separate campaign-scoped Wave 1 GA4 query.
  // Campaign Monitor freshness reflects the real sync outcome, never just
  // "an env var is set" — see backend/src/services/emailPerformance.ts.
  const ga4Configured = ga4Traffic?.configured === true;
  const ga4HasErrors = (ga4Traffic?.errors?.length ?? 0) > 0;
  const infinityConfigured = infinityCalls?.configured === true;
  const infinityHasErrors = (infinityCalls?.errors?.length ?? 0) > 0;

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
      ? { label: 'Infinity (Calls)', status: infinityHasErrors ? 'error' : 'live', detail: infinityHasErrors ? 'Sync error' : 'Connected' }
      : { label: 'Infinity (Calls)', status: 'not-connected', detail: 'Not connected' },
    campaignMonitorStatus,
    { label: 'Acumatica', status: 'not-connected', detail: 'Not connected' },
    googleAdsPerformance?.configured === true
      ? {
          label: 'PPC (Google Ads)',
          status: (googleAdsPerformance?.errors?.length ?? 0) > 0 ? 'error' : 'live',
          detail: (googleAdsPerformance?.errors?.length ?? 0) > 0 ? 'Sync error' : 'Connected',
        }
      : { label: 'PPC (Google Ads)', status: 'not-connected', detail: 'Not connected' },
  ];

  const currency = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportCsv = () => {
    const sections: ReportCsvSection[] = [
      {
        title: 'Marketing Summary',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          websiteUsers.status === 'available'
            ? ['Website Users', websiteUsers.activeUsers!, websiteUsers.subtitle]
            : ['Website Users', 'Not connected', websiteUsers.subtitle],
          ['Enquiries', enquiriesTotal, 'Manually logged per campaign'],
          ['Marketing Leads', marketingLeads, 'Manually logged, not yet CRM-linked'],
          ['Marketing Spend', currency(marketingSpend), 'Manually logged campaign spend'],
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
        title: 'Website',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          websiteUsers.status === 'available'
            ? ['Website Users', websiteUsers.activeUsers!, websiteUsers.subtitle]
            : ['Website Users', 'Not connected', websiteUsers.subtitle],
          websiteUsers.status === 'available'
            ? ['Sessions', websiteUsers.sessions!, sessionsSubtitle]
            : ['Sessions', 'Not connected', sessionsSubtitle],
        ],
      },
      {
        // Compact summary only — full by-source/landing-page breakdown is
        // on the dedicated Social page, not duplicated in this CSV.
        title: 'Social',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          socialTraffic.status === 'available'
            ? ['Social Sessions', socialTraffic.sessions!, socialTraffic.subtitle]
            : ['Social Sessions', 'Not connected', socialTraffic.subtitle],
          socialTraffic.status === 'available'
            ? ['Social Users', socialTraffic.users!, socialTraffic.subtitle]
            : ['Social Users', 'Not connected', socialTraffic.subtitle],
          socialTraffic.status === 'available'
            ? ['Organic Social Sessions', socialTraffic.organicSessions!, socialTraffic.subtitle]
            : ['Organic Social Sessions', 'Not connected', socialTraffic.subtitle],
          socialTraffic.status === 'available'
            ? ['Organic Social Users', socialTraffic.organicUsers!, socialTraffic.subtitle]
            : ['Organic Social Users', 'Not connected', socialTraffic.subtitle],
          socialTraffic.status === 'available'
            ? ['Paid Social Sessions', socialTraffic.paidSessions!, socialTraffic.subtitle]
            : ['Paid Social Sessions', 'Not connected', socialTraffic.subtitle],
          socialTraffic.status === 'available'
            ? ['Paid Social Users', socialTraffic.paidUsers!, socialTraffic.subtitle]
            : ['Paid Social Users', 'Not connected', socialTraffic.subtitle],
        ],
      },
      {
        title: 'Website Enquiries',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          ga4EnquiriesInfo.status === 'available'
            ? ['GA4 Enquiries', ga4EnquiriesInfo.total!, ga4EnquiriesInfo.subtitle]
            : ['GA4 Enquiries', 'Not connected', ga4EnquiriesInfo.subtitle],
          ga4EnquiriesInfo.form.status === 'available'
            ? ['Form Enquiries', ga4EnquiriesInfo.form.value!, ga4EnquiriesInfo.form.subtitle]
            : ['Form Enquiries', 'Not connected', ga4EnquiriesInfo.form.subtitle],
          ga4EnquiriesInfo.phone.status === 'available'
            ? ['Phone Enquiries', ga4EnquiriesInfo.phone.value!, ga4EnquiriesInfo.phone.subtitle]
            : ['Phone Enquiries', 'Not connected', ga4EnquiriesInfo.phone.subtitle],
          ga4EnquiriesInfo.email.status === 'available'
            ? ['Email Enquiries', ga4EnquiriesInfo.email.value!, ga4EnquiriesInfo.email.subtitle]
            : ['Email Enquiries', 'Not connected', ga4EnquiriesInfo.email.subtitle],
          ga4EnquiriesInfo.livechat.status === 'available'
            ? ['Live Chat Enquiries', ga4EnquiriesInfo.livechat.value!, ga4EnquiriesInfo.livechat.subtitle]
            : ['Live Chat Enquiries', 'Not connected', ga4EnquiriesInfo.livechat.subtitle],
        ],
      },
      {
        title: 'Enquiries by Channel',
        columns: ['Channel', 'Enquiries'],
        rows:
          enquiriesByChannel.status === 'available' && enquiriesByChannel.buckets.length > 0
            ? enquiriesByChannel.buckets.map((b) => [b.channelGroup, b.count])
            : [['Not connected', enquiriesByChannel.subtitle]],
      },
      {
        title: 'Enquiries by Source',
        columns: ['Source', 'Enquiries'],
        rows:
          enquiriesBySource.status === 'available' && enquiriesBySource.rows.length > 0
            ? enquiriesBySource.rows.map((r) => [r.source, r.count])
            : [['Not connected', enquiriesBySource.subtitle]],
      },
      {
        title: 'Email',
        columns: ['Metric', 'Value', 'Detail'],
        rows:
          emailPerf.status === 'available' && emailPerf.campaignsSent! > 0
            ? [
                ['Sends', emailPerf.campaignsSent!, emailPerf.subtitle],
                ['Recipients', emailPerf.recipients!, emailPerf.subtitle],
                ['Opens', emailPerf.opens!, emailPerf.subtitle],
                ['Clicks', emailPerf.clicks!, emailPerf.subtitle],
                ['Bounces', emailPerf.bounces!, emailPerf.subtitle],
                ['Unsubscribes', emailPerf.unsubscribes!, emailPerf.subtitle],
              ]
            : [['Email', 'Not connected', emailPerf.subtitle]],
      },
      {
        title: 'Calls',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          callPerf.status === 'available'
            ? ['Total Calls', callPerf.totalCalls!, callPerf.subtitle]
            : ['Total Calls', 'Not connected', callPerf.subtitle],
          callPerf.status === 'available'
            ? ['Answered', callPerf.answeredCalls!, callPerf.subtitle]
            : ['Answered', 'Not connected', callPerf.subtitle],
          callPerf.status === 'available'
            ? ['Missed', callPerf.missedCalls!, callPerf.subtitle]
            : ['Missed', 'Not connected', callPerf.subtitle],
          callPerf.status === 'available' && callsAnswerRate !== null
            ? ['Answer Rate', `${callsAnswerRate}%`, 'Answered ÷ Total Calls']
            : ['Answer Rate', 'Not connected', callPerf.subtitle],
          callPerf.status === 'available'
            ? ['Average Call Duration', callPerf.avgDuration!, 'Across answered calls']
            : ['Average Call Duration', 'Not connected', callPerf.subtitle],
          ppcAssisted.status === 'available'
            ? ['PPC-Assisted Calls', ppcAssisted.count, ppcAssisted.subtitle]
            : ['PPC-Assisted Calls', 'Not connected', ppcAssisted.subtitle],
        ],
      },
      {
        title: 'Call Source Breakdown',
        columns: ['Source', 'Calls', 'Answered', 'Missed', 'Answer Rate'],
        rows:
          callSourceBreakdown.status === 'available' && callSourceBreakdown.buckets.length > 0
            ? callSourceBreakdown.buckets.map((b) => [
                b.source,
                b.calls,
                b.answered,
                b.missed,
                b.answerRate != null ? `${b.answerRate}%` : '—',
              ])
            : [['Not connected', '', '', '', callSourceBreakdown.subtitle]],
      },
      {
        title: 'PPC / Google Ads',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          googleAds.status === 'available'
            ? ['Spend', currency(googleAds.spend!), googleAds.subtitle]
            : ['Spend', 'Not connected', googleAds.subtitle],
          googleAds.status === 'available'
            ? ['Impressions', googleAds.impressions!, googleAds.subtitle]
            : ['Impressions', 'Not connected', googleAds.subtitle],
          googleAds.status === 'available'
            ? ['Clicks', googleAds.clicks!, googleAds.subtitle]
            : ['Clicks', 'Not connected', googleAds.subtitle],
          googleAds.status === 'available' && googleAds.ctr != null
            ? ['CTR', `${googleAds.ctr}%`, 'Clicks ÷ Impressions']
            : ['CTR', 'Not connected', googleAds.subtitle],
          googleAds.status === 'available' && googleAds.averageCpc != null
            ? ['Average CPC', currency(googleAds.averageCpc), 'Spend ÷ Clicks']
            : ['Average CPC', 'Not connected', googleAds.subtitle],
          googleAds.status === 'available'
            ? ['Google Ads Conversions', googleAds.conversions!, googleAds.subtitle]
            : ['Google Ads Conversions', 'Not connected', googleAds.subtitle],
          googleAds.status === 'available' && googleAds.costPerConversion != null
            ? ['Cost per Google Ads Conversion', currency(googleAds.costPerConversion), 'Spend ÷ Google Ads Conversions']
            : ['Cost per Google Ads Conversion', 'Not connected', googleAds.subtitle],
          costPerGa4Enquiry.status === 'available' && costPerGa4Enquiry.costPerEnquiry != null
            ? ['Cost per GA4 Enquiry', currency(costPerGa4Enquiry.costPerEnquiry), costPerGa4Enquiry.subtitle]
            : ['Cost per GA4 Enquiry', 'Not connected', costPerGa4Enquiry.subtitle],
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
      {
        title: 'Commercial',
        columns: ['Metric', 'Value', 'Detail'],
        rows: [
          ['Opportunities', 'Not connected', 'Awaiting Acumatica integration'],
          ['Pipeline', 'Not connected', 'Awaiting Acumatica integration'],
          ['Won Revenue', 'Not connected', 'Awaiting Acumatica integration'],
        ],
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

        {/* Marketing Summary */}
        <div className="mb-8">
          <h2 className="v2-section-title">Marketing Summary</h2>
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

        {/* Website */}
        <div className="mb-8">
          <h2 className="v2-section-title">Website</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard
              title="Website Users"
              value={websiteUsers.status === 'available' ? websiteUsers.activeUsers : undefined}
              status={websiteUsers.status}
              subtitle={websiteUsers.subtitle}
              size="compact"
            />
            <KpiCard
              title="Sessions"
              value={websiteUsers.status === 'available' ? websiteUsers.sessions : undefined}
              status={websiteUsers.status}
              subtitle={sessionsSubtitle}
              size="compact"
            />
          </div>
        </div>

        {/* Social — compact summary only; the full breakdown (by source,
            top landing pages) lives on the dedicated Social page so
            Website and Social read as clearly separate channels here. */}
        <div className="mb-8">
          <h2 className="v2-section-title">Social</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real GA4 website traffic attributed to Organic/Paid Social. See the Social page for the full breakdown by
            source and landing page.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Social Sessions"
              value={socialTraffic.status === 'available' ? socialTraffic.sessions : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.subtitle}
              size="compact"
            />
            <KpiCard
              title="Social Users"
              value={socialTraffic.status === 'available' ? socialTraffic.users : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.subtitle}
              size="compact"
            />
            <KpiCard
              title="Organic Social"
              value={socialTraffic.status === 'available' ? `${socialTraffic.organicSessions} sessions` : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.status === 'available' ? `${socialTraffic.organicUsers} users` : socialTraffic.subtitle}
              size="compact"
            />
            <KpiCard
              title="Paid Social"
              value={socialTraffic.status === 'available' ? `${socialTraffic.paidSessions} sessions` : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.status === 'available' ? `${socialTraffic.paidUsers} users` : socialTraffic.subtitle}
              size="compact"
            />
          </div>
        </div>

        {/* Website Enquiries — real, verified GA4 key events only. A
            website action, never a qualified marketing lead, CRM
            opportunity, or revenue figure. */}
        <div className="mb-8">
          <h2 className="v2-section-title">Website Enquiries</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Verified GA4 key events per entity — never a qualified marketing lead, CRM opportunity, or revenue figure.
            An enquiry type shows "Not connected" where this entity has no verified event definition for it, never a
            misleading 0.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            <KpiCard
              title="GA4 Enquiries"
              value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
              status={ga4EnquiriesInfo.status}
              subtitle={ga4EnquiriesInfo.subtitle}
              size="compact"
            />
            <KpiCard
              title="Form Enquiries"
              value={ga4EnquiriesInfo.form.status === 'available' ? ga4EnquiriesInfo.form.value : undefined}
              status={ga4EnquiriesInfo.form.status}
              subtitle={ga4EnquiriesInfo.form.subtitle}
              size="compact"
            />
            <KpiCard
              title="Phone Enquiries"
              value={ga4EnquiriesInfo.phone.status === 'available' ? ga4EnquiriesInfo.phone.value : undefined}
              status={ga4EnquiriesInfo.phone.status}
              subtitle={ga4EnquiriesInfo.phone.subtitle}
              size="compact"
            />
            <KpiCard
              title="Email Enquiries"
              value={ga4EnquiriesInfo.email.status === 'available' ? ga4EnquiriesInfo.email.value : undefined}
              status={ga4EnquiriesInfo.email.status}
              subtitle={ga4EnquiriesInfo.email.subtitle}
              size="compact"
            />
            <KpiCard
              title="Live Chat Enquiries"
              value={ga4EnquiriesInfo.livechat.status === 'available' ? ga4EnquiriesInfo.livechat.value : undefined}
              status={ga4EnquiriesInfo.livechat.status}
              subtitle={ga4EnquiriesInfo.livechat.subtitle}
              size="compact"
            />
          </div>

          <h4 className="text-sm font-semibold text-text-primary mb-2">Enquiries by Channel</h4>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            GA4's own sessionDefaultChannelGroup — only channels GA4 actually returns are shown.
          </p>
          {enquiriesByChannel.status === 'available' ? (
            enquiriesByChannel.buckets.length > 0 ? (
              <div className="card p-0 mb-4">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th>Channel</th>
                        <th style={{ textAlign: 'right' }}>Enquiries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiriesByChannel.buckets.map((bucket) => (
                        <tr key={bucket.channelGroup}>
                          <td className="text-text-primary">{bucket.channelGroup}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text mb-4" style={{ padding: '1.5rem' }}>No enquiries in the selected period.</p>
            )
          ) : (
            <div className="card p-4 mb-4">
              <p className="text-sm text-text-secondary">{enquiriesByChannel.subtitle}</p>
            </div>
          )}

          <h4 className="text-sm font-semibold text-text-primary mb-2">Enquiries by Source</h4>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            GA4's raw sessionSource — shown exactly as reported, never relabelled into an invented platform name.
          </p>
          {enquiriesBySource.status === 'available' ? (
            enquiriesBySource.rows.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Enquiries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiriesBySource.rows.map((row) => (
                        <tr key={row.source}>
                          <td className="text-text-primary">{row.source}</td>
                          <td style={{ textAlign: 'right' }}>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No enquiries in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{enquiriesBySource.subtitle}</p>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="mb-8">
          <h2 className="v2-section-title">Email</h2>
          {emailPerf.status === 'available' && emailPerf.campaignsSent! > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard title="Sends" value={emailPerf.campaignsSent} subtitle={emailPerf.subtitle} size="compact" />
              <KpiCard title="Recipients" value={emailPerf.recipients} subtitle={emailPerf.subtitle} size="compact" />
              <KpiCard title="Opens" value={emailPerf.opens} subtitle={emailPerf.subtitle} size="compact" />
              <KpiCard title="Clicks" value={emailPerf.clicks} subtitle={emailPerf.subtitle} size="compact" />
              <KpiCard title="Bounces" value={emailPerf.bounces} subtitle={emailPerf.subtitle} size="compact" />
              <KpiCard title="Unsubscribes" value={emailPerf.unsubscribes} subtitle={emailPerf.subtitle} size="compact" />
            </div>
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{emailPerf.subtitle}</p>
            </div>
          )}
        </div>

        {/* Calls */}
        <div className="mb-8">
          <h2 className="v2-section-title">Calls</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            <KpiCard
              title="Total Calls"
              value={callPerf.status === 'available' ? callPerf.totalCalls : undefined}
              status={callPerf.status}
              subtitle={callPerf.subtitle}
              size="compact"
            />
            <KpiCard
              title="Answered"
              value={callPerf.status === 'available' ? callPerf.answeredCalls : undefined}
              status={callPerf.status}
              subtitle={callPerf.subtitle}
              size="compact"
            />
            <KpiCard
              title="Missed"
              value={callPerf.status === 'available' ? callPerf.missedCalls : undefined}
              status={callPerf.status}
              subtitle={callPerf.subtitle}
              size="compact"
            />
            <KpiCard
              title="Answer Rate"
              value={callPerf.status === 'available' && callsAnswerRate !== null ? `${callsAnswerRate}%` : undefined}
              status={callPerf.status === 'available' && callsAnswerRate !== null ? 'available' : 'not-connected'}
              subtitle={callPerf.status === 'available' ? 'Answered ÷ Total Calls' : callPerf.subtitle}
              size="compact"
            />
            <KpiCard
              title="Average Call Duration"
              value={callPerf.status === 'available' ? callPerf.avgDuration : undefined}
              status={callPerf.status}
              subtitle={callPerf.status === 'available' ? 'Across answered calls' : callPerf.subtitle}
              size="compact"
            />
            <KpiCard
              title="PPC-Assisted Calls"
              value={ppcAssisted.status === 'available' ? ppcAssisted.count : undefined}
              status={ppcAssisted.status}
              subtitle={ppcAssisted.subtitle}
              size="compact"
            />
          </div>

          <h3 className="text-sm font-semibold text-text-primary mb-2">Call Source Breakdown</h3>
          {callSourceBreakdown.status === 'available' ? (
            callSourceBreakdown.buckets.length > 0 ? (
              <div className="card p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table className="table w-full text-sm" style={{ minWidth: 480 }}>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Calls</th>
                        <th style={{ textAlign: 'right' }}>Answered</th>
                        <th style={{ textAlign: 'right' }}>Missed</th>
                        <th style={{ textAlign: 'right' }}>Answer Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callSourceBreakdown.buckets.map((bucket) => (
                        <tr key={bucket.source}>
                          <td className="text-text-primary">{bucket.source}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.calls}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.answered}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.missed}</td>
                          <td style={{ textAlign: 'right' }}>{bucket.answerRate != null ? `${bucket.answerRate}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="v2-not-connected-text" style={{ padding: '1.5rem' }}>No calls in the selected period.</p>
            )
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{callSourceBreakdown.subtitle}</p>
            </div>
          )}
        </div>

        {/* PPC / Google Ads — real campaign performance for Brentwood and
            Radio Links only; Google Ads Conversions and GA4 Enquiries stay
            clearly separate, never merged into one figure. */}
        <div className="mb-8">
          <h2 className="v2-section-title">PPC / Google Ads</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real Google Ads performance for Brentwood and Radio Links. Google Ads Conversions is Google Ads' own
            metric — a different measurement from GA4 Enquiries, never assumed equivalent.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              title="Spend"
              value={googleAds.status === 'available' ? `£${googleAds.spend!.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
              size="compact"
            />
            <KpiCard
              title="Impressions"
              value={googleAds.status === 'available' ? googleAds.impressions!.toLocaleString('en-GB') : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
              size="compact"
            />
            <KpiCard
              title="Clicks"
              value={googleAds.status === 'available' ? googleAds.clicks!.toLocaleString('en-GB') : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
              size="compact"
            />
            <KpiCard
              title="CTR"
              value={googleAds.status === 'available' && googleAds.ctr != null ? `${googleAds.ctr}%` : undefined}
              status={googleAds.status === 'available' && googleAds.ctr != null ? 'available' : 'not-connected'}
              subtitle={googleAds.status === 'available' ? 'Clicks ÷ Impressions' : googleAds.subtitle}
              size="compact"
            />
            <KpiCard
              title="Average CPC"
              value={googleAds.status === 'available' && googleAds.averageCpc != null ? `£${googleAds.averageCpc.toFixed(2)}` : undefined}
              status={googleAds.status === 'available' && googleAds.averageCpc != null ? 'available' : 'not-connected'}
              subtitle={googleAds.status === 'available' ? 'Spend ÷ Clicks' : googleAds.subtitle}
              size="compact"
            />
            <KpiCard
              title="Google Ads Conversions"
              value={googleAds.status === 'available' ? googleAds.conversions : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
              size="compact"
            />
            <KpiCard
              title="Cost per Google Ads Conversion"
              value={googleAds.status === 'available' && googleAds.costPerConversion != null ? `£${googleAds.costPerConversion.toFixed(2)}` : undefined}
              status={googleAds.status === 'available' && googleAds.costPerConversion != null ? 'available' : 'not-connected'}
              subtitle={googleAds.status === 'available' ? 'Spend ÷ Google Ads Conversions' : googleAds.subtitle}
              size="compact"
            />
            <KpiCard
              title="GA4 Enquiries"
              value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
              status={ga4EnquiriesInfo.status}
              subtitle={ga4EnquiriesInfo.subtitle}
              size="compact"
            />
            <KpiCard
              title="Cost per GA4 Enquiry"
              value={costPerGa4Enquiry.status === 'available' && costPerGa4Enquiry.costPerEnquiry != null ? `£${costPerGa4Enquiry.costPerEnquiry.toFixed(2)}` : undefined}
              status={costPerGa4Enquiry.status === 'available' && costPerGa4Enquiry.costPerEnquiry != null ? 'available' : 'not-connected'}
              subtitle={costPerGa4Enquiry.subtitle}
              size="compact"
            />
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="mb-8">
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

        {/* Commercial */}
        <div className="mb-4">
          <h2 className="v2-section-title">Commercial</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard title="Opportunities" status="not-connected" subtitle="Awaiting Acumatica integration" size="compact" />
            <KpiCard title="Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" size="compact" />
            <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" size="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}
