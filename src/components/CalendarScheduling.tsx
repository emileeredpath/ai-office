import { useMemo, useState } from 'react';
import { REAL_TASKS, EMPLOYEES } from '@/data/mtechEmployees';

interface Meeting {
  id: string;
  title: string;
  attendees: string[];
  date: Date;
  duration: number;
}

export function CalendarScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 'meeting-1',
      title: 'Construction Campaign Kickoff',
      attendees: ['Marketing Team', 'Project Manager'],
      date: new Date(Date.now() + 86400000),
      duration: 60,
    },
    {
      id: 'meeting-2',
      title: 'Website Refresh Review',
      attendees: ['Website Manager', 'Designer'],
      date: new Date(Date.now() + 172800000),
      duration: 30,
    },
  ]);

  const upcomingDeadlines = useMemo(() => {
    return REAL_TASKS.filter((t) => t.deadline).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, []);

  const todayTasks = useMemo(() => {
    const today = new Date();
    return REAL_TASKS.filter((t) => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return (
        deadline.getDate() === today.getDate() &&
        deadline.getMonth() === today.getMonth() &&
        deadline.getFullYear() === today.getFullYear()
      );
    });
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);
    return diffDays;
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Calendar & Deadlines
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-8">
          Upcoming meetings and task deadlines
        </p>

        <div className="grid grid-cols-3 gap-6">
          {/* Today's Tasks */}
          <div className="col-span-1 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Today
            </h2>
            {todayTasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No deadlines today</p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div key={task.id} className="p-2 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}>{task.title}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {Object.values(EMPLOYEES).find((e) => e.id === task.owner)?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Meetings */}
          <div className="col-span-1 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Upcoming Meetings
            </h2>
            <div className="space-y-3">
              {meetings.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No meetings scheduled</p>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}>{meeting.title}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {formatDate(meeting.date)} • {meeting.duration}min
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                      {meeting.attendees.join(', ')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Week Overview */}
          <div className="col-span-1 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              This Week
            </h2>
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayTasks = REAL_TASKS.filter((t) => {
                  if (!t.deadline) return false;
                  const deadline = new Date(t.deadline);
                  return (
                    deadline.getDate() === date.getDate() &&
                    deadline.getMonth() === date.getMonth() &&
                    deadline.getFullYear() === date.getFullYear()
                  );
                });

                return (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ color: dayTasks.length > 0 ? '#F97031' : 'var(--text-secondary)', fontWeight: dayTasks.length > 0 ? '600' : '400' }}>
                      {dayTasks.length} deadline{dayTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* All Deadlines */}
        <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
          <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            All Upcoming Deadlines
          </h2>
          <div className="space-y-3">
            {upcomingDeadlines.map((task) => {
              const daysUntil = getDaysUntilDeadline(task.deadline!);
              const isUrgent = daysUntil <= 3;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-lg flex items-start justify-between"
                  style={{
                    backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
                  }}
                >
                  <div className="flex-1">
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{task.title}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                      {Object.values(EMPLOYEES).find((e) => e.id === task.owner)?.name} •{' '}
                      {new Date(task.deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span
                    style={{
                      color: isUrgent ? '#EF4444' : 'var(--text-secondary)',
                      fontWeight: isUrgent ? '600' : '400',
                      fontSize: '13px',
                    }}
                  >
                    {daysUntil <= 0 ? 'OVERDUE' : `${daysUntil}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
