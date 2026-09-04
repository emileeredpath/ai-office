import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';
import { getMarketingEvents } from '@/utils/marketingEvents';
import { filterCampaignsByPeriod, sumSpend } from '@/utils/campaignMetrics';
import { resolveGa4DateRange, getWebsiteUsers, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
import { resolveEmailDateRange, getEmailPerformance, getEmailHeadlineMetrics, getEmailPerformanceForCampaign } from '@/utils/emailPerformance';
import { resolveCallDateRange, getCallPerformance } from '@/utils/callPerformance';
import { resolveSearchConsoleDateRange, getSearchConsoleSummary } from '@/utils/searchConsole';
import { getGoogleAdsForCampaign } from '@/utils/campaignAttribution';
import { getCurrentPeriodRange, getPreviousPeriodRange, compareToPrevious } from '@/utils/periodComparison';
import { fetchGa4Enquiries, type Ga4EnquiriesResponse } from '@/services/ga4Api';
import { fetchGoogleAdsPerformance, type GoogleAdsResponse } from '@/services/googleAdsApi';
import { fetchAcumaticaSummary, type AcumaticaSummary } from '@/services/acumaticaApi';

interface HomeScreenProps {
  onNavigate?: (screen: string) => void;
}

// A manual Acumatica export older than this is flagged as a genuine data
// issue in Needs Your Attention — not an invented threshold, just "old
// enough that the commercial figures on this page may no longer reflect
// reality." Purely a presentation-layer signal; never changes the
// underlying data or the Leads & CRM figures themselves.
const STALE_IMPORT_DAYS = 45;
// "Coming up" looks roughly two weeks ahead — a marketing diary, not a
// long-range planner.
const COMING_UP_DAYS = 14;

function formatDateRangeLabel(range: { startDate: string; endDate: string }): string {
  const start = new Date(`${range.startDate}T00:00:00`);
  const end = new Date(`${range.endDate}T00:00:00`);
  const monthShort = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) return `${start.getDate()}–${end.getDate()} ${monthShort(end)} ${end.getFullYear()}`;
  return `${start.getDate()} ${monthShort(start)} – ${end.getDate()} ${monthShort(end)} ${end.getFullYear()}`;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const ga4Enquiries = useAppStore((s) => s.ga4Enquiries);
  const ga4SocialTraffic = useAppStore((s) => s.ga4SocialTraffic);
  const ga4Traffic = useAppStore((s) => s.ga4Traffic);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const searchConsolePerformance = useAppStore((s) => s.searchConsolePerformance);
  const syncFundingRecordsFromApi = useAppStore((s) => s.syncFundingRecordsFromApi);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const syncGa4SocialTraffic = useAppStore((s) => s.syncGa4SocialTraffic);
  const syncGa4Enquiries = useAppStore((s) => s.syncGa4Enquiries);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
  const syncSearchConsolePerformance = useAppStore((s) => s.syncSearchConsolePerformance);
  const selectTask = useAppStore((s) => s.selectTask);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const { isEditor } = useAuth();
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  useEffect(() => {
    syncFundingRecordsFromApi();
  }, [syncFundingRecordsFromApi]);

  // ---- Live source fetches, all period-aware via the shared resolve*
  // utilities every other screen already uses — see REPORTING_PERIOD.md
  // for exactly what each source's period support/caveats are. -----------
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

  const searchConsoleRange = useMemo(() => resolveSearchConsoleDateRange(period), [period]);
  useEffect(() => {
    syncSearchConsolePerformance(searchConsoleRange.startDate, searchConsoleRange.endDate);
  }, [searchConsoleRange.startDate, searchConsoleRange.endDate, syncSearchConsolePerformance]);

  // Acumatica manual commercial data — CONFIRMED (Dashboard Completion
  // Phase 2 audit): the export has Created On and Estimated Close Date but
  // no trustworthy Won Date, so Won Revenue cannot be honestly assigned to
  // "this month" (or any period) — filtering by Created On would just
  // silently misrepresent it as period-scoped Won Revenue. This fetch is
  // deliberately NOT period-scoped — it always reflects the latest full
  // import, labelled as such everywhere it's shown, with no previous-period
  // comparison offered (see KPI_DEFINITIONS.md/REPORTING_PERIOD.md).
  const [acumaticaSummary, setAcumaticaSummary] = useState<AcumaticaSummary | null>(null);
  useEffect(() => {
    const brand = isGroupView || selectedEntity === 'all' ? undefined : selectedEntity;
    fetchAcumaticaSummary(undefined, undefined, brand).then(setAcumaticaSummary).catch(() => setAcumaticaSummary(null));
  }, [isGroupView, selectedEntity]);
  const acumaticaNotAvailable = acumaticaSummary?.notAvailableForBrand === true;

  // ---- Entity-scoped base data -------------------------------------------
  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const entityTasks = useMemo(
    () => tasks.filter((t) => matchesSelectedEntity(t.brand)),
    [tasks, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const entityFundingRecords = useMemo(
    () => fundingRecords.filter((r) => matchesSelectedEntity(r.brand)),
    [fundingRecords, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );
  const marketingSpend = useMemo(() => sumSpend(periodCampaigns), [periodCampaigns]);

  // ---- Marketing Performance KPIs ----------------------------------------
  const ga4EnquiriesInfo = useMemo(
    () => getEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const callPerformance = useMemo(
    () => getCallPerformance(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const emailPerf = useMemo(
    () => getEmailPerformance(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  const emailHeadline = useMemo(
    () => getEmailHeadlineMetrics(emailPerformance, isGroupView, selectedEntity),
    [emailPerformance, isGroupView, selectedEntity]
  );
  const googleAds = useMemo(
    () => getGoogleAdsSummary(googleAdsPerformance, isGroupView, selectedEntity),
    [googleAdsPerformance, isGroupView, selectedEntity]
  );
  const searchConsole = useMemo(
    () => getSearchConsoleSummary(searchConsolePerformance, isGroupView, selectedEntity),
    [searchConsolePerformance, isGroupView, selectedEntity]
  );
  const websiteUsers = useMemo(
    () => getWebsiteUsers(ga4Traffic, isGroupView, selectedEntity),
    [ga4Traffic, isGroupView, selectedEntity]
  );
  const socialTraffic = useMemo(
    () => getSocialTraffic(ga4SocialTraffic, isGroupView, selectedEntity),
    [ga4SocialTraffic, isGroupView, selectedEntity]
  );

  // ---- Previous-period comparisons ---------------------------------------
  // Only for the two sources REPORTING_PERIOD.md confirms can honestly
  // support one (GA4 Enquiries, Google Ads) — Calls/Email/Search Console
  // are deliberately left without a comparison; Acumatica has no period
  // concept at all here (see above). GA4/Google Ads previous-period data is
  // fetched directly (bypassing the shared store), same pattern already
  // established on Performance, so it never touches what any other screen
  // sees.
  const previousRange = useMemo(() => getPreviousPeriodRange(period), [period]);
  const currentRange = useMemo(() => getCurrentPeriodRange(period), [period]);
  const [previousGa4Enquiries, setPreviousGa4Enquiries] = useState<Ga4EnquiriesResponse | null>(null);
  const [previousGoogleAds, setPreviousGoogleAds] = useState<GoogleAdsResponse | null>(null);
  useEffect(() => {
    if (!previousRange) {
      setPreviousGa4Enquiries(null);
      setPreviousGoogleAds(null);
      return;
    }
    let cancelled = false;
    fetchGa4Enquiries(previousRange.startDate, previousRange.endDate)
      .then((data) => { if (!cancelled) setPreviousGa4Enquiries(data); })
      .catch(() => { if (!cancelled) setPreviousGa4Enquiries(null); });
    fetchGoogleAdsPerformance(previousRange.startDate, previousRange.endDate)
      .then((data) => { if (!cancelled) setPreviousGoogleAds(data); })
      .catch(() => { if (!cancelled) setPreviousGoogleAds(null); });
    return () => { cancelled = true; };
  }, [previousRange?.startDate, previousRange?.endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const ga4EnquiriesComparison = useMemo(() => {
    const previousInfo = getEnquiries(previousGa4Enquiries, isGroupView, selectedEntity);
    return compareToPrevious(
      ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total! : null,
      previousRange && previousInfo.status === 'available' ? previousInfo.total! : null
    );
  }, [ga4EnquiriesInfo, previousGa4Enquiries, previousRange, isGroupView, selectedEntity]);

  const googleAdsSpendComparison = useMemo(() => {
    const previousInfo = getGoogleAdsSummary(previousGoogleAds, isGroupView, selectedEntity);
    return compareToPrevious(
      googleAds.status === 'available' ? googleAds.spend! : null,
      previousRange && previousInfo.status === 'available' ? previousInfo.spend! : null
    );
  }, [googleAds, previousGoogleAds, previousRange, isGroupView, selectedEntity]);

  // ---- Needs Your Attention -----------------------------------------------
  // Genuine, rule-based conditions only, grouped into the categories a
  // marketing manager actually needs to triage — never a raw dump of every
  // task. Each category carries one real example for context.
  interface AttentionExample {
    title: string;
    detail: string;
    onClick?: () => void;
  }
  interface AttentionCategory {
    id: string;
    label: (count: number) => string;
    severity: 'red' | 'orange';
    items: AttentionExample[];
  }

  const attentionCategories = useMemo<AttentionCategory[]>(() => {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const overdue: AttentionExample[] = [];
    const dueSoon: AttentionExample[] = [];
    for (const t of entityTasks) {
      if (t.status === 'complete') continue;
      if (t.deadline && new Date(t.deadline) < now) {
        overdue.push({ title: t.title, detail: `Since ${formatDateShort(t.deadline)}`, onClick: () => selectTask(t.id) });
      } else if (t.status === 'waiting-approval' || t.status === 'waiting-john') {
        dueSoon.push({ title: t.title, detail: 'Awaiting approval', onClick: () => selectTask(t.id) });
      } else if (t.deadline) {
        const d = new Date(t.deadline);
        if (d >= now && d <= in48h) {
          dueSoon.push({ title: t.title, detail: `Due ${formatDateShort(t.deadline)}`, onClick: () => selectTask(t.id) });
        }
      }
    }

    const endedButActive: AttentionExample[] = entityCampaigns
      .filter((c) => c.status === 'active')
      .filter((c) => getCampaignProgressInfo(c.status, c.startDate, c.endDate).statusInconsistent)
      .map((c) => ({ title: c.name, detail: `Ended ${formatDateShort(c.endDate)} — still marked Active`, onClick: () => selectCampaign(c.id) }));

    const fundingDeadlines: AttentionExample[] = entityFundingRecords
      .filter((r) => !r.archived && r.claimDeadline && (r.claimStatus === 'eligible' || r.claimStatus === 'submitted'))
      .filter((r) => {
        const d = new Date(r.claimDeadline!);
        return d >= now && d <= in30days;
      })
      .map((r) => ({ title: `${r.vendor} — ${r.schemeName}`, detail: `Claim by ${formatDateShort(r.claimDeadline!)}`, onClick: () => onNavigate?.('funding') }));

    const dataIssues: AttentionExample[] = [];
    if (acumaticaSummary?.hasImportedData && acumaticaSummary.lastImportedAt) {
      const daysOld = Math.floor((now.getTime() - new Date(acumaticaSummary.lastImportedAt).getTime()) / (24 * 60 * 60 * 1000));
      if (daysOld >= STALE_IMPORT_DAYS) {
        dataIssues.push({
          title: 'Acumatica manual export is stale',
          detail: `Last imported ${daysOld}d ago — commercial figures may be out of date`,
          onClick: () => onNavigate?.('leads'),
        });
      }
    }
    if (emailPerformance?.syncState === 'error') {
      dataIssues.push({ title: 'Campaign Monitor sync failed', detail: 'Email figures may be incomplete', onClick: () => onNavigate?.('email') });
    }

    const categories: AttentionCategory[] = [
      { id: 'overdue', label: (n) => `Overdue task${n === 1 ? '' : 's'}`, severity: 'red', items: overdue },
      { id: 'due-soon', label: (n) => `Task${n === 1 ? '' : 's'} awaiting approval or due soon`, severity: 'orange', items: dueSoon },
      { id: 'ended-active', label: (n) => `Campaign${n === 1 ? '' : 's'} ended but still active`, severity: 'orange', items: endedButActive },
      { id: 'funding', label: (n) => `Funding deadline${n === 1 ? '' : 's'} approaching`, severity: 'orange', items: fundingDeadlines },
      { id: 'data-issue', label: (n) => `Data issue${n === 1 ? '' : 's'}`, severity: 'orange', items: dataIssues },
    ];
    return categories.filter((c) => c.items.length > 0);
  }, [entityTasks, entityCampaigns, entityFundingRecords, acumaticaSummary, emailPerformance, selectTask, selectCampaign, onNavigate]);

  const attentionTotal = useMemo(() => attentionCategories.reduce((sum, c) => sum + c.items.length, 0), [attentionCategories]);

  // ---- Coming Up (~14 days) ------------------------------------------------
  const comingUp = useMemo(() => {
    const now = new Date();
    const rangeEnd = new Date(now.getTime() + COMING_UP_DAYS * 24 * 60 * 60 * 1000);
    const events = getMarketingEvents({
      tasks,
      campaigns,
      fundingRecords,
      matchesSelectedEntity,
      rangeStart: now,
      rangeEnd,
      includeCompleted: false,
      includeCampaignMarkers: true,
    });
    return events.slice(0, 8).map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      due: e.date,
      context: e.kind === 'funding' ? e.subtitle : e.campaignName,
      onClick:
        e.kind === 'funding'
          ? () => onNavigate?.('funding')
          : e.kind === 'milestone' || e.kind === 'campaign-start' || e.kind === 'campaign-end'
            ? () => selectCampaign(e.campaignId!)
            : () => selectTask(e.taskId!),
    }));
  }, [tasks, campaigns, fundingRecords, matchesSelectedEntity, selectTask, selectCampaign, onNavigate]);

  const comingUpKindLabel: Record<string, string> = {
    task: 'Task',
    email: 'Task',
    milestone: 'Milestone',
    funding: 'Funding',
    'campaign-start': 'Campaign start',
    'campaign-end': 'Campaign end',
  };

  // ---- Active Campaigns table ---------------------------------------------
  const activeCampaigns = useMemo(() => {
    return entityCampaigns
      .filter((c) => c.status === 'active')
      .map((c) => {
        const progress = getCampaignProgressInfo(c.status, c.startDate, c.endDate);
        const emailResponse = getEmailPerformanceForCampaign(emailPerformance, c.id);
        const adsResponse = getGoogleAdsForCampaign(googleAdsPerformance, c);
        let response: { label: string; onClick?: () => void } | null = null;
        if (emailResponse.status === 'available' && emailResponse.sends.length > 0) {
          const clicks = emailResponse.sends.reduce((sum, s) => sum + (s.clicks ?? 0), 0);
          const opens = emailResponse.sends.reduce((sum, s) => sum + (s.opens ?? 0), 0);
          response = { label: `${opens} opens · ${clicks} clicks`, onClick: () => onNavigate?.('email') };
        } else if (adsResponse.status === 'available' && adsResponse.clicks > 0) {
          response = { label: `${adsResponse.clicks} clicks (Google Ads)`, onClick: () => onNavigate?.('ppc') };
        }

        const linkedOverdueTasks = entityTasks.filter(
          (t) => t.campaignId === c.id && t.status !== 'complete' && t.deadline && new Date(t.deadline) < new Date()
        );
        let nextAction: string | null = null;
        if (progress.statusInconsistent) nextAction = 'Review & close campaign';
        else if (linkedOverdueTasks.length > 0) nextAction = `${linkedOverdueTasks.length} overdue task${linkedOverdueTasks.length === 1 ? '' : 's'}`;

        return { campaign: c, progress, response, nextAction };
      })
      .sort((a, b) => (a.progress.statusInconsistent === b.progress.statusInconsistent ? 0 : a.progress.statusInconsistent ? -1 : 1));
  }, [entityCampaigns, entityTasks, emailPerformance, googleAdsPerformance, onNavigate]);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = formatDate(today);
  const userName = isEditor ? 'Emilee' : 'John';
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-text-secondary">
              {dayName} {dateStr} · Here's what's happening with MTech marketing this month.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <PeriodSelector />
            {currentRange && (
              <div className="text-xs text-text-secondary" style={{ textAlign: 'right' }}>
                <span>{formatDateRangeLabel(currentRange)}</span>
                {previousRange && <span> · vs {formatDateRangeLabel(previousRange)}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Needs Your Attention + Coming Up */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
              <h2 className="v2-section-title" style={{ marginBottom: 0 }}>Needs Your Attention</h2>
              {attentionTotal > 0 && (
                <p className="text-sm text-text-secondary" style={{ marginTop: 2 }}>{attentionTotal} thing{attentionTotal === 1 ? '' : 's'} need{attentionTotal === 1 ? 's' : ''} your attention</p>
              )}
            </div>
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              {attentionCategories.length > 0 ? (
                <div className="space-y-3">
                  {attentionCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={cat.items[0]?.onClick}
                      className="v2-attention-item w-full flex items-start gap-2 text-left px-3 py-2 rounded"
                      data-severity={cat.severity}
                    >
                      <AlertTriangle size={14} color={cat.severity === 'red' ? 'var(--v2-red)' : 'var(--v2-orange)'} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>
                        <span className="text-sm font-semibold text-text-primary block">
                          {cat.items.length} {cat.label(cat.items.length)}
                        </span>
                        {cat.items[0] && (
                          <span className="text-xs text-text-secondary">
                            {cat.items[0].title} — {cat.items[0].detail}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} color="var(--v2-green)" />
                  <span className="text-sm font-medium text-text-primary">Nothing urgent right now</span>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
              <h2 className="v2-section-title" style={{ marginBottom: 0 }}>Coming Up</h2>
              <p className="text-sm text-text-secondary" style={{ marginTop: 2 }}>Next {COMING_UP_DAYS} days</p>
            </div>
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              {comingUp.length > 0 ? (
                <div className="space-y-2">
                  {comingUp.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="w-full text-left"
                      style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', background: 'none', border: 'none', cursor: item.onClick ? 'pointer' : 'default' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="v2-coming-up-kind" data-kind={item.kind === 'email' ? 'task' : item.kind}>
                          {comingUpKindLabel[item.kind] ?? 'Event'}
                        </span>
                        <span className="text-xs text-text-secondary">{formatDateShort(item.due)}</span>
                      </div>
                      <div className="text-sm font-medium text-text-primary">{item.title}</div>
                      {item.context && <div className="text-xs text-text-secondary">{item.context}</div>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">Nothing scheduled in the next {COMING_UP_DAYS} days</p>
              )}
              <button
                onClick={() => onNavigate?.('calendar')}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.75rem' }}
              >
                Content & Calendar <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Marketing Performance */}
        <div className="mb-8">
          <h2 className="v2-section-title" style={{ marginBottom: 2 }}>Marketing Performance</h2>
          <p className="text-sm text-text-secondary" style={{ marginBottom: '0.75rem' }}>Key activity this month vs previous period</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard
              title="Website Enquiries"
              value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined}
              status={ga4EnquiriesInfo.status}
              subtitle={ga4EnquiriesInfo.subtitle}
              comparison={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesComparison : undefined}
            />
            <KpiCard
              title="Calls"
              value={callPerformance.status === 'available' ? callPerformance.totalCalls : undefined}
              status={callPerformance.status}
              subtitle={callPerformance.subtitle}
              onClick={() => onNavigate?.('infinity')}
            />
            <KpiCard
              title="Email Clicks"
              value={emailPerf.status === 'available' ? emailPerf.clicks : undefined}
              status={emailPerf.status}
              subtitle={emailPerf.subtitle}
              onClick={() => onNavigate?.('email')}
            />
            <KpiCard
              title="Google Ads Spend"
              value={googleAds.status === 'available' ? `£${Math.round(googleAds.spend!).toLocaleString()}` : undefined}
              status={googleAds.status}
              subtitle={googleAds.subtitle}
              comparison={googleAds.status === 'available' ? googleAdsSpendComparison : undefined}
              onClick={() => onNavigate?.('ppc')}
            />
            <KpiCard
              title="Opportunities"
              value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? acumaticaSummary.opportunities : undefined}
              status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'}
              notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
              subtitle={
                acumaticaNotAvailable
                  ? `Not available — ${acumaticaSummary?.notAvailableReason}`
                  : acumaticaSummary?.hasImportedData
                    ? 'Latest Acumatica export'
                    : 'No Acumatica export imported yet'
              }
              onClick={() => onNavigate?.('leads')}
            />
            <KpiCard
              title="Won Revenue"
              value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? `£${Math.round(acumaticaSummary.wonRevenue).toLocaleString()}` : undefined}
              status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'}
              notConnectedLabel={acumaticaNotAvailable ? 'Not available' : 'Not connected'}
              subtitle={
                acumaticaNotAvailable
                  ? `Not available — ${acumaticaSummary?.notAvailableReason}`
                  : acumaticaSummary?.hasImportedData
                    ? 'Latest Acumatica export — no reliable Won Date to scope by period'
                    : 'No Acumatica export imported yet'
              }
              onClick={() => onNavigate?.('leads')}
            />
          </div>
        </div>

        {/* Marketing Impact */}
        <div className="mb-8">
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">Marketing Response</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Google Ads Spend</div>
                    <div className="text-xl font-bold text-text-primary">
                      {googleAds.status === 'available' ? `£${Math.round(googleAds.spend!).toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Enquiries + Calls</div>
                    <div className="text-xl font-bold text-text-primary">
                      {(ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total! : 0) +
                        (callPerformance.status === 'available' ? callPerformance.totalCalls! : 0) || (ga4EnquiriesInfo.status !== 'available' && callPerformance.status !== 'available' ? '—' : 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Marketing Leads</div>
                    <div className="text-xl font-bold text-text-primary">{campaigns.length > 0 ? periodCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0) : '—'}</div>
                  </div>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">Overall Commercial Performance</h3>
                {acumaticaNotAvailable ? (
                  <p className="text-sm text-text-secondary">Not available — {acumaticaSummary?.notAvailableReason}</p>
                ) : acumaticaSummary?.hasImportedData ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Opportunities</div>
                      <div className="text-xl font-bold text-text-primary">{acumaticaSummary.opportunities}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Open Pipeline</div>
                      <div className="text-xl font-bold text-text-primary">£{Math.round(acumaticaSummary.openPipelineValue).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Won Revenue</div>
                      <div className="text-xl font-bold text-text-primary">£{Math.round(acumaticaSummary.wonRevenue).toLocaleString()}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No Acumatica export imported yet</p>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <p className="text-xs text-text-secondary">
                Commercial figures are from the latest Acumatica manual export
                {acumaticaSummary?.lastImportedAt ? ` (imported ${new Date(acumaticaSummary.lastImportedAt).toLocaleDateString('en-GB')})` : ''} and are not yet fully attributed to marketing campaigns.
                {isGroupView && ' Acumatica covers Brentwood, Radio Links, Capcom and Brentwood Marine. IRCL is not managed in Acumatica.'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="v2-section-title" style={{ marginBottom: 0 }}>Active Campaigns</h2>
            <button
              onClick={() => onNavigate?.('campaigns')}
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all campaigns <ArrowRight size={14} />
            </button>
          </div>
          <p className="text-sm text-text-secondary" style={{ marginBottom: '0.75rem' }}>Campaigns that need monitoring or action</p>
          {activeCampaigns.length > 0 ? (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Campaign</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Response (this period)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Spend</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCampaigns.map(({ campaign: c, progress, response, nextAction }) => (
                    <tr key={c.id} onClick={() => selectCampaign(c.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div className="font-medium text-text-primary text-sm">{c.name}</div>
                        <BrandBadge brand={c.brand} />
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {progress.statusInconsistent ? (
                          <span className="badge" style={{ background: 'var(--v2-orange)', color: 'white', fontSize: '10px' }}>{progress.label}</span>
                        ) : (
                          <span className="badge" style={{ ...CAMPAIGN_STATUS_BADGE_STYLE[c.status], fontSize: '10px' }}>{CAMPAIGN_STATUS_LABEL[c.status]}</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {response ? <span className="text-sm">{response.label}</span> : <span className="v2-not-connected-text">— / Not linked</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div className="text-sm">£{Math.round(c.spend || 0).toLocaleString()}<span className="text-xs text-text-secondary"> manual</span></div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {nextAction ? <span className="text-sm" style={{ color: progress.statusInconsistent ? 'var(--v2-orange)' : undefined }}>{nextAction}</span> : <span className="v2-not-connected-text">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-text-secondary">No active campaigns{isGroupView ? '' : ' for this entity'}</p>
          )}
        </div>

        {/* Channel Performance */}
        <div className="mb-4">
          <h2 className="v2-section-title" style={{ marginBottom: 2 }}>Channel Performance</h2>
          <p className="text-sm text-text-secondary" style={{ marginBottom: '0.75rem' }}>Key metrics from connected channels (this month)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              title="Website"
              value={websiteUsers.status === 'available' ? websiteUsers.sessions : undefined}
              status={websiteUsers.status}
              subtitle={
                websiteUsers.status === 'available'
                  ? `${ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : 0} enquiries`
                  : websiteUsers.subtitle
              }
              size="compact"
              onClick={() => onNavigate?.('website')}
            />
            <KpiCard
              title="Email"
              value={emailHeadline.status === 'available' ? emailHeadline.recipients : undefined}
              status={emailHeadline.status}
              subtitle={emailHeadline.status === 'available' ? `${emailHeadline.clicks} clicks` : emailHeadline.subtitle}
              size="compact"
              onClick={() => onNavigate?.('email')}
            />
            <KpiCard
              title="PPC"
              value={googleAds.status === 'available' ? `£${Math.round(googleAds.spend!).toLocaleString()}` : undefined}
              status={googleAds.status}
              subtitle={googleAds.status === 'available' ? `${googleAds.clicks} clicks` : googleAds.subtitle}
              size="compact"
              onClick={() => onNavigate?.('ppc')}
            />
            <KpiCard
              title="Calls"
              value={callPerformance.status === 'available' ? callPerformance.totalCalls : undefined}
              status={callPerformance.status}
              subtitle={callPerformance.status === 'available' ? `${callPerformance.answeredCalls} answered` : callPerformance.subtitle}
              size="compact"
              onClick={() => onNavigate?.('infinity')}
            />
            <KpiCard
              title="SEO"
              value={searchConsole.status === 'available' ? searchConsole.clicks : undefined}
              status={searchConsole.status}
              subtitle={searchConsole.status === 'available' ? `${searchConsole.impressions} impressions` : searchConsole.subtitle}
              size="compact"
              onClick={() => onNavigate?.('website')}
            />
            <KpiCard
              title="Social"
              value={socialTraffic.status === 'available' ? socialTraffic.sessions : undefined}
              status={socialTraffic.status}
              subtitle={socialTraffic.status === 'available' ? `${socialTraffic.users} users` : socialTraffic.subtitle}
              size="compact"
              onClick={() => onNavigate?.('social')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
