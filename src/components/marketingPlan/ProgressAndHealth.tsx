import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, CircleHelp, Gauge, HeartPulse } from 'lucide-react';
import type { Brand, Campaign } from '@/types';
import type { MarketingPlanActual, MarketingPlanProgressSources } from '@/utils/marketingPlanProgress';
import type { MarketingPlanKpiDefinition, MarketingPlanStrategyObjective } from '@/types/marketingPlan';
import { fetchGa4Enquiries, fetchGa4Traffic, type Ga4EnquiriesResponse, type Ga4TrafficResponse } from '@/services/ga4Api';
import { fetchGoogleAdsPerformance, type GoogleAdsResponse } from '@/services/googleAdsApi';
import { fetchInfinityCalls, type InfinityCallsResponse } from '@/services/infinityCallsApi';
import { fetchAcumaticaSummary, type AcumaticaSummary } from '@/services/acumaticaApi';
import { fetchCampaignCostsFromApi } from '@/services/campaignCostsApi';
import {
  compareMarketingPlanTarget, getStrategyHealthFindings, resolveMarketingPlanActual,
  resolveMarketingPlanEntityScope, resolveMarketingPlanPeriod,
} from '@/utils/marketingPlanProgress';
import { GA4_EARLIEST_SUPPORTED_DATE } from '@/utils/ga4Traffic';
import { BRAND_LABEL } from '@/utils/brandColors';

interface Props {
  mode: 'progress' | 'health';
  rows: MarketingPlanStrategyObjective[];
  registry: MarketingPlanKpiDefinition[];
  campaigns: Campaign[];
  onOpenObjective: (id: string) => void;
  onOpenKpi: (key: string) => void;
}

const ALL_TIME_SENTINEL = '2000-01-01';
const today = () => new Date().toISOString().slice(0, 10);

function formatNumber(value: number | null, unit: string | null | undefined) {
  if (value === null) return 'Unavailable';
  if (unit === 'gbp') return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
  if (unit === 'percent') return `${value}%`;
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value);
}

function scopeLabel(row: MarketingPlanStrategyObjective) {
  const scope = resolveMarketingPlanEntityScope(row.objective.entities);
  if (scope.status === 'unavailable') return row.objective.entities.length ? 'Custom entity scope' : 'Entities TBC';
  return scope.isGroupView ? 'MTech Group' : BRAND_LABEL[scope.selectedEntity as Brand];
}

async function loadActual(
  row: MarketingPlanStrategyObjective,
  kpiId: string,
  campaigns: Campaign[],
  cache: Map<string, Promise<unknown>>,
): Promise<MarketingPlanActual> {
  const kpi = row.kpis.find((item) => item.id === kpiId)!;
  const range = resolveMarketingPlanPeriod(row.objective, kpi);
  if (range.status === 'unavailable') return resolveMarketingPlanActual(kpi.kpiKey, row.objective, kpi, row.campaignLinks.map((link) => link.campaignId), campaigns, {});
  const scope = resolveMarketingPlanEntityScope(row.objective.entities);
  const get = <T,>(key: string, factory: () => Promise<T>) => {
    if (!cache.has(key)) cache.set(key, factory());
    return cache.get(key)! as Promise<T>;
  };
  const sources: MarketingPlanProgressSources = {};
  const currentStart = range.allTime ? ALL_TIME_SENTINEL : range.startDate!;
  const currentEnd = range.allTime ? today() : range.endDate!;
  const previousStart = range.previousStartDate;
  const previousEnd = range.previousEndDate;
  const key = kpi.kpiKey;

  if (key === 'website-users' || key === 'sessions') {
    sources.ga4Traffic = await get<Ga4TrafficResponse | null>(`ga4-traffic:${range.allTime ? GA4_EARLIEST_SUPPORTED_DATE : currentStart}:${currentEnd}`, () => fetchGa4Traffic(range.allTime ? GA4_EARLIEST_SUPPORTED_DATE : currentStart, currentEnd).catch(() => null));
    if (previousStart && previousEnd) sources.previousGa4Traffic = await get<Ga4TrafficResponse | null>(`ga4-traffic:${previousStart}:${previousEnd}`, () => fetchGa4Traffic(previousStart, previousEnd).catch(() => null));
  } else if (key === 'ga4-enquiries') {
    sources.ga4Enquiries = await get<Ga4EnquiriesResponse | null>(`ga4-enquiries:${range.allTime ? GA4_EARLIEST_SUPPORTED_DATE : currentStart}:${currentEnd}`, () => fetchGa4Enquiries(range.allTime ? GA4_EARLIEST_SUPPORTED_DATE : currentStart, currentEnd).catch(() => null));
    if (previousStart && previousEnd) sources.previousGa4Enquiries = await get<Ga4EnquiriesResponse | null>(`ga4-enquiries:${previousStart}:${previousEnd}`, () => fetchGa4Enquiries(previousStart, previousEnd).catch(() => null));
  } else if (key === 'google-ads-spend' || key === 'known-campaign-spend') {
    sources.googleAds = await get<GoogleAdsResponse | null>(`ads:${currentStart}:${currentEnd}`, () => fetchGoogleAdsPerformance(currentStart, currentEnd).catch(() => null));
    if (key === 'google-ads-spend' && previousStart && previousEnd) sources.previousGoogleAds = await get<GoogleAdsResponse | null>(`ads:${previousStart}:${previousEnd}`, () => fetchGoogleAdsPerformance(previousStart, previousEnd).catch(() => null));
    if (key === 'known-campaign-spend') sources.campaignCosts = await get(`campaign-costs`, () => fetchCampaignCostsFromApi().catch(() => null));
  } else if (key === 'total-calls') {
    sources.infinityCalls = await get<InfinityCallsResponse | null>(`calls:${currentStart}:${currentEnd}`, () => fetchInfinityCalls(currentStart, currentEnd).catch(() => null));
    if (previousStart && previousEnd) sources.previousInfinityCalls = await get<InfinityCallsResponse | null>(`calls:${previousStart}:${previousEnd}`, () => fetchInfinityCalls(previousStart, previousEnd).catch(() => null));
  } else if (['opportunities', 'won-deals', 'won-revenue', 'open-pipeline'].includes(key) && scope.status === 'available') {
    const brand = scope.isGroupView ? undefined : scope.selectedEntity as Brand;
    const brandKey = brand ?? 'group';
    sources.acumatica = await get<AcumaticaSummary | null>(`acumatica:${range.allTime ? 'all' : currentStart}:${range.allTime ? 'all' : currentEnd}:${brandKey}`, () => fetchAcumaticaSummary(range.allTime ? undefined : currentStart, range.allTime ? undefined : currentEnd, brand).catch(() => null));
    if (previousStart && previousEnd) sources.previousAcumatica = await get<AcumaticaSummary | null>(`acumatica:${previousStart}:${previousEnd}:${brandKey}`, () => fetchAcumaticaSummary(previousStart, previousEnd, brand).catch(() => null));
  }

  return resolveMarketingPlanActual(key, row.objective, kpi, row.campaignLinks.map((link) => link.campaignId), campaigns, sources);
}

