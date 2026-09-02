import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { SendDetailPanel } from '@/components/email/SendDetailPanel';
import { resolveEmailDateRange, getEmailHeadlineMetrics, getEmailSends } from '@/utils/emailPerformance';
import { resolveGa4DateRange } from '@/utils/ga4Traffic';
import { triggerCampaignMonitorSync, type CampaignMonitorSyncResult } from '@/services/emailPerformanceApi';
import { ApiError } from '@/services/apiConfig';
import {
  getEducationSends,
  getEducationSummary,
  getEducationRollupByGeography,
  getEducationRollupByLevel,
  getEducationRollupByAudienceType,
  getEducationRollupByBrand,
  getEducationOverallAverage,
  getEducationWebsiteAttribution,
  getUnclassifiedEducationSends,
  getProductionEducationSends,
  type EducationRollupRow,
} from '@/utils/educationCampaign';
import type { EmailCampaignRecord } from '@/services/emailPerformanceApi';
import { BRAND_LABEL } from '@/utils/brandColors';

type CampaignGroupFilter = 'all' | 'education_2026';
type GeographyFilter = 'all' | 'Scotland' | 'Northern Ireland' | 'Republic of Ireland';
type LevelFilter = 'all' | 'Primary' | 'Secondary';
type AudienceTypeFilter = 'all' | 'New' | 'Existing';

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Mirrors backend/src/services/campaignMonitor.ts's exported
// EDUCATION_NAMING_GUIDANCE — kept in sync manually since the frontend
// can't import backend source directly.
const EDUCATION_NAMING_GUIDANCE =
  'Include an explicit "New" or "Existing" word in the Campaign Monitor send name (e.g. "MTech BC - Scotland Primary Schools New") — geography alone is never used to infer audience source.';

