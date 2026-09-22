import { useEffect, useMemo, useState } from 'react';
import { Archive, BookOpen, Plus, Save } from 'lucide-react';
import type { Campaign } from '@/types';
import type { MarketingPlanActual } from '@/utils/marketingPlanProgress';
import type { MarketingPlan, MarketingPlanKpiDefinition, MarketingPlanReview, MarketingPlanStrategyObjective } from '@/types/marketingPlan';
import { archiveMarketingReview, createMarketingReview, fetchMarketingReviews, replaceMarketingReviewEvidence, updateMarketingReview } from '@/services/marketingPlanApi';
import { loadMarketingPlanActual } from '@/components/marketingPlan/ProgressAndHealth';
import { resolveMarketingPlanPeriod } from '@/utils/marketingPlanProgress';

interface Props {
  plan: MarketingPlan;
  rows: MarketingPlanStrategyObjective[];
  registry: MarketingPlanKpiDefinition[];
  campaigns: Campaign[];
  isEditor: boolean;
  onOpenObjective: (id: string) => void;
}

const REVIEW_FIELDS: Array<[keyof MarketingPlanReview, string, string]> = [
  ['whatHappened', 'What happened?', 'Relevant performance and delivery evidence.'],
  ['whatChanged', 'What changed?', 'Important movement since the previous review.'],
  ['whyItMatters', 'Why does it matter?', 'Your strategic interpretation.'],
  ['worked', 'What worked?', 'Your assessment of effective activity.'],
  ['didNotWork', 'What did not work?', 'Your assessment of activity that underperformed.'],
  ['learned', 'What did we learn?', 'Learning to carry forward.'],
  ['changesNext', 'What changes next?', 'Decisions affecting the next planning period.'],
];

function label(value: string) { return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatValue(value: number | null, unit: string | null) {
  if (value === null) return 'Unavailable';
  return unit === 'gbp' ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value) : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value);
}

function blankReview(plan: MarketingPlan): MarketingPlanReview {
  return {
    id: '', planId: plan.id, objectiveId: null, reviewType: 'quarterly', periodYear: plan.periodYear,
    quarter: null, month: null, status: 'draft', reviewDate: new Date().toISOString().slice(0, 10),
    whatHappened: '', whatChanged: '', whyItMatters: '', worked: '', didNotWork: '', learned: '', changesNext: '',
    createdAt: '', updatedAt: '', archived: false, archivedAt: null, evidence: [],
  };
}

