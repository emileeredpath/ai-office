import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { AddActivityModal } from '@/components/calendar/AddActivityModal';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import type { CalendarActivityItem } from '@/components/calendar/types';
import { getMarketingEvents, type MarketingEvent } from '@/utils/marketingEvents';
import { getMonthName, formatDateShort } from '@/utils/dateUtils';

type ViewMode = 'month' | 'week' | 'list';

interface CalendarScreenProps {
  onNavigate?: (screen: string) => void;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function endOfWeek(start: Date): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Padded 6-week grid range for the Month view, so leading/trailing days
// from adjacent months can show their real activity too.
function monthGridRange(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(startOfMonth(date));
  const end = new Date(start);
  end.setDate(start.getDate() + 41);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function CalendarScreen({ onNavigate }: CalendarScreenProps) {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const selectTask = useAppStore((s) => s.selectTask);
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | null>(null);
  const [campaignFilter, setCampaignFilter] = useState('');
  // Set only via the overdue/upcoming strip below — switches List view to
  // an open-ended range (independent of currentDate) instead of the usual
  // current-month window, so overdue work from any past month is actually
  // reachable. Cleared by any manual view/nav interaction.
  const [listFocus, setListFocus] = useState<'overdue' | 'upcoming' | null>(null);

  const range = useMemo(() => {
    if (listFocus === 'overdue') {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start: new Date(0), end };
    }
    if (listFocus === 'upcoming') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 2);
      return { start, end };
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      return { start, end: endOfWeek(start) };
    }
    if (viewMode === 'list') {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
    return monthGridRange(currentDate);
  }, [viewMode, currentDate, listFocus]);

  const rawEvents = useMemo(
    () =>
      getMarketingEvents({
        tasks,
        campaigns,
        fundingRecords,
        matchesSelectedEntity,
        rangeStart: range.start,
        rangeEnd: range.end,
        includeCompleted: true,
        includeCampaignMarkers: true,
      }),
    [tasks, campaigns, fundingRecords, matchesSelectedEntity, range]
  );

  // Campaign-linked activity routes into that campaign's Calendar tab —
  // milestones and campaign-linked tasks/sends alike, so there's one
  // consistent destination for anything tied to a campaign, per the
  // approved click-behaviour mapping. A standalone task opens the existing
  // Task Detail drawer. A funding deadline goes to the Funding screen.
  // Campaign start/end markers land on that campaign's Overview.
  const getEventClickHandler = (e: MarketingEvent): (() => void) | undefined => {
    if (e.kind === 'funding') return () => onNavigate?.('funding');
    if (e.kind === 'campaign-start' || e.kind === 'campaign-end') {
      return e.campaignId ? () => selectCampaign(e.campaignId!) : undefined;
    }
    if (e.kind === 'milestone') {
      return e.campaignId ? () => selectCampaign(e.campaignId!, 'calendar') : undefined;
    }
    // task / email
    if (e.campaignId) return () => selectCampaign(e.campaignId!, 'calendar');
    if (e.taskId) return () => selectTask(e.taskId!);
    return undefined;
  };

  const items = useMemo<CalendarActivityItem[]>(() => {
    let mapped = rawEvents.map((e) => ({ ...e, onClick: getEventClickHandler(e) }));
    // A specific campaign selected: only items genuinely linked to it
    // (task/email, milestone, campaign-start/end all carry campaignId).
    // Standalone tasks and funding deadlines have no campaignId, so they
    // naturally drop out here and only ever show under "All Campaigns" —
    // no inferred relationship, just the real link or its absence.
    if (campaignFilter) mapped = mapped.filter((i) => i.campaignId === campaignFilter);
    // Reached only via the overdue/upcoming strip: narrow to exactly what
    // that count measured — native tasks/emails, incomplete, on the
    // matching side of "now" — so the list a click lands on always matches
    // the number that was clicked.
    if (listFocus) {
      const now = new Date();
      mapped = mapped.filter((i) => (i.kind === 'task' || i.kind === 'email') && !i.completed && (listFocus === 'overdue' ? i.date < now : i.date >= now));
    }
    return mapped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEvents, campaignFilter, listFocus]);

