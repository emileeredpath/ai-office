import { getCampaignKnownSpend, LEGACY_COST_LABEL, sumKnownCampaignSpend } from '@/utils/campaignCosts';
import { fetchCampaignCostsFromApi } from '@/services/campaignCostsApi';
import type { Brand, CampaignCost } from '@/types/index';
import { getCampaignEntities } from '@/utils/campaignEntities';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Flag, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity } from '@/contexts/EntityContext';
import { periodStartDate, usePeriod } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { HomeEmptyState } from '@/components/home/HomeEmptyState';
import { HomeMetric } from '@/components/home/HomeMetric';
import { HomeSection } from '@/components/home/HomeSection';
import { formatDateShort } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';
import { getMarketingEvents } from '@/utils/marketingEvents';
import { resolveGa4DateRange, getWebsiteUsers, getSocialTraffic } from '@/utils/ga4Traffic';
import { getEnquiries, getEnquiriesByChannel } from '@/utils/ga4Enquiries';
import { resolveGoogleAdsDateRange, getCostPerGa4Enquiry, getGoogleAdsSummary } from '@/utils/googleAdsPerformance';
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
import { filterCampaignsByDateRange, filterCampaignsByPeriod, MARKETING_LEADS_CAVEAT, sumLeads } from '@/utils/campaignMetrics';

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

function formatComparison(comparison: ReturnType<typeof compareToPrevious>): string | undefined {
  if (!comparison || comparison.previous === null || comparison.absoluteChange === null) return undefined;
  const sign = comparison.absoluteChange > 0 ? '+' : '';
  const percent = comparison.percentChange === null ? '' : ` (${comparison.percentChange > 0 ? '+' : ''}${comparison.percentChange}%)`;
  return `${sign}${comparison.absoluteChange.toLocaleString('en-GB')}${percent} vs previous period`;
}

