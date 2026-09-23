import { useCallback, useEffect, useState } from 'react';
import { Archive, ArrowDown, ArrowUp, Map, Plus, Save, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_LABEL } from '@/utils/brandColors';
import type { Brand } from '@/types/index';
import type { MarketingPlan, MarketingPlanCampaignLink, MarketingPlanKpi, MarketingPlanKpiDefinition, MarketingPlanMilestone, MarketingPlanObjective, MarketingPlanPriority, MarketingPlanStrategyObjective } from '@/types/marketingPlan';
import { useAppStore } from '@/store/useAppStore';
import { StrategyViews, type MarketingPlanView } from '@/components/marketingPlan/StrategyViews';
import { ProgressAndHealth } from '@/components/marketingPlan/ProgressAndHealth';
import { StrategyReviewsView } from '@/components/marketingPlan/StrategyReviewsView';
import {
  archiveMarketingMilestone, archiveMarketingObjective, archiveMarketingPriority,
  createMarketingCampaignLink, createMarketingKpi, deleteMarketingCampaignLink, deleteMarketingKpi,
  createMarketingMilestone, createMarketingObjective, createMarketingPlan, createMarketingPriority,
  fetchMarketingCampaignLinks, fetchMarketingKpiRegistry, fetchMarketingKpis,
  fetchMarketingMilestones, fetchMarketingObjectives, fetchMarketingPlans, fetchMarketingPriorities, fetchMarketingStrategy,
  fetchMarketingObjectiveHistory,
  reorderMarketingPriorities, updateMarketingKpi, updateMarketingMilestone, updateMarketingObjective, updateMarketingPlan, updateMarketingPriority,
} from '@/services/marketingPlanApi';
import type { MarketingPlanHistoryEntry } from '@/services/marketingPlanApi';
import { selectMarketingPlanForCurrentPeriod } from '@/utils/marketingPlanFocus';

const BRANDS = Object.keys(BRAND_LABEL) as Brand[];
const STATUSES = ['draft', 'proposed', 'approved', 'complete', 'tbc', 'needs-confirmation'] as const;
const MILESTONE_LEVELS = [
  ['quarterly-outcome', 'Quarterly outcome'],
  ['monthly-milestone', 'Monthly milestone'],
  ['current-focus', 'Current focus'],
] as const;
const ATTENTION_TYPES = ['decision-required', 'review-required', 'approval-required', 'missing-information'] as const;
const MARKETING_PLAN_VIEWS = [
  ['strategy-map', 'Strategy Map'], ['quarter', 'Quarter'], ['month', 'Month'], ['week', 'This Week'],
  ['progress', 'Progress'], ['health', 'Strategy Health'], ['reviews', 'Reviews'], ['objectives', 'Objectives'],
] as const;

