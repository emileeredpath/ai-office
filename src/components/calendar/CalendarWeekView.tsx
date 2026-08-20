import type { CalendarActivityItem } from '@/components/calendar/types';
import { EVENT_KIND_COLOR, EVENT_KIND_LABEL, EVENT_KIND_ICON } from '@/utils/marketingEventStyle';
import { isSameDay, isToday } from '@/utils/dateUtils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarWeekViewProps {
  weekStart: Date;
  items: CalendarActivityItem[];
  onDayClick?: (date: Date) => void;
}

// Same underlying events as Month, just one week wide so each day gets far
// more room — full titles, category label, and (for sends) the subtitle
// instead of a truncated one-line chip.
export function CalendarWeekView({ weekStart, items, onDayClick }: CalendarWeekViewProps) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }

  return (
    <div className="v2-cal-grid v2-cal-week-grid">
      {days.map((day, i) => (
        <div key={`h-${i}`} className="v2-cal-weekday">
          {WEEKDAY_LABELS[day.getDay()]} {day.getDate()}
        </div>
      ))}
      {days.map((day) => {
        const dayItems = items.filter((item) => isSameDay(item.date, day));
        return (
          <div
            key={day.toISOString()}
            className="v2-cal-day"
            data-today={isToday(day)}
            onClick={() => onDayClick?.(day)}
            style={{ cursor: onDayClick ? 'pointer' : undefined }}
          >
            {dayItems.length === 0 ? (
              <div className="text-xs text-text-secondary" style={{ opacity: 0.6, marginTop: 8 }}>No activity</div>
            ) : (
              dayItems.map((item) => {
                const Icon = EVENT_KIND_ICON[item.kind];
                const color = item.colour || EVENT_KIND_COLOR[item.kind];
                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onClick?.();
                    }}
                    className="v2-cal-list-item"
                    data-clickable={!!item.onClick}
                    style={{ marginBottom: 4 }}
                  >
                    <span className="v2-cal-list-item-icon" style={{ backgroundColor: `${color}18` }}>
                      <Icon size={13} color={color} />
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
                      {item.subtitle && <div className="text-xs text-text-secondary">{item.subtitle}</div>}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