function ProgressView({ rows, registry, campaigns, onOpenObjective, onOpenKpi, selectedId, setSelectedId, actuals, loading }: Props & { selectedId: string; setSelectedId: (id: string) => void; actuals: Record<string, MarketingPlanActual>; loading: boolean }) {
  const row = rows.find((item) => item.objective.id === selectedId) ?? rows[0];
  if (!row) return <section className="card p-8 text-center"><Gauge className="mx-auto text-violet-600"/><h2 className="mt-3 font-bold">No objectives to measure yet</h2></section>;
  return <div className="grid gap-4">
    <section className="card p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="v2-section-title">Strategy progress</p><p className="mt-1 text-sm text-text-secondary">Canonical actuals for one objective at a time, using its saved period and entity scope.</p></div><label className="grid min-w-[260px] gap-1 text-xs font-semibold text-text-secondary"><span>Objective</span><select className="input" value={row.objective.id} onChange={(event) => setSelectedId(event.target.value)}>{rows.map((item) => <option key={item.objective.id} value={item.objective.id}>{item.objective.title}</option>)}</select></label></div>
      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">{scopeLabel(row)}</span><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">{row.objective.quarter ? `Q${row.objective.quarter} ${row.objective.periodYear}` : `${row.objective.periodYear}`}</span><button className="text-xs font-bold text-violet-700 hover:underline" onClick={() => onOpenObjective(row.objective.id)}>Open objective</button></div>
    </section>
    {!row.kpis.length ? <section className="card p-8 text-center"><CircleHelp className="mx-auto text-amber-600"/><h2 className="mt-3 font-bold">No KPIs linked</h2><p className="mt-1 text-sm text-text-secondary">Link an approved KPI in the objective workspace.</p></section> : <div className="grid gap-4 xl:grid-cols-2">{row.kpis.map((kpi) => {
      const definition = registry.find((item) => item.key === kpi.kpiKey);
      const actual = actuals[kpi.id];
      const targetStatus = actual ? compareMarketingPlanTarget(actual, kpi) : 'unavailable';
      const period = resolveMarketingPlanPeriod(row.objective, kpi);
      const trend = actual?.value !== null && actual?.previousValue !== null && actual?.previousValue !== undefined ? actual.value - actual.previousValue : null;
      const statusStyles = targetStatus === 'meets' ? 'bg-emerald-100 text-emerald-800' : targetStatus === 'below' || targetStatus === 'above' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
      return <section key={kpi.id} className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"><div className="h-1.5 bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500"/><div className="p-5"><div className="flex items-start justify-between gap-3"><div><button className="text-left text-base font-bold text-text-primary hover:text-violet-700" onClick={() => onOpenKpi(kpi.kpiKey)}>{definition?.label ?? kpi.kpiKey}</button><p className="mt-1 text-xs text-text-secondary">{period.label} · {definition?.source ?? 'Source unavailable'}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles}`}>{targetStatus === 'meets' ? 'Meets target' : targetStatus === 'below' ? 'Below target' : targetStatus === 'above' ? 'Above target' : targetStatus === 'tbc' ? 'Target TBC' : 'Unavailable'}</span></div>
        <div className="mt-5 grid grid-cols-3 gap-3"><div><p className="text-xs font-semibold text-text-secondary">Target</p><p className="mt-1 text-xl font-bold text-text-primary">{kpi.targetStatus === 'approved' ? formatNumber(kpi.targetValue, kpi.targetUnit) : 'TBC'}</p></div><div><p className="text-xs font-semibold text-text-secondary">Actual</p><p className="mt-1 text-xl font-bold text-violet-800">{loading && !actual ? 'Loading…' : formatNumber(actual?.value ?? null, kpi.targetUnit)}</p></div><div><p className="text-xs font-semibold text-text-secondary">Trend</p><div className="mt-1 flex items-center gap-1 text-sm font-bold text-text-primary">{trend === null ? <><ArrowRight size={16}/>Not available</> : trend > 0 ? <><ArrowUpRight size={16} className="text-emerald-600"/>+{formatNumber(trend, kpi.targetUnit)}</> : trend < 0 ? <><ArrowDownRight size={16} className="text-amber-600"/>{formatNumber(trend, kpi.targetUnit)}</> : <><ArrowRight size={16}/>No change</>}</div></div></div>
        <p className={`mt-4 rounded-lg p-3 text-xs ${actual?.availability === 'unavailable' ? 'bg-amber-50 text-amber-800' : actual?.availability === 'partial' ? 'bg-blue-50 text-blue-800' : 'bg-slate-50 text-text-secondary'}`}>{actual?.subtitle ?? 'Resolving canonical source…'}</p>
      </div></section>;
    })}</div>}
  </div>;
}

