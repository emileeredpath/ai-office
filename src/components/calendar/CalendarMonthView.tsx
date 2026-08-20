import type { CalendarActivityItem } from '@/components/calendar/types';
import { EVENT_KIND_COLOR } from '@/utils/marketingEventStyle';
import { isSameDay, isToday } from '@/utils/dateUtils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_ITEMS_PER_DAY = 4;

interface CalendarMonthViewProps {
  currentDate: Date;
  items: CalendarActivityItem[];
  onDayClick?: (date: Date) => void;
}

export function CalendarMonthView({ currentDate, items, onDayClick }: CalendarMonthViewProps) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  return (
    <div className="v2-cal-grid">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="v2-cal-weekday">{label}</div>
      ))}
      {days.map((day) => {
        const inMonth = day.getMonth() === currentDate.getMonth();
        const dayItems = items.filter((item) => isSameDay(item.date, day));
        return (
          <div
            key={day.toISOString()}
            className="v2-cal-day"
            data-in-month={inMonth}
            data-today={isToday(day)}
            onClick={() => inMonth && onDayClick?.(day)}
            style={{ cursor: inMonth && onDayClick ? 'pointer' : undefined }}
          >
            <div className="v2-cal-day-number">{day.getDate()}</div>
            {dayItems.slice(0, MAX_ITEMS_PER_DAY).map((item) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick?.();
                }}
                className="v2-cal-item"
                data-clickable={!!item.onClick}
                data-completed={!!item.completed}
                title={item.title}
                style={{ backgroundColor: `${item.colour || EVENT_KIND_COLOR[item.kind]}18` }}
              >
                <span className="v2-cal-item-dot" style={{ backgroundColor: item.colour || EVENT_KIND_COLOR[item.kind] }} />
                <span className="v2-cal-item-title" style={{ color: item.colour || EVENT_KIND_COLOR[item.kind] }}>
                  {item.title}
                </span>
              </button>
            ))}
            {dayItems.length > MAX_ITEMS_PER_DAY && (
              <div className="v2-cal-day-more">+{dayItems.length - MAX_ITEMS_PER_DAY} more</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
