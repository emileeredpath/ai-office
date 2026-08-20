import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { BrandBadge } from '@/components/common/BrandBadge';
import { AddActivityModal } from '@/components/calendar/AddActivityModal';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarListView } from '@/components/calendar/CalendarListView';
import type { CalendarActivityItem } from '@/components/calendar/types';
import { getMarketingEvents, type MarketingEvent } from '@/utils/marketingEvents';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';
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

  const range = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      return { start, end: endOfWeek(start) };
    }
    if (viewMode === 'list') {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
    return monthGridRange(currentDate);
  }, [viewMode, currentDate]);

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

  const items = useMemo<CalendarActivityItem[]>(
    () => rawEvents.map((e) => ({ ...e, onClick: getEventClickHandler(e) })),
    [rawEvents] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const entityCampaigns = useMemo(() => campaigns.filter((c) => matchesSelectedEntity(c.brand)), [campaigns, selectedEntity]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCampaignsInRange = useMemo(
    () => entityCampaigns.filter((c) => c.status === 'active' && c.startDate <= range.end && c.endDate >= range.start).slice(0, 6),
    [entityCampaigns, range]
  );

  // Same "sends this month" summary the old screen had, now entity-aware.
  const sendsSummary = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const sends = tasks.filter(
      (t) => t.type === 'email-send' && t.status === 'complete' && matchesSelectedEntity(t.brand) && t.deadline && new Date(t.deadline) >= monthStart && new Date(t.deadline) <= monthEnd
    );
    if (sends.length === 0) return null;
    const recipients = sends.reduce((sum, t) => sum + (t.recipients || 0), 0);
    const cost = sends.reduce((sum, t) => sum + (t.cost || 0), 0);
    return { count: sends.length, recipients, cost };
  }, [tasks, matchesSelectedEntity, currentDate]);

  const goPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

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

  const emptyLabel = isGroupView
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
            Add Activity
          </button>
        </div>

        <div className="v2-cal-toolbar">
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

          <div className="v2-cal-view-tabs">
            {(['month', 'week', 'list'] as ViewMode[]).map((mode) => (
              <button key={mode} className="v2-cal-view-tab" data-active={viewMode === mode} onClick={() => setViewMode(mode)}>
                {mode === 'month' ? 'Month' : mode === 'week' ? 'Week' : 'List'}
              </button>
            ))}
          </div>
        </div>

        {activeCampaignsInRange.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {activeCampaignsInRange.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCampaign(c.id)}
                className="badge"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid var(--v2-border)', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '12px', padding: '4px 10px' }}
                title={getCampaignProgressInfo(c.status, c.startDate, c.endDate).label}
              >
                <BrandBadge brand={c.brand} />
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: viewMode === 'list' ? '1.5rem' : '1rem' }}>
          {viewMode === 'month' && <CalendarMonthView currentDate={currentDate} items={items} onDayClick={(d) => { setAddModalDate(d); setShowAddModal(true); }} />}
          {viewMode === 'week' && <CalendarWeekView weekStart={startOfWeek(currentDate)} items={items} />}
          {viewMode === 'list' && <CalendarListView items={items} emptyLabel={emptyLabel} />}
        </div>

        {sendsSummary && (
          <p className="text-xs text-text-secondary mt-4">
            {sendsSummary.count} email send{sendsSummary.count === 1 ? '' : 's'} completed this month · {sendsSummary.recipients.toLocaleString()} recipients · £{sendsSummary.cost.toFixed(2)}
          </p>
        )}
      </div>

      {showAddModal && <AddActivityModal defaultDate={addModalDate} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