function HealthView({ rows, onOpenObjective, findings }: Props & { findings: ReturnType<typeof getStrategyHealthFindings> }) {
  const attention = findings.filter((item) => item.severity === 'attention').length;
  const tbc = findings.filter((item) => item.severity === 'tbc').length;
  return <div className="grid gap-4"><section className="rounded-2xl bg-gradient-to-r from-fuchsia-700 via-violet-700 to-indigo-700 p-6 text-white"><div className="flex items-center gap-3"><HeartPulse/><div><p className="text-xs font-bold uppercase tracking-wider text-violet-100">Strategy health</p><h2 className="mt-1 text-xl font-bold">Factual gaps and overdue items</h2></div></div><p className="mt-3 max-w-3xl text-sm text-violet-100">No score is invented. Each finding comes from a missing field, relationship, source or saved date and opens the affected objective.</p><div className="mt-5 flex gap-3"><span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">{attention} need attention</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">{tbc} TBC</span></div></section>
    {!findings.length ? <section className="card p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-600"/><h2 className="mt-3 font-bold">No factual gaps found</h2><p className="mt-1 text-sm text-text-secondary">This checks completeness and dates. It is not a subjective strategy score.</p></section> : <div className="grid gap-3">{findings.map((finding) => { const row = rows.find((item) => item.objective.id === finding.objectiveId); return <button key={finding.id} onClick={() => onOpenObjective(finding.objectiveId)} className={`flex items-start gap-3 rounded-xl border p-4 text-left shadow-sm hover:-translate-y-0.5 ${finding.severity === 'attention' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}><div className={`rounded-lg p-2 ${finding.severity === 'attention' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}><AlertTriangle size={18}/></div><div><strong className="text-sm text-text-primary">{finding.title}</strong><p className="mt-1 text-xs text-text-secondary">{row?.objective.title} · {finding.detail}</p></div></button>; })}</div>}
  </div>;
}

export function ProgressAndHealth(props: Props) {
  const [selectedId, setSelectedId] = useState(props.rows[0]?.objective.id ?? '');
  const [actuals, setActuals] = useState<Record<string, MarketingPlanActual>>({});
  const [loading, setLoading] = useState(false);
  const selected = props.rows.find((row) => row.objective.id === selectedId) ?? props.rows[0];
  useEffect(() => { if (!props.rows.some((row) => row.objective.id === selectedId)) setSelectedId(props.rows[0]?.objective.id ?? ''); }, [props.rows, selectedId]);
  useEffect(() => {
    if (!selected && props.mode === 'progress') { setActuals({}); return; }
    let cancelled = false;
    setLoading(true); setActuals({});
    const cache = new Map<string, Promise<unknown>>();
    const rowsToResolve = props.mode === 'health' ? props.rows : selected ? [selected] : [];
    Promise.all(rowsToResolve.flatMap((row) => row.kpis.map(async (kpi) => [kpi.id, await loadActual(row, kpi.id, props.campaigns, cache)] as const)))
      .then((entries) => { if (!cancelled) setActuals(Object.fromEntries(entries)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selected, props.campaigns, props.mode, props.rows]);
  const findings = useMemo(() => getStrategyHealthFindings(props.rows, selected ? actuals : {}), [props.rows, selected, actuals]);
  if (props.mode === 'health') return <HealthView {...props} findings={findings}/>;
  return <ProgressView {...props} selectedId={selected?.objective.id ?? ''} setSelectedId={setSelectedId} actuals={actuals} loading={loading}/>;
}
