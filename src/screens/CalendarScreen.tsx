import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  isSameDay,
} from '@/utils/dateUtils';

export function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getTasksForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tasks.filter(
      (t) => t.deadline && isSameDay(new Date(t.deadline), date) && t.status !== 'complete',
    );
  };

  const today = new Date();
  const todayInThisMonth =
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth()
      ? today.getDate()
      : null;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Calendar</h1>
        </div>

        {/* Calendar */}
        <div className="card">
          {/* Month Navigation */}
          <div className="flex justify-between items-center p-6 border-b">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-surface rounded">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-text-primary">
              {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
            </h2>
            <button onClick={goToNextMonth} className="p-2 hover:bg-surface rounded">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-4 font-semibold text-center text-text-secondary">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0">
            {/* Empty days */}
            {emptyDays.map((i) => (
              <div
                key={`empty-${i}`}
                className="p-4 min-h-[100px] bg-surface border border-border"
              ></div>
            ))}

            {/* Days with tasks */}
            {daysArray.map((day) => {
              const dayTasks = getTasksForDate(day);
              const isToday = todayInThisMonth === day;

              return (
                <div
                  key={day}
                  className={`p-4 min-h-[100px] border border-border ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`font-semibold mb-2 ${isToday ? 'text-accent' : 'text-text-primary'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="text-xs p-1 rounded bg-accent bg-opacity-10 text-accent truncate"
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-text-secondary">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
