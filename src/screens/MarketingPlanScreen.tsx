import { useCallback, useEffect, useState } from 'react';
import { Archive, ArrowDown, ArrowUp, Plus, Save, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_LABEL } from '@/utils/brandColors';
import type { Brand } from '@/types/index';
import type { MarketingPlan, MarketingPlanMilestone, MarketingPlanObjective, MarketingPlanPriority } from '@/types/marketingPlan';
import {
  archiveMarketingMilestone, archiveMarketingObjective, archiveMarketingPriority,
  createMarketingMilestone, createMarketingObjective, createMarketingPlan, createMarketingPriority,
  fetchMarketingMilestones, fetchMarketingObjectives, fetchMarketingPlans, fetchMarketingPriorities,
  fetchMarketingObjectiveHistory,
  reorderMarketingPriorities, updateMarketingMilestone, updateMarketingObjective, updateMarketingPlan, updateMarketingPriority,
} from '@/services/marketingPlanApi';
import type { MarketingPlanHistoryEntry } from '@/services/marketingPlanApi';

const BRANDS = Object.keys(BRAND_LABEL) as Brand[];
const STATUSES = ['draft', 'proposed', 'approved', 'complete', 'tbc', 'needs-confirmation'] as const;
const MILESTONE_LEVELS = [
  ['quarterly-outcome', 'Quarterly outcome'],
  ['monthly-milestone', 'Monthly milestone'],
  ['current-focus', 'Current focus'],
] as const;

