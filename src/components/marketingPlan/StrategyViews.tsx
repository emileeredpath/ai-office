import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, CircleAlert, Flag, Target } from 'lucide-react';
import type { Campaign } from '@/types';
import type { MarketingPlan, MarketingPlanKpiDefinition, MarketingPlanMilestone, MarketingPlanStrategyObjective } from '@/types/marketingPlan';
import { BRAND_LABEL } from '@/utils/brandColors';

export type MarketingPlanView = 'strategy-map' | 'quarter' | 'month' | 'week' | 'progress' | 'health' | 'reviews' | 'objectives';

interface Props {
  view: Exclude<MarketingPlanView, 'objectives' | 'progress' | 'health' | 'reviews'>;
  plan: MarketingPlan;
  rows: MarketingPlanStrategyObjective[];
  registry: MarketingPlanKpiDefinition[];
  campaigns: Campaign[];
  onOpenObjective: (id: string) => void;
  onOpenCampaign: (id: string) => void;
  onOpenKpi: (key: string) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function titleCase(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string | null) {
  return value ? localDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC';
}

function targetLabel(value: number | null, unit: string | null) {
  if (value === null) return 'TBC';
  if (unit === 'gbp') return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
  if (unit === 'percent') return `${value}%`;
  return new Intl.NumberFormat('en-GB').format(value);
}

function StatusPill({ value }: { value: string }) {
  const colour = value === 'complete' ? 'bg-emerald-100 text-emerald-800' : value === 'approved' || value === 'in-progress' ? 'bg-blue-100 text-blue-800' : value === 'needs-confirmation' || value === 'tbc' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colour}`}>{titleCase(value)}</span>;
}

function EmptyView({ title, detail }: { title: string; detail: string }) {
  return <section className="card p-8 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Target size={21}/></div><h2 className="font-bold text-text-primary">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm text-text-secondary">{detail}</p></section>;
}

function StrategyMap({ plan, rows, registry, onOpenObjective, onOpenCampaign, onOpenKpi }: Omit<Props, 'view' | 'campaigns'>) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(rows[0] ? [rows[0].objective.id] : []));
  if (!rows.length) return <EmptyView title="No marketing objectives added yet" detail="Create the first objective in the Objectives workspace when the strategy is ready to be entered."/>;
  const toggle = (id: string) => setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return <div className="grid gap-4">
    <section className="rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-700 p-6 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100">Business direction</p><p className="mt-2 max-w-4xl text-lg font-semibold leading-relaxed">{plan.businessDirection || 'Business direction has not been added yet.'}</p></section>
    <div className="ml-6 h-5 border-l-2 border-violet-200" aria-hidden="true"/>
    <div className="grid gap-4">{rows.map(({ objective, priorities, campaignLinks, kpis }) => {
      const open = expanded.has(objective.id);
      return <section key={objective.id} className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        <button className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-violet-50/60" onClick={() => toggle(objective.id)} aria-expanded={open}>
          <div><div className="mb-2 flex flex-wrap items-center gap-2"><StatusPill value={objective.status}/><span className="text-xs font-semibold text-text-secondary">{objective.periodYear}{objective.quarter ? ` · Q${objective.quarter}` : ' · Quarter TBC'}</span></div><h2 className="text-lg font-bold text-text-primary">{objective.title}</h2><p className="mt-1 text-sm text-text-secondary">{objective.description || 'No description added yet.'}</p></div>{open ? <ChevronDown className="mt-1 shrink-0 text-violet-600"/> : <ChevronRight className="mt-1 shrink-0 text-violet-600"/>}
        </button>
        {open && <div className="border-t border-violet-100 bg-gradient-to-b from-violet-50/50 to-white p-5">
          <div className="mb-4 flex flex-wrap gap-2">{objective.entities.length ? objective.entities.map((entity) => <span key={entity} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-200">{BRAND_LABEL[entity]}</span>) : <span className="text-xs text-amber-700">Entities TBC</span>}</div>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-indigo-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Strategic priorities</p>{priorities.length ? <ol className="mt-3 grid gap-2">{priorities.map((priority, index) => <li key={priority.id} className="flex gap-2 text-sm text-text-primary"><span className="font-bold text-indigo-500">{index + 1}</span><span>{priority.title}</span></li>)}</ol> : <p className="mt-3 text-sm text-text-secondary">No priorities linked yet.</p>}</div>
            <div className="rounded-xl border border-cyan-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Campaigns</p>{campaignLinks.length ? <div className="mt-3 grid gap-2">{campaignLinks.map((link) => <button key={link.id} disabled={!link.campaign} onClick={() => link.campaign && onOpenCampaign(link.campaignId)} className="text-left text-sm font-semibold text-cyan-800 hover:underline disabled:text-text-secondary disabled:no-underline">{link.campaign?.name ?? 'Campaign unavailable'}</button>)}</div> : <p className="mt-3 text-sm text-text-secondary">No campaigns linked yet.</p>}</div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">KPIs and targets</p>{kpis.length ? <div className="mt-3 grid gap-2">{kpis.map((kpi) => { const definition = registry.find((item) => item.key === kpi.kpiKey); return <button key={kpi.id} onClick={() => onOpenKpi(kpi.kpiKey)} className="flex items-center justify-between gap-3 text-left text-sm hover:underline"><span className="font-semibold text-emerald-800">{definition?.label ?? kpi.kpiKey}</span><span className="text-text-secondary">{targetLabel(kpi.targetValue, kpi.targetUnit)}</span></button>; })}</div> : <p className="mt-3 text-sm text-text-secondary">No KPIs linked yet.</p>}</div>
          </div>
          <button className="mt-4 text-sm font-semibold text-violet-700 hover:underline" onClick={() => onOpenObjective(objective.id)}>Open objective workspace</button>
        </div>}
      </section>;
    })}</div>
  </div>;
}

function QuarterView({ plan, rows, registry, onOpenObjective, onOpenCampaign, onOpenKpi }: Omit<Props, 'view' | 'campaigns'>) {
  const today = new Date();
  const [quarter, setQuarter] = useState(plan.periodYear === today.getFullYear() ? Math.floor(today.getMonth() / 3) + 1 : 1);
  const matching = rows.filter((row) => row.objective.periodYear === plan.periodYear && row.objective.quarter === quarter);
  const tbcCount = rows.filter((row) => row.objective.periodYear === plan.periodYear && row.objective.quarter === null).length;
  return <div className="grid gap-4">
    <section className="card p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="v2-section-title">Quarter plan</p><p className="mt-1 text-sm text-text-secondary">Objectives, outcomes, campaigns and KPIs explicitly assigned to the selected quarter.</p></div><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Quarter</span><select className="input min-w-32" value={quarter} onChange={(event) => setQuarter(Number(event.target.value))}>{[1,2,3,4].map((value) => <option key={value} value={value}>Q{value} {plan.periodYear}</option>)}</select></label></div>{tbcCount > 0 && <p className="mt-3 text-xs text-amber-700">{tbcCount} objective{tbcCount === 1 ? '' : 's'} still {tbcCount === 1 ? 'has' : 'have'} a TBC quarter and {tbcCount === 1 ? 'is' : 'are'} excluded from this view.</p>}</section>
    {!matching.length ? <EmptyView title={`No objectives assigned to Q${quarter}`} detail="Assign a quarter in the objective workspace when its timeframe is confirmed."/> : matching.map((row) => <section key={row.objective.id} className="card overflow-hidden"><div className="border-l-4 border-violet-500 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><StatusPill value={row.objective.status}/><h2 className="mt-2 text-lg font-bold text-text-primary">{row.objective.title}</h2></div><button className="text-sm font-semibold text-violet-700 hover:underline" onClick={() => onOpenObjective(row.objective.id)}>Open objective</button></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><div><p className="text-xs font-bold uppercase text-indigo-700">Expected outcomes</p>{row.milestones.filter((item) => item.level === 'quarterly-outcome' && (item.quarter === quarter || item.quarter === null)).length ? row.milestones.filter((item) => item.level === 'quarterly-outcome' && (item.quarter === quarter || item.quarter === null)).map((item) => <div key={item.id} className="mt-2 rounded-lg bg-indigo-50 p-3 text-sm"><strong>{item.title}</strong><div className="mt-1"><StatusPill value={item.status}/></div></div>) : <p className="mt-2 text-sm text-text-secondary">No quarterly outcomes added.</p>}</div><div><p className="text-xs font-bold uppercase text-cyan-700">Linked campaigns</p>{row.campaignLinks.length ? row.campaignLinks.map((link) => <button key={link.id} disabled={!link.campaign} onClick={() => link.campaign && onOpenCampaign(link.campaignId)} className="mt-2 block text-left text-sm font-semibold text-cyan-800 hover:underline disabled:text-text-secondary">{link.campaign?.name ?? 'Campaign unavailable'}</button>) : <p className="mt-2 text-sm text-text-secondary">No campaigns linked.</p>}</div><div><p className="text-xs font-bold uppercase text-emerald-700">KPIs</p>{row.kpis.length ? row.kpis.map((kpi) => { const definition = registry.find((item) => item.key === kpi.kpiKey); return <button key={kpi.id} onClick={() => onOpenKpi(kpi.kpiKey)} className="mt-2 flex w-full justify-between gap-2 text-left text-sm hover:underline"><span className="font-semibold text-emerald-800">{definition?.label ?? kpi.kpiKey}</span><span>{targetLabel(kpi.targetValue, kpi.targetUnit)}</span></button>; }) : <p className="mt-2 text-sm text-text-secondary">No KPIs linked.</p>}</div></div></div></section>) }
  </div>;
}

function MonthView({ plan, rows, campaigns, onOpenObjective, onOpenCampaign }: Omit<Props, 'view' | 'registry' | 'onOpenKpi'>) {
  const today = new Date();
  const [month, setMonth] = useState(plan.periodYear === today.getFullYear() ? today.getMonth() + 1 : 1);
  const milestones = rows.flatMap((row) => row.milestones.filter((item) => item.level === 'monthly-milestone' && item.periodYear === plan.periodYear && item.month === month).map((item) => ({ item, objective: row.objective })));
  const linkedIds = new Set(rows.flatMap((row) => row.campaignLinks.map((link) => link.campaignId)));
  const campaignMilestones = campaigns.filter((campaign) => linkedIds.has(campaign.id)).flatMap((campaign) => (campaign.schedule ?? []).filter((item) => { const date = localDate(item.date); return date.getFullYear() === plan.periodYear && date.getMonth() + 1 === month; }).map((item) => ({ ...item, campaign })));
  return <div className="grid gap-4"><section className="card p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="v2-section-title">Month plan</p><p className="mt-1 text-sm text-text-secondary">Meaningful Marketing Plan milestones and linked campaign milestones. Personal tasks are kept outside this view.</p></div><label className="grid gap-1 text-xs font-semibold text-text-secondary"><span>Month</span><select className="input min-w-44" value={month} onChange={(event) => setMonth(Number(event.target.value))}>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name} {plan.periodYear}</option>)}</select></label></div></section>
    {!milestones.length && !campaignMilestones.length ? <EmptyView title={`No milestones for ${MONTHS[month - 1]}`} detail="Add a monthly milestone to an objective or schedule a milestone on a linked campaign."/> : <div className="grid gap-4 lg:grid-cols-2"><section className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Marketing Plan milestones</p>{milestones.length ? <div className="mt-3 grid gap-3">{milestones.map(({ item, objective }) => <button key={item.id} onClick={() => onOpenObjective(objective.id)} className="rounded-xl border border-violet-100 p-4 text-left hover:bg-violet-50"><div className="flex justify-between gap-2"><strong className="text-sm text-text-primary">{item.title}</strong><StatusPill value={item.status}/></div><p className="mt-2 text-xs text-text-secondary">{objective.title} · Due {formatDate(item.dueDate)}</p></button>)}</div> : <p className="mt-3 text-sm text-text-secondary">No Marketing Plan milestones this month.</p>}</section><section className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Linked campaign milestones</p>{campaignMilestones.length ? <div className="mt-3 grid gap-3">{campaignMilestones.map((item) => <button key={`${item.campaign.id}-${item.date}-${item.element}`} onClick={() => onOpenCampaign(item.campaign.id)} className="rounded-xl border border-cyan-100 p-4 text-left hover:bg-cyan-50"><strong className="text-sm text-text-primary">{item.element}</strong><p className="mt-2 text-xs text-text-secondary">{item.campaign.name} · {formatDate(item.date)} · {titleCase(item.status)}</p></button>)}</div> : <p className="mt-3 text-sm text-text-secondary">No linked campaign milestones this month.</p>}</section></div>}
  </div>;
}

type FocusItem = { id: string; kind: string; title: string; detail: string; overdue: boolean; sortDate: string | null; objectiveId?: string };

function WeekView({ plan, rows, onOpenObjective }: Omit<Props, 'view' | 'registry' | 'campaigns' | 'onOpenCampaign' | 'onOpenKpi'>) {
  const range = useMemo(() => { const now = new Date(); now.setHours(0, 0, 0, 0); const start = new Date(now); const day = (now.getDay() + 6) % 7; start.setDate(now.getDate() - day); const end = new Date(start); end.setDate(start.getDate() + 6); return { now, start, end }; }, []);
  const items: FocusItem[] = [];
  for (const row of rows) {
    for (const milestone of row.milestones) {
      if (milestone.status === 'complete') continue;
      const due = milestone.dueDate ? localDate(milestone.dueDate) : null;
      const starts = milestone.startDate ? localDate(milestone.startDate) : null;
      const relevant = milestone.level === 'current-focus' || milestone.attentionType !== null || (due !== null && due <= range.end) || (starts !== null && starts >= range.start && starts <= range.end);
      if (!relevant) continue;
      items.push({ id: milestone.id, kind: milestone.attentionType ? titleCase(milestone.attentionType) : milestone.level === 'current-focus' ? 'Current focus' : 'Milestone', title: milestone.title, detail: `${row.objective.title}${milestone.dueDate ? ` · Due ${formatDate(milestone.dueDate)}` : ''}`, overdue: due !== null && due < range.start, sortDate: milestone.dueDate ?? milestone.startDate, objectiveId: row.objective.id });
    }
    if (row.objective.nextReviewDate) {
      const review = localDate(row.objective.nextReviewDate);
      if (review <= range.end) items.push({ id: `objective-${row.objective.id}`, kind: 'Review required', title: row.objective.title, detail: `Objective review · ${formatDate(row.objective.nextReviewDate)}`, overdue: review < range.start, sortDate: row.objective.nextReviewDate, objectiveId: row.objective.id });
    }
  }
  if (plan.nextReviewDate) {
    const review = localDate(plan.nextReviewDate);
    if (review <= range.end) items.push({ id: `plan-${plan.id}`, kind: 'Review required', title: plan.title, detail: `Plan review · ${formatDate(plan.nextReviewDate)}`, overdue: review < range.start, sortDate: plan.nextReviewDate });
  }
  items.sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.sortDate ?? '9999-12-31').localeCompare(b.sortDate ?? '9999-12-31') || a.title.localeCompare(b.title));
  const dateRange = `${range.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}–${range.end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return <div className="grid gap-4"><section className="card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="v2-section-title">This week</p><p className="mt-1 text-sm text-text-secondary">Derived from current focus, milestone dates, attention flags and review dates. Nothing is maintained here separately.</p></div><span className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-semibold text-violet-800">{dateRange}</span></div></section>{!items.length ? <EmptyView title="Nothing needs strategic attention this week" detail="This view will populate from saved milestone, attention and review dates."/> : <section className="card p-5"><div className="grid gap-3">{items.map((item) => <button key={item.id} disabled={!item.objectiveId} onClick={() => item.objectiveId && onOpenObjective(item.objectiveId)} className={`flex items-start gap-3 rounded-xl border p-4 text-left ${item.overdue ? 'border-red-200 bg-red-50' : 'border-amber-100 bg-amber-50/50'} disabled:cursor-default`}><div className={`mt-0.5 rounded-lg p-2 ${item.overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.kind.includes('Review') ? <CalendarDays size={17}/> : item.kind.toLowerCase().includes('required') ? <CircleAlert size={17}/> : <Flag size={17}/>}</div><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-text-primary">{item.title}</strong>{item.overdue && <span className="text-xs font-bold uppercase text-red-700">Overdue</span>}</div><p className="mt-1 text-xs font-semibold text-text-secondary">{item.kind} · {item.detail}</p></div></button>)}</div></section>}</div>;
}

export function StrategyViews(props: Props) {
  if (props.view === 'strategy-map') return <StrategyMap {...props}/>;
  if (props.view === 'quarter') return <QuarterView {...props}/>;
  if (props.view === 'month') return <MonthView {...props}/>;
  return <WeekView {...props}/>;
}