  // Same entities[]-with-brand-fallback convention as CampaignDetailScreen
  // — c.brand alone missed a multi-entity campaign (e.g. Q3 Education)
  // whenever a non-primary entity was selected. Feeds both the campaign
  // filter dropdown and the "active campaigns" badge row below.
  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => (c.entities && c.entities.length > 0 ? c.entities : [c.brand]).some((entity) => matchesSelectedEntity(entity))),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Overdue/upcoming counts — deliberately computed straight from `tasks`,
  // not from `items`, so they stay accurate regardless of which month/week
  // is currently displayed (see the Content & Calendar audit's "Nothing
  // scheduled while Q3 Education has 4 overdue tasks" finding). Native
  // tasks only — campaign milestones have no "overdue" concept in the data
  // model (schedule items carry a workflow status, not a deadline vs. now
  // comparison), so they are never folded into this count.
  const overdueUpcomingCounts = useMemo(() => {
    const now = new Date();
    const relevant = tasks.filter((t) => {
      if (!matchesSelectedEntity(t.brand)) return false;
      if (!t.deadline) return false;
      if (t.status === 'complete') return false;
      if (campaignFilter && t.campaignId !== campaignFilter) return false;
      // Same orphaned-campaign exclusion as the items pipeline above — a
      // task naming an archived/missing campaign is never one of the
      // counted items, so clicking the count always lands on a list of
      // exactly that size.
      if (t.campaignId && !campaigns.some((c) => c.id === t.campaignId)) return false;
      return true;
    });
    let overdue = 0;
    let upcoming = 0;
    for (const t of relevant) {
      if (new Date(t.deadline!) < now) overdue += 1;
      else upcoming += 1;
    }
    return { overdue, upcoming };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, campaigns, selectedEntity, campaignFilter]);

  // Same "sends this month" summary the old screen had, now entity-aware.
  // Cost is only included when a genuine, non-zero cost exists across the
  // month's sends — most seeded sends have no real cost recorded, and a
  // flat "£0.00" read as a real (and wrong) figure rather than "unknown".
  const sendsSummary = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const sends = tasks.filter(
      (t) => t.type === 'email-send' && t.status === 'complete' && matchesSelectedEntity(t.brand) && t.deadline && new Date(t.deadline) >= monthStart && new Date(t.deadline) <= monthEnd
    );
    if (sends.length === 0) return null;
    const recipients = sends.reduce((sum, t) => sum + (t.recipients || 0), 0);
    const cost = sends.reduce((sum, t) => sum + (t.cost || 0), 0);
    return { count: sends.length, recipients, cost: cost > 0 ? cost : null };
  }, [tasks, matchesSelectedEntity, currentDate]);

  const goPrev = () => {
    setListFocus(null);
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    setListFocus(null);
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };
  const goToday = () => {
    setListFocus(null);
    setCurrentDate(new Date());
  };

  const navLabel = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(start);
      const sameMonth = start.getMonth() === end.getMonth();
      return sameMonth
        ? `${start.getDate()}–${end.getDate()} ${getMonthName(start.getMonth())} ${start.getFullYear()}`
        : `${formatDateShort(start)} – ${formatDateShort(end)}`;
    }
    return `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
  }, [viewMode, currentDate]);

  const emptyLabel = listFocus
    ? `No ${listFocus} tasks.`
    : isGroupView
      ? `No marketing activity scheduled for this ${viewMode === 'week' ? 'week' : 'month'}.`
      : `No marketing activity scheduled for ${ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity} this ${viewMode === 'week' ? 'week' : 'month'}.`;

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Content &amp; Calendar</h1>
            <p className="text-text-secondary text-sm mt-1">
              {isGroupView ? 'Marketing activity across all entities' : `Showing ${ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity}`}
            </p>
          </div>
          <button
            onClick={() => {
              setAddModalDate(new Date(currentDate));
              setShowAddModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>

        {/* Consolidated planning toolbar — nav, overdue/upcoming (kept
            independent of whichever month/week is displayed, so overdue
            work is never silently out of view — see the Content &
            Calendar audit), campaign filter, and view switcher all in one
            compact row. The separate campaign badge row was removed: the
            dropdown here now does that filtering job, so the badges were
            pure duplication. */}
        <div className="v2-cal-toolbar">
          <div className="v2-cal-toolbar-group">
            <div className="v2-cal-nav">
              <button className="v2-cal-nav-btn" onClick={goPrev} title="Previous">
                <ChevronLeft size={16} />
              </button>
              <span className="v2-cal-nav-label">{navLabel}</span>
              <button className="v2-cal-nav-btn" onClick={goNext} title="Next">
                <ChevronRight size={16} />
              </button>
              <button className="btn btn-secondary text-sm" onClick={goToday} style={{ marginLeft: 4 }}>
                Today
              </button>
            </div>

            <div className="v2-cal-summary-strip">
              {overdueUpcomingCounts.overdue > 0 ? (
                <button
                  className="v2-cal-summary-link"
                  data-severity="red"
                  onClick={() => {
                    setViewMode('list');
                    setListFocus('overdue');
                  }}
                >
                  {overdueUpcomingCounts.overdue} overdue
                </button>
              ) : (
                <span className="v2-cal-summary-static">0 overdue</span>
              )}
              <span className="v2-cal-summary-dot">·</span>
              {overdueUpcomingCounts.upcoming > 0 ? (
                <button
                  className="v2-cal-summary-link"
                  onClick={() => {
                    setViewMode('list');
                    setListFocus('upcoming');
                  }}
                >
                  {overdueUpcomingCounts.upcoming} upcoming
                </button>
              ) : (
                <span className="v2-cal-summary-static">0 upcoming</span>
              )}
            </div>
          </div>

          <div className="v2-cal-toolbar-group">
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="input text-sm"
              style={{ maxWidth: 200 }}
            >
              <option value="">All Campaigns</option>
              {entityCampaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <div className="v2-cal-view-tabs">
              {(['month', 'week', 'list'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  className="v2-cal-view-tab"
                  data-active={viewMode === mode}
                  onClick={() => {
                    setListFocus(null);
                    setViewMode(mode);
                  }}
                >
                  {mode === 'month' ? 'Month' : mode === 'week' ? 'Week' : 'List'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: viewMode === 'list' ? '1.5rem' : '1rem' }}>
          {viewMode === 'month' && <CalendarMonthView currentDate={currentDate} items={items} onDayClick={(d) => { setAddModalDate(d); setShowAddModal(true); }} />}
          {viewMode === 'week' && <CalendarWeekView weekStart={startOfWeek(currentDate)} items={items} />}
          {viewMode === 'list' && <CalendarListView items={items} emptyLabel={emptyLabel} />}
        </div>

        {sendsSummary && (
          <p className="text-xs text-text-secondary mt-4">
            {sendsSummary.count} email send{sendsSummary.count === 1 ? '' : 's'} completed this month · {sendsSummary.recipients.toLocaleString()} recipients
            {sendsSummary.cost !== null && <> · £{sendsSummary.cost.toFixed(2)}</>}
          </p>
        )}
      </div>

      {showAddModal && <AddActivityModal defaultDate={addModalDate} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