function RollupTable({ title, rows }: { title: string; rows: EducationRollupRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      <div className="card p-0">
        <div style={{ overflowX: 'auto' }}>
          <table className="table w-full text-sm" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th>Segment</th>
                <th style={{ textAlign: 'right' }}>Sends</th>
                <th style={{ textAlign: 'right' }}>Recipients</th>
                <th style={{ textAlign: 'right' }}>Delivery Rate</th>
                <th style={{ textAlign: 'right' }}>Unique Open Rate</th>
                <th style={{ textAlign: 'right' }}>Click Rate</th>
                <th style={{ textAlign: 'right' }}>Click-to-Open Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="text-text-primary">{row.label}</td>
                  <td style={{ textAlign: 'right' }}>{row.sends}</td>
                  <td style={{ textAlign: 'right' }}>{row.recipients.toLocaleString('en-GB')}</td>
                  <td style={{ textAlign: 'right' }}>{row.deliveryRate != null ? `${row.deliveryRate}%` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{row.uniqueOpenRate != null ? `${row.uniqueOpenRate}%` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{row.clickRate != null ? `${row.clickRate}%` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{row.clickToOpenRate != null ? `${row.clickToOpenRate}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Email — Phase 1. Real Campaign Monitor send-level data only (no mock
// figures). Headline KPIs and the individual-send table use the same
// "MTech Group" scope as every existing Email figure elsewhere in the app
// (Overview/Performance/Reports — see src/utils/emailPerformance.ts).
// The Education 2026 roll-up further down is a deliberate, documented
// exception to that scope — see src/utils/educationCampaign.ts's header
// comment for exactly why. No recipient names or email addresses are ever
// fetched or displayed anywhere on this page — every figure is a
// send-level aggregate already produced by the existing Campaign Monitor
// sync.
export function EmailScreen() {
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const educationCampaignAttribution = useAppStore((s) => s.educationCampaignAttribution);
  const syncEducationCampaignAttribution = useAppStore((s) => s.syncEducationCampaignAttribution);
  const { isGroupView, selectedEntity } = useEntity();
  const { period } = usePeriod();
  const { isEditor } = useAuth();

  const emailRange = useMemo(() => resolveEmailDateRange(period), [period]);
  useEffect(() => {
    syncEmailPerformance(emailRange.startDate, emailRange.endDate);
  }, [emailRange.startDate, emailRange.endDate, syncEmailPerformance]);

  // Manual "Sync now" — calls the real Campaign Monitor sync (backend
  // requireEdit route), then re-fetches this page's own read layer so the
  // numbers reflect whatever the sync genuinely found. Never invents a
  // result — cmSyncResult/cmSyncError below are always exactly what the
  // backend returned.
  const [cmSyncing, setCmSyncing] = useState(false);
  const [cmSyncResult, setCmSyncResult] = useState<CampaignMonitorSyncResult | null>(null);
  const [cmSyncError, setCmSyncError] = useState<string | null>(null);
  const handleSyncNow = async () => {
    setCmSyncing(true);
    setCmSyncError(null);
    try {
      const result = await triggerCampaignMonitorSync(30);
      setCmSyncResult(result);
      await syncEmailPerformance(emailRange.startDate, emailRange.endDate);
    } catch (err) {
      setCmSyncResult(null);
      setCmSyncError(err instanceof ApiError ? err.message : 'Sync failed — could not reach the AI Office backend.');
    } finally {
      setCmSyncing(false);
    }
  };

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncEducationCampaignAttribution(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncEducationCampaignAttribution]);

  const [campaignGroupFilter, setCampaignGroupFilter] = useState<CampaignGroupFilter>('all');
  const [geographyFilter, setGeographyFilter] = useState<GeographyFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [audienceTypeFilter, setAudienceTypeFilter] = useState<AudienceTypeFilter>('all');
  const [selectedSend, setSelectedSend] = useState<EmailCampaignRecord | null>(null);

  const headline = useMemo(
    () => getEmailHeadlineMetrics(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );

  const baseSends = useMemo(
    () => getEmailSends(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );

  const educationSends = useMemo(
    () => getEducationSends(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  // Real test-slice sends (a trailing "(first N)"/"(first N test)")
  // excluded from production roll-ups/comparisons/averages — still fully
  // visible above in educationSends/the individual-send table.
  const productionEducationSends = useMemo(() => getProductionEducationSends(educationSends), [educationSends]);

  const filteredSends = useMemo(() => {
    // The individual-send table draws from the full MTech Group Campaign
    // Monitor scope when "All" is selected, or the (deliberately wider)
    // Education-specific scope when the campaign-group filter is set to
    // Education 2026 — so selecting Education never hides a real
    // mtech-attributed geography send the way the default scope would.
    const source = campaignGroupFilter === 'education_2026' ? educationSends : baseSends.sends;
    return source.filter((s) => {
      if (campaignGroupFilter !== 'all' && s.emailCampaignGroup !== campaignGroupFilter) return false;
      if (geographyFilter !== 'all' && s.emailGeography !== geographyFilter) return false;
      if (levelFilter !== 'all' && s.emailAudienceLevel !== levelFilter) return false;
      if (audienceTypeFilter !== 'all' && s.emailAudienceType !== audienceTypeFilter) return false;
      return true;
    });
  }, [baseSends, educationSends, campaignGroupFilter, geographyFilter, levelFilter, audienceTypeFilter]);

  const educationSummary = useMemo(
    () => getEducationSummary(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  const rollupByGeography = useMemo(() => getEducationRollupByGeography(productionEducationSends), [productionEducationSends]);
  const rollupByLevel = useMemo(() => getEducationRollupByLevel(productionEducationSends), [productionEducationSends]);
  const rollupByAudienceType = useMemo(() => getEducationRollupByAudienceType(productionEducationSends), [productionEducationSends]);
  const rollupByBrand = useMemo(() => getEducationRollupByBrand(productionEducationSends), [productionEducationSends]);
  const educationAverage = useMemo(() => getEducationOverallAverage(productionEducationSends), [productionEducationSends]);
  const unclassifiedSends = useMemo(() => getUnclassifiedEducationSends(productionEducationSends), [productionEducationSends]);

  const websiteAttribution = useMemo(
    () => getEducationWebsiteAttribution(educationCampaignAttribution, isGroupView, selectedEntity),
    [educationCampaignAttribution, isGroupView, selectedEntity]
  );

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;
  const cmConfigured = emailPerformance?.configured === true;
  const cmSyncState = emailPerformance?.syncState;
  const freshnessEntries: FreshnessEntry[] = [
    cmConfigured
      ? {
          label: 'Campaign Monitor',
          status: cmSyncState === 'live' ? 'live' : cmSyncState === 'error' ? 'error' : 'not-connected',
          detail: cmSyncState === 'live' ? 'Connected' : cmSyncState === 'error' ? (emailPerformance?.lastSyncError ?? 'Sync error') : 'Never synced',
        }
      : { label: 'Campaign Monitor', status: 'not-connected', detail: 'Not connected' },
  ];

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Email</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Real Campaign Monitor email performance across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <DataFreshnessBar entries={freshnessEntries} />
          {isEditor && (
            <button type="button" className="btn btn-secondary text-sm" onClick={handleSyncNow} disabled={cmSyncing}>
              <RefreshCw size={14} className={cmSyncing ? 'animate-spin' : ''} style={{ marginRight: 6 }} />
              {cmSyncing ? 'Syncing…' : 'Sync now'}
            </button>
          )}
        </div>
        {cmSyncResult && (
          <p className="text-xs text-text-secondary mb-6">
            Campaign Monitor sync: {cmSyncResult.campaignsSeen} send(s) seen, {cmSyncResult.created} new,{' '}
            {cmSyncResult.updated} updated, {cmSyncResult.skipped} skipped.
            {cmSyncResult.errors.length > 0 && (
              <span style={{ color: 'var(--v2-red)' }}> {cmSyncResult.errors.length} error(s): {cmSyncResult.errors.join('; ')}</span>
            )}
          </p>
        )}
        {cmSyncError && <p className="text-xs mb-6" style={{ color: 'var(--v2-red)' }}>{cmSyncError}</p>}

        {/* Headline metrics */}
        <div className="mb-8">
          <h2 className="v2-section-title">Email Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Emails Sent" value={headline.status === 'available' ? headline.campaignsSent : undefined} status={headline.status} subtitle={headline.subtitle} />
            <KpiCard title="Total Recipients" value={headline.status === 'available' ? headline.recipients?.toLocaleString('en-GB') : undefined} status={headline.status} subtitle={headline.subtitle} />
            <KpiCard title="Delivered" value={headline.status === 'available' ? headline.delivered?.toLocaleString('en-GB') : undefined} status={headline.status} subtitle={headline.subtitle} />
            <KpiCard title="Delivery Rate" value={headline.status === 'available' && headline.deliveryRate != null ? `${headline.deliveryRate}%` : undefined} status={headline.status === 'available' && headline.deliveryRate != null ? 'available' : 'not-connected'} subtitle={headline.subtitle} />
            <KpiCard title="Unique Opens" value={headline.status === 'available' ? headline.uniqueOpens?.toLocaleString('en-GB') : undefined} status={headline.status} subtitle={headline.subtitle} accent="var(--v2-green)" />
            <KpiCard title="Unique Open Rate" value={headline.status === 'available' && headline.uniqueOpenRate != null ? `${headline.uniqueOpenRate}%` : undefined} status={headline.status === 'available' && headline.uniqueOpenRate != null ? 'available' : 'not-connected'} subtitle={headline.subtitle} accent="var(--v2-green)" />
            <KpiCard title="Clicks" value={headline.status === 'available' ? headline.clicks?.toLocaleString('en-GB') : undefined} status={headline.status} subtitle="Campaign Monitor's Clicks field — documented as unique clicking subscribers, not yet confirmed against this live account" accent="var(--v2-green)" />
            <KpiCard title="Click Rate" value={headline.status === 'available' && headline.clickRate != null ? `${headline.clickRate}%` : undefined} status={headline.status === 'available' && headline.clickRate != null ? 'available' : 'not-connected'} subtitle={headline.subtitle} accent="var(--v2-green)" />
            <KpiCard title="Click-to-Open Rate" value={headline.status === 'available' && headline.clickToOpenRate != null ? `${headline.clickToOpenRate}%` : undefined} status={headline.status === 'available' && headline.clickToOpenRate != null ? 'available' : 'not-connected'} subtitle="Clicks ÷ unique opens — only meaningful if Clicks is genuinely unique-subscriber-based; verify Clicks ≤ Unique Opens on real data" />
            <KpiCard title="Bounces" value={headline.status === 'available' ? headline.bounces?.toLocaleString('en-GB') : undefined} status={headline.status} subtitle={headline.subtitle} accent="var(--v2-orange)" />
            <KpiCard title="Bounce Rate" value={headline.status === 'available' && headline.bounceRate != null ? `${headline.bounceRate}%` : undefined} status={headline.status === 'available' && headline.bounceRate != null ? 'available' : 'not-connected'} subtitle={headline.subtitle} accent="var(--v2-orange)" />
            <KpiCard title="Unsubscribes" value={headline.status === 'available' ? headline.unsubscribes?.toLocaleString('en-GB') : undefined} status={headline.status} subtitle={headline.subtitle} accent="var(--v2-red)" />
            <KpiCard title="Unsubscribe Rate" value={headline.status === 'available' && headline.unsubscribeRate != null ? `${headline.unsubscribeRate}%` : undefined} status={headline.status === 'available' && headline.unsubscribeRate != null ? 'available' : 'not-connected'} subtitle={headline.subtitle} accent="var(--v2-red)" />
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex gap-3 flex-wrap">
            <select value={campaignGroupFilter} onChange={(e) => setCampaignGroupFilter(e.target.value as CampaignGroupFilter)} className="input flex-1 min-w-[160px]">
              <option value="all">All campaigns</option>
              <option value="education_2026">Education 2026</option>
            </select>
            <select value={geographyFilter} onChange={(e) => setGeographyFilter(e.target.value as GeographyFilter)} className="input flex-1 min-w-[160px]">
              <option value="all">All geographies</option>
              <option value="Scotland">Scotland</option>
              <option value="Northern Ireland">Northern Ireland</option>
              <option value="Republic of Ireland">Republic of Ireland</option>
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as LevelFilter)} className="input flex-1 min-w-[160px]">
              <option value="all">Primary &amp; Secondary</option>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
            <select value={audienceTypeFilter} onChange={(e) => setAudienceTypeFilter(e.target.value as AudienceTypeFilter)} className="input flex-1 min-w-[160px]">
              <option value="all">New &amp; Existing</option>
              <option value="New">New prospect data</option>
              <option value="Existing">Existing data</option>
            </select>
          </div>
        </div>

        {/* Individual send table */}
        <div className="mb-8">
          <h2 className="v2-section-title">Individual Sends</h2>
          {baseSends.status === 'available' && filteredSends.length > 0 ? (
            <div className="card p-0">
              <div style={{ overflowX: 'auto' }}>
                <table className="table w-full text-sm" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>Send</th>
                      <th>Entity</th>
                      <th>Sent</th>
                      <th>Segment</th>
                      <th style={{ textAlign: 'right' }}>Recipients</th>
                      <th style={{ textAlign: 'right' }}>Delivered</th>
                      <th style={{ textAlign: 'right' }}>Unique Opens</th>
                      <th style={{ textAlign: 'right' }}>Open Rate</th>
                      <th style={{ textAlign: 'right' }}>Clicks</th>
                      <th style={{ textAlign: 'right' }}>Click Rate</th>
                      <th style={{ textAlign: 'right' }}>CTOR</th>
                      <th style={{ textAlign: 'right' }}>Bounces</th>
                      <th style={{ textAlign: 'right' }}>Unsubs</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSends.map((send) => (
                      <tr key={send.taskId} onClick={() => setSelectedSend(send)} style={{ cursor: 'pointer' }}>
                        <td className="text-text-primary">
                          {send.campaignName}
                          {send.isTest && (
                            <span className="text-xs" style={{ marginLeft: 6, color: 'var(--v2-orange)', fontWeight: 600 }}>
                              TEST
                            </span>
                          )}
                        </td>
                        <td className="text-text-secondary">{BRAND_LABEL[send.brand] ?? send.brand}</td>
                        <td className="text-text-secondary text-xs">{formatDateShort(send.sentDate)}</td>
                        <td className="text-text-secondary text-xs">
                          {send.emailGeography ?? (send.emailAudienceType === 'Existing' ? BRAND_LABEL[send.brand] : '—')}
                          {send.emailAudienceLevel ? ` · ${send.emailAudienceLevel}` : ''}
                        </td>
                        <td style={{ textAlign: 'right' }}>{send.recipients?.toLocaleString('en-GB') ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.delivered != null ? send.delivered.toLocaleString('en-GB') : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.uniqueOpens != null ? send.uniqueOpens.toLocaleString('en-GB') : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.uniqueOpenRate != null ? `${send.uniqueOpenRate}%` : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.clicks?.toLocaleString('en-GB') ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.clickRate != null ? `${send.clickRate}%` : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.clickToOpenRate != null ? `${send.clickToOpenRate}%` : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.bounces?.toLocaleString('en-GB') ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>{send.unsubscribes?.toLocaleString('en-GB') ?? '—'}</td>
                        <td className="text-text-secondary text-xs">Sent</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">
                {baseSends.status === 'not-connected' ? baseSends.subtitle : 'No sends match the current filters.'}
              </p>
            </div>
          )}
        </div>

        {/* Education 2026 roll-up */}
        <div className="mb-8">
          <h2 className="v2-section-title">Education 2026 Campaign</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            {educationSummary.subtitle}
            {educationSummary.testSendCount > 0 &&
              ` (${educationSummary.testSendCount} real test-slice send${educationSummary.testSendCount === 1 ? '' : 's'} — "(first N)" — excluded from these totals, still visible in Individual Sends above).`}
            {educationSummary.unmatchedCount > 0 &&
              ` — ${educationSummary.unmatchedCount} Education-named send(s) didn't match the naming convention and are excluded from this roll-up (still visible above as regular sends).`}
          </p>
          {unclassifiedSends.length > 0 && (
            <div className="card mb-6" style={{ borderLeft: '4px solid var(--v2-orange)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} color="var(--v2-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    {unclassifiedSends.length} Education send{unclassifiedSends.length === 1 ? '' : 's'} need audience-source classification
                  </p>
                  <p className="text-xs text-text-secondary mb-2">
                    Campaign and level are known, but New prospect vs Existing data couldn't be determined — never guessed. {EDUCATION_NAMING_GUIDANCE}
                  </p>
                  <ul className="text-xs text-text-secondary" style={{ paddingLeft: '1.1rem', listStyle: 'disc' }}>
                    {unclassifiedSends.map((s) => (
                      <li key={s.taskId}>{s.campaignName} ({formatDateShort(s.sentDate)})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {educationSummary.status === 'available' ? (
            <>
              <RollupTable title="Scotland vs Northern Ireland vs Republic of Ireland" rows={rollupByGeography} />
              <RollupTable title="Primary vs Secondary" rows={rollupByLevel} />
              <RollupTable title="New Prospect vs Existing Data" rows={rollupByAudienceType} />
              <RollupTable title="Brentwood vs Radio Links vs Capcom vs Irish Radio" rows={rollupByBrand} />
            </>
          ) : (
            <div className="card p-4">
              <p className="text-sm text-text-secondary">{educationSummary.subtitle}</p>
            </div>
          )}
        </div>

        {/* Downstream website attribution */}
        <div className="mb-4">
          <h2 className="v2-section-title">Website Activity from Education 2026 Emails</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real GA4 sessions and (where a verified GA4 Enquiry definition exists) enquiries from links tagged
            utm_source=campaign_monitor, utm_medium=email, utm_campaign=education_2026 — a separate, independently
            measured source from the Campaign Monitor figures above. Calls (Infinity) and revenue (Acumatica, not
            connected) are not shown here — only stages currently backed by genuine data.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <KpiCard title="Website Sessions" value={websiteAttribution.status === 'available' ? websiteAttribution.sessions.toLocaleString('en-GB') : undefined} status={websiteAttribution.status} subtitle={websiteAttribution.subtitle} />
            <KpiCard title="GA4 Enquiries" value={websiteAttribution.status === 'available' && websiteAttribution.enquiries != null ? websiteAttribution.enquiries : undefined} status={websiteAttribution.status === 'available' && websiteAttribution.enquiries != null ? 'available' : 'not-connected'} subtitle={websiteAttribution.subtitle} accent="var(--v2-green)" />
          </div>
          {websiteAttribution.status === 'available' && websiteAttribution.byContent.length > 0 && (
            <div className="card p-0">
              <div style={{ overflowX: 'auto' }}>
                <table className="table w-full text-sm" style={{ minWidth: 420 }}>
                  <thead>
                    <tr>
                      <th>utm_content (audience)</th>
                      <th style={{ textAlign: 'right' }}>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websiteAttribution.byContent.map((row) => (
                      <tr key={row.utmContent}>
                        <td className="text-text-primary">{row.utmContent}</td>
                        <td style={{ textAlign: 'right' }}>{row.sessions.toLocaleString('en-GB')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSend && (
        <SendDetailPanel
          send={selectedSend}
          educationAverage={selectedSend.emailCampaignGroup === 'education_2026' ? educationAverage : null}
          onClose={() => setSelectedSend(null)}
        />
      )}
    </div>
  );
}
