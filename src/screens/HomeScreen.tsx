import { getCampaignKnownSpend, LEGACY_COST_LABEL } from '@/utils/campaignCosts';
import { fetchCampaignCostsFromApi } from '@/services/campaignCostsApi';
import type { Brand, CampaignCost } from '@/types/index';
import { getCampaignEntities } from '@/utils/campaignEntities';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Flag, Sparkles, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { usePeriod } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { HomeEmptyState } from '@/components/home/HomeEmptyState';
import { HomeMetric } from '@/components/home/HomeMetric';
import { HomePanel } from '@/components/home/HomePanel';
import { HomeSection } from '@/components/home/HomeSection';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';
import { getMarketingEvents } from '@/utils/marketingEvents';
import { resolveGa4DateRange, getWebsiteUsers, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries } from '@/utils/ga4Enquiries';
import { resolveGoogleAdsDateRange, getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
import { resolveEmailDateRange, getEmailHeadlineMetrics, getEmailPerformanceForCampaign } from '@/utils/emailPerformance';
import { resolveCallDateRange, getCallPerformance } from '@/utils/callPerformance';
import { resolveSearchConsoleDateRange, getSearchConsoleSummary } from '@/utils/searchConsole';
import { getGoogleAdsForCampaign } from '@/utils/campaignAttribution';
import { getCurrentPeriodRange, getPreviousPeriodRange, compareToPrevious } from '@/utils/periodComparison';
import { fetchGa4Enquiries, type Ga4EnquiriesResponse } from '@/services/ga4Api';
import { fetchGoogleAdsPerformance, type GoogleAdsResponse } from '@/services/googleAdsApi';
import { fetchAcumaticaSummary, type AcumaticaSummary } from '@/services/acumaticaApi';
import { getAcumaticaMissingDataHeadline, getAcumaticaMissingDataLabel } from '@/utils/acumaticaAvailability';
import { BRAND_LABEL } from '@/utils/brandColors';
import { fetchMarketingPlans, fetchMarketingStrategy } from '@/services/marketingPlanApi';
import type { MarketingPlan, MarketingPlanStrategyObjective } from '@/types/marketingPlan';
import { filterStrategyForEntity, getMarketingPlanWeekFocus, getQuarterStrategyRows, selectMarketingPlanForCurrentPeriod } from '@/utils/marketingPlanFocus';
import { getStrategyHealthFindings } from '@/utils/marketingPlanProgress';

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

  const [marketingPlan, setMarketingPlan] = useState<MarketingPlan | null>(null);
  const [marketingStrategy, setMarketingStrategy] = useState<MarketingPlanStrategyObjective[]>([]);
  const [marketingFocusLoading, setMarketingFocusLoading] = useState(true);
  const [marketingFocusUnavailable, setMarketingFocusUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMarketingFocusLoading(true);
    setMarketingFocusUnavailable(false);
    fetchMarketingPlans()
      .then(async (plans) => {
        const selected = selectMarketingPlanForCurrentPeriod(plans);
        if (!selected) return { selected: null, rows: [] as MarketingPlanStrategyObjective[] };
        return { selected, rows: await fetchMarketingStrategy(selected.id) };
      })
      .then(({ selected, rows }) => {
        if (cancelled) return;
        setMarketingPlan(selected);
        setMarketingStrategy(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setMarketingPlan(null);
        setMarketingStrategy([]);
        setMarketingFocusUnavailable(true);
      })
      .finally(() => { if (!cancelled) setMarketingFocusLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
  const acumaticaEntityLabel = isGroupView || selectedEntity === 'all' ? undefined : BRAND_LABEL[selectedEntity as Brand];
  const acumaticaMissingLabel = getAcumaticaMissingDataLabel(acumaticaSummary, acumaticaEntityLabel);
  const acumaticaMissingHeadline = getAcumaticaMissingDataHeadline(acumaticaSummary);

  // ---- Entity-scoped base data -------------------------------------------
  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => getCampaignEntities(c).some(matchesSelectedEntity)),
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
  // Campaign rows use lifetime costs and the existing all-time media range.
  // Keep these reads separate from the period-scoped Google Ads headline.
  const [homeCampaignCosts, setHomeCampaignCosts] = useState<CampaignCost[] | null>(null);
  const [campaignSpendAds, setCampaignSpendAds] = useState<GoogleAdsResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchCampaignCostsFromApi()
      .then((costs) => { if (!cancelled) setHomeCampaignCosts(costs); })
      .catch(() => { if (!cancelled) setHomeCampaignCosts(null); });
    const range = resolveGoogleAdsDateRange('all-time');
    fetchGoogleAdsPerformance(range.startDate, range.endDate)
      .then((data) => { if (!cancelled) setCampaignSpendAds(data); })
      .catch(() => { if (!cancelled) setCampaignSpendAds(null); });
    return () => { cancelled = true; };
  }, []);

  // ---- Marketing Performance KPIs ----------------------------------------
  const ga4EnquiriesInfo = useMemo(
    () => getEnquiries(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const callPerformance = useMemo(
    () => getCallPerformance(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
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

  // ---- Marketing Focus ----------------------------------------------------
  // This is derived only from saved Marketing Plan records. Empty or failed
  // reads stay visibly unavailable; no plan, objective or count is invented.
  const entityStrategy = useMemo(
    () => filterStrategyForEntity(marketingStrategy, isGroupView ? 'all' : selectedEntity),
    [marketingStrategy, isGroupView, selectedEntity]
  );
  const quarterFocus = useMemo(
    () => marketingPlan ? getQuarterStrategyRows(marketingPlan, entityStrategy) : null,
    [marketingPlan, entityStrategy]
  );
  const weekFocus = useMemo(
    () => marketingPlan ? getMarketingPlanWeekFocus(marketingPlan, entityStrategy) : null,
    [marketingPlan, entityStrategy]
  );
  const strategyAttention = useMemo(
    () => getStrategyHealthFindings(entityStrategy, {}).slice(0, 3),
    [entityStrategy]
  );

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
    return events.slice(0, 3).map((e) => ({
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

        return { campaign: c, progress, response, nextAction, spendInfo: homeCampaignCosts === null ? null : getCampaignKnownSpend(c, homeCampaignCosts, campaignSpendAds) };
      })
      .sort((a, b) => (a.progress.statusInconsistent === b.progress.statusInconsistent ? 0 : a.progress.statusInconsistent ? -1 : 1));
  }, [entityCampaigns, entityTasks, emailPerformance, googleAdsPerformance, homeCampaignCosts, campaignSpendAds, onNavigate]);
  const allCampaignsNeedingAction = activeCampaigns.filter(({ nextAction }) => nextAction);
  const campaignsNeedingAction = allCampaignsNeedingAction.slice(0, 3);

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
    <div className="v2-page home-page">
      <div className="home-page-inner">
        <header className="home-hero">
          <div>
            <div className="home-eyebrow">Marketing control centre</div>
            <h1>{getGreeting()}, {userName}</h1>
            <p>{dayName} {dateStr} · Focus, performance and action across MTech marketing.</p>
          </div>
          <div className="home-period-control">
            <PeriodSelector />
            {currentRange && (
              <div className="home-period-label">
                <span>{formatDateRangeLabel(currentRange)}</span>
                {previousRange && <span> · compared with {formatDateRangeLabel(previousRange)}</span>}
              </div>
            )}
          </div>
        </header>

        <HomeSection
          eyebrow="Direction"
          title="Marketing Focus"
          description="Current priorities from the saved Marketing Plan. No placeholder objectives or tasks are added here."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('marketing-plan')}>Open Marketing Plan <ArrowRight size={14} /></button>}
        >
          <div className="home-focus-grid">
            <HomePanel title="Current quarter" eyebrow={marketingPlan && quarterFocus ? `Q${quarterFocus.quarter} ${marketingPlan.periodYear}` : undefined} variant="accent">
              {marketingFocusLoading ? <HomeEmptyState>Loading the saved plan…</HomeEmptyState>
                : marketingFocusUnavailable ? <HomeEmptyState>Marketing Plan data is unavailable right now.</HomeEmptyState>
                : !marketingPlan ? <HomeEmptyState>No Marketing Plan has been created yet.</HomeEmptyState>
                : !quarterFocus?.rows.length ? <HomeEmptyState>No objectives are assigned to Q{quarterFocus?.quarter} {marketingPlan.periodYear} for this entity.</HomeEmptyState>
                : <div className="home-focus-list">{quarterFocus.rows.slice(0, 3).map((row) => (
                    <button key={row.objective.id} type="button" onClick={() => onNavigate?.('marketing-plan')} className="home-focus-item">
                      <Target size={16} />
                      <span><strong>{row.objective.title}</strong><small>{row.priorities.length} priorit{row.priorities.length === 1 ? 'y' : 'ies'} · {row.campaignLinks.length} linked campaign{row.campaignLinks.length === 1 ? '' : 's'}</small></span>
                    </button>
                  ))}</div>}
            </HomePanel>

            <HomePanel title="This week">
              {marketingFocusLoading ? <HomeEmptyState>Loading the saved plan…</HomeEmptyState>
                : marketingFocusUnavailable ? <HomeEmptyState>Weekly focus is unavailable until the plan can be loaded.</HomeEmptyState>
                : !marketingPlan ? <HomeEmptyState>Create the Marketing Plan to set this week’s focus.</HomeEmptyState>
                : !weekFocus?.items.length ? <HomeEmptyState>Nothing in the plan needs attention this week.</HomeEmptyState>
                : <div className="home-focus-list">{weekFocus.items.slice(0, 3).map((item) => (
                    <button key={item.id} type="button" onClick={() => onNavigate?.('marketing-plan')} className="home-focus-item" data-overdue={item.overdue}>
                      <CalendarDays size={16} />
                      <span><strong>{item.title}</strong><small>{item.kind} · {item.detail}</small></span>
                    </button>
                  ))}</div>}
            </HomePanel>

            <HomePanel title="Plan attention" variant="attention">
              {marketingFocusLoading ? <HomeEmptyState>Checking the saved plan…</HomeEmptyState>
                : marketingFocusUnavailable ? <HomeEmptyState>Attention checks are unavailable until the plan can be loaded.</HomeEmptyState>
                : !marketingPlan ? <HomeEmptyState>No saved plan is available to check.</HomeEmptyState>
                : !strategyAttention.length ? <div className="home-positive-state"><CheckCircle2 size={17} />No factual gaps found for this entity.</div>
                : <div className="home-focus-list">{strategyAttention.map((item) => (
                    <button key={item.id} type="button" onClick={() => onNavigate?.('marketing-plan')} className="home-focus-item" data-attention="true">
                      <Flag size={16} />
                      <span><strong>{item.title}</strong><small>{entityStrategy.find((row) => row.objective.id === item.objectiveId)?.objective.title} · {item.detail}</small></span>
                    </button>
                  ))}</div>}
            </HomePanel>
          </div>
        </HomeSection>

        <HomeSection
          eyebrow="Selected reporting view"
          title="Headline Performance"
          description="A restrained view of independent measures. Won Revenue reflects the latest Acumatica export because no trustworthy Won Date is available."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('dashboard')}>Full performance <ArrowRight size={14} /></button>}
        >
          <div className="home-metric-grid">
            <HomeMetric label="Website enquiries" value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined} status={ga4EnquiriesInfo.status} detail={ga4EnquiriesInfo.subtitle} onClick={() => onNavigate?.('website')} />
            <HomeMetric label="Calls" value={callPerformance.status === 'available' ? callPerformance.totalCalls : undefined} status={callPerformance.status} detail={callPerformance.subtitle} onClick={() => onNavigate?.('infinity')} />
            <HomeMetric label="Google Ads spend" value={googleAds.status === 'available' ? `£${Math.round(googleAds.spend!).toLocaleString()}` : undefined} status={googleAds.status} detail={googleAds.subtitle} onClick={() => onNavigate?.('ppc')} />
            <HomeMetric
              label="Won revenue"
              value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? `£${Math.round(acumaticaSummary.wonRevenue).toLocaleString()}` : undefined}
              status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'}
              unavailableLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline}
              detail={acumaticaNotAvailable ? `Not available — ${acumaticaSummary?.notAvailableReason}` : acumaticaSummary?.hasImportedData ? 'Latest Acumatica export · not period scoped' : acumaticaMissingLabel}
              onClick={() => onNavigate?.('leads')}
            />
          </div>
        </HomeSection>

        <HomeSection
          eyebrow="Live activity"
          title="Active Campaigns"
          description="Genuine campaign records, their canonical entity membership and lifetime known campaign spend."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('campaigns')}>View all campaigns <ArrowRight size={14} /></button>}
        >
          {activeCampaigns.length > 0 ? (
            <HomePanel className="home-campaign-panel">
              <div className="home-campaign-table-wrap">
                <table className="home-campaign-table">
                  <thead><tr><th>Campaign</th><th>Entity</th><th>Status</th><th>Timing</th><th>Known spend</th></tr></thead>
                  <tbody>{activeCampaigns.slice(0, 6).map(({ campaign: c, progress, spendInfo }) => (
                    <tr
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectCampaign(c.id)}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCampaign(c.id); } }}
                    >
                      <td><strong>{c.name}</strong>{progress.statusInconsistent && <small className="home-campaign-warning">Review status</small>}</td>
                      <td><div className="home-entity-list">{getCampaignEntities(c).map((entity) => <span key={entity}>{BRAND_LABEL[entity]}</span>)}</div></td>
                      <td><span className="home-status-pill" style={CAMPAIGN_STATUS_BADGE_STYLE[c.status]}>{CAMPAIGN_STATUS_LABEL[c.status]}</span></td>
                      <td><span>{formatDateShort(c.startDate)} – {formatDateShort(c.endDate)}</span></td>
                      <td>{spendInfo ? <><strong>£{Math.round(spendInfo.knownCampaignSpend).toLocaleString()}</strong>{spendInfo.isLegacyFallback && <small>{LEGACY_COST_LABEL}</small>}{spendInfo.mediaSpendStatus !== 'available' && <small>Media {spendInfo.mediaSpendStatus === 'unmapped' ? 'unmapped' : 'not connected'}</small>}</> : <span className="home-unavailable">Costs unavailable</span>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {activeCampaigns.length > 6 && <div className="home-table-note">Showing 6 of {activeCampaigns.length} active campaigns.</div>}
            </HomePanel>
          ) : <HomeEmptyState>No active campaigns{isGroupView ? '' : ' for this entity'}.</HomeEmptyState>}
        </HomeSection>

        <HomeSection
          eyebrow="Commercial context"
          title="Commercial Performance"
          description="Marketing response and commercial outcomes are related views, not deterministic campaign attribution."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('leads')}>Open CRM <ArrowRight size={14} /></button>}
        >
          <HomePanel variant="commercial">
            <div className="home-commercial-context">
              <div><span>Marketing response</span><strong>{ga4EnquiriesInfo.status === 'available' ? `${ga4EnquiriesInfo.total} website enquiries` : 'Website enquiries unavailable'} · {callPerformance.status === 'available' ? `${callPerformance.totalCalls} calls` : 'calls unavailable'}</strong><small>Selected reporting period</small></div>
              <ArrowRight size={18} aria-hidden="true" />
              <div><span>Overall CRM outcomes</span><strong>Latest Acumatica manual export</strong><small>Not attributed to marketing and not period scoped</small></div>
            </div>
            <div className="home-commercial-metrics">
              <HomeMetric label="Opportunities" value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? acumaticaSummary.opportunities : undefined} status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'} unavailableLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline} detail={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'Latest Acumatica export' : acumaticaNotAvailable ? acumaticaSummary?.notAvailableReason ?? undefined : acumaticaMissingLabel} />
              <HomeMetric label="Open pipeline" value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? `£${Math.round(acumaticaSummary.openPipelineValue).toLocaleString()}` : undefined} status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'} unavailableLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline} detail="Status Open + Status New" />
              <HomeMetric label="Won revenue" value={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? `£${Math.round(acumaticaSummary.wonRevenue).toLocaleString()}` : undefined} status={acumaticaSummary?.hasImportedData && !acumaticaNotAvailable ? 'available' : 'not-connected'} unavailableLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline} detail="Latest export · no trustworthy Won Date" />
            </div>
          </HomePanel>
        </HomeSection>

        <HomeSection eyebrow="Action" title="Needs Attention & Upcoming" description="Campaign, calendar, funding, data and Marketing Plan items derived from genuine records.">
          <div className="home-action-grid">
            <HomePanel title="Needs attention" eyebrow={attentionTotal > 0 ? `${attentionTotal} item${attentionTotal === 1 ? '' : 's'}` : undefined} variant="attention">
              {attentionCategories.length > 0 ? <div className="home-action-list">{attentionCategories.map((category) => (
                <button key={category.id} type="button" onClick={category.items[0]?.onClick} data-severity={category.severity}>
                  <AlertTriangle size={16} />
                  <span><strong>{category.items.length} {category.label(category.items.length)}</strong>{category.items[0] && <small>{category.items[0].title} — {category.items[0].detail}</small>}</span>
                  <ArrowRight size={14} />
                </button>
              ))}</div> : <div className="home-positive-state"><CheckCircle2 size={17} />Nothing urgent right now.</div>}
            </HomePanel>

            <HomePanel title="Upcoming" eyebrow={`Next ${COMING_UP_DAYS} days`}>
              {comingUp.length > 0 ? <div className="home-action-list">{comingUp.map((item) => (
                <button key={item.id} type="button" onClick={item.onClick}>
                  <CalendarDays size={16} />
                  <span><strong>{item.title}</strong><small>{comingUpKindLabel[item.kind] ?? 'Event'} · {formatDateShort(item.due)}{item.context ? ` · ${item.context}` : ''}</small></span>
                  <ArrowRight size={14} />
                </button>
              ))}</div> : <HomeEmptyState>Nothing scheduled in the next {COMING_UP_DAYS} days.</HomeEmptyState>}
              <button type="button" className="home-text-action home-panel-link" onClick={() => onNavigate?.('calendar')}>Open Calendar <ArrowRight size={14} /></button>
            </HomePanel>
          </div>
        </HomeSection>

        <aside className="home-ai-reserve" aria-label="Future Ask AI Office area">
          <Sparkles size={18} />
          <div><strong>Ask AI Office</strong><span>Reserved for a future conversational layer. It is not connected yet.</span></div>
          <span className="home-ai-status">Future</span>
        </aside>
      </div>
    </div>
  );
}