function label(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Field({ label: fieldLabel, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>{fieldLabel}</span>{children}</label>;
}

export function MarketingPlanScreen() {
  const { isEditor } = useAuth();
  const [plan, setPlan] = useState<MarketingPlan | null>(null);
  const [objectives, setObjectives] = useState<MarketingPlanObjective[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<MarketingPlanPriority[]>([]);
  const [milestones, setMilestones] = useState<MarketingPlanMilestone[]>([]);
  const [history, setHistory] = useState<MarketingPlanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneLevel, setNewMilestoneLevel] = useState<MarketingPlanMilestone['level']>('quarterly-outcome');

  const selected = objectives.find((objective) => objective.id === selectedId) ?? null;

  const loadParts = useCallback(async (objectiveId: string) => {
    const [nextPriorities, nextMilestones, nextHistory] = await Promise.all([
      fetchMarketingPriorities(objectiveId), fetchMarketingMilestones(objectiveId), fetchMarketingObjectiveHistory(objectiveId),
    ]);
    setPriorities(nextPriorities);
    setMilestones(nextMilestones);
    setHistory(nextHistory);
  }, []);

  const loadObjectives = useCallback(async (activePlan: MarketingPlan) => {
    const next = await fetchMarketingObjectives(activePlan.id);
    setObjectives(next);
    setSelectedId((current) => next.some((objective) => objective.id === current) ? current : next[0]?.id ?? null);
  }, []);

  useEffect(() => {
    fetchMarketingPlans().then((next) => {
      const active = next[0] ?? null;
      setPlan(active);
      if (active) return loadObjectives(active);
    }).catch(() => setError('Could not load the Marketing Plan.')).finally(() => setLoading(false));
  }, [loadObjectives]);

  useEffect(() => {
    if (!selectedId) { setPriorities([]); setMilestones([]); return; }
    loadParts(selectedId).catch(() => setError('Could not load the objective workspace.'));
  }, [selectedId, loadParts]);

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

  if (loading) return <div className="v2-page"><p className="text-text-secondary">Loading Marketing Plan…</p></div>;

  return <div className="v2-page">
    <div className="v2-page-header">
      <div><p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-1">Strategy and delivery</p><h1 className="text-2xl font-bold text-text-primary">Marketing Plan</h1><p className="text-sm text-text-secondary mt-1">Connect business direction to objectives, meaningful milestones and measurable marketing activity.</p></div>
      {plan && isEditor && <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowObjectiveForm(true)}><Plus size={16}/> Add objective</button>}
    </div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>}

    {!plan ? <section className="card p-8 max-w-2xl">
      <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4"><Target size={24}/></div>
      <h2 className="text-xl font-bold text-text-primary">No marketing plan created yet</h2>
      <p className="text-sm text-text-secondary mt-2 max-w-xl">Create the plan shell when the planning period is known. No objectives, targets or performance will be filled in automatically.</p>
      {isEditor && !showPlanForm && <button className="btn btn-primary mt-5" onClick={() => { setShowPlanForm(true); setNewTitle(''); }}>Create marketing plan</button>}
      {showPlanForm && <div className="grid gap-3 mt-5 max-w-md"><Field label="Plan title"><input className="input" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. MTech Marketing Plan"/></Field><Field label="Planning year"><input className="input" type="number" min="2000" max="2200" value={newYear} onChange={(event) => setNewYear(Number(event.target.value))}/></Field><div className="flex gap-2"><button className="btn btn-primary" disabled={saving || !newTitle.trim()} onClick={submitPlan}>Create plan</button><button className="btn btn-secondary" onClick={() => setShowPlanForm(false)}>Cancel</button></div></div>}
    </section> : <>
      <section className="card p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="grid gap-3 flex-1 min-w-[260px]"><div className="grid sm:grid-cols-[1fr_120px_180px] gap-3"><Field label="Plan title"><input className="input" disabled={!isEditor} value={plan.title} onChange={(event) => setPlan({ ...plan, title: event.target.value })}/></Field><Field label="Year"><input className="input" type="number" disabled={!isEditor} value={plan.periodYear} onChange={(event) => setPlan({ ...plan, periodYear: Number(event.target.value) })}/></Field><Field label="Status"><select className="input" disabled={!isEditor} value={plan.status} onChange={(event) => setPlan({ ...plan, status: event.target.value as MarketingPlan['status'] })}>{STATUSES.filter((status) => status !== 'tbc').map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field></div><Field label="Business direction"><textarea className="input min-h-24" disabled={!isEditor} value={plan.businessDirection} onChange={(event) => setPlan({ ...plan, businessDirection: event.target.value })} placeholder="Not added yet"/></Field></div>{isEditor && <button className="btn btn-secondary flex items-center gap-2" disabled={saving} onClick={savePlan}><Save size={15}/> Save plan</button>}</div>
      </section>

      {showObjectiveForm && <section className="card p-5 mb-5 border border-violet-200"><h2 className="font-bold text-text-primary">New marketing objective</h2><div className="grid sm:grid-cols-[1fr_130px_auto] gap-3 items-end mt-3"><Field label="Objective title"><input className="input" value={newTitle} onChange={(event) => setNewTitle(event.target.value)}/></Field><Field label="Year"><input className="input" type="number" value={newYear} onChange={(event) => setNewYear(Number(event.target.value))}/></Field><div className="flex gap-2"><button className="btn btn-primary" disabled={saving || !newTitle.trim()} onClick={submitObjective}>Create</button><button className="btn btn-secondary" onClick={() => setShowObjectiveForm(false)}>Cancel</button></div></div></section>}

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
        <aside className="card p-3 h-fit"><p className="v2-section-title px-2 pt-2">Objectives</p>{objectives.length === 0 ? <div className="p-4 rounded-lg bg-violet-50"><strong className="text-sm text-text-primary">No marketing objectives added yet.</strong><p className="text-xs text-text-secondary mt-1">Create the first objective when the marketing strategy is ready to be entered.</p></div> : <div className="grid gap-1">{objectives.map((objective) => <button key={objective.id} className={`text-left rounded-lg p-3 ${objective.id === selectedId ? 'bg-violet-100 text-violet-900' : 'hover:bg-grey-50 text-text-primary'}`} onClick={() => setSelectedId(objective.id)}><strong className="block text-sm">{objective.title}</strong><span className="text-xs opacity-70">{label(objective.status)} · {objective.periodYear}{objective.quarter ? ` Q${objective.quarter}` : ''}</span></button>)}</div>}</aside>

        {selected && <main className="grid gap-5">
          <section className="card p-5"><div className="flex justify-between gap-3 mb-4"><div><p className="v2-section-title mb-1">Objective workspace</p><h2 className="text-xl font-bold text-text-primary">{selected.title}</h2></div>{isEditor && <div className="flex gap-2"><button className="btn btn-primary flex items-center gap-2" disabled={saving} onClick={saveObjective}><Save size={15}/> Save</button><button className="btn btn-secondary" title="Archive objective" onClick={() => { if (window.confirm('Archive this objective?')) run(async () => { await archiveMarketingObjective(selected.id); setObjectives((current) => current.filter((item) => item.id !== selected.id)); setSelectedId(null); }); }}><Archive size={15}/></button></div>}</div>
            <div className="grid gap-4"><div className="grid md:grid-cols-2 gap-3"><Field label="Title"><input className="input" disabled={!isEditor} value={selected.title} onChange={(event) => patchSelected({ title: event.target.value })}/></Field><Field label="Description"><textarea className="input min-h-20" disabled={!isEditor} value={selected.description} onChange={(event) => patchSelected({ description: event.target.value })} placeholder="Not added yet"/></Field></div><div className="grid sm:grid-cols-4 gap-3"><Field label="Status"><select className="input" disabled={!isEditor} value={selected.status} onChange={(event) => patchSelected({ status: event.target.value as MarketingPlanObjective['status'] })}>{STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field><Field label="Priority"><select className="input" disabled={!isEditor} value={selected.priority} onChange={(event) => patchSelected({ priority: event.target.value as MarketingPlanObjective['priority'] })}>{['high','medium','low','tbc'].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></Field><Field label="Quarter"><select className="input" disabled={!isEditor} value={selected.quarter ?? ''} onChange={(event) => patchSelected({ quarter: event.target.value ? Number(event.target.value) : null })}><option value="">TBC</option>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></Field><Field label="Next review"><input className="input" type="date" disabled={!isEditor} value={selected.nextReviewDate ?? ''} onChange={(event) => patchSelected({ nextReviewDate: event.target.value || null })}/></Field></div>
              <Field label="Entities"><div className="flex flex-wrap gap-2">{BRANDS.map((brand) => <label key={brand} className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium bg-white"><input type="checkbox" disabled={!isEditor} checked={selected.entities.includes(brand)} onChange={(event) => patchSelected({ entities: event.target.checked ? [...selected.entities, brand] : selected.entities.filter((item) => item !== brand) })}/>{BRAND_LABEL[brand]}</label>)}</div></Field>
              <div className="grid md:grid-cols-2 gap-3">{[['Why this matters','whyItMatters'],['Customer and market context','customerMarketContext'],['Commercial relevance','commercialRelevance'],['Marketing rationale','marketingRationale']].map(([fieldLabel, key]) => <Field key={key} label={fieldLabel}><textarea className="input min-h-28" disabled={!isEditor} value={selected[key as keyof MarketingPlanObjective] as string} onChange={(event) => patchSelected({ [key]: event.target.value })} placeholder="Not added yet"/></Field>)}</div>
            </div>
          </section>

          <section className="card p-5"><div className="flex items-center justify-between gap-3 mb-4"><div><p className="v2-section-title mb-1">Strategic priorities</p><p className="text-sm text-text-secondary">The main choices that support this objective.</p></div></div>{priorities.length === 0 && <p className="text-sm text-text-secondary py-3">No strategic priorities added yet.</p>}{priorities.map((priority, index) => <div key={priority.id} className="grid md:grid-cols-[1fr_170px_auto] gap-2 items-end border-t py-3"><Field label="Priority"><input className="input" disabled={!isEditor} value={priority.title} onChange={(event) => patchPriority(priority.id, { title: event.target.value })}/></Field><Field label="Status"><select className="input" disabled={!isEditor} value={priority.status} onChange={(event) => patchPriority(priority.id, { status: event.target.value as MarketingPlanPriority['status'] })}>{STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field>{isEditor && <div className="flex gap-1"><button className="btn btn-secondary" disabled={index === 0} title="Move up" onClick={() => movePriority(index, -1)}><ArrowUp size={14}/></button><button className="btn btn-secondary" disabled={index === priorities.length - 1} title="Move down" onClick={() => movePriority(index, 1)}><ArrowDown size={14}/></button><button className="btn btn-secondary" onClick={() => run(async () => { await updateMarketingPriority(priority.id, { title: priority.title, status: priority.status }); await loadParts(selected.id); })}><Save size={14}/></button><button className="btn btn-secondary" onClick={() => { if (window.confirm('Archive this strategic priority?')) run(async () => { await archiveMarketingPriority(priority.id); await loadParts(selected.id); }); }}><Archive size={14}/></button></div>}</div>)}{isEditor && <div className="flex gap-2 mt-3"><input className="input flex-1" value={newPriorityTitle} onChange={(event) => setNewPriorityTitle(event.target.value)} placeholder="Add strategic priority"/><button className="btn btn-primary" disabled={!newPriorityTitle.trim() || saving} onClick={() => run(async () => { await createMarketingPriority({ objectiveId: selected.id, title: newPriorityTitle, sortOrder: priorities.length }); setNewPriorityTitle(''); await loadParts(selected.id); })}>Add</button></div>}</section>

          <section className="card p-5"><div className="mb-4"><p className="v2-section-title mb-1">Outcomes and milestones</p><p className="text-sm text-text-secondary">Quarterly outcomes, monthly milestones and current focus. These are meaningful delivery points rather than personal tasks.</p></div>{milestones.length === 0 && <p className="text-sm text-text-secondary py-3">No outcomes or milestones added yet.</p>}{MILESTONE_LEVELS.map(([levelValue, levelLabel]) => { const rows = milestones.filter((item) => item.level === levelValue); if (!rows.length) return null; return <div key={levelValue} className="mb-4"><h3 className="text-sm font-bold text-text-primary mb-2">{levelLabel}</h3><div className="grid gap-2">{rows.map((milestone) => <div key={milestone.id} className="rounded-lg border p-3 grid md:grid-cols-[1fr_170px_145px_auto] gap-2 items-end"><Field label="Milestone"><input className="input" disabled={!isEditor} value={milestone.title} onChange={(event) => patchMilestone(milestone.id, { title: event.target.value })}/></Field><Field label="Status"><select className="input" disabled={!isEditor} value={milestone.status} onChange={(event) => patchMilestone(milestone.id, { status: event.target.value as MarketingPlanMilestone['status'] })}>{[...STATUSES,'in-progress'].map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field><Field label="Due date"><input className="input" type="date" disabled={!isEditor} value={milestone.dueDate ?? ''} onChange={(event) => patchMilestone(milestone.id, { dueDate: event.target.value || null })}/></Field>{isEditor && <div className="flex gap-1"><button className="btn btn-secondary" onClick={() => run(async () => { await updateMarketingMilestone(milestone.id, { title: milestone.title, status: milestone.status, dueDate: milestone.dueDate }); await loadParts(selected.id); })}><Save size={14}/></button><button className="btn btn-secondary" onClick={() => { if (window.confirm('Archive this outcome or milestone?')) run(async () => { await archiveMarketingMilestone(milestone.id); await loadParts(selected.id); }); }}><Archive size={14}/></button></div>}</div>)}</div></div>; })}{isEditor && <div className="grid sm:grid-cols-[190px_1fr_auto] gap-2 items-end mt-3"><Field label="Level"><select className="input" value={newMilestoneLevel} onChange={(event) => setNewMilestoneLevel(event.target.value as MarketingPlanMilestone['level'])}>{MILESTONE_LEVELS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></Field><Field label="Outcome or milestone"><input className="input" value={newMilestoneTitle} onChange={(event) => setNewMilestoneTitle(event.target.value)}/></Field><button className="btn btn-primary" disabled={!newMilestoneTitle.trim() || saving} onClick={() => run(async () => { await createMarketingMilestone({ objectiveId: selected.id, level: newMilestoneLevel, title: newMilestoneTitle, periodYear: selected.periodYear, quarter: selected.quarter, sortOrder: milestones.length }); setNewMilestoneTitle(''); await loadParts(selected.id); })}>Add</button></div>}</section>

          <section className="card p-5"><p className="v2-section-title mb-1">Change history</p><p className="text-sm text-text-secondary mb-3">A chronological record of objective, priority and milestone changes.</p>{history.length === 0 ? <p className="text-sm text-text-secondary">No changes recorded yet.</p> : <div className="divide-y">{history.slice(0, 20).map((entry) => <div key={entry.id} className="py-3 flex flex-wrap justify-between gap-2"><div><strong className="text-sm text-text-primary">{label(entry.action)}</strong><span className="text-xs text-text-secondary ml-2">{label(entry.resourceType)}</span>{entry.reason && <p className="text-xs text-text-secondary mt-1">{entry.reason}</p>}</div><time className="text-xs text-text-secondary">{new Date(entry.changedAt).toLocaleString('en-GB')}</time></div>)}</div>}</section>
        </main>}
      </div>
    </>}
  </div>;
}
