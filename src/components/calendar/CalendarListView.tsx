import type { CalendarActivityItem } from '@/components/calendar/types';
import { EVENT_KIND_COLOR, EVENT_KIND_LABEL, EVENT_KIND_ICON } from '@/utils/marketingEventStyle';
import { getMonthName } from '@/utils/dateUtils';

interface CalendarListViewProps {
  items: CalendarActivityItem[];
  emptyLabel: string;
}

// A clean chronological marketing schedule — deliberately not another
// version of My Tasks: no status workflow, no priority sorting, just what's
// happening and when, grouped by day.
export function CalendarListView({ items, emptyLabel }: CalendarListViewProps) {
  if (items.length === 0) {
    return <p className="v2-cal-empty-state">{emptyLabel}</p>;
  }

  const groups: { key: string; date: Date; items: CalendarActivityItem[] }[] = [];
  for (const item of items) {
    const key = item.date.toDateString();
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, date: item.date, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  return (
    <div className="v2-cal-list">
      {groups.map((group) => (
        <div key={group.key} className="v2-cal-list-group">
          <div className="v2-cal-list-date">
            <div className="v2-cal-list-date-day">{group.date.getDate()}</div>
            <div className="v2-cal-list-date-month">{getMonthName(group.date.getMonth()).slice(0, 3)}</div>
          </div>
          <div className="v2-cal-list-items">
            {group.items.map((item) => {
              const Icon = EVENT_KIND_ICON[item.kind];
              const color = item.colour || EVENT_KIND_COLOR[item.kind];
              return (
                <button
                  key={item.id}
                  onClick={() => item.onClick?.()}
                  className="v2-cal-list-item"
                  data-clickable={!!item.onClick}
                >
                  <span className="v2-cal-list-item-icon" style={{ backgroundColor: `${color}18` }}>
                    <Icon size={14} color={color} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <div className="text-xs font-semibold" style={{ color, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {EVENT_KIND_LABEL[item.kind]}
                    </div>
                    <div
                      className="text-sm font-medium text-text-primary"
                      style={{ textDecoration: item.completed ? 'line-through' : undefined, opacity: item.completed ? 0.65 : 1 }}
                    >
                      {item.title}
                    </div>
                    {(item.subtitle || item.campaignName) && (
                      <div className="text-xs text-text-secondary">{item.subtitle || item.campaignName}</div>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