export function StrategyReviewsView({ plan, rows, registry, campaigns, isEditor, onOpenObjective }: Props) {
  const [reviews, setReviews] = useState<MarketingPlanReview[]>([]);
  const [selected, setSelected] = useState<MarketingPlanReview | null>(null);
  const [actuals, setActuals] = useState<Record<string, MarketingPlanActual>>({});
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const loadReviews = () => fetchMarketingReviews(plan.id).then((items) => { setReviews(items); setSelected((current) => items.find((item) => item.id === current?.id) ?? items[0] ?? null); });
  useEffect(() => { loadReviews().catch(() => setError('Could not load strategy reviews.')); }, [plan.id]);
  const scopedRows = useMemo(() => selected?.objectiveId ? rows.filter((row) => row.objective.id === selected.objectiveId) : rows, [rows, selected?.objectiveId]);

  useEffect(() => {
    if (!selected) { setActuals({}); return; }
    let cancelled = false;
    setLoadingEvidence(true); setActuals({});
    const cache = new Map<string, Promise<unknown>>();
    Promise.all(scopedRows.flatMap((row) => row.kpis.map(async (kpi) => [kpi.id, await loadMarketingPlanActual(row, kpi.id, campaigns, cache)] as const)))
      .then((entries) => { if (!cancelled) setActuals(Object.fromEntries(entries)); })
      .finally(() => { if (!cancelled) setLoadingEvidence(false); });
    return () => { cancelled = true; };
  }, [selected?.id, selected?.objectiveId, scopedRows, campaigns]);

  const patch = (changes: Partial<MarketingPlanReview>) => setSelected((current) => current ? { ...current, ...changes } : current);
  const save = async () => {
    if (!selected || loadingEvidence) return;
    setSaving(true); setError('');
    try {
      const payload = {
        objectiveId: selected.objectiveId, reviewType: selected.reviewType, periodYear: selected.periodYear,
        quarter: selected.quarter, month: selected.month, status: selected.status, reviewDate: selected.reviewDate,
        whatHappened: selected.whatHappened, whatChanged: selected.whatChanged, whyItMatters: selected.whyItMatters,
        worked: selected.worked, didNotWork: selected.didNotWork, learned: selected.learned, changesNext: selected.changesNext,
      };
      const saved = selected.id ? await updateMarketingReview(selected.id, payload) : await createMarketingReview({ planId: plan.id, ...payload });
      const evidence = scopedRows.flatMap((row) => row.kpis.map((kpi) => {
        const actual = actuals[kpi.id] ?? { availability: 'unavailable', value: null, previousValue: null, subtitle: 'Data unavailable during capture.' } as MarketingPlanActual;
        const definition = registry.find((item) => item.key === kpi.kpiKey);
        const period = resolveMarketingPlanPeriod(row.objective, kpi);
        const trend = actual.value !== null && actual.previousValue !== null ? actual.value - actual.previousValue : null;
        return {
          objectiveKpiId: kpi.id, kpiKey: kpi.kpiKey, targetValue: kpi.targetValue, targetUnit: kpi.targetUnit,
          actualValue: actual.value, actualDisplay: actual.value === null ? null : formatValue(actual.value, kpi.targetUnit),
          dataStatus: actual.availability, trendDisplay: trend === null ? null : `${trend > 0 ? '+' : ''}${formatValue(trend, kpi.targetUnit)}`,
          sourceLabel: definition?.source ?? 'Unavailable', measurementStart: period.startDate ?? null,
          measurementEnd: period.endDate ?? null, measurementPeriod: period.label,
        };
      }));
      await replaceMarketingReviewEvidence(saved.id, evidence);
      await loadReviews();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The review could not be saved.'); }
    finally { setSaving(false); }
  };

  return <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
    <aside className="card h-fit p-3"><div className="flex items-center justify-between gap-2 px-2 pt-2"><p className="v2-section-title">Reviews</p>{isEditor && <button className="rounded-lg bg-violet-100 p-2 text-violet-700" title="New review" onClick={() => setSelected(blankReview(plan))}><Plus size={16}/></button>}</div>{reviews.length ? <div className="mt-3 grid gap-1">{reviews.map((review) => <button key={review.id} className={`rounded-lg p-3 text-left ${selected?.id === review.id ? 'bg-violet-100 text-violet-900' : 'hover:bg-slate-50'}`} onClick={() => setSelected(review)}><strong className="block text-sm">{label(review.reviewType)} review</strong><span className="text-xs opacity-70">{new Date(`${review.reviewDate}T00:00:00`).toLocaleDateString('en-GB')} · {label(review.status)}</span></button>)}</div> : <p className="p-3 text-sm text-text-secondary">No strategy reviews saved yet.</p>}</aside>
    {!selected ? <section className="card p-8 text-center"><BookOpen className="mx-auto text-violet-600"/><h2 className="mt-3 font-bold">No review selected</h2><p className="mt-1 text-sm text-text-secondary">Create a review when there is real performance and learning to record.</p></section> : <main className="grid gap-5">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <section className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="v2-section-title">Strategy review</p><h2 className="mt-1 text-xl font-bold text-text-primary">{selected.id ? `${label(selected.reviewType)} review` : 'New strategy review'}</h2></div>{isEditor && <div className="flex gap-2"><button className="btn btn-primary flex items-center gap-2" disabled={saving || loadingEvidence} onClick={save}><Save size={15}/>{loadingEvidence ? 'Checking evidence…' : 'Save review'}</button>{selected.id && <button className="btn btn-secondary" title="Archive review" onClick={() => { if (window.confirm('Archive this strategy review?')) archiveMarketingReview(selected.id).then(loadReviews); }}><Archive size={15}/></button>}</div>}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Scope</span><select className="input" disabled={!isEditor} value={selected.objectiveId ?? ''} onChange={(event) => patch({ objectiveId: event.target.value || null })}><option value="">Whole plan</option>{rows.map((row) => <option key={row.objective.id} value={row.objective.id}>{row.objective.title}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Type</span><select className="input" disabled={!isEditor} value={selected.reviewType} onChange={(event) => patch({ reviewType: event.target.value as MarketingPlanReview['reviewType'] })}>{['quarterly','monthly','annual','ad-hoc'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Review date</span><input className="input" type="date" disabled={!isEditor} value={selected.reviewDate} onChange={(event) => patch({ reviewDate: event.target.value })}/></label><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Year</span><input className="input" type="number" min="2000" max="2200" disabled={!isEditor} value={selected.periodYear} onChange={(event) => patch({ periodYear: Number(event.target.value) })}/></label><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Quarter</span><select className="input" disabled={!isEditor} value={selected.quarter ?? ''} onChange={(event) => patch({ quarter: event.target.value ? Number(event.target.value) : null })}><option value="">TBC</option>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Month</span><select className="input" disabled={!isEditor} value={selected.month ?? ''} onChange={(event) => patch({ month: event.target.value ? Number(event.target.value) : null })}><option value="">TBC</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index).toLocaleDateString('en-GB', { month: 'long' })}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Status</span><select className="input" disabled={!isEditor} value={selected.status} onChange={(event) => patch({ status: event.target.value as MarketingPlanReview['status'] })}>{['draft','proposed','approved','complete','needs-confirmation'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label></div>
      </section>
      <section className="card p-5"><p className="v2-section-title">Evidence at this review</p><p className="mt-1 text-sm text-text-secondary">Live canonical evidence is shown while editing. Saving the review captures exactly what was available at that moment.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{scopedRows.flatMap((row) => row.kpis.map((kpi) => { const actual = actuals[kpi.id]; const definition = registry.find((item) => item.key === kpi.kpiKey); return <button key={kpi.id} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-left" onClick={() => onOpenObjective(row.objective.id)}><span className="text-xs font-semibold text-indigo-700">{row.objective.title}</span><div className="mt-1 flex justify-between gap-3"><strong>{definition?.label ?? kpi.kpiKey}</strong><strong className="text-violet-800">{loadingEvidence && !actual ? 'Loading…' : formatValue(actual?.value ?? null, kpi.targetUnit)}</strong></div><p className="mt-2 text-xs text-text-secondary">{actual?.subtitle ?? 'Checking canonical source…'}</p></button>; }))}{!scopedRows.some((row) => row.kpis.length) && <p className="text-sm text-text-secondary">No KPIs are linked in this review scope.</p>}</div></section>
      <section className="card p-5"><div className="grid gap-4">{REVIEW_FIELDS.map(([key, title, hint]) => <label key={key} className="grid gap-1"><span className="text-sm font-bold text-text-primary">{title}</span><span className="text-xs text-text-secondary">{hint}</span><textarea className="input min-h-28" disabled={!isEditor} value={selected[key] as string} onChange={(event) => patch({ [key]: event.target.value })} placeholder="Not added yet"/></label>)}</div></section>
    </main>}
  </div>;
}