function comparisonTone(comparison: ReturnType<typeof compareToPrevious>): 'positive' | 'negative' | 'neutral' {
  if (!comparison || comparison.absoluteChange === null || comparison.absoluteChange === 0) return 'neutral';
  return comparison.absoluteChange > 0 ? 'positive' : 'negative';
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
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );
  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
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
  const marketingSpendInfo = useMemo(
    () => homeCampaignCosts === null ? null : sumKnownCampaignSpend(periodCampaigns, homeCampaignCosts, googleAdsPerformance),
    [periodCampaigns, homeCampaignCosts, googleAdsPerformance]
  );

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
  const enquiryChannels = useMemo(
    () => getEnquiriesByChannel(ga4Enquiries, isGroupView, selectedEntity),
    [ga4Enquiries, isGroupView, selectedEntity]
  );
  const costPerGa4Enquiry = useMemo(
    () => getCostPerGa4Enquiry(googleAdsPerformance, ga4Enquiries, isGroupView, selectedEntity),
    [googleAdsPerformance, ga4Enquiries, isGroupView, selectedEntity]
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

  const previousPeriodCampaigns = useMemo(() => {
    if (!previousRange) return [];
    return filterCampaignsByDateRange(entityCampaigns, new Date(previousRange.startDate), new Date(previousRange.endDate));
  }, [entityCampaigns, previousRange]);
  const marketingLeadsComparison = useMemo(
    () => compareToPrevious(marketingLeads, previousRange ? sumLeads(previousPeriodCampaigns) : null),
    [marketingLeads, previousPeriodCampaigns, previousRange]
  );

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

  const entityLabel = isGroupView || selectedEntity === 'all' ? 'MTech Group' : BRAND_LABEL[selectedEntity as Brand];
  const acquisitionMax = enquiryChannels.status === 'available'
    ? Math.max(1, ...enquiryChannels.buckets.map((bucket) => bucket.count))
    : 1;
  const enquiryTrendMax = Math.max(
    1,
    ga4EnquiriesComparison?.current ?? 0,
    ga4EnquiriesComparison?.previous ?? 0
  );
  const crmAvailable = acumaticaSummary?.hasImportedData && !acumaticaNotAvailable;

  return (
    <div className="v2-page home-page">
      <div className="home-page-inner">
        <header className="home-overview-header">
          <div>
            <div className="home-eyebrow">{entityLabel}</div>
            <h1>Marketing Overview</h1>
            <p>A clear view of performance, acquisition, campaigns and commercial outcomes.</p>
          </div>
          <div className="home-header-controls">
            <PeriodSelector />
            <div className="home-freshness">
              <span className="home-freshness-dot" />
              <span>Reporting data through {formatDateShort(ga4Range.endDate)}</span>
            </div>
            {currentRange && <small>{formatDateRangeLabel(currentRange)}{previousRange ? ` · compared with ${formatDateRangeLabel(previousRange)}` : ''}</small>}
          </div>
        </header>

        <HomeSection
          title="Headline performance"
          description="The measures needed for a fast daily read. Each figure keeps its own source and scope."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('dashboard')}>View performance <ArrowRight size={14} /></button>}
        >
          <div className="home-kpi-strip">
            <HomeMetric label="Marketing leads" value={marketingLeads} detail={MARKETING_LEADS_CAVEAT} comparison={formatComparison(marketingLeadsComparison)} comparisonTone={comparisonTone(marketingLeadsComparison)} onClick={() => onNavigate?.('leads')} />
            <HomeMetric label="Website enquiries" value={ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : undefined} status={ga4EnquiriesInfo.status} detail={ga4EnquiriesInfo.subtitle} comparison={formatComparison(ga4EnquiriesComparison)} comparisonTone={comparisonTone(ga4EnquiriesComparison)} onClick={() => onNavigate?.('website')} />
            <HomeMetric label="Calls" value={callPerformance.status === 'available' ? callPerformance.totalCalls : undefined} status={callPerformance.status} detail={callPerformance.subtitle} onClick={() => onNavigate?.('infinity')} />
            <HomeMetric label="Marketing spend" value={marketingSpendInfo ? `£${Math.round(marketingSpendInfo.total).toLocaleString()}` : undefined} status={marketingSpendInfo ? 'available' : 'not-connected'} unavailableLabel="Not available" detail={marketingSpendInfo ? `Known Campaign Spend · ${marketingSpendInfo.hasLegacyFallback ? 'includes legacy cost' : 'canonical costs'}` : 'Campaign costs unavailable'} onClick={() => onNavigate?.('campaigns')} />
            <HomeMetric label="Opportunities" value={crmAvailable ? acumaticaSummary.opportunities : undefined} status={crmAvailable ? 'available' : 'not-connected'} unavailableLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline} detail={crmAvailable ? 'Overall CRM · latest export' : acumaticaMissingLabel} onClick={() => onNavigate?.('leads')} />
            <HomeMetric label="Open pipeline" value={crmAvailable ? `£${Math.round(acumaticaSummary.openPipelineValue).toLocaleString()}` : undefined} status={crmAvailable ? 'available' : 'not-connected'} unavailableLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline} detail="Overall CRM · Status Open + Status New" onClick={() => onNavigate?.('leads')} />
            <HomeMetric label="Won revenue" value={crmAvailable ? `£${Math.round(acumaticaSummary.wonRevenue).toLocaleString()}` : undefined} status={crmAvailable ? 'available' : 'not-connected'} unavailableLabel={acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline} detail="Overall CRM · latest export · no trustworthy Won Date" onClick={() => onNavigate?.('leads')} />
          </div>
        </HomeSection>

        <div className="home-primary-grid">
          <HomeSection
            title="Where people are coming from"
            description="Website enquiries by GA4 session channel. No source is inferred or renamed."
            action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('website')}>View acquisition <ArrowRight size={14} /></button>}
            className="home-acquisition-section"
          >
            <div className="home-measure-label">Measure <strong>Website enquiries</strong></div>
            {enquiryChannels.status === 'available' ? (
              enquiryChannels.buckets.length > 0 ? <div className="home-acquisition-list">{enquiryChannels.buckets.slice(0, 8).map((bucket) => (
                <div className="home-acquisition-row" key={bucket.channelGroup}>
                  <span>{bucket.channelGroup}</span>
                  <div className="home-acquisition-track"><span style={{ width: `${Math.max(3, (bucket.count / acquisitionMax) * 100)}%` }} /></div>
                  <strong>{bucket.count.toLocaleString('en-GB')}</strong>
                </div>
              ))}</div> : <HomeEmptyState>0 website enquiries were recorded for this selection and period.</HomeEmptyState>
            ) : <HomeEmptyState>{enquiryChannels.subtitle}</HomeEmptyState>}
          </HomeSection>

          <HomeSection
            title="Performance trend"
            description="Website enquiries for the selected period against the previous comparable period."
            className="home-trend-section"
          >
            {ga4EnquiriesComparison && ga4EnquiriesComparison.previous !== null ? (
              <div className="home-trend-chart" role="img" aria-label={`Website enquiries: ${ga4EnquiriesComparison.current} current period and ${ga4EnquiriesComparison.previous} previous period`}>
                <div className="home-trend-summary">
                  <strong>{formatComparison(ga4EnquiriesComparison)}</strong>
                  <span>GA4 verified enquiry events</span>
                </div>
                <div className="home-trend-row"><span>Previous</span><div><i style={{ width: `${(ga4EnquiriesComparison.previous / enquiryTrendMax) * 100}%` }} /></div><strong>{ga4EnquiriesComparison.previous}</strong></div>
                <div className="home-trend-row" data-current="true"><span>Current</span><div><i style={{ width: `${(ga4EnquiriesComparison.current / enquiryTrendMax) * 100}%` }} /></div><strong>{ga4EnquiriesComparison.current}</strong></div>
              </div>
            ) : <HomeEmptyState>{ga4EnquiriesInfo.status === 'available' ? 'Previous-period comparison is not available for this selection.' : ga4EnquiriesInfo.subtitle}</HomeEmptyState>}
          </HomeSection>
        </div>

        <HomeSection title="Channel performance" description="A concise read of each major channel, with direct access to the specialist workspace.">
          <div className="home-channel-grid">
            <article className="home-channel-summary">
              <div><span className="home-channel-kicker">PPC</span><h3>Paid search</h3></div>
              <dl><div><dt>Spend</dt><dd>{googleAds.status === 'available' ? `£${Math.round(googleAds.spend!).toLocaleString()}` : 'Not connected'}</dd></div><div><dt>Clicks</dt><dd>{googleAds.status === 'available' ? googleAds.clicks!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>GA4 enquiries</dt><dd>{costPerGa4Enquiry.status === 'available' ? costPerGa4Enquiry.ga4Enquiries!.toLocaleString('en-GB') : 'Not available'}</dd></div><div><dt>Cost / enquiry</dt><dd>{costPerGa4Enquiry.status === 'available' && costPerGa4Enquiry.costPerEnquiry !== null ? `£${costPerGa4Enquiry.costPerEnquiry!.toLocaleString('en-GB')}` : 'Not available'}</dd></div></dl>
              <p className="home-channel-note">{formatComparison(googleAdsSpendComparison) ?? googleAds.subtitle}</p>
              <button type="button" onClick={() => onNavigate?.('ppc')}>View PPC <ArrowRight size={14} /></button>
            </article>
            <article className="home-channel-summary">
              <div><span className="home-channel-kicker">SEO / ORGANIC</span><h3>Organic search</h3></div>
              <dl><div><dt>Organic clicks</dt><dd>{searchConsole.status === 'available' ? searchConsole.clicks!.toLocaleString('en-GB') : 'Not connected'}</dd></div><div><dt>Impressions</dt><dd>{searchConsole.status === 'available' ? searchConsole.impressions!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>CTR</dt><dd>{searchConsole.status === 'available' && searchConsole.ctr !== null ? `${searchConsole.ctr}%` : 'Not available'}</dd></div><div><dt>Website users</dt><dd>{websiteUsers.status === 'available' ? websiteUsers.activeUsers!.toLocaleString('en-GB') : 'Not connected'}</dd></div></dl>
              <button type="button" onClick={() => onNavigate?.('website')}>View Website &amp; SEO <ArrowRight size={14} /></button>
            </article>
            <article className="home-channel-summary">
              <div><span className="home-channel-kicker">CALL TRACKING</span><h3>Calls</h3></div>
              <dl><div><dt>Total calls</dt><dd>{callPerformance.status === 'available' ? callPerformance.totalCalls!.toLocaleString('en-GB') : 'Not connected'}</dd></div><div><dt>Answered</dt><dd>{callPerformance.status === 'available' ? callPerformance.answeredCalls!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>Missed</dt><dd>{callPerformance.status === 'available' ? callPerformance.missedCalls!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>Average duration</dt><dd>{callPerformance.status === 'available' ? callPerformance.avgDuration : 'Not available'}</dd></div></dl>
              <button type="button" onClick={() => onNavigate?.('infinity')}>View Calls <ArrowRight size={14} /></button>
            </article>
            <article className="home-channel-summary">
              <div><span className="home-channel-kicker">EMAIL</span><h3>Email performance</h3></div>
              <dl><div><dt>Sends</dt><dd>{emailHeadline.status === 'available' ? emailHeadline.campaignsSent!.toLocaleString('en-GB') : 'Not connected'}</dd></div><div><dt>Recipients</dt><dd>{emailHeadline.status === 'available' ? emailHeadline.recipients!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>Clicks</dt><dd>{emailHeadline.status === 'available' ? emailHeadline.clicks!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>Click rate</dt><dd>{emailHeadline.status === 'available' && emailHeadline.clickRate !== null ? `${emailHeadline.clickRate}%` : 'Not available'}</dd></div></dl>
              <button type="button" onClick={() => onNavigate?.('email')}>View Email <ArrowRight size={14} /></button>
            </article>
            <article className="home-channel-summary home-channel-summary-wide">
              <div><span className="home-channel-kicker">SOCIAL</span><h3>Social website traffic</h3></div>
              <dl><div><dt>Sessions</dt><dd>{socialTraffic.status === 'available' ? socialTraffic.sessions!.toLocaleString('en-GB') : 'Not connected'}</dd></div><div><dt>Users</dt><dd>{socialTraffic.status === 'available' ? socialTraffic.users!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>Organic sessions</dt><dd>{socialTraffic.status === 'available' ? socialTraffic.organicSessions!.toLocaleString('en-GB') : '—'}</dd></div><div><dt>Paid sessions</dt><dd>{socialTraffic.status === 'available' ? socialTraffic.paidSessions!.toLocaleString('en-GB') : '—'}</dd></div></dl>
              <button type="button" onClick={() => onNavigate?.('social')}>View Social <ArrowRight size={14} /></button>
            </article>
          </div>
        </HomeSection>

        <HomeSection
          title="Marketing to commercial journey"
          description="Marketing response and manually logged leads are shown separately from overall Acumatica outcomes."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('leads')}>View CRM <ArrowRight size={14} /></button>}
        >
          <div className="home-journey">
            <div className="home-journey-stage"><span>Marketing response</span><strong>{ga4EnquiriesInfo.status === 'available' ? ga4EnquiriesInfo.total : 'Not connected'}</strong><small>{callPerformance.status === 'available' ? `Plus ${callPerformance.totalCalls} tracked calls` : 'Calls not connected'}</small></div>
            <ArrowRight aria-hidden="true" />
            <div className="home-journey-stage"><span>Marketing leads</span><strong>{marketingLeads}</strong><small>{MARKETING_LEADS_CAVEAT}</small></div>
            <div className="home-journey-boundary"><span>Overall CRM</span><small>Not attributed to marketing</small></div>
            <div className="home-journey-stage"><span>Opportunities</span><strong>{crmAvailable ? acumaticaSummary.opportunities : acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline}</strong><small>Latest Acumatica export</small></div>
            <ArrowRight aria-hidden="true" />
            <div className="home-journey-stage"><span>Open pipeline</span><strong>{crmAvailable ? `£${Math.round(acumaticaSummary.openPipelineValue).toLocaleString()}` : acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline}</strong><small>Status Open + Status New</small></div>
            <ArrowRight aria-hidden="true" />
            <div className="home-journey-stage"><span>Won revenue</span><strong>{crmAvailable ? `£${Math.round(acumaticaSummary.wonRevenue).toLocaleString()}` : acumaticaNotAvailable ? 'Not available' : acumaticaMissingHeadline}</strong><small>No trustworthy Won Date</small></div>
          </div>
        </HomeSection>

        <HomeSection
          title="Campaign performance"
          description="What is running, what it costs and which genuine response signals are linked."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('campaigns')}>View all campaigns <ArrowRight size={14} /></button>}
        >
          {activeCampaigns.length > 0 ? <div className="home-campaign-table-shell"><div className="home-campaign-table-wrap"><table className="home-campaign-table">
            <thead><tr><th>Campaign</th><th>Entity</th><th>Status</th><th>Spend</th><th>Response</th><th>Leads</th><th>Performance</th></tr></thead>
            <tbody>{activeCampaigns.slice(0, 6).map(({ campaign: c, progress, spendInfo, response, nextAction }) => (
              <tr key={c.id} role="button" tabIndex={0} onClick={() => selectCampaign(c.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCampaign(c.id); } }}>
                <td><strong>{c.name}</strong><small>{formatDateShort(c.startDate)} – {formatDateShort(c.endDate)}</small></td>
                <td><div className="home-entity-list">{getCampaignEntities(c).map((entity) => <span key={entity}>{BRAND_LABEL[entity]}</span>)}</div></td>
                <td><span className="home-status-pill" style={CAMPAIGN_STATUS_BADGE_STYLE[c.status]}>{CAMPAIGN_STATUS_LABEL[c.status]}</span>{progress.statusInconsistent && <small className="home-campaign-warning">Review status</small>}</td>
                <td>{spendInfo ? <><strong>£{Math.round(spendInfo.knownCampaignSpend).toLocaleString()}</strong>{spendInfo.isLegacyFallback && <small>{LEGACY_COST_LABEL}</small>}{spendInfo.mediaSpendStatus !== 'available' && <small>Media {spendInfo.mediaSpendStatus === 'unmapped' ? 'unmapped' : 'not connected'}</small>}</> : <span className="home-unavailable">Not available</span>}</td>
                <td>{response ? <button type="button" className="home-inline-link" onClick={(event) => { event.stopPropagation(); response.onClick?.(); }}>{response.label}</button> : <span className="home-unavailable">Not available</span>}</td>
                <td><strong>{(c.leads || 0).toLocaleString('en-GB')}</strong><small>Manually logged</small></td>
                <td><span className="home-performance-state" data-attention={Boolean(nextAction)}>{nextAction ?? (response ? 'Response recorded' : 'Not available')}</span></td>
              </tr>
            ))}</tbody>
          </table></div>{activeCampaigns.length > 6 && <div className="home-table-note">Showing 6 of {activeCampaigns.length} active campaigns.</div>}</div>
          : <HomeEmptyState>No active campaigns{isGroupView ? '' : ' for this entity'}.</HomeEmptyState>}
        </HomeSection>

        <HomeSection
          title="Plan and priorities"
          description="A compact view of the saved Marketing Plan. No objective or target is invented."
          action={<button type="button" className="home-text-action" onClick={() => onNavigate?.('marketing-plan')}>Open Marketing Plan <ArrowRight size={14} /></button>}
        >
          <div className="home-plan-layout">
            <section><div className="home-list-heading"><h3>Current quarter</h3>{marketingPlan && quarterFocus && <span>Q{quarterFocus.quarter} {marketingPlan.periodYear}</span>}</div>
              {marketingFocusLoading ? <HomeEmptyState>Loading the saved plan…</HomeEmptyState> : marketingFocusUnavailable ? <HomeEmptyState>Marketing Plan data is unavailable right now.</HomeEmptyState> : !marketingPlan ? <HomeEmptyState>No Marketing Plan has been created yet.</HomeEmptyState> : !quarterFocus?.rows.length ? <HomeEmptyState>No objectives are assigned for this entity.</HomeEmptyState> : <div className="home-focus-list">{quarterFocus.rows.slice(0, 4).map((row) => <button key={row.objective.id} type="button" onClick={() => onNavigate?.('marketing-plan')} className="home-focus-item"><Target size={16} /><span><strong>{row.objective.title}</strong><small>{row.priorities.length} priorit{row.priorities.length === 1 ? 'y' : 'ies'} · {row.campaignLinks.length} linked campaign{row.campaignLinks.length === 1 ? '' : 's'}</small></span></button>)}</div>}
            </section>
            <section><div className="home-list-heading"><h3>This week</h3></div>
              {marketingFocusLoading ? <HomeEmptyState>Loading the saved plan…</HomeEmptyState> : !marketingPlan ? <HomeEmptyState>Create the Marketing Plan to set this week’s focus.</HomeEmptyState> : !weekFocus?.items.length ? <HomeEmptyState>Nothing in the plan needs attention this week.</HomeEmptyState> : <div className="home-focus-list">{weekFocus.items.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => onNavigate?.('marketing-plan')} className="home-focus-item" data-overdue={item.overdue}><CalendarDays size={16} /><span><strong>{item.title}</strong><small>{item.kind} · {item.detail}</small></span></button>)}</div>}
            </section>
            <section><div className="home-list-heading"><h3>Plan attention</h3></div>
              {marketingFocusLoading ? <HomeEmptyState>Checking the saved plan…</HomeEmptyState> : !marketingPlan ? <HomeEmptyState>No saved plan is available to check.</HomeEmptyState> : !strategyAttention.length ? <div className="home-positive-state"><CheckCircle2 size={17} />No factual gaps found for this entity.</div> : <div className="home-focus-list">{strategyAttention.map((item) => <button key={item.id} type="button" onClick={() => onNavigate?.('marketing-plan')} className="home-focus-item" data-attention="true"><Flag size={16} /><span><strong>{item.title}</strong><small>{entityStrategy.find((row) => row.objective.id === item.objectiveId)?.objective.title} · {item.detail}</small></span></button>)}</div>}
            </section>
          </div>
        </HomeSection>

        <HomeSection title="Needs attention and coming up" description="Only genuine campaign, calendar, funding, data and plan items.">
          <div className="home-action-grid">
            <section className="home-action-section"><div className="home-list-heading"><h3>Needs attention</h3>{attentionTotal > 0 && <span>{attentionTotal} items</span>}</div>{attentionCategories.length > 0 ? <div className="home-action-list">{attentionCategories.map((category) => <button key={category.id} type="button" onClick={category.items[0]?.onClick} data-severity={category.severity}><AlertTriangle size={16} /><span><strong>{category.items.length} {category.label(category.items.length)}</strong>{category.items[0] && <small>{category.items[0].title} — {category.items[0].detail}</small>}</span><ArrowRight size={14} /></button>)}</div> : <div className="home-positive-state"><CheckCircle2 size={17} />Nothing urgent right now.</div>}</section>
            <section className="home-action-section"><div className="home-list-heading"><h3>Coming up</h3><span>Next {COMING_UP_DAYS} days</span></div>{comingUp.length > 0 ? <div className="home-action-list">{comingUp.map((item) => <button key={item.id} type="button" onClick={item.onClick}><CalendarDays size={16} /><span><strong>{item.title}</strong><small>{comingUpKindLabel[item.kind] ?? 'Event'} · {formatDateShort(item.due)}{item.context ? ` · ${item.context}` : ''}</small></span><ArrowRight size={14} /></button>)}</div> : <HomeEmptyState>Nothing scheduled in the next {COMING_UP_DAYS} days.</HomeEmptyState>}<button type="button" className="home-text-action home-panel-link" onClick={() => onNavigate?.('calendar')}>Open Calendar <ArrowRight size={14} /></button></section>
          </div>
        </HomeSection>
      </div>
    </div>
  );
}