function label(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Field({ label: fieldLabel, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>{fieldLabel}</span>{children}</label>;
}

export function MarketingPlanScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const { isEditor } = useAuth();
  const campaigns = useAppStore((state) => state.campaigns);
  const selectCampaign = useAppStore((state) => state.selectCampaign);
  const [plan, setPlan] = useState<MarketingPlan | null>(null);
  const [objectives, setObjectives] = useState<MarketingPlanObjective[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<MarketingPlanPriority[]>([]);
  const [milestones, setMilestones] = useState<MarketingPlanMilestone[]>([]);
  const [history, setHistory] = useState<MarketingPlanHistoryEntry[]>([]);
  const [campaignLinks, setCampaignLinks] = useState<MarketingPlanCampaignLink[]>([]);
  const [kpis, setKpis] = useState<MarketingPlanKpi[]>([]);
  const [kpiRegistry, setKpiRegistry] = useState<MarketingPlanKpiDefinition[]>([]);
  const [strategyRows, setStrategyRows] = useState<MarketingPlanStrategyObjective[]>([]);
  const [activeView, setActiveView] = useState<MarketingPlanView>('strategy-map');
  const [loading, setLoading] = useState(true);
  const [planLoadFailed, setPlanLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneLevel, setNewMilestoneLevel] = useState<MarketingPlanMilestone['level']>('quarterly-outcome');
  const [newMilestoneMonth, setNewMilestoneMonth] = useState<number | null>(null);
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [newMilestoneAttention, setNewMilestoneAttention] = useState<MarketingPlanMilestone['attentionType']>(null);
  const [campaignToLink, setCampaignToLink] = useState('');
  const [kpiToLink, setKpiToLink] = useState('');

  const selected = objectives.find((objective) => objective.id === selectedId) ?? null;

  const loadParts = useCallback(async (objectiveId: string) => {
    const [nextPriorities, nextMilestones, nextHistory, nextCampaignLinks, nextKpis] = await Promise.all([
      fetchMarketingPriorities(objectiveId), fetchMarketingMilestones(objectiveId), fetchMarketingObjectiveHistory(objectiveId),
      fetchMarketingCampaignLinks(objectiveId), fetchMarketingKpis(objectiveId),
    ]);
    setPriorities(nextPriorities);
    setMilestones(nextMilestones);
    setHistory(nextHistory);
    setCampaignLinks(nextCampaignLinks);
    setKpis(nextKpis);
  }, []);

  const loadObjectives = useCallback(async (activePlan: MarketingPlan) => {
    const [next, nextStrategy] = await Promise.all([fetchMarketingObjectives(activePlan.id), fetchMarketingStrategy(activePlan.id)]);
    setObjectives(next);
    setStrategyRows(nextStrategy);
    setSelectedId((current) => next.some((objective) => objective.id === current) ? current : next[0]?.id ?? null);
  }, []);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setPlanLoadFailed(false);
    try {
      const next = await fetchMarketingPlans();
      const active = selectMarketingPlanForCurrentPeriod(next);
      setPlan(active);
      if (active) await loadObjectives(active);
      else { setObjectives([]); setStrategyRows([]); setSelectedId(null); }
    } catch {
      setPlan(null);
      setObjectives([]);
      setStrategyRows([]);
      setSelectedId(null);
      setPlanLoadFailed(true);
      setError('Could not load the Marketing Plan.');
    } finally {
      setLoading(false);
    }
  }, [loadObjectives]);

  useEffect(() => {
    fetchMarketingKpiRegistry().then(setKpiRegistry).catch(() => setError('Could not load the approved KPI catalogue.'));
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (!selectedId) { setPriorities([]); setMilestones([]); return; }
    loadParts(selectedId).catch(() => setError('Could not load the objective workspace.'));
  }, [selectedId, loadParts]);

  useEffect(() => {
    if (!plan || activeView === 'objectives') return;
    fetchMarketingStrategy(plan.id).then(setStrategyRows).catch(() => setError('Could not refresh the strategy view.'));
  }, [activeView, plan?.id]);

  const run = async (operation: () => Promise<void>) => {
    setSaving(true); setError('');
    try { await operation(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'The change could not be saved.'); }
    finally { setSaving(false); }
  };

  const submitPlan = () => run(async () => {
    const created = await createMarketingPlan({ title: newTitle, periodYear: newYear, status: 'draft' });
    setPlan(created); setShowPlanForm(false); setNewTitle('');
  });

  const savePlan = () => plan && run(async () => {
    const updated = await updateMarketingPlan(plan.id, {
      title: plan.title, periodYear: plan.periodYear, businessDirection: plan.businessDirection,
      status: plan.status, nextReviewDate: plan.nextReviewDate, notes: plan.notes,
    });
    setPlan(updated);
  });

  const submitObjective = () => plan && run(async () => {
    const created = await createMarketingObjective({ planId: plan.id, title: newTitle, periodYear: newYear, priority: 'tbc', entities: [] });
    setObjectives((current) => [...current, created]); setSelectedId(created.id); setShowObjectiveForm(false); setNewTitle('');
  });

  const saveObjective = () => selected && run(async () => {
    const updated = await updateMarketingObjective(selected.id, {
      title: selected.title, description: selected.description, status: selected.status, priority: selected.priority,
      periodYear: selected.periodYear, quarter: selected.quarter, entities: selected.entities,
      whyItMatters: selected.whyItMatters, customerMarketContext: selected.customerMarketContext,
      commercialRelevance: selected.commercialRelevance, marketingRationale: selected.marketingRationale,
      nextReviewDate: selected.nextReviewDate, notes: selected.notes,
    });
    setObjectives((current) => current.map((item) => item.id === updated.id ? updated : item));
    await loadParts(selected.id);
  });

  const patchSelected = (changes: Partial<MarketingPlanObjective>) => setObjectives((current) => current.map((item) => item.id === selectedId ? { ...item, ...changes } : item));
  const patchPriority = (id: string, changes: Partial<MarketingPlanPriority>) => setPriorities((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  const patchMilestone = (id: string, changes: Partial<MarketingPlanMilestone>) => setMilestones((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  const movePriority = (index: number, direction: -1 | 1) => selected && run(async () => {
    const reordered = [...priorities];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    await reorderMarketingPriorities(selected.id, reordered.map((item) => item.id));
    await loadParts(selected.id);
  });
  const openObjective = (id: string) => { setSelectedId(id); setActiveView('objectives'); };
  const openKpi = (key: string) => {
    const destination = kpiRegistry.find((item) => item.key === key)?.destination;
    if (destination) onNavigate?.(destination);
  };

  const moveViewFocus = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % MARKETING_PLAN_VIEWS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + MARKETING_PLAN_VIEWS.length) % MARKETING_PLAN_VIEWS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = MARKETING_PLAN_VIEWS.length - 1;
    else return;
    event.preventDefault();
    const view = MARKETING_PLAN_VIEWS[nextIndex][0];
    setActiveView(view);
    requestAnimationFrame(() => document.getElementById(`marketing-plan-tab-${view}`)?.focus());
  };

  if (loading) return <div className="v2-page"><p className="text-text-secondary">Loading Marketing Plan…</p></div>;

  return <div className="v2-page">
    <div className="v2-page-header">
      <div><p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-1">Strategy and delivery</p><h1 className="text-2xl font-bold text-text-primary">Marketing Plan</h1><p className="text-sm text-text-secondary mt-1">Connect business direction to objectives, meaningful milestones and measurable marketing activity.</p></div>
      {plan && isEditor && <button className="btn btn-primary flex items-center gap-2" onClick={() => { setActiveView('objectives'); setShowObjectiveForm(true); }}><Plus size={16}/> Add objective</button>}
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>}

    {!plan && planLoadFailed ? <section className="card p-8 max-w-2xl" aria-labelledby="marketing-plan-unavailable-title">
      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4"><Target size={24}/></div>
      <h2 id="marketing-plan-unavailable-title" className="text-xl font-bold text-text-primary">Marketing Plan unavailable</h2>
      <p className="text-sm text-text-secondary mt-2 max-w-xl">The saved plan could not be loaded. This is different from having no plan and no values have been replaced with empty records.</p>
      <button className="btn btn-secondary mt-5" onClick={() => { setError(''); void loadPlan(); }}>Try again</button>
    </section> : !plan ? <section className="card p-8 max-w-2xl">
      <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4"><Target size={24}/></div>
      <h2 className="text-xl font-bold text-text-primary">No marketing plan created yet</h2>
      <p className="text-sm text-text-secondary mt-2 max-w-xl">Create the plan shell when the planning period is known. No objectives, targets or performance will be filled in automatically.</p>
      {isEditor && !showPlanForm && <button className="btn btn-primary mt-5" onClick={() => { setShowPlanForm(true); setNewTitle(''); }}>Create marketing plan</button>}
      {showPlanForm && <div className="grid gap-3 mt-5 max-w-md"><Field label="Plan title"><input className="input" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. MTech Marketing Plan"/></Field><Field label="Planning year"><input className="input" type="number" min="2000" max="2200" value={newYear} onChange={(event) => setNewYear(Number(event.target.value))}/></Field><div className="flex gap-2"><button className="btn btn-primary" disabled={saving || !newTitle.trim()} onClick={submitPlan}>Create plan</button><button className="btn btn-secondary" onClick={() => setShowPlanForm(false)}>Cancel</button></div></div>}
    </section> : <>
      <section className="card p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="grid gap-3 flex-1 min-w-[260px]"><div className="grid sm:grid-cols-[1fr_120px_180px] gap-3"><Field label="Plan title"><input className="input" disabled={!isEditor} value={plan.title} onChange={(event) => setPlan({ ...plan, title: event.target.value })}/></Field><Field label="Year"><input className="input" type="number" disabled={!isEditor} value={plan.periodYear} onChange={(event) => setPlan({ ...plan, periodYear: Number(event.target.value) })}/></Field><Field label="Status"><select className="input" disabled={!isEditor} value={plan.status} onChange={(event) => setPlan({ ...plan, status: event.target.value as MarketingPlan['status'] })}>{STATUSES.filter((status) => status !== 'tbc').map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field></div><Field label="Business direction"><textarea className="input min-h-24" disabled={!isEditor} value={plan.businessDirection} onChange={(event) => setPlan({ ...plan, businessDirection: event.target.value })} placeholder="Not added yet"/></Field></div>{isEditor && <button className="btn btn-secondary flex items-center gap-2" disabled={saving} onClick={savePlan}><Save size={15}/> Save plan</button>}</div>
      </section>

      <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border bg-white p-1.5" role="tablist" aria-label="Marketing Plan views">{MARKETING_PLAN_VIEWS.map(([value, text], index) => <button key={value} id={`marketing-plan-tab-${value}`} role="tab" aria-selected={activeView === value} aria-controls={`marketing-plan-panel-${value}`} tabIndex={activeView === value ? 0 : -1} className={`flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${activeView === value ? 'bg-violet-700 text-white shadow-sm' : 'text-text-secondary hover:bg-violet-50 hover:text-violet-800'}`} onKeyDown={(event) => moveViewFocus(event, index)} onClick={() => setActiveView(value)}>{value === 'strategy-map' && <Map size={15} aria-hidden="true"/>} {text}</button>)}</nav>

      <section role="tabpanel" id={`marketing-plan-panel-${activeView}`} aria-labelledby={`marketing-plan-tab-${activeView}`} tabIndex={0}>{activeView === 'objectives' ? <>
        {showObjectiveForm && <section className="card p-5 mb-5 border border-violet-200"><h2 className="font-bold text-text-primary">New marketing objective</h2><div className="grid sm:grid-cols-[1fr_130px_auto] gap-3 items-end mt-3"><Field label="Objective title"><input className="input" value={newTitle} onChange={(event) => setNewTitle(event.target.value)}/></Field><Field label="Year"><input className="input" type="number" value={newYear} onChange={(event) => setNewYear(Number(event.target.value))}/></Field><div className="flex gap-2"><button className="btn btn-primary" disabled={saving || !newTitle.trim()} onClick={submitObjective}>Create</button><button className="btn btn-secondary" onClick={() => setShowObjectiveForm(false)}>Cancel</button></div></div></section>}

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
        <aside className="card p-3 h-fit"><p className="v2-section-title px-2 pt-2">Objectives</p>{objectives.length === 0 ? <div className="p-4 rounded-lg bg-violet-50"><strong className="text-sm text-text-primary">No marketing objectives added yet.</strong><p className="text-xs text-text-secondary mt-1">Create the first objective when the marketing strategy is ready to be entered.</p></div> : <div className="grid gap-1">{objectives.map((objective) => <button key={objective.id} className={`text-left rounded-lg p-3 ${objective.id === selectedId ? 'bg-violet-100 text-violet-900' : 'hover:bg-grey-50 text-text-primary'}`} onClick={() => setSelectedId(objective.id)}><strong className="block text-sm">{objective.title}</strong><span className="text-xs opacity-70">{label(objective.status)} · {objective.periodYear}{objective.quarter ? ` Q${objective.quarter}` : ''}</span></button>)}</div>}</aside>

        {selected && <main className="grid gap-5">
          <section className="card p-5"><div className="flex justify-between gap-3 mb-4"><div><p className="v2-section-title mb-1">Objective workspace</p><h2 className="text-xl font-bold text-text-primary">{selected.title}</h2></div>{isEditor && <div className="flex gap-2"><button className="btn btn-primary flex items-center gap-2" disabled={saving} onClick={saveObjective}><Save size={15}/> Save</button><button className="btn btn-secondary" title="Archive objective" aria-label="Archive objective" onClick={() => { if (window.confirm('Archive this objective?')) run(async () => { await archiveMarketingObjective(selected.id); setObjectives((current) => current.filter((item) => item.id !== selected.id)); setSelectedId(null); }); }}><Archive size={15}/></button></div>}</div>
            <div className="grid gap-4"><div className="grid md:grid-cols-2 gap-3"><Field label="Title"><input className="input" disabled={!isEditor} value={selected.title} onChange={(event) => patchSelected({ title: event.target.value })}/></Field><Field label="Description"><textarea className="input min-h-20" disabled={!isEditor} value={selected.description} onChange={(event) => patchSelected({ description: event.target.value })} placeholder="Not added yet"/></Field></div><div className="grid sm:grid-cols-4 gap-3"><Field label="Status"><select className="input" disabled={!isEditor} value={selected.status} onChange={(event) => patchSelected({ status: event.target.value as MarketingPlanObjective['status'] })}>{STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field><Field label="Priority"><select className="input" disabled={!isEditor} value={selected.priority} onChange={(event) => patchSelected({ priority: event.target.value as MarketingPlanObjective['priority'] })}>{['high','medium','low','tbc'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></Field><Field label="Quarter"><select className="input" disabled={!isEditor} value={selected.quarter ?? ''} onChange={(event) => patchSelected({ quarter: event.target.value ? Number(event.target.value) : null })}><option value="">TBC</option>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></Field><Field label="Next review"><input className="input" type="date" disabled={!isEditor} value={selected.nextReviewDate ?? ''} onChange={(event) => patchSelected({ nextReviewDate: event.target.value || null })}/></Field></div>
              <Field label="Entities"><div className="flex flex-wrap gap-2" role="group" aria-label="Objective entities">{BRANDS.map((brand) => <label key={brand} className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium bg-white"><input type="checkbox" disabled={!isEditor} checked={selected.entities.includes(brand)} onChange={(event) => patchSelected({ entities: event.target.checked ? [...selected.entities, brand] : selected.entities.filter((item) => item !== brand) })}/>{BRAND_LABEL[brand]}</label>)}</div></Field>
              <div className="grid md:grid-cols-2 gap-3">{[['Why this matters','whyItMatters'],['Customer and market context','customerMarketContext'],['Commercial relevance','commercialRelevance'],['Marketing rationale','marketingRationale']].map(([fieldLabel, key]) => <Field key={key} label={fieldLabel}><textarea className="input min-h-28" disabled={!isEditor} value={selected[key as keyof MarketingPlanObjective] as string} onChange={(event) => patchSelected({ [key]: event.target.value })} placeholder="Not added yet"/></Field>)}</div>
            </div>
          </section>

          <section className="card p-5"><div className="flex items-center justify-between gap-3 mb-4"><div><p className="v2-section-title mb-1">Strategic priorities</p><p className="text-sm text-text-secondary">The main choices that support this objective.</p></div></div>{priorities.length === 0 && <p className="text-sm text-text-secondary py-3">No strategic priorities added yet.</p>}{priorities.map((priority, index) => <div key={priority.id} className="grid md:grid-cols-[1fr_170px_auto] gap-2 items-end border-t py-3"><Field label="Priority"><input className="input" disabled={!isEditor} value={priority.title} onChange={(event) => patchPriority(priority.id, { title: event.target.value })}/></Field><Field label="Status"><select className="input" disabled={!isEditor} value={priority.status} onChange={(event) => patchPriority(priority.id, { status: event.target.value as MarketingPlanPriority['status'] })}>{STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field>{isEditor && <div className="flex gap-1"><button className="btn btn-secondary" disabled={index === 0} title="Move up" aria-label={`Move ${priority.title} up`} onClick={() => movePriority(index, -1)}><ArrowUp size={14}/></button><button className="btn btn-secondary" disabled={index === priorities.length - 1} title="Move down" aria-label={`Move ${priority.title} down`} onClick={() => movePriority(index, 1)}><ArrowDown size={14}/></button><button className="btn btn-secondary" aria-label={`Save ${priority.title}`} onClick={() => run(async () => { await updateMarketingPriority(priority.id, { title: priority.title, status: priority.status }); await loadParts(selected.id); })}><Save size={14}/></button><button className="btn btn-secondary" aria-label={`Archive ${priority.title}`} onClick={() => { if (window.confirm('Archive this strategic priority?')) run(async () => { await archiveMarketingPriority(priority.id); await loadParts(selected.id); }); }}><Archive size={14}/></button></div>}</div>)}{isEditor && <div className="flex gap-2 mt-3"><input className="input flex-1" aria-label="New strategic priority" value={newPriorityTitle} onChange={(event) => setNewPriorityTitle(event.target.value)} placeholder="Add strategic priority"/><button className="btn btn-primary" disabled={!newPriorityTitle.trim() || saving} onClick={() => run(async () => { await createMarketingPriority({ objectiveId: selected.id, title: newPriorityTitle, sortOrder: priorities.length }); setNewPriorityTitle(''); await loadParts(selected.id); })}>Add</button></div>}</section>

          <section className="card p-5"><div className="mb-4"><p className="v2-section-title mb-1">Outcomes and milestones</p><p className="text-sm text-text-secondary">Quarterly outcomes, monthly milestones and current focus. These are meaningful delivery points rather than personal tasks.</p></div>{milestones.length === 0 && <p className="text-sm text-text-secondary py-3">No outcomes or milestones added yet.</p>}{MILESTONE_LEVELS.map(([levelValue, levelLabel]) => { const rows = milestones.filter((item) => item.level === levelValue); if (!rows.length) return null; return <div key={levelValue} className="mb-4"><h3 className="text-sm font-bold text-text-primary mb-2">{levelLabel}</h3><div className="grid gap-2">{rows.map((milestone) => <div key={milestone.id} className="rounded-lg border p-3 grid md:grid-cols-[1fr_170px_145px_auto] gap-2 items-end"><Field label="Milestone"><input className="input" disabled={!isEditor} value={milestone.title} onChange={(event) => patchMilestone(milestone.id, { title: event.target.value })}/></Field><Field label="Status"><select className="input" disabled={!isEditor} value={milestone.status} onChange={(event) => patchMilestone(milestone.id, { status: event.target.value as MarketingPlanMilestone['status'] })}>{[...STATUSES,'in-progress'].map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field><Field label="Due date"><input className="input" type="date" disabled={!isEditor} value={milestone.dueDate ?? ''} onChange={(event) => patchMilestone(milestone.id, { dueDate: event.target.value || null })}/></Field>{isEditor && <div className="flex gap-1"><button className="btn btn-secondary" aria-label={`Save ${milestone.title}`} onClick={() => run(async () => { await updateMarketingMilestone(milestone.id, { title: milestone.title, status: milestone.status, dueDate: milestone.dueDate }); await loadParts(selected.id); })}><Save size={14}/></button><button className="btn btn-secondary" aria-label={`Archive ${milestone.title}`} onClick={() => { if (window.confirm('Archive this outcome or milestone?')) run(async () => { await archiveMarketingMilestone(milestone.id); await loadParts(selected.id); }); }}><Archive size={14}/></button></div>}</div>)}</div></div>; })}{isEditor && <div className="grid md:grid-cols-[170px_minmax(220px,1fr)_150px_155px_190px_auto] gap-2 items-end mt-3"><Field label="Level"><select className="input" value={newMilestoneLevel} onChange={(event) => setNewMilestoneLevel(event.target.value as MarketingPlanMilestone['level'])}>{MILESTONE_LEVELS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></Field><Field label="Outcome or milestone"><input className="input" value={newMilestoneTitle} onChange={(event) => setNewMilestoneTitle(event.target.value)}/></Field><Field label="Month"><select className="input" disabled={newMilestoneLevel !== 'monthly-milestone'} value={newMilestoneMonth ?? ''} onChange={(event) => setNewMilestoneMonth(event.target.value ? Number(event.target.value) : null)}><option value="">TBC</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index).toLocaleDateString('en-GB', { month: 'short' })}</option>)}</select></Field><Field label="Due date"><input className="input" type="date" value={newMilestoneDueDate} onChange={(event) => setNewMilestoneDueDate(event.target.value)}/></Field><Field label="Needs attention"><select className="input" value={newMilestoneAttention ?? ''} onChange={(event) => setNewMilestoneAttention((event.target.value || null) as MarketingPlanMilestone['attentionType'])}><option value="">None</option>{ATTENTION_TYPES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></Field><button className="btn btn-primary" disabled={!newMilestoneTitle.trim() || saving} onClick={() => run(async () => { await createMarketingMilestone({ objectiveId: selected.id, level: newMilestoneLevel, title: newMilestoneTitle, periodYear: selected.periodYear, quarter: selected.quarter, month: newMilestoneLevel === 'monthly-milestone' ? newMilestoneMonth : null, dueDate: newMilestoneDueDate || null, attentionType: newMilestoneAttention, sortOrder: milestones.length }); setNewMilestoneTitle(''); setNewMilestoneMonth(null); setNewMilestoneDueDate(''); setNewMilestoneAttention(null); await loadParts(selected.id); })}>Add</button></div>}</section>

          <section className="card p-5"><p className="v2-section-title mb-1">Campaign relationships</p><p className="text-sm text-text-secondary mb-4">Link existing AI Office campaigns. Campaign records and attribution remain unchanged.</p>{campaignLinks.length === 0 ? <p className="text-sm text-text-secondary py-2">No campaigns linked yet.</p> : <div className="grid gap-2">{campaignLinks.map((link) => <div key={link.id} className="rounded-lg border p-3 flex items-center justify-between gap-3"><button className="text-left" disabled={!link.campaign} onClick={() => link.campaign && selectCampaign(link.campaignId)}><strong className="block text-sm text-text-primary">{link.campaign?.name ?? 'Campaign unavailable'}</strong><span className="text-xs text-text-secondary">{link.campaign ? `${label(link.campaign.status ?? 'status unavailable')}${link.campaign.archived ? ' · Archived' : ''}` : 'The original campaign record no longer exists.'}</span></button>{isEditor && <button className="btn btn-secondary" onClick={() => { if (window.confirm('Unlink this campaign from the objective? The campaign itself will not be changed.')) run(async () => { await deleteMarketingCampaignLink(link.id); await loadParts(selected.id); }); }}>Unlink</button>}</div>)}</div>}{isEditor && <div className="flex gap-2 mt-4"><select className="input flex-1" value={campaignToLink} onChange={(event) => setCampaignToLink(event.target.value)}><option value="">Select an existing campaign</option>{campaigns.filter((campaign) => !campaignLinks.some((link) => link.campaignId === campaign.id)).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select><button className="btn btn-primary" disabled={!campaignToLink || saving} onClick={() => run(async () => { await createMarketingCampaignLink({ objectiveId: selected.id, campaignId: campaignToLink, sortOrder: campaignLinks.length }); setCampaignToLink(''); await loadParts(selected.id); })}>Link campaign</button></div>}</section>

          <section className="card p-5"><p className="v2-section-title mb-1">KPIs and targets</p><p className="text-sm text-text-secondary mb-4">Select an approved KPI. Actual performance will be connected through the canonical resolver in the Progress stage.</p>{kpis.length === 0 ? <p className="text-sm text-text-secondary py-2">No KPIs linked yet. Targets remain TBC until explicitly entered and approved.</p> : <div className="grid gap-3">{kpis.map((kpi) => { const definition = kpiRegistry.find((item) => item.key === kpi.kpiKey); return <div key={kpi.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-3"><div><strong className="text-sm text-text-primary">{definition?.label ?? kpi.kpiKey}</strong><p className="text-xs text-text-secondary mt-1">{definition?.definition ?? 'Definition unavailable'} · Source: {definition?.source ?? 'Unavailable'}</p></div>{isEditor && <button className="btn btn-secondary" onClick={() => { if (window.confirm('Unlink this KPI from the objective?')) run(async () => { await deleteMarketingKpi(kpi.id); await loadParts(selected.id); }); }}>Unlink</button>}</div><div className="grid sm:grid-cols-[150px_150px_160px_auto] gap-2 items-end mt-3"><Field label={`Target${definition?.unit === 'gbp' ? ' (£)' : ''}`}><input className="input" type="number" min="0" disabled={!isEditor} value={kpi.targetValue ?? ''} onChange={(event) => setKpis((current) => current.map((item) => item.id === kpi.id ? { ...item, targetValue: event.target.value === '' ? null : Number(event.target.value), targetStatus: event.target.value === '' ? 'tbc' : item.targetStatus } : item))} placeholder="TBC"/></Field><Field label="Target status"><select className="input" disabled={!isEditor} value={kpi.targetStatus} onChange={(event) => setKpis((current) => current.map((item) => item.id === kpi.id ? { ...item, targetStatus: event.target.value as MarketingPlanKpi['targetStatus'] } : item))}>{['tbc','proposed','approved'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></Field><Field label="Direction"><select className="input" disabled={!isEditor} value={kpi.targetDirection} onChange={(event) => setKpis((current) => current.map((item) => item.id === kpi.id ? { ...item, targetDirection: event.target.value as MarketingPlanKpi['targetDirection'] } : item))}>{['reach','increase','decrease','maintain'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></Field>{isEditor && <button className="btn btn-secondary flex items-center gap-2" onClick={() => run(async () => { await updateMarketingKpi(kpi.id, { targetValue: kpi.targetValue, targetStatus: kpi.targetStatus, targetDirection: kpi.targetDirection }); await loadParts(selected.id); })}><Save size={14}/> Save target</button>}</div></div>; })}</div>}{isEditor && <div className="flex gap-2 mt-4"><select className="input flex-1" value={kpiToLink} onChange={(event) => setKpiToLink(event.target.value)}><option value="">Select an approved KPI</option>{kpiRegistry.filter((definition) => !kpis.some((kpi) => kpi.kpiKey === definition.key)).map((definition) => <option key={definition.key} value={definition.key}>{definition.label} · {definition.source}</option>)}</select><button className="btn btn-primary" disabled={!kpiToLink || saving} onClick={() => run(async () => { await createMarketingKpi({ objectiveId: selected.id, kpiKey: kpiToLink, targetValue: null, targetStatus: 'tbc', sortOrder: kpis.length }); setKpiToLink(''); await loadParts(selected.id); })}>Link KPI</button></div>}</section>

          <section className="card p-5"><p className="v2-section-title mb-1">Change history</p><p className="text-sm text-text-secondary mb-3">A chronological record of objective, priority, milestone, campaign and KPI relationship changes.</p>{history.length === 0 ? <p className="text-sm text-text-secondary">No changes recorded yet.</p> : <div className="divide-y">{history.slice(0, 20).map((entry) => <div key={entry.id} className="py-3 flex flex-wrap justify-between gap-2"><div><strong className="text-sm text-text-primary">{label(entry.action)}</strong><span className="text-xs text-text-secondary ml-2">{label(entry.resourceType)}</span>{entry.reason && <p className="text-xs text-text-secondary mt-1">{entry.reason}</p>}</div><time className="text-xs text-text-secondary">{new Date(entry.changedAt).toLocaleString('en-GB')}</time></div>)}</div>}</section>
        </main>}
      </div>
      </> : activeView === 'reviews'
        ? <StrategyReviewsView plan={plan} rows={strategyRows} registry={kpiRegistry} campaigns={campaigns} isEditor={isEditor} onOpenObjective={openObjective}/>
        : activeView === 'progress' || activeView === 'health'
        ? <ProgressAndHealth mode={activeView} rows={strategyRows} registry={kpiRegistry} campaigns={campaigns} onOpenObjective={openObjective} onOpenKpi={openKpi}/>
        : <StrategyViews view={activeView} plan={plan} rows={strategyRows} registry={kpiRegistry} campaigns={campaigns} onOpenObjective={openObjective} onOpenCampaign={selectCampaign} onOpenKpi={openKpi}/>}</section>
    </>}
  </div>;
}
