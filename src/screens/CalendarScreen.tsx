import { useState } from 'react';
import { ChevronLeft, ChevronRight, Mail, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { Task } from '@/types/index';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
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
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const selectTask = useAppStore((s) => s.selectTask);

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

  // Show every task/send with a deadline on this day, whether complete or not —
  // a completed send is the whole point of a send calendar, so it must stay visible.
  const getTasksForDate = (day: number): Task[] => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), date));
  };

  const today = new Date();
  const todayInThisMonth =
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth()
      ? today.getDate()
      : null;

  const getActiveCampaigns = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return campaigns.filter(
      (c) => new Date(c.startDate) <= monthEnd && new Date(c.endDate) >= monthStart,
    );
  };

  // Toned down per the brief: campaigns no longer paint every day they span —
  // the name only appears on the day the campaign actually starts.
  const getCampaignsStartingOnDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return campaigns.filter((c) => isSameDay(new Date(c.startDate), date));
  };

  // Monthly sends summary — completed email-sends with a deadline in the visible month.
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const sendsThisMonth = tasks.filter(
    (t) =>
      t.type === 'email-send' &&
      t.status === 'complete' &&
      t.deadline &&
      new Date(t.deadline) >= monthStart &&
      new Date(t.deadline) <= monthEnd,
  );
  const totalRecipients = sendsThisMonth.reduce((sum, t) => sum + (t.recipients || 0), 0);
  const totalCost = sendsThisMonth.reduce((sum, t) => sum + (t.cost || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-text-primary">Calendar</h1>
        </div>
        {sendsThisMonth.length > 0 && (
          <p className="text-sm text-text-secondary mb-6">
            {getMonthName(currentDate.getMonth())}: {sendsThisMonth.length} send
            {sendsThisMonth.length === 1 ? '' : 's'} · {totalRecipients.toLocaleString()} recipients
            {totalCost > 0 && <> · £{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
          </p>
        )}

        {/* Campaign Timeline */}
        {getActiveCampaigns().length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-3 px-1">Active Campaigns</h3>
            <div className="space-y-2">
              {getActiveCampaigns().map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => selectCampaign(campaign.id)}
                  className="flex items-center gap-2 px-2 py-1 w-full text-left"
                >
                  <BrandBadge brand={campaign.brand} />
                  <span className="text-sm text-text-primary flex-1">{campaign.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                className="p-3 min-h-[112px] bg-surface border border-border"
              ></div>
            ))}

            {/* Days with tasks */}
            {daysArray.map((day) => {
              const dayTasks = getTasksForDate(day);
              const startingCampaigns = getCampaignsStartingOnDay(day);
              const isToday = todayInThisMonth === day;

              return (
                <div
                  key={day}
                  className={`p-3 min-h-[112px] border border-border ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`font-semibold mb-1.5 ${isToday ? 'text-accent' : 'text-text-primary'}`}>
                    {day}
                  </div>

                  {/* Campaign start markers — name only appears on the day it kicks off */}
                  {startingCampaigns.length > 0 && (
                    <div className="flex flex-col gap-1 mb-1.5">
                      {startingCampaigns.map((campaign) => (
                        <button
                          key={campaign.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCampaign(campaign.id);
                          }}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate text-left"
                          style={{
                            backgroundColor: `${campaign.colour}1A`,
                            color: campaign.colour,
                            border: `1px solid ${campaign.colour}40`,
                          }}
                          title={`${campaign.name} starts today`}
                        >
                          ▶ {campaign.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    {dayTasks.slice(0, 5).map((task) => {
                      const color = BRAND_COLOR[task.brand];
                      const completed = task.status === 'complete';
                      const isSend = task.type === 'email-send';

                      return (
                        <button
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectTask(task.id);
                          }}
                          className="text-xs p-1 rounded truncate w-full text-left flex items-center gap-1"
                          style={{
                            backgroundColor: `${color}1A`,
                            borderLeft: `2px solid ${color}`,
                            opacity: completed && !isSend ? 0.6 : 1,
                          }}
                          title={
                            isSend
                              ? `${BRAND_LABEL[task.brand]} · ${(task.recipients || 0).toLocaleString()} recipients${
                                  task.cost != null ? ` · £${task.cost.toFixed(2)}` : ''
                                }`
                              : task.title
                          }
                        >
                          {isSend && <Mail size={10} style={{ flexShrink: 0, color }} />}
                          <span
                            className="truncate"
                            style={{
                              color,
                              textDecoration: completed && !isSend ? 'line-through' : 'none',
                            }}
                          >
                            {isSend
                              ? `${BRAND_LABEL[task.brand]} · ${(task.recipients || 0).toLocaleString()}${
                                  task.cost != null ? ` · £${task.cost.toFixed(2)}` : ''
                                }`
                              : task.title}
                          </span>
                          {completed && <Check size={10} style={{ flexShrink: 0, color, marginLeft: 'auto' }} />}
                        </button>
                      );
                    })}
                    {dayTasks.length > 5 && (
                      <div className="text-xs text-text-secondary">+{dayTasks.length - 5} more</div>
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
